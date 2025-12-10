'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      const mod = await import('@/lib/firebase-aqi-service');
      const { isFirebaseConfigured, subscribeToAQIData } = mod as any;
      if (!isFirebaseConfigured || !isFirebaseConfigured()) {
        setLoading(false);
        return;
        }
      unsubscribe = subscribeToAQIData((snapshot: any) => {
        setData(snapshot?.[id] ?? null);
        setLoading(false);
      });
    })();
    return () => { if (unsubscribe) try { unsubscribe(); } catch {} };
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!data) return <div className="p-6">Device "{id}" not found.</div>;

  const last = data.lastUpdated ? new Date(data.lastUpdated) : undefined;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Device: {id}</h1>
      <div className="space-y-3">
        <div className="flex justify-between"><span className="text-gray-500">Device ID</span><span>{data.deviceId ?? '-'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Model</span><span>{data.deviceModel ?? '-'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">AQI</span><span>{data.aqi ?? '-'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Battery</span><span>{data.battery !== undefined ? `${data.battery}%` : '-'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Last Updated</span><span>{last ? last.toLocaleString() : '-'}</span></div>
      </div>
    </div>
  );
}
