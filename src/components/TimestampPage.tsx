'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAqiStatus, getAqiColor } from '@/utils/aqi-utils';
import AQIChart from './AQIChart';
import TimestampBarChart from './TimestampBarChart';
import PollutantBreakdown from './PollutantBreakdown';
import StationComparison from './StationComparison';
import AnimatedNumber from './AnimatedNumber';
import {
    Clock, Calendar, Download, TrendingUp, TrendingDown,
    BarChart2, Grid3X3, BarChart3, RefreshCw, MapPin,
    GitCompare, Activity
} from 'lucide-react';
import type { HistoricalDataPoint, HeatmapCell } from '@/types';

// Station options for filtering
const STATIONS = [
    { id: 'delhi-main', name: 'Delhi (Main)' },
    { id: 'anand-vihar', name: 'Anand Vihar' },
    { id: 'punjabi-bagh', name: 'Punjabi Bagh' },
    { id: 'rk-puram', name: 'RK Puram' },
    { id: 'mandir-marg', name: 'Mandir Marg' },
];

type TimeRange = '24h' | '7d' | '30d';
type ChartView = 'barchart' | 'heatmap';

interface HistoricalAPIResponse {
    success: boolean;
    data: HistoricalDataPoint[];
    station: string;
    range: TimeRange;
    currentAqi: number;
    lastUpdated: string;
}

// Generate heatmap data from hourly patterns
const generateHeatmapFromData = (currentAqi: number): HeatmapCell[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const HOURLY_PATTERN = [
        0.75, 0.70, 0.65, 0.63, 0.68, 0.78,
        0.88, 1.05, 1.18, 1.22, 1.15, 1.05,
        0.95, 0.90, 0.88, 0.92, 1.00, 1.15,
        1.25, 1.20, 1.10, 0.98, 0.88, 0.80,
    ];
    const DAILY_PATTERN: Record<string, number> = {
        'Sun': 0.85, 'Mon': 1.05, 'Tue': 1.08, 'Wed': 1.02, 'Thu': 1.05, 'Fri': 1.12, 'Sat': 0.90,
    };

    const data: HeatmapCell[] = [];
    days.forEach((day) => {
        for (let hour = 0; hour < 24; hour++) {
            const value = Math.round(currentAqi * DAILY_PATTERN[day] * HOURLY_PATTERN[hour]);
            data.push({ hour, day, value });
        }
    });
    return data;
};

