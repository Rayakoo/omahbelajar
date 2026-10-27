"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  PenLine,
  Send,
  ShieldCheck,
} from "lucide-react";
import SaranCard from "@/components/SaranCard";
import {
  createSuggestion,
  getApprovedSuggestions,
  type Suggestion,
} from "@/services/suggestions";
import { DUMMY_SUGGESTIONS } from "@/data/dummySuggestions";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";

const CATEGORY_LABELS = {
  id: ["Saran", "Masukan", "Kritik", "Ide"],
  en: ["Suggestion", "Feedback", "Critique", "Idea"],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function errorDetail(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

export default function SaranSection() {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.saran : en.saran;
  const categories = useMemo(() => CATEGORY_LABELS[locale], [locale]);

  const formRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDummy, setUsingDummy] = useState(false);

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const category = categories[categoryIndex] ?? categories[0];

  useEffect(() => {
    let active = true;
    getApprovedSuggestions()
      .then((data) => {
        if (!active) return;
        if (data.length > 0) {
          setSuggestions(data);
          setUsingDummy(false);
        } else {
          setSuggestions(DUMMY_SUGGESTIONS);
          setUsingDummy(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setSuggestions(DUMMY_SUGGESTIONS);
        setUsingDummy(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError(t.wajibIsi);
      return;
    }

    setSubmitting(true);
    try {
      await createSuggestion({
        name: isAnonymous ? t.anonim : name,
        category,
        content,
        is_anonymous: isAnonymous,
      });
      setSubmitted(true);
      setName("");
      setContent("");
      setIsAnonymous(false);
    } catch (err) {
      console.error("Gagal mengirim saran:", errorDetail(err));
      setError(t.gagal);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setError("");
    setCategoryIndex(0);
  };

  const handleNext = () => {
    if (suggestions.length === 0) return;
    setDirection(1);
    setIndex((prev) => (prev + 1) % suggestions.length);
  };

  const handlePrev = () => {
    if (suggestions.length === 0) return;
    setDirection(-1);
    setIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
  };

  const currentSuggestion = suggestions[index] || suggestions[0];

  return (
    <div className="min-h-screen scroll-smooth bg-[#FAF5ED] font-sans text-[#3A2E5A] antialiased">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#53267d] via-[#3a2e8c] to-[#1d41a5] px-6 py-16 text-center text-white md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-15" />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <span className="mb-4 inline-block rounded-full border border-white/40 px-5 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            {t.badge}
          </span>

          <h1 className="mb-3 text-3xl font-extrabold uppercase tracking-wide md:text-5xl">
            {t.heroTitle}
          </h1>

          <p className="mb-7 max-w-2xl text-sm font-normal text-gray-200 md:text-base">
            {t.heroDesc}
          </p>

          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold text-[#3A2E5A] shadow-md transition-all hover:bg-gray-100 active:scale-95 md:text-sm"
          >
            {t.tulisSaran}
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3A2E5A] text-white">
              <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
            </span>
          </button>
        </div>
      </section>

      {/* FORM */}
      <section
        ref={formRef}
        id="form-saran"
        className="scroll-mt-28 px-6 py-14 md:py-16"
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#51236E] text-white shadow-md">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-[#51236E] md:text-2xl">
                {t.formTitle}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-[#6C5B7B]">
                {t.formDesc}
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-[28px] border border-[#CDEBDD] bg-white p-8 text-center shadow-sm md:p-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E5F7F4] text-[#10A37F]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-[#3A2E5A]">
                {t.berhasilTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6C5B7B]">
                {t.berhasilDesc}
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#51236E] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#3D1A54]"
              >
                <PenLine className="h-3.5 w-3.5" />
                {t.kirimLagi}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 rounded-[28px] border border-[#E9DFD0] bg-white/80 p-6 shadow-sm backdrop-blur-sm md:p-8"
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="saran-nama"
                  className="text-sm font-semibold text-[#3A2E5A]/80"
                >
                  {t.nama}
                </label>
                <input
                  id="saran-nama"
                  type="text"
                  value={isAnonymous ? "" : name}
                  disabled={isAnonymous}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAnonymous ? t.anonim : t.namaPlaceholder}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#3A2E5A] placeholder-gray-400 shadow-sm transition-all focus:border-[#51236E] focus:outline-none focus:ring-2 focus:ring-[#51236E]/20 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <span className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-[#F1E8F4] shadow-inner transition-all peer-checked:border-[#51236E] peer-checked:bg-[#51236E]">
                    <span className="h-2.5 w-2.5 scale-0 rounded-full bg-white transition-transform peer-checked:scale-100" />
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-[#3A2E5A]/90">
                  <ShieldCheck className="h-4 w-4 text-[#51236E]" />
                  {t.anonimCheckbox}
                </span>
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#3A2E5A]/80">
                  {t.kategori}
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, i) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryIndex(i)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                        category === cat
                          ? "border-[#51236E] bg-[#51236E] text-white shadow-sm"
                          : "border-gray-300 bg-white text-[#3A2E5A]/70 hover:border-[#51236E]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="saran-isi"
                  className="text-sm font-semibold text-[#3A2E5A]/80"
                >
                  {t.isi}
                </label>
                <textarea
                  id="saran-isi"
                  rows={6}
                  maxLength={1000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.isiPlaceholder}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white p-4 text-sm leading-relaxed text-[#3A2E5A] placeholder-gray-400 shadow-inner transition-all focus:border-[#51236E] focus:outline-none focus:ring-2 focus:ring-[#51236E]/20"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#51236E] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#3D1A54] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? t.mengirim : t.kirim}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* SARAN KAWAN KITA */}
      <section className="border-t border-[#E9DFD0] px-6 py-14 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black uppercase tracking-wide text-[#51236E] md:text-3xl">
              {t.kawanKita}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#6C5B7B]">
              {t.kawanKitaDesc}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-[#51236E]/70">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#51236E] border-t-transparent" />
              <span>{t.memuat}</span>
            </div>
          ) : !currentSuggestion ? (
            <p className="py-16 text-center text-sm text-[#6C5B7B]">
              {t.kosong}
            </p>
          ) : (
            <div className="relative flex min-h-[460px] items-center justify-center">
              {suggestions.length > 1 && (
                <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 items-center justify-between px-2 md:-mx-6">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Saran sebelumnya"
                    className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#51236E] text-white shadow-lg transition-all hover:bg-[#3D1A54] active:scale-95 md:h-12 md:w-12"
                  >
                    <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Saran berikutnya"
                    className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#51236E] text-white shadow-lg transition-all hover:bg-[#3D1A54] active:scale-95 md:h-12 md:w-12"
                  >
                    <ArrowRight className="h-5 w-5 stroke-[2.5]" />
                  </button>
                </div>
              )}

              <div className="w-full max-w-3xl [perspective:1500px]">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentSuggestion.id}
                    custom={direction}
                    variants={{
                      enter: (d: number) => ({
                        rotateY: d > 0 ? 90 : -90,
                        opacity: 0,
                        scale: 0.9,
                      }),
                      center: {
                        rotateY: 0,
                        opacity: 1,
                        scale: 1,
                        transition: {
                          duration: 0.6,
                          ease: [0.23, 1, 0.32, 1],
                        },
                      },
                      exit: (d: number) => ({
                        rotateY: d > 0 ? -90 : 90,
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.4 },
                      }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{
                      backfaceVisibility: "hidden",
                      transformStyle: "preserve-3d",
                    }}
                    className="w-full"
                  >
                    <SaranCard
                      nama={
                        currentSuggestion.is_anonymous
                          ? t.anonim
                          : currentSuggestion.name
                      }
                      kategori={currentSuggestion.category}
                      tanggal={formatDate(currentSuggestion.created_at)}
                      isi={currentSuggestion.content}
                      isAnonymous={currentSuggestion.is_anonymous}
                      index={index}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {usingDummy && !loading && (
            <p className="mt-8 text-center text-[11px] font-medium uppercase tracking-widest text-[#51236E]/40">
              {t.contohSaran}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
