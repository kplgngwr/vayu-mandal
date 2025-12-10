import { NextResponse } from 'next/server';
import { getAQIData, refreshAQIData } from '@/lib/aqi-service';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

// CORS headers for API responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}

/**
 * GET /api/aqi
 * Returns real-time AQI data from CPCB and other sources
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const refresh = searchParams.get('refresh') === 'true';

        const stations = refresh ? await refreshAQIData() : await getAQIData();

        return NextResponse.json(
            {
                success: true,
                count: stations.length,
                lastUpdated: new Date().toISOString(),
                stations,
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch AQI data',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500, headers: corsHeaders }
        );
    }
}
