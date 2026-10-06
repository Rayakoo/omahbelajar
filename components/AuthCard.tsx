"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { signIn, signUp } from "@/services/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { id, en } from "@/data/translations";

interface AuthCardProps {
  initialMode: "login" | "register";
}

export default function AuthCard({ initialMode }: AuthCardProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.auth : en.auth;
  const common = locale === "id" ? id.common : en.common;
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin) {
      if (password.length < 6) {
        setError(t.passwordMin);
        return;
      }
      if (password !== confirmPassword) {
        setError(t.confirmMismatch);
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await signIn(email, password);
        setEmail("");
        setPassword("");
        if (!result.user) {
          setError(t.emailUnconfirmed);
          return;
        }
        await refreshUser();
        const isAdmin = result.user?.user_metadata?.role === "admin";
        router.replace(isAdmin ? "/admin" : "/");
      } else {
        const result = await signUp(email, password, name);
        setEmail("");
        setName("");
        setPassword("");
        setConfirmPassword("");
        if (result.user) {
          await refreshUser();
          const isAdmin = result.user?.user_metadata?.role === "admin";
          router.replace(isAdmin ? "/admin" : "/");
        } else {
          router.push("/login?registered=true");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : common.error;
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setError(t.emailExists);
      } else if (msg.includes("weak") || msg.includes("password")) {
        setError(t.weakPassword);
      } else if (msg.includes("Invalid login credentials")) {
        setError(t.wrongCreds);
      } else if (msg.includes("Email not confirmed")) {
        setError(t.emailUnconfirmed);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-page-50 [perspective:1200px]">
      <div className="relative w-full max-w-[400px]" style={{ minHeight: 520 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ rotateY: isLogin ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isLogin ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            style={{ backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
            className="w-full bg-white rounded-lg p-8 shadow-md font-sans absolute"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[#4A4765] text-xl font-bold">⬢</span>
              <span className="text-gray-800 font-bold text-lg">Omah Nalar</span>
            </div>

            <h2 className="text-gray-900 font-bold text-xl mb-1">
              {isLogin ? t.loginTitle : t.registerTitle}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isLogin ? (
                <>
                  {t.noAccountPrompt}{" "}
                  <button onClick={() => setMode("register")} className="text-blue-500 hover:underline font-medium">
                    {t.registerTitle}
                  </button>
                </>
              ) : (
                <>
                  {t.haveAccountPrompt}{" "}
                  <button onClick={() => setMode("login")} className="text-blue-500 hover:underline font-medium">
                    {t.loginBtn}
                  </button>
                </>
              )}
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.emailLabel}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A4765] focus:border-[#4A4765] text-gray-900"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.nameLabel}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A4765] focus:border-[#4A4765] text-gray-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.passwordLabel}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A4765] focus:border-[#4A4765] text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPasswordLabel}</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4A4765] focus:border-[#4A4765] text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

              {!isLogin && (
                <p className="text-[11px] text-gray-500 leading-tight">
                  {t.terms}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4A4765] hover:bg-[#3b3852] text-white font-medium py-2.5 rounded-md transition-colors text-sm mt-2 disabled:opacity-50"
              >
                {loading ? t.processing : isLogin ? t.loginBtn : t.registerBtn}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">{t.orContinue}</span>
              </div>
            </div>

            <button
              onClick={async () => {
                const { createClient } = await import("@supabase/supabase-js");
                const supabase = createClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: window.location.origin,
                  },
                });
              }}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 rounded-md transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.6 2.8C6.01 7.14 8.74 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.69 2.86c2.16-1.99 3.42-4.92 3.42-8.58z" />
                <path fill="#FBBC05" d="M5.1 14.7c-.25-.75-.39-1.55-.39-2.37s.14-1.62.39-2.37l-3.6-2.8C.54 8.86 0 10.37 0 12s.54 3.14 1.5 4.67l3.6-2.97z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.69-2.86c-1.12.75-2.55 1.2-4.27 1.2-3.26 0-5.99-2.1-6.98-5.26l-3.6 2.8C3.4 20.35 7.35 23 12 23z" />
              </svg>
              {t.google}
            </button>

            <Link
              href="/"
              className="block text-center text-xs font-semibold text-[#4A4765] underline underline-offset-2 hover:text-[#3b3852] mt-5 transition-colors"
            >
              {common.backToHome}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
