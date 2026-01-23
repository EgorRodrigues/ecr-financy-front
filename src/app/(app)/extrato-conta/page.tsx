"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
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
  getBankStatement,
  deleteExpense,
  deleteIncome,
  Account,
  BankStatementTransaction,
  ExpenseRecord,
  IncomeRecord,
} from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PayableSheet } from "@/components/app/payable-sheet";
import { ReceivableSheet } from "@/components/app/receivable-sheet";
import { useSort } from "@/hooks/use-sort";

export default function AccountStatementPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [transactions, setTransactions] = useState<BankStatementTransaction[]>([]);
  const { items: sortedTransactions, requestSort, sortConfig } = useSort(transactions);
  const [balanceInfo, setBalanceInfo] = useState({
    account_balance: 0,
    period_summary: {
      total_income: 0,
      total_expense: 0,
      net_result: 0,
    }
  });
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Sheets state
  const [payableSheetOpen, setPayableSheetOpen] = useState(false);
  const [receivableSheetOpen, setReceivableSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<BankStatementTransaction | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!selectedAccountId) return;
    
    try {
      const response = await getBankStatement({
        accounts: selectedAccountId === "all" ? undefined : [selectedAccountId],
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setTransactions(response.transactions);
      setBalanceInfo({
        account_balance: response.account_balance,
        period_summary: response.period_summary,
      });
    } catch (error) {
      console.error("Failed to load transactions", error);
      setTransactions([]);
    }
  }, [selectedAccountId, startDate, endDate]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const bankAccounts = await getAccounts({ account_type: "bank" });
        const walletAccounts = await getAccounts({ account_type: "wallet" });
        const allAccounts = [...bankAccounts, ...walletAccounts];
        setAccounts(allAccounts);

        if (allAccounts.length > 0) {
          setSelectedAccountId("all");
        }
      } catch (error) {
        console.error("Failed to load accounts", error);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    loadTransactions();
  }, [loadTransactions]);

  function handleEdit(transaction: BankStatementTransaction) {
    setEditingTransaction(transaction);
    if (transaction.type === "expense") {
      setPayableSheetOpen(true);
    } else {
      setReceivableSheetOpen(true);
    }
  }

  async function handleDelete(transaction: BankStatementTransaction) {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      if (transaction.type === "expense") {
        await deleteExpense(transaction.id);
      } else {
        await deleteIncome(transaction.id);
      }
      loadTransactions();
    } catch (error) {
      console.error("Failed to delete transaction", error);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">Extrato por Conta</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Buttons removed or kept? Keeping for manual entry if needed, but context suggests viewing statement */}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="col-span-1">
            <label className="text-sm font-medium mb-2 block">Conta</label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <label className="text-sm font-medium mb-2 block">Data Inicial</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>

          <div className="col-span-1">
            <label className="text-sm font-medium mb-2 block">Data Final</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          
          <div className="col-span-1 flex items-end">
             <Button onClick={loadTransactions} className="w-full">
               Filtrar
             </Button>
          </div>
        </div>

        {selectedAccountId && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">R$</div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  balanceInfo.account_balance >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(balanceInfo.account_balance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Saldo atual da conta
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas (Período)</CardTitle>
                <div className="h-4 w-4 text-green-600">↑</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(balanceInfo.period_summary.total_income)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas (Período)</CardTitle>
                <div className="h-4 w-4 text-red-600">↓</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(balanceInfo.period_summary.total_expense)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resultado (Período)</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">=</div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  balanceInfo.period_summary.net_result >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(balanceInfo.period_summary.net_result)}
                </div>
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
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => requestSort("date")}
                  >
                    Data 
                    {sortConfig?.key === "date" && (
                      <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => requestSort("description")}
                  >
                    Descrição 
                    {sortConfig?.key === "description" && (
                      <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => requestSort("category")}
                  >
                    Categoria 
                    {sortConfig?.key === "category" && (
                      <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => requestSort("amount")}
                  >
                    Valor 
                    {sortConfig?.key === "amount" && (
                      <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => requestSort("status")}
                  >
                    Status 
                    {sortConfig?.key === "status" && (
                      <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    )}
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.length === 0 ? (
                  <TableRow key="no-transactions">
                    <TableCell colSpan={6} className="text-center">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTransactions.map((transaction, index) => {
                    const rawDate = transaction.type === 'expense' 
                      ? (transaction.payment_date || transaction.issue_date) 
                      : (transaction.receipt_date || transaction.issue_date);
                    const date = rawDate ? parseISO(rawDate) : new Date();

                    const amount = transaction.type === 'expense' 
                      ? (transaction.total_paid || transaction.amount) 
                      : (transaction.total_received || transaction.amount);

                    return (
                      <TableRow key={`${transaction.id}-${index}`}>
                        <TableCell>
                          {format(date, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.category_name}</TableCell>
                        <TableCell className={transaction.type === 'income' ? "text-green-600" : "text-red-600"}>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(transaction.type === 'expense' ? -amount : amount)}
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
        onSuccess={loadTransactions}
        initialData={editingTransaction && editingTransaction.type === 'expense' ? (editingTransaction as unknown as ExpenseRecord) : null}
        defaultAccountId={selectedAccountId === 'all' ? undefined : selectedAccountId}
      />
      
      <ReceivableSheet
        open={receivableSheetOpen}
        onOpenChange={setReceivableSheetOpen}
        onSuccess={loadTransactions}
        initialData={editingTransaction && editingTransaction.type === 'income' ? ({
          ...editingTransaction,
          payment_date: editingTransaction.receipt_date
        } as unknown as IncomeRecord) : null}
        defaultAccountId={selectedAccountId === 'all' ? undefined : selectedAccountId}
      />
    </div>
  );
}
