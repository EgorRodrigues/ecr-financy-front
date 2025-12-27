"use client"

import { Plus, ArrowUpDown, Pencil, Trash2, Eye, Banknote, Calendar } from "lucide-react"
import { useEffect, useState, startTransition, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { ContactSheet } from "@/components/financeiro/contact-sheet"
import { ReceivableSheet } from "@/components/financeiro/receivable-sheet"
import { useSort } from "@/hooks/use-sort"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getIncomes, updateIncome, deleteIncome, getContacts, getAccounts, getCategories, getSubcategories, getCostCenters, type IncomeRecord, type TransactionInput, type Contact, type Account } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"

type Receivable = {
  id: string
  cliente: string
  contactId?: string
  vencimento: string
  valor: number
  status: "pendente" | "recebido" | "atrasado" | "cancelado"
}

type BackendIncomeRecord = IncomeRecord & { contact_name?: string }

export default function ContasAReceberPage() {
  const [view, setView] = useState<"tabela" | "cards">("tabela")

  const [records, setRecords] = useState<IncomeRecord[]>([])
  const [contactMap, setContactMap] = useState<Record<string, string>>({})
  const [contactsList, setContactsList] = useState<Contact[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string }>>([])
  const [costCenters, setCostCenters] = useState<Array<{ id: string; name: string }>>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [receivableSheetOpen, setReceivableSheetOpen] = useState(false)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7))

  const dados = useMemo(() => {
    const filtered = records.filter(r => (r.due_date || "").startsWith(selectedMonth))
    return (filtered as BackendIncomeRecord[]).map((i) => ({
      id: i.id,
      cliente: i.contact_name || i.contact_id || "",
      contactId: i.contact_id,
      vencimento: i.due_date || "",
      valor: typeof i.amount === "number" ? i.amount : 0,
      status: (i.status as Receivable["status"]) || "pendente",
    }))
  }, [records, selectedMonth])
  const [mode, setMode] = useState<"view" | "edit" | "receive">("view")
  const [selected, setSelected] = useState<IncomeRecord | null>(null)
  const [edit, setEdit] = useState<TransactionInput | null>(null)
  const [receive, setReceive] = useState<{
    payment_date?: string
    amount?: number
    interest?: number
    fine?: number
    discount?: number
    total_received?: number
    status: TransactionInput["status"]
  } | null>(null)

  const load = () => {
    getIncomes()
      .then((list) => startTransition(() => {
        setRecords(list)
      }))
      .catch(() => {})
  }



  const monthlySummary = useMemo(() => {
    const summary: Record<string, number> = {}
    records.forEach(r => {
      const month = (r.due_date || "").slice(0, 7)
      if (month) {
        summary[month] = (summary[month] || 0) + (r.amount || 0)
      }
    })
    
    return Object.entries(summary)
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort ascending
      .map(([month, total]) => ({ month, total }))
  }, [records])

  const currentMonthTotal = monthlySummary.find(s => s.month === selectedMonth)?.total || 0

  const loadContacts = () => {
    getContacts()
      .then((list) => startTransition(() => {
        setContactsList(list as Contact[])
        const map: Record<string, string> = {}
        ;(list as Contact[]).forEach((c) => { map[c.id] = c.name })
        setContactMap(map)
      }))
      .catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    loadContacts()

    getCategories()
      .then((list) => startTransition(() => setCategories(list)))
      .catch(() => {})

    getCostCenters()
      .then((list) => startTransition(() => setCostCenters(list)))
      .catch(() => {})

    getAccounts()
      .then((list) => startTransition(() => setAccounts(list)))
      .catch(() => {})
  }, [])

  function openView(id: string) {
    const rec = records.find((r) => r.id === id) || null
    setSelected(rec)
    setMode("view")
    setOpen(true)
  }

  function openEdit(id: string) {
    const rec = records.find((r) => r.id === id) || null
    setSelected(rec)
    setEdit(rec ? {
      amount: rec.amount,
      status: rec.status as TransactionInput["status"],
      issue_date: rec.issue_date,
      due_date: rec.due_date,
      category_id: rec.category_id,
      subcategory_id: rec.subcategory_id,
      cost_center_id: rec.cost_center_id,
      contact_id: rec.contact_id,
      description: rec.description,
      document: rec.document,
      payment_method: rec.payment_method,
      account: rec.account,
      recurrence: rec.recurrence,
      competence: rec.competence,
      project: rec.project,
      tags: rec.tags,
      notes: rec.notes,
      active: rec.active,
    } : null)

    if (rec && rec.category_id) {
      getSubcategories(rec.category_id).then((list) => {
        startTransition(() => setSubcategories(list))
      })
    } else {
      setSubcategories([])
    }

    setMode("edit")
    setOpen(true)
  }

  function openReceive(id: string) {
    const rec = records.find((r) => r.id === id) || null
    setSelected(rec || null)
    const today = new Date().toISOString().slice(0, 10)
    const base = rec?.amount ?? 0
    const interest = 0
    const fine = 0
    const discount = 0
    const total = base + interest + fine - discount
    setReceive({
      payment_date: today,
      amount: base,
      interest,
      fine,
      discount,
      total_received: total,
      status: "recebido",
    })
    setMode("receive")
    setOpen(true)
  }

  async function saveReceive() {
    if (!selected || !receive) return
    const input: TransactionInput = {
      amount: (receive.amount ?? selected.amount ?? 0),
      status: "recebido",
      issue_date: selected.issue_date,
      due_date: selected.due_date,
      payment_date: receive.payment_date,
      category_id: selected.category_id,
      subcategory_id: selected.subcategory_id,
      cost_center_id: selected.cost_center_id,
      contact_id: selected.contact_id,
      description: selected.description,
      document: selected.document,
      payment_method: selected.payment_method,
      account: selected.account,
      recurrence: selected.recurrence,
      competence: selected.competence,
      project: selected.project,
      tags: selected.tags,
      notes: selected.notes,
      active: selected.active,
      interest: receive.interest,
      fine: receive.fine,
      discount: receive.discount,
      total_received: receive.total_received,
    }
    await updateIncome(selected.id, input)
    setOpen(false)
    setSelected(null)
    setEdit(null)
    setReceive(null)
    load()
  }

  async function saveEdit() {
    if (!selected || !edit) return
    await updateIncome(selected.id, edit)
    setOpen(false)
    setSelected(null)
    setEdit(null)
    load()
  }

  async function remove(id: string) {
    const ok = typeof window !== "undefined" ? window.confirm("Excluir?") : true
    if (!ok) return
    await deleteIncome(id)
    load()
  }

  const displayData = useMemo(() => {
    return dados.map((d) => ({
      ...d,
      displayCliente: contactMap[d.contactId || ""] || d.cliente,
    }))
  }, [dados, contactMap])

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayData)

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 p-6 overflow-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Contas a Receber</h2>
          <div className="flex gap-2">
            <Button onClick={() => setReceivableSheetOpen(true)}>Lançar Receita</Button>
            <Button variant={view === "tabela" ? "default" : "outline"} onClick={() => setView("tabela")}>Tabela</Button>
            <Button variant={view === "cards" ? "default" : "outline"} onClick={() => setView("cards")}>Cards</Button>
          </div>
        </div>

        {view === "tabela" ? (
          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort("displayCliente")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    Cliente {sortConfig?.key === "displayCliente" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead onClick={() => requestSort("vencimento")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    Vencimento {sortConfig?.key === "vencimento" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("valor")}>
                    Valor {sortConfig?.key === "valor" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead onClick={() => requestSort("status")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    Status {sortConfig?.key === "status" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Nenhuma conta a receber encontrada para este mês.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedItems.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.displayCliente}</TableCell>
                      <TableCell>{d.vencimento ? format(parseISO(d.vencimento), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="text-right">{d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                      <TableCell>
                        <span className={
                          d.status === "recebido" ? "text-emerald-600" : d.status === "pendente" ? "text-amber-600" : "text-rose-600"
                        }>{d.status}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openView(d.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {d.status !== "recebido" && d.status !== "cancelado" && (
                            <Button variant="ghost" size="icon" onClick={() => openReceive(d.id)}>
                              <Banknote className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(d.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(d.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {dados.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                Nenhuma conta a receber encontrada para este mês.
              </div>
            ) : (
              dados.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="text-xs text-muted-foreground">Cliente</div>
                  <div className="text-sm font-medium">{contactMap[d.contactId || ""] || d.cliente}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Vencimento</div>
                  <div className="text-sm">{d.vencimento ? format(parseISO(d.vencimento), "dd/MM/yyyy") : "-"}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Valor</div>
                  <div className="text-sm font-semibold">{d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Status</div>
                  <div className={
                    d.status === "recebido" ? "text-emerald-600" : d.status === "pendente" ? "text-amber-600" : "text-rose-600"
                  }>{d.status}</div>
                  <div className="mt-4 flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openView(d.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {d.status !== "recebido" && d.status !== "cancelado" && (
                      <Button variant="ghost" size="icon" onClick={() => openReceive(d.id)}>
                        <Banknote className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(d.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <div className="w-80 border-l bg-muted/30 p-6 overflow-auto">
        <h2 className="text-lg font-semibold mb-4">Resumo Mensal</h2>
        
        <div className="space-y-6">
          <Card className="border-primary ring-1 ring-primary">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Total em {selectedMonth ? format(parseISO(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR }) : "-"}</div>
              <div className="text-2xl font-bold text-primary">
                {currentMonthTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Histórico por Mês
            </h3>
            <div className="space-y-3">
              {monthlySummary.length > 0 ? (
                monthlySummary.map((item) => (
                  <div 
                    key={item.month} 
                    className={`flex justify-between text-sm p-2 bg-background rounded border cursor-pointer transition-colors hover:bg-muted/50 ${selectedMonth === item.month ? "border-primary ring-1 ring-primary" : ""}`}
                    onClick={() => setSelectedMonth(item.month)}
                  >
                    <span className="capitalize">{format(parseISO(item.month + "-01"), "MMM/yyyy", { locale: ptBR })}</span>
                    <span className="text-muted-foreground">
                      {item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  Nenhum registro encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-w-xl h-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{mode === "view" ? "Visualizar" : mode === "edit" ? "Editar" : "Receber"}</SheetTitle>
          </SheetHeader>
          {mode === "view" && selected && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div className="col-span-2">
                <div className="text-muted-foreground">Cliente</div>
                <div>{contactMap[selected.contact_id || ""] || selected.contact_id || ""}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Valor</div>
                <div>{(selected.amount ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <div>{selected.status}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Emissão</div>
                <div>{selected.issue_date || ""}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Vencimento</div>
                <div>{selected.due_date || ""}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Recebimento</div>
                <div>{selected.payment_date || ""}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Valor</div>
                <div>{(selected.amount ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Juros</div>
                <div>{(selected.interest ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Multa</div>
                <div>{(selected.fine ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Desconto</div>
                <div>{(selected.discount ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Recebido</div>
                <div>{(selected.total_received ?? selected.total_paid ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Descrição</div>
                <div>{selected.description || ""}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Documento</div>
                <div>{selected.document || ""}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Forma</div>
                <div>{selected.payment_method || ""}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Conta</div>
                <div>{selected.account || ""}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Competência</div>
                <div>{selected.competence || ""}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Projeto</div>
                <div>{selected.project || ""}</div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Tags</div>
                <div>{(selected.tags || []).join(", ")}</div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Observações</div>
                <div>{selected.notes || ""}</div>
              </div>
            </div>
          )}
          {mode === "edit" && edit && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div className="col-span-2">
                <div className="text-muted-foreground">Cliente</div>
                <div className="flex items-center gap-1">
                  <select 
                    className="bg-background h-9 w-full rounded-md border px-2" 
                    value={edit.contact_id || ""} 
                    onChange={(e) => setEdit({ ...edit, contact_id: e.target.value })}
                  >
                    <option value="">Selecione</option>
                    {contactsList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setContactSheetOpen(true)} title="Novo Cliente">
                    <Plus className="h-4 w-4 text-emerald-600" />
                  </Button>
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Valor</div>
                <CurrencyInput value={edit.amount ?? 0} onValueChange={(v) => setEdit({ ...edit, amount: v })} />
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <select className="bg-background h-9 w-full rounded-md border px-2" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as TransactionInput["status"] })}>
                  <option value="pendente">pendente</option>
                  <option value="recebido">recebido</option>
                  <option value="cancelado">cancelado</option>
                </select>
              </div>
              <div>
                <div className="text-muted-foreground">Emissão</div>
                <Input type="date" value={edit.issue_date || ""} onChange={(e) => setEdit({ ...edit, issue_date: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Vencimento</div>
                <Input type="date" value={edit.due_date || ""} onChange={(e) => setEdit({ ...edit, due_date: e.target.value })} />
              </div>

              <div>
                <div className="text-muted-foreground">Categoria</div>
                <select
                  className="bg-background h-9 w-full rounded-md border px-2"
                  value={edit.category_id || ""}
                  onChange={(e) => {
                    const id = e.target.value
                    setEdit({ ...edit, category_id: id, subcategory_id: "" })
                    if (id) {
                      getSubcategories(id).then((list) => startTransition(() => setSubcategories(list)))
                    } else {
                      setSubcategories([])
                    }
                  }}
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-muted-foreground">Subcategoria</div>
                <select
                  className="bg-background h-9 w-full rounded-md border px-2"
                  value={edit.subcategory_id || ""}
                  onChange={(e) => setEdit({ ...edit, subcategory_id: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-muted-foreground">Centro de Custo</div>
                <select
                  className="bg-background h-9 w-full rounded-md border px-2"
                  value={edit.cost_center_id || ""}
                  onChange={(e) => setEdit({ ...edit, cost_center_id: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-muted-foreground">Conta</div>
                <select
                  className="bg-background h-9 w-full rounded-md border px-2"
                  value={edit.account || ""}
                  onChange={(e) => setEdit({ ...edit, account: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <div className="text-muted-foreground">Descrição</div>
                <Input value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </div>
              
              <div>
                <div className="text-muted-foreground">Documento</div>
                <Input value={edit.document || ""} onChange={(e) => setEdit({ ...edit, document: e.target.value })} />
              </div>
              
              <div>
                <div className="text-muted-foreground">Forma Pagto</div>
                <Input value={edit.payment_method || ""} onChange={(e) => setEdit({ ...edit, payment_method: e.target.value })} />
              </div>

              <div className="col-span-2">
                <div className="text-muted-foreground">Observações</div>
                <Input value={edit.notes || ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
              </div>
            </div>
          )}
          {mode === "receive" && receive && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div className="col-span-2">
                <div className="text-muted-foreground font-semibold">Resumo do Recebimento</div>
              </div>
              <div>
                <div className="text-muted-foreground">Valor Original</div>
                <div>{(receive.amount ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Data Recebimento</div>
                <Input type="date" value={receive.payment_date || ""} onChange={(e) => setReceive({ ...receive, payment_date: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Juros</div>
                <CurrencyInput value={receive.interest ?? 0} onValueChange={(v) => setReceive({ ...receive, interest: v, total_received: (receive.amount||0) + v + (receive.fine||0) - (receive.discount||0) })} />
              </div>
              <div>
                <div className="text-muted-foreground">Multa</div>
                <CurrencyInput value={receive.fine ?? 0} onValueChange={(v) => setReceive({ ...receive, fine: v, total_received: (receive.amount||0) + (receive.interest||0) + v - (receive.discount||0) })} />
              </div>
              <div>
                <div className="text-muted-foreground">Desconto</div>
                <CurrencyInput value={receive.discount ?? 0} onValueChange={(v) => setReceive({ ...receive, discount: v, total_received: (receive.amount||0) + (receive.interest||0) + (receive.fine||0) - v })} />
              </div>
              <div>
                <div className="text-muted-foreground">Total a Receber</div>
                <div className="font-bold text-lg">{(receive.total_received ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
            </div>
          )}
          <SheetFooter className="p-4 border-t">
            {mode === "edit" && <Button onClick={saveEdit}>Salvar</Button>}
            {mode === "receive" && <Button onClick={saveReceive}>Confirmar Recebimento</Button>}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ReceivableSheet 
        open={receivableSheetOpen} 
        onOpenChange={setReceivableSheetOpen} 
        onSuccess={load}
      />
      <ContactSheet 
        open={contactSheetOpen} 
        onOpenChange={setContactSheetOpen} 
        onSuccess={loadContacts}
      />
    </div>
  )
}
