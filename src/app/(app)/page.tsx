"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon, Wallet } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

// Mock Data
const accounts = [
  { id: 1, name: "Conta Principal", balance: 5430.50, bank: "Nubank" },
  { id: 2, name: "Reserva de Emergência", balance: 12000.00, bank: "Inter" },
  { id: 3, name: "Cartão de Crédito", balance: -1250.30, bank: "Nubank" }, 
  { id: 4, name: "Investimentos", balance: 45000.00, bank: "XP" },
  { id: 5, name: "Conta Conjunta", balance: 3200.10, bank: "Itaú" },
];

const transactions = [
  { id: 1, description: "Supermercado", amount: -450.00, date: "2024-01-20", type: "expense" },
  { id: 2, description: "Salário", amount: 8500.00, date: "2024-01-05", type: "income" },
  { id: 3, description: "Aluguel", amount: -2200.00, date: "2024-01-10", type: "expense" },
  { id: 4, description: "Freelance", amount: 1200.00, date: "2024-01-15", type: "income" },
  { id: 5, description: "Academia", amount: -120.00, date: "2024-01-02", type: "expense" },
];

const data = [
  { name: "Jan", income: 4000, expense: 2400 },
  { name: "Fev", income: 3000, expense: 1398 },
  { name: "Mar", income: 2000, expense: 9800 },
  { name: "Abr", income: 2780, expense: 3908 },
  { name: "Mai", income: 1890, expense: 4800 },
  { name: "Jun", income: 2390, expense: 3800 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral das suas finanças.</p>
      </div>

      {/* Accounts Carousel */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Minhas Contas</h3>
        </div>
        <div className="px-12">
            <Carousel
            opts={{
                align: "start",
            }}
            className="w-full"
            >
            <CarouselContent>
                {accounts.map((account) => (
                <CarouselItem key={account.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {account.name}
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className={`text-2xl font-bold ${account.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            {formatCurrency(account.balance)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {account.bank}
                        </p>
                        </CardContent>
                    </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
            </Carousel>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip />
                <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Você fez {transactions.length} transações este mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {transaction.type === 'income' ? (
                            <ArrowUpIcon className="h-4 w-4 text-green-600" />
                        ) : (
                            <ArrowDownIcon className="h-4 w-4 text-red-600" />
                        )}
                    </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.date}
                    </p>
                  </div>
                  <div className={`ml-auto font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : ''}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
