"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { createContact } from "@/lib/api";

type ContactSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultType?: "supplier" | "customer";
};

type FormState = {
  tipo: "fornecedor" | "cliente";
  pessoa: "fisica" | "juridica";
  nome: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
  ativo: boolean;
};

export function ContactSheet({
  open,
  onOpenChange,
  onSuccess,
  defaultType = "supplier",
}: ContactSheetProps) {
  const [form, setForm] = useState<FormState>({
    tipo: defaultType === "supplier" ? "fornecedor" : "cliente",
    pessoa: "fisica",
    nome: "",
    ativo: true,
  });
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function formatCPF(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 9);
    const p4 = digits.slice(9, 11);
    if (digits.length <= 3) return p1;
    if (digits.length <= 6) return `${p1}.${p2}`;
    if (digits.length <= 9) return `${p1}.${p2}.${p3}`;
    return `${p1}.${p2}.${p3}-${p4}`;
  }

  function formatCNPJ(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    const p1 = digits.slice(0, 2);
    const p2 = digits.slice(2, 5);
    const p3 = digits.slice(5, 8);
    const p4 = digits.slice(8, 12);
    const p5 = digits.slice(12, 14);
    if (digits.length <= 2) return p1;
    if (digits.length <= 5) return `${p1}.${p2}`;
    if (digits.length <= 8) return `${p1}.${p2}.${p3}`;
    if (digits.length <= 12) return `${p1}.${p2}.${p3}/${p4}`;
    return `${p1}.${p2}.${p3}/${p4}-${p5}`;
  }

  function formatPhone(value: string) {
    const raw = value.replace(/\s+/g, "");
    const hasPlus = raw.startsWith("+");
    const digits = raw.replace(/\D/g, "").slice(0, 15);

    if (!digits) return hasPlus ? "+" : "";

    if (!hasPlus) {
      const ddd = digits.slice(0, 2);
      const pivot = digits.length >= 11 ? 7 : 6;
      const part1 = digits.slice(2, Math.min(pivot, digits.length));
      const part2 = digits.slice(pivot);
      if (!ddd) return digits;
      if (!part2) return `(${ddd}) ${part1}`;
      return `(${ddd}) ${part1}-${part2}`;
    }

    if (digits.length <= 3) {
      return `+${digits}`;
    }

    const maxNational = digits.length >= 13 ? 11 : 10;
    const ccLen = Math.min(Math.max(digits.length - maxNational, 1), 3);
    const cc = digits.slice(0, ccLen);
    const rest = digits.slice(ccLen);

    const area = rest.slice(0, 2);
    const pivot = rest.length >= 11 ? 7 : 6;
    const part1 = rest.slice(2, Math.min(pivot, rest.length));
    const part2 = rest.slice(pivot);

    if (rest.length <= 2) return `+${cc} (${area}`.replace(/\($/, "(");
    if (!part2) return `+${cc} (${area}) ${part1}`;
    return `+${cc} (${area}) ${part1}-${part2}`;
  }

  function salvar() {
    if (!form.nome || !form.nome.trim()) {
      setMensagem("Informe o nome");
      return;
    }
    setSalvando(true);
    (async () => {
      try {
        const onlyDigits = (s?: string) => (s || "").replace(/\D/g, "");
        const type = form.tipo === "fornecedor" ? "supplier" : "customer";
        const person_type = form.pessoa === "fisica" ? "individual" : "company";
        const document =
          form.pessoa === "fisica"
            ? onlyDigits(form.cpf)
            : onlyDigits(form.cnpj);
        const phoneLocal = form.telefone || "";
        const phoneE164 = phoneLocal.startsWith("+")
          ? `+${onlyDigits(phoneLocal)}`
          : undefined;

        await createContact({
          type,
          person_type,
          name: form.nome.trim(),
          document: document || undefined,
          email: form.email || undefined,
          phone_e164: phoneE164,
          phone_local: phoneLocal || undefined,
          address: form.endereco || undefined,
          notes: form.observacoes || undefined,
          active: form.ativo,
        });

        setMensagem(null);
        setForm({
          tipo: defaultType === "supplier" ? "fornecedor" : "cliente",
          pessoa: "fisica",
          nome: "",
          ativo: true,
        });
        onSuccess?.();
        onOpenChange(false);
      } catch {
        setMensagem("Falha ao salvar");
      } finally {
        setSalvando(false);
      }
    })();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Novo {form.tipo === "fornecedor" ? "Fornecedor" : "Cliente"}
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-1 gap-4 p-4 text-sm md:grid-cols-2">
          {mensagem && (
            <div className="col-span-2 text-xs text-red-600">{mensagem}</div>
          )}

          <div>
            <label className="text-xs">Tipo</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.tipo}
              onChange={(e) =>
                update("tipo", e.target.value as FormState["tipo"])
              }
            >
              <option value="fornecedor">Fornecedor</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>

          <div>
            <label className="text-xs">Pessoa</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.pessoa}
              onChange={(e) =>
                update("pessoa", e.target.value as FormState["pessoa"])
              }
            >
              <option value="fisica">Pessoa Física</option>
              <option value="juridica">Pessoa Jurídica</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs">Nome</label>
            <Input
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
            />
          </div>

          {form.pessoa === "fisica" && (
            <div>
              <label className="text-xs">CPF</label>
              <Input
                inputMode="numeric"
                value={form.cpf ?? ""}
                onChange={(e) => update("cpf", formatCPF(e.target.value))}
              />
            </div>
          )}

          {form.pessoa === "juridica" && (
            <div>
              <label className="text-xs">CNPJ</label>
              <Input
                inputMode="numeric"
                value={form.cnpj ?? ""}
                onChange={(e) => update("cnpj", formatCNPJ(e.target.value))}
              />
            </div>
          )}

          <div>
            <label className="text-xs">E-mail</label>
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs">Telefone</label>
            <Input
              inputMode="tel"
              value={form.telefone ?? ""}
              onChange={(e) => update("telefone", formatPhone(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs">Endereço</label>
            <Input
              value={form.endereco ?? ""}
              onChange={(e) => update("endereco", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs">Observações</label>
            <textarea
              className="bg-background h-24 w-full rounded-md border px-2 py-2 text-sm"
              value={form.observacoes ?? ""}
              onChange={(e) => update("observacoes", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs">Ativo</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.ativo ? "true" : "false"}
              onChange={(e) => update("ativo", e.target.value === "true")}
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
        </div>

        <SheetFooter>
          <div className="flex gap-2">
            <Button onClick={salvar} disabled={salvando || !form.nome.trim()}>
              Salvar
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
