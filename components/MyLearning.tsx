"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, Award } from "lucide-react";
import { type CourseWithRelations } from "@/services/courses";
import { transformImageUrl } from "@/lib/image";
import { getUserCourse, getUserCourses, enrollCourse, type UserCourse } from "@/services/userCourses";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";
import CourseCard from "@/components/CourseCard";
import ProfileIncompleteModal from "@/components/ProfileIncompleteModal";

function seededColor(seed: number, i: number) {
  const colors = ["#F07A94", "#7C78A8", "#6BBF8A", "#FAC775", "#E6E4F9"];
  return colors[(seed + i * 3) % colors.length];
}

interface UserStats {
  total: number;
  completed: number;
  inProgress: number;
}

export default function MyLearning() {
  const router = useRouter();
  const { user, profileComplete, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.omahBelajar : en.omahBelajar;

  const profileIncomplete = !!user && !profileComplete;

  const [userStats, setUserStats] = useState<UserStats>({ total: 0, completed: 0, inProgress: 0 });
  const [userCourseList, setUserCourseList] = useState<(UserCourse & { course: CourseWithRelations })[]>([]);
  const [showProfileGate, setShowProfileGate] = useState(false);

  useEffect(() => {
    if (!authLoading && user && profileIncomplete) {
      setShowProfileGate(true);
    }
  }, [authLoading, user, profileIncomplete]);

  useEffect(() => {
    if (!user) return;
    getUserCourses(user.id)
      .then((ucs) => {
        const list = (ucs as unknown as (UserCourse & { course: CourseWithRelations })[])
          // Unsolved case tidak lagi tampil di sini — pindah ke /minigames/unsolved-case
          .filter((uc) => uc.course?.course_type !== "unsolved_case");
        setUserCourseList(list);
        setUserStats({
          total: list.length,
          completed: list.filter((uc) => uc.is_completed).length,
          inProgress: list.filter((uc) => !uc.is_completed).length,
        });
      })
      .catch(() => {});
  }, [user]);

  const inProgressCourses = useMemo(
    () => userCourseList.filter((uc) => !uc.is_completed),
    [userCourseList]
  );

  const completedCourses = useMemo(
    () => userCourseList.filter((uc) => uc.is_completed),
    [userCourseList]
  );

  const progressPercent = userStats.total > 0
    ? Math.round((userStats.completed / userStats.total) * 100)
    : 0;

  const seed = 42;

  const handleStartCourse = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!authLoading && profileIncomplete) {
      setShowProfileGate(true);
      return;
    }
    const course = userCourseList.find((uc) => uc.course.id === courseId)?.course;
    if (course?.course_type === "unsolved_case") {
      router.push(`/unsolved-case/${courseId}`);
      return;
    }
    try {
      const existing = await getUserCourse(user.id, courseId);
      if (!existing) {
        await enrollCourse(user.id, courseId);
      }
    } catch {}
    router.push(`/omah-belajar/${courseId}`);
  };

  const statCards = [
    { label: t.statsTotal, value: userStats.total, bg: "/chip_course.png", numColor: "#298f4f" },
    { label: t.statsProgress, value: userStats.inProgress, bg: "/chip_berjalan.png", numColor: "#39517f" },
    { label: t.statsDone, value: userStats.completed, bg: "/chip_selesai.png", numColor: "#513dac" },
  ];

  if (!user) return null;

  return (
    <div className="bg-white text-brand-900 font-sans">
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 shadow-sm bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${s.bg})` }}
            >
              <div>
                <p className="text-xs font-semibold text-black/60 uppercase tracking-wider">{s.label}</p>
                <p className="text-4xl font-lilita font-bold" style={{ color: s.numColor }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {userStats.total > 0 && (
          <div className="bg-[#FFE577] rounded-2xl p-6 w-full font-sans mb-8">
            {/* Header: Judul & Persentase */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-black">{t.progressTitle}</h3>
              <span className="text-sm font-medium text-[#6B5C28]">{progressPercent}{t.progressPercent}</span>
            </div>

            {/* Container Progress Bar & Bendera */}
            <div className="relative w-full mb-3 pt-4">
              {/* Ikon Bendera sejajar ujung progress bar */}
              <div className="absolute top-0 -translate-x-1/2" style={{ left: `${progressPercent}%` }}>
                <img src="/flag.png" alt="Flag" className="w-5 h-5 object-contain" />
              </div>

              {/* Track Outer Progress Bar */}
              <div className="w-full h-5 bg-white border-2 border-[#3B387E] rounded-full overflow-hidden">
                {/* Filled Progress Bar */}
                <motion.div
                  className="h-full bg-[#3B387E] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Footer Text */}
            <p className="text-sm font-medium text-[#6B5C28]">
              {t.progressOf.replace("{completed}", String(userStats.completed)).replace("{total}", String(userStats.total))}
            </p>
          </div>
        )}

        {inProgressCourses.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#FDECB3] rounded-xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-[#D29400]" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-extrabold text-black tracking-tight">{t.lanjutkanTitle}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {inProgressCourses.map((uc) => {
                const course = uc.course;
                if (course.course_type === "unsolved_case") {
                  return <CourseCard key={uc.id} course={course} />;
                }
                const progress = course.jumlah_isi > 0
                  ? Math.round((uc.current_urutan / course.jumlah_isi) * 100)
                  : 0;
                return (
                  <ProgressCourseCard
                    key={uc.id}
                    course={course}
                    progress={Math.min(progress, 100)}
                    seed={seed}
                    onStart={handleStartCourse}
                  />
                );
              })}
            </div>
          </div>
        )}

        {completedCourses.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#FDECB3] rounded-xl flex items-center justify-center shadow-sm">
                <Award className="w-6 h-6 text-[#D29400]" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-extrabold text-black tracking-tight">{t.selesaiTitle}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {completedCourses.map((uc) => {
                const course = uc.course;
                if (course.course_type === "unsolved_case") {
                  return <CourseCard key={uc.id} course={course} />;
                }
                return (
                  <ProgressCourseCard
                    key={uc.id}
                    course={course}
                    progress={100}
                    seed={seed}
                    onStart={handleStartCourse}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      <ProfileIncompleteModal open={showProfileGate} onClose={() => setShowProfileGate(false)} />
    </div>
  );
}

function ProgressCourseCard({
  course,
  progress,
  seed,
  onStart,
}: {
  course: CourseWithRelations;
  progress: number;
  seed: number;
  onStart: (courseId: string, e: React.MouseEvent) => void;
}) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.omahBelajar : en.omahBelajar;

  return (
    <div
      onClick={(e) => onStart(course.id, e)}
      className="bg-white border-2 border-[#3B387E] rounded-2xl p-3 flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-md transition-all"
    >
      <div>
        {/* Judul & Garis Bawah */}
        <div className="border-b border-[#3B387E]/30 pb-1 mb-1.5">
          <h3 className="text-sm font-black text-black tracking-wide uppercase">
            {course.title}
          </h3>
        </div>

        {/* Kategori */}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          {course.category?.name ?? "Unknown"}
        </p>

        {/* Deskripsi */}
        {course.description && (
          <p className="text-[10px] text-gray-600 leading-relaxed mb-3 line-clamp-2">
            {course.description}
          </p>
        )}
      </div>

      <div>
        {/* Meta (Badge % & Tombol Lanjutkan) */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="bg-[#FFA756] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
            {progress}%
          </span>
          <span className="inline-flex items-center space-x-1.5 text-[#3B387E] font-bold text-sm hover:opacity-80 transition">
            <span>{t.lanjutkanBtn}</span>
            <span className="w-5 h-5 bg-[#3B387E] text-white rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M5 19L19 5M19 5H9M19 5V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </div>

        {/* Gambar Kartu */}
        <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-gray-100">
          {course.thumbnail_url ? (
            <img
              src={transformImageUrl(course.thumbnail_url)}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: seededColor(seed, parseInt(course.id.slice(0, 8), 36) || 0) }}
            >
              {course.title.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
