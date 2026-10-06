"use client";

import Link from "next/link";
import type { CourseWithRelations } from "@/services/courses";
import { transformImageUrl } from "@/lib/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";

interface Props {
  course: CourseWithRelations;
}

export default function CourseCard({ course }: Props) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.omahBelajar : en.omahBelajar;
  const isUnsolvedCase = course.course_type === "unsolved_case";
  const linkHref = isUnsolvedCase ? `/unsolved-case/${course.id}` : `/omah-belajar/${course.id}`;

  if (isUnsolvedCase) {
    return (
      <Link
        href={linkHref}
        className="block relative rounded-[30px] overflow-hidden border border-[#c4a882] bg-[#f8f1e5] shadow-[0_18px_38px_rgba(92,61,46,0.18)] hover:-translate-y-1 transition-all duration-300"
      >
        <div
          className="absolute left-0 right-0 top-0 z-20 h-7"
          style={{
            background: "linear-gradient(180deg, #c4b098 0%, #b8a48a 100%)",
            clipPath: "polygon(0 0, 50% 100%, 100% 0)",
            borderBottom: "2px solid rgba(92,61,46,0.16)",
          }}
        />

        <div className="relative px-4 pt-8 pb-5 text-[#3c2415]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="rounded-full border border-[#d4c4a8] bg-[#f7f1df] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5c3d2e]">
              Surat Kasus
            </span>
            <span className="text-[10px] font-semibold text-[#8b7355] italic">Detektif</span>
          </div>

          <div
            className="relative overflow-hidden rounded-[22px] border-2 border-[#b8a48a] shadow-md"
            style={{
              background: "linear-gradient(160deg, #d4c4a8 0%, #c4b098 50%, #d4c4a8 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #5c3d2e 10px, #5c3d2e 11px)",
              }}
            />

            <div className="relative px-4 py-5 text-center">
              <p className="text-[10px] text-[#8b7355] font-mono uppercase tracking-[0.18em] mb-2">Judul Berkas</p>
              <h4 className="font-extrabold text-sm leading-snug text-[#3c2415] line-clamp-3 uppercase tracking-wider">
                {course.title}
              </h4>
              <div className="w-12 h-[2px] bg-[#8b7355]/35 mx-auto my-3" />
              <p className="text-[11px] text-[#5c3d2e] mt-2 line-clamp-4 leading-relaxed">
                {course.description}
              </p>
              <div className="mt-4 text-[10px] text-[#5c3d2e] font-bold font-mono uppercase tracking-[0.25em]">
                Sangat Rahasia
              </div>
              <p className="text-[11px] text-[#5c3d2e] mt-2 italic leading-relaxed font-medium">
                credit by paramytha magdalena sukarno putri and team
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-[#8b7355] flex-wrap">
            <span className="rounded-full bg-[#e7dbc3] px-2.5 py-1 font-medium">Kasus Misterius</span>
            {course.jumlah_isi > 0 && <span>{course.jumlah_isi} Pelajaran</span>}
          </div>

          <div className="mt-4 rounded-[16px] bg-[#5c3d2e] px-4 py-3 text-center text-white font-bold text-sm shadow-sm hover:bg-[#4c2f21] transition-colors">
            Mulai Investigasi
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={linkHref}
      className="bg-white border-2 border-[#3B387E] rounded-[28px] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition"
    >
      <div>
        {/* Judul & Garis Bawah */}
        <div className="border-b border-[#3B387E]/30 pb-2 mb-3">
          <h3 className="text-xl font-black text-black tracking-wide uppercase">
            {course.title}
          </h3>
        </div>

        {/* Kategori */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          {course.category?.name ?? "Unknown"}
        </p>

        {/* Deskripsi Singkat */}
        {course.description && (
          <p className="text-xs text-gray-600 leading-relaxed mb-6 line-clamp-3">{course.description}</p>
        )}
      </div>

      <div>
        {/* Tombol Mulai Belajar */}
        <div className="mb-4">
          <span className="inline-block bg-[#FFA756] hover:bg-[#e89443] text-white text-xs font-bold px-4 py-2 rounded-xl transition">
            {t.mulaiBelajar}
          </span>
        </div>

        {/* Thumbnail Gambar */}
        <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-gray-100">
          {course.thumbnail_url ? (
            <img
              src={transformImageUrl(course.thumbnail_url)}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg bg-[#3B387E]">
              {course.title.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
