"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Filter, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useSort } from "@/hooks/use-sort";
import {
  getExpenses,
  getCategories,
  getSubcategories,
  getAccounts,
  ExpenseRecord,
  Account,
} from "@/lib/api";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterState = {
  startDate: string;
  endDate: string;
  categoryId: string;
  subcategoryId: string;
  accountId: string;
  status: string;
};

type Category = {
  id: string;
  name: string;
};

type Subcategory = {
  id: string;
  name: string;
};

export default function RelatorioDespesasPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    categoryId: "all",
    subcategoryId: "all",
    accountId: "all",
    status: "all",
  });

  // Fetch dependencies
  useEffect(() => {
    Promise.all([
      getCategories(),
      getAccounts(),
    ]).then(([cats, accs]) => {
      setCategories(cats);
      setAccounts(accs);
    }).catch(console.error);
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (filters.categoryId && filters.categoryId !== "all") {
      getSubcategories(filters.categoryId)
        .then(setSubcategories)
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
    // Reset subcategory when category changes, but only if it's not already "all"
    if (filters.subcategoryId !== "all") {
        setFilters(prev => ({ ...prev, subcategoryId: "all" }));
    }
  }, [filters.categoryId]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: any = {
          start_date: filters.startDate,
          end_date: filters.endDate,
        };
        
        if (filters.categoryId !== "all") params.category_id = filters.categoryId;
        if (filters.subcategoryId !== "all") params.subcategory_id = filters.subcategoryId;
        if (filters.accountId !== "all") params.account = filters.accountId;
        if (filters.status !== "all") params.status = filters.status;

        // Fetch all expenses for the period
        const data = await getExpenses(params);
        
        // Client-side filtering if API doesn't support some params
        let filtered = data;
        if (filters.categoryId !== "all") {
            filtered = filtered.filter(i => i.category_id === filters.categoryId);
        }
        if (filters.subcategoryId !== "all") {
            filtered = filtered.filter(i => i.subcategory_id === filters.subcategoryId);
        }

        setItems(filtered);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.startDate, filters.endDate, filters.categoryId, filters.subcategoryId, filters.accountId, filters.status]); // Exploded dependency to avoid loops

  // Derived Data for KPIs
  const kpis = useMemo(() => {
    const total = items.reduce((acc, i) => acc + i.amount, 0);
    const count = items.length;
    const average = count > 0 ? total / count : 0;
    
    // Top category
    const catMap: Record<string, number> = {};
    items.forEach(i => {
      // Safely access category name, fallback to ID or "Sem Categoria"
      const name = (i as any).category_name || "Sem Categoria";
      catMap[name] = (catMap[name] || 0) + i.amount;
    });
    
    const topCategoryEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry ? { name: topCategoryEntry[0], amount: topCategoryEntry[1] } : null;

    return { total, count, average, topCategory };
  }, [items]);

  // Chart Data: By Category
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => {
      const name = i.category_name || "Outros";
      map[name] = (map[name] || 0) + i.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [items]);

  // Chart Data: Over Time (Daily)
  const timeChartData = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => {
        // Use payment date if available, else due date
      const dateStr = i.payment_date || i.due_date || i.issue_date || "";
      if (!dateStr) return;
      // Simple date formatting if needed, but usually ISO YYYY-MM-DD works for sorting
      map[dateStr] = (map[dateStr] || 0) + i.amount;
    });
    
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        date: format(parseISO(date), "dd/MM"),
        fullDate: date,
        amount,
      }));
  }, [items]);

  // Table Data
  const displayItems = useMemo(() => {
    return items.map((i) => ({
      ...i,
      displayDate: i.payment_date || i.due_date || i.issue_date || "",
      displayStatus: i.status === "pago" ? "Pago" : i.status === "pendente" ? "Pendente" : "Cancelado",
    }));
  }, [items]);

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Relatório de Despesas</h2>
            <p className="text-muted-foreground">Visão detalhada dos seus gastos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Início</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fim</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="space-y-2 min-w-[200px]">
            <label className="text-sm font-medium">Categoria</label>
            <Select
              value={filters.categoryId}
              onValueChange={(v) => setFilters({ ...filters, categoryId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[200px]">
            <label className="text-sm font-medium">Subcategoria</label>
            <Select
              value={filters.subcategoryId}
              onValueChange={(v) => setFilters({ ...filters, subcategoryId: v })}
              disabled={filters.categoryId === "all" || subcategories.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Subcategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as subcategorias</SelectItem>
                {subcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[200px]">
            <label className="text-sm font-medium">Conta</label>
            <Select
              value={filters.accountId}
              onValueChange={(v) => setFilters({ ...filters, accountId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[150px]">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters({ ...filters, status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 print:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total no Período</div>
          <div className="mt-2 text-2xl font-bold">
            {kpis.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Quantidade</div>
          <div className="mt-2 text-2xl font-bold">{kpis.count}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Ticket Médio</div>
          <div className="mt-2 text-2xl font-bold">
            {kpis.average.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Maior Categoria</div>
          <div className="mt-2 text-xl font-bold truncate" title={kpis.topCategory?.name}>
            {kpis.topCategory?.name || "-"}
          </div>
          <div className="text-sm text-muted-foreground">
             {kpis.topCategory?.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:break-inside-avoid">
        <Card className="p-4 flex flex-col items-center">
            <h3 className="mb-4 text-sm font-medium">Despesas por Categoria</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {categoryChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
            <h3 className="mb-4 text-sm font-medium">Evolução Diária</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            tickLine={false} 
                            axisLine={false} 
                            fontSize={12}
                        />
                        <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            fontSize={12}
                            tickFormatter={(value) => value.toLocaleString("pt-BR", { notation: "compact", style: "currency", currency: "BRL" })}
                        />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0 && payload[0].payload.fullDate) {
                                    return format(parseISO(payload[0].payload.fullDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                                }
                                return label;
                            }}
                        />
                        <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} name="Valor" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="overflow-hidden print:shadow-none print:border-none">
        <div className="p-4 border-b print:hidden">
            <h3 className="text-sm font-medium">Detalhamento das Despesas</h3>
        </div>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead onClick={() => requestSort("displayDate")} className="cursor-pointer">
                            Data {sortConfig?.key === "displayDate" && <ArrowUpDown className="inline h-4 w-4" />}
                        </TableHead>
                        <TableHead onClick={() => requestSort("description")} className="cursor-pointer">
                            Descrição {sortConfig?.key === "description" && <ArrowUpDown className="inline h-4 w-4" />}
                        </TableHead>
                        <TableHead onClick={() => requestSort("category_name")} className="cursor-pointer">
                            Categoria {sortConfig?.key === "category_name" && <ArrowUpDown className="inline h-4 w-4" />}
                        </TableHead>
                        <TableHead onClick={() => requestSort("contact_name")} className="cursor-pointer">
                            Fornecedor {sortConfig?.key === "contact_name" && <ArrowUpDown className="inline h-4 w-4" />}
                        </TableHead>
                        <TableHead onClick={() => requestSort("account_name")} className="cursor-pointer">
                            Conta {sortConfig?.key === "account_name" && <ArrowUpDown className="inline h-4 w-4" />}
                        </TableHead>
                        <TableHead onClick={() => requestSort("status")} className="cursor-pointer">
                            Status {sortConfig?.key === "status" && <ArrowUpDown className="inline h-4 w-4" />}
                        </TableHead>
                        <TableHead onClick={() => requestSort("amount")} className="text-right cursor-pointer">
                            Valor {sortConfig?.key === "amount" && <ArrowUpDown className="inline h-4 w-4" />}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Carregando dados...
                            </TableCell>
                        </TableRow>
                    ) : sortedItems.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Nenhuma despesa encontrada para os filtros selecionados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    {item.displayDate ? format(parseISO(item.displayDate), "dd/MM/yyyy") : "-"}
                                </TableCell>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell>{item.category_name || "-"}</TableCell>
                                <TableCell>{item.contact_name || "-"}</TableCell>
                                <TableCell>{item.account_name || "-"}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        item.status === "pago" ? "bg-green-100 text-green-700" :
                                        item.status === "pendente" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-red-100 text-red-700"
                                    }`}>
                                        {item.displayStatus}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-medium text-red-600">
                                    -{item.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </Card>
    </div>
  );
}
