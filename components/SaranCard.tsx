import { ShieldCheck } from "lucide-react";

export type SaranCardProps = {
  nama: string;
  kategori: string;
  tanggal: string;
  isi: string;
  isAnonymous?: boolean;
  /** Dipakai untuk memilih background bergantian. */
  index?: number;
  className?: string;
};

function cardBackgroundClass(index: number) {
  const base =
    "bg-cover bg-center bg-no-repeat border border-white/60 shadow-xl";
  return index % 2 === 0
    ? `${base} bg-[#FFE8D6] bg-[url('/images/saran-bg-wide-1.webp')]`
    : `${base} bg-[#DFF3E8] bg-[url('/images/saran-bg-wide-2.webp')]`;
}

export default function SaranCard({
  nama,
  kategori,
  tanggal,
  isi,
  isAnonymous = false,
  index = 0,
  className = "",
}: SaranCardProps) {
  return (
    <article
      className={`relative flex min-h-[360px] w-full flex-col items-center overflow-hidden rounded-[36px] p-8 text-center md:min-h-[400px] md:p-12 ${cardBackgroundClass(index)} ${className}`}
    >
      <h3 className="mb-3 text-2xl font-extrabold text-[#3A2E5A] md:text-3xl">
        {nama}
      </h3>

      <span className="mb-3 rounded-full bg-[#FCD34D] px-5 py-1 text-xs font-extrabold text-[#3A2E5A] shadow-sm">
        {kategori}
      </span>

      <div className="mb-6 text-xs font-semibold text-[#6C5B7B] md:text-sm">
        <p>{tanggal}</p>
      </div>

      <p className="mb-8 max-w-2xl whitespace-pre-line text-xs font-medium leading-relaxed text-[#3A2E5A] md:text-sm">
        {isi}
      </p>

      <div className="mt-auto flex w-full items-center justify-between border-t border-[#3A2E5A]/10 pt-4 text-[#3A2E5A]">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-[#3A2E5A]" />
          </span>
          <span>{isAnonymous ? "Dikirim secara anonim" : "Saran Kawan Kita"}</span>
        </div>

        <span className="text-xs font-bold text-[#6C5B7B]">
          Saran #{index + 1}
        </span>
      </div>
    </article>
  );
}
