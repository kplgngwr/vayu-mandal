'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import dynamic from 'next/dynamic';

const AQIChart = dynamic(() => import('@/components/AQIChart'), { ssr: false });
const Chatbot = dynamic(() => import('@/components/Chatbot'), { ssr: false });
import { getFirestoreDb } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

interface HistoricalDataPoint {
  timestamp: string;
  aqi: number;
  pm25?: number;
  pm10?: number;
  pm1_0?: number;
  co?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  voc?: number;
  tvoc_ppb?: number;
  eco2_ppm?: number;
  methane?: number;
}

interface HistoricalAPIResponse {
  success: boolean;
  data: HistoricalDataPoint[];
  station: string;
  range: TimeRange;
  currentAqi: number;
  lastUpdated: string;
}

export default function ReportsPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [range, setRange] = useState<TimeRange>('1h');
  const [nearbyStationId, setNearbyStationId] = useState<string | null>('MHXY_001');
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [currentAqi, setCurrentAqi] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightMeta, setInsightMeta] = useState<{ cached?: boolean; model?: string } | null>(null);
  const [weather, setWeather] = useState<{ temperature: number; humidity: number; windSpeed: number; condition?: string } | null>(null);
  // Simple client-side caches per (stationId, range)
  const [dataCache] = useState<Map<string, { points: HistoricalDataPoint[]; ts: number }>>(new Map());
  const [insightCache] = useState<Map<string, { text: string; ts: number }>>(new Map());
  const ttlMs = 90 * 1000; // 90s TTL

  // Get user location for personalized report
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // gracefully fallback to Delhi center
        setCoords({ lat: 28.6139, lng: 77.2090 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Force station selection to MHXY_001 (data being pushed here)
  useEffect(() => {
    setNearbyStationId('MHXY_001');
  }, []);

  const fetchHistorical = async () => {
    if (!nearbyStationId) return;
    setLoading(true);
    setError(null);
    setInsight(null);
    try {
      const cacheKey = `${nearbyStationId}-${range}`;
      const cachedData = dataCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.ts < ttlMs && cachedData.points.length) {
        setData(cachedData.points);
        setCurrentAqi(cachedData.points[cachedData.points.length - 1]?.aqi ?? null);
        const cachedInsight = insightCache.get(cacheKey);
        if (cachedInsight && Date.now() - cachedInsight.ts < ttlMs) setInsight(cachedInsight.text);
        setLoading(false);
        return;
      }
      const db = getFirestoreDb();
      if (!db) throw new Error('Firestore not configured');
      const readingsCol = collection(db, 'stations', nearbyStationId, 'readings');
      const now = new Date();
      const start = new Date(now);
      if (range === '1h') start.setHours(now.getHours() - 1);
      else if (range === '6h') start.setHours(now.getHours() - 6);
      else if (range === '24h') start.setDate(now.getDate() - 1);
      else if (range === '7d') start.setDate(now.getDate() - 7);
      else if (range === '30d') start.setDate(now.getDate() - 30);
      const q = query(
        readingsCol,
        where('dataTimestamp', '>=', start.toISOString()),
        orderBy('dataTimestamp', 'asc'),
        limit(range === '1h' ? 20 : range === '6h' ? 60 : range === '24h' ? 100 : range === '7d' ? 400 : 800)
      );
      const snap = await getDocs(q);
      const points: HistoricalDataPoint[] = [];
      snap.forEach(doc => {
        const d = doc.data() as any;
        points.push({
          timestamp: d.dataTimestamp,
          aqi: Number(d.aqi ?? 0),
          pm25: toNum(d.pm25),
          pm10: toNum(d.pm10),
          pm1_0: toNum(d.pm1_0),
          co: toNum(d.co),
          no2: toNum(d.no2),
          so2: toNum(d.so2),
          o3: toNum(d.o3),
          methane: toNum(d.methane),
          tvoc_ppb: toNum(d.tvoc_ppb),
          eco2_ppm: toNum(d.eco2_ppm),
        });
      });
      setData(points);
      dataCache.set(cacheKey, { points, ts: Date.now() });
      const latest = points[points.length - 1];
      setCurrentAqi(latest ? latest.aqi : null);
      await fetchGeminiInsights(points);
    } catch (e) {
      setError('Unable to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorical();
    // fetch weather using coords when available
    (async () => {
      try {
        const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
        const res = await fetch(`/api/weather${qs}`);
        const json = await res.json();
        if (json.success) {
          setWeather({ temperature: Math.round(json.temperature), humidity: Math.round(json.humidity), windSpeed: Math.round(json.windSpeed), condition: json.condition });
        }
      } catch {}
    })();
  }, [nearbyStationId, range]);

  // Simple heuristic suggestions (placeholder for Gemini)
  const suggestions = useMemo(() => {
    const avg = data.length ? Math.round(data.reduce((a, b) => a + b.aqi, 0) / data.length) : currentAqi ?? 0;
    const peak = data.length ? Math.max(...data.map(d => d.aqi)) : currentAqi ?? 0;
    const pm25Avg = data.length ? Math.round((data.reduce((a, b) => a + (b.pm25 ?? Math.round(b.aqi * 0.6)), 0)) / data.length) : Math.round((currentAqi ?? 100) * 0.6);
    const pm10Avg = data.length ? Math.round((data.reduce((a, b) => a + (b.pm10 ?? Math.round(b.aqi * 1.1)), 0)) / data.length) : Math.round((currentAqi ?? 100) * 1.1);
    const tips: string[] = [];
    if (avg <= 100) tips.push('Air quality is generally moderate — outdoor activities are fine; prefer mornings or late evenings.');
    if (peak > 200) tips.push('Peaks above unhealthy levels detected — consider using masks outdoors during peak hours.');
    if (pm25Avg > 60) tips.push('PM2.5 elevated — use HEPA purifiers; limit ventilation during peaks.');
    if (pm10Avg > 100) tips.push('PM10 high — avoid dusty routes; limit outdoor exercise today.');
    // Additional pollutant guidance using latest point if available
    const latest = data[data.length - 1];
    if (latest) {
      if ((latest.co ?? 0) > 4) tips.push('CO elevated — avoid traffic-heavy areas; ventilate carefully.');
      if ((latest.no2 ?? 0) > 100) tips.push('NO₂ high — sensitive individuals should avoid roadside exposure.');
      if ((latest.o3 ?? 0) > 120) tips.push('O₃ elevated — reduce strenuous outdoor activity in sunlight.');
      if ((latest.tvoc_ppb ?? 0) > 300) tips.push('VOCs elevated — improve indoor ventilation; avoid solvents/paints.');
      if ((latest.eco2_ppm ?? 0) > 1200) tips.push('eCO₂ high — increase fresh air intake periodically.');
    }
    if (weather) {
      if (weather.windSpeed > 20) tips.push('High winds — dust resuspension likely; masks recommended outdoors.');
      if (weather.humidity < 30) tips.push('Low humidity — throat irritation possible; hydrate and consider humidification indoors.');
      if (weather.temperature > 35) tips.push('Heat + pollution — avoid peak hours; seek shade and reduce strenuous activity.');
    }
    tips.push('If available, switch nearby purifiers to active mode during local peaks.');
    return { avg, peak, pm25Avg, pm10Avg, tips };
  }, [data, currentAqi, weather]);

  function toNum(v: any): number | undefined {
    if (v === null || v === undefined) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }

  const fetchGeminiInsights = async (points: HistoricalDataPoint[]) => {
    try {
      if (!nearbyStationId) return;
      const latest = points[points.length - 1];
      const res = await fetch('/api/reports/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: nearbyStationId,
          range,
          summary: { avg: suggestions.avg, peak: suggestions.peak, pm25Avg: suggestions.pm25Avg, pm10Avg: suggestions.pm10Avg, coords, latest: latest ? { co: latest.co, no2: latest.no2, o3: latest.o3, tvoc_ppb: latest.tvoc_ppb, eco2_ppm: latest.eco2_ppm } : undefined },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInsight(json.insight);
        setInsightMeta({ cached: !!json.cached, model: json.model });
        const cacheKey = `${nearbyStationId}-${range}`;
        insightCache.set(cacheKey, { text: json.insight, ts: Date.now() });
      }
    } catch {}
  };

  const regenerateInsight = async (points: HistoricalDataPoint[]) => {
    try {
      if (!nearbyStationId) return;
      const latest = points[points.length - 1];
      setInsight('Regenerating insight...');
      const res = await fetch('/api/reports/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: nearbyStationId,
          range,
          force: true,
          summary: { avg: suggestions.avg, peak: suggestions.peak, pm25Avg: suggestions.pm25Avg, pm10Avg: suggestions.pm10Avg, coords, latest: latest ? { co: latest.co, no2: latest.no2, o3: latest.o3, tvoc_ppb: latest.tvoc_ppb, eco2_ppm: latest.eco2_ppm } : undefined },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInsight(json.insight);
        setInsightMeta({ cached: !!json.cached, model: json.model });
      }
    } catch {
      setInsight(null);
      setInsightMeta(null);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-primary-light-theme dark:text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold">Personalized Reports & Suggestions</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-text-muted-light dark:text-text-muted" />
          <span className="text-sm">{coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Locating...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Range</label>
          <select value={range} onChange={(e) => setRange(e.target.value as TimeRange)} className="px-3 py-2 bg-surface-light dark:bg-surface-dark border rounded-xl text-sm">
            <option value="1h">1h</option>
            <option value="6h">6h</option>
            <option value="24h">24h</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
          </select>
        </div>
        <button onClick={fetchHistorical} className="flex items-center gap-2 px-3 py-2 border rounded">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <div className="p-4 mb-4 rounded-md bg-red-50 border border-red-200 text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface-light dark:bg-surface-dark border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Station</span><span>{nearbyStationId ?? '-'}</span></div>
            <div className="flex justify-between"><span>Average AQI</span><span>{loading ? '...' : suggestions.avg}</span></div>
            <div className="flex justify-between"><span>Peak AQI</span><span>{loading ? '...' : suggestions.peak}</span></div>
            <div className="flex justify-between"><span>PM2.5 (avg)</span><span>{loading ? '...' : suggestions.pm25Avg}</span></div>
            <div className="flex justify-between"><span>PM10 (avg)</span><span>{loading ? '...' : suggestions.pm10Avg}</span></div>
            {weather && (
              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <div>Temp: <span className="font-semibold">{weather.temperature}°C</span></div>
                <div>Humidity: <span className="font-semibold">{weather.humidity}%</span></div>
                <div>Wind: <span className="font-semibold">{weather.windSpeed} km/h</span></div>
                <div>Condition: <span className="font-semibold">{weather.condition ?? '-'}</span></div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">Data Quality</h2>
          <p className="text-sm text-text-muted-light dark:text-text-muted">This report uses Firestore readings from station <span className="font-semibold">{nearbyStationId}</span> and weather by coordinates. Ranges use optimized sampling limits for responsiveness.</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {loading ? (
          <div className="h-[350px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ) : (
          <AQIChart title="AQI Trend" type="line" data={data} showPM={false} extraKeys={[
            { key: 'co', label: 'CO', color: '#ef4444' },
            { key: 'no2', label: 'NO₂', color: '#22c55e' },
            { key: 'o3', label: 'O₃', color: '#06b6d4' },
          ]} />
        )}
        {loading ? (
          <div className="h-[350px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ) : (
          <AQIChart title="PM2.5 / PM10" type="line" data={data} showPM={true} extraKeys={[
            { key: 'pm1_0', label: 'PM1.0', color: '#a855f7' },
          ]} />
        )}
      </div>

      {/* Professional Report Card (full-width, bottom) */}
      <div className="bg-surface-light dark:bg-surface-dark border rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Personalized Report & Health Advisory</h2>
        </div>
        {/* AI Insight */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold mb-1">AI Insights</p>
            <div className="flex items-center gap-2">
              <button onClick={() => regenerateInsight(data)} className="px-2 py-1 text-xs border rounded">Regenerate</button>
              <span className="text-xs text-text-muted-light dark:text-text-muted">{insightMeta?.model ? insightMeta.model.replace('models/', '') : ''}{insightMeta?.cached ? ' · cached' : ''}</span>
            </div>
          </div>
          {insight ? (
            <p className="text-sm text-text-muted-light dark:text-text-muted whitespace-pre-wrap">{insight}</p>
          ) : (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
            </div>
          )}
        </div>
        {/* Actionable Suggestions */}
        <div>
          <p className="text-sm font-semibold mb-2">Recommendations</p>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
            </div>
          ) : (
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {suggestions.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="text-sm text-text-muted-light dark:text-text-muted">
        <p>Looking for detailed device views? Visit the <Link href="/admin" className="underline">Admin</Link> hub.</p>
      </div>

      {/* Chatbot fixed icon and popup on this page */}
      <Chatbot context={{ stationId: nearbyStationId, range, weather, latest: data[data.length - 1] }} />
    </div>
  );
}