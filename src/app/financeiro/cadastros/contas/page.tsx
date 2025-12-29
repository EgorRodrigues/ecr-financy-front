"use client";

import { useEffect, useState, startTransition, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  type AccountInput,
  type Account,
} from "@/lib/api";
import { useSort } from "@/hooks/use-sort";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";

type ContaForm = {
  id: string;
  nome: string;
  tipo: "banco" | "cartao" | "carteira";
  agencia?: string;
  conta?: string;
  numeroCartao?: string;
  saldoInicial?: number;
  limiteDisponivel?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  ativo: boolean;
};

export default function CadastroContasPage() {
  const [form, setForm] = useState<ContaForm>({
    id: "",
    nome: "",
    tipo: "banco",
    ativo: true,
  });
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [items, setItems] = useState<Array<Account>>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Account | null>(null);
  const [edit, setEdit] = useState<AccountInput | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMensagem(null), 3000);
    return () => clearTimeout(t);
  }, [mensagem]);

  useEffect(() => {
    getAccounts()
      .then((list) => startTransition(() => setItems(list)))
      .catch(() => {});
  }, []);

  const displayItems = useMemo(() => {
    return items.map((i) => {
      let displayType = i.type as string;
      if (i.type === "bank") displayType = "Banco";
      if (i.type === "credit_card") displayType = "Cartão de Crédito";
      if (i.type === "wallet") displayType = "Carteira";

      return {
        ...i,
        displayType,
        displayActive: i.active ? "Sim" : "Não",
      };
    });
  }, [items]);

  const { items: sortedItems, requestSort, sortConfig } = useSort(displayItems);

  function update<K extends keyof ContaForm>(key: K, value: ContaForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function formatCard(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  async function salvar() {
    if (!form.nome || !form.nome.trim()) {
      setMensagem("Informe o nome");
      return;
    }
    const tipoApi: AccountInput["type"] =
      form.tipo === "banco"
        ? "bank"
        : form.tipo === "cartao"
          ? "credit_card"
          : "wallet";
    try {
      await createAccount({
        name: form.nome.trim(),
        type: tipoApi,
        agency: form.agencia || undefined,
        account: form.conta || undefined,
        card_number: (form.numeroCartao || "").replace(/\D/g, "") || undefined,
        initial_balance: form.saldoInicial,
        available_limit: form.limiteDisponivel,
        closing_day: form.diaFechamento,
        due_day: form.diaVencimento,
        active: form.ativo,
      });
      setMensagem("Conta salva");
      setForm({ id: "", nome: "", tipo: form.tipo, ativo: true });
      try {
        const list = await getAccounts();
        startTransition(() => setItems(list));
      } catch {}
    } catch {
      setMensagem("Falha ao salvar");
    }
  }

  function openEdit(id: string) {
    const rec = items.find((i) => i.id === id) || null;
    setSelected(rec);
    setEdit(
      rec
        ? {
            name: rec.name,
            type: rec.type,
            agency: rec.agency ?? undefined,
            account: rec.account ?? undefined,
            card_number: rec.card_number ?? undefined,
            initial_balance: rec.initial_balance ?? undefined,
            available_limit: rec.available_limit ?? undefined,
            closing_day: rec.closing_day ?? undefined,
            due_day: rec.due_day ?? undefined,
            active: rec.active,
          }
        : null
    );
    setOpen(true);
  }

  async function saveEdit() {
    if (!selected || !edit) return;
    await updateAccount(selected.id, edit);
    setOpen(false);
    setSelected(null);
    setEdit(null);
    try {
      const list = await getAccounts();
      startTransition(() => setItems(list));
    } catch {}
  }

  async function remove(id: string) {
    const ok =
      typeof window !== "undefined" ? window.confirm("Excluir?") : true;
    if (!ok) return;
    await deleteAccount(id);
    try {
      const list = await getAccounts();
      startTransition(() => setItems(list));
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Cadastro de Contas</h2>
        <div className="flex gap-2">
          <Button onClick={salvar} disabled={!form.nome.trim()}>
            Salvar
          </Button>
        </div>
      </div>

      {mensagem && <div className="text-xs text-emerald-600">{mensagem}</div>}

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs">Nome</label>
            <Input
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs">Tipo</label>
            <Select
              value={form.tipo}
              onValueChange={(v) => update("tipo", v as ContaForm["tipo"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banco">Banco</SelectItem>
                <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                <SelectItem value="carteira">Carteira</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs">Ativo</label>
            <Select
              value={form.ativo ? "true" : "false"}
              onValueChange={(v) => update("ativo", v === "true")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.tipo === "banco" && (
            <>
              <div>
                <label className="text-xs">Agência</label>
                <Input
                  value={form.agencia ?? ""}
                  onChange={(e) => update("agencia", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs">Conta</label>
                <Input
                  value={form.conta ?? ""}
                  onChange={(e) => update("conta", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs">Saldo inicial</label>
                <CurrencyInput
                  value={form.saldoInicial}
                  onValueChange={(v) => update("saldoInicial", v)}
                />
              </div>
            </>
          )}

          {form.tipo === "cartao" && (
            <>
              <div>
                <label className="text-xs">Número do cartão</label>
                <Input
                  value={formatCard(form.numeroCartao ?? "")}
                  onChange={(e) =>
                    update("numeroCartao", formatCard(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="text-xs">Limite disponível</label>
                <CurrencyInput
                  value={form.limiteDisponivel}
                  onValueChange={(v) => update("limiteDisponivel", v)}
                />
              </div>
              <div>
                <label className="text-xs">Dia Fechamento</label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.diaFechamento ?? ""}
                  onChange={(e) =>
                    update(
                      "diaFechamento",
                      parseInt(e.target.value) || undefined
                    )
                  }
                />
              </div>
              <div>
                <label className="text-xs">Dia Vencimento</label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.diaVencimento ?? ""}
                  onChange={(e) =>
                    update(
                      "diaVencimento",
                      parseInt(e.target.value) || undefined
                    )
                  }
                />
              </div>
            </>
          )}

          {form.tipo === "carteira" && (
            <div className="md:col-span-2">
              <label className="text-xs">Saldo inicial</label>
              <CurrencyInput
                value={form.saldoInicial}
                onValueChange={(v) => update("saldoInicial", v)}
              />
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-2 text-sm font-medium">Contas cadastradas</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("name")}
                >
                  Nome{" "}
                  {sortConfig?.key === "name" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("displayType")}
                >
                  Tipo{" "}
                  {sortConfig?.key === "displayType" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("agency")}
                >
                  Agência{" "}
                  {sortConfig?.key === "agency" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("account")}
                >
                  Conta{" "}
                  {sortConfig?.key === "account" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("card_number")}
                >
                  Cartão{" "}
                  {sortConfig?.key === "card_number" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("initial_balance")}
                >
                  Saldo Inicial{" "}
                  {sortConfig?.key === "initial_balance" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("available_limit")}
                >
                  Limite{" "}
                  {sortConfig?.key === "available_limit" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requestSort("displayActive")}
                >
                  Ativo{" "}
                  {sortConfig?.key === "displayActive" && (
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  )}
                </th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{i.displayType}</td>
                  <td className="p-2">{i.agency || "-"}</td>
                  <td className="p-2">{i.account || "-"}</td>
                  <td className="p-2">{i.card_number || "-"}</td>
                  <td className="p-2">
                    {typeof i.initial_balance === "number"
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(i.initial_balance || 0)
                      : "-"}
                  </td>
                  <td className="p-2">
                    {typeof i.available_limit === "number"
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(i.available_limit || 0)
                      : "-"}
                  </td>
                  <td className="p-2">{i.displayActive}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(i.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(i.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    className="p-2 text-center text-muted-foreground"
                    colSpan={9}
                  >
                    Nenhuma conta cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl h-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Conta</SheetTitle>
          </SheetHeader>
          {edit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 text-sm">
              <div className="col-span-1 sm:col-span-2">
                <div className="text-muted-foreground">Nome</div>
                <Input
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </div>
              <div>
                <div className="text-muted-foreground">Tipo</div>
                <Select
                  value={edit.type}
                  onValueChange={(v) =>
                    setEdit({ ...edit, type: v as AccountInput["type"] })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Banco</SelectItem>
                    <SelectItem value="credit_card">Cartão</SelectItem>
                    <SelectItem value="wallet">Carteira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-muted-foreground">Agência</div>
                <Input
                  value={edit.agency || ""}
                  onChange={(e) => setEdit({ ...edit, agency: e.target.value })}
                />
              </div>
              <div>
                <div className="text-muted-foreground">Conta</div>
                <Input
                  value={edit.account || ""}
                  onChange={(e) =>
                    setEdit({ ...edit, account: e.target.value })
                  }
                />
              </div>
              <div>
                <div className="text-muted-foreground">Número do cartão</div>
                <Input
                  value={formatCard(edit.card_number || "")}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      card_number: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
              <div>
                <div className="text-muted-foreground">Saldo inicial</div>
                <CurrencyInput
                  value={edit.initial_balance}
                  onValueChange={(v) =>
                    setEdit({ ...edit, initial_balance: v })
                  }
                />
              </div>
              <div>
                <div className="text-muted-foreground">Limite disponível</div>
                <CurrencyInput
                  value={edit.available_limit}
                  onValueChange={(v) =>
                    setEdit({ ...edit, available_limit: v })
                  }
                />
              </div>
              {edit.type === "credit_card" && (
                <>
                  <div>
                    <div className="text-muted-foreground">Dia Fechamento</div>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={edit.closing_day ?? ""}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          closing_day: parseInt(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                  <div>
                    <div className="text-muted-foreground">Dia Vencimento</div>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={edit.due_day ?? ""}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          due_day: parseInt(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                </>
              )}
              <div>
                <div className="text-muted-foreground">Ativo</div>
                <Select
                  value={String(edit.active)}
                  onValueChange={(v) =>
                    setEdit({ ...edit, active: v === "true" })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <SheetFooter>
            <div className="flex gap-2">
              <Button onClick={saveEdit}>Salvar</Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
