'use client';

import AnimatedNumber from './AnimatedNumber';

export default function ForecastSection() {
    const forecastData = [
        { label: 'Now', aqi: 152 },
        { label: '6 hours', aqi: 158 },
        { label: '12 hours', aqi: 135 },
        { label: '24 hours', aqi: 121 },
    ];

    return (
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-16 bg-background-light dark:bg-surface-dark/30">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
                    <div className="flex flex-col gap-4 text-left">
                        <h2 className="text-4xl font-bold tracking-tight text-text-dark dark:text-white">AQI Forecast</h2>
                        <p className="text-text-muted-light dark:text-text-muted">Predictions for the next 24 hours at AICTE Delhi. Conditions are expected to remain in the &apos;Moderate&apos; range, with slight improvements overnight.</p>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {forecastData.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center gap-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 text-center hover:shadow-lg transition-shadow duration-300"
                                >
                                    <p className="text-sm font-medium text-text-muted-light dark:text-text-muted">{item.label}</p>
                                    <p className="text-3xl font-bold text-aqi-poor">
                                        <AnimatedNumber
                                            value={item.aqi}
                                            duration={1400}
                                            delay={index * 150}
                                        />
                                    </p>
                                    <p className="text-xs font-semibold text-aqi-poor">Poor</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
