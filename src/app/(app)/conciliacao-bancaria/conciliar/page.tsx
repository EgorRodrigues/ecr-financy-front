'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  getUnreconciledOfxTransactions, 
  getUnreconciledTransactions, 
  type UnreconciledOfxTransaction, 
  type UnreconciledTransaction 
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check, Link as LinkIcon, RotateCcw, ArrowRight, Trash2, Info } from "lucide-react";

type ReconciliationMatch = {
  id: string;
  ofxIds: string[];
  systemIds: string[];
  totalOfxAmount: number;
  totalSystemAmount: number;
};

export default function ConciliarPage() {
  const [ofxTransactions, setOfxTransactions] = useState<UnreconciledOfxTransaction[]>([]);
  const [systemTransactions, setSystemTransactions] = useState<UnreconciledTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOfxIds, setSelectedOfxIds] = useState<string[]>([]);
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>([]);
  
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ofx, systemResponse] = await Promise.all([
        getUnreconciledOfxTransactions(),
        getUnreconciledTransactions()
      ]);
      
      setOfxTransactions(Array.isArray(ofx) ? ofx : []);

      // Processa a resposta que agora vem com incomes e expenses
      const combinedTransactions: UnreconciledTransaction[] = [];
      
      if (systemResponse?.incomes && Array.isArray(systemResponse.incomes)) {
        systemResponse.incomes.forEach(item => {
          combinedTransactions.push({
            id: item.id,
            amount: item.amount,
            date: item.due_date,
            description: item.description,
            type: "income"
          });
        });
      }

      if (systemResponse?.expenses && Array.isArray(systemResponse.expenses)) {
        systemResponse.expenses.forEach(item => {
          combinedTransactions.push({
            id: item.id,
            amount: item.amount,
            date: item.due_date,
            description: item.description,
            type: "expense"
          });
        });
      }

      // Ordena por data para facilitar a conciliação
      combinedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setSystemTransactions(combinedTransactions);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
      setOfxTransactions([]);
      setSystemTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOfxClick = (id: string) => {
    // Se houver algo selecionado no outro lado, criamos o match (muitos para um)
    if (selectedSystemIds.length > 0) {
      const selectedOfx = ofxTransactions.find(t => t.id === id);
      if (!selectedOfx) return;

      const systemItems = systemTransactions.filter(t => selectedSystemIds.includes(t.id));
      const totalSystem = systemItems.reduce((acc, t) => acc + t.amount, 0);

      const newMatch: ReconciliationMatch = {
        id: crypto.randomUUID(),
        ofxIds: [id],
        systemIds: [...selectedSystemIds],
        totalOfxAmount: selectedOfx.amount,
        totalSystemAmount: totalSystem
      };

      setMatches(prev => [...prev, newMatch]);
      // Remove do estado local para não mostrar mais na lista
      setOfxTransactions(prev => prev.filter(t => t.id !== id));
      setSystemTransactions(prev => prev.filter(t => !selectedSystemIds.includes(t.id)));
      setSelectedSystemIds([]);
    } else {
      // Toggle seleção normal
      setSelectedOfxIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const handleSystemClick = (id: string) => {
    // Se houver algo selecionado no outro lado, criamos o match (muitos para um)
    if (selectedOfxIds.length > 0) {
      const selectedSystem = systemTransactions.find(t => t.id === id);
      if (!selectedSystem) return;

      const ofxItems = ofxTransactions.filter(t => selectedOfxIds.includes(t.id));
      const totalOfx = ofxItems.reduce((acc, t) => acc + t.amount, 0);

      const newMatch: ReconciliationMatch = {
        id: crypto.randomUUID(),
        ofxIds: [...selectedOfxIds],
        systemIds: [id],
        totalOfxAmount: totalOfx,
        totalSystemAmount: selectedSystem.amount
      };

      setMatches(prev => [...prev, newMatch]);
      // Remove do estado local para não mostrar mais na lista
      setSystemTransactions(prev => prev.filter(t => t.id !== id));
      setOfxTransactions(prev => prev.filter(t => !selectedOfxIds.includes(t.id)));
      setSelectedOfxIds([]);
    } else {
      // Toggle seleção normal
      setSelectedSystemIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const removeMatch = (match: ReconciliationMatch) => {
    // Devolve as transações para as listas originais (precisaríamos buscar os dados originais se quisermos manter a ordem, mas aqui vamos apenas adicionar de volta)
    // Para simplificar, vamos apenas remover o match. Em um cenário real, deveríamos recarregar ou manter o estado original.
    // Vamos recarregar os dados para simplificar o estado
    setMatches(prev => prev.filter(m => m.id !== match.id));
    fetchData(); 
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Conciliação Bancária</h2>
          <h1 className="text-2xl font-bold">Conciliar Transações</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchData()}>
            <RotateCcw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
          <Button disabled={matches.length === 0}>
            <Check className="mr-2 h-4 w-4" /> Finalizar Conciliação ({matches.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo: OFX */}
        <Card className="shadow-sm border-muted/40">
          <CardHeader className="bg-muted/10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Extrato Bancário (OFX)</CardTitle>
                <CardDescription>Transações importadas do banco</CardDescription>
              </div>
              {selectedOfxIds.length > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {selectedOfxIds.length} selecionado(s)
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ofxTransactions.map((t) => (
                    <TableRow 
                      key={t.id} 
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedOfxIds.includes(t.id) ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                      )}
                      onClick={() => handleOfxClick(t.id)}
                    >
                      <TableCell className="text-xs">{formatDate(t.date)}</TableCell>
                      <TableCell className="text-sm font-medium">{t.memo}</TableCell>
                      <TableCell className={cn(
                        "text-right font-semibold",
                        t.amount < 0 ? "text-destructive" : "text-green-600"
                      )}>
                        {formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ofxTransactions.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        Nenhuma transação pendente no extrato.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Lado Direito: Sistema */}
        <Card className="shadow-sm border-muted/40">
          <CardHeader className="bg-muted/10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Transações no Sistema</CardTitle>
                <CardDescription>Lançamentos financeiros registrados</CardDescription>
              </div>
              {selectedSystemIds.length > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {selectedSystemIds.length} selecionado(s)
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemTransactions.map((t) => (
                    <TableRow 
                      key={t.id} 
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedSystemIds.includes(t.id) ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                      )}
                      onClick={() => handleSystemClick(t.id)}
                    >
                      <TableCell className="text-xs">{formatDate(t.date)}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{t.description}</div>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-semibold",
                        t.type === "expense" ? "text-destructive" : "text-green-600"
                      )}>
                        {formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {systemTransactions.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        Nenhuma transação pendente no sistema.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relações Criadas */}
      {matches.length > 0 && (
        <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Conciliações Propostas</h2>
          </div>
          <div className="grid gap-4">
            {matches.map((match) => (
              <Card key={match.id} className="border-primary/20 bg-primary/5 shadow-none">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-8 flex-1">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">Extrato ({match.ofxIds.length})</p>
                      <p className="text-sm font-semibold">{formatCurrency(match.totalOfxAmount)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">Sistema ({match.systemIds.length})</p>
                      <p className="text-sm font-semibold">{formatCurrency(match.totalSystemAmount)}</p>
                    </div>
                    <div className="flex flex-col items-end mr-4">
                      <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">Diferença</p>
                      <Badge variant={match.totalOfxAmount === match.totalSystemAmount ? "secondary" : "destructive"} className="font-mono">
                        {formatCurrency(match.totalOfxAmount - match.totalSystemAmount)}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeMatch(match)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dicas */}
      <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3 border">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground/80">Como conciliar:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Selecione um ou mais itens em um dos lados.</li>
            <li>Clique em um item do lado oposto para criar o vínculo.</li>
            <li>O sistema permite relações de 1:1, N:1 e 1:N.</li>
            <li>Após criar os vínculos desejados, clique em &quot;Finalizar Conciliação&quot;.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
