"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  login as apiLogin,
  getMe,
  setAuthToken,
  refreshAuthToken,
  getAccessTokenExpMs,
  LoginInput,
  User,
} from "@/lib/api";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => void;
  setToken: (token: string) => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      let localToken: string | null = null;
      try {
        localToken = localStorage.getItem("accessToken");
      } catch {
        localToken = null;
      }

      if (!localToken) {
        try {
          localToken = await refreshAuthToken();
        } catch {
          localToken = null;
        }
      }

      if (localToken) {
        setAuthToken(localToken);
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          console.error("Failed to load user", error);
          setAuthToken(null);
          setUser(null);
        }
      }

      setTokenState(localToken);
      setIsLoading(false);
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onTokenChanged = (e: Event) => {
      const custom = e as CustomEvent<string | null>;
      setTokenState(custom.detail ?? null);
    };
    const onSessionExpired = () => {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      setAuthToken(null);
      setUser(null);
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    };

    window.addEventListener("auth:token-changed", onTokenChanged as EventListener);
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => {
      window.removeEventListener("auth:token-changed", onTokenChanged as EventListener);
      window.removeEventListener("auth:session-expired", onSessionExpired);
    };
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const expMs = getAccessTokenExpMs();
    if (!expMs) return;

    const refreshAheadMs = 60_000;
    const delayMs = Math.max(0, expMs - Date.now() - refreshAheadMs);

    const timer = window.setTimeout(async () => {
      try {
        await refreshAuthToken();
      } catch (err) {
        // Se o refresh proativo falhar (ex: erro de rede), não deslogamos forçadamente.
        // Deixamos o token expirar e o interceptor do apiFetch tentará novamente.
        console.warn("Proactive refresh failed", err);
      }
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [token]);

  async function signIn(input: LoginInput) {
    try {
      const { token } = await apiLogin(input);
      setAuthToken(token);
      const userData = await getMe();
      setUser(userData);
      router.push("/financeiro");
    } catch (error) {
      throw error;
    }
  }

  function signOut() {
    setAuthToken(null);
    setUser(null);
    router.push("/login");
  }

  function setToken(token: string) {
    setAuthToken(token);
    getMe()
      .then((userData) => {
        setUser(userData);
        router.push("/");
      })
      .catch((error) => {
        console.error("Failed to load user after setting token", error);
        signOut();
      });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
