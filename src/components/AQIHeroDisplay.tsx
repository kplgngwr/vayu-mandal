'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAqiStatus, getAqiLabel } from '@/utils/aqi-utils';

interface AQIData {
    aqi: number;
    pm25: number;
    pm10: number;
    status: string;
    lastUpdated: string;
}

interface WeatherData {
    temperature: number;
    humidity: number;
    windSpeed: number;
    source: string;
}

// AQI status color from aqi.in (exact RGB values)
function getAqiStatusColor(status: string): string {
    switch (status) {
        case 'good': return 'rgb(89, 182, 31)';
        case 'moderate': case 'satisfactory': return 'rgb(238, 199, 50)';
        case 'poor': return 'rgb(234, 140, 52)';
        case 'unhealthy': return 'rgb(233, 84, 120)';
        case 'severe': return 'rgb(179, 63, 186)';
        case 'hazardous': return 'rgb(201, 32, 51)';
        default: return 'rgb(234, 140, 52)';
    }
}

// Masked Character SVG Component (similar to aqi.in mascot)
function MaskedCharacter() {
    return (
        <svg
            width="120"
            height="160"
            viewBox="0 0 120 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                position: 'absolute',
                bottom: '50px',
                right: '35%',
                opacity: 0.9,
                zIndex: 5,
            }}
        >
            {/* Hair */}
            <ellipse cx="60" cy="28" rx="28" ry="22" fill="#2D1B4E" />
            <path d="M32 28 Q30 15 45 10 Q60 5 75 10 Q90 15 88 28" fill="#2D1B4E" />

            {/* Face */}
            <ellipse cx="60" cy="42" rx="22" ry="20" fill="#F5D0B5" />

            {/* Eyes */}
            <ellipse cx="52" cy="38" rx="4" ry="5" fill="#2D1B4E" />
            <ellipse cx="68" cy="38" rx="4" ry="5" fill="#2D1B4E" />
            <circle cx="53" cy="37" r="1.5" fill="white" />
            <circle cx="69" cy="37" r="1.5" fill="white" />

            {/* Eyebrows - worried expression */}
            <path d="M46 32 Q52 29 56 32" stroke="#2D1B4E" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M64 32 Q68 29 74 32" stroke="#2D1B4E" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Mask */}
            <path d="M38 46 Q40 42 60 40 Q80 42 82 46 L80 62 Q60 70 40 62 Z" fill="#F5C542" />
            <path d="M38 50 L82 50" stroke="#E5A832" strokeWidth="1" />
            <path d="M38 55 L82 55" stroke="#E5A832" strokeWidth="1" />
            <ellipse cx="45" cy="52" rx="3" ry="4" fill="#E5A832" />
            <ellipse cx="75" cy="52" rx="3" ry="4" fill="#E5A832" />

            {/* Ears */}
            <ellipse cx="38" cy="42" rx="4" ry="6" fill="#F5D0B5" />
            <ellipse cx="82" cy="42" rx="4" ry="6" fill="#F5D0B5" />

            {/* Body - Kurta/Shirt */}
            <path d="M40 65 L35 110 L85 110 L80 65 Q60 70 40 65" fill="#6B4BA3" />

            {/* Arms */}
            <path d="M35 70 L20 95 L25 100 L42 80" fill="#6B4BA3" />
            <path d="M85 70 L100 95 L95 100 L78 80" fill="#6B4BA3" />

            {/* Hands */}
            <ellipse cx="22" cy="98" rx="6" ry="5" fill="#F5D0B5" />
            <ellipse cx="98" cy="98" rx="6" ry="5" fill="#F5D0B5" />

            {/* Legs */}
            <rect x="42" y="110" width="14" height="35" fill="#4A3580" rx="3" />
            <rect x="64" y="110" width="14" height="35" fill="#4A3580" rx="3" />

            {/* Feet */}
            <ellipse cx="49" cy="148" rx="10" ry="5" fill="#3D2E66" />
            <ellipse cx="71" cy="148" rx="10" ry="5" fill="#3D2E66" />

            {/* Subtle breathing animation on chest area */}
            <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 2; 0 0"
                dur="2s"
                repeatCount="indefinite"
            />
        </svg>
    );
}

