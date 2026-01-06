"use client";

import { useEffect, useState, startTransition, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useSort } from "@/hooks/use-sort";
import { ArrowUpDown, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCategories,
  getAllSubcategories,
  deleteSubcategory,
} from "@/lib/api";
import { SubcategorySheet } from "@/components/financeiro/subcategory-sheet";

type Category = { id: string; name: string };

export default function CadastroSubcategoriaPage() {
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      active?: boolean;
      category_id?: string;
    }>
  >([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    description?: string;
    active?: boolean;
    category_id?: string;
  } | null>(null);

  function loadData() {
    getCategories()
      .then((list) => startTransition(() => setCategorias(list)))
      .catch(() => {});
    getAllSubcategories()
      .then((list) => startTransition(() => setItems(list)))
      .catch(() => {});
  }

  useEffect(() => {
    loadData();
  }, []);

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
    const rec = items.find((i) => i.id === id);
    const catId = rec?.category_id || "";
    await deleteSubcategory(catId, id);
    loadData();
  }

  const displayItems = useMemo(() => {
    return items.map((i) => {
      const cat = categorias.find((c) => c.id === i.category_id);
      return {
        ...i,
        displayCategory: cat ? cat.name : "-",
        displayActive: i.active ? "Sim" : "Não",
      };
    });
  }, [items, categorias]);

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Subcategoria</h2>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Subcategoria
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
                  onClick={() => requestSort("displayCategory")}
                >
                  Categoria{" "}
                  {sortConfig?.key === "displayCategory" && (
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
                  <td className="p-2">{item.displayCategory}</td>
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
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    Nenhuma subcategoria cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <SubcategorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={loadData}
        initialData={selected}
      />
    </div>
  );
}
