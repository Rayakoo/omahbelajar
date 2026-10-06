"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { ChevronLeft, Download, Award, AlertTriangle, RefreshCw } from "lucide-react";
import { getCourseById } from "@/services/courses";
import { areAllQuizzesPassed } from "@/services/quizzes";
import { completeCourse } from "@/services/userCourses";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";

export default function HasilQuiz() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params["id-course"] as string;
  const { user } = useAuth();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.omahBelajar : en.omahBelajar;
  const common = locale === "id" ? id.common : en.common;

  const [courseTitle, setCourseTitle] = useState("");
  const [allPassed, setAllPassed] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);

  useEffect(() => {
    if (!courseId || !user) return;
    const init = async () => {
      try {
        const c = await getCourseById(courseId);
        setCourseTitle(c.title);

        if (isPassed) {
          const allDone = await areAllQuizzesPassed(user.id, courseId);
          setAllPassed(allDone);
          if (allDone) {
            await completeCourse(user.id, courseId);
          }
        }
      } catch {}
      setLoadingCourse(false);
    };
    init();
  }, [courseId, user]);

  const score = parseInt(searchParams.get("score") || "0");
  const total = parseInt(searchParams.get("total") || "1");
  const percentage = Math.round((score / total) * 100);
  const isPassed = percentage >= 75;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || t.kawanKita;
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);

    try {
      const { default: jsPDF } = await import("jspdf");

      const el = certificateRef.current!;
      const elRect = el.getBoundingClientRect();
      const nameEl = el.querySelector("h3")!;
      const dateEl = el.querySelector("time")!;

      const nameRect = nameEl.getBoundingClientRect();
      const dateRect = dateEl.getBoundingClientRect();

      const nameY = (nameRect.top - elRect.top + nameRect.height / 2) / elRect.height;
      const dateY = (dateRect.top - elRect.top + dateRect.height / 2) / elRect.height;
      const nameFontSize = parseFloat(getComputedStyle(nameEl).fontSize);
      const dateFontSize = parseFloat(getComputedStyle(dateEl).fontSize);

      const templateImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("Gagal memuat template"));
        i.src = "/images/SERTIFIKAT%20OMAH%20NALAR%20(COURSE).png";
      });

      const pdfW = elRect.width;
      const pdfH = elRect.height;
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = pdfW * scale;
      canvas.height = pdfH * scale;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#1E293B";
      ctx.font = `900 ${nameFontSize * scale}px sans-serif`;
      ctx.fillText(displayName, canvas.width / 2, canvas.height * (nameY + 0.01));

      ctx.fillStyle = "#6B7280";
      ctx.font = `500 ${dateFontSize * scale}px sans-serif`;
      ctx.fillText(
        `${new Date().toLocaleDateString("id-ID", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
        canvas.width / 2,
        canvas.height * (dateY + 0.01)
      );

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({ unit: "px", format: [pdfW, pdfH], orientation: "landscape" });
      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
      pdf.save(`Sertifikat_${displayName.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Gagal mengunduh PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="min-h-screen bg-[#FFF6EA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B387E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF6EA] text-[#3B387E] font-poppins antialiased flex flex-col">
      <nav className="bg-[#3B387E] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/images/logo_omah.png" alt="Omah Nalar" className="h-10 w-auto" />
          <span className="font-bold text-sm tracking-wide ml-2 hidden sm:inline text-white">{t.title}</span>
          <span className="font-bold text-sm bg-[#FDE067] text-[#3B387E] px-4 py-1.5 rounded-full ml-2 shadow-sm">{t.hasilTitle}</span>
        </div>
        <button
          onClick={() => router.push(`/omah-belajar/${courseId}/materi`)}
          className="flex items-center gap-1 bg-white text-[#3B387E] px-5 py-2 rounded-full text-sm font-bold hover:bg-[#FDE067] transition-all active:scale-95 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> {common.back}
        </button>
      </nav>

      {isPassed && allPassed ? (
        <div className="flex-1 flex flex-col">
          <div className="bg-[#3B387E] text-white text-center py-12 px-6 shadow-sm">
            <span className="bg-[#FDE067]/20 text-[#FDE067] border border-[#FDE067]/40 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
              {t.selamatBadge}
            </span>
            <h1 className="text-2xl md:text-4xl font-black font-poppins mt-4 tracking-wide max-w-3xl mx-auto leading-tight text-white">
              {t.selesaiCourse}
            </h1>
            <p className="text-xs md:text-sm text-white/80 mt-3 max-w-xl mx-auto leading-relaxed">
              {t.skorMsg.replace("{score}", String(score)).replace("{total}", String(total)).replace("{percentage}", String(percentage))}
            </p>
          </div>

          <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 flex flex-col items-center gap-8">
            <div className="w-full max-w-[940px] shadow-sm rounded-[28px] overflow-hidden border-2 border-[#3B387E] bg-white">
              <div
                ref={certificateRef}
                className="relative w-full bg-white select-none"
                style={{ aspectRatio: "4000/2828" }}
              >
                <img
                  src="/images/SERTIFIKAT%20OMAH%20NALAR%20(COURSE).png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 z-10 text-center">
                  <h3
                    className="font-black"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      color: "#1E293B",
                      fontSize: "clamp(1.2rem, 3.5vw, 3rem)",
                      letterSpacing: "0.05em",
                      width: "80%",
                    }}
                  >
                    {displayName}
                  </h3>

                  <time
                    className="font-medium"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "82%",
                      transform: "translateX(-50%)",
                      color: "#6B7280",
                      fontSize: "clamp(0.5rem, 1.1vw, 0.8rem)",
                    }}
                  >
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    , {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                  </time>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-[#3B387E] text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-[#2e2a66] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm mb-8"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t.processingPdf}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t.downloadCert}
                </>
              )}
            </button>
          </main>
        </div>
      ) : isPassed ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border-2 border-[#3B387E] rounded-[28px] p-8 text-center shadow-sm flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-[#83F3BA] rounded-2xl flex items-center justify-center text-[#3B387E] shadow-sm">
              <Award className="w-7 h-7 stroke-[2]" />
            </div>
            <h2 className="text-lg font-black font-poppins text-[#3B387E] tracking-wide">
              {t.lulusTitle}
            </h2>
            <p className="text-xs md:text-sm text-black/70 font-semibold leading-relaxed max-w-xs">
              {t.lulusMsg.replace("{score}", String(score)).replace("{total}", String(total)).replace("{percentage}", String(percentage))}
            </p>
            <p className="text-[11px] text-[#3B387E]/60">
              {t.selesaikanSemua}
            </p>
            <div className="w-full h-[1px] bg-[#3B387E]/10 my-2" />
            <button
              onClick={() => router.push(`/omah-belajar/${courseId}/materi`)}
              className="flex items-center gap-1 bg-[#3B387E] text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-[#2e2a66] transition-all shadow-sm"
            >
              {t.lanjutMateri}
            </button>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border-2 border-[#3B387E] rounded-[28px] p-8 text-center shadow-sm flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
              <AlertTriangle className="w-7 h-7 stroke-[2]" />
            </div>

            <h2 className="text-lg font-black font-poppins text-[#3B387E] tracking-wide">
              {t.gagalTitle}
            </h2>

            <p className="text-xs md:text-sm text-black/70 font-semibold leading-relaxed max-w-xs">
              {t.gagalMsg.replace("{score}", String(score)).replace("{total}", String(total)).replace("{percentage}", String(percentage))}
            </p>

            <div className="w-full h-[1px] bg-[#3B387E]/10 my-2" />

            <button
              onClick={() => router.push(`/omah-belajar/${courseId}/materi`)}
              className="text-xs font-bold text-[#3B387E] hover:text-[#2e2a66] transition-colors bg-white border-2 border-[#3B387E] px-4 py-2 rounded-2xl shadow-sm hover:bg-[#FDE067]"
            >
              {t.cobaUlang}
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
