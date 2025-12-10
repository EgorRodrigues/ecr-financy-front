"use client"

import { useEffect, useState, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCategories, getSubcategories, getCostCenters, getContacts, getAccounts, createExpense, createIncome } from "@/lib/api"

type Income = {
  id: string
  tipo: "despesa" | "receita"
  dataEmissao?: string
  dataVencimento?: string
  parcelado?: boolean
  parcelas?: number
  categoria?: string
  categoriaId?: string
  subcategoria?: string
  subcategoriaId?: string
  centroCusto?: string
  centroCustoId?: string
  fornecedorCliente?: string
  fornecedorClienteId?: string
  descricao?: string
  documento?: string
  formaRecebimento?: string
  conta?: string
  contaId?: string
  valor: number
  status: "pendente" | "recebido" | "cancelado"
  recorrencia?: boolean
  competencia?: string
  projeto?: string
  tags?: string
  observacoes?: string
}

export default function CadastroReceitasPage() {
  const [form, setForm] = useState<Income>({
    id: "",
    tipo: "receita",
    valor: 0,
    status: "pendente",
    parcelado: false,
    parcelas: 1,
  })
  const [valorText, setValorText] = useState(
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0)
  )

  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Array<{ id: string; name: string }>>([])
  const [subcategorias, setSubcategorias] = useState<Array<{ id: string; name: string }>>([])
  const [centros, setCentros] = useState<Array<{ id: string; name: string; code?: string }>>([])
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([])
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(t)
  }, [mensagem])

  useEffect(() => {
    getCategories()
      .then((list) => startTransition(() => setCategorias(list)))
      .catch(() => {})
    getCostCenters()
      .then((list) => startTransition(() => setCentros(list)))
      .catch(() => {})
    getContacts()
      .then((list) => startTransition(() => setContacts(list.map((c) => ({ id: c.id, name: c.name })))) )
      .catch(() => {})
    getAccounts()
      .then((list) => startTransition(() => setAccounts(list.map((a) => ({ id: a.id, name: a.name })))) )
      .catch(() => {})
  }, [])

  function update<K extends keyof Income>(key: K, value: Income[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const negative = raw.includes("-")
    const digits = raw.replace(/\D/g, "")
    const cents = digits ? parseInt(digits, 10) : 0
    const value = (cents / 100) * (negative ? -1 : 1)
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
    setValorText(formatted)
    update("valor", value)
  }

  async function salvar() {
    setSalvando(true)
    try {
      const isParcelado = !!form.parcelado && (form.parcelas || 1) > 1
      if (isParcelado) {
        const n = Math.max(2, form.parcelas || 2)
        const total = Math.abs(form.valor || 0)
        const base = Math.floor((total * 100) / n)
        const amounts: number[] = Array.from({ length: n }, (_, i) => (i < n - 1 ? base : total * 100 - base * (n - 1))).map((c) => c / 100)
        const start = form.dataVencimento || new Date().toISOString().slice(0, 10)
        const startDate = new Date(start)
        const requests: Promise<unknown>[] = []
        for (let i = 0; i < n; i++) {
          const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate())
          const due = d.toISOString().slice(0, 10)
          const payload = {
            amount: form.tipo === "despesa" ? -Math.abs(amounts[i]) : Math.abs(amounts[i]),
            status: form.status,
            issue_date: form.dataEmissao,
            due_date: due,
            category_id: form.categoriaId,
            subcategory_id: form.subcategoriaId,
            cost_center_id: form.centroCustoId,
            contact_id: form.fornecedorClienteId,
            description: [form.descricao || "", `(parcela ${i + 1}/${n})`].filter(Boolean).join(" "),
            document: form.documento ? `${form.documento}-${i + 1}/${n}` : undefined,
            payment_method: form.formaRecebimento,
            account: form.contaId,
            recurrence: !!form.recorrencia,
            competence: form.competencia,
            project: form.projeto,
            tags: form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
            notes: form.observacoes,
            active: true,
          }
          requests.push(form.tipo === "receita" ? createIncome(payload) : createExpense(payload))
        }
        await Promise.all(requests)
        setMensagem("Parcelas salvas no backend")
      } else {
        const payload = {
          amount: form.valor,
          status: form.status,
          issue_date: form.dataEmissao,
          due_date: form.dataVencimento,
          category_id: form.categoriaId,
          subcategory_id: form.subcategoriaId,
          cost_center_id: form.centroCustoId,
          contact_id: form.fornecedorClienteId,
          description: form.descricao,
          document: form.documento,
          payment_method: form.formaRecebimento,
          account: form.contaId,
          recurrence: !!form.recorrencia,
          competence: form.competencia,
          project: form.projeto,
          tags: form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
          notes: form.observacoes,
          active: true,
        }
        if (form.tipo === "receita") {
          await createIncome(payload)
          setMensagem("Receita salva no backend")
        } else {
          await createExpense(payload)
          setMensagem("Despesa salva no backend")
        }
      }
      setForm({ id: "", tipo: form.tipo, valor: 0, status: "pendente", parcelado: false, parcelas: 1 })
      setValorText(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0))
    } catch {
      setMensagem("Falha ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Receitas</h2>
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
              onChange={(e) => update("tipo", e.target.value as Income["tipo"]) }
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>

          <div>
            <label className="text-xs">Valor</label>
            <Input
              type="text"
              inputMode="decimal"
              value={valorText}
              onChange={handleValorChange}
            />
          </div>

          <div>
            <label className="text-xs">Status</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.status}
              onChange={(e) => update("status", e.target.value as Income["status"]) }
            >
              <option value="pendente">Pendente</option>
              <option value="recebido">Recebido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="text-xs">Categoria</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.categoriaId ?? ""}
              onChange={async (e) => {
                const id = e.target.value
                const selected = categorias.find((c) => c.id === id)
                update("categoriaId", id)
                update("categoria", selected?.name || "")
                update("subcategoriaId", "")
                update("subcategoria", "")
                if (id) {
                  try {
                    const list = await getSubcategories(id)
                    startTransition(() => setSubcategorias(list))
                  } catch {}
                } else {
                  startTransition(() => setSubcategorias([]))
                }
              }}
            >
              <option value="">Selecione</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs">Subcategoria</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.subcategoriaId ?? ""}
              onChange={(e) => {
                const id = e.target.value
                const selected = subcategorias.find((s) => s.id === id)
                update("subcategoriaId", id)
                update("subcategoria", selected?.name || "")
              }}
            >
              <option value="">Selecione</option>
              {subcategorias.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs">Centro de Custo</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.centroCustoId ?? ""}
              onChange={(e) => {
                const id = e.target.value
                const selected = centros.find((cc) => cc.id === id)
                update("centroCustoId", id)
                update("centroCusto", selected?.name || "")
              }}
            >
              <option value="">Selecione</option>
              {centros.map((cc) => (
                <option key={cc.id} value={cc.id}>{cc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs">Cliente/Fornecedor</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.fornecedorClienteId ?? ""}
              onChange={(e) => {
                const id = e.target.value
                const selected = contacts.find((c) => c.id === id)
                update("fornecedorClienteId", id)
                update("fornecedorCliente", selected?.name || "")
              }}
            >
              <option value="">Selecione</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs">Documento/Nota</label>
            <Input value={form.documento ?? ""} onChange={(e) => update("documento", e.target.value)} />
          </div>

          <div>
            <label className="text-xs">Forma de Recebimento</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.formaRecebimento ?? ""}
              onChange={(e) => update("formaRecebimento", e.target.value)}
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
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.contaId ?? ""}
              onChange={(e) => {
                const id = e.target.value
                const selected = accounts.find((a) => a.id === id)
                update("contaId", id)
                update("conta", selected?.name || "")
              }}
            >
              <option value="">Selecione</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
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
            <label className="text-xs">Parcelado</label>
            <select
              className="bg-background h-10 w-full rounded-md border px-2"
              value={form.parcelado ? "sim" : "nao"}
              onChange={(e) => update("parcelado", e.target.value === "sim")}
            >
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </select>
          </div>

          {form.parcelado && (
            <div>
              <label className="text-xs">Número de Parcelas</label>
              <Input
                type="number"
                min={2}
                value={form.parcelas ?? 2}
                onChange={(e) => update("parcelas", Number(e.target.value))}
              />
            </div>
          )}

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
