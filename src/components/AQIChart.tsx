'use client';

import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import type { HistoricalDataPoint } from '@/types';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AQIChartProps {
    data: HistoricalDataPoint[];
    type: 'line' | 'bar';
    title: string;
    showPM?: boolean;
}

import { useTheme } from './ThemeProvider';

// ... (imports remain)

const AQIChart = ({ data, type, title, showPM = false }: AQIChartProps) => {
    const { theme } = useTheme();

    // Theme-based colors
    const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const titleColor = theme === 'dark' ? '#fff' : '#1f2937';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const tooltipBg = theme === 'dark' ? 'rgba(15, 22, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipText = theme === 'dark' ? '#fff' : '#1f2937';
    const tooltipBody = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    const tooltipBorder = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const labels = data.map((d) => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', hour12: true });
    });

    const getGradient = (ctx: CanvasRenderingContext2D, chartArea: { top: number; bottom: number }) => {
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        return gradient;
    };

    const chartData = {
        labels,
        datasets: [
            {
                label: 'AQI',
                data: data.map((d) => d.aqi),
                borderColor: '#6366f1',
                backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } } }) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return 'rgba(99, 102, 241, 0.3)';
                    return getGradient(ctx, chartArea);
                },
                fill: type === 'line',
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: theme === 'dark' ? '#fff' : '#fff', // Keep white border or swap
                pointBorderWidth: 2,
                pointHoverRadius: 6,
            },
            ...(showPM ? [
                {
                    label: 'PM2.5',
                    data: data.map((d) => d.pm25),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    borderDash: [5, 5],
                },
                {
                    label: 'PM10',
                    data: data.map((d) => d.pm10),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    borderDash: [5, 5],
                },
            ] : []),
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: showPM,
                position: 'top' as const,
                labels: {
                    color: textColor,
                    padding: 20,
                    font: { size: 12 },
                },
            },
            title: {
                display: true,
                text: title,
                color: titleColor,
                font: { size: 14, weight: 600 as const },
                padding: { bottom: 20 },
            },
            tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipText,
                bodyColor: tooltipBody,
                borderColor: tooltipBorder,
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
            },
        },
        scales: {
            x: {
                grid: {
                    color: gridColor,
                    drawBorder: false,
                },
                ticks: {
                    color: textColor,
                    font: { size: 11 },
                },
            },
            y: {
                grid: {
                    color: gridColor,
                    drawBorder: false,
                },
                ticks: {
                    color: textColor,
                    font: { size: 11 },
                },
                beginAtZero: true,
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 h-[350px]">
            {type === 'line' ? (
                <Line data={chartData} options={options} />
            ) : (
                <Bar data={chartData} options={options} />
            )}
        </div>
    );
};

export default AQIChart;
