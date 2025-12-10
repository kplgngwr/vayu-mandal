'use client';

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { useTheme } from './ThemeProvider';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { HistoricalDataPoint } from '@/types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface StationComparisonProps {
    station1: {
        name: string;
        data: HistoricalDataPoint[];
        currentAqi: number;
    };
    station2: {
        name: string;
        data: HistoricalDataPoint[];
        currentAqi: number;
    };
    timeRange: '24h' | '7d' | '30d';
}

const StationComparison = ({ station1, station2, timeRange }: StationComparisonProps) => {
    const { theme } = useTheme();

    // Calculate stats for each station
    const stats = useMemo(() => {
        const calcStats = (data: HistoricalDataPoint[]) => {
            if (data.length === 0) return { avg: 0, min: 0, max: 0, trend: 0 };
            const values = data.map(d => d.aqi);
            const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
            const min = Math.min(...values);
            const max = Math.max(...values);
            // Compare first half to second half for trend
            const halfLen = Math.floor(values.length / 2);
            const firstHalfAvg = values.slice(0, halfLen).reduce((a, b) => a + b, 0) / halfLen;
            const secondHalfAvg = values.slice(halfLen).reduce((a, b) => a + b, 0) / (values.length - halfLen);
            const trend = Math.round(secondHalfAvg - firstHalfAvg);
            return { avg, min, max, trend };
        };

        return {
            station1: calcStats(station1.data),
            station2: calcStats(station2.data),
        };
    }, [station1.data, station2.data]);

    // Format labels based on time range
    const formatLabel = (timestamp: string) => {
        const date = new Date(timestamp);
        if (timeRange === '24h') {
            return date.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true });
        } else if (timeRange === '7d') {
            return date.toLocaleDateString('en-IN', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
    };

    // Use the longer dataset for labels
    const labels = (station1.data.length >= station2.data.length ? station1.data : station2.data)
        .map(d => formatLabel(d.timestamp));

    // Theme colors
    const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    const chartData = {
        labels,
        datasets: [
            {
                label: station1.name,
                data: station1.data.map(d => d.aqi),
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
            },
            {
                label: station2.name,
                data: station2.data.map(d => d.aqi),
                borderColor: 'rgba(236, 72, 153, 1)',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                labels: {
                    color: textColor,
                    padding: 20,
                    usePointStyle: true,
                },
            },
            tooltip: {
                backgroundColor: theme === 'dark' ? 'rgba(15, 22, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: theme === 'dark' ? '#fff' : '#1f2937',
                bodyColor: theme === 'dark' ? '#fff' : '#1f2937',
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            x: {
                grid: { color: gridColor },
                ticks: {
                    color: textColor,
                    font: { size: 11 },
                    maxTicksLimit: 12,
                },
            },
            y: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { size: 11 } },
                beginAtZero: true,
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    const renderTrendIcon = (trend: number) => {
        if (trend > 5) return <TrendingUp className="w-4 h-4 text-red-400" />;
        if (trend < -5) return <TrendingDown className="w-4 h-4 text-green-400" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    const StatCard = ({ label, value, color, trend }: { label: string; value: number; color: string; trend?: number }) => (
        <div className="text-center">
            <p className="text-xs text-text-muted-light dark:text-text-muted mb-1">{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
            {trend !== undefined && (
                <div className="flex items-center justify-center gap-1 mt-1">
                    {renderTrendIcon(trend)}
                    <span className={`text-xs ${trend > 0 ? 'text-red-400' : trend < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                        {trend > 0 ? '+' : ''}{trend}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-dark dark:text-white">Station Comparison</h3>
                <span className="text-xs text-text-muted-light dark:text-text-muted bg-white/5 px-3 py-1 rounded-full">
                    {timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                </span>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Station 1 */}
                <div className="p-4 rounded-xl border-2 border-indigo-500/30 bg-indigo-500/5">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                        <span className="font-medium text-text-dark dark:text-white text-sm">{station1.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <StatCard label="Current" value={station1.currentAqi} color="#6366f1" />
                        <StatCard label="Avg" value={stats.station1.avg} color="#6366f1" trend={stats.station1.trend} />
                        <StatCard label="Peak" value={stats.station1.max} color="#ef4444" />
                    </div>
                </div>

                {/* Station 2 */}
                <div className="p-4 rounded-xl border-2 border-pink-500/30 bg-pink-500/5">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                        <span className="font-medium text-text-dark dark:text-white text-sm">{station2.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <StatCard label="Current" value={station2.currentAqi} color="#ec4899" />
                        <StatCard label="Avg" value={stats.station2.avg} color="#ec4899" trend={stats.station2.trend} />
                        <StatCard label="Peak" value={stats.station2.max} color="#ef4444" />
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[300px]">
                <Line data={chartData} options={options} />
            </div>

            {/* Difference Summary */}
            <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted-light dark:text-text-muted">Average Difference</span>
                    <span className={`font-semibold ${stats.station1.avg > stats.station2.avg ? 'text-indigo-400' : 'text-pink-400'}`}>
                        {station1.name} is {Math.abs(stats.station1.avg - stats.station2.avg)} AQI {stats.station1.avg > stats.station2.avg ? 'higher' : 'lower'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StationComparison;
