import type { PranaMeshDevice } from '@/types';
import { Cpu, Leaf, Bus, Home, Building } from 'lucide-react';

interface DeviceShowcaseProps {
    devices: PranaMeshDevice[];
}

const getDeviceIcon = (type: PranaMeshDevice['type']) => {
    switch (type) {
        case 'P-Gate': return <Building className="w-12 h-12 text-indigo-400" />;
        case 'P-Park': return <Leaf className="w-12 h-12 text-green-400" />;
        case 'P-Move': return <Bus className="w-12 h-12 text-amber-400" />;
        case 'P-Micro': return <Home className="w-12 h-12 text-purple-400" />;
        default: return <Cpu className="w-12 h-12 text-indigo-400" />;
    }
};

const DeviceShowcase = ({ devices }: DeviceShowcaseProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {devices.map((device, index) => (
                <div
                    key={device.id}
                    className="relative bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-10 text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary-light-theme/10 dark:hover:shadow-primary/10 overflow-hidden group animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    {/* Top gradient bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-light-theme to-primary-light-light-theme dark:from-primary dark:to-primary-light" />

                    {/* Device Icon */}
                    <div className="w-24 h-24 mx-auto mb-6 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        {getDeviceIcon(device.type)}
                    </div>

                    {/* Device Name */}
                    <h3 className="text-xl font-bold mb-2 text-text-dark dark:text-white">{device.type}</h3>
                    <p className="text-sm text-text-muted-light dark:text-text-muted mb-6 line-clamp-2 leading-relaxed">{device.description}</p>

                    {/* Features */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {device.features.slice(0, 3).map((feature) => (
                            <span
                                key={feature}
                                className="px-3 py-1.5 bg-primary-light-theme/15 dark:bg-primary/15 rounded-lg text-xs text-primary-light-theme dark:text-primary font-medium"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>

                    {/* Status */}
                    <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark flex items-center justify-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${device.status === 'active' ? 'bg-aqi-good' : device.status === 'maintenance' ? 'bg-aqi-moderate' : 'bg-aqi-unhealthy'}`} />
                        <span className="text-sm text-text-muted-light dark:text-text-muted uppercase tracking-wide">{device.status}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DeviceShowcase;
