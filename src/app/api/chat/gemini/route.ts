import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const FALLBACK_REPLY = 'I am having trouble connecting to the AI service. Please ensure your GEMINI_API_KEY is set in .env.local. Meanwhile, here is typical guidance: when AQI > 200 keep outdoor activities light; use N95 masks in peak hours; run HEPA purifiers indoors.';

async function callGemini(
  apiKey: string,
  modelName: string,
  contents: any[],
  maxAttempts: number = 3
): Promise<{ success: boolean; text?: string; error?: string }> {
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelName.replace('models/', '') });
  const genConfig = { temperature: 0.7, maxOutputTokens: 2048 } as const;
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await model.generateContent({ contents, generationConfig: genConfig, safetySettings });
      const text = resp?.response?.text();
      if (!text) {
        const err = 'Empty response from Gemini SDK';
        console.warn(`[Gemini attempt ${attempt}] ${err}`);
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
        else return { success: false, error: err };
      } else {
        // If the assistant appears to end mid-sentence, attempt a short continuation and append it.
        const looksTruncated = (t: string) => {
          const s = t.trim();
          if (s.length < 40) return false; // short answers ok
          // Ends with punctuation -> likely complete
          if (/[\.\!\?"'`]$/.test(s)) return false;
          // Ends with common pollutant abbreviation partially like 'PM2' (letters/numbers, no punctuation)
          if (/[A-Za-z0-9]$/.test(s)) return true;
          return false;
        };

        if (looksTruncated(text) && attempt === 1) {
          try {
            const contResp = await model.generateContent({
              contents: [...contents, { role: 'user', parts: [{ text: 'Please continue and finish the previous response, do not repeat prior text.' }] }],
              generationConfig: genConfig,
              safetySettings,
            });
            const contText = contResp?.response?.text();
            if (contText) {
              return { success: true, text: (text + ' ' + contText).trim() };
            }
          } catch (e: any) {
            console.warn('[Gemini] continuation attempt failed:', e?.message || e);
          }
        }

        return { success: true, text };
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error(`[Gemini attempt ${attempt}] SDK Exception:`, msg);
      // Retry for transient/network/5xx like errors
      const shouldRetry = attempt < maxAttempts && (!/HTTP 4\d{2}/.test(msg));
      if (shouldRetry) await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
      else return { success: false, error: msg };
    }
  }
  return { success: false, error: 'Exceeded retries' };
}

export async function POST(req: Request) {
  try {
    // Get API key from env
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Chat] No GEMINI_API_KEY found in environment');
      return NextResponse.json(
        { success: true, reply: FALLBACK_REPLY },
        { status: 200 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { messages, context } = body as {
      messages: Array<{ role: 'user' | 'model'; content: string }>;
      context?: Record<string, any>;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Build system preamble with context
    const stationId = context?.stationId || 'MHXY_001';
    const range = context?.range || '1h';
    const weather = context?.weather || {};
    const latest = context?.latest || {};

    const weatherSummary = [
      weather?.condition ? `Condition: ${weather.condition}` : undefined,
      weather?.temperature ? `Temp: ${weather.temperature}°C` : undefined,
      weather?.humidity ? `Humidity: ${weather.humidity}%` : undefined,
      weather?.wind ? `Wind: ${weather.wind} km/h` : undefined,
      weather?.pressure ? `Pressure: ${weather.pressure} hPa` : undefined,
    ]
      .filter(Boolean)
      .join(', ');

    const pollutantSummary = [
      latest?.aqi !== undefined ? `AQI: ${latest.aqi}` : undefined,
      latest?.pm25 !== undefined ? `PM2.5: ${latest.pm25} µg/m³` : undefined,
      latest?.pm10 !== undefined ? `PM10: ${latest.pm10} µg/m³` : undefined,
      latest?.pm1_0 !== undefined ? `PM1.0: ${latest.pm1_0} µg/m³` : undefined,
      latest?.co !== undefined ? `CO: ${latest.co} ppm` : undefined,
      latest?.no2 !== undefined ? `NO₂: ${latest.no2} ppb` : undefined,
      latest?.o3 !== undefined ? `O₃: ${latest.o3} ppb` : undefined,
    ]
      .filter(Boolean)
      .join(', ');

    const thresholds = `AQI: 0-50 Good, 51-100 Moderate, 101-200 Unhealthy for Sensitive Groups, 201-300 Unhealthy, 301-400 Very Unhealthy, 401+ Hazardous. PM2.5: <12 good, 12-35 moderate, >35 reduce outdoor; >75 wear N95.`;

    const systemPreamble = [
      `You are "Vayu Ashtra", an expert air-quality assistant for Delhi-NCR.`,
      `Your role: provide personalized, actionable health and lifestyle recommendations based on current AQI, pollutants, and weather.`,
      `Station: ${stationId}; Range: ${range}.`,
      weatherSummary ? `Current Weather: ${weatherSummary}.` : undefined,
      pollutantSummary ? `Latest Readings: ${pollutantSummary}.` : undefined,
      `Health Thresholds: ${thresholds}`,
      `Response style: be concise (2-3 sentences max), practical, and reference specific numbers when relevant. Suggest concrete actions.`,
    ]
      .filter(Boolean)
      .join(' ');

    // Build chat history
    // SDK expects valid roles (user or model). Send the preamble as a labeled user message.
    const contents = [
      { role: 'user', parts: [{ text: `[System Prompt]
${systemPreamble}` }] },
      ...messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    ];

    // Determine models to try
    let model = process.env.NEXT_PUBLIC_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-pro';
    if (!model.startsWith('models/')) model = `models/${model}`;

    const primaryModel = model;
    const fallbackModel = 'models/gemini-2.5-flash';

    console.log(`[Chat] Trying primary model: ${primaryModel}`);

    // Try primary model
    let result = await callGemini(apiKey, primaryModel, contents, 1);

    // If primary fails, retry with fallback
    if (!result.success) {
      console.log(`[Chat] Primary failed, retrying with fallback: ${fallbackModel}`);
      result = await callGemini(apiKey, fallbackModel, contents, 2);
    }

    // If both fail, return fallback
    if (!result.success) {
      console.error(`[Chat] Both attempts failed. Error: ${result.error}`);
      return NextResponse.json(
        { success: true, reply: FALLBACK_REPLY },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, reply: result.text }, { status: 200 });
  } catch (e: any) {
    console.error('[Chat] Unexpected error:', e?.message);
    return NextResponse.json(
      { success: true, reply: FALLBACK_REPLY },
      { status: 200 }
    );
  }
}
