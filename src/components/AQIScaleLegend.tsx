import { getAqiLabel } from '@/utils/aqi-utils';
import type { AQIStatus } from '@/types';

const AQIScaleLegend = () => {
    const scales: { status: AQIStatus; range: string; color: string }[] = [
        { status: 'good', range: '0-50', color: '#00e400' },
        { status: 'moderate', range: '51-100', color: '#ffff00' },
        { status: 'poor', range: '101-150', color: '#ff7e00' },
        { status: 'unhealthy', range: '151-200', color: '#ff0000' },
        { status: 'severe', range: '201-300', color: '#8f3f97' },
        { status: 'hazardous', range: '301+', color: '#7e0023' },
    ];

    return (
        <div className="flex rounded-xl overflow-hidden">
            {scales.map((scale) => (
                <div
                    key={scale.status}
                    className="flex-1 py-4 px-2 text-center transition-transform hover:scale-y-110 cursor-pointer"
                    style={{
                        backgroundColor: scale.color,
                        color: ['good', 'moderate', 'poor'].includes(scale.status) ? '#000' : '#fff'
                    }}
                >
                    <p className="text-[0.65rem] font-bold uppercase tracking-wide">
                        {getAqiLabel(scale.status)}
                    </p>
                    <p className="text-[0.6rem] opacity-80 mt-0.5">{scale.range}</p>
                </div>
            ))}
        </div>
    );
};

export default AQIScaleLegend;
