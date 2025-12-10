import { NextResponse } from 'next/server';
import { getHistoricalData, DELHI_STATIONS, type StationId, type TimeRange } from '@/lib/historical-api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const range = (searchParams.get('range') || '24h') as TimeRange;
        const stationId = (searchParams.get('station') || 'delhi-main') as StationId;

        // Validate range
        if (!['24h', '7d', '30d', 'custom'].includes(range)) {
            return NextResponse.json(
                { success: false, error: 'Invalid range. Use 24h, 7d, or 30d' },
                { status: 400 }
            );
        }

        // Validate station
        const validStation = DELHI_STATIONS.find(s => s.id === stationId);
        if (!validStation) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid station',
                    validStations: DELHI_STATIONS.map(s => ({ id: s.id, name: s.name }))
                },
                { status: 400 }
            );
        }

        const result = await getHistoricalData(stationId, range);

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Historical API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
