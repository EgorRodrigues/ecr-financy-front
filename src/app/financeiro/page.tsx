import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  status: "aprovado" | "pendente" | "falhou"
}

const transactions: Transaction[] = [
  { id: "1", date: "2025-12-01", description: "Pagamento assinatura", amount: 129.9, status: "aprovado" },
  { id: "2", date: "2025-12-02", description: "Compra marketplace", amount: 349.0, status: "pendente" },
  { id: "3", date: "2025-12-02", description: "Estorno pedido", amount: -49.9, status: "aprovado" },
  { id: "4", date: "2025-12-03", description: "Pagamento boleto", amount: 219.5, status: "falhou" },
]

type MonthlyAgg = {
  monthLabel: string
  entradas: number
  saidas: number
}

function buildMonthlyAggregates(ts: Transaction[]): MonthlyAgg[] {
  const now = new Date()
  const months: { key: string; label: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleString("pt-BR", { month: "short" })
    months.push({ key, label })
  }
  const agg = new Map<string, { entradas: number; saidas: number }>()
  for (const t of ts) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const a = agg.get(key) ?? { entradas: 0, saidas: 0 }
    if (t.amount >= 0) a.entradas += t.amount
    else a.saidas += Math.abs(t.amount)
    agg.set(key, a)
  }
  return months.map((m) => {
    const a = agg.get(m.key) ?? { entradas: 0, saidas: 0 }
    return { monthLabel: m.label, entradas: a.entradas, saidas: a.saidas }
  })
}

function MonthlyBarChart({ data }: { data: MonthlyAgg[] }) {
  const width = 700
  const height = 260
  const padding = 24
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const maxValue = Math.max(
    1,
    ...data.map((d) => Math.max(d.entradas, d.saidas))
  )
  const groupWidth = chartWidth / data.length
  const innerGap = 12
  const barWidth = Math.max(6, (groupWidth - innerGap) / 2)
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        <rect x={padding} y={padding} width={chartWidth} height={chartHeight} fill="#ffffff" />
        {data.map((d, i) => {
          const gx = padding + i * groupWidth
          const eH = (d.entradas / maxValue) * chartHeight
          const sH = (d.saidas / maxValue) * chartHeight
          const eX = gx
          const sX = gx + barWidth + innerGap
          const eY = padding + chartHeight - eH
          const sY = padding + chartHeight - sH
          return (
            <g key={i}>
              <rect x={eX} y={eY} width={barWidth} height={eH} rx={3} fill="#059669" />
              <rect x={sX} y={sY} width={barWidth} height={sH} rx={3} fill="#e11d48" />
              <text x={gx + groupWidth / 2} y={height - 6} textAnchor="middle" fontSize={11} fill="#6b7280">
                {d.monthLabel}
              </text>
              {d.entradas > 0 && (
                <text x={eX + barWidth / 2} y={eY - 4} textAnchor="middle" fontSize={10} fill="#374151">
                  {d.entradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </text>
              )}
              {d.saidas > 0 && (
                <text x={sX + barWidth / 2} y={sY - 4} textAnchor="middle" fontSize={10} fill="#374151">
                  {d.saidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </text>
              )}
            </g>
          )
        })}
        <g>
          <rect x={width - padding - 160} y={padding} width={160} height={22} fill="#ffffff" />
          <circle cx={width - padding - 140} cy={padding + 11} r={5} fill="#059669" />
          <text x={width - padding - 128} y={padding + 15} fontSize={11} fill="#374151">Entradas</text>
          <circle cx={width - padding - 70} cy={padding + 11} r={5} fill="#e11d48" />
          <text x={width - padding - 58} y={padding + 15} fontSize={11} fill="#374151">Saídas</text>
        </g>
      </svg>
    </div>
  )
}

export default function DashboardPage() {
  const total = transactions.reduce((acc, t) => acc + t.amount, 0)
  const aprovados = transactions.filter((t) => t.status === "aprovado").length
  const pendentes = transactions.filter((t) => t.status === "pendente").length
  const falhou = transactions.filter((t) => t.status === "falhou").length
  const monthly = buildMonthlyAggregates(transactions)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Saldo</div>
          <div className="mt-1 text-2xl font-semibold">R$ {total.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Aprovadas</div>
          <div className="mt-1 text-2xl font-semibold">{aprovados}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pendentes</div>
          <div className="mt-1 text-2xl font-semibold">{pendentes}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Falhas</div>
          <div className="mt-1 text-2xl font-semibold">{falhou}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 text-sm font-medium">Entradas vs Saídas por mês</div>
        <MonthlyBarChart data={monthly} />
      </Card>

      <Card className="p-4">
        <div className="mb-3 text-sm font-medium">Transações recentes</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.date}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell className="text-right">{t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                <TableCell>
                  <span
                    className={
                      t.status === "aprovado"
                        ? "text-emerald-600"
                        : t.status === "pendente"
                        ? "text-amber-600"
                        : "text-rose-600"
                    }
                  >
                    {t.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
