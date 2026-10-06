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
    clue: "Persetujuan bebas dan sadar dari semua pihak yang terlibat dalam suatu tindakan",
    answer: "KONSEN",
    hint: "Berasal dari bahasa Inggris 'Consent'",
    category: "Hak Asasi",
    explanation: "Konsen atau persetujuan adalah pilar utama dalam menghormati otoritas tubuh orang lain. Segala bentuk tindakan seksual tanpa konsen merupakan kekerasan.",
    keyMessage: "Konsen harus diberikan secara sadar, sukarela, dan bisa ditarik kembali kapan saja.",
  },
  {
    id: 2,
    clue: "Hak dasar yang melekat pada diri manusia sejak lahir",
    answer: "HAM",
    hint: "Hak Asasi Manusia",
    category: "Prinsip",
    explanation: "Bebas dari segala bentuk kekerasan dan perlakuan merendahkan martabat manusia adalah bagian dari Hak Asasi Manusia.",
    keyMessage: "Perlindungan terhadap kekerasan seksual adalah pemenuhan hak asasi yang paling mendasar.",
  },
];

export interface Clue {
  id: number;
  number: number;
  question: string;
  answer: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

export const GRID_ROWS = 18;
export const GRID_COLS = 18;

export const CROSSWORD_CLUES: Clue[] = [
  { id: 1, number: 1, question: "Perbedaan perlakuan berdasarkan gender", answer: "DISKRIMINASI", row: 4, col: 11, direction: "down" },
  { id: 2, number: 2, question: "Dukungan pendamping hukum dan psikologis", answer: "PENDAMPINGAN", row: 5, col: 4, direction: "across" },
  { id: 3, number: 3, question: "Negara wajib memberi perlindungan pada korban", answer: "PERLINDUNGAN", row: 12, col: 6, direction: "across" },
  { id: 4, number: 4, question: "Proses pemulihan korban secara fisik dan psikis", answer: "REHABILITASI", row: 9, col: 6, direction: "across" },
  { id: 5, number: 5, question: "Pemanfaatan orang lain secara sewenang-wenang", answer: "EKSPLOITASI", row: 14, col: 2, direction: "across" },
  { id: 6, number: 6, question: "Tindakan merendahkan martabat seseorang", answer: "PELECEHAN", row: 0, col: 5, direction: "down" },
  { id: 7, number: 7, question: "Istilah untuk korban yang bangkit", answer: "PENYINTAS", row: 0, col: 5, direction: "across" },
  { id: 8, number: 8, question: "Kekerasan fisik, psikis, atau seksual", answer: "KEKERASAN", row: 7, col: 9, direction: "across" },
  { id: 9, number: 9, question: "Upaya pembelaan hak-hak korban", answer: "ADVOKASI", row: 10, col: 3, direction: "down" },
  { id: 10, number: 10, question: "Tindakan melindungi korban", answer: "LINDUNGI", row: 2, col: 17, direction: "down" },
  { id: 11, number: 11, question: "Hak korban atas proses hukum yang adil", answer: "KEADILAN", row: 2, col: 0, direction: "across" },
  { id: 12, number: 12, question: "Bantuan moral dan material bagi korban", answer: "DUKUNGAN", row: 0, col: 0, direction: "down" },
  { id: 13, number: 13, question: "Informasi resmi tentang tindak kekerasan", answer: "LAPORAN", row: 11, col: 16, direction: "down" },
  { id: 14, number: 14, question: "Keputusan hakim dalam sidang", answer: "PUTUSAN", row: 17, col: 10, direction: "across" },
  { id: 15, number: 15, question: "Persetujuan tanpa paksaan dari semua pihak", answer: "KONSEN", row: 0, col: 15, direction: "down" },
  { id: 16, number: 16, question: "Orang yang menderita akibat kekerasan", answer: "KORBAN", row: 2, col: 10, direction: "across" },
  { id: 17, number: 17, question: "Suara hati sebagai pedoman moral", answer: "NURANI", row: 7, col: 2, direction: "across" },
  { id: 18, number: 18, question: "Sanksi hukum bagi pelaku kekerasan", answer: "PIDANA", row: 10, col: 0, direction: "across" },
  { id: 19, number: 19, question: "Luka batin akibat kekerasan", answer: "TRAUMA", row: 0, col: 2, direction: "down" },
  { id: 20, number: 20, question: "Cap negatif yang melekat pada korban", answer: "STIGMA", row: 16, col: 3, direction: "across" },
  { id: 21, number: 21, question: "Kembali sehat setelah trauma", answer: "PULIH", row: 10, col: 0, direction: "down" },
  { id: 22, number: 22, question: "Hak Asasi Manusia", answer: "HAM", row: 4, col: 8, direction: "down" },
];

export function buildGrid(): { answer: string; number: number | null; active: boolean }[][] {
  const grid = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({
      answer: "",
      number: null as number | null,
      active: false,
    }))
  );

  for (const clue of CROSSWORD_CLUES) {
    let r = clue.row;
    let c = clue.col;
    for (let i = 0; i < clue.answer.length; i++) {
      if (r < GRID_ROWS && c < GRID_COLS) {
        grid[r][c].answer = clue.answer[i];
        grid[r][c].active = true;
        if (i === 0) {
          grid[r][c].number = grid[r][c].number
            ? Math.min(grid[r][c].number!, clue.number)
            : clue.number;
        }
        if (clue.direction === "across") c++;
        else r++;
      }
    }
  }

  return grid;
}
