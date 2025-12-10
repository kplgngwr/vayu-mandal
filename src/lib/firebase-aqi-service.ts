"use client";

// Ensure this module exports isFirebaseConfigured for consumers like admin/devices/page.tsx
export { isFirebaseConfigured } from './firebase';

import { ref, onValue, get, set, off, DataSnapshot } from 'firebase/database';
import { getFirebaseDatabase, isFirebaseConfigured } from './firebase';
import type { AQIStation } from '@/types';

/**
 * Firebase AQI data structure for a single station
 */
export interface FirebaseAQIData {
    // core readings
    aqi: number;
    pm25?: number;
    pm10?: number;
    co?: number;
    no2?: number;
    so2?: number;
    o3?: number;
    // optional device/metadata fields that may be provided by hardware
    deviceId?: string;
    deviceModel?: string;
    name?: string;
    location?: string;
    lat?: number;
    lng?: number;
    battery?: number;
    lastUpdated?: string;

    // extended sensor payload keys used elsewhere in the app
    eco2_ppm?: number;
    tvoc_ppb?: number;
    mq135_raw?: number;
    mq135_voltage?: number;
    mq2_ppm?: number;
    mq2_raw?: number;
    mq2_voltage?: number;
    mq7_ppm?: number;
    mq7_raw?: number;
    mq7_voltage?: number;
    sgp_eco2_ppm?: number;
    sgp_tvoc_ppb?: number;
}

/**
 * Firebase stations collection structure
 */
export interface FirebaseStationsData {
    [stationId: string]: FirebaseAQIData;
}

/**
 * Callback type for real-time updates
 */
type AQIUpdateCallback = (data: FirebaseStationsData) => void;

// Active subscriptions tracking
const activeSubscriptions: Map<string, AQIUpdateCallback> = new Map();

/**
 * Subscribe to real-time AQI data updates from Firebase
 * @param callback Function to call when data changes
 * @returns Unsubscribe function
 */
export function subscribeToAQIData(callback: AQIUpdateCallback): () => void {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, skipping subscription');
        return () => { };
    }

    const database = getFirebaseDatabase();
    if (!database) {
        console.warn('Firebase database not available');
        return () => { };
    }

    const stationsRef = ref(database, 'stations');
    const subscriptionId = `sub_${Date.now()}`;

    const handleValue = (snapshot: DataSnapshot) => {
        const data = snapshot.val() as FirebaseStationsData | null;
        if (data) {
            console.log('Firebase AQI data updated:', Object.keys(data).length, 'stations');
            callback(data);
        }
    };

    onValue(stationsRef, handleValue, (error) => {
        console.error('Firebase subscription error:', error);
    });

    activeSubscriptions.set(subscriptionId, callback);

    // Return unsubscribe function
    return () => {
        off(stationsRef, 'value', handleValue);
        activeSubscriptions.delete(subscriptionId);
        console.log('Unsubscribed from Firebase AQI data');
    };
}

/**
 * React-friendly helper: subscribe and keep latest snapshot in a callback.
 * Use inside client components to get realtime updates without manual polling.
 */
export function startRealtimeAQIStream(
    onUpdate: (data: FirebaseStationsData) => void
): () => void {
    return subscribeToAQIData(onUpdate);
}

// =====================
// Purifiers Integration
// =====================

export interface FirebasePurifier {
    airFiltered?: number;
    lastMaintenance?: string;
    status?: boolean;
}

export type FirebasePurifiersData = Record<string, FirebasePurifier>;

type PurifierUpdateCallback = (data: FirebasePurifiersData) => void;

/**
 * Subscribe to realtime purifier updates from Firebase (RTDB path: /purifiers)
 */
