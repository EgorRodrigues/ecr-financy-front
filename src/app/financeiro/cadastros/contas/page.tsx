"use client"

import { useEffect, useState, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { createAccount, getAccounts, updateAccount, deleteAccount, type AccountInput, type Account } from "@/lib/api"

type ContaForm = {
  id: string
  nome: string
  tipo: "banco" | "cartao" | "carteira"
  agencia?: string
  conta?: string
  numeroCartao?: string
  saldoInicial?: number
  limiteDisponivel?: number
  ativo: boolean
}

export default function CadastroContasPage() {
  const [form, setForm] = useState<ContaForm>({ id: "", nome: "", tipo: "banco", ativo: true })
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [items, setItems] = useState<Array<Account>>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Account | null>(null)
  const [edit, setEdit] = useState<AccountInput | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

  useEffect(() => {
    getAccounts()
      .then((list) => startTransition(() => setItems(list)))
      .catch(() => {})
  }, [])

  function update<K extends keyof ContaForm>(key: K, value: ContaForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function formatCard(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 19)
    return digits.replace(/(.{4})/g, "$1 ").trim()
  }

  async function salvar() {
    if (!form.nome || !form.nome.trim()) {
      setMensagem("Informe o nome")
      return
    }
    const tipoApi: AccountInput["type"] =
      form.tipo === "banco" ? "bank" : form.tipo === "cartao" ? "credit_card" : "wallet"
    try {
      await createAccount({
        name: form.nome.trim(),
        type: tipoApi,
        agency: form.agencia || undefined,
        account: form.conta || undefined,
        card_number: (form.numeroCartao || "").replace(/\D/g, "") || undefined,
        initial_balance: form.saldoInicial,
        available_limit: form.limiteDisponivel,
        active: form.ativo,
      })
      setMensagem("Conta salva")
      setForm({ id: "", nome: "", tipo: form.tipo, ativo: true })
      try {
        const list = await getAccounts()
        startTransition(() => setItems(list))
      } catch {}
    } catch {
      setMensagem("Falha ao salvar")
    }
  }

  function openEdit(id: string) {
    const rec = items.find((i) => i.id === id) || null
    setSelected(rec)
    setEdit(
      rec
        ? {
            name: rec.name,
            type: rec.type,
            agency: rec.agency ?? undefined,
            account: rec.account ?? undefined,
            card_number: rec.card_number ?? undefined,
            initial_balance: rec.initial_balance ?? undefined,
            available_limit: rec.available_limit ?? undefined,
            active: rec.active,
          }
        : null,
    )
    setOpen(true)
  }

  async function saveEdit() {
    if (!selected || !edit) return
    await updateAccount(selected.id, edit)
    setOpen(false)
    setSelected(null)
    setEdit(null)
    try {
      const list = await getAccounts()
      startTransition(() => setItems(list))
    } catch {}
  }

  async function remove(id: string) {
    const ok = typeof window !== "undefined" ? window.confirm("Excluir?") : true
    if (!ok) return
    await deleteAccount(id)
    try {
      const list = await getAccounts()
      startTransition(() => setItems(list))
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Contas</h2>
        <div className="flex gap-2">
          <Button onClick={salvar} disabled={!form.nome.trim()}>Salvar</Button>
        </div>
      </div>

      {mensagem && <div className="text-xs text-emerald-600">{mensagem}</div>}

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs">Nome</label>
            <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} />
          </div>
          <div>
            <label className="text-xs">Tipo</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.tipo}
              onChange={(e) => update("tipo", e.target.value as ContaForm["tipo"])}
            >
              <option value="banco">Banco</option>
              <option value="cartao">Cartão de Crédito</option>
              <option value="carteira">Carteira</option>
            </select>
          </div>
          <div>
            <label className="text-xs">Ativo</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.ativo ? "true" : "false"}
              onChange={(e) => update("ativo", e.target.value === "true")}
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          {form.tipo === "banco" && (
            <>
              <div>
                <label className="text-xs">Agência</label>
                <Input value={form.agencia ?? ""} onChange={(e) => update("agencia", e.target.value)} />
              </div>
              <div>
                <label className="text-xs">Conta</label>
                <Input value={form.conta ?? ""} onChange={(e) => update("conta", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs">Saldo inicial</label>
                <CurrencyInput value={form.saldoInicial} onValueChange={(v) => update("saldoInicial", v)} />
              </div>
            </>
          )}

          {form.tipo === "cartao" && (
            <>
              <div>
                <label className="text-xs">Número do cartão</label>
                <Input value={formatCard(form.numeroCartao ?? "")}
                  onChange={(e) => update("numeroCartao", formatCard(e.target.value))} />
              </div>
              <div>
                <label className="text-xs">Limite disponível</label>
                <CurrencyInput value={form.limiteDisponivel} onValueChange={(v) => update("limiteDisponivel", v)} />
              </div>
            </>
          )}

          {form.tipo === "carteira" && (
            <div className="md:col-span-2">
              <label className="text-xs">Saldo inicial</label>
              <CurrencyInput value={form.saldoInicial} onValueChange={(v) => update("saldoInicial", v)} />
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-2 text-sm font-medium">Contas cadastradas</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Agência</th>
              <th className="p-2 text-left">Conta</th>
              <th className="p-2 text-left">Cartão</th>
              <th className="p-2 text-left">Saldo Inicial</th>
              <th className="p-2 text-left">Limite</th>
              <th className="p-2 text-left">Ativo</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="p-2">{i.name}</td>
                <td className="p-2">{i.type === "bank" ? "Banco" : i.type === "credit_card" ? "Cartão" : "Carteira"}</td>
                <td className="p-2">{i.agency || "-"}</td>
                <td className="p-2">{i.account || "-"}</td>
                <td className="p-2">{i.card_number || "-"}</td>
                <td className="p-2">{typeof i.initial_balance === "number" ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(i.initial_balance || 0) : "-"}</td>
                <td className="p-2">{typeof i.available_limit === "number" ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(i.available_limit || 0) : "-"}</td>
                <td className="p-2">{i.active ? "Sim" : "Não"}</td>
                <td className="p-2">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(i.id)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(i.id)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-2 text-center text-muted-foreground" colSpan={9}>Nenhuma conta cadastrada</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-w-xl h-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Conta</SheetTitle>
          </SheetHeader>
          {edit && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div className="col-span-2">
                <div className="text-muted-foreground">Nome</div>
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Tipo</div>
                <select
                  className="bg-background h-9 w-full rounded-md border px-2"
                  value={edit.type}
                  onChange={(e) => setEdit({ ...edit, type: e.target.value as AccountInput["type"] })}
                >
                  <option value="bank">Banco</option>
                  <option value="credit_card">Cartão</option>
                  <option value="wallet">Carteira</option>
                </select>
              </div>
              <div>
                <div className="text-muted-foreground">Agência</div>
                <Input value={edit.agency || ""} onChange={(e) => setEdit({ ...edit, agency: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Conta</div>
                <Input value={edit.account || ""} onChange={(e) => setEdit({ ...edit, account: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Número do cartão</div>
                <Input value={formatCard(edit.card_number || "")} onChange={(e) => setEdit({ ...edit, card_number: e.target.value.replace(/\D/g, "") })} />
              </div>
              <div>
                <div className="text-muted-foreground">Saldo inicial</div>
                <CurrencyInput value={edit.initial_balance} onValueChange={(v) => setEdit({ ...edit, initial_balance: v })} />
              </div>
              <div>
                <div className="text-muted-foreground">Limite disponível</div>
                <CurrencyInput value={edit.available_limit} onValueChange={(v) => setEdit({ ...edit, available_limit: v })} />
              </div>
              <div>
                <div className="text-muted-foreground">Ativo</div>
                <select className="bg-background h-9 w-full rounded-md border px-2" value={String(edit.active)} onChange={(e) => setEdit({ ...edit, active: e.target.value === "true" })}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            </div>
          )}
          <SheetFooter>
            <div className="flex gap-2">
              <Button onClick={saveEdit}>Salvar</Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
