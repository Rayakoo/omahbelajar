import { getSupabase } from "@/lib/supabaseClient";

export interface MinigameResultInput {
  player_name: string;
  minigame: string;
  score: number;
  total: number;
  time_ms: number;
  wrong: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function saveMinigameResult(result: MinigameResultInput) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase env vars not set, skipping minigame result save");
    return;
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/minigame_results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        player_name: result.player_name,
        minigame: result.minigame,
        score: result.total > 0 ? Math.round((result.score / result.total) * 100) : 0,
        total: result.total,
        time_ms: result.time_ms,
        wrong: result.wrong,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Failed to save minigame result:", res.status, body);
    }
  } catch (err) {
    console.error("Network error saving minigame result:", err);
  }
}

export type MinigameResultRow = {
  id: number;
  player_name: string;
  minigame: string;
  score: number;
  total: number;
  time_ms: number;
  wrong: number;
  created_at: string;
};

export async function getMinigameResults() {
  if (!supabaseUrl || !supabaseAnonKey) return [];

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/minigame_results?order=created_at.desc`,
      {
        headers: {
          apikey: supabaseAnonKey,
        },
      }
    );
    if (!res.ok) {
      console.error("Failed to fetch minigame results:", res.status);
      return [];
    }
    return (await res.json()) as MinigameResultRow[];
  } catch (err) {
    console.error("Network error fetching minigame results:", err);
    return [];
  }
}

export async function deleteMinigameResult(id: number, token: string) {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase env vars not set");

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/minigame_results?id=eq.${id}`,
      {
        method: "DELETE",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Delete failed: ${res.status} ${body}`);
    }
  } catch (err) {
    throw err;
  }
}

const MINIGAME_NAMES: Record<string, string> = {
  tts: "TTS",
  "mitos-atau-fakta": "Mitos atau Fakta",
  puzzle: "Puzzle",
};

export function getMinigameName(key: string): string {
  return MINIGAME_NAMES[key] || key;
}

export function formatTimeMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
