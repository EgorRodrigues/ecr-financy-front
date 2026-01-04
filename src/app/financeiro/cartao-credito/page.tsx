"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Calendar, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  deleteCreditCardTransaction,
  getCategories,
  Account,
  CreditCardTransactionRecord,
  Invoice,
} from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCardExpenseSheet } from "@/components/financeiro/credit-card-expense-sheet";

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

  const loadExpenses = useCallback(async (accountId: string) => {
    try {
      const summary = await getCreditCardSummary(accountId);
      setCardExpenses(summary.transactions);
      setCardSummary({
        total_limit: summary.total_limit,
        available_limit: summary.available_limit,
      });
      setCurrentInvoice(summary.current_invoice || null);
      setNextInvoices(summary.next_invoices || []);
      setSelectedInvoiceId(summary.current_invoice?.id || null);
    } catch (error) {
      console.error("Failed to load expenses", error);
      setCardExpenses([]);
      setCardSummary(null);
      setCurrentInvoice(null);
      setNextInvoices([]);
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
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {selectedInvoiceId
                          ? "Nenhuma despesa nesta fatura."
                          : "Nenhuma despesa encontrada para este cartão."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
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
                        <TableCell className="flex gap-2 justify-end">
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
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximas Faturas
              </h3>
              <div className="space-y-3">
                {nextInvoices.length > 0 ? (
                  nextInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`flex justify-between text-sm p-2 bg-background rounded border cursor-pointer transition-colors hover:bg-muted/50 ${selectedInvoiceId === invoice.id ? "border-primary ring-1 ring-primary" : ""}`}
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                    >
                      <span className="capitalize">
                        {format(parseISO(invoice.due_date), "MMM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      <span className="text-muted-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(invoice.amount)}
                      </span>
                    </div>
                  ))
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
    </div>
  );
}
