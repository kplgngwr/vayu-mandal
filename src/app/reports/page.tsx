'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Sparkles, RefreshCw, Lightbulb } from 'lucide-react';

type TimeRange = '24h' | '7d' | '30d';

interface HistoricalDataPoint {
  timestamp: string;
  aqi: number;
  pm25?: number;
  pm10?: number;
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
  const [range, setRange] = useState<TimeRange>('7d');
  const [nearbyStationId, setNearbyStationId] = useState<string | null>(null);
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [currentAqi, setCurrentAqi] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Resolve nearest station from existing mapping data (client-side heuristic)
  useEffect(() => {
    (async () => {
      if (!coords) return;
      try {
        const mod = await import('@/data/mock-data');
        const stations: any[] = (mod as any).aqiStations ?? [];
        if (stations.length === 0) return;
        const nearest = stations
          .map((s) => ({
            id: s.id,
            dist: Math.hypot((s.lat ?? 0) - coords.lat, (s.lng ?? 0) - coords.lng),
          }))
          .sort((a, b) => a.dist - b.dist)[0];
        setNearbyStationId(nearest?.id ?? null);
      } catch {}
    })();
  }, [coords]);

  const fetchHistorical = async () => {
    if (!nearbyStationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/historical?station=${nearbyStationId}&range=${range}`);
      const json: HistoricalAPIResponse = await res.json();
      if (json.success) {
        setData(json.data);
        setCurrentAqi(json.currentAqi);
      } else {
        setError('Failed to fetch historical data');
      }
    } catch (e) {
      setError('Unable to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorical();
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
    if (pm25Avg > 60) tips.push('PM2.5 is elevated — use indoor purifiers and keep ventilation balanced.');
    if (pm10Avg > 100) tips.push('PM10 is high — avoid dusty routes and limit outdoor exercise today.');
    tips.push('If available, switch nearby purifiers to active mode during local peaks.');
    return { avg, peak, pm25Avg, pm10Avg, tips };
  }, [data, currentAqi]);

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
            <div className="flex justify-between"><span>Nearest Station</span><span>{nearbyStationId ?? '-'}</span></div>
            <div className="flex justify-between"><span>Average AQI</span><span>{suggestions.avg}</span></div>
            <div className="flex justify-between"><span>Peak AQI</span><span>{suggestions.peak}</span></div>
            <div className="flex justify-between"><span>PM2.5 (avg)</span><span>{suggestions.pm25Avg}</span></div>
            <div className="flex justify-between"><span>PM10 (avg)</span><span>{suggestions.pm10Avg}</span></div>
          </div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Suggestions</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            {suggestions.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <p className="text-xs text-text-muted-light dark:text-text-muted mt-3">AI-generated guidance coming soon (Gemini). Configure your Gemini API key to enable personalized insights.</p>
        </div>
      </div>

      <div className="text-sm text-text-muted-light dark:text-text-muted">
        <p>Looking for detailed device views? Visit the <Link href="/admin" className="underline">Admin</Link> hub.</p>
      </div>
    </div>
  );
}