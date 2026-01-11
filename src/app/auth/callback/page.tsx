"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setToken } = useAuth();
  const [status, setStatus] = useState("Autenticando...");

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");

    if (token) {
      // 1. Salvar no localStorage (redundante pois setToken faz isso, mas garante o requisito explícito)
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
      }
      
      // 2. Exibir mensagem de sucesso
      // Usamos setTimeout para evitar setState síncrono no useEffect
      setTimeout(() => {
        setStatus("Login realizado com sucesso!");
      }, 0);
      
      // 3. Aguardar um pouco para o usuário ver a mensagem antes de redirecionar
      const timer = setTimeout(() => {
        setToken(token, refreshToken);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      router.push("/login");
    }
  }, [searchParams, setToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{status}</h2>
        <p className="text-gray-500">Por favor, aguarde.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
