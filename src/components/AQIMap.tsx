'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, Polygon, Polyline, InfoWindow, Marker } from '@react-google-maps/api';
import type { AQIStation, BusRoute } from '@/types';
import { getAqiStatus, getAqiColor, getAqiLabel } from '@/utils/aqi-utils';
import { delhiBoundary, ncrBoundary } from '@/data/boundaries';
import { getHealthAdvisory, getTopDiseasesForAQI } from '@/data/disease-data';

// Bus position type for real-time tracking
export interface BusPosition {
    id: string;
    vehicleId: string;
    routeId: string;
    routeNumber: string;
    lat: number;
    lng: number;
    bearing: number;
    speed: number;
    timestamp: string;
    type: 'electric' | 'non-electric' | 'municipal';
}

interface AQIMapProps {
    stations: AQIStation[];
    busRoutes: BusRoute[];
    busPositions?: BusPosition[];
    viewMode: 'aqi' | 'electric' | 'non-electric' | 'municipal' | 'all-routes';
    focusStation?: string;
    focusLocation?: { lat: number; lng: number; label?: string } | null;
    onMapCenterChange?: (loc: { lat: number; lng: number; label?: string } | null) => void;
    onStationSelect?: (station: AQIStation | null) => void;
    selectedStationId?: string;
}

// Convert [lat, lng] to {lat, lng} format for Google Maps
const convertCoords = (coords: [number, number][]): { lat: number; lng: number }[] => {
    return coords.map(([lat, lng]) => ({ lat, lng }));
};

// Light map styles for AQI display - clean and readable
const lightMapStyles: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e9e9e9' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    // Default to India center, but map is no longer restricted
    lat: 20.5937,
    lng: 78.9629,
};

// Custom AQI Marker Component
const AQIMarker = ({
    station,
    onClick,
    isSelected
}: {
    station: AQIStation;
    onClick: () => void;
    isSelected: boolean;
}) => {
    const status = getAqiStatus(station.aqi);
    const color = getAqiColor(status);
    const isDevice = station.type === 'pranamesh' || !!station.device;

    // Determine size based on AQI severity
    const getMarkerSize = () => {
        if (isSelected) return 48;
        if (station.aqi >= 300) return 42;
        if (station.aqi >= 200) return 38;
        return 34;
    };

    const size = getMarkerSize();
    const fontSize = size > 40 ? 13 : 11;

    return (
        <OverlayView
            position={{ lat: station.lat, lng: station.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div
                onClick={onClick}
                className="relative cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110"
                style={{ zIndex: isSelected ? 1000 : station.aqi }}
            >
                {/* Device stations use a distinct square marker */}
                {isDevice ? (
                    <div
                        className="rounded-md flex items-center justify-center font-bold text-white shadow-lg"
                        style={{
                            width: size,
                            height: size,
                            backgroundColor: '#111827',
                            fontSize: fontSize,
                            border: `3px solid ${color}`,
                            boxShadow: `0 0 ${isSelected ? 20 : 8}px ${color}60`,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ fontSize: fontSize - 2 }}>🔌</div>
                        <div style={{ fontSize: fontSize - 1 }}>{station.aqi}</div>
                    </div>
                ) : (
                    /* Main circle for other stations */
                    <div
                        className="rounded-full flex items-center justify-center font-bold text-white shadow-lg"
                        style={{
                            width: size,
                            height: size,
                            backgroundColor: color,
                            fontSize: fontSize,
                            border: isSelected ? '3px solid white' : 'none',
                            boxShadow: `0 0 ${isSelected ? 20 : 10}px ${color}80`,
                        }}
                    >
                        {station.aqi}
                    </div>
                )}
                {/* Pulse animation for selected */}
                {isSelected && (
                    <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ backgroundColor: color, opacity: 0.3 }}
                    />
                )}
            </div>
        </OverlayView>
    );
};

