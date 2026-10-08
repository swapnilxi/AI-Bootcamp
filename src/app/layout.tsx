import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Montserrat } from "next/font/google";
import "./globals.css";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/effects.css";
import "@/styles/cards.css";
import "@/styles/scenes.css";
import "@/styles/animations.css";
import "@/styles/pills.css";
import "@/styles/reduced-motion.css";
import { Providers } from "@/components/providers/Providers";
import { EditorialHeader } from "@/components/layout/header/EditorialHeader";
import { EditorialFooter } from "@/components/layout/footer/EditorialFooter";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { StarfieldBackground } from "@/components/three/StarfieldBackground";
import { MotionEffects } from "@/components/motion/MotionEffects";
import { Suspense } from "react";
import { TutorWidget } from "@/components/ai/TutorWidget";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://aibootcamp.dev"),
  title: "AI Bootcamp | Learn AI. Build AI. Ship AI.",
  description:
    "A project-driven AI engineering school. Go from Python and machine learning to RAG, AI agents, multi-agent systems and production AI — building real systems at every stage.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "AI Bootcamp | Learn AI. Build AI. Ship AI.",
    description:
      "Structured AI learning paths, hands-on AI labs, real projects and an AI tutor that knows where you are. Become an AI engineer by building.",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Bootcamp",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0D",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body className="bg-black text-text min-h-screen flex flex-col font-sans selection:bg-gold selection:text-[#0C0B0A] overflow-x-hidden" suppressHydrationWarning>
        <Providers>
          <SmoothScrollProvider>
            <StarfieldBackground />
            <div className="grain-overlay" aria-hidden="true" />
            <MotionEffects />
            <EditorialHeader />
            <main className="relative z-10 flex-grow flex flex-col">{children}</main>
            <EditorialFooter />
            <Suspense fallback={null}>
              <TutorWidget />
            </Suspense>
          </SmoothScrollProvider>
        </Providers>
      </body>
    </html>
  );
}