// Cloud SVG with inline animation
function AnimatedClouds() {
    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 2400 400"
                preserveAspectRatio="xMidYMid slice"
                style={{
                    width: '200%',
                    height: '100%',
                    opacity: 0.2,
                }}
            >
                <defs>
                    <filter id="cloud-blur-filter">
                        <feGaussianBlur stdDeviation="3" />
                    </filter>
                </defs>
                <g filter="url(#cloud-blur-filter)">
                    {/* First set of clouds */}
                    <g>
                        <animateTransform
                            attributeName="transform"
                            type="translate"
                            from="0 0"
                            to="-1200 0"
                            dur="60s"
                            repeatCount="indefinite"
                        />
                        <path fill="white" d="M150,150 Q180,100 230,120 Q280,80 340,120 Q400,90 430,140 Q460,120 500,150 Q470,200 400,190 Q350,220 280,190 Q220,210 180,180 Q140,190 150,150 Z" />
                        <path fill="white" d="M500,200 Q530,160 570,175 Q610,140 660,175 Q720,150 760,190 Q800,170 830,200 Q810,240 760,235 Q720,260 660,235 Q610,255 570,230 Q530,245 500,200 Z" />
                        <path fill="white" d="M850,130 Q890,80 950,110 Q1010,70 1070,110 Q1130,80 1180,130 Q1220,110 1260,140 Q1240,180 1180,175 Q1130,200 1070,175 Q1010,195 950,170 Q890,190 850,130 Z" />
                        {/* Duplicate for seamless loop */}
                        <path fill="white" d="M1350,150 Q1380,100 1430,120 Q1480,80 1540,120 Q1600,90 1630,140 Q1660,120 1700,150 Q1670,200 1600,190 Q1550,220 1480,190 Q1420,210 1380,180 Q1340,190 1350,150 Z" />
                        <path fill="white" d="M1700,200 Q1730,160 1770,175 Q1810,140 1860,175 Q1920,150 1960,190 Q2000,170 2030,200 Q2010,240 1960,235 Q1920,260 1860,235 Q1810,255 1770,230 Q1730,245 1700,200 Z" />
                        <path fill="white" d="M2050,130 Q2090,80 2150,110 Q2210,70 2270,110 Q2330,80 2380,130 Q2420,110 2460,140 Q2440,180 2380,175 Q2330,200 2270,175 Q2210,195 2150,170 Q2090,190 2050,130 Z" />
                    </g>
                </g>
            </svg>
        </div>
    );
}

// City Silhouette Background
function CitySilhouette() {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '160px',
                pointerEvents: 'none',
                zIndex: 1,
            }}
        >
            <svg
                viewBox="0 0 1200 160"
                preserveAspectRatio="xMidYMax slice"
                style={{ width: '100%', height: '100%', opacity: 0.15 }}
            >
                {/* Buildings silhouette */}
                <path
                    d="M0,160 L0,120 L30,120 L30,100 L50,100 L50,80 L60,80 L60,60 L80,60 L80,80 L100,80 L100,60 L110,60 L110,40 L130,40 L130,60 L150,60 L150,80 L180,80 L180,100 L200,100 L200,70 L220,70 L220,50 L250,50 L250,70 L280,70 L280,90 L320,90 L320,70 L340,70 L340,40 L360,40 L360,30 L380,30 L380,50 L400,50 L400,80 L420,80 L420,100 L450,100 L450,60 L470,60 L470,40 L500,40 L500,60 L530,60 L530,80 L560,80 L560,50 L580,50 L580,30 L600,30 L600,50 L620,50 L620,80 L650,80 L650,100 L680,100 L680,70 L700,70 L700,50 L730,50 L730,70 L760,70 L760,90 L790,90 L790,60 L820,60 L820,40 L850,40 L850,60 L880,60 L880,80 L920,80 L920,100 L950,100 L950,70 L980,70 L980,50 L1010,50 L1010,70 L1040,70 L1040,90 L1070,90 L1070,110 L1100,110 L1100,90 L1130,90 L1130,120 L1160,120 L1160,100 L1200,100 L1200,160 Z"
                    fill="currentColor"
                    className="text-purple-900"
                />
                {/* Some dome structures - India Gate style */}
                <ellipse cx="300" cy="95" rx="25" ry="15" fill="currentColor" className="text-purple-900" />
                <rect x="285" y="95" width="30" height="30" fill="currentColor" className="text-purple-900" />
                <ellipse cx="700" cy="85" rx="30" ry="18" fill="currentColor" className="text-purple-900" />
                <rect x="680" y="85" width="40" height="40" fill="currentColor" className="text-purple-900" />
                {/* Minarets */}
                <rect x="450" y="50" width="8" height="60" fill="currentColor" className="text-purple-900" />
                <ellipse cx="454" cy="50" rx="6" ry="8" fill="currentColor" className="text-purple-900" />
                <rect x="900" y="60" width="8" height="50" fill="currentColor" className="text-purple-900" />
                <ellipse cx="904" cy="60" rx="6" ry="8" fill="currentColor" className="text-purple-900" />
            </svg>
        </div>
    );
}

