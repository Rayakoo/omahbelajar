"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, BookOpen, BarChart3, Users, GraduationCap, CalendarDays } from "lucide-react";
import { getCourseById, type CourseWithRelations, COURSE_TYPE_LABELS } from "@/services/courses";
import { getUserCourse, enrollCourse } from "@/services/userCourses";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";
import { transformImageUrl } from "@/lib/image";
import ProfileIncompleteModal from "@/components/ProfileIncompleteModal";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profileComplete, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.omahBelajar : en.omahBelajar;
  const common = locale === "id" ? id.common : en.common;
  const courseId = params["id-course"] as string;

  const [course, setCourse] = useState<CourseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showProfileGate, setShowProfileGate] = useState(false);

  const profileIncomplete = !!user && !profileComplete;

  useEffect(() => {
    if (!courseId) return;
    getCourseById(courseId)
      .then(setCourse)
      .catch(() => router.push("/omah-belajar"))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (!user || !courseId) return;
    getUserCourse(user.id, courseId)
      .then((uc) => {
        if (uc) {
          setIsEnrolled(true);
          setIsCompleted(uc.is_completed);
        }
      })
      .catch(() => {});
  }, [user, courseId]);

  const handleStart = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!authLoading && profileIncomplete) {
      setShowProfileGate(true);
      return;
    }
    if (course?.course_type === "unsolved_case") {
      router.push(`/unsolved-case/${courseId}`);
      return;
    }
    if (!isEnrolled) {
      try {
        await enrollCourse(user.id, courseId);
      } catch {}
    }
    router.push(`/omah-belajar/${courseId}/materi`);
  };

  const today = new Date().toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-page-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  const courseLengthMinutes = (course.jumlah_isi || 0) * 30;

  return (
    <div className="min-h-screen bg-[#DCD5FE] font-sans">
      <section className="p-6 md:p-10 flex flex-col items-center">
        <div className="max-w-3xl w-full space-y-6">

          {/* Tombol kembali */}
          <div>
            <Link
              href="/omah-belajar"
              className="inline-flex items-center space-x-2.5 bg-[#3B387E] hover:bg-[#2e2a66] text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition shadow-sm"
            >
              <span className="w-5 h-5 bg-white text-[#3B387E] rounded-full flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </span>
              <span>{t.kembaliBtn}</span>
            </Link>
          </div>

          {/* Banner gambar */}
          <div className="rounded-3xl overflow-hidden border-2 border-[#3B387E] aspect-[16/9] w-full bg-gray-100 shadow-sm">
            {course.thumbnail_url ? (
              <img
                src={transformImageUrl(course.thumbnail_url)}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#DCD5FE]">
                <BookOpen className="w-16 h-16 text-[#3B387E]/30" />
              </div>
            )}
          </div>

          {/* Kartu detail course */}
          <div className="bg-white border-2 border-[#3B387E] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">

            {/* Judul & garis pemisah */}
            <div className="border-b border-[#3B387E]/30 pb-3">
              <h1 className="text-2xl md:text-3xl font-black text-[#3B387E] uppercase tracking-wide">
                {course.title}
              </h1>
            </div>

            {/* Deskripsi */}
            {course.description && (
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-normal">
                {course.description}
              </p>
            )}

            {/* Grid informasi / metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4 pt-2">
              <div className="flex items-start space-x-2.5">
                <Clock className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {locale === "id" ? "Durasi" : "Duration"}
                  </p>
                  <p className="text-xs md:text-sm font-extrabold text-black">
                    {courseLengthMinutes} {locale === "id" ? "menit" : "minutes"}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <BookOpen className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {locale === "id" ? "Modul" : "Modules"}
                  </p>
                  <p className="text-xs md:text-sm font-extrabold text-black">
                    {course.jumlah_isi} {locale === "id" ? "modul" : "modules"}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Users className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {locale === "id" ? "Kategori" : "Category"}
                  </p>
                  <p className="text-xs md:text-sm font-extrabold text-black">{course.category?.name}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <GraduationCap className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Level</p>
                  <p className="text-xs md:text-sm font-extrabold text-black">{course.education_level?.name}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <BarChart3 className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {locale === "id" ? "Tipe" : "Type"}
                  </p>
                  <p className="text-xs md:text-sm font-extrabold text-black">
                    {COURSE_TYPE_LABELS[course.course_type] || course.course_type}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <CalendarDays className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {locale === "id" ? "Mulai" : "Start"}
                  </p>
                  <p className="text-xs md:text-sm font-extrabold text-black">{today}</p>
                </div>
              </div>
            </div>

            {/* Tombol lanjutkan */}
            <div className="pt-4">
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center space-x-2 bg-[#3B387E] hover:bg-[#2e2a66] text-white font-extrabold text-base py-3.5 px-6 rounded-2xl transition shadow-sm"
              >
                <span>
                  {isCompleted
                    ? (locale === "id" ? "Lihat Lagi" : "Review")
                    : isEnrolled
                      ? (locale === "id" ? "Lanjutkan" : "Continue")
                      : (locale === "id" ? "Mulai Belajar" : "Start Learning")}
                </span>
                <svg className="w-4 h-4 fill-current ml-1" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </section>

      <ProfileIncompleteModal open={showProfileGate} onClose={() => setShowProfileGate(false)} />
    </div>
  );
}
