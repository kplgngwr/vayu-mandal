import { NextResponse } from 'next/server';
import { getBusPositions, getRoutesWithBuses, refreshBusPositions } from '@/lib/bus-service';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

/**
 * GET /api/buses
 * Returns real-time bus positions and route information
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const refresh = searchParams.get('refresh') === 'true';
        const includeRoutes = searchParams.get('routes') === 'true';

        const positions = refresh ? await refreshBusPositions() : await getBusPositions();

        const response: {
            success: boolean;
            count: number;
            lastUpdated: string;
            positions: typeof positions;
            routes?: Awaited<ReturnType<typeof getRoutesWithBuses>>;
        } = {
            success: true,
            count: positions.length,
            lastUpdated: new Date().toISOString(),
            positions,
        };

        if (includeRoutes) {
            response.routes = await getRoutesWithBuses();
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Bus API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch bus data' },
            { status: 500 }
        );
    }
}
