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
  PieChart,
  Pie,
  Cell,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  getExpensesByCategory,
  getExpensesByCategoryAndAccount,
  getIncomesByCustomer,
  ExpenseByCategory,
  ExpenseByCategoryAndAccount,
  IncomeByCustomer,
} from "@/lib/api";

// Chart components
type ChartDataItem = {
  name: string;
  value: number;
};

function ExpensesByCategoryChart({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Define colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpensesByCategoryAndAccountChart({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getExpensesByCategoryAndAccount(startDate, endDate);
        
        // Group data by category and account
        const groupedData: Record<string, Record<string, number>> = {};
        
        result.forEach(item => {
          if (!groupedData[item.category_name]) {
            groupedData[item.category_name] = {};
          }
          groupedData[item.category_name][item.account_name] = item.total_amount;
        });
        
        // Convert to chart format
        const chartData = Object.entries(groupedData).map(([category, accounts]) => {
          const entry: any = { name: category };
          Object.entries(accounts).forEach(([account, amount]) => {
            entry[account] = amount;
          });
          return entry;
        });
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching expenses by category and account:", error);
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

  // Get all unique account names for the legend
  const accountNames = Array.from(
    new Set(data.flatMap(item => Object.keys(item).filter(key => key !== 'name')))
  );

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
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
                notation: "compact",
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
                notation: "compact",
              })
            }
            contentStyle={{ borderRadius: "8px" }}
          />
          <Legend />
          {accountNames.map((accountName, index) => (
            <Bar
              key={accountName}
              dataKey={accountName}
              name={accountName}
              fill={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function IncomesByCustomerChart({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Define colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
        </PieChart>
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

      {/* Expenses by Category and Account Chart */}
      <Card className="p-4">
        <div className="mb-3">
          <div className="text-sm font-medium">Acumulado de Gastos por Categoria e Conta</div>
          <div className="text-xs text-muted-foreground mt-1">
            Período: {startDate} a {endDate}
          </div>
        </div>
        <ExpensesByCategoryAndAccountChart startDate={startDate} endDate={endDate} />
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