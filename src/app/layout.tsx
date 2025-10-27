import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import ToastProvider from "@/components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IA Veille - Votre Veille Technologique IA Personnalisée",
  description: "La seule plateforme qui filtre le bruit pour vous livrer la veille technologique IA qui vous correspond. Newsletters personnalisées, classification intelligente et podcast audio.",
  keywords: ["IA", "Intelligence Artificielle", "Veille", "Machine Learning", "LLM", "Newsletter", "Technologie"],
  authors: [{ name: "IA Veille" }],
  openGraph: {
    title: "IA Veille - Votre Veille Technologique IA Personnalisée",
    description: "Ne recevez que l'essentiel : les avancées, les modèles et les analyses qui font progresser votre secteur.",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "IA Veille - Votre Veille Technologique IA Personnalisée",
    description: "Ne recevez que l'essentiel : les avancées, les modèles et les analyses qui font progresser votre secteur.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <CookieBanner />
        <ToastProvider />
      </body>
    </html>
  );
}
