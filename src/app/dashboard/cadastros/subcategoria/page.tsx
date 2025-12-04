"use client"

import { useEffect, useMemo, useState, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Category = { id: string; nome: string }
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem("financy_categories")
      const list: Category[] = raw ? JSON.parse(raw) : []
      startTransition(() => setCategorias(list.map((c) => ({ id: c.id, nome: c.nome }))))
    } catch {}
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

  function update<K extends keyof Subcategory>(key: K, value: Subcategory[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function salvar() {
    try {
      const raw = localStorage.getItem("financy_subcategories")
      const list: Subcategory[] = raw ? JSON.parse(raw) : []
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      const next = [{ ...form, id }, ...list]
      localStorage.setItem("financy_subcategories", JSON.stringify(next))
      setMensagem("Subcategoria salva")
      setForm({ id: "", nome: "", categoriaId: "", descricao: "", ativo: true })
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
                <option key={c.id} value={c.id}>{c.nome}</option>
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
    </div>
  )
}
