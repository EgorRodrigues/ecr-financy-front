"use client";

import {
  ArrowUpDown,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import { useEffect, useState, startTransition, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactSheet } from "@/components/app/contact-sheet";
import { PayableSheet } from "@/components/app/payable-sheet";
import { useSort } from "@/hooks/use-sort";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getExpenses,
  deleteExpense,
  getContacts,
  type ExpenseRecord,
  type Contact,
} from "@/lib/api";

type ExpenseItem = {
  id: string;
  fornecedor: string;
  contactId?: string;
  vencimento: string;
  valor: number;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
};

type BackendExpenseRecord = ExpenseRecord & { contact_name?: string };

export default function ContasPagasPage() {
  const [view, setView] = useState<"tabela" | "cards">("tabela");

  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [contactMap, setContactMap] = useState<Record<string, string>>({});
  const [, setContactsList] = useState<Contact[]>([]);
  const [payableSheetOpen, setPayableSheetOpen] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const dados = useMemo(() => {
    // Filtrar por mês E status 'pago'
    const filtered = records.filter((r) =>
      (r.due_date || "").startsWith(selectedMonth) && r.status === "pago"
    );
    return (filtered as BackendExpenseRecord[]).map((i) => ({
      id: i.id,
      fornecedor: i.contact_name || i.contact_id || "",
      contactId: i.contact_id,
      vencimento: i.due_date || "",
      valor: typeof i.amount === "number" ? i.amount : 0,
      status: (i.status as ExpenseItem["status"]) || "pendente",
    }));
  }, [records, selectedMonth]);

  const [selected, setSelected] = useState<ExpenseRecord | null>(null);

  const load = () => {
    getExpenses()
      .then((list) =>
        startTransition(() => {
          setRecords(list);
        })
      )
      .catch(() => {});
  };

  const monthlySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    records.forEach((r) => {
      // Considerar apenas pagas no resumo também, para consistência da página
      if (r.status === "pago") {
        const month = (r.due_date || "").slice(0, 7);
        if (month) {
          summary[month] = (summary[month] || 0) + (r.amount || 0);
        }
      }
    });

    return Object.entries(summary)
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort ascending
      .map(([month, total]) => ({ month, total }));
  }, [records]);

  const currentMonthTotal =
    monthlySummary.find((s) => s.month === selectedMonth)?.total || 0;

  const loadContacts = () => {
    getContacts()
      .then((list) =>
        startTransition(() => {
          const sorted = (list as Contact[]).sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setContactsList(sorted);
          const map: Record<string, string> = {};
          sorted.forEach((c) => {
            map[c.id] = c.name;
          });
          setContactMap(map);
        })
      )
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadContacts();
  }, []);

  function openNew() {
    setSelected(null);
    setPayableSheetOpen(true);
  }

  function openEdit(id: string) {
    const rec = records.find((r) => r.id === id) || null;
    setSelected(rec);
    setPayableSheetOpen(true);
  }

  async function remove(id: string) {
    const ok =
      typeof window !== "undefined" ? window.confirm("Excluir?") : true;
    if (!ok) return;
    await deleteExpense(id);
    load();
  }

  const displayData = useMemo(() => {
    return dados.map((d) => ({
      ...d,
      displayFornecedor: contactMap[d.contactId || ""] || d.fornecedor,
    }));
  }, [dados, contactMap]);

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayData);

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)]">
      <div className="flex-1 p-6 overflow-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Contas Pagas</h2>
          <div className="flex gap-2">
            <Button onClick={openNew}>
              Lançar Despesa
            </Button>
            <Button
              variant={view === "tabela" ? "default" : "outline"}
              onClick={() => setView("tabela")}
            >
              Tabela
            </Button>
            <Button
              variant={view === "cards" ? "default" : "outline"}
              onClick={() => setView("cards")}
            >
              Cards
            </Button>
          </div>
        </div>

        {view === "tabela" ? (
          <Card className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => requestSort("displayFornecedor")}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      Fornecedor{" "}
                      {sortConfig?.key === "displayFornecedor" && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("vencimento")}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      Vencimento{" "}
                      {sortConfig?.key === "vencimento" && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => requestSort("valor")}
                    >
                      Valor{" "}
                      {sortConfig?.key === "valor" && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("status")}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      Status{" "}
                      {sortConfig?.key === "status" && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-4 text-muted-foreground"
                      >
                        Nenhuma conta paga encontrada para este mês.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedItems.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.displayFornecedor}</TableCell>
                        <TableCell>
                          {d.vencimento
                            ? format(parseISO(d.vencimento), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {d.valor.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="text-emerald-600 font-medium">
                            {d.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(d.id)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(d.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {dados.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                Nenhuma conta paga encontrada para este mês.
              </div>
            ) : (
              sortedItems.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div className="font-medium truncate">
                        {d.displayFornecedor}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {d.vencimento
                          ? format(parseISO(d.vencimento), "dd/MM")
                          : "-"}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {d.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Status
                        </div>
                        <div className="text-emerald-600 text-sm font-medium">
                          {d.status}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(d.id)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(d.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 bg-background border-l p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período
          </h3>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        <div>
          <h3 className="font-semibold mb-4">Resumo Mensal (Pagas)</h3>
          <div className="space-y-4">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">
                Total Pago ({format(parseISO(selectedMonth + "-01"), "MMMM", { locale: ptBR })})
              </div>
              <div className="text-2xl font-bold text-primary">
                {currentMonthTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </Card>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Histórico
              </div>
              {monthlySummary.map((item) => (
                <div
                  key={item.month}
                  className={`flex justify-between items-center p-2 rounded text-sm ${
                    item.month === selectedMonth
                      ? "bg-muted font-medium"
                      : "hover:bg-muted/50 cursor-pointer"
                  }`}
                  onClick={() => setSelectedMonth(item.month)}
                >
                  <span>
                    {format(parseISO(item.month + "-01"), "MMMM yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                  <span>
                    {item.total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    <PayableSheet
      open={payableSheetOpen}
      onOpenChange={(v) => {
        setPayableSheetOpen(v);
        if (!v) setSelected(null);
      }}
      onSuccess={load}
      initialData={selected}
    />
      <ContactSheet
        open={contactSheetOpen}
        onOpenChange={setContactSheetOpen}
        onSuccess={loadContacts}
      />
    </div>
  );
}
