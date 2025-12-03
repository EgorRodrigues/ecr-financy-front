"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Expense = {
  id: string
  tipo: "despesa" | "receita"
  dataEmissao?: string
  dataVencimento?: string
  dataPagamento?: string
  categoria?: string
  subcategoria?: string
  centroCusto?: string
  fornecedorCliente?: string
  descricao?: string
  documento?: string
  formaPagamento?: string
  conta?: string
  valor: number
  status: "pendente" | "pago" | "cancelado"
  recorrencia?: boolean
  competencia?: string
  projeto?: string
  tags?: string
  observacoes?: string
}

export default function CadastroDespesasPage() {
  const [form, setForm] = useState<Expense>({
    id: "",
    tipo: "despesa",
    valor: 0,
    status: "pendente",
  })

  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

  function update<K extends keyof Expense>(key: K, value: Expense[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function salvar() {
    setSalvando(true)
    try {
      const raw = localStorage.getItem("financy_expenses")
      const list: Expense[] = raw ? JSON.parse(raw) : []
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      const next = [{ ...form, id }, ...list]
      localStorage.setItem("financy_expenses", JSON.stringify(next))
      setMensagem("Despesa salva. Acesse Relatórios para exportar.")
      setForm({ id: "", tipo: form.tipo, valor: 0, status: "pendente" })
    } catch {
      setMensagem("Falha ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Despesas</h2>
        <div className="flex gap-2">
          <Button onClick={salvar} disabled={salvando}>Salvar</Button>
          <Button asChild variant="outline">
            <a href="/dashboard/relatorios/despesas">Ir para Relatório</a>
          </Button>
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
              onChange={(e) => update("tipo", e.target.value as Expense["tipo"]) }
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>

          <div>
            <label className="text-xs">Valor</label>
            <Input
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) => update("valor", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs">Status</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.status}
              onChange={(e) => update("status", e.target.value as Expense["status"]) }
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="text-xs">Categoria</label>
            <Input value={form.categoria ?? ""} onChange={(e) => update("categoria", e.target.value)} />
          </div>

          <div>
            <label className="text-xs">Subcategoria</label>
            <Input value={form.subcategoria ?? ""} onChange={(e) => update("subcategoria", e.target.value)} />
          </div>

          <div>
            <label className="text-xs">Centro de Custo</label>
            <Input value={form.centroCusto ?? ""} onChange={(e) => update("centroCusto", e.target.value)} />
          </div>

          <div>
            <label className="text-xs">Fornecedor/Cliente</label>
            <Input value={form.fornecedorCliente ?? ""} onChange={(e) => update("fornecedorCliente", e.target.value)} />
          </div>

          <div>
            <label className="text-xs">Documento/Nota</label>
            <Input value={form.documento ?? ""} onChange={(e) => update("documento", e.target.value)} />
          </div>

          <div>
            <label className="text-xs">Forma de Pagamento</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.formaPagamento ?? ""}
              onChange={(e) => update("formaPagamento", e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="pix">PIX</option>
              <option value="boleto">Boleto</option>
              <option value="cartao">Cartão</option>
              <option value="transferencia">Transferência</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>

          <div>
            <label className="text-xs">Conta</label>
            <Input value={form.conta ?? ""} onChange={(e) => update("conta", e.target.value)} />
          </div>

          <div>
            <label className="text-xs">Competência (AAAA-MM)</label>
            <Input value={form.competencia ?? ""} onChange={(e) => update("competencia", e.target.value)} placeholder="2025-12" />
          </div>

          <div>
            <label className="text-xs">Projeto</label>
            <Input value={form.projeto ?? ""} onChange={(e) => update("projeto", e.target.value)} />
          </div>

          <div>
            <label className="text-xs">Tags</label>
            <Input value={form.tags ?? ""} onChange={(e) => update("tags", e.target.value)} placeholder="separe por vírgula" />
          </div>

          <div>
            <label className="text-xs">Data de Emissão</label>
            <Input type="date" value={form.dataEmissao ?? ""} onChange={(e) => update("dataEmissao", e.target.value)} />
          </div>
          <div>
            <label className="text-xs">Data de Vencimento</label>
            <Input type="date" value={form.dataVencimento ?? ""} onChange={(e) => update("dataVencimento", e.target.value)} />
          </div>
          <div>
            <label className="text-xs">Data de Pagamento</label>
            <Input type="date" value={form.dataPagamento ?? ""} onChange={(e) => update("dataPagamento", e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs">Descrição</label>
            <textarea
              className="bg-background h-24 w-full rounded-md border px-2 py-2 text-sm"
              value={form.descricao ?? ""}
              onChange={(e) => update("descricao", e.target.value)}
            />
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
