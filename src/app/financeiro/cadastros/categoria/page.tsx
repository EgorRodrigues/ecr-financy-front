"use client";

import { useEffect, useState, startTransition, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCategories,
  deleteCategory,
} from "@/lib/api";
import { useSort } from "@/hooks/use-sort";
import { ArrowUpDown, Pencil, Trash2, Plus } from "lucide-react";
import { CategorySheet } from "@/components/financeiro/category-sheet";

export default function CadastroCategoriaPage() {
  const [items, setItems] = useState<
    Array<{ id: string; name: string; description?: string; active?: boolean }>
  >([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    description?: string;
    active?: boolean;
  } | null>(null);

  function loadCategories() {
    getCategories()
      .then((list) =>
        startTransition(() =>
          setItems(
            list.map((c) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              active: c.active,
            }))
          )
        )
      )
      .catch(() => {});
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const displayItems = useMemo(() => {
    return items.map((i) => ({
      ...i,
      displayActive: i.active ? "Sim" : "Não",
    }));
  }, [items]);

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems);

  function openNew() {
    setSelected(null);
    setSheetOpen(true);
  }

  function openEdit(id: string) {
    const rec = items.find((i) => i.id === id) || null;
    setSelected(rec);
    setSheetOpen(true);
  }

  async function remove(id: string) {
    const ok =
      typeof window !== "undefined" ? window.confirm("Excluir?") : true;
    if (!ok) return;
    await deleteCategory(id);
    loadCategories();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Categoria</h2>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("name")}
                >
                  Nome{" "}
                  {sortConfig?.key === "name" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("description")}
                >
                  Descrição{" "}
                  {sortConfig?.key === "description" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("displayActive")}
                >
                  Ativo{" "}
                  {sortConfig?.key === "displayActive" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.description}</td>
                  <td className="p-2">{item.displayActive}</td>
                  <td className="p-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(item.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => remove(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Nenhuma categoria cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CategorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={loadCategories}
        initialData={selected}
      />
    </div>
  );
}
