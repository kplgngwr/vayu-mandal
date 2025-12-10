'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// Simple combined Admin hub: shows live devices and purifiers lists side by side
export default function AdminHubPage() {
  // devices
  const [devices, setDevices] = useState<Record<string, any> | null>(null);
  const [devicesLoading, setDevicesLoading] = useState(true);
  // purifiers
  const [purifiers, setPurifiers] = useState<Record<string, any> | null>(null);
  const [purifiersLoading, setPurifiersLoading] = useState(true);

  const fetchOnce = useCallback(async () => {
    // load both once
    try {
      const mod = await import('@/lib/firebase-aqi-service');
      const d = await mod.getAQIDataFromFirebase();
      setDevices(d ?? {});
      const p = await mod.getPurifiersFromFirebase();
      setPurifiers(p ?? {});
    } catch (err) {
      // non-fatal
    } finally {
      setDevicesLoading(false);
      setPurifiersLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeDevices: (() => void) | null = null;
    let unsubscribePurifiers: (() => void) | null = null;

    (async () => {
      const mod = await import('@/lib/firebase-aqi-service');
      const { isFirebaseConfigured, subscribeToAQIData, subscribeToPurifiers } = mod as any;
      if (!isFirebaseConfigured || !isFirebaseConfigured()) {
        setDevicesLoading(false);
        setPurifiersLoading(false);
        return;
      }
      await fetchOnce();
      unsubscribeDevices = subscribeToAQIData((d: any) => setDevices(d));
      unsubscribePurifiers = subscribeToPurifiers((p: any) => setPurifiers(p));
    })();

    return () => {
      if (unsubscribeDevices) try { unsubscribeDevices(); } catch {}
      if (unsubscribePurifiers) try { unsubscribePurifiers(); } catch {}
    };
  }, [fetchOnce]);

  const deviceEntries = devices ? Object.entries(devices) : [];
  const purifierEntries = purifiers ? Object.entries(purifiers) : [];

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button onClick={fetchOnce} className="px-3 py-2 border rounded">Refresh</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devices */}
        <div className="bg-white dark:bg-surface-dark border rounded-lg overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Devices</h2>
            <Link href="/admin/devices" className="text-sm underline">Open list</Link>
          </div>
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-xs text-gray-600">Station ID</th>
                <th className="px-4 py-3 text-xs text-gray-600">AQI</th>
                <th className="px-4 py-3 text-xs text-gray-600">Device</th>
                <th className="px-4 py-3 text-xs text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devicesLoading && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">Loading...</td></tr>
              )}
              {!devicesLoading && deviceEntries.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No devices found.</td></tr>
              )}
              {deviceEntries.map(([id, d]) => (
                <tr key={id} className="border-t last:border-b">
                  <td className="px-4 py-3 text-sm font-medium">{id}</td>
                  <td className="px-4 py-3 text-sm">{d?.aqi ?? '-'}</td>
                  <td className="px-4 py-3 text-sm">{d?.deviceId ?? '-'}</td>
                  <td className="px-4 py-3 text-sm"><Link href={`/admin/devices/${id}`} className="px-2 py-1 border rounded inline-block">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Purifiers */}
        <div className="bg-white dark:bg-surface-dark border rounded-lg overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Purifiers</h2>
            <Link href="/admin/purifiers" className="text-sm underline">Open list</Link>
          </div>
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-xs text-gray-600">ID</th>
                <th className="px-4 py-3 text-xs text-gray-600">Status</th>
                <th className="px-4 py-3 text-xs text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purifiersLoading && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">Loading...</td></tr>
              )}
              {!purifiersLoading && purifierEntries.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">No purifiers found.</td></tr>
              )}
              {purifierEntries.map(([id, p]) => (
                <tr key={id} className="border-t last:border-b">
                  <td className="px-4 py-3 text-sm font-medium">{id}</td>
                  <td className="px-4 py-3 text-sm">{p?.status ? 'Active' : 'Off'}</td>
                  <td className="px-4 py-3 text-sm"><Link href={`/admin/purifiers/${id}`} className="px-2 py-1 border rounded inline-block">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
