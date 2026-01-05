"use client";

import { useState, useEffect, startTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSubcategory, getCategories } from "@/lib/api";

type SubcategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultCategoryId?: string;
};

type FormState = {
  nome: string;
  descricao: string;
  categoriaId: string;
  ativo: boolean;
};

export function SubcategorySheet({
  open,
  onOpenChange,
  onSuccess,
  defaultCategoryId,
}: SubcategorySheetProps) {
  const [form, setForm] = useState<FormState>({
    nome: "",
    descricao: "",
    categoriaId: defaultCategoryId || "",
    ativo: true,
  });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      getCategories()
        .then((list) => startTransition(() => setCategories(list)))
        .catch(() => {});
        
      if (defaultCategoryId) {
        update("categoriaId", defaultCategoryId);
      }
    }
  }, [open, defaultCategoryId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function salvar() {
    if (!form.nome || !form.nome.trim()) {
      setMensagem("Informe o nome da subcategoria");
      return;
    }
    if (!form.categoriaId) {
        setMensagem("Selecione uma categoria pai");
        return;
    }

    setSalvando(true);
    (async () => {
      try {
        await createSubcategory({
          name: form.nome.trim(),
          description: form.descricao || undefined,
          active: form.ativo,
          category_id: form.categoriaId,
        });

        setMensagem(null);
        setForm({
          nome: "",
          descricao: "",
          categoriaId: defaultCategoryId || "",
          ativo: true,
        });
        onSuccess?.();
        onOpenChange(false);
      } catch (error) {
        console.error(error);
        setMensagem("Falha ao salvar subcategoria");
      } finally {
        setSalvando(false);
      }
    })();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Subcategoria</SheetTitle>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          {mensagem && (
            <div className="text-sm text-red-600 font-medium">{mensagem}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria Pai</label>
            <Select
                value={form.categoriaId}
                onValueChange={(v) => update("categoriaId", v)}
                disabled={!!defaultCategoryId} 
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              placeholder="Ex: Manutenção Predial"
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
