"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { createCategory } from "@/lib/api";

type CategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newId?: string) => void;
};

type FormState = {
  nome: string;
  descricao: string;
  ativo: boolean;
};

export function CategorySheet({
  open,
  onOpenChange,
  onSuccess,
}: CategorySheetProps) {
  const [form, setForm] = useState<FormState>({
    nome: "",
    descricao: "",
    ativo: true,
  });
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function salvar() {
    if (!form.nome || !form.nome.trim()) {
      setMensagem("Informe o nome da categoria");
      return;
    }
    setSalvando(true);
    (async () => {
      try {
        const result = await createCategory({
          name: form.nome.trim(),
          description: form.descricao || undefined,
          active: form.ativo,
        });

        setMensagem(null);
        setForm({
          nome: "",
          descricao: "",
          ativo: true,
        });
        // Assuming createCategory returns the created object or at least we can infer it was successful
        // If the API returns the created object with ID, we could pass it to onSuccess
        onSuccess?.(); 
        onOpenChange(false);
      } catch (error) {
        console.error(error);
        setMensagem("Falha ao salvar categoria");
      } finally {
        setSalvando(false);
      }
    })();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Categoria</SheetTitle>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          {mensagem && (
            <div className="text-sm text-red-600 font-medium">{mensagem}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              placeholder="Ex: Despesas Administrativas"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              value={form.descricao}
              onChange={(e) => update("descricao", e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="flex items-center gap-2">
             <label className="text-sm font-medium">Ativo?</label>
             <input 
                type="checkbox" 
                checked={form.ativo} 
                onChange={(e) => update("ativo", e.target.checked)}
                className="h-4 w-4"
             />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
