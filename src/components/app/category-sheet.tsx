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
import { createCategory, updateCategory } from "@/lib/api";

const formSchema = z.object({
  nome: z.string().min(1, "Informe o nome da categoria"),
  descricao: z.string().optional(),
  ativo: z.boolean(),
});

type CategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newId?: string) => void;
  initialData?: { id: string; name: string; description?: string; active?: boolean } | null;
};

export function CategorySheet({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: CategorySheetProps) {
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      ativo: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.name,
        descricao: initialData.description || "",
        ativo: initialData.active ?? true,
      });
    } else {
      form.reset({
        nome: "",
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
        await updateCategory(initialData.id, {
          name: values.nome.trim(),
          description: values.descricao || undefined,
          active: values.ativo,
        });
      } else {
        await createCategory({
          name: values.nome.trim(),
          description: values.descricao || undefined,
          active: values.ativo,
        });
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setMensagem("Falha ao salvar categoria");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? "Editar Categoria" : "Nova Categoria"}</SheetTitle>
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
                    <Input placeholder="Ex: Despesas Administrativas" {...field} />
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
