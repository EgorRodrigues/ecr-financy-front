"use client"

import { useEffect, useMemo, useState, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSubcategory, getCategories, getAllSubcategories, updateSubcategory, deleteSubcategory, type SubcategoryInput } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { useSort } from "@/hooks/use-sort"
import { ArrowUpDown } from "lucide-react"

type Category = { id: string; name: string }
type Subcategory = {
  id: string
  nome: string
  categoriaId: string
  descricao?: string
  ativo: boolean
}

export default function CadastroSubcategoriaPage() {
  const [form, setForm] = useState<Subcategory>({ id: "", nome: "", categoriaId: "", descricao: "", ativo: true })
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Category[]>([])
  const [items, setItems] = useState<Array<{ id: string; name: string; description?: string; active?: boolean; category_id?: string }>>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ id: string; name: string; description?: string; active?: boolean; category_id?: string } | null>(null)
  const [edit, setEdit] = useState<SubcategoryInput | null>(null)

  useEffect(() => {
    getCategories()
      .then((list) => startTransition(() => setCategorias(list)))
      .catch(() => {})
    getAllSubcategories()
      .then((list) => startTransition(() => setItems(list)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

  function update<K extends keyof Subcategory>(key: K, value: Subcategory[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function salvar() {
    try {
      await createSubcategory({
        name: form.nome,
        description: form.descricao,
        active: form.ativo,
        category_id: form.categoriaId,
      })
      setMensagem("Subcategoria salva")
      setForm({ id: "", nome: "", categoriaId: "", descricao: "", ativo: true })
      try {
        const list = await getAllSubcategories()
        startTransition(() => setItems(list))
      } catch {}
    } catch {
      setMensagem("Falha ao salvar")
    }
  }

  function openEdit(id: string) {
    const rec = items.find((i) => i.id === id) || null
    setSelected(rec ?? null)
    setEdit(rec ? { name: rec.name, description: rec.description, active: rec.active ?? true, category_id: rec.category_id || "" } : null)
    setOpen(true)
  }

  async function saveEdit() {
    if (!selected || !edit) return
    const catId = edit.category_id || selected.category_id || ""
    await updateSubcategory(catId, selected.id, edit)
    setOpen(false)
    setSelected(null)
    setEdit(null)
    try {
      const list = await getAllSubcategories()
      startTransition(() => setItems(list))
    } catch {}
  }

  async function remove(id: string) {
    const ok = typeof window !== "undefined" ? window.confirm("Excluir?") : true
    if (!ok) return
    const rec = items.find((i) => i.id === id)
    const catId = rec?.category_id || ""
    await deleteSubcategory(catId, id)
    try {
      const list = await getAllSubcategories()
      startTransition(() => setItems(list))
    } catch {}
  }

  const categoriasOptions = useMemo(() => categorias, [categorias])

  const displayItems = useMemo(() => {
    return items.map((i) => {
      const cat = categorias.find((c) => c.id === i.category_id)
      return {
        ...i,
        displayCategory: cat ? cat.name : "-",
        displayActive: i.active ? "Sim" : "Não",
      }
    })
  }, [items, categorias])

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Subcategoria</h2>
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
            <label className="text-xs">Categoria</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.categoriaId}
              onChange={(e) => update("categoriaId", e.target.value)}
            >
              <option value="">Selecione</option>
              {categoriasOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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
        <div className="mb-2 text-sm font-medium">Subcategorias cadastradas</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("name")}>
                Nome {sortConfig?.key === "name" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("displayCategory")}>
                Categoria {sortConfig?.key === "displayCategory" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("displayActive")}>
                Ativo {sortConfig?.key === "displayActive" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((i) => {
              return (
                <tr key={i.id} className="border-b">
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{i.displayCategory}</td>
                  <td className="p-2">{i.displayActive}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(i.id)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(i.id)}>Excluir</Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr>
                <td className="p-2 text-center text-muted-foreground" colSpan={4}>Nenhuma subcategoria cadastrada</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="max-w-xl h-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Subcategoria</SheetTitle>
          </SheetHeader>
          {edit && (
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <div className="col-span-2">
                <div className="text-muted-foreground">Nome</div>
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div>
                <div className="text-muted-foreground">Categoria</div>
                <select className="bg-background h-9 w-full rounded-md border px-2" value={edit.category_id} onChange={(e) => setEdit({ ...edit, category_id: e.target.value })}>
                  <option value="">Selecione</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
