"use client";

export interface TTSQuestion {
  id: number;
  clue: string;
  answer: string;
  hint: string;
  category: string;
  explanation: string;
  keyMessage: string;
}

export const TTS_QUESTIONS: TTSQuestion[] = [
  {
    id: 1,
    clue: "Organ reproduksi wanita tempat janin berkembang selama kehamilan",
    answer: "RAHIM",
    hint: "Disebut juga uterus",
    category: "Anatomi",
    explanation: "Rahim atau uterus adalah organ berongga berbentuk buah pir tempat janin tumbuh dan berkembang selama kehamilan.",
    keyMessage: "Rahim adalah organ vital dalam sistem reproduksi wanita yang berfungsi sebagai tempat pertumbuhan janin.",
  },
  {
    id: 2,
    clue: "Proses pelepasasan sel telur matang dari ovarium setiap bulan",
    answer: "OVULASI",
    hint: "Terjadi sekitar hari ke-14 siklus menstruasi",
    category: "Siklus",
    explanation: "Ovulasi adalah proses pelepasan ovum (sel telur) dari folikel ovarium yang terjadi setiap bulan pada wanita subur.",
    keyMessage: "Memahami siklus ovulasi penting untuk mengetahui masa subur dan menjaga kesehatan reproduksi.",
  },
  {
    id: 3,
    clue: "Zat kimia yang diproduksi kelenjar endokrin untuk mengatur fungsi tubuh",
    answer: "HORMON",
    hint: "Estrogen dan progesteron adalah contohnya",
    category: "Biologi",
    explanation: "Hormon reproduksi seperti estrogen, progesteron, dan testosteron mengatur perkembangan seksual, siklus menstruasi, dan kesuburan.",
    keyMessage: "Keseimbangan hormon sangat mempengaruhi kesehatan reproduksi dan kesuburan seseorang.",
  },
  {
    id: 4,
    clue: "Masa peralihan dari anak-anak menjadi dewasa yang ditandai perubahan fisik dan psikis",
    answer: "PUBERTAS",
    hint: "Terjadi sekitar usia 10-14 tahun",
    category: "Perkembangan",
    explanation: "Pubertas adalah masa transisi perkembangan fisik dan psikis dari anak-anak menuju dewasa yang dipicu oleh perubahan hormonal.",
    keyMessage: "Pubertas adalah fase normal yang dialami setiap remaja dan perlu dipahami dengan baik.",
  },
  {
    id: 5,
    clue: "Cairan yang dihasilkan testis dan mengandung sperma",
    answer: "AIRMANI",
    hint: "Disebut juga semen atau ejakulat",
    category: "Anatomi",
    explanation: "Air mani atau semen adalah cairan yang dikeluarkan saat ejakulasi, mengandung sperma dan cairan dari kelenjar reproduksi pria.",
    keyMessage: "Air mani membawa sperma yang diperlukan untuk pembuahan sel telur.",
  },
  {
    id: 6,
    clue: "Alat kontrasepsi berbentuk lingkaran kecil yang dipasang di dalam rahim",
    answer: "SPIRAL",
    hint: "Jenis KB jangka panjang (3-10 tahun)",
    category: "Kontrasepsi",
    explanation: "Spiral atau IUD (Intrauterine Device) adalah alat kontrasepsi berbentuk T yang dimasukkan ke dalam rahim untuk mencegah kehamilan.",
    keyMessage: "Spiral adalah salah satu metode kontrasepsi jangka panjang yang efektif dan reversibel.",
  },
  {
    id: 7,
    clue: "Penyakit menular seksual yang disebabkan bakteri Treponema pallidum",
    answer: "SIFILIS",
    hint: "Diawali dengan luka terbuka di area genital",
    category: "Penyakit",
    explanation: "Sifilis adalah infeksi menular seksual yang dapat menyebabkan komplikasi serius jika tidak diobati, namun dapat disembuhkan dengan antibiotik.",
    keyMessage: "Pencegahan dan pengobatan dini PMS sangat penting untuk menjaga kesehatan reproduksi.",
  },
  {
    id: 8,
    clue: "Sel kelamin pria yang membuahi sel telur",
    answer: "SPERMA",
    hint: "Berbentuk seperti kecebong dengan ekor",
    category: "Biologi",
    explanation: "Sperma adalah sel reproduksi pria yang diproduksi di testis dan berfungsi membuahi sel telur wanita.",
    keyMessage: "Kualitas dan kuantitas sperma dapat dipengaruhi oleh gaya hidup dan kondisi kesehatan.",
  },
  {
    id: 9,
    clue: "Pembuahan sel telur oleh sperma yang terjadi di tuba falopi",
    answer: "FERFILISASI",
    hint: "Tahap awal terbentuknya zigot",
    category: "Biologi",
    explanation: "Fertilisasi adalah proses peleburan inti sel sperma dan sel telur yang menghasilkan zigot, awal mula kehamilan.",
    keyMessage: "Fertilisasi terjadi di tuba falopi, bukan di rahim.",
  },
  {
    id: 10,
    clue: "Hormon reproduksi pria yang diproduksi di testis",
    answer: "TESTOSTERON",
    hint: "Bertanggung jawab atas karakteristik seksual sekunder pria",
    category: "Hormon",
    explanation: "Testosteron adalah hormon utama pada pria yang berperan dalam perkembangan organ reproduksi, massa otot, dan libido.",
    keyMessage: "Testosteron penting untuk kesehatan reproduksi pria dan kesejahteraan secara keseluruhan.",
  },
  {
    id: 11,
    clue: "Perdarahan bulanan dari rahim yang terjadi pada wanita subur",
    answer: "MENSTRUASI",
    hint: "Berlangsung sekitar 3-7 hari setiap bulan",
    category: "Siklus",
    explanation: "Menstruasi adalah peluruhan lapisan endometrium rahim yang terjadi secara siklus apabila tidak terjadi kehamilan.",
    keyMessage: "Menstruasi adalah proses alami yang menandai kesehatan reproduksi wanita.",
  },
  {
    id: 12,
    clue: "Kelenjar yang memproduksi sel telur pada wanita",
    answer: "OVARIUM",
    hint: "Disebut juga indung telur",
    category: "Anatomi",
    explanation: "Ovarium adalah organ reproduksi wanita yang memproduksi sel telur (ovum) dan hormon estrogen serta progesteron.",
    keyMessage: "Ovarium berperan ganda: menghasilkan sel telur dan hormon reproduksi penting.",
  },
  {
    id: 13,
    clue: "Metode kontrasepsi permanen untuk pria dengan memotong saluran sperma",
    answer: "VASEKTOMI",
    hint: "Prosedur bedah ringan, tidak mempengaruhi ereksi",
    category: "Kontrasepsi",
    explanation: "Vasektomi adalah prosedur kontrasepsi permanen pada pria dengan memotong atau mengikat vas deferens agar sperma tidak tercampur air mani.",
    keyMessage: "Vasektomi tidak mempengaruhi kemampuan ereksi atau ejakulasi, hanya menghilangkan sperma dari air mani.",
  },
  {
    id: 14,
    clue: "Masa berhentinya siklus menstruasi secara permanen pada wanita usia lanjut",
    answer: "MENOPAUSE",
    hint: "Rata-rata terjadi di usia 45-55 tahun",
    category: "Siklus",
    explanation: "Menopause adalah berhentinya siklus menstruasi secara alami yang menandai akhir masa reproduksi wanita.",
    keyMessage: "Menopause adalah fase normal dalam kehidupan wanita yang perlu dihadapi dengan pemahaman yang baik.",
  },
  {
    id: 15,
    clue: "Lapisan dinding rahim yang meluruh saat menstruasi",
    answer: "ENDOMETRIUM",
    hint: "Tempat menempelnya embrio jika terjadi kehamilan",
    category: "Anatomi",
    explanation: "Endometrium adalah lapisan dalam rahim yang menebal setiap siklus untuk persiapan kehamilan dan meluruh jika tidak terjadi pembuahan.",
    keyMessage: "Kesehatan endometrium penting untuk kesuburan dan kelancaran siklus menstruasi.",
  },
];
