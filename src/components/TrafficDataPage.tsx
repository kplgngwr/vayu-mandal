'use client';

import { useState } from 'react';
import { aqiStations, trafficZones } from '@/data/mock-data';
import { getAqiStatus, getAqiColor, getAqiLabel } from '@/utils/aqi-utils';
import { BarChart3, Filter, MapPin, AlertTriangle, Factory, Car, Search } from 'lucide-react';

type FilterType = 'all' | 'hazardous' | 'industrial' | 'traffic';

const TrafficDataPage = () => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStations = aqiStations.filter((station) => {
        if (searchQuery && !station.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        switch (filter) {
            case 'hazardous': return station.aqi > 300;
            case 'industrial': return station.type === 'industrial';
            case 'traffic': return station.aqi > 200 && station.type !== 'industrial';
            default: return true;
        }
    });

    const sortedStations = [...filteredStations].sort((a, b) => b.aqi - a.aqi);

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12 md:py-16">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-light-theme dark:text-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold text-text-dark dark:text-white">Traffic & Industrial Data</h1>
            </div>
            <p className="text-text-muted-light dark:text-text-muted text-sm sm:text-lg mb-6 sm:mb-12">
                Monitoring {aqiStations.length} stations across Delhi-NCR covering traffic hotspots and industrial zones
            </p>

            {/* Filters & Search */}
            <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-10">
                <div className="relative">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted-light dark:text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search stations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm sm:text-base focus:outline-none focus:border-primary-light-theme/50 dark:focus:border-primary/50 transition-colors text-text-dark dark:text-white"
                    />
                </div>
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-x-visible scrollbar-hide">
                    {[
                        { value: 'all' as FilterType, label: 'All Stations', icon: <Filter className="w-5 h-5" /> },
                        { value: 'hazardous' as FilterType, label: 'Hazardous', icon: <AlertTriangle className="w-5 h-5" /> },
                        { value: 'industrial' as FilterType, label: 'Industrial', icon: <Factory className="w-5 h-5" /> },
                        { value: 'traffic' as FilterType, label: 'Traffic', icon: <Car className="w-5 h-5" /> },
                    ].map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => setFilter(btn.value)}
                            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${filter === btn.value
                                ? 'bg-primary-light-theme dark:bg-primary text-white'
                                : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted hover:text-text-dark dark:hover:text-white hover:border-black/20 dark:hover:border-white/20'
                                }`}
                        >
                            {btn.icon}
                            <span className="hidden sm:inline">{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                    <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-red-500 mb-2">
                        {aqiStations.filter(s => s.aqi > 300).length}
                    </p>
                    <p className="text-sm text-gray-400">Hazardous Zones</p>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                    <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-purple-500 mb-1 sm:mb-2">
                        {aqiStations.filter(s => s.aqi > 200 && s.aqi <= 300).length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">Severe Zones</p>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                    <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-amber-500 mb-1 sm:mb-2">
                        {aqiStations.filter(s => s.type === 'industrial').length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">Industrial Areas</p>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                    <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-indigo-400 mb-1 sm:mb-2">
                        {trafficZones.reduce((acc, z) => acc + z.recommendedDevices, 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">Devices Recommended</p>
                </div>
            </div>

            {/* Stations Table */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl overflow-hidden mb-10 sm:mb-16">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="bg-background-light dark:bg-background-dark">
                                <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 text-left text-xs sm:text-sm font-semibold text-text-muted-light dark:text-text-muted uppercase tracking-wider">Station</th>
                                <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 text-center text-xs sm:text-sm font-semibold text-text-muted-light dark:text-text-muted uppercase tracking-wider">AQI</th>
                                <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 text-center text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                                <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 text-center text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">PM2.5</th>
                                <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 text-center text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">PM10</th>
                                <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 text-center text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">NO₂</th>
                                <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 text-center text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {sortedStations.map((station) => {
                                const color = getAqiColor(station.status);
                                return (
                                    <tr key={station.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5">
                                            <div className="flex items-center gap-2 sm:gap-4">
                                                <div
                                                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <div>
                                                    <p className="font-medium text-sm sm:text-base">{station.name}</p>
                                                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span className="truncate max-w-[100px] sm:max-w-none">{station.location}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-center">
                                            <span
                                                className="inline-flex items-center justify-center min-w-[50px] sm:min-w-[60px] px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-display font-bold text-sm sm:text-base"
                                                style={{ backgroundColor: `${color}20`, color }}
                                            >
                                                {station.aqi}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-center hidden sm:table-cell">
                                            <span className="text-xs sm:text-sm font-medium capitalize" style={{ color }}>
                                                {getAqiLabel(station.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-center text-sm">{station.pollutants.pm25}</td>
                                        <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-center hidden md:table-cell">{station.pollutants.pm10}</td>
                                        <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-center hidden md:table-cell">{station.pollutants.no2}</td>
                                        <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-center hidden sm:table-cell">
                                            <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full capitalize ${station.type === 'industrial'
                                                ? 'bg-amber-500/15 text-amber-400'
                                                : station.type === 'pranamesh'
                                                    ? 'bg-green-500/15 text-green-400'
                                                    : 'bg-gray-500/15 text-gray-400'
                                                }`}>
                                                {station.type}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Traffic Zones */}
            <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 md:mb-8 text-text-dark dark:text-white">Traffic Hotspot Zones</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                    {trafficZones.map((zone) => (
                        <div key={zone.id} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8">
                            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-text-dark dark:text-white">{zone.name}</h3>
                            <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted mb-4 sm:mb-6">{zone.area}</p>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Avg AQI</span>
                                    <span className="font-display text-lg font-bold" style={{ color: getAqiColor(getAqiStatus(zone.avgAqi)) }}>
                                        {zone.avgAqi}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Traffic</span>
                                    <span className={`capitalize font-medium ${zone.trafficDensity === 'very-high' ? 'text-red-400' :
                                        zone.trafficDensity === 'high' ? 'text-amber-400' :
                                            zone.trafficDensity === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                        }`}>
                                        {zone.trafficDensity.replace('-', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Peak Hours</span>
                                    <span className="text-sm">{zone.peakHours}</span>
                                </div>
                                <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center">
                                    <span className="text-gray-400">Recommended Devices</span>
                                    <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded text-sm font-bold">
                                        {zone.recommendedDevices}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div >
        </div >
    );
};

export default TrafficDataPage;
