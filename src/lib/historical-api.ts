/**
 * Historical Data API Module
 * Handles generation and caching of historical AQI data
 * Since WAQI public API only provides real-time data, we generate
 * realistic patterns based on current readings
 */

import { fetchWAQIData, type WAQIResponse } from './waqi-api';
import type { HistoricalDataPoint } from '@/types';

// Types
export type TimeRange = '24h' | '7d' | '30d' | 'custom';

export interface HistoricalAPIResponse {
    success: boolean;
    data: HistoricalDataPoint[];
    station: string;
    range: TimeRange;
    currentAqi: number;
    lastUpdated: string;
    error?: string;
}

// Delhi station configurations
export const DELHI_STATIONS = [
    { id: 'delhi-main', name: 'Delhi', waqiId: '@7030' },
    { id: 'anand-vihar', name: 'Anand Vihar', waqiId: '@7031' },
    { id: 'punjabi-bagh', name: 'Punjabi Bagh', waqiId: '@11354' },
    { id: 'rk-puram', name: 'RK Puram', waqiId: '@11348' },
    { id: 'mandir-marg', name: 'Mandir Marg', waqiId: '@11349' },
] as const;

export type StationId = typeof DELHI_STATIONS[number]['id'];

// Cache for historical data (server-side only)
const historicalCache = new Map<string, { data: HistoricalDataPoint[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate realistic hourly pattern multipliers
 * Based on typical Delhi pollution patterns:
 * - Lower at night (2-5 AM)
 * - Peak during morning/evening rush (8-10 AM, 5-8 PM)
 */
const HOURLY_PATTERN = [
    0.75, 0.70, 0.65, 0.63, 0.68, 0.78, // 00:00 - 05:00
    0.88, 1.05, 1.18, 1.22, 1.15, 1.05, // 06:00 - 11:00
    0.95, 0.90, 0.88, 0.92, 1.00, 1.15, // 12:00 - 17:00
    1.25, 1.20, 1.10, 0.98, 0.88, 0.80, // 18:00 - 23:00
];

/**
 * Generate realistic daily pattern multipliers (for weekly view)
 * Weekends typically have lower pollution
 */
const DAILY_PATTERN: Record<string, number> = {
    'Sun': 0.85,
    'Mon': 1.05,
    'Tue': 1.08,
    'Wed': 1.02,
    'Thu': 1.05,
    'Fri': 1.12,
    'Sat': 0.90,
};

/**
 * Add realistic variation to AQI values
 */
function addVariation(baseAqi: number, maxVariation: number = 15): number {
    const variation = (Math.random() - 0.5) * 2 * maxVariation;
    return Math.max(20, Math.round(baseAqi + variation));
}

/**
 * Calculate PM values from AQI (approximate inverse of AQI calculation)
 */
function calculatePMFromAqi(aqi: number): { pm25: number; pm10: number } {
    // Approximate PM2.5 from AQI (simplified Indian AQI formula inverse)
    let pm25: number;
    if (aqi <= 50) {
        pm25 = aqi * 0.6;
    } else if (aqi <= 100) {
        pm25 = 30 + (aqi - 50) * 0.6;
    } else if (aqi <= 200) {
        pm25 = 60 + (aqi - 100) * 0.6;
    } else if (aqi <= 300) {
        pm25 = 120 + (aqi - 200) * 1.1;
    } else {
        pm25 = 230 + (aqi - 300) * 1.3;
    }

    // PM10 is typically 1.5-2x PM2.5 in Delhi
    const pm10 = pm25 * (1.5 + Math.random() * 0.5);

    return {
        pm25: Math.round(pm25),
        pm10: Math.round(pm10),
    };
}

/**
 * Generate historical data for 24 hours
 */
function generate24HourData(currentAqi: number): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now);
        timestamp.setHours(now.getHours() - i, 0, 0, 0);

        const hour = timestamp.getHours();
        const multiplier = HOURLY_PATTERN[hour];
        const baseAqi = currentAqi * multiplier;
        const aqi = addVariation(baseAqi, 20);
        const { pm25, pm10 } = calculatePMFromAqi(aqi);

        data.push({
            timestamp: timestamp.toISOString(),
            aqi,
            pm25,
            pm10,
        });
    }

    return data;
}

/**
 * Generate historical data for 7 days
 */
