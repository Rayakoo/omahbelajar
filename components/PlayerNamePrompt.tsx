"use client";

import { useState } from "react";
import { usePlayerName } from "@/contexts/PlayerNameContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";

export default function PlayerNamePrompt({ onStart }: { onStart: () => void }) {
  const { playerName, setPlayerName } = usePlayerName();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.playerName : en.playerName;
  const [name, setName] = useState(playerName || "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(locale === "id" ? "Nama minimal 2 karakter" : "Name must be at least 2 characters");
      return;
    }
    setError("");
    setPlayerName(trimmed);
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl w-full"
        style={{ animation: "fade-in 0.3s ease-out" }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-xl font-bold text-brand-900 mb-1">{t.title}</h2>
          <p className="text-sm text-brand-700/60">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder={t.placeholder}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 bg-brand-50 text-brand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              autoFocus
              maxLength={50}
            />
            {error && (
              <p className="text-rose-500 text-xs mt-1.5 ml-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-md relative overflow-hidden group"
            style={{ background: "linear-gradient(135deg, #7C78A8, #4A4763)" }}
          >
            <span className="relative z-10">{t.mulai}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </form>

        <p className="text-center text-brand-700/40 text-xs mt-4">{t.footer}</p>
      </div>
    </div>
  );
}
