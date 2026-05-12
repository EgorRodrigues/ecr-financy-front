"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
import { cn } from "@/lib/utils";
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

/** Uma interseção da tabela que o usuário clicou para ver os lançamentos. */
type DreCellSelection =
  | {
    kind: "income-category" | "expense-category";
    category: string;
    monthScope: string | "__total__";
  }
  | {
    kind: "total-income" | "total-expense" | "balance";
    monthScope: string | "__total__";
  };

function dreSelectionMatches(a: DreCellSelection | null, b: DreCellSelection | null) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a.kind !== b.kind || a.monthScope !== b.monthScope) return false;
  if ("category" in a && "category" in b) {
    return a.category === b.category;
  }
  if ("category" in a || "category" in b) return false;
  return true;
}

function getItemsForDreSelection(
  selection: DreCellSelection | null,
  rows: ForecastItem[]
): ForecastItem[] {
  if (!selection) return [];

  const byMonth =
    selection.monthScope === "__total__"
      ? undefined
      : selection.monthScope;

  switch (selection.kind) {
    case "income-category":
      return rows.filter(
        (r) =>
          r.type === "income" &&
          r.category === selection.category &&
          (byMonth === undefined || r.month === byMonth)
      );
    case "expense-category":
      return rows.filter(
        (r) =>
          r.type === "expense" &&
          r.category === selection.category &&
          (byMonth === undefined || r.month === byMonth)
      );
    case "total-income":
      return rows.filter(
        (r) => r.type === "income" && (byMonth === undefined || r.month === byMonth)
      );
    case "total-expense":
      return rows.filter(
        (r) => r.type === "expense" && (byMonth === undefined || r.month === byMonth)
      );
    case "balance":
      return rows.filter((r) =>
        byMonth === undefined ? true : r.month === byMonth
      );
    default:
      return [];
  }
}

