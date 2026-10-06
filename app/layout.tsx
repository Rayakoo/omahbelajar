import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Lilita_One } from "next/font/google";
import LayoutShell from "@/components/LayoutShell";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PlayerNameProvider } from "@/contexts/PlayerNameContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const lilitaOne = Lilita_One({
  variable: "--font-lilita",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://omahbelajar.org"),
  title: "Omah Belajar",
  description: "Platform belajar interaktif dengan kursus, kuis, dan minigames edukatif.",
  icons: {
    icon: "/images/logo_omah.png",
    apple: "/images/logo_omah.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "Omah Belajar",
    description: "Platform belajar interaktif dengan kursus, kuis, dan minigames edukatif.",
    siteName: "Omah Belajar",
    images: [
      {
        url: "/images/logo_omah.png",
        width: 512,
        height: 512,
        alt: "Omah Belajar",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${lilitaOne.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-page-50 font-sans text-brand-900 flex flex-col">
        <LanguageProvider>
          <AuthProvider>
            <PlayerNameProvider>
              <LayoutShell>{children}</LayoutShell>
              <AccessibilityWidget />
            </PlayerNameProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}