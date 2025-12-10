/**
 * WAQI (World Air Quality Index) API Client
 * Fetches real-time AQI data from api.waqi.info
 */

import type { AQIStation } from '@/types';

// Delhi station IDs on WAQI 
const DELHI_STATIONS = [
    { id: '@7030', name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { id: '@7031', name: 'Anand Vihar, Delhi', lat: 28.6469, lng: 77.3164 },
    { id: '@11354', name: 'Punjabi Bagh, Delhi', lat: 28.6683, lng: 77.1231 },
    { id: '@11348', name: 'RK Puram, Delhi', lat: 28.5651, lng: 77.1752 },
    { id: '@11349', name: 'Mandir Marg, Delhi', lat: 28.6369, lng: 77.2010 },
];

// Cache for WAQI data
let cachedWAQIData: { data: WAQIResponse | null; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache (real-time)

export interface WAQIResponse {
    aqi: number;
    pm25: number;
    pm10: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
    cityName: string;
    lastUpdated: string;
    stations: WAQIStation[];
}

interface WAQIStation {
    name: string;
    aqi: number;
    pm25: number;
    pm10: number;
    lat: number;
    lng: number;
}

interface WAQIAPIResponse {
    status: string;
    data: {
        aqi: number;
        idx: number;
        city: {
            name: string;
            geo: [number, number];
        };
        iaqi: {
            pm25?: { v: number };
            pm10?: { v: number };
            t?: { v: number };
            h?: { v: number };
            w?: { v: number };
            p?: { v: number };
            co?: { v: number };
            no2?: { v: number };
            so2?: { v: number };
            o3?: { v: number };
        };
        time: {
            iso: string;
        };
    };
}

/**
 * Get AQI status based on value (Indian AQI standard)
 */
function getAqiStatus(aqi: number): AQIStation['status'] {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 200) return 'poor';
    if (aqi <= 300) return 'unhealthy';
    if (aqi <= 400) return 'severe';
    return 'hazardous';
}

/**
 * Fetch data from a single WAQI station
 */
async function fetchStationData(stationId: string, token: string): Promise<WAQIAPIResponse | null> {
    try {
        const url = `https://api.waqi.info/feed/${stationId}/?token=${token}`;
        const response = await fetch(url, {
            next: { revalidate: 60 },
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`WAQI API error for ${stationId}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (data.status !== 'ok') {
            console.error(`WAQI API returned error for ${stationId}:`, data);
            return null;
        }

        return data as WAQIAPIResponse;
    } catch (error) {
        console.error(`Error fetching WAQI data for ${stationId}:`, error);
        return null;
    }
}

/**
 * Fetch real-time AQI data from WAQI API for Delhi
 */
export async function fetchWAQIData(): Promise<WAQIResponse | null> {
    // Check cache first
    if (cachedWAQIData && Date.now() - cachedWAQIData.timestamp < CACHE_DURATION) {
        console.log('Returning cached WAQI data');
        return cachedWAQIData.data;
    }

    const token = process.env.WAQI_API_TOKEN;
    if (!token) {
        console.warn('WAQI_API_TOKEN not configured, falling back to scraper');
        return null;
    }

    console.log('Fetching real-time data from WAQI API...');

    try {
        // Fetch primary Delhi station first
        const primaryData = await fetchStationData('@7030', token);

        if (!primaryData) {
            console.warn('Failed to fetch primary Delhi WAQI data');
            return null;
        }

        const { data } = primaryData;
        const stations: WAQIStation[] = [];

        // Add primary station
        stations.push({
            name: data.city.name || 'Delhi',
            aqi: data.aqi,
            pm25: data.iaqi.pm25?.v || Math.round(data.aqi * 0.7),
            pm10: data.iaqi.pm10?.v || Math.round(data.aqi * 1.1),
            lat: data.city.geo[0],
            lng: data.city.geo[1],
        });

        // Fetch additional Delhi stations in parallel
        const additionalPromises = DELHI_STATIONS.slice(1).map(station =>
            fetchStationData(station.id, token)
        );

        const additionalResults = await Promise.all(additionalPromises);

        additionalResults.forEach((result, index) => {
            if (result && result.data) {
                const stationConfig = DELHI_STATIONS[index + 1];
                stations.push({
                    name: result.data.city.name || stationConfig.name,
                    aqi: result.data.aqi,
                    pm25: result.data.iaqi.pm25?.v || Math.round(result.data.aqi * 0.7),
                    pm10: result.data.iaqi.pm10?.v || Math.round(result.data.aqi * 1.1),
                    lat: result.data.city.geo[0] || stationConfig.lat,
                    lng: result.data.city.geo[1] || stationConfig.lng,
                });
            }
        });

        const response: WAQIResponse = {
            aqi: data.aqi,
            pm25: data.iaqi.pm25?.v || Math.round(data.aqi * 0.7),
            pm10: data.iaqi.pm10?.v || Math.round(data.aqi * 1.1),
            temperature: data.iaqi.t?.v || 20,
            humidity: data.iaqi.h?.v || 50,
            windSpeed: data.iaqi.w?.v || 5,
            pressure: data.iaqi.p?.v || 1013,
            cityName: data.city.name || 'Delhi',
            lastUpdated: data.time.iso,
            stations,
        };

        // Cache the result
        cachedWAQIData = {
            data: response,
            timestamp: Date.now(),
        };

        console.log(`WAQI API: Delhi AQI = ${response.aqi}, PM2.5 = ${response.pm25}, PM10 = ${response.pm10}`);
        return response;
    } catch (error) {
        console.error('Error fetching WAQI data:', error);
        return null;
    }
}

/**
 * Convert WAQI data to AQI stations format
 */
export function convertWAQIToStations(waqiData: WAQIResponse): AQIStation[] {
    return waqiData.stations.map((station, index) => ({
        id: `waqi-${index}`,
        name: station.name,
        location: 'Delhi, India',
        lat: station.lat,
        lng: station.lng,
        aqi: station.aqi,
        status: getAqiStatus(station.aqi),
        pollutants: {
            pm25: station.pm25,
            pm10: station.pm10,
            co: 1.5,
            no2: 45,
            so2: 15,
            o3: 30,
        },
        lastUpdated: waqiData.lastUpdated,
        type: 'waqi' as const,
    }));
}

/**
 * Clear WAQI cache
 */
export function clearWAQICache(): void {
    cachedWAQIData = null;
}
