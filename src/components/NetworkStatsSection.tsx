'use client';

import { useState, useEffect, useRef } from 'react';
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
import AnimatedNumber from './AnimatedNumber';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Statistics data with numeric values for animation
const statsData = [
    {
        label: 'Total Monitoring Nodes',
        numericValue: 1320,
        suffix: '',
        description: 'Delhi + Noida + Ghaziabad + Gurugram + Faridabad + Sonipat',
        icon: 'sensors',
        color: 'text-primary-light-theme dark:text-primary',
    },
    {
        label: 'Fixed Sensors Installed',
        numericValue: 480,
        suffix: '',
        description: 'Placed via GIS-based suitability model across NCR',
        icon: 'location_on',
        color: 'text-green-500 dark:text-green-400',
    },
    {
        label: 'Mobile Sensors on Vehicles',
        numericValue: 840,
        suffix: '',
        description: 'DTC buses, cluster buses, municipal garbage trucks, water tankers',
        icon: 'directions_bus',
        color: 'text-orange-500 dark:text-orange-400',
    },
    {
        label: 'Hybrid Filter Units Installed',
        numericValue: 298,
        suffix: '',
        description: 'At schools, bus stops, metro gates, parks',
        icon: 'filter_alt',
        color: 'text-purple-500 dark:text-purple-400',
    },
    {
        label: 'High-Pollution Hotspots Detected',
        numericValue: 162,
        suffix: '',
        description: 'Last 48 hours across NCR',
        icon: 'warning',
        color: 'text-red-500 dark:text-red-400',
    },
    {
        label: 'Average AQI Today',
        numericValue: 287,
        suffix: '',
        status: 'Very Poor',
        icon: 'air',
        color: 'text-aqi-severe',
    },
    {
        label: 'Sensor Network Uptime',
        numericValue: 92.4,
        suffix: '%',
        decimals: 1,
        icon: 'speed',
        color: 'text-emerald-500 dark:text-emerald-400',
    },
    {
        label: 'Active GIS Layers',
        numericValue: 22,
        suffix: '',
        description: 'elevation, traffic, industrial zones, land-use, NDVI, population, wind, thermal imagery, etc.',
        icon: 'layers',
        color: 'text-cyan-500 dark:text-cyan-400',
    },
    {
        label: 'Optimal New Sensor Sites Suggested',
        numericValue: 73,
        suffix: '',
        icon: 'add_location_alt',
        color: 'text-amber-500 dark:text-amber-400',
    },
    {
        label: 'Public Locations Protected by Hybrid Filters',
        numericValue: 94,
        suffix: '',
        icon: 'shield',
        color: 'text-teal-500 dark:text-teal-400',
    },
];

// Pollution Overview data
const pollutionOverviewData = {
    labels: ['Avg PM2.5 (24h)', 'Avg PM10 (24h)', 'Severe AQI Zones', 'Clean Zones (AQI < 100)'],
    values: [196, 315, 39, 11],
    notes: ['µg/m³', 'µg/m³', 'count of locations', 'count of locations'],
    maxValue: 350,
};

// Deployment Overview data
const deploymentOverviewData = {
    labels: ['Fixed Sensors Deployed', 'Mobile Routes Covered', 'Hybrid Filters Installed', 'Priority Sites Covered'],
    values: [480, 317, 298, 138],
    maxValue: 500,
};

