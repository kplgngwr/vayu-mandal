'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PurifierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      const mod = await import('@/lib/firebase-aqi-service');
      const { isFirebaseConfigured, subscribeToPurifiers } = mod as any;
      if (!isFirebaseConfigured || !isFirebaseConfigured()) {
        setLoading(false);
        return;
      }
      unsubscribe = subscribeToPurifiers((snapshot: any) => {
        setData(snapshot?.[id] ?? null);
        setLoading(false);
      });
    })();
    return () => { if (unsubscribe) try { unsubscribe(); } catch {} };
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!data) return <div className="p-6">Purifier "{id}" not found.</div>;

  const last = data.lastMaintenance ? new Date(data.lastMaintenance) : undefined;
  const needsMaintenance = last ? (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24) > 30 : false;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Purifier: {id}</h1>
      <div className="space-y-3">
        <div className="flex justify-between"><span className="text-gray-500">Air Filtered</span><span>{data.airFiltered ?? 0}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={data.status ? 'text-green-500' : 'text-gray-400'}>{data.status ? 'Active' : 'Off'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Last Maintenance</span><span className={needsMaintenance ? 'text-amber-500' : 'text-gray-300'}>{last ? last.toLocaleString() : '-'}</span></div>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          className="px-3 py-2 border rounded"
          onClick={async () => {
            const mod = await import('@/lib/firebase-aqi-service');
            await mod.updatePurifierStatus(id, !(data.status ?? false));
          }}
        >{data.status ? 'Turn Off' : 'Turn On'}</button>
        <button
          className="px-3 py-2 border rounded"
          onClick={async () => {
            const mod = await import('@/lib/firebase-aqi-service');
            await mod.markPurifierMaintenance(id);
          }}
        >Mark Maintenance</button>
      </div>
    </div>
  );
}
