export interface PuzzleData {
  id: number;
  pieces: string[];
  correctOrder: number[];
  fact: string;
  factEn: string;
  category: string;
}

export const PUZZLES: PuzzleData[] = [
  {
    id: 1,
    pieces: [
      "Kesehatan reproduksi",
      "adalah",
      "keadaan sejahtera",
      "fisik, mental, dan sosial",
      "secara utuh",
    ],
    correctOrder: [0, 1, 2, 3, 4],
    fact: "Kesehatan reproduksi adalah keadaan sejahtera fisik, mental, dan sosial secara utuh dalam segala hal yang berkaitan dengan sistem reproduksi.",
    factEn: "Reproductive health is a state of complete physical, mental, and social well-being in all matters relating to the reproductive system.",
    category: "Dasar Kesehatan Reproduksi",
  },
  {
    id: 2,
    pieces: [
      "Kekerasan seksual",
      "adalah",
      "setiap perbuatan",
      "merendahkan martabat",
      "tanpa persetujuan korban",
    ],
    correctOrder: [0, 1, 2, 3, 4],
    fact: "Kekerasan seksual adalah setiap perbuatan merendahkan martabat yang dilakukan tanpa persetujuan korban.",
    factEn: "Sexual violence is any act that degrades dignity carried out without the victim's consent.",
    category: "Kekerasan Seksual",
  },
  {
    id: 3,
    pieces: [
      "Korban kekerasan",
      "berhak mendapatkan",
      "perlindungan hukum",
      "pendampingan psikologis",
      "dan layanan kesehatan",
    ],
    correctOrder: [0, 1, 2, 3, 4],
    fact: "Korban kekerasan berhak mendapatkan perlindungan hukum, pendampingan psikologis, dan layanan kesehatan.",
    factEn: "Victims of violence have the right to legal protection, psychological support, and health services.",
    category: "Hak Korban",
  },
  {
    id: 4,
    pieces: [
      "Jangan menyalahkan korban",
      "kekerasan seksual",
      "karena",
      "pelaku lah",
      "yang bertanggung jawab",
    ],
    correctOrder: [0, 1, 2, 3, 4],
    fact: "Jangan menyalahkan korban kekerasan seksual karena pelaku lah yang bertanggung jawab penuh atas tindakannya.",
    factEn: "Do not blame victims of sexual violence because it is the perpetrator who is fully responsible for their actions.",
    category: "Stigma & Victim Blaming",
  },
];

export const TOTAL_PUZZLES = PUZZLES.length;
