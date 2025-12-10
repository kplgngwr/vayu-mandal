import type { AQIStatus } from '@/types';

// Get AQI status based on value
export const getAqiStatus = (aqi: number): AQIStatus => {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'poor';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'severe';
    return 'hazardous';
};

// Get AQI color based on status - matches globals.css EPA standard
export const getAqiColor = (status: AQIStatus): string => {
    const colors: Record<AQIStatus, string> = {
        good: '#00e400',       // --color-aqi-good
        moderate: '#ffff00',   // --color-aqi-satisfactory/moderate
        poor: '#ff7e00',       // --color-aqi-poor
        unhealthy: '#ff0000',  // --color-aqi-unhealthy
        severe: '#8f3f97',     // --color-aqi-severe
        hazardous: '#7e0023'   // --color-aqi-hazardous
    };
    return colors[status];
};

// Get AQI background color with opacity
export const getAqiBgColor = (status: AQIStatus): string => {
    const colors: Record<AQIStatus, string> = {
        good: 'rgba(0, 228, 0, 0.15)',
        moderate: 'rgba(255, 255, 0, 0.15)',
        poor: 'rgba(255, 126, 0, 0.15)',
        unhealthy: 'rgba(255, 0, 0, 0.15)',
        severe: 'rgba(143, 63, 151, 0.15)',
        hazardous: 'rgba(126, 0, 35, 0.15)'
    };
    return colors[status];
};

// Get status label
export const getAqiLabel = (status: AQIStatus): string => {
    const labels: Record<AQIStatus, string> = {
        good: 'Good',
        moderate: 'Moderate',
        poor: 'Poor',
        unhealthy: 'Unhealthy',
        severe: 'Severe',
        hazardous: 'Hazardous'
    };
    return labels[status];
};

// Get health recommendation
export const getHealthRecommendation = (status: AQIStatus): string => {
    const recommendations: Record<AQIStatus, string> = {
        good: 'Air quality is satisfactory. Enjoy outdoor activities!',
        moderate: 'Sensitive individuals should limit prolonged outdoor exertion.',
        poor: 'Everyone may experience mild respiratory symptoms. Limit outdoor activities.',
        unhealthy: 'Health alert! Avoid prolonged outdoor activities. Use air purifiers indoors.',
        severe: 'Health warnings of emergency conditions. Stay indoors with air filtration.',
        hazardous: 'Hazardous conditions! Avoid all outdoor activities. Seek clean air shelter.'
    };
    return recommendations[status];
};

// Format date for display
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

// Format time for display
export const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

// Format datetime
export const formatDateTime = (dateString: string): string => {
    return `${formatDate(dateString)}, ${formatTime(dateString)}`;
};

// Get relative time
export const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

// Calculate average AQI
export const calculateAverageAqi = (values: number[]): number => {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

// Get pollutant unit
export const getPollutantUnit = (pollutant: string): string => {
    if (pollutant === 'co') return 'mg/m³';
    return 'μg/m³';
};

// Get pollutant full name
export const getPollutantName = (pollutant: string): string => {
    const names: Record<string, string> = {
        pm25: 'PM2.5',
        pm10: 'PM10',
        co: 'CO',
        no2: 'NO₂',
        so2: 'SO₂',
        o3: 'O₃',
        voc: 'VOC'
    };
    return names[pollutant] || pollutant.toUpperCase();
};

// Classname utility (simple cn function)
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
    return classes.filter(Boolean).join(' ');
};
