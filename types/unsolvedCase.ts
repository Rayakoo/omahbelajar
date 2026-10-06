export type UnsolvedCaseItem = {
  type: "text" | "image"
  content: string
}

export type UnsolvedCase = {
  id: string
  course_id: string
  title: string
  peraturan: UnsolvedCaseItem[]
  instruksi: UnsolvedCaseItem[]
  jawaban: UnsolvedCaseItem[]
  created_at: string
  updated_at: string
}

export type UserDetective = {
  id: string
  unsolved_case_id: string
  detective_name: string
  answers: Record<string, unknown>[]
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type UnsolvedCaseHintType = "chat" | "karakter" | "buku" | "kartu" | "lainnya"

export type UnsolvedCaseHintChat = {
  is_chat: boolean
  nama_lawan_chat?: string
  judul_hint?: string
  images: string[]
}

export type UnsolvedCaseHintKarakter = {
  nama: string
  foto_karakter: string
  images: string[]
}

export type UnsolvedCaseHintBuku = {
  judul_buku: string
  cover_buku: string
  isi_buku: string[]
}

export type UnsolvedCaseHintKartu = {
  nama_kartu: string
  kartu_depan: string
  kartu_belakang: string
}

export type UnsolvedCaseHintLainnya = {
  nama_hint: string
  gambar: string
  jumlah: number
}

export type UnsolvedCaseHintPayload = Partial<Omit<UnsolvedCaseHint, "konten">> & {
  konten: Record<string, unknown>
}

export type UnsolvedCaseHint = {
  id: string
  unsolved_case_id: string
  urutan: number
  tipe: UnsolvedCaseHintType
  konten: UnsolvedCaseHintChat | UnsolvedCaseHintKarakter | UnsolvedCaseHintBuku | UnsolvedCaseHintKartu | UnsolvedCaseHintLainnya
  created_at: string
  updated_at: string
}
