"use client";

import Link from "next/link";
import { MINIGAMES } from "@/data/minigames";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";

const CARD_STYLE: Record<string, { bg: string; image: string; alt: string }> = {
  "tts": { bg: "bg-[#FDE067]", image: "/tts.png", alt: "TTS Illustration" },
  "puzzle": { bg: "bg-[#A4C4FF]", image: "/edukasi.png", alt: "Puzzle Illustration" },
  "mitos-atau-fakta": { bg: "bg-[#8DF2BA]", image: "/mitos.png", alt: "Mitos atau Fakta Illustration" },
};

const CARD_ORDER = ["tts", "puzzle", "mitos-atau-fakta"];

export default function MinigamesPage() {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.minigames : en.minigames;
  const common = locale === "id" ? id.common : en.common;

  const games = CARD_ORDER.map(
    (gameId) => MINIGAMES.find((g) => g.id === gameId)!
  );

  return (
    <section className="font-sans">
      {/* Bagian atas (background krem) */}
      <div className="bg-[#FFF6EA] pt-12 pb-44 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Badge Minigames */}
          <span className="inline-block bg-[#B9A6FF] text-white text-xs font-black px-6 py-1.5 rounded-full uppercase tracking-wider">
            {t.badge}
          </span>

          {/* Judul utama */}
          <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
            {t.title}
          </h2>

          {/* Sub-deskripsi */}
          <p className="text-gray-800 text-sm md:text-base max-w-lg mx-auto font-medium leading-relaxed">
            {t.desc}
          </p>
        </div>
      </div>

      {/* Bagian bawah (background navy) */}
      <div className="bg-[#3B387E] pt-px pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto -mt-36">
          {/* Grid 3 kartu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map((game) => {
              const style = CARD_STYLE[game.id];
              return (
                <div
                  key={game.id}
                  className={`${style.bg} rounded-[28px] p-6 pb-0 flex flex-col justify-between text-center shadow-lg hover:-translate-y-1 transition duration-300 min-h-[540px]`}
                >
                  <div className="pt-2 px-2">
                    <h3 className="text-xl md:text-2xl font-extrabold text-black mb-3 leading-tight">
                      {locale === "id" ? game.title : game.titleEn}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-900 leading-relaxed font-medium mb-5">
                      {locale === "id" ? game.description : game.descriptionEn}
                    </p>
                    <Link
                      href={game.slug}
                      className="inline-flex items-center space-x-2 bg-[#3B387E] hover:bg-[#2c2960] text-white text-xs font-bold px-5 py-2 rounded-full transition"
                    >
                      <span>{common.play}</span>
                      <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>

                  {/* Ilustrasi */}
                  <div className="mt-8 h-56 w-full flex items-end justify-center overflow-hidden">
                    <img src={style.image} alt={style.alt} className="max-h-full object-contain" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
