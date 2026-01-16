import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  getExpensesByCategory,
  getIncomesByCustomer,
} from "@/lib/api";

// Chart components
type ChartDataItem = {
  name: string;
  value: number;
};

type CostCenterChartDataItem = {
  name: string;
  value: number;
};

type SortOrder = "asc" | "desc";

const MOCK_COST_CENTER_EXPENSES: CostCenterChartDataItem[] = [
  { name: "Administrativo", value: 12500 },
  { name: "Comercial", value: 9800 },
  { name: "Operações", value: 15200 },
  { name: "Marketing", value: 7300 },
  { name: "TI", value: 6400 },
];

function ExpensesByCategoryChart({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getExpensesByCategory(startDate, endDate);
        const chartData = result.map(item => ({
          name: item.category_name,
          value: item.total_amount,
        }));
        setData(chartData);
      } catch (error) {
        console.error("Error fetching expenses by category:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Carregando dados...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Nenhum dado para exibir no gráfico neste período
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) =>
    sortOrder === "desc" ? b.value - a.value : a.value - b.value
  );

  return (
    <div className="w-full h-[300px]">
      <div className="mb-2 flex justify-end">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Ordenar</span>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="Ordenação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Maior → Menor</SelectItem>
              <SelectItem value="asc">Menor → Maior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            fontSize={12}
            stroke="#6b7280"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            fontSize={12}
            stroke="#6b7280"
          />
          <Tooltip
            formatter={(value: number | undefined) =>
              (value || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            contentStyle={{ borderRadius: "8px" }}
          />
          <Legend />
          <Bar
            dataKey="value"
            name="Despesas"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpensesByCostCenterChart() {
  const data = MOCK_COST_CENTER_EXPENSES;
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Nenhum dado para exibir no gráfico neste período
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) =>
    sortOrder === "desc" ? b.value - a.value : a.value - b.value
  );

  return (
    <div className="w-full h-[300px]">
      <div className="mb-2 flex justify-end">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Ordenar</span>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="Ordenação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Maior → Menor</SelectItem>
              <SelectItem value="asc">Menor → Maior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            fontSize={12}
            stroke="#6b7280"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            fontSize={12}
            stroke="#6b7280"
          />
          <Tooltip
            formatter={(value: number | undefined) =>
              (value || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            contentStyle={{ borderRadius: "8px" }}
          />
          <Legend />
          <Bar
            dataKey="value"
            name="Despesas"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function IncomesByCustomerChart({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log(`IncomesByCustomerChart fetching for ${startDate} - ${endDate}`);
        const result = await getIncomesByCustomer(startDate, endDate);
        console.log("IncomesByCustomerChart received:", result);
        const chartData = result.map(item => ({
          name: item.contact_name,
          value: Number(item.total_amount),
        }));
        setData(chartData);
      } catch (error) {
        console.error("Error fetching incomes by customer:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Carregando dados...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/10">
        Nenhum dado para exibir no gráfico neste período
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) =>
    sortOrder === "desc" ? b.value - a.value : a.value - b.value
  );

  return (
    <div className="w-full h-[300px]">
      <div className="mb-2 flex justify-end">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Ordenar</span>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="Ordenação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Maior → Menor</SelectItem>
              <SelectItem value="asc">Menor → Maior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            fontSize={12}
            stroke="#6b7280"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            fontSize={12}
            stroke="#6b7280"
          />
          <Tooltip
            formatter={(value: number | undefined) =>
              (value || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            contentStyle={{ borderRadius: "8px" }}
          />
          <Legend />
          <Bar
            dataKey="value"
            name="Receitas"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Main component to wrap all charts with date filters
export function FinancialCharts() {
  const [dateRange, setDateRange] = useState<string>("30"); // Last 30 days by default
  
  // Calculate start and end dates based on selected range
  const getDatesForRange = (): [string, string] => {
    const today = new Date();
    const startDate = new Date();
    
    switch(dateRange) {
      case "7":
        startDate.setDate(today.getDate() - 7);
        break;
      case "30":
        startDate.setDate(today.getDate() - 30);
        break;
      case "90":
        startDate.setDate(today.getDate() - 90);
        break;
      case "365":
        startDate.setDate(today.getDate() - 365);
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    
    return [
      startDate.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    ];
  };
  
  const [startDate, endDate] = getDatesForRange();

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Período</span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Últimos 365 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expenses by Category Chart */}
      <Card className="p-4">
        <div className="mb-3">
          <div className="text-sm font-medium">Acumulado de Gastos por Categoria</div>
          <div className="text-xs text-muted-foreground mt-1">
            Período: {startDate} a {endDate}
          </div>
        </div>
        <ExpensesByCategoryChart startDate={startDate} endDate={endDate} />
      </Card>

      <Card className="p-4">
        <div className="mb-3">
          <div className="text-sm font-medium">Acumulado de Gastos por Centro de Custos</div>
          <div className="text-xs text-muted-foreground mt-1">
            Período: {startDate} a {endDate}
          </div>
        </div>
        <ExpensesByCostCenterChart />
      </Card>

      {/* Incomes by Customer Chart */}
      <Card className="p-4">
        <div className="mb-3">
          <div className="text-sm font-medium">Acumulado de Receitas por Cliente</div>
          <div className="text-xs text-muted-foreground mt-1">
            Período: {startDate} a {endDate}
          </div>
        </div>
        <IncomesByCustomerChart startDate={startDate} endDate={endDate} />
      </Card>
    </div>
  );
}
