import type { BusRoute } from '@/types';
import { busRoutes as mockRoutes } from '@/data/mock-data';

// Cache for bus position data
let cachedPositions: { positions: BusPosition[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds for real-time tracking

export interface BusPosition {
    id: string;
    vehicleId: string;
    routeId: string;
    routeNumber: string;
    lat: number;
    lng: number;
    bearing: number;
    speed: number;
    timestamp: string;
    type: 'electric' | 'non-electric' | 'municipal';
}

/**
 * Fetch real-time bus positions from Delhi Transport Stack
 * GTFS-RT VehiclePositions endpoint
 */
export async function fetchBusPositions(): Promise<BusPosition[]> {
    try {
        // Delhi Transport Stack GTFS-RT endpoint
        // Note: This requires API key registration at otd.delhi.gov.in
        const apiKey = process.env.DELHI_TRANSPORT_API_KEY;

        if (!apiKey) {
            console.log('Delhi Transport API key not configured, using simulated data');
            return generateSimulatedPositions();
        }

        const response = await fetch(
            `https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=${apiKey}`,
            {
                headers: {
                    'Accept': 'application/x-protobuf',
                },
                next: { revalidate: 30 },
            }
        );

        if (!response.ok) {
            throw new Error(`Delhi Transport API error: ${response.status}`);
        }

        // Parse protobuf response
        // TODO: Use gtfs-realtime-bindings package to parse response.arrayBuffer()
        // For now, return simulated data since protobuf parsing needs additional setup
        return generateSimulatedPositions();
    } catch (error) {
        console.error('Failed to fetch bus positions:', error);
        return generateSimulatedPositions();
    }
}

/**
 * Generate simulated bus positions along existing routes
 */
function generateSimulatedPositions(): BusPosition[] {
    const positions: BusPosition[] = [];

    mockRoutes.forEach((route) => {
        // Generate 2-4 buses per route
        const busCount = 2 + Math.floor(Math.random() * 3);

        for (let i = 0; i < busCount; i++) {
            // Position bus along the route
            const segmentIndex = Math.floor(Math.random() * (route.coordinates.length - 1));
            const progress = Math.random();

            const [lat1, lng1] = route.coordinates[segmentIndex];
            const [lat2, lng2] = route.coordinates[segmentIndex + 1] || route.coordinates[segmentIndex];

            // Interpolate position
            const lat = lat1 + (lat2 - lat1) * progress;
            const lng = lng1 + (lng2 - lng1) * progress;

            // Calculate bearing
            const bearing = Math.atan2(lng2 - lng1, lat2 - lat1) * (180 / Math.PI);

            positions.push({
                id: `${route.id}-bus-${i}`,
                vehicleId: `DL${Math.floor(1000 + Math.random() * 9000)}`,
                routeId: route.id,
                routeNumber: route.routeNumber,
                lat,
                lng,
                bearing: (bearing + 360) % 360,
                speed: 15 + Math.random() * 25, // 15-40 km/h
                timestamp: new Date().toISOString(),
                type: route.type,
            });
        }
    });

    return positions;
}

/**
 * Get bus positions with caching
 */
export async function getBusPositions(): Promise<BusPosition[]> {
    // Check cache
    if (cachedPositions && Date.now() - cachedPositions.timestamp < CACHE_DURATION) {
        return cachedPositions.positions;
    }

    const positions = await fetchBusPositions();

    // Update cache
    cachedPositions = {
        positions,
        timestamp: Date.now(),
    };

    return positions;
}

/**
 * Get routes with real-time bus count
 */
export async function getRoutesWithBuses(): Promise<(BusRoute & { activeBuses: number })[]> {
    const positions = await getBusPositions();

    return mockRoutes.map((route) => ({
        ...route,
        activeBuses: positions.filter(p => p.routeId === route.id).length,
    }));
}

/**
 * Force refresh bus positions
 */
export async function refreshBusPositions(): Promise<BusPosition[]> {
    cachedPositions = null;
    return getBusPositions();
}
