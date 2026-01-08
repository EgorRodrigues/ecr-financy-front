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
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("accessToken");
      if (token) {
        setAuthToken(token);
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          console.error("Failed to load user", error);
          setAuthToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }

    loadUser();
  }, []);

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
