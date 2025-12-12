"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type PurifierItem = {
  id: string;
  airFiltered?: number;
  lastMaintenance?: string;
  status?: boolean;
};

export default function AdminPurifiersPage() {
  const [purifiers, setPurifiers] = useState<PurifierItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOnce = useCallback(async () => {
    setLoading(true);
    try {
      const mod = await import('@/lib/firebase-aqi-service');
      const data = await mod.getPurifiersFromFirebase();
      const items: PurifierItem[] = data
        ? Object.entries(data).map(([id, p]) => ({ id, ...p }))
        : [];
      setPurifiers(items);
    } catch (err) {
      console.error('Failed to load purifiers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      const mod = await import('@/lib/firebase-aqi-service');
      const { isFirebaseConfigured, subscribeToPurifiers } = mod as any;
      if (!isFirebaseConfigured || !isFirebaseConfigured()) {
        setLoading(false);
        return;
      }
      await fetchOnce();
      unsubscribe = subscribeToPurifiers((data: any) => {
        const items: PurifierItem[] = Object.entries(data).map(([id, p]: [string, any]) => ({ id, ...p }));
        setPurifiers(items);
        setLoading(false);
      });
    })();
    return () => { if (unsubscribe) try { unsubscribe(); } catch {} };
  }, [fetchOnce]);

  const toggleStatus = async (id: string, next: boolean) => {
    try {
      const mod = await import('@/lib/firebase-aqi-service');
      const ok = await mod.updatePurifierStatus(id, next);
      if (!ok) console.warn('Toggle status failed');
    } catch (err) {
      console.error('Error toggling purifier status:', err);
    }
  };

  const markMaintenance = async (id: string) => {
    try {
      const mod = await import('@/lib/firebase-aqi-service');
      const ok = await mod.markPurifierMaintenance(id);
      if (!ok) console.warn('Mark maintenance failed');
    } catch (err) {
      console.error('Error marking maintenance:', err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AQI Purifiers</h1>
          <p className="text-sm text-gray-500">Monitor and control purifiers (realtime)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOnce} className="px-3 py-2 bg-surface-light/90 dark:bg-surface-dark/90 border rounded-md">Refresh</button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark border rounded-lg overflow-auto">
        <table className="w-full text-left min-w-[720px]">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-xs text-gray-600">Purifier ID</th>
              <th className="px-4 py-3 text-xs text-gray-600">Air Filtered</th>
              <th className="px-4 py-3 text-xs text-gray-600">Status</th>
              <th className="px-4 py-3 text-xs text-gray-600">Last Maintenance</th>
              <th className="px-4 py-3 text-xs text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Loading...</td>
              </tr>
            )}

            {!loading && purifiers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No purifiers found.</td>
              </tr>
            )}

            {purifiers.map((p) => {
              const last = p.lastMaintenance ? new Date(p.lastMaintenance) : undefined;
              const needsMaintenance = last ? (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24) > 30 : false;
              return (
                <tr key={p.id} className="border-t last:border-b">
                  <td className="px-4 py-3 text-sm font-medium">{p.id}</td>
                  <td className="px-4 py-3 text-sm">{p.airFiltered ?? 0}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${p.status ? 'bg-green-500/15 text-green-500' : 'bg-gray-500/15 text-gray-400'}`}>
                      {p.status ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {last ? (
                      <span className={needsMaintenance ? 'text-amber-500' : 'text-gray-300'}>
                        {last.toLocaleString()}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2 items-center">
                      <button
                        className="px-2 py-1 border rounded"
                        onClick={() => toggleStatus(p.id, !(p.status ?? false))}
                      >
                        {p.status ? 'Turn Off' : 'Turn On'}
                      </button>
                      <button
                        className="px-2 py-1 border rounded"
                        onClick={() => markMaintenance(p.id)}
                      >
                        Mark Maintenance
                      </button>
                      <Link href={`/admin/purifiers/${p.id}`} className="px-2 py-1 border rounded inline-block">View</Link>
                    </div>
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
