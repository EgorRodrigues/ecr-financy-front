"use client"

import { Plus } from "lucide-react"
import { useEffect, useState, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { ContactSheet } from "@/components/financeiro/contact-sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getExpenses, updateExpense, deleteExpense, getContacts, getAccounts, getCategories, getSubcategories, getCostCenters, type ExpenseRecord, type TransactionInput, type Contact, type Account } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"

type ExpenseItem = {
  id: string
  fornecedor: string
  contactId?: string
  vencimento: string
  valor: number
  status: "pendente" | "pago" | "atrasado" | "cancelado"
}

export default function ContasAPagarPage() {
  const [view, setView] = useState<"tabela" | "cards">("tabela")
  const [dados, setDados] = useState<ExpenseItem[]>([])
  const [records, setRecords] = useState<ExpenseRecord[]>([])
  const [contactMap, setContactMap] = useState<Record<string, string>>({})
  const [contactsList, setContactsList] = useState<Contact[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string }>>([])
  const [costCenters, setCostCenters] = useState<Array<{ id: string; name: string }>>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [open, setOpen] = useState(false)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)
  const [mode, setMode] = useState<"view" | "edit" | "pay">("view")
  const [selected, setSelected] = useState<ExpenseRecord | null>(null)
  const [edit, setEdit] = useState<TransactionInput | null>(null)
  const [pay, setPay] = useState<{
    payment_date?: string
    amount?: number
    interest?: number
    fine?: number
    discount?: number
    total_paid?: number
    status: TransactionInput["status"]
  } | null>(null)

  const load = () => {
    getExpenses()
      .then((list) => startTransition(() => {
        setRecords(list)
        const mapped: ExpenseItem[] = (list as BackendExpenseRecord[]).map((i) => ({
          id: i.id,
          fornecedor: i.contact_name || i.contact_id || "",
          contactId: i.contact_id,
          vencimento: i.due_date || "",
          valor: typeof i.amount === "number" ? i.amount : 0,
          status: (i.status as ExpenseItem["status"]) || "pendente",
        }))
        setDados(mapped)
      }))
      .catch(() => {})
  }

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

  type BackendExpenseRecord = ExpenseRecord & { contact_name?: string }

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

  function openPay(id: string) {
    const rec = records.find((r) => r.id === id) || null
    setSelected(rec || null)
    const today = new Date().toISOString().slice(0, 10)
    const base = rec?.amount ?? 0
    const interest = 0
    const fine = 0
    const discount = 0
    const total = base + interest + fine - discount
    setPay({
      payment_date: today,
      amount: base,
      interest,
      fine,
      discount,
      total_paid: total,
      status: "pago",
    })
    setMode("pay")
    setOpen(true)
  }

  async function savePay() {
    if (!selected || !pay) return
    const input: TransactionInput = {
      amount: (pay.amount ?? selected.amount ?? 0),
      status: "pago",
      issue_date: selected.issue_date,
      due_date: selected.due_date,
      payment_date: pay.payment_date,
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
      interest: pay.interest,
      fine: pay.fine,
      discount: pay.discount,
      total_paid: pay.total_paid,
    }
    await updateExpense(selected.id, input)
    setOpen(false)
    setSelected(null)
    setEdit(null)
    setPay(null)
    load()
  }

  async function saveEdit() {
    if (!selected || !edit) return
    await updateExpense(selected.id, edit)
    setOpen(false)
    setSelected(null)
    setEdit(null)
    load()
  }

  async function remove(id: string) {
    const ok = typeof window !== "undefined" ? window.confirm("Excluir?") : true
    if (!ok) return
    await deleteExpense(id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Contas a Pagar</h2>
        <div className="flex gap-2">
          <Button variant={view === "tabela" ? "default" : "outline"} onClick={() => setView("tabela")}>Tabela</Button>
          <Button variant={view === "cards" ? "default" : "outline"} onClick={() => setView("cards")}>Cards</Button>
        </div>
      </div>

      {view === "tabela" ? (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{contactMap[d.contactId || ""] || d.fornecedor}</TableCell>
                  <TableCell>{d.vencimento}</TableCell>
                  <TableCell className="text-right">{d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell>
                    <span className={
                      d.status === "pago" ? "text-emerald-600" : d.status === "pendente" ? "text-amber-600" : "text-rose-600"
                    }>{d.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openView(d.id)}>Ver</Button>
                      {d.status !== "pago" && d.status !== "cancelado" && (
                        <Button size="sm" onClick={() => openPay(d.id)}>Pagar</Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => openEdit(d.id)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(d.id)}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {dados.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="text-xs text-muted-foreground">Fornecedor</div>
              <div className="text-sm font-medium">{contactMap[d.contactId || ""] || d.fornecedor}</div>
              <div className="mt-2 text-xs text-muted-foreground">Vencimento</div>
              <div className="text-sm">{d.vencimento}</div>
              <div className="mt-2 text-xs text-muted-foreground">Valor</div>
              <div className="text-sm font-semibold">{d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              <div className="mt-2 text-xs text-muted-foreground">Status</div>
              <div className={
                d.status === "pago" ? "text-emerald-600" : d.status === "pendente" ? "text-amber-600" : "text-rose-600"
              }>{d.status}</div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openView(d.id)}>Ver</Button>
                {d.status !== "pago" && d.status !== "cancelado" && (
                  <Button size="sm" onClick={() => openPay(d.id)}>Pagar</Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => openEdit(d.id)}>Editar</Button>
                <Button variant="destructive" size="sm" onClick={() => remove(d.id)}>Excluir</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-w-xl h-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{mode === "view" ? "Visualizar" : mode === "edit" ? "Editar" : "Pagar"}</SheetTitle>
          </SheetHeader>
          {mode === "view" && selected && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div className="col-span-2">
                <div className="text-muted-foreground">Fornecedor</div>
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
                <div className="text-muted-foreground">Pagamento</div>
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
                <div className="text-muted-foreground">Total Pago</div>
                <div>{(selected.total_paid ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
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
                <div className="text-muted-foreground">Fornecedor</div>
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
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setContactSheetOpen(true)} title="Novo Fornecedor">
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
                  <option value="pago">pago</option>
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

              <div className="col-span-2">
                <div className="text-muted-foreground">Descrição</div>
                <textarea 
                  className="bg-background h-20 w-full rounded-md border px-2 py-2" 
                  value={edit.description || ""} 
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })} 
                />
              </div>
              <div>
                <div className="text-muted-foreground">Documento</div>
                <Input value={edit.document || ""} onChange={(e) => setEdit({ ...edit, document: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Forma</div>
                <select
                  className="bg-background h-9 w-full rounded-md border px-2"
                  value={edit.payment_method || ""}
                  onChange={(e) => setEdit({ ...edit, payment_method: e.target.value })}
                >
                  <option value="">Selecione</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao">Cartão</option>
                  <option value="transferencia">Transferência</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
              <div>
                <div className="text-muted-foreground">Conta</div>
                <select className="bg-background h-9 w-full rounded-md border px-2" value={edit.account || ""} onChange={(e) => setEdit({ ...edit, account: e.target.value })}>
                  <option value="">Selecione</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-muted-foreground">Competência</div>
                <Input value={edit.competence || ""} onChange={(e) => setEdit({ ...edit, competence: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Projeto</div>
                <Input value={edit.project || ""} onChange={(e) => setEdit({ ...edit, project: e.target.value })} />
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Tags (vírgula)</div>
                <Input value={(edit.tags || []).join(", ")} onChange={(e) => setEdit({ ...edit, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Observações</div>
                <textarea 
                  className="bg-background h-20 w-full rounded-md border px-2 py-2" 
                  value={edit.notes || ""} 
                  onChange={(e) => setEdit({ ...edit, notes: e.target.value })} 
                />
              </div>
              <div>
                <div className="text-muted-foreground">Ativo</div>
                <select className="bg-background h-9 w-full rounded-md border px-2" value={String(edit.active ?? true)} onChange={(e) => setEdit({ ...edit, active: e.target.value === "true" })}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            </div>
          )}
          {mode === "pay" && pay && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div>
                <div className="text-muted-foreground">Data do Pagamento</div>
                <Input type="date" value={pay.payment_date || ""} onChange={(e) => setPay({ ...(pay || {}), payment_date: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Valor</div>
                <CurrencyInput value={pay.amount ?? 0} onValueChange={(v) => {
                  const total = v + (pay?.interest ?? 0) + (pay?.fine ?? 0) - (pay?.discount ?? 0)
                  setPay({ ...(pay || {}), amount: v, total_paid: total })
                }} />
              </div>
              <div>
                <div className="text-muted-foreground">Juros</div>
                <CurrencyInput value={pay.interest ?? 0} onValueChange={(v) => {
                  const total = (pay?.amount ?? 0) + v + (pay?.fine ?? 0) - (pay?.discount ?? 0)
                  setPay({ ...(pay || {}), interest: v, total_paid: total })
                }} />
              </div>
              <div>
                <div className="text-muted-foreground">Multa</div>
                <CurrencyInput value={pay.fine ?? 0} onValueChange={(v) => {
                  const total = (pay?.amount ?? 0) + (pay?.interest ?? 0) + v - (pay?.discount ?? 0)
                  setPay({ ...(pay || {}), fine: v, total_paid: total })
                }} />
              </div>
              <div>
                <div className="text-muted-foreground">Desconto</div>
                <CurrencyInput value={pay.discount ?? 0} onValueChange={(v) => {
                  const total = (pay?.amount ?? 0) + (pay?.interest ?? 0) + (pay?.fine ?? 0) - v
                  setPay({ ...(pay || {}), discount: v, total_paid: total })
                }} />
              </div>
              <div>
                <div className="text-muted-foreground">Valor Total Pago</div>
                <CurrencyInput value={pay.total_paid ?? 0} onValueChange={(v) => setPay({ ...(pay || {}), total_paid: v })} />
              </div>
            </div>
          )}
          <SheetFooter>
            {mode === "edit" && (
              <div className="flex gap-2">
                <Button onClick={saveEdit}>Salvar</Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
              </div>
            )}
            {mode === "pay" && (
              <div className="flex gap-2">
                <Button onClick={savePay}>Confirmar Pagamento</Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
              </div>
            )}
            {mode === "view" && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ContactSheet 
        open={contactSheetOpen} 
        onOpenChange={setContactSheetOpen} 
        onSuccess={loadContacts}
        defaultType="supplier"
      />
    </div>
  )
}
