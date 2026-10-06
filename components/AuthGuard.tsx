"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.auth : en.auth;
  const common = locale === "id" ? id.common : en.common;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-50">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-page-50">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>

        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#4A4765]/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7 text-[#4A4765]" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {t.loginRequired}
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {t.loginRequiredDesc}
            </p>

            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full bg-[#4A4765] hover:bg-[#3b3852] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {t.loginBtn}
              </Link>
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                {common.backToHome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
