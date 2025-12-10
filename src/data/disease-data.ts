import type { AQIStatus } from '@/types';

/**
 * Disease information related to air pollution
 */
export interface DiseaseInfo {
    name: string;
    description: string;
    riskFactor: 'low' | 'moderate' | 'high' | 'very-high' | 'severe';
    icon: string; // Emoji icon for visual representation
}

/**
 * Health advisory information based on AQI level
 */
export interface HealthAdvisory {
    level: AQIStatus;
    title: string;
    description: string;
    diseases: DiseaseInfo[];
    symptoms: string[];
    atRiskGroups: string[];
    recommendations: string[];
    outdoorActivityAdvice: string;
}

/**
 * Comprehensive disease data related to air pollution exposure
 */
export const pollutionRelatedDiseases: DiseaseInfo[] = [
    {
        name: 'Asthma',
        description: 'Chronic respiratory condition causing airway inflammation and breathing difficulties',
        riskFactor: 'high',
        icon: '',
    },
    {
        name: 'COPD',
        description: 'Chronic Obstructive Pulmonary Disease - progressive lung disease affecting breathing',
        riskFactor: 'very-high',
        icon: '',
    },
    {
        name: 'Bronchitis',
        description: 'Inflammation of the bronchial tubes causing coughing and mucus production',
        riskFactor: 'moderate',
        icon: '',
    },
    {
        name: 'Lung Cancer',
        description: 'Malignant tumor in lung tissue, strongly linked to prolonged pollution exposure',
        riskFactor: 'severe',
        icon: '',
    },
    {
        name: 'Heart Disease',
        description: 'Cardiovascular conditions including heart attacks and arrhythmias',
        riskFactor: 'high',
        icon: '',
    },
    {
        name: 'Stroke',
        description: 'Disruption of blood supply to the brain, risk increases with pollution exposure',
        riskFactor: 'high',
        icon: '',
    },
    {
        name: 'Allergic Rhinitis',
        description: 'Inflammation of nasal passages causing sneezing, runny nose, and congestion',
        riskFactor: 'moderate',
        icon: '',
    },
    {
        name: 'Eye Irritation',
        description: 'Burning, redness, and watering of eyes due to airborne pollutants',
        riskFactor: 'low',
        icon: '',
    },
    {
        name: 'Pneumonia',
        description: 'Lung infection that can be exacerbated by poor air quality',
        riskFactor: 'high',
        icon: '',
    },
    {
        name: 'Respiratory Infections',
        description: 'Increased susceptibility to viral and bacterial infections',
        riskFactor: 'moderate',
        icon: '',
    },
];

/**
 * Health advisories for each AQI level
 */
