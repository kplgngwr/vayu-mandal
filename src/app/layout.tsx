import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";


const spaceGrotesk = Space_Grotesk({
    variable: "--font-display",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vayu-mandal.vercel.app"),
    title: {
        default: "Vayu Mandal",
        template: "%s | PranaMesh",
    },
    description: "Real-time air quality monitoring for AICTE Delhi and across the NCR region. Track AQI, PM2.5, PM10, and other pollutants with live data from government and PranaMesh sensors.",
    keywords: ["AQI", "air quality index", "Delhi", "NCR", "pollution", "PM2.5", "PM10", "air monitoring", "CPCB", "real-time", "PranaMesh"],
    authors: [{ name: "Team Optivis" }],
    creator: "Team Optivis - Smart India Hackathon 2025",
    publisher: "Central Control Room for Air Quality Management",
    openGraph: {
        title: "PranaMesh AQI Dashboard",
        description: "Real-time air quality monitoring for Delhi-NCR region",
        url: process.env.NEXT_PUBLIC_APP_URL || "https://vayu-mandal.vercel.app",
        siteName: "Vayu Mandal",
        locale: "en_IN",
        type: "website",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "PranaMesh AQI Dashboard",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "PranaMesh AQI Dashboard",
        description: "Real-time air quality monitoring for Delhi-NCR region",
        images: ["/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    verification: {
        google: "your-google-verification-code",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${spaceGrotesk.variable}`} suppressHydrationWarning>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </head>
            <body
                className={`font-display bg-background-light text-text-dark dark:bg-background-dark dark:text-text-light transition-colors duration-300 antialiased`}
                suppressHydrationWarning
            >
                <ThemeProvider>
                    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
                        <Header />
                        <div className="layout-container flex h-full grow flex-col">
                            {children}
                        </div>
                        <Footer />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