function generate7DayData(currentAqi: number): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
        const timestamp = new Date(now);
        timestamp.setDate(now.getDate() - i);
        timestamp.setHours(12, 0, 0, 0); // Noon for daily average

        const dayName = days[timestamp.getDay()];
        const multiplier = DAILY_PATTERN[dayName];
        const baseAqi = currentAqi * multiplier;
        const aqi = addVariation(baseAqi, 25);
        const { pm25, pm10 } = calculatePMFromAqi(aqi);

        data.push({
            timestamp: timestamp.toISOString(),
            aqi,
            pm25,
            pm10,
        });
    }

    return data;
}

/**
 * Generate historical data for 30 days
 */
function generate30DayData(currentAqi: number): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 29; i >= 0; i--) {
        const timestamp = new Date(now);
        timestamp.setDate(now.getDate() - i);
        timestamp.setHours(12, 0, 0, 0);

        const dayName = days[timestamp.getDay()];
        const dailyMultiplier = DAILY_PATTERN[dayName];

        // Add weekly trend variation (pollution can vary week to week)
        const weekMultiplier = 0.9 + Math.random() * 0.2;

        const baseAqi = currentAqi * dailyMultiplier * weekMultiplier;
        const aqi = addVariation(baseAqi, 30);
        const { pm25, pm10 } = calculatePMFromAqi(aqi);

        data.push({
            timestamp: timestamp.toISOString(),
            aqi,
            pm25,
            pm10,
        });
    }

    return data;
}

/**
 * Generate heatmap data (7 days x 24 hours)
 */
export function generateHeatmapFromCurrent(currentAqi: number) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data: { hour: number; day: string; value: number }[] = [];

    days.forEach((day) => {
        const dailyMultiplier = DAILY_PATTERN[day];

        for (let hour = 0; hour < 24; hour++) {
            const hourlyMultiplier = HOURLY_PATTERN[hour];
            const baseAqi = currentAqi * dailyMultiplier * hourlyMultiplier;
            const value = addVariation(baseAqi, 15);

            data.push({ hour, day, value });
        }
    });

    return data;
}

/**
 * Get historical data for a station and time range
 */
export async function getHistoricalData(
    stationId: StationId = 'delhi-main',
    range: TimeRange = '24h'
): Promise<HistoricalAPIResponse> {
    const cacheKey = `${stationId}-${range}`;

    // Check cache
    const cached = historicalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        const waqiData = await fetchWAQIData();
        return {
            success: true,
            data: cached.data,
            station: DELHI_STATIONS.find(s => s.id === stationId)?.name || stationId,
            range,
            currentAqi: waqiData?.aqi || 200,
            lastUpdated: new Date().toISOString(),
        };
    }

    try {
        // Fetch current WAQI data
        const waqiData = await fetchWAQIData();

        if (!waqiData) {
            // Fallback to estimated AQI if API fails
            const fallbackAqi = 200;
            const data = generateDataForRange(fallbackAqi, range);

            return {
                success: true,
                data,
                station: DELHI_STATIONS.find(s => s.id === stationId)?.name || stationId,
                range,
                currentAqi: fallbackAqi,
                lastUpdated: new Date().toISOString(),
            };
        }

        // Find station-specific AQI or use main Delhi AQI
        const stationData = waqiData.stations.find(s =>
            s.name.toLowerCase().includes(stationId.replace('-', ' '))
        );
        const currentAqi = stationData?.aqi || waqiData.aqi;

        // Generate historical data
        const data = generateDataForRange(currentAqi, range);

        // Cache the result
        historicalCache.set(cacheKey, { data, timestamp: Date.now() });

        return {
            success: true,
            data,
            station: DELHI_STATIONS.find(s => s.id === stationId)?.name || stationId,
            range,
            currentAqi,
            lastUpdated: waqiData.lastUpdated,
        };
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return {
            success: false,
            data: [],
            station: stationId,
            range,
            currentAqi: 0,
            lastUpdated: new Date().toISOString(),
            error: 'Failed to fetch data',
        };
    }
}

/**
 * Helper to generate data based on time range
 */
function generateDataForRange(currentAqi: number, range: TimeRange): HistoricalDataPoint[] {
    switch (range) {
        case '24h':
            return generate24HourData(currentAqi);
        case '7d':
            return generate7DayData(currentAqi);
        case '30d':
            return generate30DayData(currentAqi);
        default:
            return generate24HourData(currentAqi);
    }
}

/**
 * Clear historical cache
 */
export function clearHistoricalCache(): void {
    historicalCache.clear();
}