export function subscribeToPurifiers(callback: PurifierUpdateCallback): () => void {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, skipping purifier subscription');
        return () => {};
    }
    const database = getFirebaseDatabase();
    if (!database) return () => {};
    const purifiersRef = ref(database, 'purifiers');
    const handleValue = (snapshot: DataSnapshot) => {
        const data = snapshot.val() as FirebasePurifiersData | null;
        if (data) callback(data);
    };
    onValue(purifiersRef, handleValue, (error) => {
        console.error('Firebase purifiers subscription error:', error);
    });
    return () => {
        off(purifiersRef, 'value', handleValue);
    };
}

/**
 * One-time fetch of purifiers snapshot
 */
export async function getPurifiersFromFirebase(): Promise<FirebasePurifiersData | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getFirebaseDatabase();
    if (!database) return null;
    try {
        const purifiersRef = ref(database, 'purifiers');
        const snapshot = await get(purifiersRef);
        if (snapshot.exists()) return snapshot.val() as FirebasePurifiersData;
        return null;
    } catch (err) {
        console.error('Failed to fetch purifiers from Firebase:', err);
        return null;
    }
}

/**
 * Update a purifier's status (on/off)
 */
export async function updatePurifierStatus(id: string, status: boolean): Promise<boolean> {
    if (!isFirebaseConfigured()) return false;
    const database = getFirebaseDatabase();
    if (!database) return false;
    try {
        const purifierRef = ref(database, `purifiers/${id}/status`);
        await set(purifierRef, status);
        return true;
    } catch (err) {
        console.error('Failed to update purifier status:', err);
        return false;
    }
}

/**
 * Record a maintenance event: updates lastMaintenance to now
 */
export async function markPurifierMaintenance(id: string, dateISO?: string): Promise<boolean> {
    if (!isFirebaseConfigured()) return false;
    const database = getFirebaseDatabase();
    if (!database) return false;
    try {
        const purifierRef = ref(database, `purifiers/${id}/lastMaintenance`);
        await set(purifierRef, dateISO ?? new Date().toISOString());
        return true;
    } catch (err) {
        console.error('Failed to mark purifier maintenance:', err);
        return false;
    }
}

/**
 * Get AQI data from Firebase (one-time fetch)
 */
export async function getAQIDataFromFirebase(): Promise<FirebaseStationsData | null> {
    if (!isFirebaseConfigured()) {
        return null;
    }

    const database = getFirebaseDatabase();
    if (!database) {
        return null;
    }

    try {
        const stationsRef = ref(database, 'stations');
        const snapshot = await get(stationsRef);

        if (snapshot.exists()) {
            return snapshot.val() as FirebaseStationsData;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch Firebase AQI data:', error);
        return null;
    }
}

/**
 * Update a single station's AQI data in Firebase (for testing/admin)
 */
export async function updateStationAQI(
    stationId: string,
    data: Partial<FirebaseAQIData>
): Promise<boolean> {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured');
        return false;
    }

    const database = getFirebaseDatabase();
    if (!database) {
        return false;
    }

    try {
        const stationRef = ref(database, `stations/${stationId}`);
        await set(stationRef, {
            ...data,
            lastUpdated: new Date().toISOString(),
        });
        console.log(`Updated station ${stationId} in Firebase`);
        return true;
    } catch (error) {
        console.error('Failed to update Firebase AQI data:', error);
        return false;
    }
}

/**
 * Initialize Firebase database with sample station data
 * (For testing purposes - call this once to set up initial data)
 */
export async function initializeSampleData(stations: AQIStation[]): Promise<boolean> {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured');
        return false;
    }

    const database = getFirebaseDatabase();
    if (!database) {
        return false;
    }

    try {
        const stationsData: FirebaseStationsData = {};

        for (const station of stations) {
            stationsData[station.id] = {
                aqi: station.aqi,
                pm25: station.pollutants.pm25,
                pm10: station.pollutants.pm10,
                co: station.pollutants.co,
                no2: station.pollutants.no2,
                so2: station.pollutants.so2,
                o3: station.pollutants.o3,
                lastUpdated: station.lastUpdated,
            };
        }

        const stationsRef = ref(database, 'stations');
        await set(stationsRef, stationsData);
        console.log(`Initialized Firebase with ${stations.length} stations`);
        return true;
    } catch (error) {
        console.error('Failed to initialize Firebase data:', error);
        return false;
    }
}

