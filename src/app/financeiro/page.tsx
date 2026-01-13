"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDashboard, getAccounts } from "@/lib/api";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { FinancialCharts } from "@/components/financeiro/financial-charts";

type MonthlyAgg = {
  monthLabel: string;
  entradas: number;
  saidas: number;
};

function MonthlyBarChart({ data }: { data: MonthlyAgg[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Nenhum dado para exibir no gráfico neste período
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: d.monthLabel,
    income: d.entradas,
    expense: d.saidas,
    balance: d.entradas - d.saidas,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
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
          <Bar
            dataKey="income"
            name="Receitas"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Bar
            dataKey="expense"
            name="Despesas"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            barSize={20}
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

export default function DashboardPage() {
  const [monthsCount, setMonthsCount] = useState<number>(12);
  const [saldo, setSaldo] = useState<number>(0);
  const [aprovados, setAprovados] = useState<number>(0);
  const [pendentes, setPendentes] = useState<number>(0);
  const [falhou, setFalhou] = useState<number>(0);
  const [monthly, setMonthly] = useState<MonthlyAgg[]>([]);

  useEffect(() => {
    Promise.all([
      getDashboard(Number(monthsCount), 0),
      getAccounts(),
    ])
      .then(([dashboardRes, accountsRes]) => {
        const accountsInitialBalance = accountsRes.reduce(
          (acc, cur) => acc + (cur.initial_balance || 0),
          0
        );

        setSaldo((dashboardRes.big_numbers.balance || 0) + accountsInitialBalance);
        setAprovados(dashboardRes.big_numbers.approved || 0);
        setPendentes(dashboardRes.big_numbers.pending || 0);
        setFalhou(dashboardRes.big_numbers.failed || 0);
        const monthlyAgg: MonthlyAgg[] = (dashboardRes.monthly || []).map((m) => {
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

      {/* New Financial Charts Section */}
      <FinancialCharts />

    </div>
  );
}
