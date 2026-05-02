"use client";

import { useState, useEffect, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createCreditCardTransaction,
  createCreditCardTransactionInstallments,
  updateCreditCardTransaction,
  getCategories,
  getSubcategories,
  getCostCenters,
  getContacts,
  type CreditCardTransactionInput,
  type CreditCardTransactionRecord,
} from "@/lib/api";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { ContactSheet } from "@/components/app/contact-sheet";
import { CategorySheet } from "@/components/app/category-sheet";
import { SubcategorySheet } from "@/components/app/subcategory-sheet";
import { CostCenterSheet } from "@/components/app/cost-center-sheet";
import { Combobox } from "@/components/ui/combobox";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formSchema = z.object({
  valor: z.number().min(0.01, "Informe o valor"),
  descricao: z.string().min(1, "Informe a descrição"),
  dataEmissao: z.string().min(1, "Informe a data da compra"),
  categoriaId: z.string().min(1, "Informe a categoria"),
  subcategoriaId: z.string().optional(),
  centroCustoId: z.string().optional(),
  fornecedorClienteId: z.string().optional(),
  documento: z.string().optional(),
  competencia: z.string().optional(),
  projeto: z.string().optional(),
  tags: z.string().optional(),
  observacoes: z.string().optional(),
  parcelado: z.boolean(),
  parcelas: z.number().min(1),
  recorrencia: z.boolean(),
});

type CreditCardExpenseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  cardName: string;
  onSuccess?: () => void;
  initialData?: CreditCardTransactionRecord | null;
};

