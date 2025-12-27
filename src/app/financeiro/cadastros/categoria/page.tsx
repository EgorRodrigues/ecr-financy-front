"use client"

import { useEffect, useState, startTransition, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCategory, getCategories, updateCategory, deleteCategory, type CategoryInput } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { useSort } from "@/hooks/use-sort"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"

type Category = {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
}

export default function CadastroCategoriaPage() {
  const [form, setForm] = useState<Category>({ id: "", nome: "", descricao: "", ativo: true })
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [items, setItems] = useState<Array<{ id: string; name: string; description?: string; active?: boolean }>>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ id: string; name: string; description?: string; active?: boolean } | null>(null)
  const [edit, setEdit] = useState<CategoryInput | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

  const displayItems = useMemo(() => {
    return items.map((i) => ({
      ...i,
      displayActive: i.active ? "Sim" : "Não",
    }))
  }, [items])

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems)

  useEffect(() => {
    getCategories()
      .then((list) => startTransition(() => setItems(list.map((c) => ({ id: c.id, name: c.name, description: c.description, active: c.active })))) )
      .catch(() => {})
  }, [])

  function update<K extends keyof Category>(key: K, value: Category[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function salvar() {
    try {
      await createCategory({ name: form.nome, description: form.descricao, active: form.ativo })
      setMensagem("Categoria salva")
      setForm({ id: "", nome: "", descricao: "", ativo: true })
      try {
        const list = await getCategories()
        startTransition(() => setItems(list.map((c) => ({ id: c.id, name: c.name, description: c.description, active: c.active }))))
      } catch {}
    } catch {
      setMensagem("Falha ao salvar")
    }
  }

  function openEdit(id: string) {
    const rec = items.find((i) => i.id === id) || null
    setSelected(rec ? { id: rec.id, name: rec.name, description: rec.description, active: rec.active } : null)
    setEdit(rec ? { name: rec.name, description: rec.description, active: rec.active ?? true } : null)
    setOpen(true)
  }

  async function saveEdit() {
    if (!selected || !edit) return
    await updateCategory(selected.id, edit)
    setOpen(false)
    setSelected(null)
    setEdit(null)
    try {
      const list = await getCategories()
      startTransition(() => setItems(list.map((c) => ({ id: c.id, name: c.name, description: c.description, active: c.active }))))
    } catch {}
  }

  async function remove(id: string) {
    const ok = typeof window !== "undefined" ? window.confirm("Excluir?") : true
    if (!ok) return
    await deleteCategory(id)
    try {
      const list = await getCategories()
      startTransition(() => setItems(list.map((c) => ({ id: c.id, name: c.name, description: c.description, active: c.active }))))
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Categoria</h2>
        <div className="flex gap-2">
          <Button onClick={salvar}>Salvar</Button>
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
            <label className="text-xs">Ativo</label>
            <Select value={form.ativo ? "true" : "false"} onValueChange={(v) => update("ativo", v === "true")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs">Observações</label>
            <Textarea
              className="h-24 resize-none"
              value={form.descricao}
              onChange={(e) => update("descricao", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-2 text-sm font-medium">Categorias cadastradas</div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("name")}>
                Nome {sortConfig?.key === "name" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("description")}>
                Observações {sortConfig?.key === "description" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
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
                <td className="p-2">{i.name}</td>
                <td className="p-2">{i.description || "-"}</td>
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
                <td className="p-2 text-center text-muted-foreground" colSpan={4}>Nenhuma categoria cadastrada</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl h-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Categoria</SheetTitle>
          </SheetHeader>
          {edit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 text-sm">
              <div className="col-span-1 sm:col-span-2">
                <div className="text-muted-foreground">Nome</div>
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <div className="text-muted-foreground">Observações</div>
                <Textarea className="h-24 resize-none" value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Ativo</div>
                <Select value={String(edit.active)} onValueChange={(v) => setEdit({ ...edit, active: v === "true" })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
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
