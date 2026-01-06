import type { Metadata } from "next";
import { Geist, Geist_Mono, Patrick_Hand } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import ToastProvider from "@/components/ToastProvider";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-patrick-hand",
});

export const metadata: Metadata = {
  title: "OREEGAM'IA - Veille IA & No-Code",
  description: "Veille technologique IA et No-Code personnalisée. Newsletters, JT vidéo et classification intelligente.",
  keywords: ["IA", "No-Code", "Veille", "Automatisation", "Newsletter", "Technologie"],
  authors: [{ name: "OREEGAM'IA" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "OREEGAM'IA - Veille IA & No-Code",
    description: "Découvrez l'essentiel de l'actu IA & No-Code.",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "OREEGAM'IA - Veille IA & No-Code",
    description: "Découvrez l'essentiel de l'actu IA & No-Code.",
  },
};

import { GenkitChat } from "@/components/GenkitChat";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${patrickHand.variable} antialiased`}
      >
        {children}
        <CookieBanner />
        <ToastProvider />
        <GenkitChat />
        <Script
          src="https://valid-artisan-pimous.web.app/widget.js"
          data-artisan-id="fr-re-995"
          data-review-url="https://search.google.com/local/writereview?placeid=ChIJ3eypf2SjthIRpoW3KVHENTY"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
