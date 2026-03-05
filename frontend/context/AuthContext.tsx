"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string;
  role: "student" | "admin";
  full_name: string | null;
  department: string | null;
  year: string | null;
  profile_complete: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  needsProfile: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  needsProfile: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Fetch profile in background — never awaited inside auth callbacks
  const syncProfile = useCallback((token: string) => {
    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${BACKEND_URL}/api/auth/me`, { headers, signal: controller.signal })
      .then((res) => {
        if (res.ok) return res.json();
        // Not found → register the user
        return fetch(`${BACKEND_URL}/api/auth/register`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          signal: controller.signal,
        }).then((r) => (r.ok ? r.json() : null));
      })
      .then((data) => { if (data) setProfile(data); })
      .catch(() => {}); // ignore abort / network errors

    return controller; // caller can .abort() if needed
  }, [BACKEND_URL]);

  // Exposed so the profile modal can refresh after update
  const refreshProfile = useCallback(() => {
    if (session?.access_token) {
      syncProfile(session.access_token);
    }
  }, [session, syncProfile]);

  useEffect(() => {
    let controller: AbortController | null = null;

    // 1. Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        controller = syncProfile(session.access_token);
      }
      setLoading(false); // ← unblocks UI immediately
    });

    // 2. React to future auth changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED…)
    //    NEVER await inside this callback — Supabase will deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      controller?.abort(); // cancel any in-flight profile fetch
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        controller = syncProfile(session.access_token);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      controller?.abort();
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const needsProfile = !!user && !!profile && !profile.profile_complete;

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin: profile?.role === "admin", needsProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
