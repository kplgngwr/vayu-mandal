'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { aqiStations as mockStations, busRoutes } from '@/data/mock-data';
import { getAqiColor, getAqiStatus, getAqiLabel } from '@/utils/aqi-utils';
import { MapPin, RefreshCw, Wifi, WifiOff, Search, ExternalLink, TrendingUp, Wind, ChevronDown, Bus, Zap, Building, X, ChevronUp, AlertTriangle, Heart } from 'lucide-react';
import type { AQIStation } from '@/types';
import type { BusPosition } from '@/components/AQIMap';
import { getHealthAdvisory, getTopDiseasesForAQI } from '@/data/disease-data';
import { subscribeToAQIData, mergeFirebaseDataWithStations, type FirebaseStationsData } from '@/lib/firebase-aqi-service';
import { syncFirebaseToFirestore } from '@/lib/firestore-sync';
import { isFirebaseConfigured } from '@/lib/firebase';

// Dynamic import for Google Maps (SSR issue)
const AQIMap = dynamic(() => import('@/components/AQIMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
            <div className="text-center">
                <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Loading map...</p>
            </div>
        </div>
    ),
});

type ViewMode = 'aqi' | 'electric' | 'non-electric' | 'municipal' | 'all-routes';

// AQI Scale colors and ranges
const aqiScale = [
    { min: 0, max: 50, label: 'Good', color: '#00e400' },
    { min: 51, max: 100, label: 'Moderate', color: '#ffff00' },
    { min: 101, max: 150, label: 'Poor', color: '#ff7e00' },
    { min: 151, max: 200, label: 'Unhealthy', color: '#ff0000' },
    { min: 201, max: 300, label: 'Severe', color: '#8f3f97' },
    { min: 301, max: 500, label: 'Hazardous', color: '#7e0023' },
];

