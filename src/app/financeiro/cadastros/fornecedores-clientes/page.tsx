"use client"

import { useEffect, useState, startTransition, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { useSort } from "@/hooks/use-sort"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createContact, getContacts, updateContact, deleteContact, type ContactInput, type Contact } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"

type Party = {
  id: string
  tipo: "fornecedor" | "cliente"
  pessoa: "fisica" | "juridica"
  nome: string
  cpf?: string
  cnpj?: string
  email?: string
  telefone?: string
  endereco?: string
  observacoes?: string
  ativo: boolean
}

export default function CadastroFornecedoresClientesPage() {
  const [form, setForm] = useState<Party>({
    id: "",
    tipo: "fornecedor",
    pessoa: "fisica",
    nome: "",
    ativo: true,
  })
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [items, setItems] = useState<Array<{
    id: string
    type: "supplier" | "customer"
    person_type: "individual" | "company"
    name: string
    document?: string
    email?: string
    phone_local?: string
    active: boolean
  }>>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [edit, setEdit] = useState<ContactInput | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

  useEffect(() => {
    getContacts()
      .then((list) => startTransition(() => setItems(list)))
      .catch(() => {})
  }, [])

  function update<K extends keyof Party>(key: K, value: Party[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function formatCPF(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    const p1 = digits.slice(0, 3)
    const p2 = digits.slice(3, 6)
    const p3 = digits.slice(6, 9)
    const p4 = digits.slice(9, 11)
    if (digits.length <= 3) return p1
    if (digits.length <= 6) return `${p1}.${p2}`
    if (digits.length <= 9) return `${p1}.${p2}.${p3}`
    return `${p1}.${p2}.${p3}-${p4}`
  }

  function formatCNPJ(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 14)
    const p1 = digits.slice(0, 2)
    const p2 = digits.slice(2, 5)
    const p3 = digits.slice(5, 8)
    const p4 = digits.slice(8, 12)
    const p5 = digits.slice(12, 14)
    if (digits.length <= 2) return p1
    if (digits.length <= 5) return `${p1}.${p2}`
    if (digits.length <= 8) return `${p1}.${p2}.${p3}`
    if (digits.length <= 12) return `${p1}.${p2}.${p3}/${p4}`
    return `${p1}.${p2}.${p3}/${p4}-${p5}`
  }

  function formatPhone(value: string) {
    const raw = value.replace(/\s+/g, "")
    const hasPlus = raw.startsWith("+")
    const digits = raw.replace(/\D/g, "").slice(0, 15)

    if (!digits) return hasPlus ? "+" : ""

    if (!hasPlus) {
      const ddd = digits.slice(0, 2)
      const pivot = digits.length >= 11 ? 7 : 6
      const part1 = digits.slice(2, Math.min(pivot, digits.length))
      const part2 = digits.slice(pivot)
      if (!ddd) return digits
      if (!part2) return `(${ddd}) ${part1}`
      return `(${ddd}) ${part1}-${part2}`
    }

    if (digits.length <= 3) {
      return `+${digits}`
    }

    const maxNational = digits.length >= 13 ? 11 : 10
    const ccLen = Math.min(Math.max(digits.length - maxNational, 1), 3)
    const cc = digits.slice(0, ccLen)
    const rest = digits.slice(ccLen)

    const area = rest.slice(0, 2)
    const pivot = rest.length >= 11 ? 7 : 6
    const part1 = rest.slice(2, Math.min(pivot, rest.length))
    const part2 = rest.slice(pivot)

    if (rest.length <= 2) return `+${cc} (${area}`.replace(/\($/, "(")
    if (!part2) return `+${cc} (${area}) ${part1}`
    return `+${cc} (${area}) ${part1}-${part2}`
  }

  function salvar() {
    if (!form.nome || !form.nome.trim()) {
      setMensagem("Informe o nome")
      return
    }
    setSalvando(true)
    ;(async () => {
      try {
        const onlyDigits = (s?: string) => (s || "").replace(/\D/g, "")
        const type = form.tipo === "fornecedor" ? "supplier" : "customer"
        const person_type = form.pessoa === "fisica" ? "individual" : "company"
        const document = form.pessoa === "fisica" ? onlyDigits(form.cpf) : onlyDigits(form.cnpj)
        const phoneLocal = form.telefone || ""
        const phoneE164 = phoneLocal.startsWith("+") ? `+${onlyDigits(phoneLocal)}` : undefined
        await createContact({
          type,
          person_type,
          name: form.nome.trim(),
          document: document || undefined,
          email: form.email || undefined,
          phone_e164: phoneE164,
          phone_local: phoneLocal || undefined,
          address: form.endereco || undefined,
          notes: form.observacoes || undefined,
          active: form.ativo,
        })
        setMensagem("Cadastro salvo")
        setForm({ id: "", tipo: form.tipo, pessoa: form.pessoa, nome: "", ativo: true })
        try {
          const list = await getContacts()
          startTransition(() => setItems(list.sort((a, b) => a.name.localeCompare(b.name))))
        } catch {}
      } catch {
        setMensagem("Falha ao salvar")
      } finally {
        setSalvando(false)
      }
    })()
  }

  function openEdit(id: string) {
    const rec = (items as Contact[]).find((i) => i.id === id) || null
    setSelected(rec)
    setEdit(rec ? {
      type: rec.type,
      person_type: rec.person_type,
      name: rec.name,
      document: rec.document,
      email: rec.email,
      phone_e164: rec.phone_e164,
      phone_local: rec.phone_local,
      address: rec.address,
      notes: rec.notes,
      active: rec.active,
    } : null)
    setOpen(true)
  }

  async function saveEdit() {
    if (!selected || !edit) return
    await updateContact(selected.id, edit)
    setOpen(false)
    setSelected(null)
    setEdit(null)
    try {
      const list = await getContacts()
      startTransition(() => setItems(list.sort((a, b) => a.name.localeCompare(b.name))))
    } catch {}
  }

  async function remove(id: string) {
    const ok = typeof window !== "undefined" ? window.confirm("Excluir?") : true
    if (!ok) return
    await deleteContact(id)
    try {
      const list = await getContacts()
      startTransition(() => setItems(list))
    } catch {}
  }

  const displayItems = useMemo(() => {
    return items.map((i) => ({
      ...i,
      displayType: i.type === "supplier" ? "Fornecedor" : "Cliente",
      displayPersonType: i.person_type === "individual" ? "Física" : "Jurídica",
      displayActive: i.active ? "Sim" : "Não",
    }))
  }, [items])

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Fornecedores e Clientes</h2>
        <div className="flex gap-2">
          <Button onClick={salvar} disabled={salvando || !form.nome.trim()}>Salvar</Button>
        </div>
      </div>

      {mensagem && <div className="text-xs text-emerald-600">{mensagem}</div>}

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs">Tipo</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.tipo}
              onChange={(e) => update("tipo", e.target.value as Party["tipo"])}
            >
              <option value="fornecedor">Fornecedor</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>

          <div>
            <label className="text-xs">Pessoa</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.pessoa}
              onChange={(e) => update("pessoa", e.target.value as Party["pessoa"])}
            >
              <option value="fisica">Pessoa Física</option>
              <option value="juridica">Pessoa Jurídica</option>
            </select>
          </div>

          <div>
            <label className="text-xs">Nome</label>
            <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} />
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

          {form.pessoa === "fisica" && (
            <div>
              <label className="text-xs">CPF</label>
              <Input
                inputMode="numeric"
                value={form.cpf ?? ""}
                onChange={(e) => update("cpf", formatCPF(e.target.value))}
              />
            </div>
          )}

          {form.pessoa === "juridica" && (
            <div>
              <label className="text-xs">CNPJ</label>
              <Input
                inputMode="numeric"
                value={form.cnpj ?? ""}
                onChange={(e) => update("cnpj", formatCNPJ(e.target.value))}
              />
            </div>
          )}

          <div>
            <label className="text-xs">E-mail</label>
            <Input type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} />
          </div>

          <div>
            <label className="text-xs">Telefone</label>
            <Input inputMode="tel" value={form.telefone ?? ""} onChange={(e) => update("telefone", formatPhone(e.target.value))} />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs">Endereço</label>
            <Input value={form.endereco ?? ""} onChange={(e) => update("endereco", e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs">Observações</label>
            <textarea
              className="bg-background h-24 w-full rounded-md border px-2 py-2 text-sm"
              value={form.observacoes ?? ""}
              onChange={(e) => update("observacoes", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-2 text-sm font-medium">Contatos cadastrados</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("displayType")}>
                Tipo {sortConfig?.key === "displayType" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("displayPersonType")}>
                Pessoa {sortConfig?.key === "displayPersonType" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("name")}>
                Nome {sortConfig?.key === "name" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("document")}>
                Documento {sortConfig?.key === "document" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("phone_local")}>
                Telefone {sortConfig?.key === "phone_local" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("email")}>
                E-mail {sortConfig?.key === "email" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("displayActive")}>
                Ativo {sortConfig?.key === "displayActive" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="p-2">{i.displayType}</td>
                <td className="p-2">{i.displayPersonType}</td>
                <td className="p-2">{i.name}</td>
                <td className="p-2">{i.document || "-"}</td>
                <td className="p-2">{i.phone_local || "-"}</td>
                <td className="p-2">{i.email || "-"}</td>
                <td className="p-2">{i.displayActive}</td>
                <td className="p-2">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(i.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(i.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-2 text-center text-muted-foreground" colSpan={8}>Nenhum contato cadastrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-w-xl h-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Contato</SheetTitle>
          </SheetHeader>
          {edit && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div>
                <div className="text-muted-foreground">Tipo</div>
                <select className="bg-background h-9 w-full rounded-md border px-2" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as ContactInput["type"] })}>
                  <option value="supplier">Fornecedor</option>
                  <option value="customer">Cliente</option>
                </select>
              </div>
              <div>
                <div className="text-muted-foreground">Pessoa</div>
                <select className="bg-background h-9 w-full rounded-md border px-2" value={edit.person_type} onChange={(e) => setEdit({ ...edit, person_type: e.target.value as ContactInput["person_type"] })}>
                  <option value="individual">Física</option>
                  <option value="company">Jurídica</option>
                </select>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Nome</div>
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              {edit.person_type === "individual" && (
                <div className="col-span-2">
                  <div className="text-muted-foreground">CPF</div>
                  <Input
                    inputMode="numeric"
                    value={edit.document || ""}
                    onChange={(e) => setEdit({ ...edit, document: formatCPF(e.target.value) })}
                  />
                </div>
              )}
              {edit.person_type === "company" && (
                <div className="col-span-2">
                  <div className="text-muted-foreground">CNPJ</div>
                  <Input
                    inputMode="numeric"
                    value={edit.document || ""}
                    onChange={(e) => setEdit({ ...edit, document: formatCNPJ(e.target.value) })}
                  />
                </div>
              )}
              <div>
                <div className="text-muted-foreground">E-mail</div>
                <Input type="email" value={edit.email || ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Telefone</div>
                <Input inputMode="tel" value={edit.phone_local || ""} onChange={(e) => setEdit({ ...edit, phone_local: formatPhone(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Endereço</div>
                <Input value={edit.address || ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} />
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Observações</div>
                <Input value={edit.notes || ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
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
