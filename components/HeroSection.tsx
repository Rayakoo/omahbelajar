import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="relative mb-8 md:mb-12 font-poppins bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/background_hero.png)" }}
    >
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center px-6 md:px-12 lg:px-16 pt-12 md:pt-16 pb-36 md:pb-28">
        {/* Kolom kiri: teks & CTA */}
        <div className="lg:col-span-7 space-y-6">
          {/* Badge */}
          <div className="inline-block border-2 border-[#fae174] bg-white px-6 py-2 rounded-full shadow-sm">
            <span className="text-gray-900 font-medium text-sm md:text-base">
              Ruang belajar interaktif
            </span>
          </div>

          {/* Judul utama */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-black leading-[1.25] tracking-wide">
            TEMPAT BELAJAR
            <br />
            MENYENANGKAN &amp;
            <br />
            INTERAKTIF
          </h1>

          {/* Deskripsi */}
          <div className="text-gray-800 text-sm md:text-base leading-relaxed space-y-3 font-normal max-w-2xl">
            <p>
              Omah Belajar merupakan platform edukasi yang menawarkan pembekalan pengetahuan
              komprehensif, menguatkan <span className="italic">critical thinking</span> dan
              mendorong transformasi perilaku.
            </p>
            <p>
              Omah Belajar memuat tiga sasaran utama, meliputi: siswa, orang tua dan umum. Di
              sini kalian bisa mencoba berbagai <span className="italic">course</span> seputar
              kesehatan reproduksi seksual dan mini games interaktif.
            </p>
            <p>
              Setiap course yang telah selesai dikerjakan akan mendapatkan sertifikat dari Omah
              Nalar.
            </p>
          </div>

          {/* Tombol CTA */}
          <div className="pt-4">
            <Link
              href="/omah-belajar"
              className="inline-flex items-center space-x-3 bg-[#fae174] hover:bg-[#ebd05d] text-black font-extrabold text-base md:text-lg px-7 py-3 rounded-full transition shadow-sm"
            >
              <span>Belajar, yuk!</span>
              <span className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </Link>
          </div>
        </div>

        {/* Kolom kanan: kolase gambar */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <img
            src="/hero_desktop.png"
            alt="Kolase Omah Belajar"
            className="w-full max-w-[460px] h-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}
