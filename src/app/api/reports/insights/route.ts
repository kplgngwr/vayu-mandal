import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Helper to call Gemini with retries and continuation support (mirrors chat route behavior)
async function callGemini(apiKey: string, modelName: string, contents: any[], maxAttempts: number = 3) {
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelName.replace('models/', '') });
  const genConfig = { temperature: 0.65, maxOutputTokens: 5000 } as const;
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
        console.warn(`[Reports Gemini attempt ${attempt}] ${err}`);
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
        else return { success: false, error: err };
      } else {
        // detect likely truncation and attempt a short continuation once
        const looksTruncated = (t: string) => {
          const s = t.trim();
          if (s.length < 60) return false;
          if (/[\.\!\?"'`]$/.test(s)) return false;
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
            if (contText) return { success: true, text: (text + ' ' + contText).trim() };
          } catch (e: any) {
            console.warn('[Reports Gemini] continuation failed:', e?.message || e);
          }
        }

        return { success: true, text };
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error(`[Reports Gemini attempt ${attempt}] SDK Exception:`, msg);
      const shouldRetry = attempt < maxAttempts && (!/HTTP 4\d{2}/.test(msg));
      if (shouldRetry) await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
      else return { success: false, error: msg };
    }
  }
  return { success: false, error: 'Exceeded retries' };
}

// In-memory cache for generated insights to reduce redundant Gemini calls
const insightCache = new Map<string, { text: string; ts: number; model?: string }>();
const DEFAULT_TTL_MS = Number(process.env.REPORTS_INSIGHT_TTL_MS || 90 * 1000);

// Simple server-side Gemini call using Generative Language API
// Expects NEXT_PUBLIC_GEMINI_API_KEY in env; for production prefer GEMINI_API_KEY.

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Gemini API key missing' }, { status: 400 });
    }

    const body = await req.json();
    const { stationId, range, summary, force } = body as {
      stationId: string;
      range: '24h' | '7d' | '30d';
      summary: { avg: number; peak: number; pm25Avg: number; pm10Avg: number; coords?: { lat: number; lng: number }; latest?: { co?: number; no2?: number; o3?: number; tvoc_ppb?: number; eco2_ppm?: number } };
      force?: boolean;
    };

    const prompt = `You are an expert air-quality advisor for Delhi-NCR.
User location: ${summary.coords ? `${summary.coords.lat}, ${summary.coords.lng}` : 'unknown'}
Nearest station: ${stationId}
Time range: ${range}
Stats: avg AQI ${summary.avg}, peak AQI ${summary.peak}, PM2.5 avg ${summary.pm25Avg}, PM10 avg ${summary.pm10Avg}.
Latest pollutants (optional): CO ${summary.latest?.co ?? 'n/a'}, NO2 ${summary.latest?.no2 ?? 'n/a'}, O3 ${summary.latest?.o3 ?? 'n/a'}, VOC ${summary.latest?.tvoc_ppb ?? 'n/a'} ppb, eCO2 ${summary.latest?.eco2_ppm ?? 'n/a'} ppm.
Provide clear, actionable recommendations for outdoor activities, indoor ventilation and purifier settings, mask usage, and commuting choices. Include short, prioritized bullets and cite key numbers when relevant.`;

    let model = process.env.NEXT_PUBLIC_GEMINI_MODEL || process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';

    // Build a compact cache key for this station/range/summary fingerprint
    const cacheKey = `${stationId}:${range}:${Math.round(summary.avg || 0)}:${Math.round(summary.pm25Avg || 0)}:${Math.round(summary.pm10Avg || 0)}`;
    const cached = insightCache.get(cacheKey);
    if (!force && cached && Date.now() - cached.ts < DEFAULT_TTL_MS) {
      return NextResponse.json({ success: true, insight: cached.text, cached: true, model: cached.model || model }, { status: 200 });
    }

    try {
      const contents = [{ role: 'user', parts: [{ text: `[System Prompt]\n${prompt}` }] }];
      const result = await callGemini(apiKey, model, contents, 2);
      if (!result.success) {
        const fallback = buildFallbackInsight(summary.avg, summary.peak, summary.pm25Avg, summary.pm10Avg, range);
        return NextResponse.json({ success: true, insight: fallback, cached: false, error: result.error }, { status: 200 });
      }
      const text = result.text || 'No insight available.';
      try { insightCache.set(cacheKey, { text, ts: Date.now(), model }); } catch {}
      return NextResponse.json({ success: true, insight: text, cached: false, model }, { status: 200 });
    } catch (err: any) {
      const fallback = buildFallbackInsight(summary.avg, summary.peak, summary.pm25Avg, summary.pm10Avg, range);
      return NextResponse.json({ success: true, insight: fallback, cached: false, error: err?.message }, { status: 200 });
    }
  } catch (e: any) {
    // Final fallback on unexpected errors
    const body = await req.json().catch(() => ({}));
    const summary = body?.summary ?? { avg: 0, peak: 0, pm25Avg: 0, pm10Avg: 0 };
    const range = body?.range ?? '24h';
    const fallback = buildFallbackInsight(summary.avg, summary.peak, summary.pm25Avg, summary.pm10Avg, range);
    return NextResponse.json({ success: true, insight: fallback, error: e?.message || 'Unknown error' }, { status: 200 });
  }
}

function buildFallbackInsight(avg: number, peak: number, pm25Avg: number, pm10Avg: number, range: '1h' | '6h' | '24h' | '7d' | '30d') {
  const lines: string[] = [];
  lines.push(`For ${range}, avg AQI ${Math.round(avg)}, peak ${Math.round(peak)}.`);
  if (pm25Avg > 60) lines.push('PM2.5 elevated — use purifiers indoors and reduce ventilation during peaks.');
  if (pm10Avg > 100) lines.push('PM10 high — avoid dusty routes; limit outdoor workouts.');
  if (peak > 200) lines.push('Unhealthy spikes — prefer masks in peak hours and commute off-peak.');
  if (avg <= 100) lines.push('Conditions generally moderate — outdoor activities are okay in mornings/evenings.');
  lines.push('Tip: enable nearby purifiers during local peaks to improve indoor air.');
  return lines.join('\n');
}
