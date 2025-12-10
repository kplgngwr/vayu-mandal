'use client';

import { useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { useTheme } from './ThemeProvider';

// Register Chart.js components for Radar chart
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface PollutantData {
    pm25: number;
    pm10: number;
    co?: number;
    no2?: number;
    so2?: number;
    o3?: number;
}

interface PollutantBreakdownProps {
    data: PollutantData;
    stationName?: string;
}

// Standard limits for pollutants (Indian NAAQS)
const POLLUTANT_LIMITS = {
    pm25: 60,   // µg/m³ (24-hour)
    pm10: 100,  // µg/m³ (24-hour)
    co: 4,      // mg/m³ (8-hour)
    no2: 80,    // µg/m³ (24-hour)
    so2: 80,    // µg/m³ (24-hour)
    o3: 180,    // µg/m³ (8-hour)
};

const PollutantBreakdown = ({ data, stationName = 'Delhi' }: PollutantBreakdownProps) => {
    const { theme } = useTheme();

    // Normalize pollutant values to percentage of limit
    const normalizedData = useMemo(() => [
        Math.min((data.pm25 / POLLUTANT_LIMITS.pm25) * 100, 150),
        Math.min((data.pm10 / POLLUTANT_LIMITS.pm10) * 100, 150),
        Math.min(((data.co || 1.5) / POLLUTANT_LIMITS.co) * 100, 150),
        Math.min(((data.no2 || 45) / POLLUTANT_LIMITS.no2) * 100, 150),
        Math.min(((data.so2 || 15) / POLLUTANT_LIMITS.so2) * 100, 150),
        Math.min(((data.o3 || 30) / POLLUTANT_LIMITS.o3) * 100, 150),
    ], [data]);

    const getStatus = (percentage: number) => {
        if (percentage <= 50) return { label: 'Good', color: '#22c55e' };
        if (percentage <= 100) return { label: 'Moderate', color: '#f59e0b' };
        return { label: 'High', color: '#ef4444' };
    };

    // Theme colors
    const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const chartData = {
        labels: ['PM2.5', 'PM10', 'CO', 'NO₂', 'SO₂', 'O₃'],
        datasets: [
            {
                label: 'Current Level (% of limit)',
                data: normalizedData,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                pointBackgroundColor: normalizedData.map(v => getStatus(v).color),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
            },
            {
                label: 'Safe Limit',
                data: [100, 100, 100, 100, 100, 100],
                backgroundColor: 'transparent',
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom' as const,
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
                callbacks: {
                    label: (context: { datasetIndex: number; raw: unknown; label: string }) => {
                        if (context.datasetIndex === 1) return 'Safe limit: 100%';
                        const pollutant = context.label.toLowerCase().replace('₂', '2').replace('₃', '3') as keyof PollutantData;
                        const actualValue = data[pollutant] || 0;
                        const rawValue = typeof context.raw === 'number' ? context.raw : 0;
                        const status = getStatus(rawValue);
                        return `${actualValue} (${Math.round(rawValue)}% of limit) - ${status.label}`;
                    },
                },
            },
        },
        scales: {
            r: {
                angleLines: {
                    color: gridColor,
                },
                grid: {
                    color: gridColor,
                },
                pointLabels: {
                    color: textColor,
                    font: { size: 12, weight: 'normal' as const },
                },
                ticks: {
                    color: textColor,
                    backdropColor: 'transparent',
                    stepSize: 50,
                },
                suggestedMin: 0,
                suggestedMax: 150,
            },
        },
    };

    // Pollutant values display
    const pollutants = [
        { key: 'pm25', label: 'PM2.5', value: data.pm25, unit: 'µg/m³' },
        { key: 'pm10', label: 'PM10', value: data.pm10, unit: 'µg/m³' },
        { key: 'co', label: 'CO', value: data.co || 1.5, unit: 'mg/m³' },
        { key: 'no2', label: 'NO₂', value: data.no2 || 45, unit: 'µg/m³' },
        { key: 'so2', label: 'SO₂', value: data.so2 || 15, unit: 'µg/m³' },
        { key: 'o3', label: 'O₃', value: data.o3 || 30, unit: 'µg/m³' },
    ];

    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-text-dark dark:text-white">Pollutant Breakdown</h3>
                    <p className="text-sm text-text-muted-light dark:text-text-muted">{stationName}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-text-muted-light dark:text-text-muted">Good</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 ml-2"></span>
                    <span className="text-text-muted-light dark:text-text-muted">Moderate</span>
                    <span className="w-2 h-2 rounded-full bg-red-500 ml-2"></span>
                    <span className="text-text-muted-light dark:text-text-muted">High</span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[280px] mb-6">
                <Radar data={chartData} options={options} />
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {pollutants.map((p) => {
                    const percentage = (p.value / POLLUTANT_LIMITS[p.key as keyof typeof POLLUTANT_LIMITS]) * 100;
                    const status = getStatus(percentage);
                    return (
                        <div key={p.key} className="text-center p-3 rounded-lg bg-white/5 dark:bg-white/5">
                            <p className="text-xs text-text-muted-light dark:text-text-muted mb-1">{p.label}</p>
                            <p className="text-lg font-bold" style={{ color: status.color }}>
                                {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                            </p>
                            <p className="text-[10px] text-text-muted-light dark:text-text-muted">{p.unit}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PollutantBreakdown;
