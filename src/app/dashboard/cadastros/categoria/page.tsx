"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createCategory, getCategories } from "@/lib/api"

type Category = {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
}

export default function CadastroCategoriaPage() {
  const [form, setForm] = useState<Category>({ id: "", nome: "", descricao: "", ativo: true })
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [items, setItems] = useState<Array<{ id: string; name: string; active?: boolean }>>([])

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

  useEffect(() => {
    getCategories()
      .then((list) => setItems(list.map((c) => ({ id: c.id, name: c.name, active: c.active }))))
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
        setItems(list.map((c) => ({ id: c.id, name: c.name, active: c.active })))
      } catch {}
    } catch {
      setMensagem("Falha ao salvar")
    }
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
        <div className="mb-2 text-sm font-medium">Categorias cadastradas</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="p-2">{i.name}</td>
                <td className="p-2">{i.active === false ? "Não" : "Sim"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-2 text-center text-muted-foreground" colSpan={2}>Nenhuma categoria cadastrada</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
