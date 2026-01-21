"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ConfiguracoesPage() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return (
        ((typeof window !== "undefined" &&
          localStorage.getItem("financy_theme")) as "light" | "dark") || "light"
      );
    } catch {
      return "light";
    }
  });
  const [mode, setMode] = useState<"default-2" | "minimal-3">(() => {
    try {
      const cols =
        typeof window !== "undefined"
          ? localStorage.getItem("financy_form_cols")
          : null;
      const compact =
        typeof window !== "undefined"
          ? localStorage.getItem("financy_form_compact")
          : null;
      if (cols === "3" && compact === "true") return "minimal-3";
      return "default-2";
    } catch {
      return "default-2";
    }
  });

  function save() {
    try {
      localStorage.setItem("financy_theme", theme);
      if (mode === "minimal-3") {
        localStorage.setItem("financy_form_cols", "3");
        localStorage.setItem("financy_form_compact", "true");
      } else {
        localStorage.setItem("financy_form_cols", "2");
        localStorage.setItem("financy_form_compact", "false");
      }
      const html = document.documentElement;
      if (theme === "dark") html.classList.add("dark");
      else html.classList.remove("dark");
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Configurações</h2>
        <Button onClick={save}>Salvar</Button>
      </div>

      <Card className="p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs">Tema</div>
            <select
              className="bg-background h-9 w-full rounded-md border px-2 text-sm"
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark")}
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </div>
          <div>
            <div className="text-xs">Layout dos formulários</div>
            <select
              className="bg-background h-9 w-full rounded-md border px-2 text-sm"
              value={mode}
              onChange={(e) =>
                setMode(e.target.value as "default-2" | "minimal-3")
              }
            >
              <option value="default-2">Padrão (2 colunas)</option>
              <option value="minimal-3">Minimalista (3 colunas)</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
