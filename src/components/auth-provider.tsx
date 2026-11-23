"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getApi } from "@/lib/api";
import { readToken, setAccessToken } from "@/lib/api/token";
import type { AuthResult, Me } from "@/lib/api/types";
import { clearSession, clearSessionCookie, publishSessionCookie, readSession, sessionFromAuth, writeSession } from "@/lib/session";

interface AuthValue {
  user: Me | null;
  ready: boolean;
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: Me) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  const signIn = useCallback(async (result: AuthResult) => {
    const session = sessionFromAuth(result);
    writeSession(session);
    setUserState(result.user);
    await publishSessionCookie(result.refreshToken);
  }, []);

  const setUser = useCallback((next: Me) => {
    setUserState(next);
    const current = readSession();
    if (current) writeSession({ ...current, user: next });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await getApi().auth.logout();
    } catch {
      /* session may already be gone */
    }
    clearSession();
    setUserState(null);
    await clearSessionCookie();
  }, []);

  useEffect(() => {
    const stored = readSession();
    if (!stored) {
      // Session lives in localStorage, which only exists after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return;
    }
    setAccessToken(stored.accessToken);
    let expired = false;
    try {
      expired = readToken(stored.accessToken).exp * 1000 < Date.now();
    } catch {
      expired = true;
    }
    if (!expired) {
      setUserState(stored.user);
      setReady(true);
      return;
    }
    let cancelled = false;
    getApi()
      .auth.refresh({ refreshToken: stored.refreshToken })
      .then((result) => {
        if (!cancelled) return signIn(result);
        return undefined;
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setUserState(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [signIn]);

  const value = useMemo(() => ({ user, ready, signIn, signOut, setUser }), [user, ready, signIn, signOut, setUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}
