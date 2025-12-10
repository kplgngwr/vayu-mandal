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
export async function GET() {
    try {
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
