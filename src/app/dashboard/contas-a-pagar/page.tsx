"use client"

import { useEffect, useState, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getExpenses, updateExpense, deleteExpense, type ExpenseRecord, type TransactionInput } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"

type ExpenseItem = {
  id: string
  fornecedor: string
  vencimento: string
  valor: number
  status: "pendente" | "pago" | "atrasado" | "cancelado"
}

export default function ContasAPagarPage() {
  const [view, setView] = useState<"tabela" | "cards">("tabela")
  const [dados, setDados] = useState<ExpenseItem[]>([])
  const [records, setRecords] = useState<ExpenseRecord[]>([])
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [selected, setSelected] = useState<ExpenseRecord | null>(null)
  const [edit, setEdit] = useState<TransactionInput | null>(null)

  const load = () => {
    getExpenses()
      .then((list) => startTransition(() => {
        setRecords(list)
        const mapped: ExpenseItem[] = (list as BackendExpenseRecord[]).map((i) => ({
          id: i.id,
          fornecedor: i.contact_name || i.contact_id || "",
          vencimento: i.due_date || "",
          valor: typeof i.amount === "number" ? i.amount : 0,
          status: (i.status as ExpenseItem["status"]) || "pendente",
        }))
        setDados(mapped)
      }))
      .catch(() => {})
  }

  useEffect(() => {
    load()
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
      payment_date: rec.payment_date,
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
    setMode("edit")
    setOpen(true)
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
                  <TableCell>{d.fornecedor}</TableCell>
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
              <div className="text-sm font-medium">{d.fornecedor}</div>
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
            <SheetTitle>{mode === "view" ? "Visualizar" : "Editar"}</SheetTitle>
          </SheetHeader>
          {mode === "view" && selected && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
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
                <div className="text-muted-foreground">Valor</div>
                <Input type="number" value={edit.amount ?? 0} onChange={(e) => setEdit({ ...edit, amount: Number(e.target.value) })} />
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
                <div className="text-muted-foreground">Pagamento</div>
                <Input type="date" value={edit.payment_date || ""} onChange={(e) => setEdit({ ...edit, payment_date: e.target.value })} />
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
                <div className="text-muted-foreground">Forma</div>
                <Input value={edit.payment_method || ""} onChange={(e) => setEdit({ ...edit, payment_method: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Conta</div>
                <Input value={edit.account || ""} onChange={(e) => setEdit({ ...edit, account: e.target.value })} />
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
                <Input value={edit.notes || ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
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
          <SheetFooter>
            {mode === "edit" ? (
              <div className="flex gap-2">
                <Button onClick={saveEdit}>Salvar</Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
