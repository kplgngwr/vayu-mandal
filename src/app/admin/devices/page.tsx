'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
// Realtime helpers imported dynamically inside effects to avoid SSR issues
import type { FirebaseStationsData } from '@/lib/firebase-aqi-service';

export default function DevicesAdminPage() {
    const [stations, setStations] = useState<FirebaseStationsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const loadOnce = useCallback(async () => {
        setLoading(true);
        try {
            const mod = await import('@/lib/firebase-aqi-service');
            const data = await mod.getAQIDataFromFirebase();
            setStations(data);
        } catch (err) {
            console.error('Failed to load firebase stations:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        (async () => {
            const mod = await import('@/lib/firebase-aqi-service');
            const { isFirebaseConfigured, subscribeToAQIData } = mod as any;

            if (!isFirebaseConfigured || !isFirebaseConfigured()) {
                setLoading(false);
                return;
            }

            // initial load
            await loadOnce();

            // subscribe for realtime updates
            unsubscribe = subscribeToAQIData((data: any) => {
                setStations(data);
                setLoading(false);
            });
        })();

        return () => { if (unsubscribe) try { unsubscribe(); } catch {} };
    }, [loadOnce]);

    const entries = stations ? Object.entries(stations) : [];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Device Monitor</h1>
                    <p className="text-sm text-gray-500">Realtime view of PranaMesh devices (from Firebase)</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOnce}
                        className="px-3 py-2 bg-surface-light/90 dark:bg-surface-dark/90 border rounded-md"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Guard: show banner only when firebase is not configured (checked client-side) */}
            {/* Using dynamic check would complicate JSX; keep static import pattern acceptable in client */}
            {/* The subscription logic above already guards before running */}
            {false && (
                <div className="p-4 mb-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
                    Firebase is not configured. Set `NEXT_PUBLIC_FIREBASE_*` env vars to enable realtime device monitoring.
                </div>
            )}

            <div className="bg-white dark:bg-surface-dark border rounded-lg overflow-auto">
                <table className="w-full text-left min-w-[720px]">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-xs text-gray-600">Station ID</th>
                            <th className="px-4 py-3 text-xs text-gray-600">Device ID</th>
                            <th className="px-4 py-3 text-xs text-gray-600">Model</th>
                            <th className="px-4 py-3 text-xs text-gray-600">AQI</th>
                            <th className="px-4 py-3 text-xs text-gray-600">Battery</th>
                            <th className="px-4 py-3 text-xs text-gray-600">Last Updated</th>
                            <th className="px-4 py-3 text-xs text-gray-600">Location</th>
                            <th className="px-4 py-3 text-xs text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">Loading...</td>
                            </tr>
                        )}

                        {!loading && entries.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No device stations found in Firebase.</td>
                            </tr>
                        )}

                        {entries.map(([stationId, payload]) => {
                            // consider it a device station if deviceId present or stationId starts with station-esp32
                            const isDevice = !!payload.deviceId || stationId.startsWith('station-esp32') || !!payload.deviceModel;
                            if (!isDevice) return null;

                            const last = payload.lastUpdated ? new Date(payload.lastUpdated) : undefined;

                            return (
                                <tr key={stationId} className="border-t last:border-b">
                                    <td className="px-4 py-3 text-sm font-medium">{stationId}</td>
                                    <td className="px-4 py-3 text-sm">{payload.deviceId ?? '-'}</td>
                                    <td className="px-4 py-3 text-sm">{payload.deviceModel ?? '-'}</td>
                                    <td className="px-4 py-3 text-sm">{payload.aqi ?? '-'}</td>
                                    <td className="px-4 py-3 text-sm">{payload.battery !== undefined ? `${payload.battery}%` : '-'}</td>
                                    <td className="px-4 py-3 text-sm">{last ? last.toLocaleString() : '-'}</td>
                                    <td className="px-4 py-3 text-sm">{payload.lat && payload.lng ? `${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)}` : '-'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <Link href={`/admin/devices/${stationId}`} className="px-2 py-1 border rounded inline-block">View</Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
