"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { UserRound, ArrowRight, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";

interface ProfileIncompleteModalProps {
  open: boolean;
  onClose?: () => void;
  block?: boolean;
}

export default function ProfileIncompleteModal({ open, onClose, block = false }: ProfileIncompleteModalProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.profile : en.profile;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="relative w-full max-w-sm rounded-[28px] bg-white p-6 md:p-8 shadow-2xl border border-brand-100 text-center"
          >
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-full text-brand-700/40 hover:text-brand-900 hover:bg-brand-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
              <UserRound className="w-8 h-8 text-amber-500 stroke-[1.8]" />
            </div>

            <h3 className="text-lg font-black text-brand-900 tracking-wide mb-2">{t.belumLengkap}</h3>
            <p className="text-sm text-brand-900/70 leading-relaxed mb-6">{t.lengkapiDulu}</p>

            <button
              onClick={() => router.push("/profile")}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all active:scale-95 shadow-md"
            >
              {t.lengkapiSekarang} <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