// AQI Scale component
function AQIScale({ currentAqi }: { currentAqi: number }) {
    const getIndicatorPosition = () => {
        if (currentAqi <= 50) return (currentAqi / 50) * 16.66;
        if (currentAqi <= 100) return 16.66 + ((currentAqi - 50) / 50) * 16.66;
        if (currentAqi <= 200) return 33.32 + ((currentAqi - 100) / 100) * 16.66;
        if (currentAqi <= 300) return 49.98 + ((currentAqi - 200) / 100) * 16.66;
        if (currentAqi <= 400) return 66.64 + ((currentAqi - 300) / 100) * 16.66;
        if (currentAqi <= 500) return 83.3 + ((currentAqi - 400) / 100) * 16.66;
        return 100;
    };

    const scales = [
        { label: 'Good', color: '#59B61F', max: 50 },
        { label: 'Moderate', color: '#EEC732', max: 100 },
        { label: 'Poor', color: '#EA8C34', max: 200 },
        { label: 'Unhealthy', color: '#E95478', max: 300 },
        { label: 'Severe', color: '#B33FBA', max: 400 },
        { label: 'Hazardous', color: '#C92033', max: '500+' },
    ];

    const indicatorPosition = getIndicatorPosition();
    const currentScale = scales.find((s, i) => {
        if (i === 0) return currentAqi <= 50;
        if (i === 1) return currentAqi <= 100;
        if (i === 2) return currentAqi <= 200;
        if (i === 3) return currentAqi <= 300;
        if (i === 4) return currentAqi <= 400;
        return true;
    });

    return (
        <div className="w-full relative">
            <div className="flex w-full">
                {scales.map((scale, index) => (
                    <div key={scale.label} className="flex-1 flex flex-col relative">
                        <span className="text-xs sm:text-sm font-semibold text-center mb-1 text-gray-800 line-clamp-1">
                            {scale.label}
                        </span>
                        <div
                            className={`h-2 relative ${index === 0 ? 'rounded-l-full' : ''} ${index === scales.length - 1 ? 'rounded-r-full' : ''}`}
                            style={{ backgroundColor: scale.color }}
                        />
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                            {index === 0 && <span>0</span>}
                            <span className="ml-auto">{scale.max}</span>
                        </div>
                    </div>
                ))}
            </div>
            {/* Indicator */}
            <div
                className="absolute w-3 h-3 bg-white rounded-full border-[3px] shadow-md transition-all duration-500"
                style={{
                    left: `${indicatorPosition}%`,
                    borderColor: currentScale?.color || '#EA8C34',
                    top: '24px',
                    transform: 'translateX(-50%)',
                }}
            />
        </div>
    );
}

