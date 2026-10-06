import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

function getStorageKey() {
  const projectId = supabaseUrl?.match(/\/\/([^.]+)/)?.[1] ?? "local";
  return `sb-${projectId}-auth-token`;
}

function readSession() {
  const key = getStorageKey();
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

function writeSession(data: Record<string, unknown>) {
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(data));
}

export function getAccessToken(): string {
  const session = readSession();
  if (!session) throw new Error("No session in localStorage");
  const token = session?.access_token;
  if (!token) throw new Error("No access token");
  return token;
}

export async function getValidToken(): Promise<string> {
  const session = readSession();
  if (!session?.refresh_token) throw new Error("No refresh token");

  const expiresAt = session.expires_at || 0;
  const now = Date.now();
  if (now < expiresAt - 60_000) return session.access_token;

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey!,
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) throw new Error("Refresh token failed");

  const data = await res.json();
  writeSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    user: data.user || session.user,
  });

  return data.access_token;
}
