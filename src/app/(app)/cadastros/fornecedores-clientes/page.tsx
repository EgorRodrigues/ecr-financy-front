"use client";

import { useEffect, useState, startTransition, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useSort } from "@/hooks/use-sort";
import { ArrowUpDown, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getContacts,
  deleteContact,
  type Contact,
} from "@/lib/api";
import { ContactSheet } from "@/components/app/contact-sheet";

export default function CadastroFornecedoresClientesPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);

  function loadContacts() {
    getContacts()
      .then((list) => startTransition(() => setItems(list)))
      .catch(() => {});
  }

  useEffect(() => {
    loadContacts();
  }, []);

  function openNew() {
    setSelected(null);
    setSheetOpen(true);
  }

  function openEdit(id: string) {
    const contact = items.find((i) => i.id === id) || null;
    setSelected(contact);
    setSheetOpen(true);
  }

  async function remove(id: string) {
    const ok =
      typeof window !== "undefined" ? window.confirm("Excluir?") : true;
    if (!ok) return;
    await deleteContact(id);
    loadContacts();
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

  const displayItems = useMemo(() => {
    return items.map((i) => ({
      ...i,
      displayType: i.type === "supplier" ? "Fornecedor" : "Cliente",
      displayPersonType: i.person_type === "individual" ? "Física" : "Jurídica",
      displayDocument:
        i.person_type === "individual"
          ? formatCPF(i.document || "")
          : formatCNPJ(i.document || ""),
      displayActive: i.active ? "Sim" : "Não",
    }));
  }, [items]);

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Fornecedores e Clientes</h2>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
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
                  onClick={() => requestSort("name")}
                >
                  Nome{" "}
                  {sortConfig?.key === "name" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("displayDocument")}
                >
                  CPF/CNPJ{" "}
                  {sortConfig?.key === "displayDocument" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Telefone</th>
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
                  <td className="p-2">{item.displayType}</td>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.displayDocument}</td>
                  <td className="p-2">{item.email || "-"}</td>
                  <td className="p-2">{item.phone_local || "-"}</td>
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
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    Nenhum contato cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ContactSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={loadContacts}
        initialData={selected}
      />
    </div>
  );
}
