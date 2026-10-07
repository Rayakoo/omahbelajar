"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCourses, type CourseWithRelations } from "@/services/courses";
import { useLanguage } from "@/contexts/LanguageContext";
import CourseCard from "@/components/CourseCard";

export default function UnsolvedCaseListPage() {
  const { locale } = useLanguage();
  const [courses, setCourses] = useState<CourseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then((all) => {
        setCourses(all.filter((c) => c.course_type === "unsolved_case"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const title = locale === "id" ? "Unsolved Case" : "Unsolved Case";
  const desc =
    locale === "id"
      ? "Jadilah detektif dan pecahkan kasus misterius dari course-course di bawah ini."
      : "Become a detective and solve mysterious cases from the courses below.";
  const emptyTitle = locale === "id" ? "Belum ada kasus tersedia" : "No cases available yet";
  const emptyDesc =
    locale === "id"
      ? "Kasus akan muncul setelah ditambahkan oleh admin."
      : "Cases will appear after being added by admin.";
  const back = locale === "id" ? "Kembali ke Minigames" : "Back to Minigames";

  return (
    <section className="font-sans">
      {/* Header */}
      <div className="bg-[#FFF6EA] pt-12 pb-44 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="inline-block bg-[#B9A6FF] text-white text-xs font-black px-6 py-1.5 rounded-full uppercase tracking-wider">
            🔍 {title}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
            {title}
          </h2>
          <p className="text-gray-800 text-sm md:text-base max-w-lg mx-auto font-medium leading-relaxed">
            {desc}
          </p>
          <Link
            href="/minigames"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#3B387E] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {back}
          </Link>
        </div>
      </div>

      {/* List course */}
      <div className="bg-[#3B387E] pt-px pb-16 px-4 md:px-8 min-h-[300px]">
        <div className="max-w-6xl mx-auto -mt-36">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-[30px] bg-white/10 animate-pulse h-72" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-[28px] p-10 text-center shadow-lg">
              <p className="text-lg font-extrabold text-black mb-2">{emptyTitle}</p>
              <p className="text-sm text-gray-600">{emptyDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
