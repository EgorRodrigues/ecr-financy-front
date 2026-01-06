"use client";

import { useState, useEffect, startTransition } from "react";
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
import { createSubcategory, updateSubcategory, getCategories } from "@/lib/api";

const formSchema = z.object({
  nome: z.string().min(1, "Informe o nome da subcategoria"),
  descricao: z.string().optional(),
  categoriaId: z.string().min(1, "Selecione uma categoria pai"),
  ativo: z.boolean(),
});

type SubcategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultCategoryId?: string;
  initialData?: { id: string; name: string; description?: string; active?: boolean; category_id?: string } | null;
};

export function SubcategorySheet({
  open,
  onOpenChange,
  onSuccess,
  defaultCategoryId,
  initialData,
}: SubcategorySheetProps) {
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      categoriaId: defaultCategoryId || "",
      ativo: true,
    },
  });

  useEffect(() => {
    if (open) {
      getCategories()
        .then((list) => startTransition(() => setCategories(list)))
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.name,
        descricao: initialData.description || "",
        categoriaId: initialData.category_id || defaultCategoryId || "",
        ativo: initialData.active ?? true,
      });
    } else {
      form.reset({
        nome: "",
        descricao: "",
        categoriaId: defaultCategoryId || "",
        ativo: true,
      });
    }
  }, [initialData, defaultCategoryId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSalvando(true);
    setMensagem(null);
    try {
      if (initialData?.id && initialData.category_id) {
        await updateSubcategory(initialData.category_id, initialData.id, {
          name: values.nome.trim(),
          description: values.descricao || undefined,
          active: values.ativo,
          category_id: values.categoriaId,
        });
      } else {
        await createSubcategory({
          name: values.nome.trim(),
          description: values.descricao || undefined,
          active: values.ativo,
          category_id: values.categoriaId,
        });
      }

      form.reset({
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
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? "Editar Subcategoria" : "Nova Subcategoria"}</SheetTitle>
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
                    <Input placeholder="Ex: Combustível" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoriaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria Pai</FormLabel>
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
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
