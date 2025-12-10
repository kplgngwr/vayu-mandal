import AQIHeroDisplay from '@/components/AQIHeroDisplay';
import ForecastSection from '@/components/ForecastSection';
import NetworkStatsSection from '@/components/NetworkStatsSection';
import CapabilitiesSection from '@/components/CapabilitiesSection';

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <AQIHeroDisplay />
        <ForecastSection />
        <NetworkStatsSection />
        <CapabilitiesSection />
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-16">
          <div className="flex flex-col gap-4">
            <h3 className="text-text-dark dark:text-white text-2xl font-bold">About The Project</h3>
            <p className="text-text-muted-light dark:text-text-muted">PranaMesh is a state-of-the-art air quality monitoring solution developed by Team Optivis for the Smart India Hackathon 2025. Our mission is to provide accurate, real-time data and insightful analytics to empower citizens, researchers, and policymakers in the Delhi-NCR region to make informed decisions for a healthier environment.</p>
          </div>
        </div>
      </main>
    </>
  );
}