const AQIMap = ({
    stations,
    busRoutes,
    busPositions = [],
    viewMode,
    focusStation,
    focusLocation,
    onMapCenterChange,
    onStationSelect,
    selectedStationId
}: AQIMapProps) => {
    const [selectedStation, setSelectedStation] = useState<AQIStation | null>(null);
    const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
    const [selectedBus, setSelectedBus] = useState<BusPosition | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    });

    // Handle external station selection
    useEffect(() => {
        if (selectedStationId) {
            const station = stations.find(s => s.id === selectedStationId);
            if (station) {
                // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync local state with prop
                setSelectedStation(station);
                // Do not recenter/zoom when a station is selected; respect user's current pan
            }
        }
    }, [selectedStationId, stations]);

    // Keep selectedStation data fresh when stations update (without closing the card)
    useEffect(() => {
        if (!selectedStation) return;
        const updated = stations.find(s => s.id === selectedStation.id);
        if (updated) {
            setSelectedStation(updated);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stations]);

    // Pan/zoom to an externally provided location (search results)
    useEffect(() => {
        if (!mapRef.current) return;
        if (!focusLocation) return;

        try {
            mapRef.current.panTo({ lat: focusLocation.lat, lng: focusLocation.lng });
            mapRef.current.setZoom(13);

            // after panning, notify parent about the focused location (include label if available)
            if (typeof onMapCenterChange === 'function') {
                onMapCenterChange({ lat: focusLocation.lat, lng: focusLocation.lng, label: focusLocation.label });
            }
        } catch (err) {
            // ignore pan errors
            console.error('Failed to pan to focusLocation', err);
        }
    }, [focusLocation, onMapCenterChange]);

    // Cleanup any map listeners on unmount
    useEffect(() => {
        return () => {
            try {
                if (mapRef.current && (mapRef.current as any).__idleListener) {
                    const l = (mapRef.current as any).__idleListener;
                    if (typeof l.remove === 'function') l.remove();
                    // @ts-ignore
                    delete (mapRef.current as any).__idleListener;
                }
            } catch (err) {
                // ignore
            }
        };
    }, []);

    const getRouteColor = (type: BusRoute['type']) => {
        switch (type) {
            case 'electric': return '#10b981';
            case 'non-electric': return '#f59e0b';
            case 'municipal': return '#6366f1';
            default: return '#6b7280';
        }
    };

    const filteredRoutes = useMemo(() => {
        return busRoutes.filter(route => {
            if (viewMode === 'all-routes') return true;
            if (viewMode === 'aqi') return false;
            return route.type === viewMode;
        });
    }, [busRoutes, viewMode]);

    const delhiPath = useMemo(() => convertCoords(delhiBoundary), []);
    const ncrPath = useMemo(() => convertCoords(ncrBoundary), []);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        // Remove regional bounds restriction: allow free pan/zoom
        // Optionally, set an initial zoom appropriate for country-level view
        map.setZoom(5);

        // Listen for idle event (pan/zoom finished) and report center back to parent
        try {
            const idleListener = map.addListener('idle', async () => {
                try {
                    const center = map.getCenter();
                    if (!center) return;
                    const lat = center.lat();
                    const lng = center.lng();

                    // Reverse geocode using Google Maps Geocoder (client-side)
                    if (window.google && window.google.maps && window.google.maps.Geocoder) {
                        const geocoder = new window.google.maps.Geocoder();
                        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                            if (status === 'OK' && results && results.length > 0) {
                                    const label = results[0].formatted_address;
                                    if (typeof onMapCenterChange === 'function') onMapCenterChange({ lat, lng, label });
                                } else {
                                    if (typeof onMapCenterChange === 'function') onMapCenterChange({ lat, lng });
                                }
                        });
                    } else {
                        if (typeof onMapCenterChange === 'function') onMapCenterChange({ lat, lng });
                    }
                } catch (err) {
                    // ignore
                }
            });

            // store listener object to remove when needed
            // @ts-ignore
            map.__idleListener = idleListener;
        } catch (err) {
            // ignore listener setup errors
        }
    }, [onMapCenterChange]);

    const handleStationClick = (station: AQIStation) => {
        setSelectedStation(station);
        if (onStationSelect) {
            onStationSelect(station);
        }
    };

    if (loadError) {
        return (
            <div className="w-full h-full bg-[#1a1a1a] rounded-xl flex items-center justify-center">
                <div className="text-center text-red-500">
                    <p className="text-lg font-semibold">Error loading Google Maps</p>
                    <p className="text-sm opacity-80">Please check your API key configuration</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full bg-[#1a1a1a] rounded-xl flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={11}
            onLoad={onLoad}
            options={{
                styles: lightMapStyles,
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER,
                },
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                // Allow wider zoom range and remove strict bounds
                minZoom: 2,
                maxZoom: 18,
            }}
        >
            {/* NCR Region Boundary (outer, subtle) */}
            <Polygon
                paths={ncrPath}
                options={{
                    strokeColor: '#cccccc',
                    strokeWeight: 1,
                    strokeOpacity: 0.5,
                    fillColor: '#f0f0f0',
                    fillOpacity: 0.1,
                }}
            />

            {/* Delhi State Boundary - visible on light map */}
            <Polygon
                paths={delhiPath}
                options={{
                    strokeColor: '#3388ff',
                    strokeWeight: 3,
                    strokeOpacity: 1,
                    fillColor: '#3388ff',
                    fillOpacity: 0.2,
                }}
            />

            {/* Bus Routes */}
            {viewMode !== 'aqi' && filteredRoutes.map((route) => (
                <Polyline
                    key={route.id}
                    path={convertCoords(route.coordinates)}
                    options={{
                        strokeColor: getRouteColor(route.type),
                        strokeWeight: 5,
                        strokeOpacity: 0.85,
                        icons: route.deviceInstalled ? undefined : [{
                            icon: {
                                path: 'M 0,-1 0,1',
                                strokeOpacity: 1,
                                scale: 4,
                            },
                            offset: '0',
                            repeat: '20px',
                        }],
                    }}
                    onClick={() => setSelectedRoute(route)}
                />
            ))}

            {/* Route Info Window */}
            {selectedRoute && (
                <InfoWindow
                    position={convertCoords(selectedRoute.coordinates)[Math.floor(selectedRoute.coordinates.length / 2)]}
                    onCloseClick={() => setSelectedRoute(null)}
                    options={{ disableAutoPan: true }}
                >
                    <div className="min-w-[200px] p-2 text-gray-900">
                        <h3 className="font-bold text-lg">{selectedRoute.routeNumber}</h3>
                        <p className="text-sm opacity-80">{selectedRoute.name}</p>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs">Type: <span className="font-semibold capitalize">{selectedRoute.type}</span></p>
                        </div>
                    </div>
                </InfoWindow>
            )}

            {/* Real-time Bus Position Markers */}
            {viewMode !== 'aqi' && busPositions.map((bus) => (
                <Marker
                    key={bus.id}
                    position={{ lat: bus.lat, lng: bus.lng }}
                    onClick={() => setSelectedBus(bus)}
                    icon={{
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 5,
                        rotation: bus.bearing,
                        fillColor: getRouteColor(bus.type),
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                    }}
                />
            ))}

            {/* Bus Info Window */}
            {selectedBus && (
                <InfoWindow
                    position={{ lat: selectedBus.lat, lng: selectedBus.lng }}
                    onCloseClick={() => setSelectedBus(null)}
                    options={{ disableAutoPan: true }}
                >
                    <div className="min-w-[180px] p-2 text-gray-900">
                        <h3 className="font-bold text-lg">🚌 {selectedBus.routeNumber}</h3>
                        <p className="text-sm opacity-80">Vehicle: {selectedBus.vehicleId}</p>
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                            <p className="text-xs">Speed: <span className="font-semibold">{Math.round(selectedBus.speed)} km/h</span></p>
                            <p className="text-xs">Type: <span className="font-semibold capitalize">{selectedBus.type}</span></p>
                        </div>
                    </div>
                </InfoWindow>
            )}

            {/* Custom AQI Station Markers with values inside */}
            {stations.map((station) => (
                <AQIMarker
                    key={station.id}
                    station={station}
                    onClick={() => handleStationClick(station)}
                    isSelected={selectedStation?.id === station.id || focusStation === station.id}
                />
            ))}

            {/* Station Info Window */}
            {selectedStation && (
                <InfoWindow
                    position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
                    onCloseClick={() => {
                        setSelectedStation(null);
                        if (onStationSelect) onStationSelect(null);
                    }}
                    options={{
                        pixelOffset: new google.maps.Size(0, -25),
                        disableAutoPan: true,
                    }}
                >
                    {(() => {
                        const healthAdvisory = getHealthAdvisory(selectedStation.aqi);
                        const topDiseases = getTopDiseasesForAQI(selectedStation.aqi, 3);
                        return (
                            <div className="min-w-[280px] max-w-[320px] p-3 text-gray-900">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-lg">{selectedStation.name}</h3>
                                    <span
                                        className="px-2 py-0.5 rounded text-xs font-bold text-white"
                                        style={{ backgroundColor: getAqiColor(getAqiStatus(selectedStation.aqi)) }}
                                    >
                                        {selectedStation.aqi}
                                    </span>
                                </div>
                                <p className="text-sm opacity-80 mt-1">
                                    📍 {selectedStation.location}
                                </p>
                                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                                    <p className="text-xs">
                                        Status: <span className="font-semibold" style={{ color: getAqiColor(getAqiStatus(selectedStation.aqi)) }}>
                                            {getAqiLabel(getAqiStatus(selectedStation.aqi))}
                                        </span>
                                    </p>
                                    <p className="text-xs">
                                        🕐 Updated: {new Date(selectedStation.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Pollutants */}
                                <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-3 gap-2 text-xs text-center">
                                    <div>
                                        <p className="font-bold">{selectedStation.pollutants.pm25}</p>
                                        <p className="opacity-60">PM2.5</p>
                                    </div>
                                    <div>
                                        <p className="font-bold">{selectedStation.pollutants.pm10}</p>
                                        <p className="opacity-60">PM10</p>
                                    </div>
                                    <div>
                                        <p className="font-bold">{selectedStation.pollutants.co}</p>
                                        <p className="opacity-60">CO (ppb)</p>
                                    </div>
                                </div>

                                {/* Device details if available */}
                                {selectedStation.device && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs font-semibold mb-1">Device</p>
                                        <div className="text-[12px] text-gray-700 space-y-1">
                                            {selectedStation.device.deviceId && (
                                                <p>🔧 ID: <span className="font-medium">{selectedStation.device.deviceId}</span></p>
                                            )}
                                            {selectedStation.device.deviceModel && (
                                                <p>📦 Model: <span className="font-medium">{selectedStation.device.deviceModel}</span></p>
                                            )}
                                            {selectedStation.device.battery !== undefined && (
                                                <p>🔋 Battery: <span className="font-medium">{selectedStation.device.battery}%</span></p>
                                            )}
                                            {selectedStation.device.sensorReadings && (
                                                <div className="mt-2">
                                                    <p className="text-xs font-medium mb-1">Sensor Readings</p>
                                                    <div className="grid grid-cols-2 gap-1 text-[12px]">
                                                        {(() => {
                                                            const sr = selectedStation.device?.sensorReadings || {};
                                                            const tvoc = (sr['tvoc_ppb'] as number) ?? (sr['sgp_tvoc_ppb'] as number);
                                                            const eco2 = (sr['eco2_ppm'] as number) ?? (sr['sgp_eco2_ppm'] as number);
                                                            const rows: Array<{ label: string; value: number | string | undefined }> = [];
                                                            if (eco2 !== undefined) rows.push({ label: 'eCO₂ (ppm)', value: eco2 });
                                                            if (tvoc !== undefined) rows.push({ label: 'VOC (ppb)', value: tvoc });
                                                            // Show a few raw entries for transparency
                                                            ['mq2_ppm', 'mq7_ppm', 'mq135_raw'].forEach(k => {
                                                                if (sr[k] !== undefined) rows.push({ label: k.replace(/_/g, ' '), value: sr[k] });
                                                            });
                                                            return rows.map((r, i) => (
                                                                <div key={i} className="flex items-center justify-between">
                                                                    <span className="opacity-80">{r.label}</span>
                                                                    <span className="font-medium">{String(r.value)}</span>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Health Risks Section */}
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                    <p className="text-xs font-semibold text-red-700 mb-1">Health Risks</p>
                                    <div className="space-y-1">
                                        {topDiseases.map((disease, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 text-xs">
                                                <span className="font-medium">{disease.name}</span>
                                                <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] ${disease.riskFactor === 'severe' ? 'bg-red-100 text-red-700' :
                                                    disease.riskFactor === 'very-high' ? 'bg-orange-100 text-orange-700' :
                                                        disease.riskFactor === 'high' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {disease.riskFactor}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Health Advisory */}
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs font-semibold mb-1">Advisory</p>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        {healthAdvisory.outdoorActivityAdvice}
                                    </p>
                                    {healthAdvisory.recommendations.length > 0 && (
                                        <ul className="mt-1 text-[10px] text-gray-500 space-y-0.5">
                                            {healthAdvisory.recommendations.slice(0, 2).map((rec, idx) => (
                                                <li key={idx}>• {rec}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {selectedStation.aqi > 100 && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs font-semibold text-orange-700 mb-1">At-Risk Groups</p>
                                        <p className="text-[10px] text-gray-600">
                                            {healthAdvisory.atRiskGroups.slice(0, 2).join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                </InfoWindow>
            )}
        </GoogleMap>
    );
};

export default AQIMap;
