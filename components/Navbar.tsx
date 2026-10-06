"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Languages } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";

const NAV_LINKS = [
  { label: "Siswa", href: "/siswa" },
  { label: "Orang tua", href: "/orang-tua" },
  { label: "Umum", href: "/umum" },
  { label: "Mini games", href: "/minigames" },
  { label: "Saran", href: "/#saran" },
];

function isLinkActive(pathname: string, href: string) {
  if (href === "/#saran") return false;
  if (href === "/minigames") return pathname.startsWith("/minigames");
  return pathname === href;
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, profileComplete, loading, signOut } = useAuth();
  const { locale, toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = locale === "id" ? id.nav : en.nav;

  const profileIncomplete = !!user && !profileComplete;

  return (
    <div className="sticky top-0 left-0 right-0 z-50">
      <nav className="w-full flex items-center justify-between gap-4 px-6 py-4 bg-[#ffca6f] rounded-b-2xl shadow-sm font-poppins relative">
        {/* 1. Logo Kiri */}
        <Link href="/" className="flex items-center shrink-0">
          <img src="/images/logo_omah.png" alt="Logo Omah Belajar" className="h-16 w-auto object-contain" />
        </Link>

        {/* 2. Menu Navigasi + Tombol Bahasa (terbagi sama rata) */}
        <div className="hidden lg:flex flex-1 items-center justify-evenly mx-6">
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(pathname, link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-[#0A337A] text-white"
                    : "text-[#0A337A] hover:bg-[#0A337A]/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Tombol Switch Bahasa */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#0A337A] hover:bg-[#0A337A]/10 transition-colors border-2 border-[#0A337A] shrink-0"
            title={locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
            aria-label="Switch Language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{locale === "id" ? "EN" : "ID"}</span>
          </button>
        </div>

        {/* 3. Kanan: info user / login + Maskot */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-black/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="hidden lg:block text-sm font-semibold text-[#0A337A]">
                  {t.hai}, {(user.user_metadata?.full_name || user.email).split(" ")[0]}
                </span>
                <Link
                  href="/profile"
                  className="relative shrink-0"
                  title={t.profil}
                >
                  <img
                    src={user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"}
                    alt={user.user_metadata?.full_name || "Profile"}
                    className="w-10 h-10 rounded-full border-2 border-[#0A337A] object-cover shadow-sm hover:opacity-80 transition-all"
                  />
                  {profileIncomplete && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-[#ffca6f] rounded-full" />
                  )}
                </Link>
                <button
                  onClick={signOut}
                  className="text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors hidden lg:block"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center space-x-2 bg-[#0A337A] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-900 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>LOGIN</span>
              </Link>
            )}
          </div>

          {/* Maskot Kanan */}
          <Link href="/" className="flex items-center shrink-0" aria-label="Maskot Nalar">
            <img
              src="/images/maskot_nalar.png"
              alt="Maskot Nalar"
              className="h-14 w-14 rounded-full object-cover"
            />
          </Link>

          <button
            className="lg:hidden p-2 rounded-lg text-[#0A337A] hover:bg-[#0A337A]/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#ffca6f] rounded-b-2xl shadow-lg lg:hidden z-50">
            <div className="flex flex-col p-4 gap-2">
              {NAV_LINKS.map((link) => {
                const isActive = isLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#0A337A] text-white"
                        : "text-[#0A337A] hover:bg-[#0A337A]/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={() => { toggleLanguage(); }}
                className="px-4 py-3 rounded-xl text-sm font-semibold bg-[#0A337A]/10 text-[#0A337A] text-center flex items-center justify-center gap-2"
              >
                <Languages className="w-4 h-4" />
                {locale === "id" ? "English" : "Indonesia"}
              </button>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-semibold bg-[#0A337A]/10 text-[#0A337A] text-center"
                  >
                    {t.profil}
                  </Link>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="px-4 py-3 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white text-center"
                  >
                    {t.logout}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-bold bg-[#0A337A] text-white text-center sm:hidden"
                >
                  LOGIN
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
