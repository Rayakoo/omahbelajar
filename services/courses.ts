import { getSupabase, getAccessToken, getValidToken } from "@/lib/supabaseClient";

// ── Categories & Levels ──────────────────────────────────────
export type Category = { id: string; name: string; slug: string };
export type EducationLevel = { id: string; name: string; slug: string };

export async function getCategories() {
  const { data, error } = await getSupabase().from("categories").select("*");
  if (error) throw error;
  return data as Category[];
}

export async function getEducationLevels() {
  const { data, error } = await getSupabase().from("education_levels").select("*");
  if (error) throw error;
  return data as EducationLevel[];
}

// ── Courses ──────────────────────────────────────────────────
export type Course = {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  education_level_id: string;
  thumbnail_url: string | null;
  is_published: boolean;
  jumlah_isi: number;
  course_type: "self_paced" | "interactive" | "unsolved_case";
  created_at: string;
};

export const COURSE_TYPE_LABELS: Record<string, string> = {
  self_paced: "Self Paced",
  interactive: "Interactive",
  unsolved_case: "Unsolved Case",
};

export type CourseWithRelations = Course & {
  category: Category;
  education_level: EducationLevel;
};

export async function getCourses() {
  const { data, error } = await getSupabase()
    .from("courses")
    .select("*, category:categories(*), education_level:education_levels(*)")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as CourseWithRelations[];
}

export async function getCoursesByCategory(categorySlug: string) {
  const { data, error } = await getSupabase()
    .from("courses")
    .select("*, category:categories(*), education_level:education_levels(*)")
    .eq("category.slug", categorySlug)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as CourseWithRelations[];
}

export async function getCourseById(id: string) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/courses?id=eq.${id}&select=*,category:categories(*),education_level:education_levels(*)`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase GET failed: ${res.status} ${errText}`);
  }
  const data: CourseWithRelations[] = await res.json();
  if (!data || data.length === 0) throw new Error("Course not found");
  return data[0];
}

export type CreateCourseInput = {
  title: string;
  description?: string;
  category_id: string;
  education_level_id: string;
  course_type?: "self_paced" | "interactive" | "unsolved_case";
  thumbnail_url?: string;
  is_published?: boolean;
};

export async function createCourse(input: CreateCourseInput) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/courses?select=*,category:categories(*),education_level:education_levels(*)`,
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
  const data: CourseWithRelations[] = await res.json();
  if (!data || data.length === 0) throw new Error("No data returned");
  return data[0];
}

export async function updateCourse(
  id: string,
  updates: Partial<Pick<Course, "title" | "description" | "category_id" | "education_level_id" | "course_type" | "thumbnail_url" | "is_published">>
) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/courses?id=eq.${id}&select=*,category:categories(*),education_level:education_levels(*)`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(updates),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase PATCH failed: ${res.status} ${errText}`);
  }
  const data: CourseWithRelations[] = await res.json();
  if (!data || data.length === 0) throw new Error("No data returned");
  return data[0];
}

export async function deleteCourse(id: string) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/courses?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase delete failed: ${res.status} ${errText}`);
  }
}

// ── Course Videos ────────────────────────────────────────────
export type CourseVideo = {
  id: string;
  course_id: string;
  title: string;
  video_url: string;
  urutan: number;
  created_at: string;
};

export async function getCourseVideos(courseId: string) {
  const { data, error } = await getSupabase()
    .from("course_videos")
    .select("*")
    .eq("course_id", courseId)
    .order("urutan", { ascending: true });

  if (error) throw error;
  return data as CourseVideo[];
}

export async function createCourseVideo(input: {
  course_id: string;
  title: string;
  video_url: string;
  urutan?: number;
}) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_videos?select=*`,
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
  const data: CourseVideo[] = await res.json();
  if (!data || data.length === 0) throw new Error("No data returned");
  return data[0];
}

export async function updateCourseVideo(
  id: string,
  updates: Partial<Pick<CourseVideo, "title" | "video_url" | "urutan">>
) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_videos?id=eq.${id}&select=*`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(updates),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase PATCH failed: ${res.status} ${errText}`);
  }
  const data: CourseVideo[] = await res.json();
  if (!data || data.length === 0) throw new Error("No data returned");
  return data[0];
}

export async function deleteCourseVideo(id: string) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_videos?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase DELETE failed: ${res.status} ${errText}`);
  }
}

// ── Course Materials ─────────────────────────────────────────
export type CourseMaterial = {
  id: string;
  course_id: string;
  title: string;
  content: string;
  file_url: string | null;
  urutan: number;
  created_at: string;
};

export async function getCourseMaterials(courseId: string) {
  const { data, error } = await getSupabase()
    .from("course_materials")
    .select("*")
    .eq("course_id", courseId)
    .order("urutan", { ascending: true });

  if (error) throw error;
  return data as CourseMaterial[];
}

export async function createCourseMaterial(input: {
  course_id: string;
  title: string;
  content: string;
  file_url?: string;
  urutan?: number;
}) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_materials?select=*`,
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
  const data: CourseMaterial[] = await res.json();
  if (!data || data.length === 0) throw new Error("No data returned");
  return data[0];
}

export async function updateCourseMaterial(
  id: string,
  updates: Partial<Pick<CourseMaterial, "title" | "content" | "file_url" | "urutan">>
) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_materials?id=eq.${id}&select=*`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(updates),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase PATCH failed: ${res.status} ${errText}`);
  }
  const data: CourseMaterial[] = await res.json();
  if (!data || data.length === 0) throw new Error("No data returned");
  return data[0];
}

export async function deleteCourseMaterial(id: string) {
  const token = await getValidToken().catch(() => getAccessToken());
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/course_materials?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase DELETE failed: ${res.status} ${errText}`);
  }
}