export default function AQIHeroDisplay() {
    const [aqiData, setAqiData] = useState<AQIData | null>(null);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchAQI = async (isInitial: boolean) => {
            try {
                if (!isInitial) setIsRefreshing(true);
                const response = await fetch('/api/aqi');

                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }

                const data = await response.json();

                if (isMounted && data.success && data.stations && data.stations.length > 0) {
                    const totalAqi = data.stations.reduce((sum: number, s: { aqi: number }) => sum + s.aqi, 0);
                    const totalPm25 = data.stations.reduce((sum: number, s: { pollutants: { pm25: number } }) => sum + (s.pollutants?.pm25 || 0), 0);
                    const totalPm10 = data.stations.reduce((sum: number, s: { pollutants: { pm10: number } }) => sum + (s.pollutants?.pm10 || 0), 0);

                    const avgAqi = Math.round(totalAqi / data.stations.length);

                    setAqiData({
                        aqi: avgAqi,
                        pm25: Math.round(totalPm25 / data.stations.length),
                        pm10: Math.round(totalPm10 / data.stations.length),
                        status: getAqiStatus(avgAqi),
                        lastUpdated: data.lastUpdated,
                    });
                    setLastFetch(new Date());
                }
            } catch {
                if (isMounted) {
                    setAqiData(prev => prev ?? {
                        aqi: 287,
                        pm25: 196,
                        pm10: 315,
                        status: 'severe',
                        lastUpdated: new Date().toISOString(),
                    });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setIsRefreshing(false);
                }
            }
        };

        const fetchWeather = async () => {
            try {
                const response = await fetch('/api/weather');

                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }

                const data = await response.json();

                if (isMounted && data.success) {
                    setWeatherData({
                        temperature: Math.round(data.temperature),
                        humidity: Math.round(data.humidity),
                        windSpeed: Math.round(data.windSpeed),
                        source: data.source,
                    });
                }
            } catch {
                if (isMounted) {
                    setWeatherData(prev => prev ?? {
                        temperature: 20,
                        humidity: 50,
                        windSpeed: 5,
                        source: 'fallback',
                    });
                }
            }
        };

        fetchAQI(true);
        fetchWeather();

        const interval = setInterval(() => {
            fetchAQI(false);
            fetchWeather();
        }, 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const getStatusColor = useCallback((status: string) => {
        switch (status) {
            case 'good': return '#59B61F';
            case 'moderate': case 'satisfactory': return '#EEC732';
            case 'poor': return '#EA8C34';
            case 'unhealthy': return '#E95478';
            case 'severe': return '#B33FBA';
            case 'hazardous': return '#C92033';
            default: return '#EA8C34';
        }
    }, []);

    const formatLastUpdated = useCallback((date: Date) => {
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    }, []);

    const displayAqi = aqiData?.aqi ?? 287;
    const displayPm25 = aqiData?.pm25 ?? 196;
    const displayPm10 = aqiData?.pm10 ?? 315;
    const displayStatus = aqiData?.status ?? 'severe';
    const statusColor = getStatusColor(displayStatus);
    const aqiBackgroundColor = getAqiStatusColor(displayStatus);

    return (
        <div className="relative overflow-hidden">
            <div
                className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] overflow-hidden bg-white dark:bg-dark_bg"
            >
                {/* AQI Status Color Gradient Overlay - exactly like aqi.in */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(360deg, ${aqiBackgroundColor} 0%, transparent 100%)`,
                        opacity: 0.87,
                    }}
                />
                {/* City Silhouette */}
                <CitySilhouette />

                {/* Animated Clouds */}
                <AnimatedClouds />

                {/* Masked Character */}
                <MaskedCharacter />

                {/* AQI Status Colored Stripe at Bottom */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-2"
                    style={{ backgroundColor: statusColor }}
                />

                {/* Content */}
                <div className="relative z-10 w-full h-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 lg:py-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center justify-between">
                            {/* Left Section - AQI Value and Scale */}
                            <div className="flex-1 w-full lg:max-w-2xl">
                                {/* Live AQI Header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="relative w-3 h-3">
                                        <span className="absolute inset-0 rounded-full bg-red-500" />
                                        <span className="absolute inset-0 rounded-full bg-red-500 live-pulse" />
                                    </div>
                                    <span className="text-gray-800 font-bold text-lg">Live AQI</span>
                                    {isRefreshing && (
                                        <span className="ml-2 text-gray-600 text-sm">Updating...</span>
                                    )}
                                </div>

                                {/* AQI Value and Status */}
                                <div className="flex flex-wrap items-center gap-6 sm:gap-10 mb-6">
                                    <div className="flex flex-col">
                                        <span
                                            className="text-7xl sm:text-8xl lg:text-9xl font-extrabold leading-none"
                                            style={{ color: '#1a1a2e' }}
                                        >
                                            {loading ? '...' : displayAqi}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-gray-700 font-medium text-lg">Air Quality is</span>
                                        <div
                                            className="relative rounded-full px-6 py-2 shadow-lg"
                                            style={{ backgroundColor: statusColor }}
                                        >
                                            <span
                                                className="text-2xl sm:text-3xl font-bold capitalize text-white"
                                            >
                                                {loading ? '...' : getAqiLabel(displayStatus as 'good' | 'moderate' | 'poor' | 'unhealthy' | 'severe' | 'hazardous')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* PM Values - matching aqi.in style */}
                                <div className="flex flex-wrap gap-8 sm:gap-12 mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-gray-700 text-base">PM10 :</span>
                                        <span className="font-bold text-2xl text-gray-900">{loading ? '...' : displayPm10}</span>
                                        <span className="text-gray-600 text-sm">µg/m³</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-gray-700 text-base">PM2.5 :</span>
                                        <span className="font-bold text-2xl text-gray-900">{loading ? '...' : displayPm25}</span>
                                        <span className="text-gray-600 text-sm">µg/m³</span>
                                    </div>
                                </div>

                                {/* AQI Scale */}
                                <div className="w-full mb-6">
                                    <AQIScale currentAqi={displayAqi} />
                                </div>

                                {/* Explore Live Map Button */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/mapping"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800/80 hover:bg-gray-900 rounded-lg text-white font-bold text-base transition-all hover:scale-105 shadow-lg"
                                    >
                                        <span className="material-symbols-outlined">map</span>
                                        <span>Explore the Live Map</span>
                                    </Link>
                                    <Link
                                        href="/reports"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-700/90 hover:bg-purple-800 rounded-lg text-white font-bold text-base transition-all hover:scale-105 shadow-lg"
                                    >
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        <span>Get Personalized Reports & Suggestions</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Right Section - Weather Card matching aqi.in style */}
                            <div className="w-full lg:w-auto lg:min-w-[320px]">
                                <div
                                    className="rounded-2xl overflow-hidden shadow-xl"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.9) 100%)',
                                        backdropFilter: 'blur(16px)',
                                        WebkitBackdropFilter: 'blur(16px)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                                    }}
                                >
                                    {/* Weather Header */}
                                    <div className="flex items-center justify-between p-5 sm:p-6">
                                        <div className="flex items-center gap-4">
                                            <span className="material-symbols-outlined text-5xl text-sky-500 drop-shadow">
                                                cloud
                                            </span>
                                            <div>
                                                <p className="text-4xl sm:text-5xl font-bold text-gray-800">
                                                    {weatherData ? `${weatherData.temperature}` : '...'}<span className="text-2xl font-normal text-gray-600">°C</span>
                                                </p>
                                                <p className="text-gray-600 font-medium">
                                                    Mist
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                            title="View details"
                                        >
                                            <span className="material-symbols-outlined text-gray-600 text-xl" style={{ transform: 'rotate(-45deg)' }}>
                                                arrow_forward
                                            </span>
                                        </button>
                                    </div>

                                    {/* Weather Details */}
                                    <div
                                        className="p-4 sm:p-5 flex gap-4 sm:gap-6 justify-between"
                                        style={{
                                            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                                            background: 'rgba(248, 250, 252, 0.8)',
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-xl text-emerald-500">
                                                humidity_percentage
                                            </span>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Humidity</p>
                                                <p className="font-bold text-gray-800">{weatherData ? `${weatherData.humidity} %` : '...'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-xl text-sky-500">
                                                air
                                            </span>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Wind Speed</p>
                                                <p className="font-bold text-gray-800">{weatherData ? `${weatherData.windSpeed} km/h` : '...'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-xl text-amber-500">
                                                wb_sunny
                                            </span>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">UV Index</p>
                                                <p className="font-bold text-gray-800">0</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Last Updated */}
                                <div className="mt-4 text-center text-white/80 text-sm italic drop-shadow-sm">
                                    <span>Last Updated: </span>
                                    <strong>{lastFetch ? formatLastUpdated(lastFetch) : 'Loading...'}</strong>
                                    <span> (Local Time)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
