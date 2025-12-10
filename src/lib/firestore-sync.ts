'use client';

import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import type { FirebaseStationsData, FirebaseAQIData } from './firebase-aqi-service';

// Keep simple in-memory dedup across HMR refreshes
const lastSynced: Map<string, string> = new Map();

// Normalize incoming RTDB payload into consistent reading structure
function normalizeReading(stationId: string, fb: FirebaseAQIData) {
    const dataTs = fb.lastUpdated ? new Date(fb.lastUpdated) : new Date();

    // Support alternate keys from devices
    const pm25 = (fb as any).pm25 ?? (fb as any).pm2_5 ?? undefined;
    const pm10 = (fb as any).pm10 ?? undefined;
    const pm1_0 = (fb as any).pm1_0 ?? undefined;
    const co = (fb as any).co ?? undefined;
    const no2 = (fb as any).no2 ?? undefined;
    const so2 = (fb as any).so2 ?? undefined;
    const o3 = (fb as any).o3 ?? undefined;
    const methane = (fb as any).methane ?? undefined;
    const tvoc_ppb = (fb as any).tvoc_ppb ?? (fb as any).sgp_tvoc_ppb ?? undefined;
    const eco2_ppm = (fb as any).eco2_ppm ?? (fb as any).sgp_eco2_ppm ?? undefined;

    return {
        stationId,
        name: fb.name ?? fb.deviceId ?? stationId,
        location: fb.location ?? '',
        coordinates: fb.lat !== undefined && fb.lng !== undefined ? { lat: fb.lat, lng: fb.lng } : undefined,
        device: {
            id: fb.deviceId ?? undefined,
            model: fb.deviceModel ?? undefined,
            battery: fb.battery ?? undefined,
        },
        aqi: fb.aqi,
        pollutants: {
            pm25: pm25 ?? null,
            pm10: pm10 ?? null,
            pm1_0: pm1_0 ?? null,
            co: co ?? null,
            no2: no2 ?? null,
            so2: so2 ?? null,
            o3: o3 ?? null,
            methane: methane ?? null,
            tvoc_ppb: tvoc_ppb ?? null,
            eco2_ppm: eco2_ppm ?? null,
        },
        dataTimestamp: dataTs.toISOString(),
    };
}

/**
 * Upsert station metadata and append a timestamped reading in Firestore
 */
async function upsertStationAndAppendReading(stationId: string, fb: FirebaseAQIData) {
    const db = getFirestoreDb();
    if (!db) return;

    const reading = normalizeReading(stationId, fb);

    // Upsert station meta and latest snapshot
    const stationRef = doc(db, 'stations', stationId);
    await setDoc(
        stationRef,
        {
            stationId,
            name: reading.name,
            location: reading.location,
            coordinates: reading.coordinates ?? null,
            device: reading.device,
            latest: {
                aqi: reading.aqi,
                ...reading.pollutants,
                updatedAt: reading.dataTimestamp,
            },
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        },
        { merge: true }
    );

    // Append reading in subcollection
    const readingsCol = collection(db, 'stations', stationId, 'readings');
    await addDoc(readingsCol, {
        aqi: reading.aqi,
        ...reading.pollutants,
        coordinates: reading.coordinates ?? null,
        battery: reading.device.battery ?? null,
        deviceId: reading.device.id ?? null,
        deviceModel: reading.device.model ?? null,
        dataTimestamp: reading.dataTimestamp,
        createdAt: serverTimestamp(),
    });
}

/**
 * Sync all RTDB stations to Firestore, deduplicating by lastUpdated per station.
 */
export async function syncFirebaseToFirestore(data: FirebaseStationsData) {
    const db = getFirestoreDb();
    if (!db) return; // Firestore not configured on client

    const entries = Object.entries(data);
    for (const [stationId, fb] of entries) {
        const ts = fb.lastUpdated ?? '';
        const last = lastSynced.get(stationId);
        if (last && last === ts) continue; // skip duplicate
        try {
            await upsertStationAndAppendReading(stationId, fb);
            if (ts) lastSynced.set(stationId, ts);
        } catch (err) {
            console.error('Firestore sync failed for', stationId, err);
        }
    }
}
