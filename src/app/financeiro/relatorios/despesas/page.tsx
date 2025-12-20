"use client"

import { useEffect, useMemo, useState, startTransition } from "react"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSort } from "@/hooks/use-sort"

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

export default function RelatorioDespesasPage() {
  const [items, setItems] = useState<Expense[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("financy_expenses")
      const list: Expense[] = raw ? JSON.parse(raw) : []
      startTransition(() => setItems(list))
    } catch {}
  }, [])

  const totalDespesa = useMemo(() => items.filter(i => i.tipo === "despesa").reduce((acc, i) => acc + i.valor, 0), [items])
  const totalReceita = useMemo(() => items.filter(i => i.tipo === "receita").reduce((acc, i) => acc + i.valor, 0), [items])

  const displayItems = useMemo(() => {
    return items.map((i) => ({
      ...i,
      displayDate: i.dataPagamento || i.dataVencimento || i.dataEmissao || "",
      displayCategory: [i.categoria, i.subcategoria].filter(Boolean).join(" / "),
    }))
  }, [items])

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems)

  function printReport() {
    window.print()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-sm font-medium">Relatório de Despesas</h2>
        <div className="flex gap-2">
          <Button asChild variant="outline"><a href="/dashboard/cadastro-despesas">Cadastrar</a></Button>
          <Button onClick={printReport}>Exportar PDF</Button>
        </div>
      </div>

      <div className="print:p-0 print:bg-white">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Total Despesas</div>
            <div className="mt-1 text-2xl font-semibold">{totalDespesa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Total Receitas</div>
            <div className="mt-1 text-2xl font-semibold">{totalReceita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Saldo</div>
            <div className="mt-1 text-2xl font-semibold">{(totalReceita - totalDespesa).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          </Card>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-sm font-medium">Itens</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("tipo")}>
                  Tipo {sortConfig?.key === "tipo" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </th>
                <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("displayDate")}>
                  Data {sortConfig?.key === "displayDate" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </th>
                <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("displayCategory")}>
                  Categoria {sortConfig?.key === "displayCategory" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </th>
                <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("descricao")}>
                  Descrição {sortConfig?.key === "descricao" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </th>
                <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("documento")}>
                  Documento {sortConfig?.key === "documento" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </th>
                <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("formaPagamento")}>
                  Forma {sortConfig?.key === "formaPagamento" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </th>
                <th className="p-2 text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("valor")}>
                  Valor {sortConfig?.key === "valor" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </th>
                <th className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("status")}>
                  Status {sortConfig?.key === "status" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="p-2">{i.tipo}</td>
                  <td className="p-2">{i.displayDate || "-"}</td>
                  <td className="p-2">{i.displayCategory}</td>
                  <td className="p-2">{i.descricao}</td>
                  <td className="p-2">{i.documento}</td>
                  <td className="p-2">{i.formaPagamento}</td>
                  <td className="p-2 text-right">{i.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td className="p-2">{i.status}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-2 text-center text-muted-foreground" colSpan={8}>Nenhum item cadastrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
