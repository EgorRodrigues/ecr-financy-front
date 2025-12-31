"use client";

import { useMemo, useState, useEffect, startTransition, useRef } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSort } from "@/hooks/use-sort";
import { ArrowUpDown, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { getFinancialForecast, type ForecastItem } from "@/lib/api";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function ForecastChart({ data }: { data: ForecastItem[] }) {
  // Aggregate by month and type
  const aggregated = useMemo(() => {
    const months = Array.from(new Set(data.map((d) => d.month))).sort();

    return months.map((month) => {
      const monthData = data.filter((d) => d.month === month);
      const income = monthData
        .filter((d) => d.type === "income")
        .reduce((acc, curr) => acc + curr.amount, 0);
      const expense = monthData
        .filter((d) => d.type === "expense")
        .reduce((acc, curr) => acc + curr.amount, 0);
      const balance = income - expense;

      // Format date for display
      const [y, m] = month.split("-");
      const date = new Date(parseInt(y), parseInt(m) - 1, 1);
      const label = date.toLocaleString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      return {
        month,
        label,
        income,
        expense,
        balance,
      };
    });
  }, [data]);

  if (aggregated.length === 0) {
    return (
      <div className="flex h-[450px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Nenhum dado para exibir no gráfico neste período
      </div>
    );
  }

  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={aggregated}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            fontSize={12}
            stroke="#6b7280"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              })
            }
            fontSize={12}
            stroke="#6b7280"
          />
          <Tooltip
            formatter={(value: number | undefined) =>
              Number(value || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            contentStyle={{ borderRadius: "8px" }}
          />
          <Legend />

          {/* Income Area & Line */}
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="income"
            name="Receitas"
            fill="url(#colorIncome)"
            stroke="#10b981"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Despesas"
            fill="url(#colorExpense)"
            stroke="#ef4444"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Saldo"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function AccumulatedBalanceChart({ data }: { data: ForecastItem[] }) {
  const aggregated = useMemo(() => {
    const months = Array.from(new Set(data.map((d) => d.month))).sort();

    // First calculate monthly balances
    const monthlyBalances = months.map((month) => {
      const monthData = data.filter((d) => d.month === month);
      const income = monthData
        .filter((d) => d.type === "income")
        .reduce((acc, curr) => acc + curr.amount, 0);
      const expense = monthData
        .filter((d) => d.type === "expense")
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { month, net: income - expense };
    });

    // Then calculate running totals using reduce to avoid side effects
    const result: { month: string; value: number; label: string }[] = [];
    monthlyBalances.reduce((acc, curr) => {
      const newVal = acc + curr.net;
      // Format date for display
      const [y, m] = curr.month.split("-");
      const date = new Date(parseInt(y), parseInt(m) - 1, 1);
      const label = date.toLocaleString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      result.push({ month: curr.month, value: newVal, label });
      return newVal;
    }, 0);

    return result;
  }, [data]);

  if (aggregated.length === 0) {
    return (
      <div className="flex h-[450px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Nenhum dado para exibir no gráfico neste período
      </div>
    );
  }

  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={aggregated}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <defs>
            <linearGradient id="gradient-acc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            fontSize={12}
            stroke="#6b7280"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              })
            }
            fontSize={12}
            stroke="#6b7280"
          />
          <Tooltip
            formatter={(value: number | undefined) =>
              Number(value || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            contentStyle={{ borderRadius: "8px" }}
          />
          <Legend />

          <Area
            type="monotone"
            dataKey="value"
            name="Saldo Acumulado"
            fill="url(#gradient-acc)"
            stroke="#8b5cf6"
            strokeWidth={3}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PrevisaoFinanceiraPage() {
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [monthsRange, setMonthsRange] = useState("6");

  const { items: sortedItems, requestSort, sortConfig } = useSort(items);

  useEffect(() => {
    // Calculate date range: current month to selected months ahead
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + parseInt(monthsRange),
      0
    ); // Last day of target month

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    getFinancialForecast(formatDate(start), formatDate(end))
      .then((data) => {
        if (data) {
          startTransition(() => setItems(data));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch forecast:", err);
      });
  }, [monthsRange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">
          Previsão Financeira
        </h2>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              Fluxo Previsto (Receitas vs Despesas)
            </h3>
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
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Detalhamento</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => requestSort("month")}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                Mês{" "}
                {sortConfig?.key === "month" && (
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                )}
              </TableHead>
              <TableHead
                onClick={() => requestSort("type")}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                Tipo{" "}
                {sortConfig?.key === "type" && (
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                )}
              </TableHead>
              <TableHead
                onClick={() => requestSort("category")}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                Categoria{" "}
                {sortConfig?.key === "category" && (
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
              <TableHead
                className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => requestSort("amount")}
              >
                Valor Previsto{" "}
                {sortConfig?.key === "amount" && (
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
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
                      <span
                        className={
                          item.type === "income"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }
                      >
                        {item.type === "income" ? "Receita" : "Despesa"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "confirmado"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.status === "confirmado"
                        ? "Confirmado"
                        : "Projetado"}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${item.type === "income" ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {item.type === "expense" ? "- " : "+ "}
                    {item.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