export function CreditCardExpenseSheet({
  open,
  onOpenChange,
  cardId,
  cardName,
  onSuccess,
  initialData,
}: CreditCardExpenseSheetProps) {
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [subcategories, setSubcategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [costCenters, setCostCenters] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [subcategorySheetOpen, setSubcategorySheetOpen] = useState(false);
  const [costCenterSheetOpen, setCostCenterSheetOpen] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<{
    id: string;
    description: string;
    amount_total: string;
    installments_total: number;
    issue_date: string;
    first_due_date: string;
  } | null>(null);
  const [createdTransactions, setCreatedTransactions] = useState<
    Array<{
      id: string;
      due_date?: string | null;
      amount: string;
      status: string;
      installment_number?: number | null;
      installments_total?: number | null;
    }>
  >([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valor: 0,
      descricao: "",
      dataEmissao: format(new Date(), "yyyy-MM-dd"),
      categoriaId: "",
      subcategoriaId: "",
      centroCustoId: "",
      fornecedorClienteId: "",
      documento: "",
      competencia: "",
      projeto: "",
      tags: "",
      observacoes: "",
      parcelado: false,
      parcelas: 1,
      recorrencia: false,
    },
  });

  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoriaId",
  });

  const isParcelado = useWatch({
    control: form.control,
    name: "parcelado",
  });

  useEffect(() => {
    if (open) {
      loadDependencies();
      setCreatedGroup(null);
      setCreatedTransactions([]);
      if (initialData) {
        form.reset({
          valor: initialData.amount,
          descricao: initialData.description,
          dataEmissao: initialData.issue_date,
          categoriaId: initialData.category_id || "",
          subcategoriaId: initialData.subcategory_id || "",
          centroCustoId: initialData.cost_center_id || "",
          fornecedorClienteId: initialData.contact_id || "",
          documento: initialData.document || "",
          competencia: initialData.competence || "",
          projeto: initialData.project || "",
          tags: initialData.tags?.join(", ") || "",
          observacoes: initialData.notes || "",
          parcelado: false, // Edição geralmente é de uma parcela específica
          parcelas: 1,
          recorrencia: initialData.recurrence || false,
        });
      } else {
        form.reset({
          valor: 0,
          descricao: "",
          dataEmissao: format(new Date(), "yyyy-MM-dd"),
          categoriaId: "",
          subcategoriaId: "",
          centroCustoId: "",
          fornecedorClienteId: "",
          documento: "",
          competencia: "",
          projeto: "",
          tags: "",
          observacoes: "",
          parcelado: false,
          parcelas: 1,
          recorrencia: false,
        });
      }
    }
  }, [open, initialData, form]);

  useEffect(() => {
    if (selectedCategoryId) {
      getSubcategories(selectedCategoryId)
        .then(setSubcategories)
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  async function loadDependencies() {
    try {
      const [cats, conts, ccs] = await Promise.all([
        getCategories(),
        getContacts(),
        getCostCenters(),
      ]);
      setCategories(cats);
      setContacts(conts);
      setCostCenters(ccs);
    } catch (error) {
      console.error("Failed to load dependencies", error);
    }
  }

  function loadContacts() {
    getContacts()
      .then((list) =>
        startTransition(() =>
          setContacts(
            list
              .map((c) => ({ id: c.id, name: c.name }))
              .sort((a, b) => a.name.localeCompare(b.name))
          )
        )
      )
      .catch(() => {});
  }

  function loadCategories() {
    getCategories().then(setCategories).catch(() => {});
  }

  function loadCostCenters() {
    getCostCenters().then(setCostCenters).catch(() => {});
  }

  function reloadSubcategories() {
    if (selectedCategoryId) {
      getSubcategories(selectedCategoryId)
        .then(setSubcategories)
        .catch(() => setSubcategories([]));
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      if (initialData) {
        // Update mode
        const payload: CreditCardTransactionInput = {
          amount: values.valor,
          status: initialData.status, // Preserve status
          issue_date: values.dataEmissao,
          due_date: values.dataEmissao,
          payment_date: values.dataEmissao,
          original_amount: values.valor,
          category_id: values.categoriaId,
          subcategory_id: values.subcategoriaId,
          cost_center_id: values.centroCustoId,
          contact_id: values.fornecedorClienteId,
          description: values.descricao,
          document: values.documento,
          account_id: cardId,
          recurrence: values.recorrencia,
          competence: values.competencia,
          project: values.projeto,
          tags: values.tags
            ? values.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          notes: values.observacoes,
          active: true,
        };
        await updateCreditCardTransaction(initialData.id, payload);
        onSuccess?.();
        onOpenChange(false);
      } else {
        // Create mode
        const isParcelado = values.parcelado && values.parcelas > 1;

        if (isParcelado) {
          const n = Math.max(2, values.parcelas);
          const res = await createCreditCardTransactionInstallments({
            amount_total: Math.abs(values.valor),
            installments_total: n,
            issue_date: values.dataEmissao,
            first_due_date: values.dataEmissao,
            account_id: cardId,
            status: "pendente",
            contact_id: values.fornecedorClienteId || null,
            description: values.descricao || null,
            payment_date: null,
            interest: 0,
            fine: 0,
            discount: 0,
            category_id: values.categoriaId || null,
            subcategory_id: values.subcategoriaId || null,
            cost_center_id: values.centroCustoId || null,
            document: values.documento || null,
            payment_method: "credit_card",
            competence: values.competencia || null,
            project: values.projeto || null,
            tags: values.tags
              ? values.tags
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : null,
            notes: values.observacoes || null,
            active: true,
          });
          setCreatedGroup(res.group);
          setCreatedTransactions(
            res.transactions.map((t) => ({
              id: t.id,
              due_date: t.due_date ?? null,
              amount: t.amount,
              status: t.status,
              installment_number: t.installment_number ?? null,
              installments_total: t.installments_total ?? null,
            }))
          );
          onSuccess?.();
        } else {
          const payload: CreditCardTransactionInput = {
            amount: values.valor,
            status: "pendente",
            issue_date: values.dataEmissao,
            due_date: values.dataEmissao,
            payment_date: values.dataEmissao,
            original_amount: values.valor,
            interest: 0,
            fine: 0,
            discount: 0,
            total_paid: 0,
            category_id: values.categoriaId,
            subcategory_id: values.subcategoriaId,
            cost_center_id: values.centroCustoId,
            contact_id: values.fornecedorClienteId,
            description: values.descricao,
            document: values.documento,
            payment_method: "credit_card",
            account_id: cardId,
            recurrence: values.recorrencia,
            competence: values.competencia,
            project: values.projeto,
            tags: values.tags
              ? values.tags
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [],
            notes: values.observacoes,
            active: true,
          };
          await createCreditCardTransaction(payload);
          onSuccess?.();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error("Failed to create credit card transaction", error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value: string) {
    const n = Number(value);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number.isFinite(n) ? n : 0);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full">
        <SheetHeader>
          <SheetTitle>
            {initialData ? "Editar Despesa" : "Nova Despesa"} - {cardName}
          </SheetTitle>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        placeholder="R$ 0,00"
                        value={field.value}
                        onValueChange={field.onChange}
                        className="text-lg font-bold"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataEmissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Compra</FormLabel>
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
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Almoço, Uber, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => setCategorySheetOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!selectedCategoryId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategories.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => setSubcategorySheetOpen(true)}
                        disabled={!selectedCategoryId}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="centroCustoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custo</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {costCenters.map((cc) => (
                            <SelectItem key={cc.id} value={cc.id}>
                              {cc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => setCostCenterSheetOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fornecedorClienteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor / Loja</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Combobox
                        options={contacts.map((c) => ({
                          value: c.id,
                          label: c.name,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione..."
                      />
                    </FormControl>
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => setContactSheetOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento/Nota</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="competencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <FormControl>
                      <Input placeholder="AAAA-MM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projeto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeto</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="tag1, tag2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parcelado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelado?</FormLabel>
                    <Select
                      value={field.value ? "sim" : "nao"}
                      onValueChange={(v) => field.onChange(v === "sim")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isParcelado && (
                <FormField
                  control={form.control}
                  name="parcelas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!initialData && createdGroup && createdTransactions.length > 0 && (
              <div className="space-y-3 rounded-md border bg-muted/20 p-4">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-semibold">
                    Parcelas criadas ({createdGroup.installments_total})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total: {formatCurrency(createdGroup.amount_total)} • Grupo:{" "}
                    {createdGroup.id}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createdTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="tabular-nums">
                          {t.installment_number && t.installments_total
                            ? `${t.installment_number}/${t.installments_total}`
                            : "-"}
                        </TableCell>
                        <TableCell>{t.due_date || "-"}</TableCell>
                        <TableCell className="capitalize">{t.status}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <SheetFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || (!initialData && !!createdGroup)}>
                {loading
                  ? "Salvando..."
                  : initialData
                  ? "Atualizar Despesa"
                  : "Salvar Despesa"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
      <ContactSheet
        open={contactSheetOpen}
        onOpenChange={setContactSheetOpen}
        onSuccess={loadContacts}
        defaultType="supplier"
      />
      <CategorySheet
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        onSuccess={loadCategories}
      />
      <SubcategorySheet
        open={subcategorySheetOpen}
        onOpenChange={setSubcategorySheetOpen}
        onSuccess={reloadSubcategories}
        defaultCategoryId={selectedCategoryId}
      />
      <CostCenterSheet
        open={costCenterSheetOpen}
        onOpenChange={setCostCenterSheetOpen}
        onSuccess={loadCostCenters}
      />
    </Sheet>
  );
}
