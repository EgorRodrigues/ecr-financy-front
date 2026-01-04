"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
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
  getExpenses,
  getIncomes,
  deleteExpense,
  deleteIncome,
  getCategories,
  Account,
  ExpenseRecord,
  IncomeRecord,
} from "@/lib/api";
import { format, parseISO, compareDesc } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PayableSheet } from "@/components/financeiro/payable-sheet";
import { ReceivableSheet } from "@/components/financeiro/receivable-sheet";

type Transaction = (ExpenseRecord | IncomeRecord) & {
  type: "expense" | "income";
};

export default function AccountStatementPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  
  // Sheets state
  const [payableSheetOpen, setPayableSheetOpen] = useState(false);
  const [receivableSheetOpen, setReceivableSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const loadTransactions = useCallback(async (accountId: string) => {
    if (!accountId) return;
    
    try {
      setLoading(true);
      const [expenses, incomes] = await Promise.all([
        getExpenses({ account: accountId, status: "pago" }),
        getIncomes({ account: accountId, status: "recebido" }),
      ]);

      const expenseList = expenses
        .map((e) => ({ ...e, type: "expense" as const }));
      const incomeList = incomes
        .map((i) => ({ ...i, type: "income" as const }));

      const combined = [...expenseList, ...incomeList].sort((a, b) => {
        // Use payment_date for sorting, fallback to issue_date if absolutely necessary, but ignore due_date
        const dateA = new Date(a.payment_date || a.issue_date || "");
        const dateB = new Date(b.payment_date || b.issue_date || "");
        
        const validDateA = isNaN(dateA.getTime()) ? new Date() : dateA;
        const validDateB = isNaN(dateB.getTime()) ? new Date() : dateB;
        return compareDesc(validDateA, validDateB);
      });

      setTransactions(combined);
    } catch (error) {
      console.error("Failed to load transactions", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const bankAccounts = await getAccounts({ account_type: "bank" });
        // Also fetch wallet accounts as they behave like bank accounts for statements
        const walletAccounts = await getAccounts({ account_type: "wallet" });
        
        const allAccounts = [...bankAccounts, ...walletAccounts];
        setAccounts(allAccounts);

        if (allAccounts.length > 0) {
          setSelectedAccountId(allAccounts[0].id);
        }
        
        const cats = await getCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Failed to load accounts", error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadTransactions(selectedAccountId);
    } else {
      setTransactions([]);
    }
  }, [selectedAccountId, loadTransactions]);

  useEffect(() => {
    if (!payableSheetOpen && !receivableSheetOpen) {
      setEditingTransaction(null);
    }
  }, [payableSheetOpen, receivableSheetOpen]);

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    if (transaction.type === "expense") {
      setPayableSheetOpen(true);
    } else {
      setReceivableSheetOpen(true);
    }
  }

  async function handleDelete(transaction: Transaction) {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      if (transaction.type === "expense") {
        await deleteExpense(transaction.id);
      } else {
        await deleteIncome(transaction.id);
      }
      if (selectedAccountId) loadTransactions(selectedAccountId);
    } catch (error) {
      console.error("Failed to delete transaction", error);
    }
  }

  const selectedAccount = accounts.find((c) => c.id === selectedAccountId);

  const currentBalance = useMemo(() => {
    if (!selectedAccount) return 0;

    const initialBalance = selectedAccount.initial_balance || 0;

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.total_received || 0), 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (t.total_paid || 0), 0);

    return initialBalance + totalIncome - totalExpense;
  }, [selectedAccount, transactions]);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">Extrato por Conta</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setReceivableSheetOpen(true)}
              disabled={!selectedAccountId}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Receita
            </Button>
            <Button
              onClick={() => setPayableSheetOpen(true)}
              disabled={!selectedAccountId}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Despesa
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">
            Selecione a Conta
          </label>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {accounts.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground mt-2">
              Nenhuma conta bancária cadastrada.
            </p>
          )}
        </div>

        {selectedAccount && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saldo Atual
                </CardTitle>
                <div className="h-4 w-4 text-muted-foreground">R$</div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  currentBalance >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(currentBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Saldo atual da conta
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => {
                    const categoryName =
                      categories.find((c) => c.id === transaction.category_id)
                        ?.name || "-";
                    
                    // Prefer payment_date, then issue_date. Ignore due_date for statement.
                    const dateStr = transaction.payment_date || transaction.issue_date;
                    const date = dateStr ? parseISO(dateStr) : new Date();

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(date, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{transaction.description || "-"}</TableCell>
                        <TableCell>{categoryName}</TableCell>
                        <TableCell className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                          {transaction.type === "expense" ? "-" : "+"}
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(transaction.type === "expense" ? (transaction.total_paid || 0) : (transaction.total_received || 0))}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'pago' || transaction.status === 'recebido' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'pendente'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(transaction)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <PayableSheet
        open={payableSheetOpen}
        onOpenChange={setPayableSheetOpen}
        onSuccess={() => selectedAccountId && loadTransactions(selectedAccountId)}
        initialData={editingTransaction?.type === 'expense' ? (editingTransaction as ExpenseRecord) : null}
        defaultAccountId={selectedAccountId}
      />
      
      <ReceivableSheet
        open={receivableSheetOpen}
        onOpenChange={setReceivableSheetOpen}
        onSuccess={() => selectedAccountId && loadTransactions(selectedAccountId)}
        initialData={editingTransaction?.type === 'income' ? (editingTransaction as IncomeRecord) : null}
        defaultAccountId={selectedAccountId}
      />
    </div>
  );
}
