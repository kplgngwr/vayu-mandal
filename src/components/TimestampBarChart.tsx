'use client';

import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { useTheme } from './ThemeProvider';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface TimestampData {
    timestamp: string;
    aqi: number;
}

interface TimestampBarChartProps {
    data: TimestampData[];
    location?: string;
}

const TimestampBarChart = ({ data, location = 'AICTE Delhi' }: TimestampBarChartProps) => {
    const { theme } = useTheme();

    // Calculate min and max AQI with timestamps
    const stats = useMemo(() => {
        let minAqi = Infinity;
        let maxAqi = -Infinity;
        let minTime = '';
        let maxTime = '';

        data.forEach((d) => {
            if (d.aqi < minAqi) {
                minAqi = d.aqi;
                minTime = d.timestamp;
            }
            if (d.aqi > maxAqi) {
                maxAqi = d.aqi;
                maxTime = d.timestamp;
            }
        });

        const formatTime = (ts: string) => {
            const date = new Date(ts);
            return {
                time: date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
                date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            };
        };

        return {
            min: minAqi,
            max: maxAqi,
            minTime: formatTime(minTime),
            maxTime: formatTime(maxTime),
        };
    }, [data]);

    // Generate 48-hour data (for a more complete visualization like the reference)
    const extendedData = useMemo(() => {
        // Use existing data and extend if needed
        return data;
    }, [data]);

    // Format labels for x-axis
    const labels = extendedData.map((d) => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true });
    });

    // Get start and end dates for footer
    const startDate = new Date(extendedData[0]?.timestamp || new Date());
    const endDate = new Date(extendedData[extendedData.length - 1]?.timestamp || new Date());
    const formatDate = (date: Date) => date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Theme-based colors
    const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const tooltipBg = theme === 'dark' ? 'rgba(15, 22, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipText = theme === 'dark' ? '#fff' : '#1f2937';

    // Generate gradient colors for bars (blue to purple/pink like reference)
    const getBarColors = () => {
        return extendedData.map((d, index) => {
            const ratio = index / extendedData.length;
            // Blue to Purple gradient
            const r = Math.round(99 + (168 - 99) * ratio);
            const g = Math.round(102 + (85 - 102) * ratio);
            const b = Math.round(241 + (247 - 241) * ratio);
            return `rgb(${r}, ${g}, ${b})`;
        });
    };

    const chartData = {
        labels,
        datasets: [
            {
                label: 'AQI',
                data: extendedData.map((d) => d.aqi),
                backgroundColor: getBarColors(),
                borderRadius: 4,
                borderSkipped: false,
                barThickness: 'flex' as const,
                maxBarThickness: 24,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipText,
                bodyColor: tooltipText,
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                callbacks: {
                    title: (context: { dataIndex: number }[]) => {
                        const idx = context[0].dataIndex;
                        const date = new Date(extendedData[idx].timestamp);
                        return date.toLocaleString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });
                    },
                    label: (context: { raw: unknown }) => {
                        return `AQI: ${context.raw}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: textColor,
                    font: { size: 11 },
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 12,
                },
                border: {
                    display: false,
                },
            },
            y: {
                grid: {
                    color: gridColor,
                },
                ticks: {
                    color: textColor,
                    font: { size: 11 },
                    stepSize: 50,
                },
                border: {
                    display: false,
                },
                beginAtZero: true,
                max: Math.ceil(Math.max(...extendedData.map(d => d.aqi)) / 50) * 50 + 50,
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-8">
            {/* Header with location and Min/Max stats */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                {/* Location Badge */}
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-primary-light-theme dark:bg-primary"></span>
                    <span className="px-4 py-2 bg-surface-light dark:bg-[#1a1f35] border border-border-light dark:border-border-dark rounded-full text-sm font-medium text-text-dark dark:text-white">
                        {location}
                    </span>
                </div>

                {/* Min/Max Stats */}
                <div className="flex items-center gap-8">
                    {/* Min */}
                    <div className="flex items-center gap-4">
                        <span className="text-4xl font-bold font-display text-green-400">
                            {stats.min}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-text-dark dark:text-white">Min.</p>
                            <p className="text-xs text-text-muted-light dark:text-text-muted">
                                at {stats.minTime.time} on {stats.minTime.date}
                            </p>
                        </div>
                    </div>

                    {/* Max */}
                    <div className="flex items-center gap-4">
                        <span className="text-4xl font-bold font-display text-rose-400">
                            {stats.max}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-text-dark dark:text-white">Max.</p>
                            <p className="text-xs text-text-muted-light dark:text-text-muted">
                                at {stats.maxTime.time} on {stats.maxTime.date}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[350px] relative">
                <Bar data={chartData} options={options} />

                {/* Y-axis label */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-text-muted-light dark:text-text-muted font-medium">
                    AQI
                </div>
            </div>

            {/* Footer with date labels and Time label */}
            <div className="flex justify-between items-center mt-4 text-xs text-text-muted-light dark:text-text-muted">
                <span className="text-primary-light-theme dark:text-primary font-medium">
                    {formatDate(startDate)}
                </span>
                <span className="font-medium">Time</span>
                <span className="text-primary-light-theme dark:text-primary font-medium">
                    {formatDate(endDate)}
                </span>
            </div>
        </div>
    );
};

export default TimestampBarChart;
