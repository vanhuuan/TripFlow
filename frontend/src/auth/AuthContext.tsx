import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, login as loginRequest, signup as signupRequest, type AuthResponse, type CurrentUser } from "../api/auth";
import { apiClient, setAuthToken } from "../api/client";

const storageKey = "tripflow.auth";

type StoredAuth = {
  token: string;
  expiresAt: string;
  user: CurrentUser;
};

type AuthContextValue = {
  user: CurrentUser | null;
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): StoredAuth | null {
  const rawAuth = window.localStorage.getItem(storageKey);
  if (!rawAuth) {
    return null;
  }

  try {
    const parsedAuth = JSON.parse(rawAuth) as StoredAuth;
    if (!parsedAuth.token || !parsedAuth.expiresAt || !parsedAuth.user) {
      return null;
    }

    if (new Date(parsedAuth.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return parsedAuth;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

function saveAuth(auth: AuthResponse) {
  window.localStorage.setItem(storageKey, JSON.stringify(auth));
  setAuthToken(auth.token);
}

function clearAuth() {
  window.localStorage.removeItem(storageKey);
  setAuthToken(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => readStoredAuth()?.token ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(() => readStoredAuth()?.expiresAt ?? null);
  const [user, setUser] = useState<CurrentUser | null>(() => readStoredAuth()?.user ?? null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuth = useCallback((auth: AuthResponse) => {
    saveAuth(auth);
    setToken(auth.token);
    setExpiresAt(auth.expiresAt);
    setUser(auth.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setExpiresAt(null);
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const storedAuth = readStoredAuth();
    if (!storedAuth) {
      clearAuth();
      setIsLoading(false);
      return;
    }

    setAuthToken(storedAuth.token);
    setToken(storedAuth.token);
    setExpiresAt(storedAuth.expiresAt);
    setUser(storedAuth.user);

    getCurrentUser()
      .then((currentUser) => {
        const refreshedAuth = { ...storedAuth, user: currentUser };
        window.localStorage.setItem(storageKey, JSON.stringify(refreshedAuth));
        setUser(currentUser);
      })
      .catch(() => {
        clearAuth();
        setToken(null);
        setExpiresAt(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (typeof error === "object" && error !== null && "response" in error) {
          const response = (error as { response?: { status?: number; config?: { url?: string } } }).response;
          if (response?.status === 401 && response.config?.url === "/api/auth/me") {
            clearAuth();
            setToken(null);
            setExpiresAt(null);
            setUser(null);
          }
        }

        return Promise.reject(error);
      },
    );

    return () => apiClient.interceptors.response.eject(interceptorId);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const auth = await loginRequest({ email, password });
      applyAuth(auth);
    },
    [applyAuth],
  );

  const signup = useCallback(
    async (displayName: string, email: string, password: string) => {
      const auth = await signupRequest({ displayName, email, password });
      applyAuth(auth);
    },
    [applyAuth],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      expiresAt,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      signup,
      logout,
    }),
    [expiresAt, isLoading, login, logout, signup, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
