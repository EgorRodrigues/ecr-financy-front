'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2, Landmark, Calendar, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { importOfx, type ImportOfxResponse } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ImportOfxPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportOfxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith('.ofx')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Por favor, selecione um arquivo .ofx");
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.toLowerCase().endsWith('.ofx')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Por favor, selecione um arquivo .ofx");
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await importOfx(file);
      setResult(response);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao processar o arquivo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
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
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Conciliação Bancária</h2>
      </div>

      {!result ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full lg:col-span-2 shadow-sm border-muted/40">
            <CardHeader>
              <CardTitle>Importar Arquivo OFX</CardTitle>
              <CardDescription>
                Selecione ou arraste o arquivo exportado do seu banco para iniciar a conciliação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer",
                  isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 bg-muted/5",
                  file ? "bg-muted/10 border-primary/40" : "hover:border-primary/40 hover:bg-muted/10",
                  error ? "border-destructive/50 bg-destructive/5" : ""
                )}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !file && !isLoading && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".ofx"
                  className="hidden"
                />
                
                {!file ? (
                  <>
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-8 ring-primary/5">
                      <Upload className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm font-semibold mb-1">Clique para selecionar ou arraste o arquivo</p>
                    <p className="text-xs text-muted-foreground">Somente arquivos .OFX</p>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between p-4 bg-background rounded-lg border shadow-sm ring-1 ring-black/5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold max-w-[250px] truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    {!isLoading && (
                      <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}>
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm font-medium p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleRemoveFile}
                  disabled={!file || isLoading}
                  className="px-6"
                >
                  Limpar
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || isLoading}
                  className="min-w-[160px] px-6 shadow-md shadow-primary/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Processar Arquivo"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-full lg:col-span-1 shadow-sm border-muted/40 h-fit">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Instruções de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex gap-4 group">
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/90">Exportar do Banco</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Acesse o internet banking da sua instituição e exporte seu extrato no formato OFX.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/90">Fazer o Upload</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Selecione o arquivo baixado nesta área de upload e clique em processar.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500/20 transition-colors">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/90">Atenção</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">O sistema irá ler as transações e o saldo. Verifique se as informações correspondem ao seu banco.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm border-muted/40">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Landmark className="h-4 w-4" /> Conta Bancária
                </CardDescription>
                <CardTitle className="text-xl">{result.account_id}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm border-muted/40">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Saldo no Arquivo
                </CardDescription>
                <CardTitle className="text-xl">{formatCurrency(result.balance)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm border-muted/40">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Data do Saldo
                </CardDescription>
                <CardTitle className="text-xl">{formatDate(result.balance_date)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="shadow-sm border-muted/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Transações Identificadas</CardTitle>
                <CardDescription>
                  Foram encontradas {result.transactions.length} transações no arquivo.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleRemoveFile}>
                Importar outro arquivo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[100px]">Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.transactions.map((transaction, index) => (
                      <TableRow key={transaction.id || index} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell className="max-w-[400px] truncate" title={transaction.memo}>
                          {transaction.memo}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={transaction.amount < 0 ? "destructive" : "secondary"}
                            className={cn(
                              "font-medium",
                              transaction.amount >= 0 ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""
                            )}
                          >
                            {transaction.amount < 0 ? "Saída" : "Entrada"}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-semibold",
                          transaction.amount < 0 ? "text-destructive" : "text-green-600"
                        )}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {result.transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Nenhuma transação encontrada no período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={handleRemoveFile}>
                  Cancelar
                </Button>
                <Button className="px-8 shadow-md shadow-primary/20">
                  Confirmar Conciliação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