/**
 * Merge Firebase data with existing station metadata
 */
export function mergeFirebaseDataWithStations(
    stations: AQIStation[],
    firebaseData: FirebaseStationsData
): AQIStation[] {
    // helper to derive status from AQI value
    const getStatus = (aqi: number): AQIStation['status'] => {
        if (aqi <= 50) return 'good';
        if (aqi <= 100) return 'moderate';
        if (aqi <= 150) return 'poor';
        if (aqi <= 200) return 'unhealthy';
        if (aqi <= 300) return 'severe';
        return 'hazardous';
    };

    // Map existing stations by id for quick lookup
    const stationMap = new Map<string, AQIStation>();
    stations.forEach(s => stationMap.set(s.id, { ...s }));

    // Apply firebase updates to existing stations and collect new ones
    Object.entries(firebaseData).forEach(([key, fb]) => {
        const existing = stationMap.get(key);

        if (existing) {
            // merge values, prefer firebase lat/lng/name/location when present
            const merged: AQIStation = {
                ...existing,
                aqi: fb.aqi,
                status: getStatus(fb.aqi),
                lat: fb.lat ?? existing.lat,
                lng: fb.lng ?? existing.lng,
                name: fb.name ?? existing.name,
                location: fb.location ?? existing.location,
                pollutants: {
                    ...existing.pollutants,
                    pm25: fb.pm25 ?? existing.pollutants.pm25,
                    pm10: fb.pm10 ?? existing.pollutants.pm10,
                    co: fb.co ?? existing.pollutants.co,
                    no2: fb.no2 ?? existing.pollutants.no2,
                    so2: fb.so2 ?? existing.pollutants.so2,
                    o3: fb.o3 ?? existing.pollutants.o3,
                    // Map extended fields if present
                    eco2_ppm: (fb as any).eco2_ppm ?? (fb as any).sgp_eco2_ppm ?? existing.pollutants.eco2_ppm,
                    tvoc_ppb: (fb as any).tvoc_ppb ?? (fb as any).sgp_tvoc_ppb ?? existing.pollutants.tvoc_ppb,
                },
                lastUpdated: fb.lastUpdated ?? existing.lastUpdated,
                device: {
                    deviceId: fb.deviceId ?? existing.device?.deviceId,
                    deviceModel: fb.deviceModel ?? existing.device?.deviceModel,
                    battery: fb.battery ?? existing.device?.battery,
                    sensorReadings: {
                        // copy any sensor fields if present
                        ...(existing.device?.sensorReadings || {}),
                        // pick known extra keys from firebase payload if present
                        ...(fb['eco2_ppm'] !== undefined ? { eco2_ppm: fb['eco2_ppm'] } : {}),
                        ...(fb['tvoc_ppb'] !== undefined ? { tvoc_ppb: fb['tvoc_ppb'] } : {}),
                        ...(fb['mq135_raw'] !== undefined ? { mq135_raw: fb['mq135_raw'] } : {}),
                        ...(fb['mq135_voltage'] !== undefined ? { mq135_voltage: fb['mq135_voltage'] } : {}),
                        ...(fb['mq2_ppm'] !== undefined ? { mq2_ppm: fb['mq2_ppm'] } : {}),
                        ...(fb['mq2_raw'] !== undefined ? { mq2_raw: fb['mq2_raw'] } : {}),
                        ...(fb['mq2_voltage'] !== undefined ? { mq2_voltage: fb['mq2_voltage'] } : {}),
                        ...(fb['mq7_ppm'] !== undefined ? { mq7_ppm: fb['mq7_ppm'] } : {}),
                        ...(fb['mq7_raw'] !== undefined ? { mq7_raw: fb['mq7_raw'] } : {}),
                        ...(fb['mq7_voltage'] !== undefined ? { mq7_voltage: fb['mq7_voltage'] } : {}),
                        ...(fb['sgp_eco2_ppm'] !== undefined ? { sgp_eco2_ppm: fb['sgp_eco2_ppm'] } : {}),
                        ...(fb['sgp_tvoc_ppb'] !== undefined ? { sgp_tvoc_ppb: fb['sgp_tvoc_ppb'] } : {}),
                    }
                },
            };

            stationMap.set(key, merged);
        } else {
            // Create a new station entry from firebase data
            const newStation: AQIStation = {
                id: key,
                name: fb.name ?? fb.deviceId ?? `Device ${key}`,
                location: fb.location ?? '',
                lat: fb.lat ?? 0,
                lng: fb.lng ?? 0,
                aqi: fb.aqi,
                status: getStatus(fb.aqi),
                pollutants: {
                    pm25: fb.pm25 ?? 0,
                    pm10: fb.pm10 ?? 0,
                    co: fb.co ?? 0,
                    no2: fb.no2 ?? 0,
                    so2: fb.so2 ?? 0,
                    o3: fb.o3 ?? 0,
                    eco2_ppm: (fb as any).eco2_ppm ?? (fb as any).sgp_eco2_ppm ?? undefined,
                    tvoc_ppb: (fb as any).tvoc_ppb ?? (fb as any).sgp_tvoc_ppb ?? undefined,
                },
                lastUpdated: fb.lastUpdated ?? new Date().toISOString(),
                type: 'pranamesh',
                device: {
                    deviceId: fb.deviceId,
                    deviceModel: fb.deviceModel,
                    battery: fb.battery,
                    sensorReadings: {
                        ...(fb['eco2_ppm'] !== undefined ? { eco2_ppm: fb['eco2_ppm'] } : {}),
                        ...(fb['tvoc_ppb'] !== undefined ? { tvoc_ppb: fb['tvoc_ppb'] } : {}),
                        ...(fb['mq135_raw'] !== undefined ? { mq135_raw: fb['mq135_raw'] } : {}),
                        ...(fb['mq135_voltage'] !== undefined ? { mq135_voltage: fb['mq135_voltage'] } : {}),
                        ...(fb['mq2_ppm'] !== undefined ? { mq2_ppm: fb['mq2_ppm'] } : {}),
                        ...(fb['mq2_raw'] !== undefined ? { mq2_raw: fb['mq2_raw'] } : {}),
                        ...(fb['mq2_voltage'] !== undefined ? { mq2_voltage: fb['mq2_voltage'] } : {}),
                        ...(fb['mq7_ppm'] !== undefined ? { mq7_ppm: fb['mq7_ppm'] } : {}),
                        ...(fb['mq7_raw'] !== undefined ? { mq7_raw: fb['mq7_raw'] } : {}),
                        ...(fb['mq7_voltage'] !== undefined ? { mq7_voltage: fb['mq7_voltage'] } : {}),
                        ...(fb['sgp_eco2_ppm'] !== undefined ? { sgp_eco2_ppm: fb['sgp_eco2_ppm'] } : {}),
                        ...(fb['sgp_tvoc_ppb'] !== undefined ? { sgp_tvoc_ppb: fb['sgp_tvoc_ppb'] } : {}),
                    }
                },
            };

            stationMap.set(key, newStation);
        }
    });

    // Preserve original order for existing stations, append new stations at end
    const result: AQIStation[] = stations.map(s => stationMap.get(s.id) as AQIStation);
    // add any stations from firebase that were not in the original list
    for (const [id, s] of stationMap.entries()) {
        if (!stations.find(st => st.id === id)) {
            result.push(s);
        }
    }

    return result;
}
