'use client';

import type { Pollutants } from '@/types';
import { getAqiColor, getPollutantName, getPollutantUnit } from '@/utils/aqi-utils';

interface PollutantsGridProps {
    pollutants: Pollutants;
}

interface PollutantCardProps {
    name: string;
    value: number;
    unit: string;
}

const PollutantCard = ({ name, value, unit }: PollutantCardProps) => {
    // Determine severity based on typical thresholds
    const getSeverity = (pollutant: string, val: number) => {
        const thresholds: Record<string, number[]> = {
            pm25: [30, 60, 90, 120, 250],
            pm10: [50, 100, 250, 350, 430],
            co: [1, 2, 10, 17, 34],
            no2: [40, 80, 180, 280, 400],
            so2: [40, 80, 380, 800, 1600],
            o3: [50, 100, 168, 208, 748],
            voc: [0.5, 1, 2, 3, 5]
        };

        const levels = thresholds[pollutant.toLowerCase()] || [50, 100, 150, 200, 300];
        if (val <= levels[0]) return 'good';
        if (val <= levels[1]) return 'moderate';
        if (val <= levels[2]) return 'poor';
        if (val <= levels[3]) return 'unhealthy';
        if (val <= levels[4]) return 'severe';
        return 'hazardous';
    };

    const status = getSeverity(name, value);
    const color = getAqiColor(status);

    return (
        <div className="relative bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-light-theme/10 dark:hover:shadow-primary/10 overflow-hidden group">
            {/* Top Color Bar */}
            <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: color }}
            />

            <p className="text-text-muted-light dark:text-text-muted text-sm uppercase tracking-widest mb-4">{name}</p>
            <p className="font-display text-4xl font-bold mb-2" style={{ color }}>
                {value}
            </p>
            <p className="text-text-muted-light dark:text-text-muted text-sm">{unit}</p>

            {/* Hover glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl"
                style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }}
            />
        </div>
    );
};

const PollutantsGrid = ({ pollutants }: PollutantsGridProps) => {
    const pollutantEntries = Object.entries(pollutants) as [keyof Pollutants, number][];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {pollutantEntries.map(([key, value]) => (
                <PollutantCard
                    key={key}
                    name={getPollutantName(key)}
                    value={value}
                    unit={getPollutantUnit(key)}
                />
            ))}
        </div>
    );
};

export default PollutantsGrid;
