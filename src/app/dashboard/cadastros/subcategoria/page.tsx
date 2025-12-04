"use client"

import { useEffect, useMemo, useState, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSubcategory, getCategories, getAllSubcategories } from "@/lib/api"

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
  const [items, setItems] = useState<Array<{ id: string; name: string; active?: boolean; category_id?: string }>>([])

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
        setItems(list)
      } catch {}
    } catch {
      setMensagem("Falha ao salvar")
    }
  }

  const categoriasOptions = useMemo(() => categorias, [categorias])

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
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Categoria</th>
              <th className="p-2 text-left">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const cat = categorias.find((c) => c.id === i.category_id)
              return (
                <tr key={i.id} className="border-b">
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{cat?.name || "-"}</td>
                  <td className="p-2">{i.active ? "Sim" : "Não"}</td>
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr>
                <td className="p-2 text-center text-muted-foreground" colSpan={3}>Nenhuma subcategoria cadastrada</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
