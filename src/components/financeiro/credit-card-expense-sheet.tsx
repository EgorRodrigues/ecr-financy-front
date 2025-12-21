"use client"

import { useState, useEffect, startTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createExpense, getCategories, getSubcategories, getCostCenters, getContacts, type TransactionInput } from "@/lib/api"
import { format } from "date-fns"

type CreditCardExpenseSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardId: string
  cardName: string
  onSuccess?: () => void
}

export function CreditCardExpenseSheet({ open, onOpenChange, cardId, cardName, onSuccess }: CreditCardExpenseSheetProps) {
  const [description, setDescription] = useState("")
  const [amountText, setAmountText] = useState("R$ 0,00")
  const [amount, setAmount] = useState(0)
  const [categoryId, setCategoryId] = useState("")
  const [subcategoryId, setSubcategoryId] = useState("")
  const [contactId, setContactId] = useState("")
  const [issueDate, setIssueDate] = useState(format(new Date(), "yyyy-MM-dd"))
  
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string }>>([])
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([])
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadDependencies()
    }
  }, [open])

  useEffect(() => {
    if (categoryId) {
      getSubcategories(categoryId).then(setSubcategories).catch(() => setSubcategories([]))
    } else {
      setSubcategories([])
    }
  }, [categoryId])

  async function loadDependencies() {
    try {
      const [cats, conts] = await Promise.all([
        getCategories(),
        getContacts()
      ])
      setCategories(cats)
      setContacts(conts)
    } catch (error) {
      console.error("Failed to load dependencies", error)
    }
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const digits = raw.replace(/\D/g, "")
    const cents = digits ? parseInt(digits, 10) : 0
    const val = cents / 100
    setAmount(val)
    setAmountText(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val))
  }

  async function handleSubmit() {
    if (!description || !amount || !categoryId) return

    setLoading(true)
    try {
      const input: TransactionInput = {
        description,
        amount,
        category_id: categoryId,
        subcategory_id: subcategoryId || undefined,
        contact_id: contactId || undefined,
        account: cardId,
        status: "pendente", // Default status for credit card purchase
        issue_date: issueDate,
        due_date: issueDate, // Usually same as issue or invoice due date. We'll use issue date for now.
        payment_method: "credit_card"
      }

      await createExpense(input)
      onSuccess?.()
      onOpenChange(false)
      
      // Reset form
      setDescription("")
      setAmount(0)
      setAmountText("R$ 0,00")
      setCategoryId("")
      setSubcategoryId("")
      setContactId("")
    } catch (error) {
      console.error("Failed to create expense", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Despesa - {cardName}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor</label>
            <Input 
              value={amountText} 
              onChange={handleAmountChange} 
              className="text-lg font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data da Compra</label>
            <Input 
              type="date" 
              value={issueDate} 
              onChange={(e) => setIssueDate(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Ex: Almoço, Uber, etc."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {categoryId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategoria</label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Fornecedor / Loja</label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {contacts.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !amount || !description}>
            {loading ? "Salvando..." : "Salvar Despesa"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
