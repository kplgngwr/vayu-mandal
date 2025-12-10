import type { AQIStation, BusRoute, PranaMeshDevice, TrafficZone, WeatherData, HistoricalDataPoint, HeatmapCell } from '@/types';

// AQI Stations in Delhi-NCR (focused on AICTE Delhi area)
export const aqiStations: AQIStation[] = [
    {
        id: 'aicte-delhi',
        name: 'AICTE Delhi',
        location: 'Nelson Mandela Marg, Vasant Kunj',
        lat: 28.5355,
        lng: 77.1539,
        aqi: 187,
        status: 'unhealthy',
        pollutants: { pm25: 112, pm10: 198, co: 1.2, no2: 48, so2: 12, o3: 34, voc: 0.8 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'pranamesh'
    },
    {
        id: 'ito',
        name: 'ITO',
        location: 'Income Tax Office, Delhi',
        lat: 28.6289,
        lng: 77.2405,
        aqi: 312,
        status: 'hazardous',
        pollutants: { pm25: 234, pm10: 356, co: 2.1, no2: 78, so2: 28, o3: 45 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'anand-vihar',
        name: 'Anand Vihar',
        location: 'Anand Vihar ISBT, Delhi',
        lat: 28.6469,
        lng: 77.3164,
        aqi: 389,
        status: 'hazardous',
        pollutants: { pm25: 298, pm10: 445, co: 2.8, no2: 92, so2: 35, o3: 52 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'dwarka-sec8',
        name: 'Dwarka Sector 8',
        location: 'Dwarka Sector 8, Delhi',
        lat: 28.5744,
        lng: 77.0658,
        aqi: 156,
        status: 'unhealthy',
        pollutants: { pm25: 89, pm10: 167, co: 0.9, no2: 38, so2: 14, o3: 28 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'rohini',
        name: 'Rohini',
        location: 'Rohini, Delhi',
        lat: 28.7495,
        lng: 77.0565,
        aqi: 245,
        status: 'severe',
        pollutants: { pm25: 178, pm10: 289, co: 1.8, no2: 65, so2: 22, o3: 41 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'punjabi-bagh',
        name: 'Punjabi Bagh',
        location: 'Punjabi Bagh, West Delhi',
        lat: 28.6683,
        lng: 77.1167,
        aqi: 278,
        status: 'severe',
        pollutants: { pm25: 198, pm10: 312, co: 2.0, no2: 72, so2: 25, o3: 38 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'mandir-marg',
        name: 'Mandir Marg',
        location: 'Mandir Marg, Central Delhi',
        lat: 28.6362,
        lng: 77.2010,
        aqi: 198,
        status: 'unhealthy',
        pollutants: { pm25: 124, pm10: 215, co: 1.4, no2: 52, so2: 18, o3: 32 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'r-k-puram',
        name: 'R.K. Puram',
        location: 'R.K. Puram, South Delhi',
        lat: 28.5651,
        lng: 77.1744,
        aqi: 167,
        status: 'unhealthy',
        pollutants: { pm25: 98, pm10: 178, co: 1.1, no2: 42, so2: 15, o3: 30 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'mundka',
        name: 'Mundka',
        location: 'Mundka Industrial Area',
        lat: 28.6814,
        lng: 77.0324,
        aqi: 334,
        status: 'hazardous',
        pollutants: { pm25: 256, pm10: 398, co: 2.5, no2: 85, so2: 42, o3: 48 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'industrial'
    },
    {
        id: 'okhla-phase2',
        name: 'Okhla Phase 2',
        location: 'Okhla Industrial Area Phase 2',
        lat: 28.5306,
        lng: 77.2711,
        aqi: 298,
        status: 'severe',
        pollutants: { pm25: 218, pm10: 345, co: 2.2, no2: 78, so2: 38, o3: 44 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'industrial'
    },
    {
        id: 'narela',
        name: 'Narela',
        location: 'Narela Industrial Area',
        lat: 28.8526,
        lng: 77.0931,
        aqi: 356,
        status: 'hazardous',
        pollutants: { pm25: 278, pm10: 412, co: 2.6, no2: 88, so2: 45, o3: 50 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'industrial'
    },
    {
        id: 'bawana',
        name: 'Bawana',
        location: 'Bawana Industrial Area',
        lat: 28.7762,
        lng: 77.0344,
        aqi: 312,
        status: 'hazardous',
        pollutants: { pm25: 238, pm10: 367, co: 2.3, no2: 82, so2: 40, o3: 46 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'industrial'
    },
    // More stations covering Delhi
    {
        id: 'lodhi-road',
        name: 'Lodhi Road',
        location: 'Lodhi Road, Central Delhi',
        lat: 28.5918,
        lng: 77.2273,
        aqi: 145,
        status: 'poor',
        pollutants: { pm25: 78, pm10: 156, co: 0.8, no2: 35, so2: 12, o3: 26 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'north-campus',
        name: 'North Campus DU',
        location: 'Delhi University, North Campus',
        lat: 28.6877,
        lng: 77.2100,
        aqi: 189,
        status: 'unhealthy',
        pollutants: { pm25: 115, pm10: 201, co: 1.3, no2: 49, so2: 16, o3: 33 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'shadipur',
        name: 'Shadipur',
        location: 'Shadipur Depot, West Delhi',
        lat: 28.6519,
        lng: 77.1473,
        aqi: 234,
        status: 'severe',
        pollutants: { pm25: 165, pm10: 278, co: 1.7, no2: 62, so2: 21, o3: 39 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'sirifort',
        name: 'Siri Fort',
        location: 'Siri Fort, South Delhi',
        lat: 28.5503,
        lng: 77.2155,
        aqi: 178,
        status: 'unhealthy',
        pollutants: { pm25: 105, pm10: 189, co: 1.2, no2: 45, so2: 14, o3: 31 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    // Additional stations to reach 30+
    {
        id: 'jahangirpuri',
        name: 'Jahangirpuri',
        location: 'Jahangirpuri, North Delhi',
        lat: 28.7256,
        lng: 77.1668,
        aqi: 267,
        status: 'severe',
        pollutants: { pm25: 189, pm10: 301, co: 1.9, no2: 68, so2: 24, o3: 40 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'wazirpur',
        name: 'Wazirpur',
        location: 'Wazirpur Industrial Area',
        lat: 28.6997,
        lng: 77.1656,
        aqi: 345,
        status: 'hazardous',
        pollutants: { pm25: 267, pm10: 401, co: 2.4, no2: 86, so2: 43, o3: 49 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'industrial'
    },
    {
        id: 'patparganj',
        name: 'Patparganj',
        location: 'Patparganj Industrial Area',
        lat: 28.6235,
        lng: 77.2878,
        aqi: 289,
        status: 'severe',
        pollutants: { pm25: 209, pm10: 334, co: 2.1, no2: 76, so2: 36, o3: 43 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'industrial'
    },
    {
        id: 'ashok-vihar',
        name: 'Ashok Vihar',
        location: 'Ashok Vihar, North Delhi',
        lat: 28.6953,
        lng: 77.1818,
        aqi: 223,
        status: 'severe',
        pollutants: { pm25: 156, pm10: 267, co: 1.6, no2: 58, so2: 20, o3: 37 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'vivek-vihar',
        name: 'Vivek Vihar',
        location: 'Vivek Vihar, East Delhi',
        lat: 28.6722,
        lng: 77.3147,
        aqi: 301,
        status: 'hazardous',
        pollutants: { pm25: 228, pm10: 356, co: 2.2, no2: 79, so2: 34, o3: 45 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'nehru-nagar',
        name: 'Nehru Nagar',
        location: 'Nehru Nagar, East Delhi',
        lat: 28.6478,
        lng: 77.2712,
        aqi: 256,
        status: 'severe',
        pollutants: { pm25: 182, pm10: 298, co: 1.8, no2: 67, so2: 23, o3: 41 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'major-dhyan-chand',
        name: 'Major Dhyan Chand Stadium',
        location: 'India Gate, Central Delhi',
        lat: 28.6117,
        lng: 77.2378,
        aqi: 167,
        status: 'unhealthy',
        pollutants: { pm25: 98, pm10: 178, co: 1.0, no2: 41, so2: 13, o3: 29 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'alipur',
        name: 'Alipur',
        location: 'Alipur, North Delhi',
        lat: 28.7943,
        lng: 77.1528,
        aqi: 234,
        status: 'severe',
        pollutants: { pm25: 167, pm10: 278, co: 1.7, no2: 61, so2: 21, o3: 38 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'pusa',
        name: 'PUSA DPCC',
        location: 'IARI, Pusa Road',
        lat: 28.6393,
        lng: 77.1462,
        aqi: 189,
        status: 'unhealthy',
        pollutants: { pm25: 118, pm10: 203, co: 1.3, no2: 48, so2: 16, o3: 32 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'dilshad-garden',
        name: 'Dilshad Garden',
        location: 'Dilshad Garden, East Delhi',
        lat: 28.6789,
        lng: 77.3178,
        aqi: 278,
        status: 'severe',
        pollutants: { pm25: 198, pm10: 312, co: 2.0, no2: 71, so2: 27, o3: 42 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'sonia-vihar',
        name: 'Sonia Vihar',
        location: 'Sonia Vihar, North East Delhi',
        lat: 28.7123,
        lng: 77.2567,
        aqi: 312,
        status: 'hazardous',
        pollutants: { pm25: 238, pm10: 367, co: 2.3, no2: 81, so2: 32, o3: 46 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'burari',
        name: 'Burari Crossing',
        location: 'Burari, North Delhi',
        lat: 28.7512,
        lng: 77.1945,
        aqi: 289,
        status: 'severe',
        pollutants: { pm25: 212, pm10: 334, co: 2.1, no2: 74, so2: 29, o3: 43 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'dr-karni-singh',
        name: 'Dr. Karni Singh Shooting Range',
        location: 'Tughlakabad, South Delhi',
        lat: 28.4987,
        lng: 77.2654,
        aqi: 198,
        status: 'unhealthy',
        pollutants: { pm25: 125, pm10: 212, co: 1.4, no2: 51, so2: 17, o3: 34 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'aya-nagar',
        name: 'Aya Nagar',
        location: 'Aya Nagar, South Delhi',
        lat: 28.4689,
        lng: 77.1312,
        aqi: 145,
        status: 'poor',
        pollutants: { pm25: 76, pm10: 154, co: 0.8, no2: 34, so2: 11, o3: 25 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'najafgarh',
        name: 'Najafgarh',
        location: 'Najafgarh, South West Delhi',
        lat: 28.6092,
        lng: 76.9798,
        aqi: 178,
        status: 'unhealthy',
        pollutants: { pm25: 108, pm10: 189, co: 1.1, no2: 44, so2: 15, o3: 30 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    },
    {
        id: 'jawaharlal-nehru-stadium',
        name: 'JLN Stadium',
        location: 'Lodhi Road, Central Delhi',
        lat: 28.5829,
        lng: 77.2332,
        aqi: 156,
        status: 'unhealthy',
        pollutants: { pm25: 89, pm10: 167, co: 0.9, no2: 39, so2: 13, o3: 28 },
        lastUpdated: '2025-12-07T23:00:00',
        type: 'government'
    }
];

// Bus Routes in Delhi
export const busRoutes: BusRoute[] = [
    {
        id: 'dtc-e1',
        routeNumber: 'E-1',
        name: 'Mehrauli - ISBT Kashmere Gate',
        type: 'electric',
        coordinates: [[28.5245, 77.1855], [28.5503, 77.2155], [28.5918, 77.2273], [28.6362, 77.2010], [28.6670, 77.2285]],
        currentAqi: 189,
        deviceInstalled: true
    },
    {
        id: 'dtc-e2',
        routeNumber: 'E-2',
        name: 'Dwarka Sec 21 - Old Delhi Railway Station',
        type: 'electric',
        coordinates: [[28.5523, 77.0582], [28.5744, 77.0658], [28.6289, 77.2405], [28.6558, 77.2289]],
        currentAqi: 234,
        deviceInstalled: true
    },
    {
        id: 'dtc-501',
        routeNumber: '501',
        name: 'Badarpur - Old Delhi',
        type: 'non-electric',
        coordinates: [[28.5062, 77.3033], [28.5306, 77.2711], [28.5829, 77.2332], [28.6362, 77.2010], [28.6558, 77.2289]],
        currentAqi: 267,
        deviceInstalled: false
    },
    {
        id: 'dtc-729',
        routeNumber: '729',
        name: 'Rohini Sec 3 - Connaught Place',
        type: 'non-electric',
        coordinates: [[28.7495, 77.0565], [28.7256, 77.1668], [28.6953, 77.1818], [28.6519, 77.1473], [28.6310, 77.2190]],
        currentAqi: 245,
        deviceInstalled: false
    },
    {
        id: 'mun-m1',
        routeNumber: 'M-1',
        name: 'Narela - ISBT Anand Vihar',
        type: 'municipal',
        coordinates: [[28.8526, 77.0931], [28.7943, 77.1528], [28.7256, 77.1668], [28.6877, 77.2100], [28.6469, 77.3164]],
        currentAqi: 356,
        deviceInstalled: true
    },
    {
        id: 'mun-m2',
        routeNumber: 'M-2',
        name: 'Mundka - Nehru Place',
        type: 'municipal',
        coordinates: [[28.6814, 77.0324], [28.6683, 77.1167], [28.6519, 77.1473], [28.5918, 77.2273], [28.5503, 77.2155]],
        currentAqi: 289,
        deviceInstalled: false
    }
];

// PranaMesh Devices
export const pranaMeshDevices: PranaMeshDevice[] = [
    {
        id: 'pg-001',
        name: 'P-Gate Alpha',
        type: 'P-Gate',
        description: 'Vertical air pillar for bus stops & school gates. Creates a micro clean-air zone using laminar jet technology.',
        features: ['Directional Plume Sensing', 'Solar Powered', 'LoRa Mesh', 'BioLung™ Filter'],
        status: 'active',
        location: { lat: 28.5355, lng: 77.1539, name: 'AICTE Delhi Gate' }
    },
    {
        id: 'pp-001',
        name: 'P-Park Beta',
        type: 'P-Park',
        description: 'Smart air bench for parks & public spaces. Provides clean air bubble for seated users.',
        features: ['UV-C Sterilization', 'Moss Bio-filter', 'Weather Resistant', 'Mobile App Integration'],
        status: 'active',
        location: { lat: 28.5918, lng: 77.2273, name: 'Lodhi Garden' }
    },
    {
        id: 'pm-001',
        name: 'P-Move Gamma',
        type: 'P-Move',
        description: 'Mobile air quality monitor & purifier for buses. Real-time AQI tracking along routes.',
        features: ['Vehicle Mount', 'GPS Tracking', '24h Battery', 'Route Mapping'],
        status: 'active',
        location: { lat: 28.6289, lng: 77.2405, name: 'DTC Bus E-1' }
    },
    {
        id: 'pmi-001',
        name: 'P-Micro Delta',
        type: 'P-Micro',
        description: 'Compact indoor unit for classrooms & offices. Silent operation with HEPA + activated carbon.',
        features: ['Whisper Quiet', 'HEPA H13', 'VOC Removal', 'Smart Scheduling'],
        status: 'maintenance'
    }
];

// Traffic Zones (30+ stations info)
export const trafficZones: TrafficZone[] = [
    { id: 'tz-1', name: 'ITO Junction', area: 'Central Delhi', trafficDensity: 'very-high', avgAqi: 312, peakHours: '8AM-11AM, 5PM-9PM', recommendedDevices: 4 },
    { id: 'tz-2', name: 'Anand Vihar ISBT', area: 'East Delhi', trafficDensity: 'very-high', avgAqi: 389, peakHours: '6AM-10AM, 4PM-10PM', recommendedDevices: 5 },
    { id: 'tz-3', name: 'Punjabi Bagh Chowk', area: 'West Delhi', trafficDensity: 'high', avgAqi: 278, peakHours: '9AM-12PM, 6PM-9PM', recommendedDevices: 3 },
    { id: 'tz-4', name: 'Rohini Sector 3', area: 'North Delhi', trafficDensity: 'high', avgAqi: 245, peakHours: '8AM-11AM, 5PM-8PM', recommendedDevices: 3 },
    { id: 'tz-5', name: 'Munirka', area: 'South Delhi', trafficDensity: 'high', avgAqi: 198, peakHours: '9AM-11AM, 6PM-8PM', recommendedDevices: 2 },
    { id: 'tz-6', name: 'Kashmere Gate ISBT', area: 'North Delhi', trafficDensity: 'very-high', avgAqi: 298, peakHours: '7AM-11AM, 4PM-9PM', recommendedDevices: 4 },
    { id: 'tz-7', name: 'Connaught Place', area: 'Central Delhi', trafficDensity: 'high', avgAqi: 189, peakHours: '10AM-8PM', recommendedDevices: 3 },
    { id: 'tz-8', name: 'Nehru Place', area: 'South Delhi', trafficDensity: 'high', avgAqi: 212, peakHours: '9AM-7PM', recommendedDevices: 2 },
];

// Weather Data
export const currentWeather: WeatherData = {
    temperature: 18,
    humidity: 72,
    windSpeed: 8,
    windDirection: 'NW',
    condition: 'Hazy'
};

// Static hourly data for last 24 hours (pre-generated to avoid hydration mismatch)
export const generateHourlyData = (): HistoricalDataPoint[] => {
    // Static data points to ensure consistent SSR/client rendering
    return [
        { timestamp: '2025-12-07T00:00:00', aqi: 145, pm25: 89, pm10: 167 },
        { timestamp: '2025-12-07T01:00:00', aqi: 138, pm25: 85, pm10: 158 },
        { timestamp: '2025-12-07T02:00:00', aqi: 132, pm25: 81, pm10: 151 },
        { timestamp: '2025-12-07T03:00:00', aqi: 128, pm25: 78, pm10: 146 },
        { timestamp: '2025-12-07T04:00:00', aqi: 135, pm25: 83, pm10: 154 },
        { timestamp: '2025-12-07T05:00:00', aqi: 156, pm25: 96, pm10: 178 },
        { timestamp: '2025-12-07T06:00:00', aqi: 178, pm25: 109, pm10: 202 },
        { timestamp: '2025-12-07T07:00:00', aqi: 198, pm25: 121, pm10: 225 },
        { timestamp: '2025-12-07T08:00:00', aqi: 234, pm25: 143, pm10: 266 },
        { timestamp: '2025-12-07T09:00:00', aqi: 256, pm25: 157, pm10: 291 },
        { timestamp: '2025-12-07T10:00:00', aqi: 267, pm25: 163, pm10: 303 },
        { timestamp: '2025-12-07T11:00:00', aqi: 245, pm25: 150, pm10: 278 },
        { timestamp: '2025-12-07T12:00:00', aqi: 223, pm25: 136, pm10: 253 },
        { timestamp: '2025-12-07T13:00:00', aqi: 212, pm25: 130, pm10: 241 },
        { timestamp: '2025-12-07T14:00:00', aqi: 198, pm25: 121, pm10: 225 },
        { timestamp: '2025-12-07T15:00:00', aqi: 189, pm25: 116, pm10: 215 },
        { timestamp: '2025-12-07T16:00:00', aqi: 201, pm25: 123, pm10: 228 },
        { timestamp: '2025-12-07T17:00:00', aqi: 234, pm25: 143, pm10: 266 },
        { timestamp: '2025-12-07T18:00:00', aqi: 267, pm25: 163, pm10: 303 },
        { timestamp: '2025-12-07T19:00:00', aqi: 289, pm25: 177, pm10: 328 },
        { timestamp: '2025-12-07T20:00:00', aqi: 278, pm25: 170, pm10: 316 },
        { timestamp: '2025-12-07T21:00:00', aqi: 256, pm25: 157, pm10: 291 },
        { timestamp: '2025-12-07T22:00:00', aqi: 223, pm25: 136, pm10: 253 },
        { timestamp: '2025-12-07T23:00:00', aqi: 189, pm25: 116, pm10: 215 },
    ];
};

// Static weekly data (pre-generated to avoid hydration mismatch)
export const generateWeeklyData = (): HistoricalDataPoint[] => {
    return [
        { timestamp: '2025-12-01T12:00:00', aqi: 234, pm25: 143, pm10: 266 },
        { timestamp: '2025-12-02T12:00:00', aqi: 267, pm25: 163, pm10: 303 },
        { timestamp: '2025-12-03T12:00:00', aqi: 198, pm25: 121, pm10: 225 },
        { timestamp: '2025-12-04T12:00:00', aqi: 289, pm25: 177, pm10: 328 },
        { timestamp: '2025-12-05T12:00:00', aqi: 245, pm25: 150, pm10: 278 },
        { timestamp: '2025-12-06T12:00:00', aqi: 212, pm25: 130, pm10: 241 },
        { timestamp: '2025-12-07T12:00:00', aqi: 223, pm25: 136, pm10: 253 },
    ];
};

// Static heatmap data (pre-generated to avoid hydration mismatch)
export const generateHeatmapData = (): HeatmapCell[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data: HeatmapCell[] = [];

    // Pre-computed static values for each day-hour combination
    const staticValues: Record<string, number[]> = {
        'Sun': [98, 92, 89, 87, 95, 112, 145, 178, 198, 212, 189, 167, 156, 148, 142, 138, 152, 189, 212, 198, 178, 156, 134, 112],
        'Mon': [115, 108, 102, 98, 112, 145, 189, 234, 267, 289, 256, 212, 189, 178, 167, 156, 178, 234, 278, 267, 234, 198, 167, 134],
        'Tue': [118, 112, 105, 101, 118, 152, 198, 245, 278, 298, 267, 223, 198, 187, 176, 165, 189, 245, 289, 278, 245, 209, 178, 145],
        'Wed': [112, 105, 98, 95, 108, 142, 187, 234, 267, 287, 256, 212, 189, 178, 167, 156, 178, 234, 278, 267, 234, 198, 167, 134],
        'Thu': [115, 108, 102, 98, 112, 148, 192, 239, 272, 292, 261, 217, 194, 183, 172, 161, 183, 239, 283, 272, 239, 203, 172, 139],
        'Fri': [121, 114, 108, 104, 121, 158, 203, 250, 283, 306, 272, 228, 203, 192, 181, 170, 192, 250, 294, 283, 250, 214, 183, 150],
        'Sat': [102, 96, 92, 90, 98, 118, 152, 187, 209, 223, 198, 176, 165, 156, 150, 145, 161, 198, 223, 209, 187, 165, 143, 118],
    };

    days.forEach((day) => {
        for (let hour = 0; hour < 24; hour++) {
            data.push({
                hour,
                day,
                value: staticValues[day][hour]
            });
        }
    });

    return data;
};
