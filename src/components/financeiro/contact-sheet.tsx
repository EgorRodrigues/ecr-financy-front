"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createContact, updateContact, type Contact } from "@/lib/api";

const formSchema = z.object({
  tipo: z.enum(["fornecedor", "cliente"]),
  pessoa: z.enum(["fisica", "juridica"]),
  nome: z.string().min(1, "Informe o nome"),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().default(true),
});

type ContactSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultType?: "supplier" | "customer";
  initialData?: Contact | null;
};

export function ContactSheet({
  open,
  onOpenChange,
  onSuccess,
  defaultType = "supplier",
  initialData,
}: ContactSheetProps) {
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: defaultType === "supplier" ? "fornecedor" : ("cliente" as "fornecedor" | "cliente"),
      pessoa: "fisica" as "fisica" | "juridica",
      nome: "",
      cpf: "",
      cnpj: "",
      email: "",
      telefone: "",
      endereco: "",
      observacoes: "",
      ativo: true,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        tipo: initialData.type === "supplier" ? "fornecedor" : "cliente",
        pessoa: initialData.person_type === "individual" ? "fisica" : "juridica",
        nome: initialData.name,
        cpf: initialData.person_type === "individual" ? initialData.document || "" : "",
        cnpj: initialData.person_type === "company" ? initialData.document || "" : "",
        email: initialData.email || "",
        telefone: initialData.phone_local || "", // Prefer local phone for display if available
        endereco: initialData.address || "",
        observacoes: initialData.notes || "",
        ativo: initialData.active ?? true,
      });
    } else {
      form.reset({
        tipo: defaultType === "supplier" ? "fornecedor" : "cliente",
        pessoa: "fisica",
        nome: "",
        cpf: "",
        cnpj: "",
        email: "",
        telefone: "",
        endereco: "",
        observacoes: "",
        ativo: true,
      });
    }
  }, [initialData, defaultType, form]);

  const pessoa = form.watch("pessoa");
  const tipo = form.watch("tipo");

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSalvando(true);
    setMensagem(null);
    try {
      const onlyDigits = (s?: string) => (s || "").replace(/\D/g, "");
      const type = values.tipo === "fornecedor" ? "supplier" : "customer";
      const person_type = values.pessoa === "fisica" ? "individual" : "company";
      const document =
        values.pessoa === "fisica"
          ? onlyDigits(values.cpf)
          : onlyDigits(values.cnpj);
      const phoneLocal = values.telefone || "";
      const phoneE164 = phoneLocal.startsWith("+")
        ? `+${onlyDigits(phoneLocal)}`
        : undefined;

      if (initialData?.id) {
        await updateContact(initialData.id, {
          type,
          person_type,
          name: values.nome.trim(),
          document: document || undefined,
          email: values.email || undefined,
          phone_e164: phoneE164,
          phone_local: phoneLocal || undefined,
          address: values.endereco || undefined,
          notes: values.observacoes || undefined,
          active: values.ativo,
        });
      } else {
        await createContact({
          type,
          person_type,
          name: values.nome.trim(),
          document: document || undefined,
          email: values.email || undefined,
          phone_e164: phoneE164,
          phone_local: phoneLocal || undefined,
          address: values.endereco || undefined,
          notes: values.observacoes || undefined,
          active: values.ativo,
        });
      }

      form.reset({
          tipo: defaultType === "supplier" ? "fornecedor" : "cliente",
          pessoa: "fisica",
          nome: "",
          cpf: "",
          cnpj: "",
          email: "",
          telefone: "",
          endereco: "",
          observacoes: "",
          ativo: true,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch {
      setMensagem("Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {initialData
              ? `Editar ${tipo === "fornecedor" ? "Fornecedor" : "Cliente"}`
              : `Novo ${tipo === "fornecedor" ? "Fornecedor" : "Cliente"}`}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {mensagem && (
              <div className="text-sm text-red-600 font-medium">{mensagem}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pessoa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pessoa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fisica">Física</SelectItem>
                        <SelectItem value="juridica">Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo ou Razão Social" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {pessoa === "fisica" ? (
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          {...field}
                          onChange={(e) => field.onChange(formatCPF(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0000-00"
                          {...field}
                          onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Número, Bairro, Cidade - UF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas adicionais"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
