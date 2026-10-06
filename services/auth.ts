import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabase, getAccessToken, getValidToken } from "@/lib/supabaseClient";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase env vars not set");
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

export type Profile = {
  id: string;
  full_name: string;
  role: string;
  usia: number | null;
  jenis_kelamin: string | null;
  tempat_tinggal: string | null;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
};

// ── OAuth helper: temporary client for code exchange ─────────
function createOAuthClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createSupabaseClient(url, anonKey);
}

// ── Passwordless helper: set session from OAuth to localStorage ─
function saveOAuthSession(session: {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string };
}) {
  const projectId = supabaseUrl?.match(/\/\/([^.]+)/)?.[1] ?? "local";
  const storageKey = `sb-${projectId}-auth-token`;
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: Date.now() + 3600 * 1000,
      user: session.user,
    })
  );
}

// ── Sign Up ──────────────────────────────────────────────────
export async function signUp(email: string, password: string, fullName?: string) {
  const { url, anonKey } = getSupabaseConfig();
  const res = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
    },
    body: JSON.stringify({
      email,
      password,
      data: { full_name: fullName ?? "", role: "user" },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.msg || err.error || "Sign up failed");
  }
  const data = await res.json();
  return {
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email!,
          user_metadata: {
            full_name: data.user.user_metadata?.full_name as string | undefined,
            avatar_url: data.user.user_metadata?.avatar_url as string | undefined,
            role: data.user.user_metadata?.role as string | undefined,
          },
        }
      : null,
    session: null,
  };
}

// ── Sign In ──────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { url, anonKey } = getSupabaseConfig();
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.msg || err.error || "Login failed");
  }
  const data = await res.json();

  // Hapus session lama sebelum simpan yang baru
  const oldKey = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
  if (oldKey) localStorage.removeItem(oldKey);

  const projectId = url.match(/\/\/([^.]+)/)?.[1] ?? "local";
  const storageKey = `sb-${projectId}-auth-token`;

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
      user: data.user,
    })
  );

  const role = await getUserRole(data.user.id, data.access_token);

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      user_metadata: {
        full_name: data.user.user_metadata?.full_name as string | undefined,
        avatar_url: data.user.user_metadata?.avatar_url as string | undefined,
        role: role || data.user.user_metadata?.role || "user",
      },
    },
    session: { access_token: data.access_token, refresh_token: data.refresh_token },
  };
}

// ── Sign Out ─────────────────────────────────────────────────
export async function signOut() {
  try {
    const { url, anonKey } = getSupabaseConfig();
    const token = await getValidToken().catch(() => getAccessToken());
    await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });
  } catch {}
  // Hapus session dari localStorage
  const key = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
  if (key) localStorage.removeItem(key);
  // Juga sign out dari OAuth client
  try {
    const supabase = createOAuthClient();
    await supabase.auth.signOut();
  } catch {}
}

// ── Get Current User ─────────────────────────────────────────
export async function getCurrentUser() {
  try {
    const token = await getValidToken().catch(() => getAccessToken());
    const { url, anonKey } = getSupabaseConfig();
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Token invalid");
    const userData = await res.json();
    if (!userData?.id) throw new Error("No user");

    const role = await getUserRole(userData.id, token);

    return {
      id: userData.id,
      email: userData.email!,
      user_metadata: {
        full_name: userData.user_metadata?.full_name as string | undefined,
        avatar_url: userData.user_metadata?.avatar_url as string | undefined,
        role: role || userData.user_metadata?.role || "user",
      },
    } as User;
  } catch {
    return null;
  }
}

// ── Get Session ──────────────────────────────────────────────
export async function getSession() {
  try {
    const token = await getValidToken().catch(() => getAccessToken());
    return { access_token: token };
  } catch {
    return null;
  }
}

// ── Exchange OAuth code from URL ────────────────────────────
export async function exchangeOAuthCode(code: string) {
  const supabase = createOAuthClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;

  // Simpan session ke localStorage agar existing auth bisa baca
  if (data.session) {
    saveOAuthSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.session.user.id,
        email: data.session.user.email!,
      },
    });
  }
  return data;
}

// ── Handle Implicit Flow (#access_token=...) ────────────────
export function handleImplicitFlow() {
  const hash = window.location.hash; // "#access_token=xxx&expires_in=3600&..."
  if (!hash || !hash.includes("access_token=")) return false;

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const expires_in = params.get("expires_in");

  if (!access_token) return false;

  // Decode JWT untuk ambil user id & email
  let userId = "";
  let email = "";
  try {
    const payload = JSON.parse(atob(access_token.split(".")[1]));
    userId = payload.sub;
    email = payload.email;
  } catch {}

  saveOAuthSession({
    access_token,
    refresh_token: refresh_token || "",
    user: { id: userId, email },
  });

  return true;
}

