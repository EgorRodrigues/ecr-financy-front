"use client";

import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFinancialForecast, type ForecastItem } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type DreRow = {
  category: string;
  valuesByMonth: Record<string, number>;
  total: number;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatMonthLabel(month: string) {
  const [year, numericMonth] = month.split("-");
  const date = new Date(Number(year), Number(numericMonth) - 1, 1);
  return date.toLocaleString("pt-BR", { month: "short", year: "2-digit" });
}

function buildDefaultPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 5, 0);
  const toIsoDate = (date: Date) => date.toISOString().split("T")[0];
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export default function PrevisaoFinanceiraPage() {
  const defaultPeriod = useMemo(() => buildDefaultPeriod(), []);
  const [startDate, setStartDate] = useState(defaultPeriod.startDate);
  const [endDate, setEndDate] = useState(defaultPeriod.endDate);
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    if (!startDate || !endDate) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await getFinancialForecast(startDate, endDate);
      setItems(data ?? []);
    } catch (error) {
      console.error("Failed to fetch forecast:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const months = useMemo(
    () => Array.from(new Set(items.map((item) => item.month))).sort(),
    [items]
  );

  const chartData = useMemo(() => {
    return months.map((month) => {
      const monthData = items.filter((item) => item.month === month);
      const income = monthData
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);
      const expense = monthData
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        month,
        label: formatMonthLabel(month),
        income,
        expense,
        balance: income - expense,
      };
    });
  }, [items, months]);

  const dreData = useMemo(() => {
    const incomes: Record<string, Record<string, number>> = {};
    const expenses: Record<string, Record<string, number>> = {};

    items.forEach((item) => {
      const target = item.type === "income" ? incomes : expenses;
      if (!target[item.category]) {
        target[item.category] = {};
      }
      target[item.category][item.month] =
        (target[item.category][item.month] ?? 0) + item.amount;
    });

    const mapToRows = (source: Record<string, Record<string, number>>): DreRow[] =>
      Object.entries(source)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, valuesByMonth]) => {
          const total = months.reduce(
            (sum, month) => sum + (valuesByMonth[month] ?? 0),
            0
          );
          return { category, valuesByMonth, total };
        });

    const incomeRows = mapToRows(incomes);
    const expenseRows = mapToRows(expenses);

    const totalIncomeByMonth = months.reduce<Record<string, number>>(
      (acc, month) => {
        acc[month] = incomeRows.reduce(
          (sum, row) => sum + (row.valuesByMonth[month] ?? 0),
          0
        );
        return acc;
      },
      {}
    );

    const totalExpenseByMonth = months.reduce<Record<string, number>>(
      (acc, month) => {
        acc[month] = expenseRows.reduce(
          (sum, row) => sum + (row.valuesByMonth[month] ?? 0),
          0
        );
        return acc;
      },
      {}
    );

    const totalIncomeAll = incomeRows.reduce((sum, row) => sum + row.total, 0);
    const totalExpenseAll = expenseRows.reduce((sum, row) => sum + row.total, 0);

    return {
      incomeRows,
      expenseRows,
      totalIncomeByMonth,
      totalExpenseByMonth,
      totalIncomeAll,
      totalExpenseAll,
    };
  }, [items, months]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Previsão Financeira</h2>
          <p className="text-sm text-muted-foreground">
            Modelo novo inspirado no protótipo, mantendo o layout do sistema.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full sm:w-[170px]"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full sm:w-[170px]"
          />
          <Button onClick={() => void loadData()} disabled={isLoading}>
            {isLoading ? "Carregando..." : "Carregar"}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium">
            Fluxo Previsto (Receitas, Despesas e Saldo)
          </h3>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-[360px] items-center justify-center rounded-md border bg-muted/10 text-sm text-muted-foreground">
            Nenhum dado para o período selecionado.
          </div>
        ) : (
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    Number(value).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      notation: "compact",
                    })
                  }
                />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    formatCurrency(Number(value ?? 0))
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Receitas"
                  stroke="#16a34a"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Despesas"
                  stroke="#dc2626"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Saldo"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-6 overflow-x-auto">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Demonstrativo Financeiro (DRE Mensal)</h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              {months.map((month) => (
                <TableHead key={`head-${month}`} className="text-right min-w-[120px]">
                  {formatMonthLabel(month)}
                </TableHead>
              ))}
              <TableHead className="text-right min-w-[120px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="py-10 text-center text-muted-foreground">
                  Nenhuma previsão encontrada para o período informado.
                </TableCell>
              </TableRow>
            ) : (
              <>
                <TableRow className="bg-muted/40">
                  <TableCell className="font-semibold" colSpan={months.length + 2}>
                    Entradas
                  </TableCell>
                </TableRow>

                {dreData.incomeRows.map((row) => (
                  <TableRow key={`income-${row.category}`}>
                    <TableCell>{row.category}</TableCell>
                    {months.map((month) => (
                      <TableCell key={`income-${row.category}-${month}`} className="text-right">
                        {formatCurrency(row.valuesByMonth[month] ?? 0)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell>Total Entradas</TableCell>
                  {months.map((month) => (
                    <TableCell key={`total-income-${month}`} className="text-right">
                      {formatCurrency(dreData.totalIncomeByMonth[month] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {formatCurrency(dreData.totalIncomeAll)}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-muted/40">
                  <TableCell className="font-semibold" colSpan={months.length + 2}>
                    Saídas
                  </TableCell>
                </TableRow>

                {dreData.expenseRows.map((row) => (
                  <TableRow key={`expense-${row.category}`}>
                    <TableCell>{row.category}</TableCell>
                    {months.map((month) => (
                      <TableCell key={`expense-${row.category}-${month}`} className="text-right">
                        {formatCurrency(row.valuesByMonth[month] ?? 0)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell>Total Saídas</TableCell>
                  {months.map((month) => (
                    <TableCell key={`total-expense-${month}`} className="text-right">
                      {formatCurrency(dreData.totalExpenseByMonth[month] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {formatCurrency(dreData.totalExpenseAll)}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-primary/5 font-bold">
                  <TableCell>Saldo</TableCell>
                  {months.map((month) => (
                    <TableCell key={`balance-${month}`} className="text-right">
                      {formatCurrency(
                        (dreData.totalIncomeByMonth[month] ?? 0) -
                          (dreData.totalExpenseByMonth[month] ?? 0)
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {formatCurrency(dreData.totalIncomeAll - dreData.totalExpenseAll)}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
