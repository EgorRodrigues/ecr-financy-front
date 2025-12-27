"use client"

import { useState, useEffect, startTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  getCategories, 
  getSubcategories, 
  getCostCenters, 
  getContacts, 
  getAccounts,
  createExpense, 
  updateExpense,
  type ExpenseRecord,
  type TransactionInput
} from "@/lib/api"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { ContactSheet } from "@/components/financeiro/contact-sheet"

type PayableSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialData?: ExpenseRecord | null
}

type FormState = {
  valor: number
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
  formaPagamento?: string
  conta?: string
  contaId?: string
  competencia?: string
  projeto?: string
  tags?: string
  observacoes?: string
  parcelado?: boolean
  parcelas?: number
  recorrencia?: boolean
  status: "pendente" | "pago" | "cancelado"
}

export function PayableSheet({ open, onOpenChange, onSuccess, initialData }: PayableSheetProps) {
  const [form, setForm] = useState<FormState>({
    valor: 0,
    parcelado: false,
    parcelas: 1,
    status: "pendente",
    dataEmissao: format(new Date(), "yyyy-MM-dd"),
    dataVencimento: format(new Date(), "yyyy-MM-dd"),
  })
  
  const [valorText, setValorText] = useState("R$ 0,00")
  
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string }>>([])
  const [costCenters, setCostCenters] = useState<Array<{ id: string; name: string }>>([])
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([])
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
  
  const [loading, setLoading] = useState(false)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadDependencies()
      if (initialData) {
        setForm({
          valor: initialData.amount,
          parcelado: false,
          parcelas: 1,
          status: initialData.status as "pendente" | "pago" | "cancelado",
          dataEmissao: initialData.issue_date,
          dataVencimento: initialData.due_date,
          categoriaId: initialData.category_id,
          subcategoriaId: initialData.subcategory_id,
          centroCustoId: initialData.cost_center_id,
          fornecedorClienteId: initialData.contact_id,
          descricao: initialData.description,
          documento: initialData.document,
          formaPagamento: initialData.payment_method,
          contaId: initialData.account,
          competencia: initialData.competence,
          projeto: initialData.project,
          tags: initialData.tags?.join(", "),
          observacoes: initialData.notes,
          recorrencia: initialData.recurrence,
        })
        const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(initialData.amount)
        setValorText(formatted)
      } else {
        setForm({
          valor: 0,
          parcelado: false,
          parcelas: 1,
          status: "pendente",
          dataEmissao: format(new Date(), "yyyy-MM-dd"),
          dataVencimento: format(new Date(), "yyyy-MM-dd"),
        })
        setValorText("R$ 0,00")
      }
    }
  }, [open, initialData])

  useEffect(() => {
    if (form.categoriaId) {
      getSubcategories(form.categoriaId).then(setSubcategories).catch(() => setSubcategories([]))
    } else {
      setSubcategories([])
    }
  }, [form.categoriaId])

  async function loadDependencies() {
    try {
      const [cats, conts, ccs, accs] = await Promise.all([
        getCategories(),
        getContacts(),
        getCostCenters(),
        getAccounts()
      ])
      setCategories(cats)
      setContacts(conts)
      setCostCenters(ccs)
      setAccounts(accs)
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
    if (!form.descricao || !form.valor) return

    setLoading(true)
    try {
      if (initialData) {
        // Update mode
        const payload: TransactionInput = {
          amount: form.valor,
          status: form.status,
          issue_date: form.dataEmissao,
          due_date: form.dataVencimento,
          category_id: form.categoriaId,
          subcategory_id: form.subcategoriaId,
          cost_center_id: form.centroCustoId,
          contact_id: form.fornecedorClienteId,
          description: form.descricao,
          document: form.documento,
          payment_method: form.formaPagamento,
          account: form.contaId,
          recurrence: !!form.recorrencia,
          competence: form.competencia,
          project: form.projeto,
          tags: form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
          notes: form.observacoes,
          active: true,
        }
        await updateExpense(initialData.id, payload)
      } else {
        // Create mode
        const isParcelado = !!form.parcelado && (form.parcelas || 1) > 1
        
        if (isParcelado) {
          const n = Math.max(2, form.parcelas || 2)
          const total = Math.abs(form.valor || 0)
          const base = Math.floor((total * 100) / n)
          const amounts: number[] = Array.from({ length: n }, (_, i) => (i < n - 1 ? base : total * 100 - base * (n - 1))).map((c) => c / 100)
          const start = form.dataVencimento || new Date().toISOString().slice(0, 10)
          const startDate = new Date(start)
          
          const requests: Promise<unknown>[] = []
          for (let i = 0; i < n; i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate())
            const due = d.toISOString().slice(0, 10)
            
            const payload: TransactionInput = {
              amount: Math.abs(amounts[i]),
              status: form.status,
              issue_date: form.dataEmissao,
              due_date: due,
              category_id: form.categoriaId,
              subcategory_id: form.subcategoriaId,
              cost_center_id: form.centroCustoId,
              contact_id: form.fornecedorClienteId,
              description: [form.descricao || "", `(parcela ${i + 1}/${n})`].filter(Boolean).join(" "),
              document: form.documento ? `${form.documento}-${i + 1}/${n}` : undefined,
              payment_method: form.formaPagamento,
              account: form.contaId,
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
            due_date: form.dataVencimento,
            category_id: form.categoriaId,
            subcategory_id: form.subcategoriaId,
            cost_center_id: form.centroCustoId,
            contact_id: form.fornecedorClienteId,
            description: form.descricao,
            document: form.documento,
            payment_method: form.formaPagamento,
            account: form.contaId,
            recurrence: !!form.recorrencia,
            competence: form.competencia,
            project: form.projeto,
            tags: form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
            notes: form.observacoes,
            active: true,
          }
          await createExpense(payload)
        }
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save expense", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full">
        <SheetHeader>
          <SheetTitle>{initialData ? "Editar Despesa" : "Nova Despesa"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 p-4">
          
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
              <Select value={form.status} onValueChange={(v) => update("status", v as "pendente" | "pago" | "cancelado")}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Emissão</label>
              <Input 
                type="date" 
                value={form.dataEmissao} 
                onChange={(e) => update("dataEmissao", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Vencimento</label>
              <Input 
                type="date" 
                value={form.dataVencimento} 
                onChange={(e) => update("dataVencimento", e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input 
              value={form.descricao ?? ""} 
              onChange={(e) => update("descricao", e.target.value)} 
              placeholder="Ex: Conta de Luz, Aluguel..."
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
            <label className="text-sm font-medium">Fornecedor</label>
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
              <label className="text-sm font-medium">Forma de Pagto</label>
              <Select value={form.formaPagamento} onValueChange={(v) => update("formaPagamento", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conta de Saída</label>
              <Select value={form.contaId} onValueChange={(v) => update("contaId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
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
            {loading ? "Salvando..." : (initialData ? "Atualizar" : "Salvar")}
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
