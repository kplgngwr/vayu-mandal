'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AQIChart from '@/components/AQIChart';
import PollutantBreakdown from '@/components/PollutantBreakdown';
import { getFirestoreDb } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [historical, setHistorical] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [purifier, setPurifier] = useState<any | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      const mod = await import('@/lib/firebase-aqi-service');
      const { isFirebaseConfigured, subscribeToAQIData } = mod as any;
      if (!isFirebaseConfigured || !isFirebaseConfigured()) {
        setLoading(false);
        return;
      }

      // initial snapshot + realtime updates
      unsubscribe = subscribeToAQIData((snapshot: any) => {
        setData(snapshot?.[id] ?? null);
        setLoading(false);
      });

      // load purifier state for this device (if any)
      try {
        const resp = await fetch(`/api/purifiers/state?id=${encodeURIComponent(id)}`);
        if (resp.ok) {
          const js = await resp.json();
          if (js.success) setPurifier(js.data || null);
        }
      } catch (e) {
        console.warn('Failed to load purifier state', e);
      }

      // fetch historical data for charts from Firestore (readings collection)
      try {
        setHistLoading(true);
        const db = getFirestoreDb();
        if (db) {
          const readingsCol = collection(db, 'stations', id, 'readings');
          const now = new Date();
          const start = new Date(now);
          start.setHours(now.getHours() - 24);
          const q = query(
            readingsCol,
            where('dataTimestamp', '>=', start.toISOString()),
            orderBy('dataTimestamp', 'asc'),
            limit(200)
          );
          const snap = await getDocs(q);
          const points: any[] = [];
          snap.forEach(doc => {
            const d: any = doc.data();
            points.push({
              timestamp: d.dataTimestamp,
              aqi: Number(d.aqi ?? 0),
              pm25: d.pm25 !== undefined ? Number(d.pm25) : (d.pm2_5 !== undefined ? Number(d.pm2_5) : undefined),
              pm10: d.pm10 !== undefined ? Number(d.pm10) : undefined,
              pm1_0: d.pm1_0 !== undefined ? Number(d.pm1_0) : undefined,
              co: d.co !== undefined ? Number(d.co) : undefined,
              no2: d.no2 !== undefined ? Number(d.no2) : undefined,
              so2: d.so2 !== undefined ? Number(d.so2) : undefined,
              o3: d.o3 !== undefined ? Number(d.o3) : undefined,
              methane: d.methane !== undefined ? Number(d.methane) : undefined,
              tvoc_ppb: d.tvoc_ppb !== undefined ? Number(d.tvoc_ppb) : undefined,
              eco2_ppm: d.eco2_ppm !== undefined ? Number(d.eco2_ppm) : undefined,
            });
          });
          setHistorical(points);
        }
      } catch (err) {
        console.warn('Failed to fetch historical data', err);
      } finally {
        setHistLoading(false);
      }
    })();
    return () => { if (unsubscribe) try { unsubscribe(); } catch {} };
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Device "{id}" not found.</div>;

  const last = data.lastUpdated ? new Date(data.lastUpdated) : undefined;
  const lastMaint = purifier?.lastMaintenance ? new Date(purifier.lastMaintenance) : undefined;

  const pm25 = data.pm25 ?? data.pm2_5 ?? data['pm2_5'] ?? null;
  const pm10 = data.pm10 ?? data.pm10 ?? null;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-start gap-8">
        {/* Left - Summary & sensors */}
        <div className="w-full md:w-1/3">
          <h1 className="text-2xl font-bold mb-4">Device: {id}</h1>

          <div className="bg-white dark:bg-surface-dark border rounded-lg p-4 space-y-3 mb-4">
            <div className="flex justify-between"><span className="text-gray-500">Device ID</span><span>{data.deviceId ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Model</span><span>{data.deviceModel ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">AQI</span><span className="font-semibold">{data.aqi ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Battery</span><span>{data.battery !== undefined ? `${data.battery}%` : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Last Updated</span><span>{last ? last.toLocaleString() : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Last Maintenance</span><span>{lastMaint ? lastMaint.toLocaleString() : '-'}</span></div>
          </div>

          <div className="bg-white dark:bg-surface-dark border rounded-lg p-4 mb-4">
            <h3 className="text-sm text-gray-600 mb-3">Sensor Readings</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 border rounded">
                <div className="text-xs text-gray-500">PM2.5</div>
                <div className="text-lg font-semibold">{pm25 ?? '-'}</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-xs text-gray-500">PM10</div>
                <div className="text-lg font-semibold">{pm10 ?? '-'}</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-xs text-gray-500">CO (ppb)</div>
                <div className="text-lg font-semibold">{data.co ?? '-'}</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-xs text-gray-500">eCO2 (ppm)</div>
                <div className="text-lg font-semibold">{data.eco2_ppm ?? data.sgpeco2 ?? '-'}</div>
              </div>
              <div className="p-3 border rounded col-span-2">
                <div className="text-xs text-gray-500">TVOC (ppb)</div>
                <div className="text-lg font-semibold">{data.tvoc_ppb ?? data.sgp_tvoc_ppb ?? '-'}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={async () => {
                try {
                  const resp = await fetch('/api/purifiers/state?id=' + encodeURIComponent(id));
                  if (resp.ok) {
                    const js = await resp.json();
                    if (js.success) setPurifier(js.data || null);
                  }
                } catch (e) {
                  console.warn('Refresh RTDB failed', e);
                }
              }}
              className="px-3 py-2 border rounded"
            >
              Refresh RTDB
            </button>

            <button
              onClick={async () => {
                const now = new Date().toISOString();
                try {
                  // optimistic UI update
                  setPurifier((p: any) => ({ ...(p || {}), lastMaintenance: now }));
                  const res = await fetch('/api/purifiers/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, updates: { lastMaintenance: now } }),
                  });
                  const js = await res.json().catch(() => null);
                  if (!res.ok || !js || !js.success) {
                    const txt = js?.error ?? 'unknown';
                    console.warn('Failed to mark maintenance:', res.status, txt);
                    // revert optimistic
                    await fetch('/api/purifiers/state?id=' + encodeURIComponent(id)).then(r => r.ok && r.json()).then(js2 => js2.success && setPurifier(js2.data || null)).catch(() => {});
                  } else {
                    // update purifier state from server response (if available), otherwise fetch fresh
                    if (js.data) setPurifier(js.data);
                    else {
                      await fetch('/api/purifiers/state?id=' + encodeURIComponent(id)).then(r => r.ok && r.json()).then(js2 => js2.success && setPurifier(js2.data || null)).catch(() => {});
                    }
                  }
                } catch (e) {
                  console.warn('Mark maintenance error', e);
                }
              }}
              className="px-3 py-2 border rounded"
            >
              Mark Maintenance
            </button>
          </div>
        </div>

        {/* Right - Charts */}
        <div className="flex-1 space-y-4">
          <div className="bg-white dark:bg-surface-dark border rounded-lg p-4">
            <h3 className="text-sm text-gray-600 mb-3">AQI (24h)</h3>
            {histLoading ? <div>Loading chart...</div> : <AQIChart data={historical as any} type="line" title={`AQI — ${id}`} showPM extraKeys={[]} />}
          </div>

          <div className="bg-white dark:bg-surface-dark border rounded-lg p-4">
            <h3 className="text-sm text-gray-600 mb-3">Pollutant Breakdown</h3>
            <PollutantBreakdown stationData={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
