"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { getAccounts, createExpense, createIncome, type Account } from "@/lib/api";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";

const formSchema = z.object({
  amount: z.number().min(0.01, "Informe o valor"),
  originAccountId: z.string().min(1, "Selecione a conta de origem"),
  destinationAccountId: z.string().min(1, "Selecione a conta de destino"),
  date: z.string().min(1, "Informe a data"),
  description: z.string().optional(),
}).refine((data) => data.originAccountId !== data.destinationAccountId, {
  message: "A conta de destino deve ser diferente da conta de origem",
  path: ["destinationAccountId"],
});

export default function TransferPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      originAccountId: "",
      destinationAccountId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
    },
  });

  useEffect(() => {
    getAccounts().then(setAccounts).catch(console.error);
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setSuccessMessage(null);
    try {
      const originAccount = accounts.find(a => a.id === values.originAccountId);
      const destinationAccount = accounts.find(a => a.id === values.destinationAccountId);

      if (!originAccount || !destinationAccount) {
        throw new Error("Contas inválidas");
      }

      const description = values.description || `Transferência de ${originAccount.name} para ${destinationAccount.name}`;

      // Criar Despesa na Origem
      await createExpense({
        amount: values.amount,
        status: "pago",
        account: values.originAccountId,
        description: `Transferência para ${destinationAccount.name}`,
        payment_date: values.date,
        issue_date: values.date,
        due_date: values.date,
        notes: description,
      });

      // Criar Receita no Destino
      await createIncome({
        amount: values.amount,
        status: "recebido",
        account: values.destinationAccountId,
        description: `Transferência de ${originAccount.name}`,
        payment_date: values.date,
        issue_date: values.date,
        due_date: values.date,
        notes: description,
      });

      setSuccessMessage("Transferência realizada com sucesso!");
      form.reset({
        amount: 0,
        originAccountId: "",
        destinationAccountId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
      });
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error(error);
      alert("Erro ao realizar transferência");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ArrowRightLeft className="h-6 w-6" />
          Transferências
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Nova Transferência</CardTitle>
            <CardDescription>
              Mova dinheiro entre suas contas. Isso criará automaticamente uma despesa na conta de origem e uma receita na conta de destino.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="originAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta de Origem (Sai dinheiro)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destinationAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta de Destino (Entra dinheiro)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="R$ 0,00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Transferência para poupança" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {successMessage && (
                  <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                    {successMessage}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Realizar Transferência
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