// ── Global urutan counter (jumlah_isi) ──────────────────────────
export async function getNextGlobalUrutanAndIncrement(courseId: string) {
  const token = await getValidToken().catch(() => getAccessToken());
  const getRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/courses?id=eq.${courseId}&select=jumlah_isi`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` } }
  );
  if (!getRes.ok) throw new Error(`Gagal membaca jumlah_isi: ${getRes.status}`);
  const rows = await getRes.json();
  const current = rows[0]?.jumlah_isi ?? 0;
  const next = current + 1;

  const patchRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/courses?id=eq.${courseId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jumlah_isi: next }),
    }
  );
  if (!patchRes.ok) throw new Error(`Gagal increment jumlah_isi: ${patchRes.status}`);
  return next;
}

// ── Get full content of a course (all sections ordered by urutan) ──
export type CourseSection =
  | { type: "video"; data: CourseVideo }
  | { type: "materi"; data: CourseMaterial }
  | { type: "quiz"; data: { id: string; title: string; description: string | null; urutan: number } }
  | { type: "minigame"; data: { id: string; title: string; type: string; urutan: number } };

export async function getCourseSections(courseId: string) {
  const [videos, materials, quizzes, minigames] = await Promise.all([
    getCourseVideos(courseId),
    getCourseMaterials(courseId),
    getSupabase()
      .from("quizzes")
      .select("id, title, description, urutan")
      .eq("course_id", courseId)
      .order("urutan", { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    getSupabase()
      .from("course_minigames")
      .select("id, title, type, urutan")
      .eq("course_id", courseId)
      .order("urutan", { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
  ]);

  const sections: CourseSection[] = [
    ...videos.map((v) => ({ type: "video" as const, data: v })),
    ...materials.map((m) => ({ type: "materi" as const, data: m })),
    ...quizzes.map((q) => ({ type: "quiz" as const, data: q })),
    ...minigames.map((m) => ({ type: "minigame" as const, data: m })),
  ];

  sections.sort((a, b) => a.data.urutan - b.data.urutan);
  return sections;
}

// ── Stats & Counts ────────────────────────────────────────────
export type CourseStats = {
  totalCourses: number;
  totalPublished: number;
  totalDraft: number;
  totalModules: number;
  totalVideos: number;
  totalQuizzes: number;
};

export async function getCourseStats() {
  const supabase = getSupabase();
  const [coursesRes, videosRes, materialsRes, quizzesRes] = await Promise.all([
    supabase.from("courses").select("id"),
    supabase.from("course_videos").select("id, course_id"),
    supabase.from("course_materials").select("id, course_id"),
    supabase.from("quizzes").select("id, course_id"),
  ]);

  if (coursesRes.error) throw coursesRes.error;

  const totalCourses = coursesRes.data.length;
  const totalVideos = videosRes.data?.length ?? 0;
  const totalModules = materialsRes.data?.length ?? 0;
  const totalQuizzes = quizzesRes.data?.length ?? 0;

  const courseIdsWithContent = new Set([
    ...(videosRes.data ?? []).map((v) => v.course_id),
    ...(materialsRes.data ?? []).map((m) => m.course_id),
    ...(quizzesRes.data ?? []).map((q) => q.course_id),
  ]);

  const totalPublished = coursesRes.data.filter((c) => courseIdsWithContent.has(c.id)).length;
  const totalDraft = totalCourses - totalPublished;

  return { totalCourses, totalPublished, totalDraft, totalModules, totalVideos, totalQuizzes } satisfies CourseStats;
}

export type CourseWithCounts = CourseWithRelations & {
  videoCount: number;
  materialCount: number;
  quizCount: number;
  status: "Draft" | "Publish";
};

export async function getCoursesWithCounts() {
  const [courses, videosRes, materialsRes, quizzesRes] = await Promise.all([
    getCourses(),
    getSupabase().from("course_videos").select("course_id, id"),
    getSupabase().from("course_materials").select("course_id, id"),
    getSupabase().from("quizzes").select("course_id, id"),
  ]);

  const videoMap = new Map<string, number>();
  for (const v of videosRes.data ?? []) {
    videoMap.set(v.course_id, (videoMap.get(v.course_id) ?? 0) + 1);
  }
  const materialMap = new Map<string, number>();
  for (const m of materialsRes.data ?? []) {
    materialMap.set(m.course_id, (materialMap.get(m.course_id) ?? 0) + 1);
  }
  const quizMap = new Map<string, number>();
  for (const q of quizzesRes.data ?? []) {
    quizMap.set(q.course_id, (quizMap.get(q.course_id) ?? 0) + 1);
  }

  const result: CourseWithCounts[] = courses.map((c) => {
    const videoCount = videoMap.get(c.id) ?? 0;
    const materialCount = materialMap.get(c.id) ?? 0;
    const quizCount = quizMap.get(c.id) ?? 0;
    const hasContent = videoCount > 0 || materialCount > 0 || quizCount > 0;
    return {
      ...c,
      is_published: (c as any).is_published ?? false,
      videoCount,
      materialCount,
      quizCount,
      status: hasContent ? "Publish" : "Draft",
    };
  });

  return result;
}
