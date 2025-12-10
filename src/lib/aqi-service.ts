import type { AQIStation } from '@/types';
import { aqiStations as mockStations } from '@/data/mock-data';
import { scrapeAQIIn, type AQIScrapedData } from './aqi-scraper';
import { fetchWAQIData, convertWAQIToStations, type WAQIResponse } from './waqi-api';

// Cache for AQI data
let cachedData: { stations: AQIStation[]; scrapedData: AQIScrapedData | null; waqiData: WAQIResponse | null; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache for real-time updates


interface CPCBStation {
    station: string;
    city: string;
    state: string;
    pollutant_avg?: number;
    pollutant_id?: string;
    last_update?: string;
    latitude?: number;
    longitude?: number;
}

/**
 * Fetch AQI data from CPCB Open Data API
 */
export async function fetchCPCBData(): Promise<CPCBStation[]> {
    const apiKey = process.env.CPCB_API_KEY;

    if (!apiKey) {
        console.warn('CPCB_API_KEY not configured, using fallback data');
        return [];
    }

    try {
        const response = await fetch(
            `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${apiKey}&format=json&filters[state]=Delhi&limit=50`,
            { next: { revalidate: 300 } }
        );

        if (!response.ok) {
            throw new Error(`CPCB API error: ${response.status}`);
        }

        const data = await response.json();
        return data.records || [];
    } catch (error) {
        console.error('Failed to fetch CPCB data:', error);
        return [];
    }
}

/**
 * Get AQI status based on value
 */
function getAqiStatus(aqi: number): AQIStation['status'] {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'poor';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'severe';
    return 'hazardous';
}

/**
 * Normalize CPCB data to our station format
 */
function normalizeCPCBStation(station: CPCBStation, index: number): AQIStation | null {
    if (!station.latitude || !station.longitude) {
        return null;
    }

    const aqi = station.pollutant_avg || Math.round(150 + Math.random() * 150);

    return {
        id: `cpcb-${index}`,
        name: station.station,
        location: `${station.city}, ${station.state}`,
        lat: station.latitude,
        lng: station.longitude,
        aqi,
        status: getAqiStatus(aqi),
        pollutants: {
            pm25: Math.round(aqi * 0.6),
            pm10: Math.round(aqi * 1.1),
            co: 1.5,
            no2: 45,
            so2: 15,
            o3: 30,
        },
        lastUpdated: station.last_update || new Date().toISOString(),
        type: 'government',
    };
}

/**
 * Create stations from scraped aqi.in data
 */
function createStationsFromScrapedData(scrapedData: AQIScrapedData): AQIStation[] {
    const stations: AQIStation[] = [];

    // Add main Delhi station with scraped data
    stations.push({
        id: 'scraped-delhi',
        name: 'Delhi Average',
        location: 'New Delhi, India',
        lat: 28.6139,
        lng: 77.2090,
        aqi: scrapedData.delhiAqi,
        status: getAqiStatus(scrapedData.delhiAqi),
        pollutants: {
            pm25: scrapedData.pm25,
            pm10: scrapedData.pm10,
            co: 1.5,
            no2: 45,
            so2: 15,
            o3: 30,
        },
        lastUpdated: scrapedData.lastUpdated,
        type: 'government',
    });

    // Add cities from scraped data
    scrapedData.cities.forEach((city, index) => {
        if (city.aqi > 0) {
            stations.push({
                id: `scraped-${index}`,
                name: city.name,
                location: `${city.name}, Delhi NCR`,
                lat: 28.6 + (Math.random() - 0.5) * 0.3,
                lng: 77.2 + (Math.random() - 0.5) * 0.3,
                aqi: city.aqi,
                status: getAqiStatus(city.aqi),
                pollutants: {
                    pm25: city.pm25 || Math.round(city.aqi * 0.7),
                    pm10: city.pm10 || Math.round(city.aqi * 1.1),
                    co: 1.5,
                    no2: 45,
                    so2: 15,
                    o3: 30,
                },
                lastUpdated: scrapedData.lastUpdated,
                type: 'government',
            });
        }
    });

    return stations;
}

/**
 * Get combined AQI data from all sources
 * Priority: WAQI API > Scraped aqi.in > CPCB > Mock Data
 */
export async function getAQIData(): Promise<AQIStation[]> {
    // Check cache
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        return cachedData.stations;
    }

    try {
        // Try WAQI API first (fastest and most reliable)
        console.log('Attempting to fetch from WAQI API...');
        const waqiData = await fetchWAQIData();

        if (waqiData && waqiData.aqi > 0) {
            console.log(`WAQI API: Delhi AQI = ${waqiData.aqi}`);
            const waqiStations = convertWAQIToStations(waqiData);

            // Supplement with mock stations for additional coverage
            const waqiNames = new Set(waqiStations.map(s => s.name.toLowerCase()));
            const updatedMock = mockStations
                .filter(s => !waqiNames.has(s.name.toLowerCase()))
                .map(station => {
                    // Adjust mock AQI to be relative to real Delhi AQI
                    const variance = (Math.random() - 0.5) * 80;
                    const adjustedAqi = Math.max(50, Math.min(500, waqiData.aqi + variance));
                    return {
                        ...station,
                        aqi: Math.round(adjustedAqi),
                        status: getAqiStatus(Math.round(adjustedAqi)),
                        pollutants: {
                            ...station.pollutants,
                            pm25: Math.round(adjustedAqi * 0.7),
                            pm10: Math.round(adjustedAqi * 1.1),
                        },
                        lastUpdated: new Date().toISOString(),
                    };
                });

            const combinedStations = [...waqiStations, ...updatedMock];

            // Update cache
            cachedData = {
                stations: combinedStations,
                scrapedData: null,
                waqiData,
                timestamp: Date.now(),
            };

            console.log(`Total stations: ${combinedStations.length} (WAQI: ${waqiStations.length}, Mock: ${updatedMock.length})`);
            return combinedStations;
        }

        // Fallback: Try to scrape aqi.in
        console.log('WAQI API failed, falling back to scraper...');
        const scrapedData = await scrapeAQIIn();

        let scrapedStations: AQIStation[] = [];
        if (scrapedData && scrapedData.delhiAqi > 0) {
            console.log(`Scraped Delhi AQI: ${scrapedData.delhiAqi}`);
            scrapedStations = createStationsFromScrapedData(scrapedData);
        }

        // Also fetch CPCB data
        const cpcbData = await fetchCPCBData();
        const cpcbStations = cpcbData
            .map((s, i) => normalizeCPCBStation(s, i))
            .filter((s): s is AQIStation => s !== null);

        // Combine stations
        const allStations = [...scrapedStations];

        // Add CPCB stations that aren't duplicates
        const existingNames = new Set(scrapedStations.map(s => s.name.toLowerCase()));
        for (const cpcbStation of cpcbStations) {
            if (!existingNames.has(cpcbStation.name.toLowerCase())) {
                allStations.push(cpcbStation);
            }
        }

        // If we have real data, supplement with mock for additional locations
        if (allStations.length > 0) {
            const realNames = new Set(allStations.map(s => s.name.toLowerCase()));

            // Update mock stations with scraped AQI if available
            const updatedMock = mockStations.map(station => {
                if (scrapedData && scrapedData.delhiAqi > 0) {
                    // Adjust mock AQI to be relative to scraped Delhi AQI
                    const variance = (Math.random() - 0.5) * 100;
                    const adjustedAqi = Math.max(50, Math.min(500, scrapedData.delhiAqi + variance));
                    return {
                        ...station,
                        aqi: Math.round(adjustedAqi),
                        status: getAqiStatus(Math.round(adjustedAqi)),
                        pollutants: {
                            ...station.pollutants,
                            pm25: Math.round(adjustedAqi * 0.7),
                            pm10: Math.round(adjustedAqi * 1.1),
                        },
                        lastUpdated: new Date().toISOString(),
                    };
                }
                return station;
            }).filter(s => !realNames.has(s.name.toLowerCase()));

            const combinedStations = [...allStations, ...updatedMock];

            // Update cache
            cachedData = {
                stations: combinedStations,
                scrapedData,
                waqiData: null,
                timestamp: Date.now(),
            };

            console.log(`Total stations: ${combinedStations.length} (Scraped: ${scrapedStations.length}, CPCB: ${cpcbStations.length})`);
            return combinedStations;
        }

        // Fallback to mock data
        console.log('Falling back to mock data');
        return mockStations;
    } catch (error) {
        console.error('Error fetching AQI data:', error);
        return mockStations;
    }
}


