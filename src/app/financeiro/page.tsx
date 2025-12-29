"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDashboard } from "@/lib/api";
import { useSort } from "@/hooks/use-sort";
import { ArrowUpDown } from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "aprovado" | "pendente" | "falhou";
};

type MonthlyAgg = {
  monthLabel: string;
  entradas: number;
  saidas: number;
};

function MonthlyBarChart({ data }: { data: MonthlyAgg[] }) {
  const width = 700;
  const height = 260;
  const padding = 24;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxValue = Math.max(
    1,
    ...data.map((d) => Math.max(d.entradas, d.saidas))
  );
  const groupWidth = chartWidth / data.length;
  const innerGap = 12;
  const barWidth = Math.max(6, (groupWidth - innerGap) / 2);
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[260px] min-w-[700px]"
      >
        <rect
          x={padding}
          y={padding}
          width={chartWidth}
          height={chartHeight}
          fill="#ffffff"
        />
        {data.map((d, i) => {
          const gx = padding + i * groupWidth;
          const eH = (d.entradas / maxValue) * chartHeight;
          const sH = (d.saidas / maxValue) * chartHeight;
          const eX = gx;
          const sX = gx + barWidth + innerGap;
          const eY = padding + chartHeight - eH;
          const sY = padding + chartHeight - sH;
          return (
            <g key={i}>
              <rect
                x={eX}
                y={eY}
                width={barWidth}
                height={eH}
                rx={3}
                fill="#059669"
              />
              <rect
                x={sX}
                y={sY}
                width={barWidth}
                height={sH}
                rx={3}
                fill="#e11d48"
              />
              <text
                x={gx + groupWidth / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize={11}
                fill="#6b7280"
              >
                {d.monthLabel}
              </text>
              {d.entradas > 0 && (
                <text
                  x={eX + barWidth / 2}
                  y={eY - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#374151"
                >
                  {d.entradas.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </text>
              )}
              {d.saidas > 0 && (
                <text
                  x={sX + barWidth / 2}
                  y={sY - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#374151"
                >
                  {d.saidas.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </text>
              )}
            </g>
          );
        })}
        <g>
          <rect
            x={width - padding - 160}
            y={padding}
            width={160}
            height={22}
            fill="#ffffff"
          />
          <circle
            cx={width - padding - 140}
            cy={padding + 11}
            r={5}
            fill="#059669"
          />
          <text
            x={width - padding - 128}
            y={padding + 15}
            fontSize={11}
            fill="#374151"
          >
            Entradas
          </text>
          <circle
            cx={width - padding - 70}
            cy={padding + 11}
            r={5}
            fill="#e11d48"
          />
          <text
            x={width - padding - 58}
            y={padding + 15}
            fontSize={11}
            fill="#374151"
          >
            Saídas
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const [monthsCount, setMonthsCount] = useState<number>(12);
  const [saldo, setSaldo] = useState<number>(0);
  const [aprovados, setAprovados] = useState<number>(0);
  const [pendentes, setPendentes] = useState<number>(0);
  const [falhou, setFalhou] = useState<number>(0);
  const [monthly, setMonthly] = useState<MonthlyAgg[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const { items: sortedItems, requestSort, sortConfig } = useSort(transactions);

  useEffect(() => {
    getDashboard(monthsCount, 100)
      .then((res) => {
        setSaldo(res.big_numbers.balance || 0);
        setAprovados(res.big_numbers.approved || 0);
        setPendentes(res.big_numbers.pending || 0);
        setFalhou(res.big_numbers.failed || 0);
        const monthlyAgg: MonthlyAgg[] = (res.monthly || []).map((m) => {
          const [y, mm] = m.month.split("-").map((v) => Number(v));
          const d = new Date(y, (mm || 1) - 1, 1);
          const label = d.toLocaleString("pt-BR", { month: "short" });
          return {
            monthLabel: label,
            entradas: m.inflows || 0,
            saidas: m.outflows || 0,
          };
        });
        setMonthly(monthlyAgg);
        const txs: Transaction[] = (res.recent_transactions || []).map((t) => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount:
            t.type === "expense"
              ? -Math.abs(t.amount || 0)
              : Math.abs(t.amount || 0),
          status:
            t.status === "pending"
              ? "pendente"
              : t.status === "canceled"
                ? "falhou"
                : "aprovado",
        }));
        setTransactions(txs);
      })
      .catch(() => {});
  }, [monthsCount]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Saldo</div>
          <div className="mt-1 text-2xl font-semibold">
            {saldo.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </div>
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
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Entradas vs Saídas por mês</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Período</span>
            <Select
              value={String(monthsCount)}
              onValueChange={(v) => setMonthsCount(Number(v))}
            >
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Selecione" />
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
        <MonthlyBarChart data={monthly} />
      </Card>

      <Card className="p-4">
        <div className="mb-3 text-sm font-medium">Transações recentes</div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => requestSort("date")}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  Data{" "}
                  {sortConfig?.key === "date" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </TableHead>
                <TableHead
                  onClick={() => requestSort("description")}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  Descrição{" "}
                  {sortConfig?.key === "description" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("amount")}
                >
                  Valor{" "}
                  {sortConfig?.key === "amount" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </TableHead>
                <TableHead
                  onClick={() => requestSort("status")}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  Status{" "}
                  {sortConfig?.key === "status" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell className="text-right">
                    {t.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
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
        </div>
      </Card>
    </div>
  );
}
