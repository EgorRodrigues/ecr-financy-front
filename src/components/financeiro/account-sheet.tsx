"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { createAccount, updateAccount, type Account } from "@/lib/api";

const formSchema = z.object({
  nome: z.string().min(1, "Informe o nome da conta"),
  tipo: z.enum(["bank", "credit_card", "wallet"]),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  numeroCartao: z.string().optional(),
  saldoInicial: z.number().optional(),
  limiteDisponivel: z.number().optional(),
  diaFechamento: z.number().min(1).max(31).optional(),
  diaVencimento: z.number().min(1).max(31).optional(),
  ativo: z.boolean(),
});

type AccountSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: Account | null;
};

export function AccountSheet({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: AccountSheetProps) {
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "bank",
      agencia: "",
      conta: "",
      numeroCartao: "",
      saldoInicial: 0,
      limiteDisponivel: 0,
      diaFechamento: undefined,
      diaVencimento: undefined,
      ativo: true,
    },
  });

  const tipo = useWatch({ control: form.control, name: "tipo" });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.name,
        tipo: initialData.type as "bank" | "credit_card" | "wallet",
        agencia: initialData.agency || "",
        conta: initialData.account || "",
        numeroCartao: formatCard(initialData.card_number || ""),
        saldoInicial: initialData.initial_balance || 0,
        limiteDisponivel: initialData.available_limit || 0,
        diaFechamento: initialData.closing_day || undefined,
        diaVencimento: initialData.due_day || undefined,
        ativo: initialData.active ?? true,
      });
    } else {
      form.reset({
        nome: "",
        tipo: "bank",
        agencia: "",
        conta: "",
        numeroCartao: "",
        saldoInicial: 0,
        limiteDisponivel: 0,
        diaFechamento: undefined,
        diaVencimento: undefined,
        ativo: true,
      });
    }
  }, [initialData, form]);

  function formatCard(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSalvando(true);
    setMensagem(null);
    try {
      const payload = {
        name: values.nome.trim(),
        type: values.tipo,
        agency: values.tipo === "bank" ? values.agencia : undefined,
        account: values.tipo === "bank" ? values.conta : undefined,
        card_number:
          values.tipo === "credit_card"
            ? values.numeroCartao?.replace(/\D/g, "")
            : undefined,
        initial_balance: values.saldoInicial,
        available_limit:
          values.tipo === "credit_card" ? values.limiteDisponivel : undefined,
        closing_day:
          values.tipo === "credit_card" ? values.diaFechamento : undefined,
        due_day: values.tipo === "credit_card" ? values.diaVencimento : undefined,
        active: values.ativo,
      };

      if (initialData?.id) {
        await updateAccount(initialData.id, payload);
      } else {
        await createAccount(payload);
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setMensagem("Falha ao salvar conta");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? "Editar Conta" : "Nova Conta"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {mensagem && (
              <div className="text-sm text-red-600 font-medium">{mensagem}</div>
            )}

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <SelectItem value="bank">Banco</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="wallet">Carteira</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipo === "bank" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="agencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agência</FormLabel>
                      <FormControl>
                        <Input placeholder="0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta</FormLabel>
                      <FormControl>
                        <Input placeholder="12345-6" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {tipo === "credit_card" && (
              <>
                <FormField
                  control={form.control}
                  name="numeroCartao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Cartão</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0000 0000 0000 0000"
                          {...field}
                          onChange={(e) => {
                            field.onChange(formatCard(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="limiteDisponivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite Disponível</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="diaFechamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia Fechamento</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            placeholder="Ex: 10"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? undefined : Number(val));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diaVencimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia Vencimento</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            placeholder="Ex: 20"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? undefined : Number(val));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="saldoInicial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ativo</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "true")}
                    value={field.value ? "true" : "false"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
