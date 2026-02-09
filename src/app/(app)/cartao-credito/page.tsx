"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Calendar, Pencil, Trash2, ArrowUpDown, Ban, History, ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAccounts,
  getCreditCardSummary,
  getCreditCardInvoices,
  deleteCreditCardTransaction,
  getCategories,
  Account,
  CreditCardTransactionRecord,
  Invoice,
} from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCardExpenseSheet } from "@/components/app/credit-card-expense-sheet";
import { useSort } from "@/hooks/use-sort";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { updateCreditCardInvoice, updateCreditCardTransaction } from "@/lib/api";

function InvoiceStatusBadge({ invoice }: { invoice: Invoice }) {
  const isPaid = invoice.status === "pago" || (invoice.amount > 0 && (invoice.total_paid || 0) >= invoice.amount);
  
  if (isPaid) {
    return <Badge variant="success" className="h-5 px-1.5 text-[10px]">Pago</Badge>;
  }
  
  if (invoice.status === "fechada") {
    return <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Fechada</Badge>;
  }

  return <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-blue-500 text-blue-500">Aberta</Badge>;
}

export default function CreditCardPage() {
  const [cards, setCards] = useState<Account[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [cardExpenses, setCardExpenses] = useState<
    CreditCardTransactionRecord[]
  >([]);
  const [cardSummary, setCardSummary] = useState<{
    total_limit: number;
    available_limit: number;
  } | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [nextInvoices, setNextInvoices] = useState<Invoice[]>([]);
  const [previousInvoices, setPreviousInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<CreditCardTransactionRecord | null>(null);
  const [invoicePaymentOpen, setInvoicePaymentOpen] = useState(false);
  const [expandedYears, setExpandedYears] = useState<string[]>([]);
  const [expandedNextYears, setExpandedNextYears] = useState<string[]>([]);

  const loadExpenses = useCallback(async (accountId: string) => {
    try {
      const [summary, invoices] = await Promise.all([
        getCreditCardSummary(accountId),
        getCreditCardInvoices({ account_id: accountId })
      ]);

      setCardExpenses(summary.transactions);
      setCardSummary({
        total_limit: summary.total_limit,
        available_limit: summary.available_limit,
      });
      setCurrentInvoice(summary.current_invoice || null);
      
      const next = (summary.next_invoices || []).sort(
        (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
      setNextInvoices(next);

      if (summary.current_invoice) {
        const currentId = summary.current_invoice.id;
        const nextIds = new Set(summary.next_invoices.map((i) => i.id));

        const previous = invoices
          .filter((i) => i.id !== currentId && !nextIds.has(i.id))
          .sort(
            (a, b) =>
              new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
          );

        setPreviousInvoices(previous);
      } else {
         const nextIds = new Set(summary.next_invoices.map((i) => i.id));
         const previous = invoices
          .filter((i) => !nextIds.has(i.id))
          .sort(
            (a, b) =>
              new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
          );
        setPreviousInvoices(previous);
      }

      setSelectedInvoiceId(summary.current_invoice?.id || null);
    } catch (error) {
      console.error("Failed to load expenses", error);
      setCardExpenses([]);
      setCardSummary(null);
      setCurrentInvoice(null);
      setNextInvoices([]);
      setPreviousInvoices([]);
      setSelectedInvoiceId(null);
    }
  }, []);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const creditCards = await getAccounts({ account_type: "credit_card" });
        setCards(creditCards);

        if (creditCards.length > 0) {
          setSelectedCardId(creditCards[0].id);
        }
      } catch (error) {
        console.error("Failed to load accounts", error);
      } finally {
        setLoading(false);
      }
    }

    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    }

    loadAccounts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCardId) {
      loadExpenses(selectedCardId);
    } else {
      setCardExpenses([]);
      setCardSummary(null);
      setCurrentInvoice(null);
      setNextInvoices([]);
      setPreviousInvoices([]);
      setSelectedInvoiceId(null);
    }
  }, [selectedCardId, loadExpenses]);

  useEffect(() => {
    if (!sheetOpen) {
      setEditingTransaction(null);
    }
  }, [sheetOpen]);

  function handleEdit(transaction: CreditCardTransactionRecord) {
    setEditingTransaction(transaction);
    setSheetOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      await deleteCreditCardTransaction(id);
      if (selectedCardId) loadExpenses(selectedCardId);
    } catch (error) {
      console.error("Failed to delete transaction", error);
    }
  }

  async function handleCancel(transaction: CreditCardTransactionRecord) {
    if (!confirm("Tem certeza que deseja cancelar esta transação?")) return;

    try {
      const { id, ...data } = transaction;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ...cleanData } = data;
      
      await updateCreditCardTransaction(id, {
        ...cleanData,
        status: "cancelado",
      });
      if (selectedCardId) loadExpenses(selectedCardId);
    } catch (error) {
      console.error("Failed to cancel transaction", error);
      alert("Erro ao cancelar transação");
    }
  }

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  // Calculate invoice data
  const currentInvoiceValue = currentInvoice?.amount || 0;
  const availableLimit =
    cardSummary?.available_limit || selectedCard?.available_limit || 0;
  const totalLimit =
    cardSummary?.total_limit ||
    (selectedCard?.initial_balance || 0) + availableLimit; // Fallback

  const filteredExpenses = selectedInvoiceId
    ? cardExpenses.filter((expense) => expense.invoice_id === selectedInvoiceId)
    : cardExpenses;

  const displayExpenses = useMemo(() => {
    return filteredExpenses.map((e) => {
      const cat = categories.find((c) => c.id === e.category_id);
      return {
        ...e,
        displayDate: e.issue_date,
        displayDescription: e.description,
        displayCategory: cat?.name || "-",
        displayAmount: e.amount,
      };
    });
  }, [filteredExpenses, categories]);

  const { items: sortedExpenses, requestSort, sortConfig } = useSort(displayExpenses);

  const selectedInvoice: Invoice | null = useMemo(() => {
    if (!currentInvoice && nextInvoices.length === 0 && previousInvoices.length === 0) return null;
    const all: Invoice[] = [];
    if (currentInvoice) all.push(currentInvoice);
    all.push(...nextInvoices);
    all.push(...previousInvoices);
    if (selectedInvoiceId) {
      const found = all.find((inv) => inv.id === selectedInvoiceId);
      if (found) return found;
    }
    return currentInvoice || null;
  }, [currentInvoice, nextInvoices, previousInvoices, selectedInvoiceId]);

  const groupedInvoices = useMemo(() => {
    const groups: Record<string, Invoice[]> = {};
    previousInvoices.forEach((invoice) => {
      const year = format(parseISO(invoice.due_date), "yyyy");
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(invoice);
    });
    return groups;
  }, [previousInvoices]);

  const toggleYear = (year: string) => {
    setExpandedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year]
    );
  };

  const groupedNextInvoices = useMemo(() => {
    const groups: Record<string, Invoice[]> = {};
    nextInvoices.forEach((invoice) => {
      const year = format(parseISO(invoice.due_date), "yyyy");
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(invoice);
    });
    return groups;
  }, [nextInvoices]);

  const toggleNextYear = (year: string) => {
    setExpandedNextYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year]
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">Despesas no Cartão</h1>
          <Button
            onClick={() => setSheetOpen(true)}
            disabled={!selectedCardId}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Lançar Despesa
          </Button>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">
            Selecione o Cartão
          </label>
          <Select value={selectedCardId} onValueChange={setSelectedCardId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Selecione um cartão" />
            </SelectTrigger>
            <SelectContent>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cards.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground mt-2">
              Nenhum cartão de crédito cadastrado.
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => requestSort("displayDate")}
                    >
                      Data{" "}
                      {sortConfig?.key === "displayDate" && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => requestSort("displayDescription")}
                    >
                      Descrição{" "}
                      {sortConfig?.key === "displayDescription" && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => requestSort("displayCategory")}
                    >
                      Categoria{" "}
                      {sortConfig?.key === "displayCategory" && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => requestSort("displayAmount")}
                    >
                      Valor{" "}
                      {sortConfig?.key === "displayAmount" && (
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      )}
                    </TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {selectedInvoiceId
                          ? "Nenhuma despesa nesta fatura."
                          : "Nenhuma despesa encontrada para este cartão."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedExpenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        className={
                          expense.status === "cancelado"
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        <TableCell>
                          {expense.issue_date
                            ? format(parseISO(expense.issue_date), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>
                          {categories.find((c) => c.id === expense.category_id)
                            ?.name ||
                            expense.category_id ||
                            "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(expense.amount)}
                        </TableCell>
                        <TableCell className="flex gap-2 justify-end no-underline">
                          {expense.status !== "cancelado" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(expense)}
                              title="Cancelar transação"
                            >
                              <Ban className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="w-full md:w-80 border-t md:border-l md:border-t-0 bg-muted/30 p-6">
        <h2 className="text-lg font-semibold mb-4">Resumo da Fatura</h2>

        {selectedCard ? (
          <div className="space-y-6">
            <Card
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedInvoiceId === currentInvoice?.id ? "border-primary ring-1 ring-primary" : ""}`}
              onClick={() =>
                currentInvoice && setSelectedInvoiceId(currentInvoice.id)
              }
            >
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Fatura Atual
                </div>
                <div className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(currentInvoiceValue)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Vence em{" "}
                  {currentInvoice?.due_date
                    ? format(
                        parseISO(currentInvoice.due_date),
                        "dd 'de' MMMM",
                        { locale: ptBR }
                      )
                    : "-"}
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              disabled={!selectedInvoice}
              onClick={() => setInvoicePaymentOpen(true)}
            >
              Registrar Pagamento da Fatura
            </Button>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">
                    Limite Disponível
                  </span>
                  <span className="font-medium text-green-600">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(availableLimit)}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${(availableLimit / (totalLimit || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Limite Total</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalLimit)}
                </span>
              </div>
            </div>

            <div className="mt-8">
              {previousInvoices.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Faturas Anteriores
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {Object.keys(groupedInvoices)
                      .sort((a, b) => Number(b) - Number(a))
                      .map((year) => (
                        <div key={year} className="mb-2">
                          <button
                            onClick={() => toggleYear(year)}
                            className="flex items-center w-full text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2"
                          >
                            {expandedYears.includes(year) ? (
                              <ChevronDown className="h-4 w-4 mr-1" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mr-1" />
                            )}
                            {year}
                          </button>

                          {expandedYears.includes(year) && (
                            <div className="space-y-2 pl-2 border-l-2 border-muted ml-1.5">
                              {groupedInvoices[year].map((invoice) => (
                                <div
                                  key={invoice.id}
                                  className={`flex justify-between items-center text-sm p-2 bg-background rounded border cursor-pointer transition-colors hover:bg-muted/50 ${selectedInvoiceId === invoice.id ? "border-primary ring-1 ring-primary" : ""}`}
                                  onClick={() => setSelectedInvoiceId(invoice.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="capitalize">
                                      {format(parseISO(invoice.due_date), "MMMM", {
                                        locale: ptBR,
                                      })}
                                    </span>
                                    <InvoiceStatusBadge invoice={invoice} />
                                  </div>
                                  <span className="text-muted-foreground">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(invoice.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximas Faturas
              </h3>
              <div className="space-y-3">
                {nextInvoices.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto pr-2">
                    {Object.keys(groupedNextInvoices)
                      .sort((a, b) => Number(a) - Number(b))
                      .map((year) => (
                        <div key={year} className="mb-2">
                          <button
                            onClick={() => toggleNextYear(year)}
                            className="flex items-center w-full text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2"
                          >
                            {expandedNextYears.includes(year) ? (
                              <ChevronDown className="h-4 w-4 mr-1" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mr-1" />
                            )}
                            {year}
                          </button>

                          {expandedNextYears.includes(year) && (
                            <div className="space-y-2 pl-2 border-l-2 border-muted ml-1.5">
                              {groupedNextInvoices[year].map((invoice) => (
                                <div
                                  key={invoice.id}
                                  className={`flex justify-between items-center text-sm p-2 bg-background rounded border cursor-pointer transition-colors hover:bg-muted/50 ${selectedInvoiceId === invoice.id ? "border-primary ring-1 ring-primary" : ""}`}
                                  onClick={() => setSelectedInvoiceId(invoice.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="capitalize">
                                      {format(parseISO(invoice.due_date), "MMMM", {
                                        locale: ptBR,
                                      })}
                                    </span>
                                    <InvoiceStatusBadge invoice={invoice} />
                                  </div>
                                  <span className="text-muted-foreground">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(invoice.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    Nenhuma fatura futura
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Selecione um cartão para ver os detalhes.
          </div>
        )}
      </div>

      <CreditCardExpenseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        cardId={selectedCardId}
        cardName={selectedCard?.name || ""}
        initialData={editingTransaction}
        onSuccess={() => {
          if (selectedCardId) loadExpenses(selectedCardId);
        }}
      />
      <InvoicePaymentSheet
        open={invoicePaymentOpen}
        onOpenChange={setInvoicePaymentOpen}
        invoice={selectedInvoice}
        onSuccess={() => {
          if (selectedCardId) loadExpenses(selectedCardId);
        }}
      />
    </div>
  );
}

type InvoicePaymentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSuccess: () => void;
};

function InvoicePaymentSheet({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: InvoicePaymentSheetProps) {
  const [saving, setSaving] = useState(false);
  const [paymentDate, setPaymentDate] = useState("");
  const [interest, setInterest] = useState(0);
  const [fine, setFine] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (open && invoice) {
      setPaymentDate(
        invoice.payment_date || new Date().toISOString().slice(0, 10)
      );
      setInterest(invoice.interest || 0);
      setFine(invoice.fine || 0);
      setDiscount(invoice.discount || 0);
    }
  }, [open, invoice]);

  const baseAmount = invoice?.amount || 0;
  const totalPaid = baseAmount + (interest || 0) + (fine || 0) - (discount || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    setSaving(true);
    try {
      await updateCreditCardInvoice(invoice.id, {
        payment_date: paymentDate,
        interest,
        fine,
        discount,
        total_paid: totalPaid,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update credit card invoice", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>Pagar Fatura</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {!invoice ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma fatura selecionada.
            </p>
          ) : (
            <>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Valor da Fatura</div>
                <div className="text-lg font-semibold">
                  {baseAmount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  Vencimento:{" "}
                  {invoice.due_date
                    ? format(parseISO(invoice.due_date), "dd/MM/yyyy")
                    : "-"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Data do Pagamento
                  </label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Total Pago
                  </label>
                  <CurrencyInput
                    value={totalPaid}
                    onValueChange={() => {}}
                    disabled
                    className="bg-muted font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Juros (+)
                  </label>
                  <CurrencyInput
                    value={interest}
                    onValueChange={setInterest}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Multa (+)
                  </label>
                  <CurrencyInput value={fine} onValueChange={setFine} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Desconto (-)
                  </label>
                  <CurrencyInput
                    value={discount}
                    onValueChange={setDiscount}
                  />
                </div>
              </div>
            </>
          )}
          <SheetFooter>
            <Button type="submit" disabled={!invoice || saving}>
              {saving ? "Salvando..." : "Confirmar Pagamento"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
