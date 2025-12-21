"use client"

import { useState, useEffect, startTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createExpense, getCategories, getSubcategories, getCostCenters, getContacts, type TransactionInput } from "@/lib/api"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { ContactSheet } from "@/components/financeiro/contact-sheet"

type CreditCardExpenseSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardId: string
  cardName: string
  onSuccess?: () => void
}

type FormState = {
  tipo: "despesa" | "receita"
  valor: number
  status: "pendente" | "pago" | "cancelado"
  dataEmissao?: string
  dataVencimento?: string
  categoria?: string
  categoriaId?: string
  subcategoria?: string
  subcategoriaId?: string
  centroCusto?: string
  centroCustoId?: string
  fornecedorCliente?: string
  fornecedorClienteId?: string
  descricao?: string
  documento?: string
  competencia?: string
  projeto?: string
  tags?: string
  observacoes?: string
  parcelado?: boolean
  parcelas?: number
  recorrencia?: boolean
}

export function CreditCardExpenseSheet({ open, onOpenChange, cardId, cardName, onSuccess }: CreditCardExpenseSheetProps) {
  const [form, setForm] = useState<FormState>({
    tipo: "despesa",
    valor: 0,
    status: "pendente",
    parcelado: false,
    parcelas: 1,
    dataEmissao: format(new Date(), "yyyy-MM-dd"),
    dataVencimento: format(new Date(), "yyyy-MM-dd"),
  })
  
  const [valorText, setValorText] = useState("R$ 0,00")
  
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string }>>([])
  const [costCenters, setCostCenters] = useState<Array<{ id: string; name: string }>>([])
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([])
  
  const [loading, setLoading] = useState(false)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadDependencies()
      // Reset form when opening
      setForm({
        tipo: "despesa",
        valor: 0,
        status: "pendente",
        parcelado: false,
        parcelas: 1,
        dataEmissao: format(new Date(), "yyyy-MM-dd"),
        dataVencimento: format(new Date(), "yyyy-MM-dd"),
      })
      setValorText("R$ 0,00")
    }
  }, [open])

  useEffect(() => {
    if (form.categoriaId) {
      getSubcategories(form.categoriaId).then(setSubcategories).catch(() => setSubcategories([]))
    } else {
      setSubcategories([])
    }
  }, [form.categoriaId])

  async function loadDependencies() {
    try {
      const [cats, conts, ccs] = await Promise.all([
        getCategories(),
        getContacts(),
        getCostCenters()
      ])
      setCategories(cats)
      setContacts(conts)
      setCostCenters(ccs)
    } catch (error) {
      console.error("Failed to load dependencies", error)
    }
  }

  function loadContacts() {
    getContacts()
      .then((list) => startTransition(() => setContacts(list.map((c) => ({ id: c.id, name: c.name })))) )
      .catch(() => {})
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const digits = raw.replace(/\D/g, "")
    const cents = digits ? parseInt(digits, 10) : 0
    const value = cents / 100
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
    setValorText(formatted)
    update("valor", value)
  }

  async function handleSubmit() {
    if (!form.descricao || !form.valor || !form.categoriaId) return

    setLoading(true)
    try {
      const isParcelado = !!form.parcelado && (form.parcelas || 1) > 1
      
      if (isParcelado) {
        const n = Math.max(2, form.parcelas || 2)
        const total = Math.abs(form.valor || 0)
        const base = Math.floor((total * 100) / n)
        const amounts: number[] = Array.from({ length: n }, (_, i) => (i < n - 1 ? base : total * 100 - base * (n - 1))).map((c) => c / 100)
        const start = form.dataEmissao || new Date().toISOString().slice(0, 10) // Use emission date as start for credit card purchase date
        const startDate = new Date(start)
        
        const requests: Promise<unknown>[] = []
        for (let i = 0; i < n; i++) {
          // For credit card installments, usually the purchase date is the same, 
          // but if we want to simulate monthly billing, we might shift due dates?
          // However, for credit card expenses, the "due_date" on the expense usually maps to when it appears on the invoice.
          // Let's assume standard behavior: date of purchase is fixed, but maybe we don't shift dates for credit card entries 
          // in the same way as accounts payable? 
          // Actually, if I buy something in 3 installments on credit card:
          // 1st installment: Current invoice
          // 2nd installment: Next invoice
          // 3rd installment: Next next invoice
          // So we should shift the dates (issue_date or due_date?). 
          // Usually 'issue_date' is the purchase date (constant) and 'due_date' might be used for filtering by month.
          // Let's stick to the logic from CadastroDespesasPage which shifts dates by month.
          
          const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate())
          const dateStr = d.toISOString().slice(0, 10)
          
          const payload: TransactionInput = {
            amount: Math.abs(amounts[i]),
            status: form.status,
            issue_date: form.dataEmissao, // Original purchase date
            due_date: dateStr, // Shifted date for invoice allocation
            category_id: form.categoriaId,
            subcategory_id: form.subcategoriaId,
            cost_center_id: form.centroCustoId,
            contact_id: form.fornecedorClienteId,
            description: [form.descricao || "", `(parcela ${i + 1}/${n})`].filter(Boolean).join(" "),
            document: form.documento ? `${form.documento}-${i + 1}/${n}` : undefined,
            payment_method: "credit_card",
            account: cardId,
            recurrence: !!form.recorrencia,
            competence: form.competencia,
            project: form.projeto,
            tags: form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
            notes: form.observacoes,
            active: true,
          }
          requests.push(createExpense(payload))
        }
        await Promise.all(requests)
      } else {
        const payload: TransactionInput = {
          amount: form.valor,
          status: form.status,
          issue_date: form.dataEmissao,
          due_date: form.dataEmissao, // Same date for single purchase
          category_id: form.categoriaId,
          subcategory_id: form.subcategoriaId,
          cost_center_id: form.centroCustoId,
          contact_id: form.fornecedorClienteId,
          description: form.descricao,
          document: form.documento,
          payment_method: "credit_card",
          account: cardId,
          recurrence: !!form.recorrencia,
          competence: form.competencia,
          project: form.projeto,
          tags: form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
          notes: form.observacoes,
          active: true,
        }
        await createExpense(payload)
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create expense", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full">
        <SheetHeader>
          <SheetTitle>Nova Despesa - {cardName}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor</label>
              <Input 
                value={valorText} 
                onChange={handleValorChange} 
                className="text-lg font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={form.status} 
                onValueChange={(v) => update("status", v as FormState["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data da Compra</label>
            <Input 
              type="date" 
              value={form.dataEmissao} 
              onChange={(e) => update("dataEmissao", e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input 
              value={form.descricao ?? ""} 
              onChange={(e) => update("descricao", e.target.value)} 
              placeholder="Ex: Almoço, Uber, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={form.categoriaId} onValueChange={(v) => update("categoriaId", v)}>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategoria</label>
              <Select value={form.subcategoriaId} onValueChange={(v) => update("subcategoriaId", v)}>
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Centro de Custo</label>
            <Select value={form.centroCustoId} onValueChange={(v) => update("centroCustoId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {costCenters.map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fornecedor / Loja</label>
            <div className="flex items-center gap-2">
              <Select value={form.fornecedorClienteId} onValueChange={(v) => update("fornecedorClienteId", v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setContactSheetOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Documento</label>
              <Input 
                value={form.documento ?? ""} 
                onChange={(e) => update("documento", e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Competência</label>
              <Input 
                value={form.competencia ?? ""} 
                onChange={(e) => update("competencia", e.target.value)} 
                placeholder="AAAA-MM"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Projeto</label>
              <Input 
                value={form.projeto ?? ""} 
                onChange={(e) => update("projeto", e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input 
                value={form.tags ?? ""} 
                onChange={(e) => update("tags", e.target.value)} 
                placeholder="tag1, tag2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Parcelado?</label>
              <Select 
                value={form.parcelado ? "sim" : "nao"} 
                onValueChange={(v) => update("parcelado", v === "sim")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.parcelado && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nº Parcelas</label>
                <Input 
                  type="number" 
                  min={2}
                  value={form.parcelas} 
                  onChange={(e) => update("parcelas", Number(e.target.value))} 
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Input 
              value={form.observacoes ?? ""} 
              onChange={(e) => update("observacoes", e.target.value)} 
            />
          </div>

        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.valor || !form.descricao}>
            {loading ? "Salvando..." : "Salvar Despesa"}
          </Button>
        </SheetFooter>
      </SheetContent>
      <ContactSheet 
        open={contactSheetOpen} 
        onOpenChange={setContactSheetOpen} 
        onSuccess={loadContacts}
        defaultType="supplier"
      />
    </Sheet>
  )
}
