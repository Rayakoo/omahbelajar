"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, UserRound, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";
import { updateProfileData } from "@/services/auth";

const PEKERJAAN_LAINNYA = "Lainnya";
const PEKERJAAN_VALUES = ["Mahasiswa", "Ibu Rumah Tangga", "Guru dan Dosen"];

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile, refreshUser } = useAuth();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.profile : en.profile;
  const common = locale === "id" ? id.common : en.common;

  const [nama, setNama] = useState("");
  const [usia, setUsia] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [pendidikan, setPendidikan] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [pekerjaanLainnya, setPekerjaanLainnya] = useState("");
  const [tempatTinggal, setTempatTinggal] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setNama(profile.full_name || "");
      setUsia(profile.usia != null ? String(profile.usia) : "");
      setJenisKelamin(profile.jenis_kelamin || "");
      setPendidikan(profile.pendidikan || "");

      const pekerjaanTersimpan = profile.pekerjaan || "";
      if (pekerjaanTersimpan && !PEKERJAAN_VALUES.includes(pekerjaanTersimpan)) {
        setPekerjaan(PEKERJAAN_LAINNYA);
        setPekerjaanLainnya(pekerjaanTersimpan);
      } else {
        setPekerjaan(pekerjaanTersimpan);
        setPekerjaanLainnya("");
      }

      setTempatTinggal(profile.tempat_tinggal || "");
    } else if (user) {
      setNama(user.user_metadata?.full_name || "");
    }
  }, [profile, user]);

  const pendidikanOptions = [
    { value: "SD", label: t.sd },
    { value: "SMP", label: t.smp },
    { value: "SMA", label: t.sma },
    { value: "Sarjana dan Sederajat", label: t.sarjana },
  ];

  const pekerjaanOptions = [
    { value: "Mahasiswa", label: t.mahasiswa },
    { value: "Ibu Rumah Tangga", label: t.ibuRumahTangga },
    { value: "Guru dan Dosen", label: t.guruDosen },
    { value: PEKERJAAN_LAINNYA, label: t.lainnya },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-page-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-page-50 text-brand-900 font-sans flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-sm">
          <UserRound className="w-12 h-12 mx-auto text-brand-700/40 mb-4" />
          <h2 className="text-lg font-bold mb-2">{t.loginDulu}</h2>
          <p className="text-sm text-brand-900/60 mb-6">{t.loginDuluDesc}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-brand-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all"
          >
            {t.masuk}
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSuccess(false);
    if (!nama.trim()) { setError(t.isiNama); return; }
    if (!usia || Number(usia) <= 0) { setError(t.isiUsia); return; }
    if (!jenisKelamin) { setError(t.isiJenisKelamin); return; }
    if (!pendidikan) { setError(t.isiPendidikan); return; }
    if (!pekerjaan) { setError(t.isiPekerjaan); return; }
    if (pekerjaan === PEKERJAAN_LAINNYA && !pekerjaanLainnya.trim()) { setError(t.isiPekerjaanLainnya); return; }
    if (!tempatTinggal.trim()) { setError(t.isiTempatTinggal); return; }

    setSaving(true);
    try {
      await updateProfileData(user.id, {
        full_name: nama.trim(),
        usia: Number(usia),
        jenis_kelamin: jenisKelamin,
        pendidikan,
        pekerjaan: pekerjaan === PEKERJAAN_LAINNYA ? pekerjaanLainnya.trim() : pekerjaan,
        tempat_tinggal: tempatTinggal.trim(),
      });
      await refreshProfile();
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.gagalSimpan);
    } finally {
      setSaving(false);
    }
  };

  const isComplete =
    profile &&
    profile.full_name?.trim() &&
    profile.usia != null &&
    profile.jenis_kelamin?.trim() &&
    profile.pendidikan?.trim() &&
    profile.pekerjaan?.trim() &&
    profile.tempat_tinggal?.trim();

  return (
    <div className="min-h-screen bg-page-50 text-brand-900 font-sans antialiased pb-16">
      <nav className="bg-secondary-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 bg-brand-900 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-all active:scale-95 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> {common.back}
        </button>
        <span className="font-bold text-lg">{t.judul}</span>
        <div className="w-20" />
      </nav>

      <main className="max-w-lg mx-auto px-4 md:px-6 py-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex flex-col items-center mb-6">
            <img
              src={user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"}
              alt={nama || "Profile"}
              className="w-20 h-20 rounded-full border-4 border-brand-700 object-cover shadow-md mb-3"
            />
            <h2 className="text-xl font-black tracking-wide">{nama || user.email}</h2>
            <p className="text-xs text-brand-700/50 mt-1">{user.email}</p>

            {isComplete ? (
              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> {t.sudahLengkap}
              </span>
            ) : (
              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                {t.belumLengkap}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-brand-900/50">{t.wajibDiisi}</p>
            <div>
              <label className="block text-sm font-semibold text-brand-900/80 mb-1.5">{t.namaLengkap} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder={t.placeholderNama}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 shadow-sm placeholder-gray-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-brand-900/80 mb-1.5">{t.usia} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={usia}
                  onChange={(e) => setUsia(e.target.value)}
                  placeholder={t.placeholderUsia}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 shadow-sm placeholder-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-900/80 mb-1.5">{t.jenisKelamin} <span className="text-red-500">*</span></label>
                <select
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 shadow-sm"
                >
                  <option value="">{t.pilihJenisKelamin}</option>
                  <option value="Laki-laki">{t.lakiLaki}</option>
                  <option value="Perempuan">{t.perempuan}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-900/80 mb-1.5">{t.pendidikan} <span className="text-red-500">*</span></label>
              <select
                value={pendidikan}
                onChange={(e) => setPendidikan(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 shadow-sm"
              >
                <option value="">{t.pilihPendidikan}</option>
                {pendidikanOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-900/80 mb-1.5">{t.pekerjaan} <span className="text-red-500">*</span></label>
              <select
                value={pekerjaan}
                onChange={(e) => setPekerjaan(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 shadow-sm"
              >
                <option value="">{t.pilihPekerjaan}</option>
                {pekerjaanOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {pekerjaan === PEKERJAAN_LAINNYA && (
                <input
                  type="text"
                  value={pekerjaanLainnya}
                  onChange={(e) => setPekerjaanLainnya(e.target.value)}
                  placeholder={t.placeholderPekerjaanLainnya}
                  className="mt-2 w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 shadow-sm placeholder-gray-300"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-900/80 mb-1.5">{t.tempatTinggal} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={tempatTinggal}
                onChange={(e) => setTempatTinggal(e.target.value)}
                placeholder={t.placeholderTempatTinggal}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 shadow-sm placeholder-gray-300"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t.menyimpan}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {t.simpanProfil}
                </>
              )}
            </button>

            {success && (
              <p className="text-center text-sm font-bold text-emerald-600">{t.berhasil}</p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
