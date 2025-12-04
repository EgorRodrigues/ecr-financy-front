"use client"

import { useEffect, useState, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getIncomes } from "@/lib/api"

type Receivable = {
  id: string
  cliente: string
  vencimento: string
  valor: number
  status: "pendente" | "recebido" | "atrasado" | "cancelado"
}

type BackendIncome = {
  id: string
  contact_name?: string
  contact_id?: string
  due_date?: string
  amount?: number
  status?: string
}

export default function ContasAReceberPage() {
  const [view, setView] = useState<"tabela" | "cards">("tabela")
  const [dados, setDados] = useState<Receivable[]>([])

  useEffect(() => {
    getIncomes()
      .then((list) => startTransition(() => {
        const mapped: Receivable[] = (list as BackendIncome[]).map((i) => ({
          id: i.id,
          cliente: i.contact_name || i.contact_id || "",
          vencimento: i.due_date || "",
          valor: typeof i.amount === "number" ? i.amount : 0,
          status: (i.status as Receivable["status"]) || "pendente",
        }))
        setDados(mapped)
      }))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Contas a Receber</h2>
        <div className="flex gap-2">
          <Button variant={view === "tabela" ? "default" : "outline"} onClick={() => setView("tabela")}>Tabela</Button>
          <Button variant={view === "cards" ? "default" : "outline"} onClick={() => setView("cards")}>Cards</Button>
        </div>
      </div>

      {view === "tabela" ? (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.cliente}</TableCell>
                  <TableCell>{d.vencimento}</TableCell>
                  <TableCell className="text-right">{d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell>
                    <span className={
                      d.status === "recebido" ? "text-emerald-600" : d.status === "pendente" ? "text-amber-600" : "text-rose-600"
                    }>{d.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {dados.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="text-xs text-muted-foreground">Cliente</div>
              <div className="text-sm font-medium">{d.cliente}</div>
              <div className="mt-2 text-xs text-muted-foreground">Vencimento</div>
              <div className="text-sm">{d.vencimento}</div>
              <div className="mt-2 text-xs text-muted-foreground">Valor</div>
              <div className="text-sm font-semibold">{d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              <div className="mt-2 text-xs text-muted-foreground">Status</div>
              <div className={
                d.status === "recebido" ? "text-emerald-600" : d.status === "pendente" ? "text-amber-600" : "text-rose-600"
              }>{d.status}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
