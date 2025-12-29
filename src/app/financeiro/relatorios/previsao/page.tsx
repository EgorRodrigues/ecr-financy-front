"use client"

import { useMemo, useState, useEffect, startTransition } from "react"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSort } from "@/hooks/use-sort"
import { ArrowUpDown, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { getFinancialForecast, type ForecastItem } from "@/lib/api"

function ForecastChart({ data }: { data: ForecastItem[] }) {
  // Aggregate by month and type
  const aggregated = useMemo(() => {
    const months = Array.from(new Set(data.map(d => d.month))).sort()
    
    return months.map(month => {
      const monthData = data.filter(d => d.month === month)
      const income = monthData.filter(d => d.type === "income").reduce((acc, curr) => acc + curr.amount, 0)
      const expense = monthData.filter(d => d.type === "expense").reduce((acc, curr) => acc + curr.amount, 0)
      return { month, income, expense }
    })
  }, [data])

  if (aggregated.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Nenhum dado para exibir no gráfico neste período
      </div>
    )
  }

  const width = 700
  const height = 300
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const maxIncome = Math.max(1, ...aggregated.map(d => d.income))
  const maxExpense = Math.max(1, ...aggregated.map(d => d.expense))
  const maxValue = Math.max(maxIncome, maxExpense) * 1.1 // Add 10% headroom

  // Helper to generate path
  const generatePath = (type: "income" | "expense") => {
    const points = aggregated.map((d, i) => {
      const x = padding + (i / (aggregated.length - 1 || 1)) * chartWidth
      const val = type === "income" ? d.income : d.expense
      const y = padding + chartHeight - (val / maxValue) * chartHeight
      return { x, y, val, month: d.month }
    })

    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    
    return { linePath, areaPath, points }
  }

  const incomeData = generatePath("income")
  const expenseData = generatePath("expense")

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[300px] w-full min-w-[500px]">
        {/* Gradients */}
        <defs>
          <linearGradient id="gradient-income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient-expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padding + chartHeight - t * chartHeight
          return (
            <line key={t} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
          )
        })}

        {/* Income Chart */}
        <path d={incomeData.areaPath} fill="url(#gradient-income)" />
        <path d={incomeData.linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Expense Chart */}
        <path d={expenseData.areaPath} fill="url(#gradient-expense)" />
        <path d={expenseData.linePath} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points and Labels */}
        {incomeData.points.map((p) => {
          const [year, month] = p.month.split("-")
          const date = new Date(parseInt(year), parseInt(month) - 1, 1)
          const label = date.toLocaleString("pt-BR", { month: "short", year: "2-digit" })
          
          return (
            <g key={`income-${p.month}`}>
              <circle cx={p.x} cy={p.y} r={4} fill="#ffffff" stroke="#10b981" strokeWidth="2" />
              <text x={p.x} y={height - 10} textAnchor="middle" fontSize={11} fill="#6b7280">
                {label}
              </text>
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={10} fill="#059669" fontWeight="500">
                {p.val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </text>
            </g>
          )
        })}

        {expenseData.points.map((p) => (
          <g key={`expense-${p.month}`}>
            <circle cx={p.x} cy={p.y} r={4} fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
            <text x={p.x} y={p.y + 20} textAnchor="middle" fontSize={10} fill="#dc2626" fontWeight="500">
              {p.val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-muted-foreground">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-muted-foreground">Despesas</span>
        </div>
      </div>
    </div>
  )
}

export default function PrevisaoFinanceiraPage() {
  const [items, setItems] = useState<ForecastItem[]>([])
  const [monthsRange, setMonthsRange] = useState("6")
  
  const { items: sortedItems, requestSort, sortConfig } = useSort(items)

  useEffect(() => {
    // Calculate date range: current month to selected months ahead
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + parseInt(monthsRange), 0) // Last day of target month

    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    getFinancialForecast(formatDate(start), formatDate(end))
      .then((data) => {
        if (data) {
          startTransition(() => setItems(data))
        }
      })
      .catch((err) => {
        console.error("Failed to fetch forecast:", err)
      })
  }, [monthsRange])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Previsão Financeira</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={monthsRange} onValueChange={setMonthsRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="9">9 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Fluxo Previsto (Receitas vs Despesas)</h3>
          <p className="text-sm text-muted-foreground">
            Comparativo de entradas e saídas previstas para os próximos meses.
          </p>
        </div>
        <ForecastChart data={items} />
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Detalhamento</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("month")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                Mês {sortConfig?.key === "month" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead onClick={() => requestSort("type")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                Tipo {sortConfig?.key === "type" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead onClick={() => requestSort("category")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                Categoria {sortConfig?.key === "category" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="cursor-pointer hover:bg-muted/50 transition-colors">
                Status {sortConfig?.key === "status" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => requestSort("amount")}>
                Valor Previsto {sortConfig?.key === "amount" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma previsão encontrada para o período.
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.month}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.type === "income" ? (
                        <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={item.type === "income" ? "text-emerald-600" : "text-red-600"}>
                        {item.type === "income" ? "Receita" : "Despesa"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "confirmado" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.status === "confirmado" ? "Confirmado" : "Projetado"}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${item.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                    {item.type === "expense" ? "- " : "+ "}
                    {item.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