// ── Reset Password ───────────────────────────────────────────
export async function resetPassword(email: string) {
  const { url, anonKey } = getSupabaseConfig();
  const res = await fetch(`${url}/auth/v1/recover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.msg || err.error || "Reset password failed");
  }
}

// ── Update Password ──────────────────────────────────────────
export async function updatePassword(newPassword: string) {
  const token = await getValidToken().catch(() => getAccessToken());
  const { url, anonKey } = getSupabaseConfig();
  const res = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.msg || err.error || "Update password failed");
  }
}

// ── Update Profile ──────────────────────────────────────────
export async function updateProfile(input: { full_name?: string; avatar_url?: string }) {
  const token = await getValidToken().catch(() => getAccessToken());
  const { url, anonKey } = getSupabaseConfig();
  const res = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: input }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.msg || err.error || "Update profile failed");
  }
}

export async function getUserRole(userId: string, accessToken?: string) {
  const token = accessToken || await getValidToken().catch(() => getAccessToken());
  const { url, anonKey } = getSupabaseConfig();
  const res = await fetch(`${url}/rest/v1/profiles?select=role&id=eq.${userId}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return "user";
  const data = await res.json();
  return (data?.[0]?.role as string) || "user";
}

// ── Get Own Profile ──────────────────────────────────────────
export async function getProfile(userId: string): Promise<Profile | null> {
  const token = await getValidToken().catch(() => getAccessToken());
  const { url, anonKey } = getSupabaseConfig();
  const res = await fetch(`${url}/rest/v1/profiles?select=*&id=eq.${userId}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data?.[0] as Profile) || null;
}

// ── Update Own Profile (nama, usia, jenis kelamin, tempat tinggal) ──
export async function updateProfileData(
  userId: string,
  input: { full_name?: string; usia?: number | null; jenis_kelamin?: string | null; tempat_tinggal?: string | null }
): Promise<Profile> {
  const token = await getValidToken().catch(() => getAccessToken());
  const { url, anonKey } = getSupabaseConfig();
  const headers = {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
    Prefer: "return=representation",
  };

  // Coba update baris profil yang sudah ada
  let res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ ...input, updated_at: new Date().toISOString() }),
  });
  let data: Profile[] = res.ok ? await res.json() : [];

  // Baris profil belum ada → insert baru
  if (!res.ok || !data || data.length === 0) {
    res = await fetch(`${url}/rest/v1/profiles?select=*`, {
      method: "POST",
      headers,
      body: JSON.stringify({ id: userId, role: "user", ...input, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Update profile failed");
    }
    data = await res.json();
  }

  if (!data || data.length === 0) throw new Error("No data returned");

  // Sinkronkan nama ke auth user_metadata agar navbar ikut ter-update
  if (input.full_name) {
    try {
      await updateProfile({ full_name: input.full_name });
    } catch {}
  }

  return data[0] as Profile;
}

// ── Auth State Listener ──────────────────────────────────────
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data } = getSupabase().auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const role = await getUserRole(session.user.id, session.access_token);
      callback({
        id: session.user.id,
        email: session.user.email!,
        user_metadata: {
          full_name: session.user.user_metadata?.full_name as string | undefined,
          avatar_url: session.user.user_metadata?.avatar_url as string | undefined,
          role: role || session.user.user_metadata?.role || "user",
        },
      });
    } else {
      callback(null);
    }
  });
  return data;
}

// ── User Management (Admin) ───────────────────────────────────
export async function getProfiles(): Promise<Profile[]> {
  const token = await getValidToken().catch(() => getAccessToken());
  const { url, anonKey } = getSupabaseConfig();
  const res = await fetch(`${url}/rest/v1/rpc/get_all_profiles_admin`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch profiles: ${res.status} ${errText}`);
  }
  return res.json();
}

export async function updateUserRole(userId: string, newRole: string): Promise<void> {
  const token = await getValidToken().catch(() => getAccessToken());
  const { url, anonKey } = getSupabaseConfig();
  const res = await fetch(`${url}/rest/v1/rpc/update_user_role_admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId, new_role: newRole }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update role: ${res.status} ${errText}`);
  }
}
