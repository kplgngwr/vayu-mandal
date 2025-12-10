import { NextResponse } from 'next/server';
import { fetchWAQIData } from '@/lib/waqi-api';
import { getScrapedData } from '@/lib/aqi-service';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 1 minute

// CORS headers for API responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/weather
 * Returns real-time weather data from WAQI API
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        // If coordinates provided, try VisualCrossing first
        if (lat && lng) {
            const vcKey = process.env.NEXT_PUBLIC_VISUALCROSSING_API_KEY || process.env.VISUALCROSSING_API_KEY;
            if (vcKey) {
                const loc = `${lat},${lng}`;
                const url = `${process.env.NEXT_PUBLIC_VISUALCROSSING_BASE_URL || 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/'}${encodeURIComponent(loc)}?unitGroup=metric&key=${vcKey}&include=current`;
                const resp = await fetch(url, { method: 'GET' });
                if (resp.ok) {
                    const json = await resp.json();
                    const current = json?.currentConditions ?? {};
                    return NextResponse.json(
                        {
                            success: true,
                            source: 'visualcrossing',
                            temperature: Number(current.temp ?? json?.days?.[0]?.temp ?? 0),
                            humidity: Number(current.humidity ?? json?.days?.[0]?.humidity ?? 0),
                            windSpeed: Number(current.windspeed ?? json?.days?.[0]?.windspeed ?? 0),
                            pressure: Number(current.pressure ?? json?.days?.[0]?.pressure ?? 0),
                            condition: current.conditions ?? json?.days?.[0]?.conditions ?? 'unknown',
                            lastUpdated: current.datetime ?? json?.days?.[0]?.datetime ?? new Date().toISOString(),
                        },
                        { headers: corsHeaders }
                    );
                }
            }
        }
        // Try WAQI API first
        const waqiData = await fetchWAQIData();

        if (waqiData) {
            return NextResponse.json(
                {
                    success: true,
                    source: 'waqi',
                    temperature: waqiData.temperature,
                    humidity: waqiData.humidity,
                    windSpeed: waqiData.windSpeed,
                    pressure: waqiData.pressure,
                    lastUpdated: waqiData.lastUpdated,
                },
                { headers: corsHeaders }
            );
        }

        // Fallback to scraped data
        const scrapedData = await getScrapedData();

        if (scrapedData) {
            return NextResponse.json(
                {
                    success: true,
                    source: 'scraped',
                    temperature: scrapedData.temperature,
                    humidity: scrapedData.humidity,
                    windSpeed: scrapedData.windSpeed,
                    lastUpdated: scrapedData.lastUpdated,
                },
                { headers: corsHeaders }
            );
        }

        // Fallback to static data
        return NextResponse.json(
            {
                success: true,
                source: 'fallback',
                temperature: 20,
                humidity: 50,
                windSpeed: 5,
                lastUpdated: new Date().toISOString(),
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error('Weather API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch weather data',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}
