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
  createCreditCardTransaction,
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
import { ContactSheet } from "@/components/financeiro/contact-sheet";
import { CategorySheet } from "@/components/financeiro/category-sheet";
import { SubcategorySheet } from "@/components/financeiro/subcategory-sheet";
import { CostCenterSheet } from "@/components/financeiro/cost-center-sheet";
import { Combobox } from "@/components/ui/combobox";

type CreditCardExpenseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  cardName: string;
  onSuccess?: () => void;
  initialData?: CreditCardTransactionRecord | null;
};

type FormState = {
  tipo: "despesa" | "receita";
  valor: number;
  dataEmissao?: string;
  dataVencimento?: string;
  categoria?: string;
  categoriaId?: string;
  subcategoria?: string;
  subcategoriaId?: string;
  centroCusto?: string;
  centroCustoId?: string;
  fornecedorCliente?: string;
  fornecedorClienteId?: string;
  descricao?: string;
  documento?: string;
  competencia?: string;
  projeto?: string;
  tags?: string;
  observacoes?: string;
  parcelado?: boolean;
  parcelas?: number;
  recorrencia?: boolean;
};

export function CreditCardExpenseSheet({
  open,
  onOpenChange,
  cardId,
  cardName,
  onSuccess,
  initialData,
}: CreditCardExpenseSheetProps) {
  const [form, setForm] = useState<FormState>({
    tipo: "despesa",
    valor: 0,
    parcelado: false,
    parcelas: 1,
    dataEmissao: format(new Date(), "yyyy-MM-dd"),
    dataVencimento: format(new Date(), "yyyy-MM-dd"),
  });

  const [valorText, setValorText] = useState("R$ 0,00");

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

  useEffect(() => {
    if (open) {
      loadDependencies();
      if (initialData) {
        setForm({
          tipo: "despesa",
          valor: initialData.amount,
          parcelado: false, // Usually updates are for single entries
          parcelas: 1,
          dataEmissao: initialData.issue_date,
          dataVencimento: initialData.due_date,
          categoriaId: initialData.category_id,
          subcategoriaId: initialData.subcategory_id,
          centroCustoId: initialData.cost_center_id,
          fornecedorClienteId: initialData.contact_id,
          descricao: initialData.description,
          documento: initialData.document,
          competencia: initialData.competence,
          projeto: initialData.project,
          tags: initialData.tags?.join(", "),
          observacoes: initialData.notes,
          recorrencia: initialData.recurrence,
        });
        const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(initialData.amount);
        setValorText(formatted);
      } else {
        // Reset form when opening in create mode
        setForm({
          tipo: "despesa",
          valor: 0,
          parcelado: false,
          parcelas: 1,
          dataEmissao: format(new Date(), "yyyy-MM-dd"),
          dataVencimento: format(new Date(), "yyyy-MM-dd"),
        });
        setValorText("R$ 0,00");
      }
    }
  }, [open, initialData]);

  useEffect(() => {
    if (form.categoriaId) {
      getSubcategories(form.categoriaId)
        .then(setSubcategories)
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
  }, [form.categoriaId]);

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
    if (form.categoriaId) {
      getSubcategories(form.categoriaId)
        .then(setSubcategories)
        .catch(() => setSubcategories([]));
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    const cents = digits ? parseInt(digits, 10) : 0;
    const value = cents / 100;
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
    setValorText(formatted);
    update("valor", value);
  }

  async function handleSubmit() {
    if (!form.descricao || !form.valor || !form.categoriaId) return;

    setLoading(true);
    try {
      if (initialData) {
        // Update mode
        const payload: CreditCardTransactionInput = {
          amount: form.valor,
          status: initialData.status, // Preserve status
          issue_date: form.dataEmissao,
          due_date: form.dataEmissao,
          payment_date: form.dataEmissao,
          original_amount: form.valor,
          category_id: form.categoriaId,
          subcategory_id: form.subcategoriaId,
          cost_center_id: form.centroCustoId,
          contact_id: form.fornecedorClienteId,
          description: form.descricao,
          document: form.documento,
          // payment_method removed as it triggers validation error if set to "credit_card" and is optional
          account: cardId,
          recurrence: !!form.recorrencia,
          competence: form.competencia,
          project: form.projeto,
          tags: form.tags
            ? form.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          notes: form.observacoes,
          active: true,
        };
        await updateCreditCardTransaction(initialData.id, payload);
      } else {
        // Create mode
        const isParcelado = !!form.parcelado && (form.parcelas || 1) > 1;

        if (isParcelado) {
          const n = Math.max(2, form.parcelas || 2);
          const total = Math.abs(form.valor || 0);
          const base = Math.floor((total * 100) / n);
          const amounts: number[] = Array.from({ length: n }, (_, i) =>
            i < n - 1 ? base : total * 100 - base * (n - 1)
          ).map((c) => c / 100);
          const start =
            form.dataEmissao || new Date().toISOString().slice(0, 10); // Use emission date as start for credit card purchase date
          
          // Parse date parts explicitly to avoid UTC conversion issues
          const [sYear, sMonth, sDay] = start.split("-").map(Number);
          const startDate = new Date(sYear, sMonth - 1, sDay);

          const requests: Promise<unknown>[] = [];
          for (let i = 0; i < n; i++) {
            const d = new Date(
              startDate.getFullYear(),
              startDate.getMonth() + i,
              startDate.getDate()
            );
            // Format as YYYY-MM-DD using local time
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const dateStr = `${year}-${month}-${day}`;

            const payload: CreditCardTransactionInput = {
              amount: Math.abs(amounts[i]),
              status: "pendente",
              issue_date: form.dataEmissao, // Original purchase date
              due_date: dateStr, // Shifted date for invoice allocation
              payment_date: form.dataEmissao,
              original_amount: Math.abs(amounts[i]),
              interest: 0,
              fine: 0,
              discount: 0,
              total_paid: 0,
              category_id: form.categoriaId,
              subcategory_id: form.subcategoriaId,
              cost_center_id: form.centroCustoId,
              contact_id: form.fornecedorClienteId,
              description: [form.descricao || "", `(parcela ${i + 1}/${n})`]
                .filter(Boolean)
                .join(" "),
              document: form.documento
                ? `${form.documento}-${i + 1}/${n}`
                : undefined,
              // payment_method removed as it triggers validation error if set to "credit_card" and is optional
              account: cardId,
              recurrence: !!form.recorrencia,
              competence: form.competencia,
              project: form.projeto,
              tags: form.tags
                ? form.tags
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
              notes: form.observacoes,
              active: true,
            };
            requests.push(createCreditCardTransaction(payload));
          }
          await Promise.all(requests);
        } else {
          const payload: CreditCardTransactionInput = {
            amount: form.valor,
            status: "pendente",
            issue_date: form.dataEmissao,
            due_date: form.dataEmissao,
            payment_date: form.dataEmissao,
            original_amount: form.valor,
            interest: 0,
            fine: 0,
            discount: 0,
            total_paid: 0,
            category_id: form.categoriaId,
            subcategory_id: form.subcategoriaId,
            cost_center_id: form.centroCustoId,
            contact_id: form.fornecedorClienteId,
            description: form.descricao,
            document: form.documento,
            payment_method: "credit_card",
            account: cardId,
            recurrence: !!form.recorrencia,
            competence: form.competencia,
            project: form.projeto,
            tags: form.tags
              ? form.tags
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [],
            notes: form.observacoes,
            active: true,
          };
          await createCreditCardTransaction(payload);
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create credit card transaction", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full">
        <SheetHeader>
          <SheetTitle>
            {initialData ? "Editar Despesa" : "Nova Despesa"} - {cardName}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor</label>
              <Input
                value={valorText}
                onChange={handleValorChange}
                className="text-lg font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data da Compra</label>
              <Input
                type="date"
                value={form.dataEmissao}
                onChange={(e) => update("dataEmissao", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input
              value={form.descricao ?? ""}
              onChange={(e) => update("descricao", e.target.value)}
              placeholder="Ex: Almoço, Uber, etc."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <div className="flex items-center gap-2">
                <Select
                  value={form.categoriaId}
                  onValueChange={(v) => update("categoriaId", v)}
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
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setCategorySheetOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategoria</label>
              <div className="flex items-center gap-2">
                <Select
                  value={form.subcategoriaId}
                  onValueChange={(v) => update("subcategoriaId", v)}
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
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setSubcategorySheetOpen(true)}
                  disabled={!form.categoriaId}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Centro de Custo</label>
            <div className="flex items-center gap-2">
              <Select
                value={form.centroCustoId}
                onValueChange={(v) => update("centroCustoId", v)}
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
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => setCostCenterSheetOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fornecedor / Loja</label>
            <div className="flex items-center gap-2">
              <Combobox
                options={contacts.map((c) => ({ value: c.id, label: c.name }))}
                value={form.fornecedorClienteId}
                onChange={(v) => update("fornecedorClienteId", v)}
                placeholder="Selecione..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setContactSheetOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Documento/Nota</label>
            <Input
              value={form.documento ?? ""}
              onChange={(e) => update("documento", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Competência</label>
              <Input
                value={form.competencia ?? ""}
                onChange={(e) => update("competencia", e.target.value)}
                placeholder="AAAA-MM"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Projeto</label>
              <Input
                value={form.projeto ?? ""}
                onChange={(e) => update("projeto", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Input
              value={form.tags ?? ""}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="tag1, tag2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Parcelado?</label>
              <Select
                value={form.parcelado ? "sim" : "nao"}
                onValueChange={(v) => update("parcelado", v === "sim")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.parcelado && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nº Parcelas</label>
                <Input
                  type="number"
                  min={2}
                  value={form.parcelas}
                  onChange={(e) => update("parcelas", Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Input
              value={form.observacoes ?? ""}
              onChange={(e) => update("observacoes", e.target.value)}
            />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.valor || !form.descricao}
          >
            {loading
              ? "Salvando..."
              : initialData
                ? "Atualizar Despesa"
                : "Salvar Despesa"}
          </Button>
        </SheetFooter>
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
        defaultCategoryId={form.categoriaId}
      />
      <CostCenterSheet
        open={costCenterSheetOpen}
        onOpenChange={setCostCenterSheetOpen}
        onSuccess={loadCostCenters}
      />
    </Sheet>
  );
}
