"use client"

import { useMemo, useState, useEffect, startTransition, useRef } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(700)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          // Use contentBoxSize for precise width
          setWidth(entry.contentBoxSize[0].inlineSize)
        } else {
          // Fallback
          setWidth(entry.contentRect.width)
        }
      }
    })
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Aggregate by month and type
  const aggregated = useMemo(() => {
    const months = Array.from(new Set(data.map(d => d.month))).sort()
    
    return months.map(month => {
      const monthData = data.filter(d => d.month === month)
      const income = monthData.filter(d => d.type === "income").reduce((acc, curr) => acc + curr.amount, 0)
      const expense = monthData.filter(d => d.type === "expense").reduce((acc, curr) => acc + curr.amount, 0)
      const balance = income - expense
      return { month, income, expense, balance }
    })
  }, [data])

  if (aggregated.length === 0) {
    return (
      <div className="flex h-[450px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Nenhum dado para exibir no gráfico neste período
      </div>
    )
  }

  const height = 450 // Increased height for better visibility
  const padding = 40
  const chartWidth = Math.max(width, 500) - padding * 2 // Ensure minimum width
  const chartHeight = height - padding * 2
  
  const maxIncome = Math.max(0, ...aggregated.map(d => d.income))
  const maxExpense = Math.max(0, ...aggregated.map(d => d.expense))
  const maxBalance = Math.max(0, ...aggregated.map(d => d.balance))
  const minBalance = Math.min(0, ...aggregated.map(d => d.balance))
  
  const maxValue = Math.max(maxIncome, maxExpense, maxBalance) * 1.1
  const minValue = Math.min(0, minBalance) * 1.1 // Add 10% headroom for negative values
  const range = (maxValue - minValue) || 1

  const getY = (val: number) => padding + chartHeight - ((val - minValue) / range) * chartHeight
  const zeroY = getY(0)

  // Helper to generate path
  const generatePath = (type: "income" | "expense" | "balance") => {
    const points = aggregated.map((d, i) => {
      const x = padding + (i / (aggregated.length - 1 || 1)) * chartWidth
      let val = 0
      
      if (type === "balance") {
        val = d.balance
      } else {
        val = type === "income" ? d.income : d.expense
      }
      
      const y = getY(val)
      return { x, y, val, month: d.month }
    })

    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`
    
    return { linePath, areaPath, points }
  }

  const incomeData = generatePath("income")
  const expenseData = generatePath("expense")
  const balanceData = generatePath("balance")

  return (
    <div className="w-full" ref={containerRef}>
      <svg viewBox={`0 0 ${Math.max(width, 500)} ${height}`} className="w-full h-[450px]">
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
            <line key={t} x1={padding} y1={y} x2={Math.max(width, 500) - padding} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
          )
        })}
        
        {/* Zero line */}
        <line x1={padding} y1={zeroY} x2={Math.max(width, 500) - padding} y2={zeroY} stroke="#9ca3af" strokeWidth="1" />

        {/* Income Chart */}
        <path d={incomeData.areaPath} fill="url(#gradient-income)" />
        <path d={incomeData.linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Expense Chart */}
        <path d={expenseData.areaPath} fill="url(#gradient-expense)" />
        <path d={expenseData.linePath} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Balance Chart (Line Only) */}
        <path d={balanceData.linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" />

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

        {/* Balance Points */}
        {balanceData.points.map((p) => (
          <g key={`balance-${p.month}`}>
            <circle cx={p.x} cy={p.y} r={3} fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
            <text x={p.x + 10} y={p.y - 5} textAnchor="start" fontSize={10} fill="#2563eb" fontWeight="500">
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
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-dashed" />
          <span className="text-sm text-muted-foreground">Saldo (Entrada - Saída)</span>
        </div>
      </div>
    </div>
  )
}

function AccumulatedBalanceChart({ data }: { data: ForecastItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(700)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          setWidth(entry.contentBoxSize[0].inlineSize)
        } else {
          setWidth(entry.contentRect.width)
        }
      }
    })
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const aggregated = useMemo(() => {
    const months = Array.from(new Set(data.map(d => d.month))).sort()
    let runningBalance = 0
    
    return months.map(month => {
      const monthData = data.filter(d => d.month === month)
      const income = monthData.filter(d => d.type === "income").reduce((acc, curr) => acc + curr.amount, 0)
      const expense = monthData.filter(d => d.type === "expense").reduce((acc, curr) => acc + curr.amount, 0)
      runningBalance += (income - expense)
      return { month, value: runningBalance }
    })
  }, [data])

  if (aggregated.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Nenhum dado para exibir no gráfico neste período
      </div>
    )
  }

  const height = 350
  const padding = 40
  const chartWidth = Math.max(width, 500) - padding * 2
  const chartHeight = height - padding * 2
  
  const maxVal = Math.max(0, ...aggregated.map(d => d.value))
  const minVal = Math.min(0, ...aggregated.map(d => d.value))
  
  const maxValue = maxVal * 1.1
  const minValue = minVal * 1.1
  const range = (maxValue - minValue) || 1

  const getY = (val: number) => padding + chartHeight - ((val - minValue) / range) * chartHeight
  const zeroY = getY(0)

  const points = aggregated.map((d, i) => {
    const x = padding + (i / (aggregated.length - 1 || 1)) * chartWidth
    const y = getY(d.value)
    return { x, y, val: d.value, month: d.month }
  })

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`

  return (
    <div className="w-full" ref={containerRef}>
      <svg viewBox={`0 0 ${Math.max(width, 500)} ${height}`} className="w-full h-[350px]">
        <defs>
          <linearGradient id="gradient-acc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padding + chartHeight - t * chartHeight
          return (
            <line key={t} x1={padding} y1={y} x2={Math.max(width, 500) - padding} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
          )
        })}
        
        {/* Zero line */}
        <line x1={padding} y1={zeroY} x2={Math.max(width, 500) - padding} y2={zeroY} stroke="#9ca3af" strokeWidth="1" />

        <path d={areaPath} fill="url(#gradient-acc)" />
        <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p) => {
          const [year, month] = p.month.split("-")
          const date = new Date(parseInt(year), parseInt(month) - 1, 1)
          const label = date.toLocaleString("pt-BR", { month: "short", year: "2-digit" })
          
          return (
            <g key={p.month}>
              <circle cx={p.x} cy={p.y} r={4} fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
              <text x={p.x} y={height - 10} textAnchor="middle" fontSize={11} fill="#6b7280">
                {label}
              </text>
              <text x={p.x} y={p.y - 15} textAnchor="middle" fontSize={10} fill="#7c3aed" fontWeight="500">
                {p.val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </text>
            </g>
          )
        })}
      </svg>
      
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="text-sm text-muted-foreground">Saldo Acumulado</span>
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
          <h3 className="text-lg font-medium">Saldo Acumulado</h3>
          <p className="text-sm text-muted-foreground">
            Evolução do saldo acumulado ao longo do período.
          </p>
        </div>
        <AccumulatedBalanceChart data={items} />
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