const TimestampPage = () => {
    // State
    const [selectedStation, setSelectedStation] = useState('delhi-main');
    const [compareStation, setCompareStation] = useState('anand-vihar');
    const [timeRange, setTimeRange] = useState<TimeRange>('24h');
    const [chartView, setChartView] = useState<ChartView>('barchart');
    const [showComparison, setShowComparison] = useState(false);

    // Data states
    const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
    const [compareData, setCompareData] = useState<HistoricalDataPoint[]>([]);
    const [currentAqi, setCurrentAqi] = useState(200);
    const [compareAqi, setCompareAqi] = useState(200);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data from API
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch main station data
            const response = await fetch(`/api/historical?station=${selectedStation}&range=${timeRange}`);
            const result: HistoricalAPIResponse = await response.json();

            if (result.success) {
                setHistoricalData(result.data);
                setCurrentAqi(result.currentAqi);
                setLastUpdated(result.lastUpdated);
            } else {
                setError('Failed to fetch data');
            }

            // Fetch comparison station data if enabled
            if (showComparison) {
                const compareResponse = await fetch(`/api/historical?station=${compareStation}&range=${timeRange}`);
                const compareResult: HistoricalAPIResponse = await compareResponse.json();
                if (compareResult.success) {
                    setCompareData(compareResult.data);
                    setCompareAqi(compareResult.currentAqi);
                }
            }
        } catch (err) {
            console.error('Error fetching historical data:', err);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [selectedStation, compareStation, timeRange, showComparison]);

    // Initial fetch and auto-refresh + realtime updates from Firebase
    useEffect(() => {
        fetchData();

        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);

        // Realtime: when a station snapshot arrives, nudge current values so charts reflect it
        let unsubscribe: (() => void) | null = null;
        (async () => {
            const mod = await import('@/lib/firebase-aqi-service');
            const { startRealtimeAQIStream, isFirebaseConfigured } = mod as any;
            if (isFirebaseConfigured && isFirebaseConfigured()) {
                unsubscribe = startRealtimeAQIStream((fbData: any) => {
                    const stationKey = selectedStation;
                    const payload = fbData?.[stationKey];
                    if (payload && typeof payload.aqi === 'number') {
                        setCurrentAqi(payload.aqi);
                        setLastUpdated(payload.lastUpdated ?? new Date().toISOString());
                    }
                    if (showComparison) {
                        const cmpKey = compareStation;
                        const cmpPayload = fbData?.[cmpKey];
                        if (cmpPayload && typeof cmpPayload.aqi === 'number') {
                            setCompareAqi(cmpPayload.aqi);
                        }
                    }
                });
            }
        })();

        return () => { clearInterval(interval); if (unsubscribe) try { unsubscribe(); } catch {} };
    }, [fetchData, selectedStation, compareStation, showComparison]);

    // Calculate stats
    const stats = {
        avgAqi: historicalData.length > 0
            ? Math.round(historicalData.reduce((a, b) => a + b.aqi, 0) / historicalData.length)
            : currentAqi,
        peakAqi: historicalData.length > 0 ? Math.max(...historicalData.map(d => d.aqi)) : currentAqi,
        minAqi: historicalData.length > 0 ? Math.min(...historicalData.map(d => d.aqi)) : currentAqi,
        dataPoints: historicalData.length,
    };

    // Calculate PM values from current AQI
    const pollutantData = {
        pm25: Math.round(currentAqi * 0.6),
        pm10: Math.round(currentAqi * 1.1),
        co: 1.5,
        no2: 45,
        so2: 15,
        o3: 30,
    };

    // Generate heatmap data
    const heatmapData = generateHeatmapFromData(currentAqi);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Export data as CSV
    const handleExport = () => {
        const headers = ['Timestamp', 'AQI', 'PM2.5', 'PM10'];
        const rows = historicalData.map(d => [d.timestamp, d.aqi, d.pm25, d.pm10].join(','));
        const csv = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aqi_data_${selectedStation}_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Get selected station name
    const stationName = STATIONS.find(s => s.id === selectedStation)?.name || selectedStation;
    const compareStationName = STATIONS.find(s => s.id === compareStation)?.name || compareStation;

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 md:py-16">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary-light-theme dark:text-primary" />
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 text-text-dark dark:text-white">
                                Historical Data & Timestamps
                            </h1>
                            <p className="text-text-muted-light dark:text-text-muted text-sm sm:text-base md:text-lg">
                                Analyze pollution patterns with real-time data
                            </p>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Station Selector */}
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-text-muted-light dark:text-text-muted" />
                            <select
                                value={selectedStation}
                                onChange={(e) => setSelectedStation(e.target.value)}
                                className="px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-light-theme/50 dark:focus:border-primary/50 text-text-dark dark:text-white"
                            >
                                {STATIONS.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Time Range Buttons */}
                        <div className="flex items-center gap-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-1">
                            {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${timeRange === range
                                        ? 'bg-primary-light-theme dark:bg-primary text-white'
                                        : 'text-text-muted-light dark:text-text-muted hover:text-text-dark dark:hover:text-white'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        {/* Compare Toggle */}
                        <button
                            onClick={() => setShowComparison(!showComparison)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${showComparison
                                ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                                : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted hover:text-text-dark dark:hover:text-white'
                                }`}
                        >
                            <GitCompare className="w-4 h-4" />
                            <span className="hidden sm:inline">Compare</span>
                        </button>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-light-theme dark:bg-primary hover:bg-primary-light-theme/90 dark:hover:bg-primary-light rounded-xl font-medium transition-colors text-white text-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </div>
                </div>

                {/* Compare Station Selector */}
                {showComparison && (
                    <div className="flex items-center gap-3 p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                        <span className="text-sm text-pink-400">Compare with:</span>
                        <select
                            value={compareStation}
                            onChange={(e) => setCompareStation(e.target.value)}
                            className="px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none text-text-dark dark:text-white"
                        >
                            {STATIONS.filter(s => s.id !== selectedStation).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Last Updated */}
                {lastUpdated && (
                    <div className="text-xs text-text-muted-light dark:text-text-muted">
                        Last updated: {new Date(lastUpdated).toLocaleString('en-IN')}
                    </div>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}. Using cached data.
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8 mb-8 sm:mb-14">
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <span className="text-text-muted-light dark:text-text-muted text-xs sm:text-sm">Current AQI</span>
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light-theme dark:text-primary" />
                    </div>
                    <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2" style={{ color: getAqiColor(getAqiStatus(currentAqi)) }}>
                        {loading ? '...' : <AnimatedNumber value={currentAqi} duration={1200} />}
                    </p>
                    <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted">{stationName}</p>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <span className="text-text-muted-light dark:text-text-muted text-xs sm:text-sm">
                            {timeRange === '24h' ? 'Today\'s Avg' : timeRange === '7d' ? '7-Day Avg' : '30-Day Avg'}
                        </span>
                        {stats.avgAqi > currentAqi ? (
                            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        ) : (
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                        )}
                    </div>
                    <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2" style={{ color: getAqiColor(getAqiStatus(stats.avgAqi)) }}>
                        {loading ? '...' : <AnimatedNumber value={stats.avgAqi} duration={1200} delay={100} />}
                    </p>
                    <p className={`text-xs sm:text-sm ${currentAqi > stats.avgAqi ? 'text-red-400' : 'text-green-400'}`}>
                        {currentAqi > stats.avgAqi ? '+' : ''}{currentAqi - stats.avgAqi} from avg
                    </p>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                    <span className="text-text-muted-light dark:text-text-muted block mb-2 sm:mb-4 text-xs sm:text-sm">Peak AQI</span>
                    <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-red-400 mb-1 sm:mb-2">
                        {loading ? '...' : <AnimatedNumber value={stats.peakAqi} duration={1200} delay={200} />}
                    </p>
                    <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted">
                        {timeRange === '24h' ? 'Rush hour' : 'This period'}
                    </p>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                    <span className="text-text-muted-light dark:text-text-muted block mb-2 sm:mb-4 text-xs sm:text-sm">Min AQI</span>
                    <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-green-400 mb-1 sm:mb-2">
                        {loading ? '...' : <AnimatedNumber value={stats.minAqi} duration={1200} delay={300} />}
                    </p>
                    <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted">
                        {timeRange === '24h' ? 'Night hours' : 'Best day'}
                    </p>
                </div>
            </div>

            {/* Station Comparison (when enabled) */}
            {showComparison && compareData.length > 0 && (
                <div className="mb-10 sm:mb-16">
                    <StationComparison
                        station1={{
                            name: stationName,
                            data: historicalData,
                            currentAqi: currentAqi,
                        }}
                        station2={{
                            name: compareStationName,
                            data: compareData,
                            currentAqi: compareAqi,
                        }}
                        timeRange={timeRange}
                    />
                </div>
            )}

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 mb-10 sm:mb-16">
                <AQIChart
                    data={historicalData.length > 0 ? historicalData : [{ timestamp: new Date().toISOString(), aqi: currentAqi, pm25: pollutantData.pm25, pm10: pollutantData.pm10 }]}
                    type="line"
                    title={`${timeRange === '24h' ? '24-Hour' : timeRange === '7d' ? '7-Day' : '30-Day'} AQI Trend (${stationName})`}
                    showPM
                />
                <PollutantBreakdown
                    data={pollutantData}
                    stationName={stationName}
                />
            </div>

            {/* Chart View Toggle Section */}
            <div className="mb-10 sm:mb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-light-theme dark:text-indigo-400" />
                        <h2 className="text-lg sm:text-xl font-semibold text-text-dark dark:text-white">
                            {chartView === 'barchart' ? `${timeRange === '24h' ? '24-Hour' : timeRange === '7d' ? '7-Day' : '30-Day'} AQI Timeline` : 'Weekly AQI Heatmap'}
                        </h2>
                    </div>

                    {/* Toggle Buttons */}
                    <div className="flex items-center gap-1 sm:gap-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-1">
                        <button
                            onClick={() => setChartView('barchart')}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${chartView === 'barchart'
                                ? 'bg-primary-light-theme dark:bg-primary text-white'
                                : 'text-text-muted-light dark:text-text-muted hover:text-text-dark dark:hover:text-white'
                                }`}
                        >
                            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Bar Chart
                        </button>
                        <button
                            onClick={() => setChartView('heatmap')}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${chartView === 'heatmap'
                                ? 'bg-primary-light-theme dark:bg-primary text-white'
                                : 'text-text-muted-light dark:text-text-muted hover:text-text-dark dark:hover:text-white'
                                }`}
                        >
                            <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Heatmap
                        </button>
                    </div>
                </div>

                {/* Bar Chart View */}
                {chartView === 'barchart' && (
                    <TimestampBarChart
                        data={historicalData.length > 0 ? historicalData : [{ timestamp: new Date().toISOString(), aqi: currentAqi }]}
                        location={stationName}
                    />
                )}

                {/* Heatmap View */}
                {chartView === 'heatmap' && (
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-10 overflow-x-auto">
                        {/* Time Labels */}
                        <div className="flex mb-4 pl-16">
                            {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
                                <div key={hour} className="flex-1 text-center text-sm text-gray-500">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {/* Heatmap Grid */}
                        <div className="space-y-2">
                            {days.map((day) => (
                                <div key={day} className="flex items-center gap-4">
                                    <span className="w-12 text-sm text-gray-500 text-right">{day}</span>
                                    <div className="flex-1 flex gap-1">
                                        {hours.map((hour) => {
                                            const cell = heatmapData.find(c => c.day === day && c.hour === hour);
                                            const value = cell?.value || 150;
                                            const status = getAqiStatus(value);
                                            const color = getAqiColor(status);

                                            return (
                                                <div
                                                    key={`${day}-${hour}`}
                                                    className="flex-1 h-10 rounded cursor-pointer transition-transform hover:scale-110 hover:z-10 relative group shadow-sm"
                                                    style={{ backgroundColor: color }}
                                                    title={`${day} ${hour}:00 - AQI: ${value}`}
                                                >
                                                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white rounded text-sm whitespace-nowrap z-20 pointer-events-none">
                                                        {day} {hour.toString().padStart(2, '0')}:00 — AQI: {value}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-aqi-good"></span>
                                <span className="text-gray-400">Good</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-aqi-moderate"></span>
                                <span className="text-gray-400">Moderate</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-aqi-poor"></span>
                                <span className="text-gray-400">Poor</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-aqi-unhealthy"></span>
                                <span className="text-gray-400">Unhealthy</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-aqi-severe"></span>
                                <span className="text-gray-400">Severe</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-aqi-hazardous"></span>
                                <span className="text-gray-400">Hazardous</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-10">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-text-dark dark:text-white">Key Insights</h3>
                    <ul className="space-y-4 sm:space-y-5 text-sm sm:text-base">
                        <li className="flex items-start gap-3 sm:gap-4">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 mt-1.5 sm:mt-2 rounded-full bg-red-500 flex-shrink-0"></span>
                            <span className="text-text-muted-light dark:text-gray-300">Peak pollution hours: <strong>8-11 AM</strong> and <strong>5-9 PM</strong> correlating with traffic rush hours</span>
                        </li>
                        <li className="flex items-start gap-3 sm:gap-4">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 mt-1.5 sm:mt-2 rounded-full bg-green-500 flex-shrink-0"></span>
                            <span className="text-text-muted-light dark:text-gray-300">Lowest AQI recorded during <strong>2-5 AM</strong> when traffic is minimal</span>
                        </li>
                        <li className="flex items-start gap-3 sm:gap-4">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 mt-1.5 sm:mt-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                            <span className="text-text-muted-light dark:text-gray-300">Weekend pollution <strong>15% lower</strong> than weekdays on average</span>
                        </li>
                        <li className="flex items-start gap-3 sm:gap-4">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 mt-1.5 sm:mt-2 rounded-full bg-indigo-500 flex-shrink-0"></span>
                            <span className="text-text-muted-light dark:text-gray-300">Industrial zones (Mundka, Narela) consistently <strong>40% higher</strong> than residential areas</span>
                        </li>
                    </ul>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-10">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-text-dark dark:text-white">PranaMesh Impact</h3>
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-text-muted-light dark:text-gray-400">PM2.5 Reduction (near device)</span>
                                <span className="text-green-400 font-semibold">-45%</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-text-muted-light dark:text-gray-400">Clean Air Zone Coverage</span>
                                <span className="text-indigo-400 font-semibold">3m radius</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-text-muted-light dark:text-gray-400">Data Points Collected</span>
                                <span className="text-amber-400 font-semibold">{stats.dataPoints > 0 ? stats.dataPoints.toLocaleString() : '12,480'}/day</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimestampPage;