/**
 * Force refresh AQI data (bypasses cache)
 */
export async function refreshAQIData(): Promise<AQIStation[]> {
    cachedData = null;
    return getAQIData();
}

/**
 * Get scraped data directly (for weather/additional info)
 */
export async function getScrapedData(): Promise<AQIScrapedData | null> {
    if (cachedData?.scrapedData) {
        return cachedData.scrapedData;
    }
    return scrapeAQIIn();
}

/**
 * Get average AQI across all stations
 */
export async function getAverageAQI(): Promise<{ aqi: number; pm25: number; pm10: number; status: string }> {
    const stations = await getAQIData();

    if (stations.length === 0) {
        return { aqi: 0, pm25: 0, pm10: 0, status: 'unknown' };
    }

    const totalAqi = stations.reduce((sum, s) => sum + s.aqi, 0);
    const totalPm25 = stations.reduce((sum, s) => sum + (s.pollutants.pm25 || 0), 0);
    const totalPm10 = stations.reduce((sum, s) => sum + (s.pollutants.pm10 || 0), 0);

    const avgAqi = Math.round(totalAqi / stations.length);

    return {
        aqi: avgAqi,
        pm25: Math.round(totalPm25 / stations.length),
        pm10: Math.round(totalPm10 / stations.length),
        status: getAqiStatus(avgAqi),
    };
}
