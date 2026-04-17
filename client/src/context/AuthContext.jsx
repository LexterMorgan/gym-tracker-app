import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, clearAuthToken, flushQueuedMutations, getAuthToken, setAuthToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("gym-auth-expired", onExpired);
    return () => window.removeEventListener("gym-auth-expired", onExpired);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    flushQueuedMutations().catch(() => null);
    const onOnline = () => flushQueuedMutations().catch(() => null);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [user]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    setAuthToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async ({ email, password, displayName }) => {
    const data = await authApi.register({ email, password, displayName });
    setAuthToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const data = await authApi.google({ credential });
    setAuthToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      googleLogin,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, googleLogin, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
