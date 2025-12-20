"use client"

import { useEffect, useState, startTransition, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createCostCenter, getCostCenters, updateCostCenter, deleteCostCenter, type CostCenterInput } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { useSort } from "@/hooks/use-sort"
import { ArrowUpDown } from "lucide-react"

type CostCenter = {
  id: string
  codigo?: string
  nome: string
  descricao?: string
  ativo: boolean
}

export default function CadastroCentroCustosPage() {
  const [form, setForm] = useState<CostCenter>({ id: "", codigo: "", nome: "", descricao: "", ativo: true })
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [items, setItems] = useState<Array<{ id: string; name: string; code?: string; active?: boolean }>>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ id: string; name: string; code?: string; description?: string; active?: boolean } | null>(null)
  const [edit, setEdit] = useState<CostCenterInput | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

  useEffect(() => {
    getCostCenters()
      .then((list) => startTransition(() => setItems(list)))
      .catch(() => {})
  }, [])

  const displayItems = useMemo(() => {
    return items.map((i) => ({
      ...i,
      displayActive: i.active ? "Sim" : "Não",
    }))
  }, [items])

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems)

  function update<K extends keyof CostCenter>(key: K, value: CostCenter[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function salvar() {
    try {
      await createCostCenter({ code: form.codigo, name: form.nome, description: form.descricao, active: form.ativo })
      setMensagem("Centro de custos salvo")
      setForm({ id: "", codigo: "", nome: "", descricao: "", ativo: true })
      try {
        const list = await getCostCenters()
        startTransition(() => setItems(list))
      } catch {}
    } catch {
      setMensagem("Falha ao salvar")
    }
  }

  function openEdit(id: string) {
    const rec = items.find((i) => i.id === id) || null
    setSelected(rec ? { id: rec.id, name: rec.name, code: rec.code, active: rec.active } : null)
    setEdit(rec ? { name: rec.name, code: rec.code, description: undefined, active: rec.active ?? true } : null)
    setOpen(true)
  }

  async function saveEdit() {
    if (!selected || !edit) return
    await updateCostCenter(selected.id, edit)
    setOpen(false)
    setSelected(null)
    setEdit(null)
    try {
      const list = await getCostCenters()
      startTransition(() => setItems(list))
    } catch {}
  }

  async function remove(id: string) {
    const ok = typeof window !== "undefined" ? window.confirm("Excluir?") : true
    if (!ok) return
    await deleteCostCenter(id)
    try {
      const list = await getCostCenters()
      setItems(list)
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Centro de Custos</h2>
        <div className="flex gap-2">
          <Button onClick={salvar}>Salvar</Button>
        </div>
      </div>

      {mensagem && <div className="text-xs text-emerald-600">{mensagem}</div>}

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs">Código</label>
            <Input value={form.codigo ?? ""} onChange={(e) => update("codigo", e.target.value)} />
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
          <div className="md:col-span-2">
            <label className="text-xs">Descrição</label>
            <textarea
              className="bg-background h-24 w-full rounded-md border px-2 py-2 text-sm"
              value={form.descricao}
              onChange={(e) => update("descricao", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-2 text-sm font-medium">Centros de custos cadastrados</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("code")}>
                Código {sortConfig?.key === "code" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("name")}>
                Nome {sortConfig?.key === "name" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
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
                <td className="p-2">{i.code || "-"}</td>
                <td className="p-2">{i.name}</td>
                <td className="p-2">{i.displayActive}</td>
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
                <td className="p-2 text-center text-muted-foreground" colSpan={4}>Nenhum centro de custos cadastrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-w-xl h-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Centro de Custos</SheetTitle>
          </SheetHeader>
          {edit && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div>
                <div className="text-muted-foreground">Código</div>
                <Input value={edit.code || ""} onChange={(e) => setEdit({ ...edit, code: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Nome</div>
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Descrição</div>
                <Input value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
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