export const healthAdvisories: Record<AQIStatus, HealthAdvisory> = {
    good: {
        level: 'good',
        title: 'Good Air Quality',
        description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
        diseases: [
            pollutionRelatedDiseases.find(d => d.name === 'Eye Irritation')!,
        ],
        symptoms: ['None expected for general population'],
        atRiskGroups: ['Extremely sensitive individuals may experience minor symptoms'],
        recommendations: [
            'Great day for outdoor activities',
            'Windows can be opened for ventilation',
            'No precautions needed',
        ],
        outdoorActivityAdvice: 'Ideal for all outdoor activities',
    },
    moderate: {
        level: 'moderate',
        title: 'Moderate Air Quality',
        description: 'Air quality is acceptable. Some pollutants may be a concern for a very small number of people.',
        diseases: [
            pollutionRelatedDiseases.find(d => d.name === 'Allergic Rhinitis')!,
            pollutionRelatedDiseases.find(d => d.name === 'Eye Irritation')!,
        ],
        symptoms: [
            'Mild discomfort for sensitive individuals',
            'Slight eye or throat irritation possible',
        ],
        atRiskGroups: [
            'People with respiratory conditions',
            'Those with severe allergies',
        ],
        recommendations: [
            'Sensitive individuals should consider limiting prolonged outdoor exertion',
            'Keep windows partially closed if symptoms occur',
        ],
        outdoorActivityAdvice: 'Suitable for most outdoor activities',
    },
    poor: {
        level: 'poor',
        title: 'Poor Air Quality',
        description: 'Members of sensitive groups may experience health effects. General public less likely to be affected.',
        diseases: [
            pollutionRelatedDiseases.find(d => d.name === 'Asthma')!,
            pollutionRelatedDiseases.find(d => d.name === 'Bronchitis')!,
            pollutionRelatedDiseases.find(d => d.name === 'Allergic Rhinitis')!,
        ],
        symptoms: [
            'Coughing and throat irritation',
            'Difficulty breathing for sensitive groups',
            'Eye irritation and watering',
            'Headaches',
        ],
        atRiskGroups: [
            'Children and elderly',
            'People with asthma or respiratory diseases',
            'Heart disease patients',
            'Outdoor workers',
        ],
        recommendations: [
            'Sensitive groups should reduce prolonged outdoor exertion',
            'Use air purifiers indoors',
            'Close windows during peak pollution hours',
            'Carry rescue inhalers if needed',
        ],
        outdoorActivityAdvice: 'Sensitive groups should limit outdoor activities',
    },
    unhealthy: {
        level: 'unhealthy',
        title: 'Unhealthy Air Quality',
        description: 'Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.',
        diseases: [
            pollutionRelatedDiseases.find(d => d.name === 'Asthma')!,
            pollutionRelatedDiseases.find(d => d.name === 'COPD')!,
            pollutionRelatedDiseases.find(d => d.name === 'Bronchitis')!,
            pollutionRelatedDiseases.find(d => d.name === 'Heart Disease')!,
            pollutionRelatedDiseases.find(d => d.name === 'Respiratory Infections')!,
        ],
        symptoms: [
            'Persistent coughing',
            'Shortness of breath',
            'Chest tightness',
            'Eye, nose, and throat irritation',
            'Fatigue and dizziness',
            'Worsening of existing conditions',
        ],
        atRiskGroups: [
            'Children under 14',
            'Adults over 60',
            'Pregnant women',
            'People with lung or heart disease',
            'Outdoor workers and athletes',
        ],
        recommendations: [
            'Avoid prolonged outdoor activities',
            'Wear N95/KN95 masks outdoors',
            'Run air purifiers indoors',
            'Keep all windows and doors closed',
            'Stay hydrated',
            'Avoid strenuous exercise',
        ],
        outdoorActivityAdvice: 'Everyone should reduce prolonged outdoor exertion',
    },
    severe: {
        level: 'severe',
        title: 'Severe Air Quality',
        description: 'Health warnings of emergency conditions. The entire population is more likely to be affected.',
        diseases: [
            pollutionRelatedDiseases.find(d => d.name === 'Asthma')!,
            pollutionRelatedDiseases.find(d => d.name === 'COPD')!,
            pollutionRelatedDiseases.find(d => d.name === 'Heart Disease')!,
            pollutionRelatedDiseases.find(d => d.name === 'Stroke')!,
            pollutionRelatedDiseases.find(d => d.name === 'Pneumonia')!,
            pollutionRelatedDiseases.find(d => d.name === 'Lung Cancer')!,
        ],
        symptoms: [
            'Severe respiratory distress',
            'Aggravated asthma attacks',
            'Chest pain and palpitations',
            'Severe headaches',
            'Nausea and dizziness',
            'Difficulty concentrating',
            'Skin irritation',
        ],
        atRiskGroups: [
            'Everyone is at risk',
            'Particular danger for children, elderly, and pregnant women',
            'Heart and lung disease patients',
            'Immunocompromised individuals',
        ],
        recommendations: [
            'Avoid ALL outdoor activities if possible',
            'Wear N95 masks even for short outdoor exposure',
            'Seal windows and doors',
            'Use air purifiers on high setting',
            'Consider relocating to less polluted areas temporarily',
            'Seek medical help if symptoms worsen',
            'Keep emergency medications accessible',
        ],
        outdoorActivityAdvice: 'Avoid ALL outdoor exertion',
    },
    hazardous: {
        level: 'hazardous',
        title: 'Hazardous Air Quality',
        description: 'Health alert: everyone may experience serious health effects. This is a public health emergency.',
        diseases: [
            pollutionRelatedDiseases.find(d => d.name === 'Lung Cancer')!,
            pollutionRelatedDiseases.find(d => d.name === 'COPD')!,
            pollutionRelatedDiseases.find(d => d.name === 'Heart Disease')!,
            pollutionRelatedDiseases.find(d => d.name === 'Stroke')!,
            pollutionRelatedDiseases.find(d => d.name === 'Pneumonia')!,
            pollutionRelatedDiseases.find(d => d.name === 'Asthma')!,
        ],
        symptoms: [
            'Life-threatening respiratory conditions',
            'Heart attacks and cardiac events',
            'Stroke symptoms',
            'Severe breathing difficulty even at rest',
            'Loss of consciousness possible',
            'Emergency hospital visits may be required',
        ],
        atRiskGroups: [
            'ENTIRE POPULATION AT SERIOUS RISK',
            'Immediate danger for sensitive groups',
            'Medical emergencies likely to increase',
        ],
        recommendations: [
            'STAY INDOORS - Public health emergency',
            'Do not go outside under any circumstances',
            'Seal all windows, doors, and ventilation',
            'Run all available air purifiers',
            'If you must go out, use N95/N99 masks',
            'Seek immediate medical attention for symptoms',
            'Consider emergency evacuation if prolonged',
            'Schools and workplaces should close',
        ],
        outdoorActivityAdvice: 'EMERGENCY: Stay indoors. Do NOT go outside.',
    },
};

/**
 * Get health advisory for a given AQI value
 */
export function getHealthAdvisory(aqi: number): HealthAdvisory {
    if (aqi <= 50) return healthAdvisories.good;
    if (aqi <= 100) return healthAdvisories.moderate;
    if (aqi <= 150) return healthAdvisories.poor;
    if (aqi <= 200) return healthAdvisories.unhealthy;
    if (aqi <= 300) return healthAdvisories.severe;
    return healthAdvisories.hazardous;
}

/**
 * Get top diseases for a given AQI level
 */
export function getTopDiseasesForAQI(aqi: number, limit: number = 3): DiseaseInfo[] {
    const advisory = getHealthAdvisory(aqi);
    return advisory.diseases.slice(0, limit);
}
