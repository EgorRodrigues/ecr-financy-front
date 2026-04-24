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
import { ReceivableSheet } from "@/components/app/receivable-sheet";
import { useSort } from "@/hooks/use-sort";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SidePanel } from "@/components/layout/side-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getIncomes,
  deleteIncome,
  getContacts,
  getAccounts,
  getCategories,
  getCostCenters,
  type IncomeRecord,
  type Contact,
  type Account,
} from "@/lib/api";

type Receivable = {
  id: string;
  cliente: string;
  contactId?: string;
  vencimento: string;
  valor: number;
  status: "pendente" | "recebido" | "atrasado" | "cancelado";
};

type BackendIncomeRecord = IncomeRecord & { contact_name?: string };

export default function ContasRecebidasPage() {
  const [view, setView] = useState<"tabela" | "cards">("tabela");

  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [contactMap, setContactMap] = useState<Record<string, string>>({});
  const [, setContactsList] = useState<Contact[]>([]);
  // Dependencies for filters or other logic if needed, currently used for loading
  const [, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [, setCostCenters] = useState<Array<{ id: string; name: string }>>([]);
  const [, setAccounts] = useState<Account[]>([]);
  
  const [receivableSheetOpen, setReceivableSheetOpen] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedReceivable, setSelectedReceivable] = useState<IncomeRecord | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const dados = useMemo(() => {
    // Filtrar por mês E status 'recebido'
    const filtered = records.filter((r) =>
      (r.due_date || "").startsWith(selectedMonth) && r.status === "recebido"
    );
    return (filtered as BackendIncomeRecord[]).map((i) => ({
      id: i.id,
      cliente: i.contact_name || i.contact_id || "",
      contactId: i.contact_id,
      vencimento: i.due_date || "",
      valor: typeof i.amount === "number" ? i.amount : 0,
      status: (i.status as Receivable["status"]) || "pendente",
    }));
  }, [records, selectedMonth]);

  const selectedTotal = useMemo(() => {
    return Array.from(selectedIds).reduce((acc, id) => {
      const item = dados.find((d) => d.id === id);
      return acc + (item?.valor || 0);
    }, 0);
  }, [selectedIds, dados]);

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === dados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(dados.map((d) => d.id)));
    }
  }

  const load = () => {
    getIncomes()
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
      // Considerar apenas recebidas no resumo também
      if (r.status === "recebido") {
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

    getCategories()
      .then((list) => startTransition(() => setCategories(list)))
      .catch(() => {});

    getCostCenters()
      .then((list) => startTransition(() => setCostCenters(list)))
      .catch(() => {});

    getAccounts()
      .then((list) => startTransition(() => setAccounts(list)))
      .catch(() => {});
    }, []);

  function openNew() {
    setSelectedReceivable(null);
    setReceivableSheetOpen(true);
  }

  function openEdit(id: string) {
    const rec = records.find((r) => r.id === id) || null;
    setSelectedReceivable(rec);
    setReceivableSheetOpen(true);
  }

  async function remove(id: string) {
    const ok =
      typeof window !== "undefined" ? window.confirm("Excluir?") : true;
    if (!ok) return;
    await deleteIncome(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    load();
  }

  const displayData = useMemo(() => {
    return dados.map((d) => ({
      ...d,
      displayCliente: contactMap[d.contactId || ""] || d.cliente,
    }));
  }, [dados, contactMap]);

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayData);

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] w-full max-w-full">
      <div className="flex-1 p-6 overflow-auto space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Contas Recebidas</h2>
          <div className="flex gap-2">
            <Button onClick={openNew}>
              Lançar Receita
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
                    <TableHead className="w-[40px]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={
                          dados.length > 0 && selectedIds.size === dados.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead
                      onClick={() => requestSort("displayCliente")}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      Cliente{" "}
                      {sortConfig?.key === "displayCliente" && (
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
                    <TableHead className="w-[140px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-4 text-muted-foreground"
                      >
                        Nenhuma conta recebida encontrada para este mês.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedItems.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={selectedIds.has(d.id)}
                            onChange={() => toggleSelect(d.id)}
                          />
                        </TableCell>
                        <TableCell>{d.displayCliente}</TableCell>
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
                {selectedIds.size > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-bold">
                        Selecionados: {selectedIds.size}
                      </TableCell>
                      <TableCell className="text-right font-bold" colSpan={1}>
                        Total Selecionado:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {selectedTotal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {dados.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                Nenhuma conta recebida encontrada para este mês.
              </div>
            ) : (
              sortedItems.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div className="font-medium truncate">
                        {d.displayCliente}
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

      <SidePanel>
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período
          </h3>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedIds(new Set());
            }}
          />
        </div>

        <div>
          <h3 className="font-semibold mb-4">Resumo Mensal (Recebidas)</h3>
          <div className="space-y-4">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">
                Total Recebido ({format(parseISO(selectedMonth + "-01"), "MMMM", { locale: ptBR })})
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
                  onClick={() => {
                    setSelectedMonth(item.month);
                    setSelectedIds(new Set());
                  }}
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
      </SidePanel>

      <ReceivableSheet
        open={receivableSheetOpen}
        onOpenChange={setReceivableSheetOpen}
        onSuccess={load}
        initialData={selectedReceivable}
      />
      <ContactSheet
        open={contactSheetOpen}
        onOpenChange={setContactSheetOpen}
        onSuccess={loadContacts}
      />
    </div>
  );
}