function describeDreSelection(sel: DreCellSelection): string {
  const monthLabel = (month: string) =>
    `${formatMonthLabel(month)} (${month})`;

  const scopeTxt =
    sel.monthScope === "__total__"
      ? "todas as colunas de mês neste período"
      : monthLabel(sel.monthScope);

  if (sel.kind === "income-category") {
    return `Entradas › ${sel.category} — ${scopeTxt}`;
  }
  if (sel.kind === "expense-category") {
    return `Saídas › ${sel.category} — ${scopeTxt}`;
  }
  if (sel.kind === "total-income") {
    return `Total Entradas — ${scopeTxt}`;
  }
  if (sel.kind === "total-expense") {
    return `Total Saídas — ${scopeTxt}`;
  }
  return `Saldo — ${scopeTxt}`;
}

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
  const [dreSelection, setDreSelection] = useState<DreCellSelection | null>(null);

  const loadData = async () => {
    if (!startDate || !endDate) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await getFinancialForecast(startDate, endDate);
      setItems(data ?? []);
      setDreSelection(null);
    } catch (error) {
      console.error("Failed to fetch forecast:", error);
      setItems([]);
      setDreSelection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const pickDreCell = useCallback((sel: DreCellSelection) => {
    setDreSelection((prev) => (dreSelectionMatches(prev, sel) ? null : sel));
  }, []);

  const dreDetailItems = useMemo(() => {
    const filtered = getItemsForDreSelection(dreSelection, items);
    return [...filtered].sort((a, b) => {
      if (a.month !== b.month) return a.month.localeCompare(b.month);
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return b.amount - a.amount;
    });
  }, [dreSelection, items]);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setDreSelection(null);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const months = useMemo(
    () => Array.from(new Set(items.map((item) => item.month))).sort(),
    [items]
  );

  const chartData = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};

    // Agrupa tudo em uma única passada
    items.forEach((item) => {
      if (!grouped[item.month]) {
        grouped[item.month] = { income: 0, expense: 0 };
      }

      if (item.type === "income") {
        grouped[item.month].income += item.amount;
      } else {
        grouped[item.month].expense += item.amount;
      }
    });

    let accumulatedBalance = 0;

    return months.map((month) => {
      const data = grouped[month] || { income: 0, expense: 0 };
      const balance = data.income - data.expense;
      accumulatedBalance += balance;

      return {
        month,
        label: formatMonthLabel(month),
        income: data.income,
        expense: data.expense,
        balance,
        accumulatedBalance,
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
            Fluxo Previsto (Receitas, Despesas, Saldo e Saldo acumulado)
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
                  strokeWidth={1}
                // strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="accumulatedBalance"
                  name="Saldo acumulado"
                  stroke="#8b5cf6"
                  strokeWidth={1}
                  strokeDasharray="3 10"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-6 overflow-x-auto">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Demonstrativo Financeiro (DRE Mensal)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em um valor (célula mensal ou coluna Total, linhas de totais e Saldo) para ver os
            lançamentos que compõem esse somatório.
          </p>
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
                <TableCell
                  colSpan={months.length + 2}
                  className="py-10 text-center text-muted-foreground"
                >
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
                    {months.map((month) => {
                      const sel: DreCellSelection = {
                        kind: "income-category",
                        category: row.category,
                        monthScope: month,
                      };
                      return (
                        <TableCell
                          key={`income-${row.category}-${month}`}
                          className={cn(
                            "text-right cursor-pointer select-none transition-colors hover:bg-muted/60",
                            dreSelectionMatches(dreSelection, sel) &&
                            "bg-primary/10 ring-2 ring-inset ring-primary/35"
                          )}
                          onClick={() => pickDreCell(sel)}
                          title="Ver lançamentos desta célula"
                        >
                          {formatCurrency(row.valuesByMonth[month] ?? 0)}
                        </TableCell>
                      );
                    })}
                    <TableCell
                      className={cn(
                        "text-right font-medium cursor-pointer select-none transition-colors hover:bg-muted/60",
                        dreSelectionMatches(dreSelection, {
                          kind: "income-category",
                          category: row.category,
                          monthScope: "__total__",
                        }) && "bg-primary/10 ring-2 ring-inset ring-primary/35"
                      )}
                      onClick={() =>
                        pickDreCell({
                          kind: "income-category",
                          category: row.category,
                          monthScope: "__total__",
                        })
                      }
                      title="Ver lançamentos no período da coluna Total"
                    >
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell>Total Entradas</TableCell>
                  {months.map((month) => {
                    const sel: DreCellSelection = {
                      kind: "total-income",
                      monthScope: month,
                    };
                    return (
                      <TableCell
                        key={`total-income-${month}`}
                        className={cn(
                          "text-right cursor-pointer select-none transition-colors hover:bg-muted/60",
                          dreSelectionMatches(dreSelection, sel) &&
                          "bg-primary/10 ring-2 ring-inset ring-primary/35"
                        )}
                        onClick={() => pickDreCell(sel)}
                        title="Ver todas as receitas previstas neste mês"
                      >
                        {formatCurrency(dreData.totalIncomeByMonth[month] ?? 0)}
                      </TableCell>
                    );
                  })}
                  <TableCell
                    className={cn(
                      "text-right cursor-pointer select-none transition-colors hover:bg-muted/60",
                      dreSelectionMatches(dreSelection, {
                        kind: "total-income",
                        monthScope: "__total__",
                      }) && "bg-primary/10 ring-2 ring-inset ring-primary/35"
                    )}
                    onClick={() =>
                      pickDreCell({ kind: "total-income", monthScope: "__total__" })
                    }
                    title="Ver todas as receitas previstas no período"
                  >
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
                    {months.map((month) => {
                      const sel: DreCellSelection = {
                        kind: "expense-category",
                        category: row.category,
                        monthScope: month,
                      };
                      return (
                        <TableCell
                          key={`expense-${row.category}-${month}`}
                          className={cn(
                            "text-right cursor-pointer select-none transition-colors hover:bg-muted/60",
                            dreSelectionMatches(dreSelection, sel) &&
                            "bg-primary/10 ring-2 ring-inset ring-primary/35"
                          )}
                          onClick={() => pickDreCell(sel)}
                          title="Ver lançamentos desta célula"
                        >
                          {formatCurrency(row.valuesByMonth[month] ?? 0)}
                        </TableCell>
                      );
                    })}
                    <TableCell
                      className={cn(
                        "text-right font-medium cursor-pointer select-none transition-colors hover:bg-muted/60",
                        dreSelectionMatches(dreSelection, {
                          kind: "expense-category",
                          category: row.category,
                          monthScope: "__total__",
                        }) && "bg-primary/10 ring-2 ring-inset ring-primary/35"
                      )}
                      onClick={() =>
                        pickDreCell({
                          kind: "expense-category",
                          category: row.category,
                          monthScope: "__total__",
                        })
                      }
                      title="Ver lançamentos no período da coluna Total"
                    >
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell>Total Saídas</TableCell>
                  {months.map((month) => {
                    const sel: DreCellSelection = {
                      kind: "total-expense",
                      monthScope: month,
                    };
                    return (
                      <TableCell
                        key={`total-expense-${month}`}
                        className={cn(
                          "text-right cursor-pointer select-none transition-colors hover:bg-muted/60",
                          dreSelectionMatches(dreSelection, sel) &&
                          "bg-primary/10 ring-2 ring-inset ring-primary/35"
                        )}
                        onClick={() => pickDreCell(sel)}
                        title="Ver todas as despesas previstas neste mês"
                      >
                        {formatCurrency(dreData.totalExpenseByMonth[month] ?? 0)}
                      </TableCell>
                    );
                  })}
                  <TableCell
                    className={cn(
                      "text-right cursor-pointer select-none transition-colors hover:bg-muted/60",
                      dreSelectionMatches(dreSelection, {
                        kind: "total-expense",
                        monthScope: "__total__",
                      }) && "bg-primary/10 ring-2 ring-inset ring-primary/35"
                    )}
                    onClick={() =>
                      pickDreCell({ kind: "total-expense", monthScope: "__total__" })
                    }
                    title="Ver todas as despesas previstas no período"
                  >
                    {formatCurrency(dreData.totalExpenseAll)}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-primary/5 font-bold">
                  <TableCell>Saldo</TableCell>
                  {months.map((month) => {
                    const sel: DreCellSelection = {
                      kind: "balance",
                      monthScope: month,
                    };
                    return (
                      <TableCell
                        key={`balance-${month}`}
                        className={cn(
                          "text-right cursor-pointer select-none transition-colors hover:bg-muted/60",
                          dreSelectionMatches(dreSelection, sel) &&
                          "bg-primary/10 ring-2 ring-inset ring-primary/35"
                        )}
                        onClick={() => pickDreCell(sel)}
                        title="Ver receitas e despesas deste mês (lançamentos que formam o saldo)"
                      >
                        {formatCurrency(
                          (dreData.totalIncomeByMonth[month] ?? 0) -
                          (dreData.totalExpenseByMonth[month] ?? 0)
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell
                    className={cn(
                      "text-right cursor-pointer select-none transition-colors hover:bg-muted/60",
                      dreSelectionMatches(dreSelection, {
                        kind: "balance",
                        monthScope: "__total__",
                      }) && "bg-primary/10 ring-2 ring-inset ring-primary/35"
                    )}
                    onClick={() =>
                      pickDreCell({ kind: "balance", monthScope: "__total__" })
                    }
                    title="Ver todos os lançamentos do período (receitas e despesas)"
                  >
                    {formatCurrency(dreData.totalIncomeAll - dreData.totalExpenseAll)}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </Card>

      {dreSelection && (
        <Card className="p-6 overflow-x-auto">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-medium">Lançamentos do somatório</h3>
              <p className="text-sm text-muted-foreground">
                {describeDreSelection(dreSelection)}{" "}
                <span className="opacity-75">• Pressione Escape para ocultar</span>
              </p>
            </div>
            <Button variant="outline" size="sm" type="button" onClick={() => setDreSelection(null)}>
              Limpar seleção
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor previsto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dreDetailItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhum lançamento encontrado para esta combinação.
                  </TableCell>
                </TableRow>
              ) : (
                dreDetailItems.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell className="min-w-[280px]">
                      {row.description?.trim() ? row.description : "-"}
                    </TableCell>
                    <TableCell
                      className={
                        row.type === "income" ? "text-emerald-600" : "text-red-600"
                      }
                    >
                      {row.type === "income" ? "Receita" : "Despesa"}
                    </TableCell>
                    <TableCell className="capitalize">{row.status}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        row.type === "income" ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      {formatCurrency(row.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
