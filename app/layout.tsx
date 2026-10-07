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
  metadataBase: new URL("https://omahnalar.org"),
  title: {
    default: "Omah Belajar — Bagian dari Omah Nalar",
    template: "%s — Omah Belajar",
  },
  description:
    "Omah Belajar adalah platform edukasi bagian dari Omah Nalar — ruang belajar interaktif tentang kesehatan reproduksi dan pencegahan kekerasan seksual melalui course, kuis, dan minigames edukatif.",
  keywords: ["Omah Belajar", "Omah Nalar", "edukasi", "kesehatan reproduksi", "course", "minigames", "kuis edukatif"],
  authors: [{ name: "Omah Nalar" }],
  creator: "Omah Nalar",
  publisher: "Omah Nalar",
  icons: {
    icon: "/images/logo_omah.png",
    apple: "/images/logo_omah.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "Omah Belajar — Bagian dari Omah Nalar",
    description:
      "Omah Belajar adalah platform edukasi bagian dari Omah Nalar — ruang belajar interaktif tentang kesehatan reproduksi dan pencegahan kekerasan seksual melalui course, kuis, dan minigames edukatif.",
    url: "https://omahnalar.org",
    siteName: "Omah Belajar",
    locale: "id_ID",
    images: [
      {
        url: "/images/logo_omah.png",
        width: 667,
        height: 374,
        alt: "Logo Omah Nalar — Omah Belajar",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omah Belajar — Bagian dari Omah Nalar",
    description:
      "Platform edukasi bagian dari Omah Nalar: belajar kesehatan reproduksi lewat course, kuis, dan minigames interaktif.",
    images: ["/images/logo_omah.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
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