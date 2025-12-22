"use client"

import { useEffect, useState } from "react"
import { Plus, CreditCard, Calendar, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAccounts, getCreditCardSummary, deleteCreditCardTransaction, Account, CreditCardTransactionRecord } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CreditCardExpenseSheet } from "@/components/financeiro/credit-card-expense-sheet"

export default function CreditCardPage() {
  const [cards, setCards] = useState<Account[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>("")
  const [cardExpenses, setCardExpenses] = useState<CreditCardTransactionRecord[]>([])
  const [cardSummary, setCardSummary] = useState<{ total_limit: number; available_limit: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<CreditCardTransactionRecord | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (selectedCardId) {
      loadExpenses(selectedCardId)
    } else {
      setCardExpenses([])
      setCardSummary(null)
    }
  }, [selectedCardId])

  useEffect(() => {
    if (!sheetOpen) {
      setEditingTransaction(null)
    }
  }, [sheetOpen])

  async function loadAccounts() {
    try {
      const creditCards = await getAccounts({ account_type: "credit_card" })
      setCards(creditCards)
      
      if (creditCards.length > 0 && !selectedCardId) {
        setSelectedCardId(creditCards[0].id)
      }
    } catch (error) {
      console.error("Failed to load accounts", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadExpenses(accountId: string) {
    setExpensesLoading(true)
    try {
      const summary = await getCreditCardSummary(accountId)
      setCardExpenses(summary.transactions)
      setCardSummary({
        total_limit: summary.total_limit,
        available_limit: summary.available_limit,
      })
    } catch (error) {
      console.error("Failed to load expenses", error)
      setCardExpenses([])
      setCardSummary(null)
    } finally {
      setExpensesLoading(false)
    }
  }

  function handleEdit(transaction: CreditCardTransactionRecord) {
    setEditingTransaction(transaction)
    setSheetOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return
    
    try {
      await deleteCreditCardTransaction(id)
      if (selectedCardId) loadExpenses(selectedCardId)
    } catch (error) {
      console.error("Failed to delete transaction", error)
    }
  }

  const selectedCard = cards.find(c => c.id === selectedCardId)
  
  // Calculate invoice data
  const currentInvoiceValue = cardExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  const availableLimit = cardSummary?.available_limit || selectedCard?.available_limit || 0
  const totalLimit = cardSummary?.total_limit || (selectedCard?.initial_balance || 0) + availableLimit // Fallback

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Despesas no Cartão</h1>
          <Button onClick={() => setSheetOpen(true)} disabled={!selectedCardId}>
            <Plus className="mr-2 h-4 w-4" />
            Lançar Despesa
          </Button>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Selecione o Cartão</label>
          <Select value={selectedCardId} onValueChange={setSelectedCardId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Selecione um cartão" />
            </SelectTrigger>
            <SelectContent>
              {cards.map(card => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cards.length === 0 && !loading && (
             <p className="text-sm text-muted-foreground mt-2">Nenhum cartão de crédito cadastrado.</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Compras</CardTitle>
          </CardHeader>
          <CardContent>
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
                {cardExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Nenhuma despesa encontrada para este cartão.
                    </TableCell>
                  </TableRow>
                ) : (
                  cardExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.issue_date ? format(new Date(expense.issue_date), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category_id || "-"}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(expense.amount)}
                      </TableCell>
                      <TableCell className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="w-80 border-l bg-muted/30 p-6 overflow-auto">
        <h2 className="text-lg font-semibold mb-4">Resumo da Fatura</h2>
        
        {selectedCard ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Fatura Atual</div>
                <div className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(currentInvoiceValue)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Vence em {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Limite Disponível</span>
                  <span className="font-medium text-green-600">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(availableLimit)}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(availableLimit / (totalLimit || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Limite Total</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalLimit)}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximas Faturas
              </h3>
              <div className="space-y-3">
                {/* Mock future invoices */}
                <div className="flex justify-between text-sm p-2 bg-background rounded border">
                  <span>Fev/2026</span>
                  <span className="text-muted-foreground">R$ 0,00</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-background rounded border">
                  <span>Mar/2026</span>
                  <span className="text-muted-foreground">R$ 0,00</span>
                </div>
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
          if (selectedCardId) loadExpenses(selectedCardId)
        }}
      />
    </div>
  )
}