export default function NetworkStatsSection() {
    const { theme } = useTheme();

    // State for scroll-triggered chart animations
    const [pollutionChartVisible, setPollutionChartVisible] = useState(false);
    const [deploymentChartVisible, setDeploymentChartVisible] = useState(false);
    const pollutionChartRef = useRef<HTMLDivElement>(null);
    const deploymentChartRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for chart animations
    useEffect(() => {
        const observerOptions = { threshold: 0.2 };

        const pollutionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !pollutionChartVisible) {
                    setPollutionChartVisible(true);
                }
            });
        }, observerOptions);

        const deploymentObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !deploymentChartVisible) {
                    setDeploymentChartVisible(true);
                }
            });
        }, observerOptions);

        if (pollutionChartRef.current) {
            pollutionObserver.observe(pollutionChartRef.current);
        }
        if (deploymentChartRef.current) {
            deploymentObserver.observe(deploymentChartRef.current);
        }

        return () => {
            pollutionObserver.disconnect();
            deploymentObserver.disconnect();
        };
    }, [pollutionChartVisible, deploymentChartVisible]);

    // Theme-based colors
    const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const tooltipBg = theme === 'dark' ? 'rgba(15, 22, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipText = theme === 'dark' ? '#fff' : '#1f2937';

    // Pollution Overview Chart - animate from 0 when visible
    const pollutionChartData = {
        labels: pollutionOverviewData.labels,
        datasets: [
            {
                label: 'Value',
                data: pollutionChartVisible ? pollutionOverviewData.values : [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',   // Red for PM2.5
                    'rgba(249, 115, 22, 0.8)', // Orange for PM10
                    'rgba(139, 92, 246, 0.8)', // Purple for Severe Zones
                    'rgba(34, 197, 94, 0.8)',  // Green for Clean Zones
                ],
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 48,
            },
        ],
    };

    // Deployment Overview Chart - animate from 0 when visible
    const deploymentChartData = {
        labels: deploymentOverviewData.labels,
        datasets: [
            {
                label: 'Count',
                data: deploymentChartVisible ? deploymentOverviewData.values : [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',  // Indigo
                    'rgba(14, 165, 233, 0.8)', // Sky blue
                    'rgba(168, 85, 247, 0.8)', // Purple
                    'rgba(20, 184, 166, 0.8)', // Teal
                ],
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 48,
            },
        ],
    };

    const getChartOptions = (maxValue: number) => ({
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        animation: {
            duration: 1500,
            easing: 'easeOutQuart' as const,
            delay: (context: { dataIndex: number }) => context.dataIndex * 200,
        },
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
            },
        },
        scales: {
            x: {
                grid: {
                    color: gridColor,
                },
                ticks: {
                    color: textColor,
                    font: { size: 12 },
                },
                border: {
                    display: false,
                },
                beginAtZero: true,
                max: maxValue,
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: textColor,
                    font: { size: 12, weight: 500 },
                },
                border: {
                    display: false,
                },
            },
        },
    });

    return (
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-16 @container">
            <div className="mx-auto max-w-7xl">
                {/* Section Header */}
                <div className="flex flex-col gap-2 mb-10">
                    <h2 className="text-3xl font-bold text-text-dark dark:text-white">
                        Network Overview
                    </h2>
                    <p className="text-text-muted-light dark:text-text-muted">
                        Real-time statistics from the PranaMesh monitoring network across Delhi-NCR
                    </p>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
                    {statsData.map((stat, index) => (
                        <div
                            key={index}
                            className="flex flex-col gap-3 p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg transition-shadow duration-300"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`material-symbols-outlined text-2xl ${stat.color}`}>
                                    {stat.icon}
                                </span>
                                <span className="text-xs font-medium text-text-muted-light dark:text-text-muted uppercase tracking-wide">
                                    {stat.label}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl font-bold ${stat.color}`}>
                                    <AnimatedNumber
                                        value={stat.numericValue}
                                        duration={1500}
                                        delay={index * 100}
                                        suffix={stat.suffix}
                                        decimals={'decimals' in stat ? (stat.decimals as number) : 0}
                                    />
                                </span>
                                {stat.status && (
                                    <span className="text-sm font-semibold text-aqi-severe bg-aqi-severe/10 px-2 py-0.5 rounded">
                                        {stat.status}
                                    </span>
                                )}
                            </div>
                            {stat.description && (
                                <p className="text-xs text-text-muted-light dark:text-text-muted line-clamp-2">
                                    {stat.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pollution Overview Chart */}
                    <div ref={pollutionChartRef} className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-2xl text-red-500 dark:text-red-400">
                                factory
                            </span>
                            <h3 className="text-xl font-bold text-text-dark dark:text-white">
                                Pollution Overview
                            </h3>
                        </div>
                        <div className="h-[280px]">
                            <Bar
                                data={pollutionChartData}
                                options={getChartOptions(pollutionOverviewData.maxValue)}
                            />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-text-muted-light dark:text-text-muted">
                            {pollutionOverviewData.labels.map((label, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="font-medium text-text-dark dark:text-white">
                                        {pollutionOverviewData.values[index]}
                                    </span>
                                    <span>{pollutionOverviewData.notes[index]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Deployment Overview Chart */}
                    <div ref={deploymentChartRef} className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-2xl text-primary-light-theme dark:text-primary">
                                deployed_code
                            </span>
                            <h3 className="text-xl font-bold text-text-dark dark:text-white">
                                Deployment Overview
                            </h3>
                        </div>
                        <div className="h-[280px]">
                            <Bar
                                data={deploymentChartData}
                                options={getChartOptions(deploymentOverviewData.maxValue)}
                            />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
                                <span className="text-text-muted-light dark:text-text-muted">Fixed Sensors</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-sky-500"></div>
                                <span className="text-text-muted-light dark:text-text-muted">Mobile Routes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
                                <span className="text-text-muted-light dark:text-text-muted">Hybrid Filters</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-teal-500"></div>
                                <span className="text-text-muted-light dark:text-text-muted">Priority Sites</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
