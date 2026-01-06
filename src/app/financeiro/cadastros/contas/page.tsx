"use client";

import { useEffect, useState, startTransition, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getAccounts,
  deleteAccount,
  type Account,
} from "@/lib/api";
import { useSort } from "@/hooks/use-sort";
import { ArrowUpDown, Pencil, Trash2, Plus } from "lucide-react";
import { AccountSheet } from "@/components/financeiro/account-sheet";

export default function CadastroContasPage() {
  const [items, setItems] = useState<Array<Account>>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  function loadAccounts() {
    getAccounts()
      .then((list) => startTransition(() => setItems(list)))
      .catch(() => {});
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const displayItems = useMemo(() => {
    return items.map((i) => {
      let displayType = i.type as string;
      if (i.type === "bank") displayType = "Banco";
      if (i.type === "credit_card") displayType = "Cartão de Crédito";
      if (i.type === "wallet") displayType = "Carteira";

      return {
        ...i,
        displayType,
        displayActive: i.active ? "Sim" : "Não",
      };
    });
  }, [items]);

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems);

  function openNew() {
    setSelectedAccount(null);
    setSheetOpen(true);
  }

  function openEdit(id: string) {
    const account = items.find((i) => i.id === id) || null;
    setSelectedAccount(account);
    setSheetOpen(true);
  }

  async function remove(id: string) {
    const ok =
      typeof window !== "undefined" ? window.confirm("Excluir?") : true;
    if (!ok) return;
    await deleteAccount(id);
    loadAccounts();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Contas</h2>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
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
                  onClick={() => requestSort("displayType")}
                >
                  Tipo{" "}
                  {sortConfig?.key === "displayType" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("agency")}
                >
                  Agência{" "}
                  {sortConfig?.key === "agency" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("account")}
                >
                  Conta{" "}
                  {sortConfig?.key === "account" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("card_number")}
                >
                  Cartão{" "}
                  {sortConfig?.key === "card_number" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("initial_balance")}
                >
                  Saldo Inicial{" "}
                  {sortConfig?.key === "initial_balance" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("available_limit")}
                >
                  Limite{" "}
                  {sortConfig?.key === "available_limit" && (
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
              {sortedItems.map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{i.displayType}</td>
                  <td className="p-2">{i.agency || "-"}</td>
                  <td className="p-2">{i.account || "-"}</td>
                  <td className="p-2">{i.card_number || "-"}</td>
                  <td className="p-2">
                    {typeof i.initial_balance === "number"
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(i.initial_balance || 0)
                      : "-"}
                  </td>
                  <td className="p-2">
                    {typeof i.available_limit === "number"
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(i.available_limit || 0)
                      : "-"}
                  </td>
                  <td className="p-2">{i.displayActive}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(i.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(i.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    className="p-2 text-center text-muted-foreground"
                    colSpan={9}
                  >
                    Nenhuma conta cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={loadAccounts}
        initialData={selectedAccount}
      />
    </div>
  );
}
