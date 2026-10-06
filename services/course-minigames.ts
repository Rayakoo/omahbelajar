import { getSupabase, getValidToken, getAccessToken } from "@/lib/supabaseClient";

// ── Types ───────────────────────────────────────────────

export type CourseMinigame = {
  id: string;
  course_id: string;
  title: string;
  type: MinigameType;
  urutan: number;
  created_at: string;
  settings: Record<string, unknown>;
};

export type MinigameType = "tts" | "find_the_word" | "true_or_false" | "drawing" | "fill_the_blank" | "match_pairs" | "flashcard";

export const MINIGAME_TYPE_LABELS: Record<MinigameType, string> = {
  tts: "Teka Teki Silang",
  find_the_word: "Find the Word",
  true_or_false: "Benar atau Salah",
  drawing: "Menggambar",
  fill_the_blank: "Mengisi Kotak Kosong",
  match_pairs: "Memasangkan Gambar",
  flashcard: "Flashcard",
};

// TTS (crossword)
export type TtsClue = {
  id: string;
  minigame_id: string;
  number: number;
  question: string;
  answer: string;
  row: number;
  col: number;
  direction: "across" | "down";
  explanation: string | null;
};

export type TtsClueInput = {
  number: number;
  question: string;
  answer: string;
  explanation?: string;
};

// Find the word (stored in course_minigames.settings.words for positioned words, or in minigame_find_word table for legacy)
export type FindWord = {
  id: string;
  minigame_id: string;
  question: string;
  answer: string;
  explanation: string | null;
  row: number;
  col: number;
  direction: "across" | "down";
};

// Word with position data (stored in settings)
export type SettingsWord = {
  question: string;
  answer: string;
  explanation: string;
  row: number;
  col: number;
  direction: "across" | "down";
};

// True or false
export type TrueFalseItem = {
  image_url?: string;
  title: string;
  answer: boolean;
  explanation?: string;
};

export type TrueFalse = {
  id: string;
  minigame_id: string;
  question: string;
  items: TrueFalseItem[];
};

// Drawing
export type Drawing = {
  id: string;
  minigame_id: string;
  question: string;
  base_image_url: string | null;
};

// Fill the blank
export type FillBlank = {
  id: string;
  minigame_id: string;
  image_url: string | null;
  question: string;
  answer_count: number;
  answers: string[];
  explanation: string | null;
};

// Match pairs
export type MatchPairItem = {
  id: string;
  match_pairs_id: string;
  pair_code: string;
  image_url: string | null;
  card_title: string;
};

export type MatchPairs = {
  id: string;
  minigame_id: string;
  question: string;
  pair_count: number;
  items: MatchPairItem[];
};

// Flashcard (kartu depan; kartu belakang disimpan di course_minigames.settings.back_image)
export type FlashcardCard = {
  id: string;
  minigame_id: string;
  front_image_url: string;
  correct_answer: string;
  explanation: string | null;
  options: string[];
  created_at?: string;
};

export type FlashcardCardInput = Omit<FlashcardCard, "id" | "minigame_id">;

// ── CRUD: course_minigames ──────────────────────────────

export async function getCourseMinigames(courseId: string) {
  const { data, error } = await getSupabase()
    .from("course_minigames")
    .select("*")
    .eq("course_id", courseId)
    .order("urutan", { ascending: true });

  if (error) throw error;
  return data as CourseMinigame[];
}

export async function getMinigameById(id: string) {
  const { data, error } = await getSupabase()
    .from("course_minigames")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as CourseMinigame;
}

export async function createCourseMinigame(input: {
  course_id: string;
  title: string;
  type: MinigameType;
  urutan?: number;
}) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_minigames?select=*`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase POST failed: ${res.status} ${errText}`);
  }
  const data = await res.json();
  if (!data || data.length === 0) throw new Error("No data returned");
  return data[0] as CourseMinigame;
}

export async function updateCourseMinigame(
  id: string,
  updates: Partial<Pick<CourseMinigame, "title" | "type" | "urutan" | "settings">>
) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_minigames?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase PATCH failed: ${res.status} ${errText}`);
  }
}

export async function deleteCourseMinigame(id: string) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_minigames?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase DELETE failed: ${res.status}`);
}

// ── CRUD: TTS clues ─────────────────────────────────────

export async function getTtsClues(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_tts")
    .select("*")
    .eq("minigame_id", minigameId)
    .order("number", { ascending: true });

  if (error) throw error;
  return data as TtsClue[];
}

export async function saveTtsClues(minigameId: string, clues: Omit<TtsClue, "id" | "minigame_id" | "created_at">[]) {
  const token = await getValidToken().catch(() => getAccessToken());

  const deleteRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_tts?minigame_id=eq.${minigameId}`,
    {
      method: "DELETE",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!deleteRes.ok) throw new Error(`Gagal hapus clues lama: ${deleteRes.status}`);

  if (clues.length === 0) return;

  const insertRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_tts?select=*`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(clues.map((c) => ({ ...c, minigame_id: minigameId }))),
    }
  );
  if (!insertRes.ok) throw new Error(`Gagal insert clues: ${insertRes.status}`);
}

// ── CRUD: Find Word ─────────────────────────────────────

export async function getFindWords(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_find_word")
    .select("*")
    .eq("minigame_id", minigameId);

  if (error) throw error;
  return (data || []).map((w: Record<string, unknown>) => ({
    ...w,
    row: w.row ?? 0,
    col: w.col ?? 0,
    direction: (w.direction as "across" | "down") || "across",
  })) as FindWord[];
}

