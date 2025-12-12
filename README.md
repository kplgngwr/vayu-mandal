# PranaMesh AQI Dashboard

Real-time air quality monitoring dashboard for AICTE Delhi and the NCR region, developed by Team Optivis for Smart India Hackathon 2025.

![PranaMesh Dashboard](public/images/hero-light.webp)

## Features

- 🌍 **Real-time AQI Monitoring** - Live data from 30+ stations across Delhi-NCR
- 🗺️ **Interactive Map** - Google Maps integration with station markers and boundary visualization
- 📊 **Data Analytics** - Historical trends, pollutant breakdowns, and traffic analysis
- 🌓 **Dark/Light Theme** - Seamless theme switching with system preference detection
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 🔒 **Secure** - Security headers, CORS configuration, and environment-based secrets

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React, Material Symbols
- **Maps**: Google Maps JavaScript API, React Google Maps
- **Charts**: Chart.js, React-Chartjs-2
- **Data Sources**: CPCB Open Data API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Maps API key (for mapping features)
- CPCB API key (for live AQI data)

### Environment Setup

1. Copy the environment example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your API keys in `.env.local`:
   ```env
   CPCB_API_KEY=your_cpcb_api_key_here
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Firebase (Realtime DB + Firestore)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
   NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxx
   ```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (AQI, buses)
│   ├── mapping/           # Map view page
│   ├── timestamp/         # Historical data page
│   ├── trafficdata/       # Traffic analysis page
│   └── layout.tsx         # Root layout with header/footer
├── components/            # React components
│   ├── AQIHeroDisplay.tsx # Homepage hero section
│   ├── AQIMap.tsx         # Google Maps component
│   ├── Header.tsx         # Navigation header
│   └── Footer.tsx         # Page footer
├── lib/                   # Backend services
│   ├── aqi-service.ts     # AQI data fetching
│   └── bus-service.ts     # Bus route data
├── data/                  # Static data files
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy

### Docker

```bash
# Build the image
docker build -t pranamesh-dashboard .

# Run the container
docker run -p 3000:3000 pranamesh-dashboard
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/aqi` | GET | Returns real-time AQI data for all stations |
| `/api/aqi?refresh=true` | GET | Forces data refresh bypassing cache |
| `/api/buses` | GET | Returns bus positions and routes |

## Data Model (Firebase → Firestore)

The app subscribes to Firebase Realtime Database at `stations/*` and mirrors updates into Firestore for historical analysis.

Realtime Database payload (per station):

```
stations/{stationId} = {
   aqi: number,
   pm25|pm2_5?: number,
   pm10?: number,
   pm1_0?: number,
   co?: number, no2?: number, so2?: number, o3?: number,
   methane?: number, tvoc_ppb?|sgp_tvoc_ppb?: number, eco2_ppm?|sgp_eco2_ppm?: number,
   deviceId?: string, deviceModel?: string, battery?: number,
   name?: string, location?: string, lat?: number, lng?: number,
   lastUpdated?: ISOString
}
```

Firestore schema (created automatically on updates):

```
collections:
   stations (doc id = stationId)
      fields:
         stationId: string
         name: string
         location: string
         coordinates: { lat: number, lng: number } | null
         device: { id?: string, model?: string, battery?: number }
         latest: {
            aqi: number,
            pm25?: number, pm10?: number, pm1_0?: number,
            co?: number, no2?: number, so2?: number, o3?: number,
            methane?: number, tvoc_ppb?: number, eco2_ppm?: number,
            updatedAt: ISOString
         }
         createdAt: serverTimestamp
         updatedAt: serverTimestamp
      subcollections:
         readings
            (auto-id documents, one per update)
            fields:
               aqi, pollutants..., coordinates, battery, deviceId, deviceModel,
               dataTimestamp: ISOString (from RTDB `lastUpdated`)
               createdAt: serverTimestamp
```

Notes:
- The sync is best-effort from the client. For production, move mirroring to a Cloud Function triggered on RTDB writes and restrict client write rules.
- The sync deduplicates by `lastUpdated` per station.

## Configuration

### Security Headers

The application includes the following security headers (configured in `next.config.ts`):
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block

### Caching

- AQI data is cached for 5 minutes
- Static assets use long-term caching
- API responses include proper cache headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check for issues
5. Submit a pull request

## License

This project is developed for Smart India Hackathon 2025 by Team Optivis.

## Acknowledgments

- Central Pollution Control Board (CPCB) for open data APIs
- Delhi Pollution Control Committee (DPCC)
- Haryana State Pollution Control Board (HSPCB)
- SAFAR India for air quality research

## Competition & Team

- **Smart India Hackathon 2025 (SIH-2025)**: This application was developed as the SIH-2025 submission for the Air Quality category.
- **Team**: Optivis — multidisciplinary team focused on environmental sensing, embedded systems, and data-driven public-health tools.

## Vision & Roadmap (Productization Plan)

We built PranaMesh as a working prototype and demonstration platform. The next steps to convert this into a production-ready product are:

- **1) Harden data ingestion**: Move RTDB→Firestore mirroring to Cloud Functions (server-side triggers) and validate incoming sensor payloads.
- **2) Access control & multi-tenant**: Add robust authentication (OAuth/OIDC), role-based access (admin/operator/viewer), and tenant scoping for city-level deployments.
- **3) Observability & Alerts**: Integrate centralized logging, metrics (Prometheus/Grafana) and user-configurable alerts (email/SMS/push) for unhealthy spikes.
- **4) Device management**: Add device provisioning, OTA update flow, and remote actuator control (purifiers, relays) with audit logs.
- **5) Compliance & Privacy**: Implement data retention policies, anonymization options, and ensure compliance with local data protection rules.
- **6) UX polish & mobile apps**: Develop mobile apps and refine the dashboard UI for non-technical operators and community users.
- **7) Commercial readiness**: SLA, deployment automation (IaC), multi-region hosting, and pricing/packaging for municipalities and enterprises.

If you'd like, I can scaffold these items into GitHub issues and approximate implementation timelines.
