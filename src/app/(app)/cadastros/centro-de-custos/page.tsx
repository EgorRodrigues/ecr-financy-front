"use client";

import { useEffect, useState, startTransition, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCostCenters,
  deleteCostCenter,
} from "@/lib/api";
import { useSort } from "@/hooks/use-sort";
import { ArrowUpDown, Pencil, Trash2, Plus } from "lucide-react";
import { CostCenterSheet } from "@/components/app/cost-center-sheet";

export default function CadastroCentroCustosPage() {
  const [items, setItems] = useState<
    Array<{ id: string; name: string; code?: string; active?: boolean }>
  >([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    code?: string;
    description?: string;
    active?: boolean;
  } | null>(null);

  function loadCostCenters() {
    getCostCenters()
      .then((list) => startTransition(() => setItems(list)))
      .catch(() => {});
  }

  useEffect(() => {
    loadCostCenters();
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
    // CostCenter type in API might differ slightly from local usage, ensuring fields match
    setSelected(
      rec
        ? {
            id: rec.id,
            name: rec.name,
            code: rec.code,
            active: rec.active,
            description: undefined, // Add description if API returns it, for now assuming basic fields
          }
        : null
    );
    setSheetOpen(true);
  }

  async function remove(id: string) {
    const ok =
      typeof window !== "undefined" ? window.confirm("Excluir?") : true;
    if (!ok) return;
    await deleteCostCenter(id);
    loadCostCenters();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Centro de Custos</h2>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Centro de Custos
        </Button>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("code")}
                >
                  Código{" "}
                  {sortConfig?.key === "code" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
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
                  <td className="p-2">{item.code}</td>
                  <td className="p-2">{item.name}</td>
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
                    Nenhum centro de custos cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CostCenterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={loadCostCenters}
        initialData={selected}
      />
    </div>
  );
}
