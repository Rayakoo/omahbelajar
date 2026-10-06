"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
} from "lucide-react";
import {
  getCourses, getEducationLevels,
  type CourseWithRelations, type EducationLevel,
} from "@/services/courses";
import { getUserCourse, enrollCourse } from "@/services/userCourses";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";
import CourseCard from "@/components/CourseCard";
import ProfileIncompleteModal from "@/components/ProfileIncompleteModal";

interface UserStats {
  total: number;
  completed: number;
  inProgress: number;
}

export default function CoursePage({ initialCategory, pageBg }: { initialCategory?: string; pageBg?: string }) {
  const router = useRouter();
  const { user, profileComplete, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.omahBelajar : en.omahBelajar;
  const common = locale === "id" ? id.common : en.common;

  const profileIncomplete = !!user && !profileComplete;

  const [courses, setCourses] = useState<CourseWithRelations[]>([]);
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("Semua");
  const [search, setSearch] = useState("");
  const [showProfileGate, setShowProfileGate] = useState(false);

  useEffect(() => {
    if (!authLoading && user && profileIncomplete) {
      setShowProfileGate(true);
    }
  }, [authLoading, user, profileIncomplete]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [c, lvs] = await Promise.all([
          getCourses(),
          getEducationLevels(),
        ]);
        setCourses(c);
        if (lvs.length > 0) setLevels(lvs);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const levelOptions = useMemo(() => {
    const names = levels.map((l) => l.name);
    const all = ["Semua", ...names];
    if (!names.includes("Umum")) all.push("Umum");
    return all;
  }, [levels]);

  const filteredCourses = useMemo(() => {
    let result = courses;
    if (initialCategory) {
      result = result.filter((c) => c.category?.name === initialCategory);
    }
    if (selectedLevel && selectedLevel !== "Semua") {
      result = result.filter((c) => c.education_level?.name === selectedLevel);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    return result;
  }, [courses, initialCategory, selectedLevel, search]);

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
    const course = courses.find((c) => c.id === courseId);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-page-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg ?? "bg-page-50"} text-brand-900 font-sans`}>
      <section className="bg-[#FED777] p-6 md:p-10 pb-16 md:pb-20 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Top bar: filter tabs & search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="inline-flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-black/5 self-start flex-wrap">
              {levelOptions.map((level) => {
                const isSelected = selectedLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`font-bold text-sm px-5 py-2 rounded-xl transition whitespace-nowrap ${
                      isSelected
                        ? "bg-[#83F3BA] text-black font-extrabold"
                        : "text-[#3B387E] hover:text-black"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-white border-2 border-[#3B387E] rounded-2xl py-2.5 pl-4 pr-11 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B387E]/40 transition"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-[#3B387E]">
                  <Search className="w-5 h-5" strokeWidth={2.5} />
                </div>
            </div>
          </div>

          {/* Judul section */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#3B387E] tracking-tight">
            {t.tersediaTitle}
          </h2>

          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-[#3B387E]/20 mb-4" />
              <h3 className="text-lg font-bold text-[#3B387E]/60">{t.emptyTitle}</h3>
              <p className="text-sm text-[#3B387E]/40 mt-1">{t.emptyDesc}</p>
            </div>
          )}
        </div>
      </section>

      <ProfileIncompleteModal open={showProfileGate} onClose={() => setShowProfileGate(false)} />
    </div>
  );
}
