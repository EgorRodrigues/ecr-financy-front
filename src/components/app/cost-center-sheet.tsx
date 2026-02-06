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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createCostCenter, updateCostCenter } from "@/lib/api";

const formSchema = z.object({
  nome: z.string().min(1, "Informe o nome do centro de custo"),
  codigo: z.string().optional(),
  descricao: z.string().optional(),
  ativo: z.boolean(),
});

type CostCenterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: { id: string; name: string; code?: string; description?: string; active?: boolean } | null;
};

export function CostCenterSheet({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: CostCenterSheetProps) {
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      codigo: "",
      descricao: "",
      ativo: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.name,
        codigo: initialData.code || "",
        descricao: initialData.description || "",
        ativo: initialData.active ?? true,
      });
    } else {
      form.reset({
        nome: "",
        codigo: "",
        descricao: "",
        ativo: true,
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSalvando(true);
    setMensagem(null);
    try {
      if (initialData?.id) {
        await updateCostCenter(initialData.id, {
          name: values.nome.trim(),
          code: values.codigo || undefined,
          description: values.descricao || undefined,
          active: values.ativo,
        });
      } else {
        await createCostCenter({
          name: values.nome.trim(),
          code: values.codigo || undefined,
          description: values.descricao || undefined,
          active: values.ativo,
        });
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setMensagem("Falha ao salvar centro de custo");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? "Editar Centro de Custo" : "Novo Centro de Custo"}</SheetTitle>
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
                    <Input placeholder="Ex: Departamento de TI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição opcional"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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