export async function saveFindWords(minigameId: string, items: Omit<FindWord, "id" | "minigame_id" | "created_at">[]) {
  const token = await getValidToken().catch(() => getAccessToken());
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_find_word?minigame_id=eq.${minigameId}`,
    {
      method: "DELETE",
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
    }
  );
  if (items.length === 0) return;
  // Strip position fields (not in the table schema)
  const tableData = items.map(({ row, col, direction, ...rest }) => ({ ...rest, minigame_id: minigameId }));
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_find_word?select=*`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(tableData),
    }
  );
}

// ── CRUD: True/False ────────────────────────────────────

export async function getTrueFalseItems(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_true_false")
    .select("*")
    .eq("minigame_id", minigameId)
    .order("id", { ascending: true });

  if (error) throw error;
  return data as TrueFalse[];
}

export async function saveTrueFalseItems(minigameId: string, data: { question: string; items: TrueFalseItem[] }) {
  const token = await getValidToken().catch(() => getAccessToken());
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_true_false?minigame_id=eq.${minigameId}`,
    {
      method: "DELETE",
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
    }
  );
  if (data.items.length === 0) return;
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_true_false?select=*`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        minigame_id: minigameId,
        question: data.question,
        items: JSON.stringify(data.items),
      }),
    }
  );
}

// ── CRUD: Drawing ───────────────────────────────────────

export async function getDrawings(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_drawing")
    .select("*")
    .eq("minigame_id", minigameId);

  if (error) throw error;
  return data as Drawing[];
}

export async function saveDrawings(minigameId: string, items: Omit<Drawing, "id" | "minigame_id" | "created_at">[]) {
  const token = await getValidToken().catch(() => getAccessToken());
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_drawing?minigame_id=eq.${minigameId}`,
    {
      method: "DELETE",
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
    }
  );
  if (items.length === 0) return;
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_drawing?select=*`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(items.map((c) => ({ ...c, minigame_id: minigameId }))),
    }
  );
}

// ── CRUD: Fill Blank ────────────────────────────────────

export async function getFillBlanks(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_fill_blank")
    .select("*")
    .eq("minigame_id", minigameId);

  if (error) throw error;
  return data as FillBlank[];
}

export async function saveFillBlanks(minigameId: string, items: Omit<FillBlank, "id" | "minigame_id" | "created_at">[]) {
  const token = await getValidToken().catch(() => getAccessToken());
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_fill_blank?minigame_id=eq.${minigameId}`,
    {
      method: "DELETE",
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
    }
  );
  if (items.length === 0) return;
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_fill_blank?select=*`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(items.map((c) => ({ ...c, minigame_id: minigameId, answers: JSON.stringify(c.answers) }))),
    }
  );
}

// ── CRUD: Match Pairs ───────────────────────────────────

export async function getMatchPairs(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_match_pairs")
    .select("*, items:minigame_match_pair_items(*)")
    .eq("minigame_id", minigameId);

  if (error) throw error;
  return data as MatchPairs[];
}

export async function saveMatchPairs(
  minigameId: string,
  pairs: { question: string; pair_count: number; items: Omit<MatchPairItem, "id" | "match_pairs_id" | "created_at">[] }[]
) {
  const token = await getValidToken().catch(() => getAccessToken());

  const { data: existingPairs } = await getSupabase()
    .from("minigame_match_pairs")
    .select("id")
    .eq("minigame_id", minigameId);
  const ids = existingPairs?.map((p) => p.id) ?? [];
  for (const pid of ids) {
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_match_pair_items?match_pairs_id=eq.${pid}`,
      {
        method: "DELETE",
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
      }
    );
  }
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_match_pairs?minigame_id=eq.${minigameId}`,
    {
      method: "DELETE",
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
    }
  );

  if (pairs.length === 0) return;

  for (const pair of pairs) {
    const pairRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_match_pairs?select=*`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({ minigame_id: minigameId, question: pair.question, pair_count: pair.pair_count }),
      }
    );
    if (!pairRes.ok) throw new Error(`Gagal insert match pair: ${pairRes.status}`);
    const [created] = await pairRes.json();
    if (!created) throw new Error("No data returned");

    if (pair.items.length > 0) {
      const itemRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_match_pair_items?select=*`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${token}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify(pair.items.map((item) => ({ ...item, match_pairs_id: created.id }))),
        }
      );
      if (!itemRes.ok) throw new Error(`Gagal insert match pair items: ${itemRes.status}`);
    }
  }
}

// ── CRUD: Flashcard ──────────────────────────────────────

export async function getFlashcards(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_flashcards")
    .select("*")
    .eq("minigame_id", minigameId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []).map((c: Record<string, unknown>) => ({
    ...c,
    options: typeof c.options === "string" ? JSON.parse(c.options) : c.options,
  })) as FlashcardCard[];
}

export function getFlashcardBackImage(settings: Record<string, unknown>): string {
  return typeof settings?.back_image === "string" ? settings.back_image : "";
}

export async function saveFlashcards(minigameId: string, cards: FlashcardCardInput[]) {
  const token = await getValidToken().catch(() => getAccessToken());

  const deleteRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_flashcards?minigame_id=eq.${minigameId}`,
    {
      method: "DELETE",
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
    }
  );
  if (!deleteRes.ok) throw new Error(`Gagal hapus kartu lama: ${deleteRes.status}`);

  if (cards.length === 0) return;

  const insertRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minigame_flashcards?select=*`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(cards.map((c) => ({ ...c, minigame_id: minigameId, options: JSON.stringify(c.options) }))),
    }
  );
  if (!insertRes.ok) throw new Error(`Gagal insert kartu: ${insertRes.status}`);
}
