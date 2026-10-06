"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getProfile, signOut as authSignOut, onAuthStateChange, exchangeOAuthCode, handleImplicitFlow, type User, type Profile } from "@/services/auth";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  profileComplete: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  profileComplete: false,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setUser(u);
      if (u) {
        const p = await getProfile(u.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const p = await getProfile(user.id);
      setProfile(p);
    } catch {}
  }, [user]);

  useEffect(() => {
    // Cek OAuth redirect — handle ?code= (PKCE) dan #access_token= (Implicit)
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (hash && hash.includes("access_token=")) {
      // Implicit flow: simpan token ke localStorage, lalu bersihkan URL
      handleImplicitFlow();
    } else if (code) {
      // PKCE flow: tukar code jadi session
      exchangeOAuthCode(code).then(() => {
        router.replace(window.location.pathname);
      }).catch(() => {});
    }

    fetchUser().finally(() => setLoading(false));

    const sub = onAuthStateChange((u) => {
      setUser(u);
      if (u) {
        getProfile(u.id).then(setProfile).catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => sub?.subscription.unsubscribe();
  }, [fetchUser, router]);

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, profileComplete: !!profile && !!(profile.full_name?.trim() && profile.usia != null && profile.jenis_kelamin?.trim() && profile.tempat_tinggal?.trim()), loading, signOut, refreshUser: fetchUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
