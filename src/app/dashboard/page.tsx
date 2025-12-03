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

export default function DashboardPage() {
  const total = transactions.reduce((acc, t) => acc + t.amount, 0)
  const aprovados = transactions.filter((t) => t.status === "aprovado").length
  const pendentes = transactions.filter((t) => t.status === "pendente").length
  const falhou = transactions.filter((t) => t.status === "falhou").length

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