const MappingPage = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('aqi');
    const [showViewDropdown, setShowViewDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number; label?: string } | null>(null);
    const [selectedStation, setSelectedStation] = useState<AQIStation | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Real-time data state
    const [stations, setStations] = useState<AQIStation[]>(mockStations);
    const [busPositions, setBusPositions] = useState<BusPosition[]>([]);

    // Realtime Firebase updates: merge incoming snapshots into local stations
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        try {
            // Dynamic import to avoid SSR issues and keep bundle lean
            (async () => {
                const mod = await import('@/lib/firebase-aqi-service');
                const { startRealtimeAQIStream, mergeFirebaseDataWithStations, isFirebaseConfigured } = mod as any;
                if (typeof isFirebaseConfigured === 'function' && isFirebaseConfigured()) {
                    unsubscribe = startRealtimeAQIStream((fbData: any) => {
                        setStations(prev => mergeFirebaseDataWithStations(prev, fbData));
                    });
                }
            })();
        } catch (e) {
            // non-fatal: mapping still works with mock/local data
            console.warn('Realtime stream init failed', e);
        }
        return () => {
            if (unsubscribe) {
                try { unsubscribe(); } catch {}
            }
        };
    }, []);
    const [isLive, setIsLive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [firebaseConnected, setFirebaseConnected] = useState(false);

    // Calculate average AQI for Delhi
    const averageAqi = useMemo(() => {
        if (stations.length === 0) return 0;
        return Math.round(stations.reduce((sum, s) => sum + s.aqi, 0) / stations.length);
    }, [stations]);

    const averageStatus = getAqiStatus(averageAqi);

    // Calculate average pollutants
    const avgPollutants = useMemo(() => {
        if (stations.length === 0) return { pm25: 0, pm10: 0, co: 0, no2: 0, o3: 0, so2: 0 };
        const sum = stations.reduce((acc, s) => ({
            pm25: acc.pm25 + (s.pollutants.pm25 || 0),
            pm10: acc.pm10 + (s.pollutants.pm10 || 0),
            co: acc.co + (s.pollutants.co || 0),
            no2: acc.no2 + (s.pollutants.no2 || 0),
            o3: acc.o3 + (s.pollutants.o3 || 0),
            so2: acc.so2 + (s.pollutants.so2 || 0),
        }), { pm25: 0, pm10: 0, co: 0, no2: 0, o3: 0, so2: 0 });

        return {
            pm25: Math.round(sum.pm25 / stations.length),
            pm10: Math.round(sum.pm10 / stations.length),
            co: Math.round((sum.co / stations.length) * 100) / 100,
            no2: Math.round(sum.no2 / stations.length),
            o3: Math.round(sum.o3 / stations.length),
            so2: Math.round(sum.so2 / stations.length),
        };
    }, [stations]);

    // Fetch AQI data from API
    const fetchAQIData = useCallback(async () => {
        try {
            const res = await fetch('/api/aqi');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.stations) {
                    setStations(data.stations);
                    setIsLive(true);
                    setLastUpdate(new Date());
                }
            }
        } catch (error) {
            console.error('Failed to fetch AQI data:', error);
            setIsLive(false);
        }
    }, []);

    // Fetch bus positions from API
    const fetchBusData = useCallback(async () => {
        try {
            const res = await fetch('/api/buses');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.positions) {
                    setBusPositions(data.positions);
                }
            }
        } catch (error) {
            console.error('Failed to fetch bus data:', error);
        }
    }, []);

    // Manual refresh
    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        await Promise.all([fetchAQIData(), fetchBusData()]);
        setIsLoading(false);
    }, [fetchAQIData, fetchBusData]);

    // Initial fetch and auto-refresh
    /* eslint-disable react-hooks/set-state-in-effect -- Intentional: initial data fetch on mount */
    useEffect(() => {
        handleRefresh();
        const aqiInterval = setInterval(fetchAQIData, 5 * 60 * 1000);
        const busInterval = setInterval(fetchBusData, 30 * 1000);
        return () => {
            clearInterval(aqiInterval);
            clearInterval(busInterval);
        };
    }, [handleRefresh, fetchAQIData, fetchBusData]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Firebase real-time subscription for dynamic updates
     
    useEffect(() => {
        if (!isFirebaseConfigured()) {
            console.log('Firebase not configured, skipping real-time subscription');
            return;
        }

        console.log('Setting up Firebase real-time subscription...');
        const unsubscribe = subscribeToAQIData((firebaseData: FirebaseStationsData) => {
            setStations(prevStations => {
                const merged = mergeFirebaseDataWithStations(prevStations, firebaseData);
                return merged;
            });
            // Mirror to Firestore for historical analysis (best-effort)
            syncFirebaseToFirestore(firebaseData);
            setFirebaseConnected(true);
            setIsLive(true);
            setLastUpdate(new Date());
            console.log('Received Firebase update');
        });

        return () => {
            unsubscribe();
            setFirebaseConnected(false);
        };
    }, []);
     

    // Filter stations by search
    const filteredStations = useMemo(() => {
        if (!searchQuery) return stations;
        return stations.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [stations, searchQuery]);

    // Handle station selection from map
    const handleStationSelect = (station: AQIStation | null) => {
        setSelectedStation(station);
        // Open sidebar on mobile when station is selected
        if (station && window.innerWidth < 768) {
            setSidebarOpen(true);
        }
    };

    // Map center change (pan/zoom) handler - update search input only if user hasn't typed
    const handleMapCenterChange = useCallback((loc: { lat: number; lng: number; label?: string } | null) => {
        if (!loc) return;
        setSearchQuery(prev => {
            if (prev && prev.trim() !== '') return prev; // don't overwrite user input
            return loc.label ?? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
        });
    }, []);

    // Get pollutant bar width (max 100%)
    const getPollutantBarWidth = (value: number, max: number) => {
        return Math.min((value / max) * 100, 100);
    };

    // Current display data (selected station or Delhi average)
    const displayData = selectedStation || {
        name: 'Delhi',
        location: 'India',
        aqi: averageAqi,
        status: averageStatus,
        pollutants: avgPollutants,
    };

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row bg-background-light dark:bg-background-dark relative">
            {/* Mobile AQI Quick View Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden fixed bottom-4 left-4 z-30 flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-lg"
            >
                <span
                    className="text-2xl font-bold"
                    style={{ color: getAqiColor(getAqiStatus(displayData.aqi)) }}
                >
                    {displayData.aqi}
                </span>
                <div className="flex flex-col items-start">
                    <span className="text-xs font-medium text-text-dark dark:text-white">{displayData.name}</span>
                    <span className="text-[10px] text-text-muted-light dark:text-text-muted">{getAqiLabel(getAqiStatus(displayData.aqi))}</span>
                </div>
                <ChevronUp className={`w-4 h-4 text-text-muted-light dark:text-text-muted transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Sidebar Backdrop */}
            <div
                className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Left Sidebar - Desktop always visible, Mobile as bottom sheet */}
            <div className={`
                md:w-[340px] md:relative md:translate-y-0
                fixed bottom-0 left-0 right-0 z-50 
                bg-surface-light dark:bg-surface-dark 
                border-t md:border-t-0 md:border-r border-border-light dark:border-border-dark 
                flex flex-col overflow-hidden
                transition-transform duration-300 ease-out
                max-h-[75vh] md:max-h-none md:h-full
                rounded-t-2xl md:rounded-none
                ${sidebarOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
            `}>
                {/* Mobile Drag Handle */}
                <div className="md:hidden flex justify-center py-2">
                    <div className="w-12 h-1 rounded-full bg-border-light dark:bg-border-dark" />
                </div>

                {/* Header */}
                <div className="p-4 md:p-5 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-primary-light-theme dark:text-primary font-bold text-lg">AQI</span>
                            <span className="text-text-dark dark:text-white font-light text-lg">Air Quality Map</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Refresh data"
                            >
                                <RefreshCw className={`w-4 h-4 text-text-muted-light dark:text-text-muted ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-text-muted-light dark:text-text-muted" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-primary-light-theme dark:text-primary" />
                        <span className="text-primary-light-theme dark:text-primary">{selectedStation ? selectedStation.name : 'Delhi'}</span>
                        {selectedStation && (
                            <button
                                onClick={() => setSelectedStation(null)}
                                className="text-text-muted-light dark:text-text-muted hover:text-text-dark dark:hover:text-white text-xs ml-auto"
                            >
                                × Clear
                            </button>
                        )}
                    </div>
                    <p className="text-text-muted-light dark:text-text-muted text-xs mt-0.5">{selectedStation ? selectedStation.location : 'India'}</p>
                </div>

                {/* AQI Display */}
                <div className="p-5 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-2 text-text-muted-light dark:text-text-muted text-xs mb-3">
                        <Wind className="w-3.5 h-3.5" />
                        <span>Air Quality Index</span>
                        {isLive ? (
                            <span className="flex items-center gap-1 text-green-500 ml-auto">
                                <Wifi className="w-3 h-3" />
                                Live
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-yellow-500 ml-auto">
                                <WifiOff className="w-3 h-3" />
                                Offline
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <span
                            className="text-6xl font-bold"
                            style={{ color: getAqiColor(getAqiStatus(displayData.aqi)) }}
                        >
                            {displayData.aqi}
                        </span>
                        <div
                            className="px-4 py-1.5 rounded-full text-sm font-medium"
                            style={{
                                backgroundColor: getAqiColor(getAqiStatus(displayData.aqi)),
                                color: displayData.aqi > 100 ? 'white' : 'black'
                            }}
                        >
                            {getAqiLabel(getAqiStatus(displayData.aqi))}
                        </div>
                    </div>

                    {lastUpdate && (
                        <p className="text-text-muted-light dark:text-text-muted text-xs mt-2">
                            Updated {lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>

                {/* Pollutants */}
                <div className="p-5 border-b border-border-light dark:border-border-dark flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        {/* CO */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-text-dark dark:text-white text-sm">CO</span>
                                <ExternalLink className="w-3 h-3 text-text-muted-light dark:text-text-muted" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-text-dark dark:text-white font-medium">{displayData.pollutants.co || avgPollutants.co}</span>
                                <span className="text-text-muted-light dark:text-text-muted text-xs">ppb</span>
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full"
                                        style={{ width: `${getPollutantBarWidth(displayData.pollutants.co * 100 || avgPollutants.co * 100, 1000)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* NO2 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-text-dark dark:text-white text-sm">NO2</span>
                                <ExternalLink className="w-3 h-3 text-text-muted-light dark:text-text-muted" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-text-dark dark:text-white font-medium">{displayData.pollutants.no2 || avgPollutants.no2}</span>
                                <span className="text-text-muted-light dark:text-text-muted text-xs">ppb</span>
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-500 rounded-full"
                                        style={{ width: `${getPollutantBarWidth(displayData.pollutants.no2 || avgPollutants.no2, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* O3 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-text-dark dark:text-white text-sm">O3</span>
                                <ExternalLink className="w-3 h-3 text-text-muted-light dark:text-text-muted" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-text-dark dark:text-white font-medium">{displayData.pollutants.o3 || avgPollutants.o3}</span>
                                <span className="text-text-muted-light dark:text-text-muted text-xs">ppb</span>
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full"
                                        style={{ width: `${getPollutantBarWidth(displayData.pollutants.o3 || avgPollutants.o3, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PM10 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-text-dark dark:text-white text-sm">PM10</span>
                                <ExternalLink className="w-3 h-3 text-text-muted-light dark:text-text-muted" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-text-dark dark:text-white font-medium">{displayData.pollutants.pm10 || avgPollutants.pm10}</span>
                                <span className="text-text-muted-light dark:text-text-muted text-xs">µg/m³</span>
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full"
                                        style={{ width: `${getPollutantBarWidth(displayData.pollutants.pm10 || avgPollutants.pm10, 500)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PM2.5 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-text-dark dark:text-white text-sm">PM2.5</span>
                                <ExternalLink className="w-3 h-3 text-text-muted-light dark:text-text-muted" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-text-dark dark:text-white font-medium">{displayData.pollutants.pm25 || avgPollutants.pm25}</span>
                                <span className="text-text-muted-light dark:text-text-muted text-xs">µg/m³</span>
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full"
                                        style={{ width: `${getPollutantBarWidth(displayData.pollutants.pm25 || avgPollutants.pm25, 300)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SO2 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-text-dark dark:text-white text-sm">SO2</span>
                                <ExternalLink className="w-3 h-3 text-text-muted-light dark:text-text-muted" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-text-dark dark:text-white font-medium">{displayData.pollutants.so2 || avgPollutants.so2}</span>
                                <span className="text-text-muted-light dark:text-text-muted text-xs">ppb</span>
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full"
                                        style={{ width: `${getPollutantBarWidth(displayData.pollutants.so2 || avgPollutants.so2, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Health Advisory Panel */}
                    {(() => {
                        const healthAdvisory = getHealthAdvisory(displayData.aqi);
                        const topDiseases = getTopDiseasesForAQI(displayData.aqi, 3);
                        return (
                            <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                                {/* Health Risks */}
                                <div className="flex items-center gap-2 text-text-muted-light dark:text-text-muted text-xs mb-3">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                    <span>Health Risks</span>
                                </div>
                                <div className="space-y-2">
                                    {topDiseases.map((disease, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <p className="text-text-dark dark:text-white text-sm font-medium">{disease.name}</p>
                                                    <p className="text-text-muted-light dark:text-text-muted text-[10px] line-clamp-1">{disease.description}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${disease.riskFactor === 'severe' ? 'bg-red-500/20 text-red-400' :
                                                disease.riskFactor === 'very-high' ? 'bg-orange-500/20 text-orange-400' :
                                                    disease.riskFactor === 'high' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'
                                                }`}>
                                                {disease.riskFactor}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Advisory Message */}
                                <div className="mt-4 p-3 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Heart className="w-3.5 h-3.5 text-primary-light-theme dark:text-primary" />
                                        <span className="text-text-dark dark:text-white text-xs font-medium">Health Advisory</span>
                                    </div>
                                    <p className="text-text-muted-light dark:text-text-muted text-xs leading-relaxed">
                                        {healthAdvisory.outdoorActivityAdvice}
                                    </p>
                                </div>

                                {/* At-Risk Groups (show only for poor and above) */}
                                {displayData.aqi > 100 && (
                                    <div className="mt-3">
                                        <p className="text-text-muted-light dark:text-text-muted text-xs font-medium mb-1">At-Risk Groups:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {healthAdvisory.atRiskGroups.slice(0, 3).map((group, idx) => (
                                                <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-400 dark:text-orange-300">
                                                    {group}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                <div className="mt-3">
                                    <p className="text-text-muted-light dark:text-text-muted text-xs font-medium mb-1">Recommendations:</p>
                                    <ul className="space-y-1">
                                        {healthAdvisory.recommendations.slice(0, 2).map((rec, idx) => (
                                            <li key={idx} className="text-text-muted-light dark:text-text-muted text-[11px] flex items-start gap-1.5">
                                                <span className="text-primary-light-theme dark:text-primary mt-0.5">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Firebase Connection Status */}
                                {firebaseConnected && (
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-green-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        <span>Firebase connected - Real-time updates active</span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    {/* Trend Section */}
                    <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                        <div className="flex items-center gap-2 text-text-muted-light dark:text-text-muted text-xs mb-3">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>AQI Trend Last 24 hour</span>
                        </div>
                        {/* Simple trend visualization - using static data to avoid hydration mismatch */}
                        <div className="h-16 flex items-end gap-1">
                            {[65, 72, 58, 81, 45, 67, 89, 54, 76, 63, 91, 48, 73, 82, 56, 69, 95, 42, 78, 61, 87, 52, 74, 66].map((height, i) => {
                                // Static AQI values corresponding to heights
                                const aqiValues = [245, 268, 212, 289, 195, 256, 302, 208, 275, 241, 315, 187, 264, 291, 218, 253, 328, 175, 282, 235, 305, 198, 271, 248];
                                const aqi = aqiValues[i];
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-t"
                                        style={{
                                            height: `${height}%`,
                                            backgroundColor: getAqiColor(getAqiStatus(aqi)),
                                            opacity: 0.7
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* AQI Scale */}
                <div className="p-4 border-t border-border-light dark:border-border-dark">
                    <div className="flex h-2 rounded-full overflow-hidden">
                        {aqiScale.map((item, i) => (
                            <div
                                key={i}
                                className="flex-1"
                                style={{ backgroundColor: item.color }}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-text-muted-light dark:text-text-muted">
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                        <span>150</span>
                        <span>200</span>
                        <span>300</span>
                        <span>301+</span>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                {/* Search Bar */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search any location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (!searchQuery) return;
                                        try {
                                            const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                                            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${key}`;
                                            const res = await fetch(url);
                                            const json = await res.json();
                                            if (json.status === 'OK' && json.results && json.results.length > 0) {
                                                const loc = json.results[0].geometry.location;
                                                setFocusLocation({ lat: loc.lat, lng: loc.lng, label: json.results[0].formatted_address });
                                                setSearchQuery('');
                                            }
                                        } catch (err) {
                                            console.error('Geocode failed', err);
                                        }
                                    }
                                }}
                                className="w-64 pl-10 pr-10 py-2.5 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-sm border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-white text-sm placeholder-text-muted-light dark:placeholder-text-muted focus:outline-none focus:border-primary-light-theme dark:focus:border-primary"
                            />
                            <button
                                onClick={async () => {
                                    if (!searchQuery) return;
                                    try {
                                        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                                        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${key}`;
                                        const res = await fetch(url);
                                        const json = await res.json();
                                        if (json.status === 'OK' && json.results && json.results.length > 0) {
                                            const loc = json.results[0].geometry.location;
                                            setFocusLocation({ lat: loc.lat, lng: loc.lng, label: json.results[0].formatted_address });
                                            setSearchQuery('');
                                        }
                                    } catch (err) {
                                        console.error('Geocode failed', err);
                                    }
                                }}
                                title="Search"
                                className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-text-muted-light hover:bg-black/5 dark:hover:bg-white/10"
                            >
                                🔍
                            </button>
                            {searchQuery && filteredStations.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg overflow-hidden max-h-60 overflow-y-auto shadow-lg">
                                {filteredStations.slice(0, 8).map(station => (
                                    <button
                                        key={station.id}
                                        onClick={() => {
                                            setSelectedStation(station);
                                            setSearchQuery('');
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between"
                                    >
                                        <span className="text-text-dark dark:text-white text-sm truncate">{station.name}</span>
                                        <span
                                            className="text-xs font-bold px-2 py-0.5 rounded"
                                            style={{
                                                backgroundColor: getAqiColor(getAqiStatus(station.aqi)),
                                                color: station.aqi > 100 ? 'white' : 'black'
                                            }}
                                        >
                                            {station.aqi}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Station count badge */}
                <div className="absolute top-4 left-4 z-10 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark shadow-md">
                    <span className="text-text-muted-light dark:text-text-muted text-xs">{stations.length} stations</span>
                </div>

                {/* View Mode Dropdown */}
                <div className="absolute top-4 left-36 z-20">
                    <div className="relative">
                        <button
                            onClick={() => setShowViewDropdown(!showViewDropdown)}
                            className="flex items-center gap-2 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border-light dark:border-border-dark shadow-md hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                        >
                            {viewMode === 'aqi' && <Wind className="w-4 h-4 text-primary-light-theme dark:text-primary" />}
                            {viewMode === 'electric' && <Zap className="w-4 h-4 text-green-500" />}
                            {viewMode === 'non-electric' && <Bus className="w-4 h-4 text-amber-500" />}
                            {viewMode === 'municipal' && <Building className="w-4 h-4 text-indigo-500" />}
                            {viewMode === 'all-routes' && <Bus className="w-4 h-4 text-gray-500" />}
                            <span className="text-text-dark dark:text-white text-sm font-medium">
                                {viewMode === 'aqi' && 'AQI Stations'}
                                {viewMode === 'electric' && 'Electric Buses'}
                                {viewMode === 'non-electric' && 'Non-Electric Buses'}
                                {viewMode === 'municipal' && 'Municipal Buses'}
                                {viewMode === 'all-routes' && 'All Bus Routes'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-text-muted-light dark:text-text-muted transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showViewDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg overflow-hidden">
                                <button
                                    onClick={() => { setViewMode('aqi'); setShowViewDropdown(false); }}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 ${viewMode === 'aqi' ? 'bg-primary/10' : ''}`}
                                >
                                    <Wind className="w-4 h-4 text-primary-light-theme dark:text-primary" />
                                    <span className="text-text-dark dark:text-white text-sm">AQI Stations</span>
                                </button>
                                <button
                                    onClick={() => { setViewMode('electric'); setShowViewDropdown(false); }}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 ${viewMode === 'electric' ? 'bg-green-500/10' : ''}`}
                                >
                                    <Zap className="w-4 h-4 text-green-500" />
                                    <span className="text-text-dark dark:text-white text-sm">Electric Buses</span>
                                </button>
                                <button
                                    onClick={() => { setViewMode('non-electric'); setShowViewDropdown(false); }}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 ${viewMode === 'non-electric' ? 'bg-amber-500/10' : ''}`}
                                >
                                    <Bus className="w-4 h-4 text-amber-500" />
                                    <span className="text-text-dark dark:text-white text-sm">Non-Electric Buses</span>
                                </button>
                                <button
                                    onClick={() => { setViewMode('municipal'); setShowViewDropdown(false); }}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 ${viewMode === 'municipal' ? 'bg-indigo-500/10' : ''}`}
                                >
                                    <Building className="w-4 h-4 text-indigo-500" />
                                    <span className="text-text-dark dark:text-white text-sm">Municipal Buses</span>
                                </button>
                                <button
                                    onClick={() => { setViewMode('all-routes'); setShowViewDropdown(false); }}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 ${viewMode === 'all-routes' ? 'bg-gray-500/10' : ''}`}
                                >
                                    <Bus className="w-4 h-4 text-gray-500" />
                                    <span className="text-text-dark dark:text-white text-sm">All Bus Routes</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map */}
                <AQIMap
                    stations={stations}
                    busRoutes={busRoutes}
                    busPositions={busPositions}
                    viewMode={viewMode}
                    focusStation={selectedStation?.id}
                    focusLocation={focusLocation}
                    onMapCenterChange={handleMapCenterChange}
                    onStationSelect={handleStationSelect}
                    selectedStationId={selectedStation?.id}
                />
            </div>
        </div>
    );
};

export default MappingPage;
