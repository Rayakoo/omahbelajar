import { getAccessToken, getValidToken } from "@/lib/supabaseClient";

export type UserCourse = {
  id: string;
  user_id: string;
  course_id: string;
  current_urutan: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  total_duration_seconds?: number;
};

export type UserQuizResult = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  passed: boolean;
  duration_seconds?: number;
  created_at: string;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase env vars not set");
  return { url, anonKey };
}

async function authHeaders(): Promise<Record<string, string>> {
  const { anonKey } = getSupabaseConfig();
  const headers: Record<string, string> = { apikey: anonKey };
  try { headers.Authorization = `Bearer ${await getValidToken().catch(() => getAccessToken())}`; } catch {}
  return headers;
}

async function supabaseGet<T>(path: string): Promise<T> {
  const { url } = getSupabaseConfig();
  const res = await fetch(`${url}${path}`, { headers: await authHeaders() });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase GET failed: ${res.status} ${errText}`);
  }
  return res.json();
}

async function supabasePost<T>(path: string, body: unknown): Promise<T> {
  const { url } = getSupabaseConfig();
  const ah = await authHeaders();
  const headers = { ...ah, "Content-Type": "application/json", Prefer: "return=representation" };
  const res = await fetch(`${url}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase POST failed: ${res.status} ${errText}`);
  }
  const data: T[] = await res.json();
  if (!data || data.length === 0) throw new Error("No data returned");
  return data[0];
}

async function supabasePatch<T>(path: string, body: unknown): Promise<T> {
  const { url } = getSupabaseConfig();
  const ah = await authHeaders();
  const headers = { ...ah, "Content-Type": "application/json", Prefer: "return=representation" };
  const res = await fetch(`${url}${path}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase PATCH failed: ${res.status} ${errText}`);
  }
  const data: T[] = await res.json();
  if (!data || data.length === 0) throw new Error("No data returned");
  return data[0];
}

export async function getUserCourse(userId: string, courseId: string) {
  try {
    const data = await supabaseGet<UserCourse[]>(
      `/rest/v1/user_courses?select=*&user_id=eq.${encodeURIComponent(userId)}&course_id=eq.${encodeURIComponent(courseId)}`
    );
    return data?.[0] || null;
  } catch {
    return null;
  }
}

export async function enrollCourse(userId: string, courseId: string) {
  return supabasePost<UserCourse>(
    `/rest/v1/user_courses?select=*`,
    { user_id: userId, course_id: courseId, current_urutan: 0, is_completed: false }
  );
}

export async function updateProgress(userId: string, courseId: string, urutan: number) {
  return supabasePatch<UserCourse>(
    `/rest/v1/user_courses?select=*&user_id=eq.${encodeURIComponent(userId)}&course_id=eq.${encodeURIComponent(courseId)}`,
    { current_urutan: urutan, updated_at: new Date().toISOString() }
  );
}

export async function completeCourse(userId: string, courseId: string) {
  return supabasePatch<UserCourse>(
    `/rest/v1/user_courses?select=*&user_id=eq.${encodeURIComponent(userId)}&course_id=eq.${encodeURIComponent(courseId)}`,
    { is_completed: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  );
}

export async function getUserCourses(userId: string) {
  return supabaseGet<unknown[]>(
    `/rest/v1/user_courses?select=*,course:courses(*)&user_id=eq.${encodeURIComponent(userId)}`
  );
}

export async function getUserQuizResults(userId: string, quizId: string) {
  return supabaseGet<UserQuizResult[]>(
    `/rest/v1/user_quiz_results?select=*&user_id=eq.${encodeURIComponent(userId)}&quiz_id=eq.${encodeURIComponent(quizId)}&order=created_at.desc`
  );
}

export async function getLatestQuizResult(userId: string, quizId: string) {
  try {
    const data = await supabaseGet<UserQuizResult[]>(
      `/rest/v1/user_quiz_results?select=*&user_id=eq.${encodeURIComponent(userId)}&quiz_id=eq.${encodeURIComponent(quizId)}&order=created_at.desc&limit=1`
    );
    return data?.[0] || null;
  } catch {
    return null;
  }
}

export async function saveCourseDuration(userId: string, courseId: string, total_duration_seconds: number) {
  return supabasePatch<UserCourse>(
    `/rest/v1/user_courses?select=*&user_id=eq.${encodeURIComponent(userId)}&course_id=eq.${encodeURIComponent(courseId)}`,
    { total_duration_seconds }
  );
}
