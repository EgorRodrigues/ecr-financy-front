"use client"

import { useState } from "react"
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

type Receivable = {
  id: string
  cliente: string
  vencimento: string
  valor: number
  status: "pendente" | "recebido" | "atrasado"
}

const dados: Receivable[] = [
  { id: "r1", cliente: "Cliente X", vencimento: "2025-12-06", valor: 899.9, status: "pendente" },
  { id: "r2", cliente: "Cliente Y", vencimento: "2025-12-02", valor: 299.0, status: "recebido" },
  { id: "r3", cliente: "Cliente Z", vencimento: "2025-12-01", valor: 149.99, status: "atrasado" },
]

export default function ContasAReceberPage() {
  const [view, setView] = useState<"tabela" | "cards">("tabela")

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

