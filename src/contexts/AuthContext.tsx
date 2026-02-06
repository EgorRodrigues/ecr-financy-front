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
  logout as apiLogout,
  getMe,
  setAuthSession,
  refreshAuthToken,
  getAccessTokenExpMs,
  decodeJwt,
  LoginInput,
  User,
} from "@/lib/api";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => void;
  setToken: (token: string, refreshToken?: string | null) => void;
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
      let localRefreshToken: string | null = null;
      try {
        localToken = localStorage.getItem("accessToken");
        localRefreshToken = localStorage.getItem("refreshToken");
      } catch {
        localToken = null;
        localRefreshToken = null;
      }

      if (!localToken) {
        try {
          localToken = await refreshAuthToken();
          localRefreshToken = localStorage.getItem("refreshToken");
        } catch {
          localToken = null;
        }
      }

      if (localToken) {
        setAuthSession(localToken, localRefreshToken);

        // Optimistically set user from token
        try {
          const payload = decodeJwt<{
            sub: string;
            name: string;
            email: string;
            // Support other common claims
            username?: string;
            given_name?: string;
            family_name?: string;
          }>(localToken);

          if (payload) {
            const name =
              payload.name ||
              payload.username ||
              (payload.given_name
                ? `${payload.given_name} ${payload.family_name || ""}`
                : "") ||
              payload.email ||
              "Usuário";
            
            setUser({
              id: payload.sub || "",
              name: name.trim(),
              email: payload.email || "",
            });
          } else {
            console.warn("AuthContext: Payload nulo após decodificação.");
          }
        } catch (e) {
          console.error("Error decoding token for optimistic user", e);
        }

        try {
          const userData = await getMe();
          if (userData) {
            setUser((prev) => {
              // Se não tínhamos dados anteriores, usamos o que veio da API
              if (!prev) return userData;

              // Fazemos o merge: preferência para dados da API, mas se estiverem faltando, usamos do token (prev)
              return {
                ...prev, // Mantém o que já tinha (ex: dados do token)
                ...userData, // Sobrescreve com dados da API
                // Garante que campos críticos não fiquem undefined se a API retornou vazio mas o token tinha
                name: userData.name || prev.name || "Usuário",
                email: userData.email || prev.email,
                avatar_url: userData.avatar_url || prev.avatar_url,
              };
            });
          }
        } catch (error) {
          console.error("Failed to load user", error);
          // Não forçamos logout aqui para evitar perda de sessão em erros de rede/servidor.
          // O apiFetch já trata 401 e limpa a sessão se necessário.
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
      setAuthSession(null, null);
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
      const { token, refreshToken } = await apiLogin(input);
      setAuthSession(token, refreshToken ?? null);

      // Decodificação otimista do token
      let optimisticUser: User | null = null;
      try {
        const payload = decodeJwt<{
          sub: string;
          name: string;
          email: string;
          username?: string;
          given_name?: string;
          family_name?: string;
        }>(token);

        if (payload) {
          const name =
            payload.name ||
            payload.username ||
            (payload.given_name
              ? `${payload.given_name} ${payload.family_name || ""}`
              : "") ||
            payload.email ||
            "Usuário";

          optimisticUser = {
            id: payload.sub || "",
            name: name.trim(),
            email: payload.email || "",
          };
          setUser(optimisticUser);
        }
      } catch (e) {
        console.error("Error decoding token in signIn", e);
      }

      try {
        const userData = await getMe();
        if (userData) {
          setUser((prev) => {
             // Merge com dados do token se API retornar incompleto
             const base = prev || optimisticUser;
             if (!base) return userData;

             return {
               ...base,
               ...userData,
               name: userData.name || base.name || "Usuário",
               email: userData.email || base.email,
               avatar_url: userData.avatar_url || base.avatar_url,
             };
          });
        }
      } catch (e) {
        console.warn("Failed to fetch full user profile in signIn, using optimistic data", e);
      }
      
      router.push("/");
    } catch (error) {
      throw error;
    }
  }

  async function signOut() {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await apiLogout(refreshToken);
      }
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      setAuthSession(null, null);
      setUser(null);
      router.push("/login");
    }
  }

  async function setToken(token: string, refreshToken?: string | null) {
    setAuthSession(token, refreshToken ?? null);
    
    // Decodificação otimista
    let optimisticUser: User | null = null;
    try {
        const payload = decodeJwt<{
          sub: string;
          name: string;
          email: string;
          username?: string;
          given_name?: string;
          family_name?: string;
        }>(token);

        if (payload) {
          const name =
            payload.name ||
            payload.username ||
            (payload.given_name
              ? `${payload.given_name} ${payload.family_name || ""}`
              : "") ||
            payload.email ||
            "Usuário";

          optimisticUser = {
            id: payload.sub || "",
            name: name.trim(),
            email: payload.email || "",
          };
          setUser(optimisticUser);
        }
    } catch (e) {
       console.error("Error decoding token in setToken", e);
    }

    try {
        const userData = await getMe();
        setUser((prev) => {
             const base = prev || optimisticUser;
             if (!base) return userData;

             return {
               ...base,
               ...userData,
               name: userData.name || base.name || "Usuário",
               email: userData.email || base.email,
               avatar_url: userData.avatar_url || base.avatar_url,
             };
        });
        router.push("/");
    } catch (error) {
        console.error("Failed to load user after setting token", error);
        if (!optimisticUser) {
            signOut();
        } else {
             // Se falhar a API mas temos token, permitimos (ou podemos decidir deslogar)
             // Neste caso, se o token é válido, melhor manter logado
             router.push("/");
        }
    }
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
