export default function CapabilitiesSection() {
  return (
    <div className="flex flex-col gap-10 px-4 sm:px-6 md:px-8 lg:px-12 py-16 @container">
      <div className="flex flex-col items-start text-left gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-text-dark dark:text-white tracking-tight text-[32px] font-bold leading-tight @[480px]:text-4xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] max-w-full">
            Key Capabilities
          </h1>
          <p className="text-text-muted-light dark:text-text-muted text-base font-normal leading-normal max-w-full">
            PranaMesh provides a comprehensive suite of tools to monitor and analyze air quality data in real-time.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 p-0">
        <div className="flex flex-1 gap-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 flex-col">
          <div className="text-primary-light-theme dark:text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>map</span>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-text-dark dark:text-white text-lg font-bold leading-tight">Live Geospatial Mapping</h2>
            <p className="text-text-muted-light dark:text-text-muted text-sm font-normal leading-normal">Visualizing AQI data across locations in real-time.</p>
          </div>
        </div>
        <div className="flex flex-1 gap-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 flex-col">
          <div className="text-primary-light-theme dark:text-warm-orange">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>traffic</span>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-text-dark dark:text-white text-lg font-bold leading-tight">Traffic Correlation</h2>
            <p className="text-text-muted-light dark:text-text-muted text-sm font-normal leading-normal">Analyzing the impact of traffic patterns on air quality.</p>
          </div>
        </div>
        <div className="flex flex-1 gap-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 flex-col">
          <div className="text-primary-light-theme dark:text-primary-light">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>history</span>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-text-dark dark:text-white text-lg font-bold leading-tight">Historical Data Analysis</h2>
            <p className="text-text-muted-light dark:text-text-muted text-sm font-normal leading-normal">Understanding air quality trends and patterns over time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
