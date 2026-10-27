import { getSupabase } from "@/lib/supabaseClient";

export type SuggestionStatus = "pending" | "approved" | "rejected";

export type Suggestion = {
  id: string;
  name: string;
  category: string;
  content: string;
  is_anonymous: boolean;
  status: SuggestionStatus;
  created_at: string;
  updated_at: string;
};

export type CreateSuggestionInput = {
  name: string;
  category: string;
  content: string;
  is_anonymous?: boolean;
};

export async function getApprovedSuggestions(limit = 24) {
  const { data, error } = await getSupabase()
    .from("suggestions")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Suggestion[];
}

export async function createSuggestion(input: CreateSuggestionInput) {
  const { error } = await getSupabase()
    .from("suggestions")
    .insert({
      name: input.name.trim() || "Anonim",
      category: input.category.trim() || "Saran",
      content: input.content.trim(),
      is_anonymous: input.is_anonymous ?? false,
    });

  if (error) throw error;
}
