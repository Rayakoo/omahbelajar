"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Play, FileText, HelpCircle, CheckCircle2, Clock, BookOpen, BarChart, Download, File as FileIcon, Gamepad2, Lock } from "lucide-react";
import { getCourseById, getCourseSections, type CourseWithRelations, type CourseSection } from "@/services/courses";
import { getQuizById, getQuizIdsByCourse, getUserQuizResults } from "@/services/quizzes";
import { getUserCourse, enrollCourse, updateProgress } from "@/services/userCourses";
import { getCourseMinigames, MINIGAME_TYPE_LABELS, type CourseMinigame } from "@/services/course-minigames";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";
import { getVideoEmbedUrl } from "@/lib/video";
import { getProxiedUrl } from "@/services/garage";
import { saveCourseDuration } from "@/services/userCourses";
import ProfileIncompleteModal from "@/components/ProfileIncompleteModal";

function sectionIcon(type: string) {
  switch (type) {
    case "video": return Play;
    case "materi": return FileText;
    case "quiz": return HelpCircle;
    case "minigame": return Gamepad2;
    default: return FileText;
  }
}

function getUnlockedCount(items: { urutan: number }[], progressUrutan: number): number {
  let lastIdx = -1;
  for (let i = 0; i < items.length; i++) {
    if (items[i].urutan <= progressUrutan) lastIdx = i;
  }
  return Math.max(2, Math.min(items.length, lastIdx + 2));
}

