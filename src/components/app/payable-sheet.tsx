"use client";

import { useState, useEffect, startTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  getCategories,
  getSubcategories,
  getCostCenters,
  getContacts,
  getAccounts,
  createExpense,
  createExpenseInstallments,
  updateExpense,
  type ExpenseRecord,
  type TransactionInput,
} from "@/lib/api";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { ContactSheet } from "@/components/app/contact-sheet";
import { CategorySheet } from "@/components/app/category-sheet";
import { SubcategorySheet } from "@/components/app/subcategory-sheet";
import { CostCenterSheet } from "@/components/app/cost-center-sheet";
import { Combobox } from "@/components/ui/combobox";
import { CurrencyInput } from "@/components/ui/currency-input";

const formSchema = z.object({
  valor: z.number().min(0.01, "Informe o valor"),
  descricao: z.string().min(1, "Informe a descrição"),
  status: z.enum(["pendente", "pago", "cancelado"]),
  dataEmissao: z.string(),
  dataVencimento: z.string().min(1, "Informe o vencimento"),
  dataPagamento: z.string().optional(),
  juros: z.number().optional(),
  multa: z.number().optional(),
  desconto: z.number().optional(),
  totalPago: z.number().optional(),
  categoriaId: z.string().optional(),
  subcategoriaId: z.string().optional(),
  centroCustoId: z.string().optional(),
  fornecedorClienteId: z.string().optional(),
  documento: z.string().optional(),
  formaPagamento: z.string().optional(),
  contaId: z.string().optional(),
  competencia: z.string().optional(),
  projeto: z.string().optional(),
  tags: z.string().optional(),
  observacoes: z.string().optional(),
  recorrencia: z.boolean(),
  parcelado: z.boolean(),
  parcelas: z.number().min(1),
});

type PayableSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: ExpenseRecord | null;
  defaultAccountId?: string;
};

