"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

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
    const digits = value.replace(/\D/g, "").slice(0, 11)
    const ddd = digits.slice(0, 2)
    const pivot = digits.length >= 11 ? 7 : 6
    const part1 = digits.slice(2, Math.min(pivot, digits.length))
    const part2 = digits.slice(pivot)
    if (!ddd) return digits
    if (!part2) return `(${ddd}) ${part1}`
    return `(${ddd}) ${part1}-${part2}`
  }

  function salvar() {
    if (!form.nome || !form.nome.trim()) {
      setMensagem("Informe o nome")
      return
    }
    setSalvando(true)
    try {
      const raw = localStorage.getItem("financy_parties")
      const list: Party[] = raw ? JSON.parse(raw) : []
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      const next = [{ ...form, id }, ...list]
      localStorage.setItem("financy_parties", JSON.stringify(next))
      setMensagem("Cadastro salvo")
      setForm({ id: "", tipo: form.tipo, pessoa: form.pessoa, nome: "", ativo: true })
    } catch {
      setMensagem("Falha ao salvar")
    } finally {
      setSalvando(false)
    }
  }

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
    </div>
  )
}