export default function MateriDetail() {
  const router = useRouter();
  const params = useParams();
  const { user, profileComplete, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.omahBelajar : en.omahBelajar;
  const common = locale === "id" ? id.common : en.common;
  const courseId = params["id-course"] as string;

  const profileIncomplete = !!user && !profileComplete;

  const [course, setCourse] = useState<CourseWithRelations | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [materiTab, setMateriTab] = useState<"materi" | "file">("materi");
  const [fileLoading, setFileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileGate, setShowProfileGate] = useState(false);
  const [mgList, setMgList] = useState<CourseMinigame[]>([]);
  const [courseElapsed, setCourseElapsed] = useState(0);
  const courseAccumulatedRef = useRef(0);
  const courseSessionStartRef = useRef<number | null>(null);
  const [timerReady, setTimerReady] = useState(false);
  const userUrutan = useRef(0);
  const [progressUrutan, setProgressUrutan] = useState(0);

  useEffect(() => {
    if (!courseId) return;
    const fetchData = async () => {
      try {
        const [c, secs, mgs] = await Promise.all([
          getCourseById(courseId),
          getCourseSections(courseId),
          getCourseMinigames(courseId).catch(() => [] as CourseMinigame[]),
        ]);
        setCourse(c);
        setSections(secs);
        setMgList(mgs);

        // Restore user progress
        if (user) {
          const [uc, quizIds] = await Promise.all([
            getUserCourse(user.id, courseId),
            getQuizIdsByCourse(courseId).catch(() => [] as string[]),
          ]);
          if (uc) {
            userUrutan.current = uc.current_urutan;
            setProgressUrutan(uc.current_urutan);
            if (uc.current_urutan > 0) {
              const idx = secs.findIndex((s) => s.data.urutan === uc.current_urutan);
              if (idx >= 0) setActiveIdx(idx);
            }
          } else {
            await enrollCourse(user.id, courseId);
          }

          // Mark passed quizzes
          if (quizIds.length > 0) {
            const passedIds: string[] = [];
            for (const qid of quizIds) {
              const results = await getUserQuizResults(user.id, qid);
              if (results?.some((r) => r.passed)) {
                passedIds.push(qid);
              }
            }
            setCompletedIds(passedIds);
          }

          // Init course timer
          courseAccumulatedRef.current = uc?.total_duration_seconds ?? 0;
          courseSessionStartRef.current = Date.now();
          setCourseElapsed(courseAccumulatedRef.current);
          setTimerReady(true);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, user]);

  useEffect(() => {
    if (!loading && !authLoading && user && profileIncomplete) {
      setShowProfileGate(true);
    }
  }, [loading, authLoading, user, profileIncomplete]);

  const activeSection = sections[activeIdx];
  const courseTitle = course?.title || "";
  const unlockedCount = user ? getUnlockedCount(sections.map((s) => s.data), progressUrutan) : sections.length;
  const mgUnlockedCount = user ? getUnlockedCount(mgList, progressUrutan) : mgList.length;

  const saveTimer = useCallback(() => {
    if (!user || courseSessionStartRef.current === null) return;
    const now = Date.now();
    const sessionSeconds = Math.floor((now - courseSessionStartRef.current) / 1000);
    if (sessionSeconds < 1) return;
    courseAccumulatedRef.current += sessionSeconds;
    courseSessionStartRef.current = now;
    saveCourseDuration(user.id, courseId, courseAccumulatedRef.current).catch(() => {});
  }, [user, courseId]);

  useEffect(() => {
    if (!timerReady || !user) return;

    const interval = setInterval(() => {
      if (courseSessionStartRef.current !== null) {
        setCourseElapsed(courseAccumulatedRef.current + Math.floor((Date.now() - courseSessionStartRef.current) / 1000));
      }
    }, 1000);

    const autoSave = setInterval(() => saveTimer(), 10000);

    const handleVisibility = () => {
      if (document.hidden) {
        saveTimer();
      } else {
        courseSessionStartRef.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleBeforeUnload = () => {
      saveTimer();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      clearInterval(autoSave);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveTimer();
    };
  }, [timerReady, user, courseId, saveTimer]);

  const handleSectionClick = async (idx: number) => {
    const sec = sections[idx];
    if (idx >= unlockedCount) return;
    if (sec.type === "materi") {
      if (sec.data.file_url) setFileLoading(true);
      if (!sec.data.content && sec.data.file_url) {
        setMateriTab("file");
      } else {
        setMateriTab("materi");
      }
    } else {
      setMateriTab("materi");
    }
    if (user) {
      try {
        const dbUc = await getUserCourse(user.id, courseId);
        const dbUrutan = dbUc?.current_urutan ?? 0;
        if (sec.data.urutan > dbUrutan) {
          await updateProgress(user.id, courseId, sec.data.urutan);
          userUrutan.current = sec.data.urutan;
          setProgressUrutan(sec.data.urutan);
        }
      } catch (e) {
        console.error("Gagal update progress:", e);
      }
    }
    if (sec.type === "quiz") {
      saveTimer();
      const quiz = await getQuizById(sec.data.id);
      router.push(`/omah-belajar/${courseId}/${quiz.id}`);
    } else if (sec.type === "minigame") {
      saveTimer();
      router.push(`/omah-belajar/${courseId}/minigame/${sec.data.id}`);
    } else {
      setActiveIdx(idx);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF6EA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B387E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF6EA] text-[#3B387E] font-poppins font-sans antialiased">
      <nav className="bg-[#DCD5FE] border-b-2 border-[#3B387E] px-6 py-4 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo_omah.png" alt="Omah Nalar" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <span className="bg-white text-[#3B387E] border-2 border-[#3B387E] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Clock className="w-3 h-3" />
              {String(Math.floor(courseElapsed / 3600)).padStart(2, "0")}:{String(Math.floor((courseElapsed % 3600) / 60)).padStart(2, "0")}:{String(courseElapsed % 60).padStart(2, "0")}
            </span>
          )}
          <button
            onClick={() => router.push(`/omah-belajar/${courseId}`)}
            className="flex items-center gap-1 bg-[#3B387E] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#2e2a66] transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            {common.back}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className={`w-full bg-white rounded-[28px] shadow-sm relative border-2 border-[#3B387E] ${activeSection?.type === "materi" ? "" : "overflow-hidden aspect-video"}`}>
            {!activeSection ? (
              <div className="w-full h-full flex items-center justify-center text-[#3B387E]/60 text-sm bg-white">
                {t.pilihMateri}
              </div>
            ) : activeSection.type === "video" ? (
              (() => {
                const rawUrl = activeSection.data.video_url;
                const url = getProxiedUrl(rawUrl) || rawUrl;
                const isMp4 = url?.match(/\.(mp4|webm)(\?|$)/i) || rawUrl?.includes("bucket-utama.web.43.156.104.232.sslip.io");
                if (isMp4) {
                  return (
                    <video
                      className="w-full h-full object-contain bg-black"
                      src={url}
                      controls
                    />
                  );
                }
                const embed = getVideoEmbedUrl(url);
                const base = embed || `https://www.youtube.com/embed/${url}`;
                const src = base.includes("youtube.com/embed") ? `${base}?autoplay=1` : base;
                return (
                  <iframe
                    className="w-full h-full"
                    src={src}
                    title={activeSection.data.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              })()
            ) : activeSection.type === "materi" ? (
              <div className="w-full bg-white rounded-[28px] border-2 border-[#3B387E] flex flex-col leading-relaxed">
                <div className="p-6 md:p-10 pb-0">
                  <h2 className="text-xl md:text-2xl font-extrabold font-poppins text-[#3B387E] mb-4">{activeSection.data.title}</h2>
                  {activeSection.data.file_url && (
                    <div className="bg-[#FED777] border-2 border-[#3B387E] p-1 rounded-2xl flex items-center w-full mb-6">
                      {activeSection.data.content && (
                        <button
                          onClick={() => setMateriTab("materi")}
                          className={`flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            materiTab === "materi" ? "bg-[#3B387E] text-white shadow-sm" : "text-[#3B387E]/60 hover:text-[#3B387E]"
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          {locale === "id" ? "Materi" : "Text"}
                        </button>
                      )}
                      <button
                        onClick={() => { setMateriTab("file"); setFileLoading(true); }}
                        className={`flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                          materiTab === "file" ? "bg-[#3B387E] text-white shadow-sm" : "text-[#3B387E]/60 hover:text-[#3B387E]"
                        }`}
                      >
                        <FileIcon className="w-4 h-4" />
                        {locale === "id" ? "File" : "File"}
                      </button>
                    </div>
                  )}
                </div>
                <div className="px-6 md:px-10 pb-6 md:pb-10 overflow-y-auto max-h-[60vh]">
                  {materiTab === "materi" && activeSection.data.content && (
                    <div
                      className="text-sm md:text-base text-[#3B387E]/80 font-normal leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800"
                      dangerouslySetInnerHTML={{ __html: activeSection.data.content }}
                    />
                  )}
                  {materiTab === "materi" && !activeSection.data.content && activeSection.data.file_url && (
                    <div className="text-sm text-gray-500 italic">{locale === "id" ? "Tidak ada teks materi." : "No text content."}</div>
                  )}
                  {materiTab === "file" && activeSection.data.file_url && (
                    (() => {
                      const rawUrl = activeSection.data.file_url;
                      const proxied = getProxiedUrl(rawUrl);
                      const url = proxied || rawUrl;

                      const googleDriveId = rawUrl.match(/\/file\/d\/([^/?#]+)/)?.[1];
                      const isPdf = rawUrl?.match(/\.pdf(\?|$)/i) || url?.match(/\.pdf(\?|$)/i);

                      if (googleDriveId) {
                        return (
                          <div className="relative">
                            {fileLoading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
                                <div className="w-8 h-8 border-4 border-[#3B387E] border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            <iframe
                              src={`https://drive.google.com/file/d/${googleDriveId}/preview`}
                              className="w-full h-[70vh] rounded-2xl border-2 border-[#3B387E]"
                              title="File Preview"
                              onLoad={() => setFileLoading(false)}
                            />
                          </div>
                        );
                      }

                      if (isPdf) {
                        return (
                          <div className="relative">
                            {fileLoading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
                                <div className="w-8 h-8 border-4 border-[#3B387E] border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            <iframe
                              src={url}
                              className="w-full h-[70vh] rounded-2xl border-2 border-[#3B387E]"
                              title="File Preview"
                              onLoad={() => setFileLoading(false)}
                            />
                          </div>
                        );
                      }

                      return (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 bg-[#3B387E] text-white text-sm font-bold rounded-full hover:bg-[#2e2a66] transition-all shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          {locale === "id" ? "Download File" : "Download File"}
                        </a>
                      );
                    })()
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-6 text-xs md:text-sm text-[#3B387E]/80 bg-white border-2 border-[#3B387E] p-4 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3B387E]" />
                  <span>{t.totalMateri} <strong className="font-bold text-[#3B387E]">{sections.length}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#3B387E]" />
                  <span>{t.selesaiStat} <strong className="font-bold text-[#3B387E]">{completedIds.length}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-[#3B387E]" />
                  <span>{t.progressStat} <strong className="font-bold text-[#3B387E]">{Math.round((completedIds.length / Math.max(sections.length, 1)) * 100)}%</strong></span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-base font-extrabold font-poppins text-[#3B387E]">{course?.title}</h3>
                <p className="text-sm text-[#3B387E]/70 leading-relaxed font-normal">
                  {course?.description || t.noDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Minigame cards for interactive courses (shown when not viewing a minigame) */}
          {course?.course_type === "interactive" && activeSection?.type !== "minigame" && mgList.length > 0 && (
            <div className="bg-white rounded-[28px] border-2 border-[#3B387E] p-6 shadow-sm">
              <h3 className="text-base font-extrabold font-poppins text-[#3B387E] mb-4">Minigame</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mgList.map((mg, mgIdx) => {
                  const mgLocked = mgIdx >= mgUnlockedCount;
                  return (
                    <button
                      key={mg.id}
                      disabled={mgLocked}
                      onClick={() => router.push(`/omah-belajar/${courseId}/minigame/${mg.id}`)}
                      className={`bg-white border-2 border-[#3B387E] rounded-2xl p-4 text-left transition-colors shadow-sm ${
                        mgLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-[#FFF6EA]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {mgLocked ? (
                          <Lock className="w-4 h-4 text-[#3B387E] shrink-0" />
                        ) : (
                          <Gamepad2 className="w-4 h-4 text-[#3B387E] shrink-0" />
                        )}
                        <span className="text-xs font-bold text-[#3B387E]">{mg.title}</span>
                      </div>
                      <span className="text-[10px] text-[#3B387E]/60 font-medium block">
                        {MINIGAME_TYPE_LABELS[mg.type as keyof typeof MINIGAME_TYPE_LABELS] || mg.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="w-full">
          <div className="bg-white border-2 border-[#3B387E] rounded-[28px] overflow-hidden shadow-sm sticky top-24">
            <div className="bg-[#3B387E] text-white p-4 font-extrabold font-poppins text-sm tracking-wide text-center">
              {t.daftarMateri.replace("{courseTitle}", courseTitle)}
            </div>

            <div className="p-4 flex flex-col gap-6 max-h-[600px] overflow-y-auto no-scrollbar">
              {sections.length === 0 ? (
                <p className="text-xs text-[#3B387E]/60 text-center py-8">{t.noMateri}</p>
              ) : (
                sections.map((sec, idx) => {
                  const isActive = activeIdx === idx;
                  const isCompleted = completedIds.includes(sec.data.id);
                  const isLocked = idx >= unlockedCount;
                  const Icon = sectionIcon(sec.type);

                  return (
                    <div key={sec.data.id}>
                      {idx === 0 || sec.data.urutan === 1 ? null : (
                        <div className="text-[11px] font-bold text-[#3B387E]/60 mb-2 px-1" />
                      )}
                      <button
                        onClick={() => handleSectionClick(idx)}
                        disabled={isLocked}
                        aria-label={isLocked ? `${sec.data.title} — ${t.terkunci}` : sec.data.title}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all text-left ${
                          isLocked
                            ? "bg-[#DCD5FE]/50 border-transparent opacity-60 cursor-not-allowed"
                            : isActive
                              ? "bg-[#FED777] border-[#3B387E] shadow-sm scale-[1.01] cursor-pointer"
                              : "bg-[#FFF6EA] border-transparent hover:bg-[#FED777]/50 hover:border-[#3B387E] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isLocked ? "text-[#3B387E]/30" : isCompleted ? "text-[#3B387E]" : "text-[#3B387E]/40"
                          }`}>
                            {isLocked ? (
                              <Lock className="w-4 h-4 stroke-[2.5]" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            ) : (
                              <Icon className={`w-4 h-4 ${sec.type === "quiz" ? "text-orange-500" : ""}`} />
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className={`text-xs font-bold leading-tight ${isActive ? "text-[#3B387E]" : "text-[#3B387E]/80"}`}>
                              {sec.data.title}
                            </span>
                            <span className="text-[10px] text-[#3B387E]/60 font-semibold mt-0.5 capitalize">
                              {isLocked ? t.terkunci : sec.type}
                            </span>
                          </div>
                        </div>

                        {sec.type === "quiz" && (
                          <span className="bg-[#FFA756] text-black font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-md tracking-wider border border-[#3B387E]">
                            {t.quizBadge}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <ProfileIncompleteModal open={showProfileGate} block />
    </div>
  );
}