export function PayableSheet({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  defaultAccountId,
}: PayableSheetProps) {
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
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [subcategorySheetOpen, setSubcategorySheetOpen] = useState(false);
  const [costCenterSheetOpen, setCostCenterSheetOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valor: 0,
      descricao: "",
      status: "pendente",
      dataEmissao: format(new Date(), "yyyy-MM-dd"),
      dataVencimento: format(new Date(), "yyyy-MM-dd"),
      categoriaId: "",
      subcategoriaId: "",
      centroCustoId: "",
      fornecedorClienteId: "",
      documento: "",
      formaPagamento: "",
      contaId: defaultAccountId || "",
      competencia: "",
      projeto: "",
      tags: "",
      observacoes: "",
      recorrencia: false,
      parcelado: false,
      parcelas: 1,
    },
  });

  const categoriaId = useWatch({ control: form.control, name: "categoriaId" });
  const isParcelado = useWatch({ control: form.control, name: "parcelado" });
  const status = useWatch({ control: form.control, name: "status" });
  const valor = useWatch({ control: form.control, name: "valor" });
  const juros = useWatch({ control: form.control, name: "juros" });
  const multa = useWatch({ control: form.control, name: "multa" });
  const desconto = useWatch({ control: form.control, name: "desconto" });

  useEffect(() => {
    if (status === "pago") {
      const v = valor || 0;
      const j = juros || 0;
      const m = multa || 0;
      const d = desconto || 0;
      const total = v + j + m - d;
      form.setValue("totalPago", total);
    }
  }, [status, valor, juros, multa, desconto, form]);

  useEffect(() => {
    if (open) {
      loadDependencies();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          valor: initialData.amount,
          descricao: initialData.description || "",
          status: initialData.status as "pendente" | "pago" | "cancelado",
          dataEmissao: initialData.issue_date || format(new Date(), "yyyy-MM-dd"),
          dataVencimento: initialData.due_date || format(new Date(), "yyyy-MM-dd"),
          dataPagamento: initialData.payment_date || format(new Date(), "yyyy-MM-dd"),
          juros: initialData.interest || 0,
          multa: initialData.fine || 0,
          desconto: initialData.discount || 0,
          totalPago: initialData.total_paid || initialData.amount || 0,
          categoriaId: initialData.category_id || "",
          subcategoriaId: initialData.subcategory_id || "",
          centroCustoId: initialData.cost_center_id || "",
          fornecedorClienteId: initialData.contact_id || "",
          documento: initialData.document || "",
          formaPagamento: initialData.payment_method || "",
          contaId: initialData.account_id || "",
          competencia: initialData.competence || "",
          projeto: initialData.project || "",
          tags: initialData.tags?.join(", ") || "",
          observacoes: initialData.notes || "",
          recorrencia: initialData.recurrence || false,
          parcelado: false, // Edit usually doesn't show parcel info this way
          parcelas: 1,
        });
      } else {
        form.reset({
          valor: 0,
          descricao: "",
          status: "pendente",
          dataEmissao: format(new Date(), "yyyy-MM-dd"),
          dataVencimento: format(new Date(), "yyyy-MM-dd"),
          dataPagamento: format(new Date(), "yyyy-MM-dd"),
          juros: 0,
          multa: 0,
          desconto: 0,
          totalPago: 0,
          categoriaId: "",
          subcategoriaId: "",
          centroCustoId: "",
          fornecedorClienteId: "",
          documento: "",
          formaPagamento: "",
          contaId: defaultAccountId || "",
          competencia: "",
          projeto: "",
          tags: "",
          observacoes: "",
          recorrencia: false,
          parcelado: false,
          parcelas: 1,
        });
      }
    }
  }, [open, initialData, defaultAccountId, form]);

  useEffect(() => {
    if (categoriaId) {
      getSubcategories(categoriaId)
        .then(setSubcategories)
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
  }, [categoriaId]);

  async function loadDependencies() {
    try {
      const [cats, conts, ccs, accs] = await Promise.all([
        getCategories(),
        getContacts(),
        getCostCenters(),
        getAccounts(),
      ]);
      setCategories(cats);
      setContacts(conts.sort((a, b) => a.name.localeCompare(b.name)));
      setCostCenters(ccs);
      setAccounts(accs);
    } catch (error) {
      console.error("Failed to load dependencies", error);
    }
  }

  function loadContacts() {
    getContacts()
      .then((list) =>
        startTransition(() =>
          setContacts(
            list.sort((a, b) => a.name.localeCompare(b.name))
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
    if (categoriaId) {
      getSubcategories(categoriaId)
        .then(setSubcategories)
        .catch(() => setSubcategories([]));
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      if (initialData) {
        // Update mode
        const payload: TransactionInput = {
          amount: values.valor,
          status: values.status,
          issue_date: values.dataEmissao,
          due_date: values.dataVencimento,
          payment_date: values.status === "pago" ? values.dataPagamento : undefined,
          interest: values.status === "pago" ? values.juros : undefined,
          fine: values.status === "pago" ? values.multa : undefined,
          discount: values.status === "pago" ? values.desconto : undefined,
          total_paid: values.status === "pago" ? values.totalPago : undefined,
          category_id: values.categoriaId || undefined,
          subcategory_id: values.subcategoriaId || undefined,
          cost_center_id: values.centroCustoId || undefined,
          contact_id: values.fornecedorClienteId || undefined,
          description: values.descricao,
          document: values.documento || undefined,
          payment_method: values.formaPagamento || undefined,
          account_id: values.contaId || undefined,
          recurrence: values.recorrencia,
          competence: values.competencia || undefined,
          project: values.projeto || undefined,
          tags: values.tags
            ? values.tags.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          notes: values.observacoes || undefined,
          active: true,
        };
        await updateExpense(initialData.id, payload);
      } else {
        // Create mode
        const shouldCreateInstallments = values.parcelado && values.parcelas > 1;

        if (shouldCreateInstallments) {
          const n = Math.max(2, values.parcelas);
          await createExpenseInstallments({
            amount_total: Math.abs(values.valor),
            installments_total: n,
            issue_date: values.dataEmissao,
            first_due_date: values.dataVencimento,
            contact_id: values.fornecedorClienteId || undefined,
            description: values.descricao,
            account_id: values.contaId || undefined,
            status: values.status,
            payment_date: values.status === "pago" ? values.dataPagamento : undefined,
            interest: values.status === "pago" ? values.juros : undefined,
            fine: values.status === "pago" ? values.multa : undefined,
            discount: values.status === "pago" ? values.desconto : undefined,
            category_id: values.categoriaId || undefined,
            subcategory_id: values.subcategoriaId || undefined,
            cost_center_id: values.centroCustoId || undefined,
            document: values.documento || undefined,
            payment_method: values.formaPagamento || undefined,
            competence: values.competencia || undefined,
            project: values.projeto || undefined,
            tags: values.tags
              ? values.tags.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            notes: values.observacoes || undefined,
            active: true,
          });
        } else {
          const payload: TransactionInput = {
            amount: values.valor,
            status: values.status,
            issue_date: values.dataEmissao,
            due_date: values.dataVencimento,
            category_id: values.categoriaId || undefined,
            subcategory_id: values.subcategoriaId || undefined,
            cost_center_id: values.centroCustoId || undefined,
            contact_id: values.fornecedorClienteId || undefined,
            description: values.descricao,
            payment_date: values.status === "pago" ? values.dataPagamento : undefined,
            interest: values.status === "pago" ? values.juros : undefined,
            fine: values.status === "pago" ? values.multa : undefined,
            discount: values.status === "pago" ? values.desconto : undefined,
            total_paid: values.status === "pago" ? values.totalPago : undefined,
            document: values.documento || undefined,
            payment_method: values.formaPagamento || undefined,
            account_id: values.contaId || undefined,
            recurrence: values.recorrencia,
            competence: values.competencia || undefined,
            project: values.projeto || undefined,
            tags: values.tags
              ? values.tags.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            notes: values.observacoes || undefined,
            active: true,
          };
          await createExpense(payload);
        }
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save expense", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full">
        <SheetHeader>
          <SheetTitle>
            {initialData ? "Editar Despesa" : "Nova Despesa"}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {status === "pago" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md border border-dashed">
                  <FormField
                    control={form.control}
                    name="dataPagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Pagamento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalPago"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Pago</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            placeholder="R$ 0,00"
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled
                            className="bg-muted font-bold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="juros"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Juros (+)</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            placeholder="R$ 0,00"
                            value={field.value}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="multa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multa (+)</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            placeholder="R$ 0,00"
                            value={field.value}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="desconto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto (-)</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            placeholder="R$ 0,00"
                            value={field.value}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataEmissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emissão</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataVencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento</FormLabel>
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
                    <Input placeholder="Ex: Conta de Luz, Aluguel..." {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} 
                        value={field.value}
                        disabled={!categoriaId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subcategories.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => setSubcategorySheetOpen(true)}
                        disabled={!categoriaId}
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
              name="fornecedorClienteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Combobox
                        options={contacts.map((c) => ({ value: c.id, label: c.name }))}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de Saída</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {costCenters.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parcelado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelado?</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(v === "sim")} 
                      defaultValue={field.value ? "sim" : "nao"}
                      value={field.value ? "sim" : "nao"}
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
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="Nº Nota, Boleto..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <FormField
                control={form.control}
                name="competencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
             <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes adicionais..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>

      <ContactSheet
        open={contactSheetOpen}
        onOpenChange={setContactSheetOpen}
        onSuccess={() => {
          loadContacts();
          setContactSheetOpen(false);
        }}
        defaultType="supplier"
      />

      <CategorySheet
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        onSuccess={() => {
          loadCategories();
          setCategorySheetOpen(false);
        }}
      />

      <SubcategorySheet
        open={subcategorySheetOpen}
        onOpenChange={setSubcategorySheetOpen}
        defaultCategoryId={categoriaId || undefined}
        onSuccess={() => {
          reloadSubcategories();
          setSubcategorySheetOpen(false);
        }}
      />

      <CostCenterSheet
        open={costCenterSheetOpen}
        onOpenChange={setCostCenterSheetOpen}
        onSuccess={() => {
          loadCostCenters();
          setCostCenterSheetOpen(false);
        }}
      />
    </Sheet>
  );
}
