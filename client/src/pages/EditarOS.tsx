import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Plus, Trash2, Loader2, ArrowLeft, Wrench, Package, Car, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils-app";

interface ItemForm {
  tipo: "Serviço" | "Peça";
  descricao: string;
  quantidade: string;
  valorUnitario: string;
}

export default function EditarOS() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const osId = Number(params.id);
  const utils = trpc.useUtils();

  const { data, isLoading: loadingOS } = trpc.os.getById.useQuery({ id: osId });
  const { data: clientes, isLoading: loadingClientes } = trpc.clientes.listarTodos.useQuery();

  const [clienteId, setClienteId] = useState<string>("");
  const [desconto, setDesconto] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Veículo / Maquinário
  const [veiculoPlaca, setVeiculoPlaca] = useState("");
  const [veiculoModelo, setVeiculoModelo] = useState("");
  const [veiculoAno, setVeiculoAno] = useState("");
  const [veiculoChassis, setVeiculoChassis] = useState("");
  const [veiculoFrota, setVeiculoFrota] = useState("");

  // Deslocamento
  const [houveDeslocamento, setHouveDeslocamento] = useState(false);
  const [kmGasto, setKmGasto] = useState("");
  const [valorPorKm, setValorPorKm] = useState("");

  useEffect(() => {
    if (data && clientes && !initialized) {
      const cid = String(data.os.clienteId);
      const clienteExiste = clientes.some((c) => String(c.id) === cid);
      setClienteId(clienteExiste ? cid : "");
      setDesconto(String(parseFloat(String(data.os.desconto)) || 0));
      setObservacoes(data.os.observacoes ?? "");
      setVeiculoPlaca(data.os.veiculoPlaca ?? "");
      setVeiculoModelo(data.os.veiculoModelo ?? "");
      setVeiculoAno(data.os.veiculoAno ?? "");
      setVeiculoChassis(data.os.veiculoChassis ?? "");
      setVeiculoFrota(data.os.veiculoFrota ?? "");
      setHouveDeslocamento(data.os.houveDeslocamento ?? false);
      setKmGasto(data.os.kmGasto ? String(data.os.kmGasto) : "");
      setValorPorKm(data.os.valorPorKm ? String(data.os.valorPorKm) : "");
      setItens(
        data.itens.map((i) => ({
          tipo: i.tipo as "Serviço" | "Peça",
          descricao: i.descricao,
          quantidade: String(parseFloat(String(i.quantidade))),
          valorUnitario: String(parseFloat(String(i.valorUnitario))),
        }))
      );
      setInitialized(true);
    }
  }, [data, clientes, initialized]);

  const atualizar = trpc.os.atualizar.useMutation({
    onSuccess: () => {
      toast.success("O.S. atualizada com sucesso!");
      utils.os.getById.invalidate({ id: osId });
      navigate(`/ordens/${osId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const subtotais = useMemo(
    () =>
      itens.map((item) => {
        const q = parseFloat(item.quantidade) || 0;
        const v = parseFloat(item.valorUnitario) || 0;
        return q * v;
      }),
    [itens]
  );

  const totalItens = subtotais.reduce((a, b) => a + b, 0);
  const descontoNum = parseFloat(desconto) || 0;
  const custoDeslocamento =
    houveDeslocamento && kmGasto && valorPorKm
      ? (parseFloat(kmGasto) || 0) * (parseFloat(valorPorKm) || 0)
      : 0;
  const totalFinal = Math.max(0, totalItens + custoDeslocamento - descontoNum);

  const addItem = () =>
    setItens((p) => [...p, { tipo: "Serviço", descricao: "", quantidade: "1", valorUnitario: "" }]);
  const removeItem = (idx: number) => {
    if (itens.length === 1) return toast.error("A O.S. deve ter ao menos um item.");
    setItens((p) => p.filter((_, i) => i !== idx));
  };
  const updateItem = (idx: number, field: keyof ItemForm, value: string) => {
    setItens((p) => p.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return toast.error("Selecione um cliente.");
    for (const item of itens) {
      if (!item.descricao) return toast.error("Preencha a descrição de todos os itens.");
      if (!item.quantidade || parseFloat(item.quantidade) <= 0)
        return toast.error("Quantidade inválida em um dos itens.");
      if (!item.valorUnitario || parseFloat(item.valorUnitario) <= 0)
        return toast.error("Valor unitário inválido em um dos itens.");
    }
    atualizar.mutate({
      id: osId,
      clienteId: Number(clienteId),
      desconto: descontoNum,
      observacoes: observacoes || undefined,
      veiculoPlaca: veiculoPlaca || undefined,
      veiculoModelo: veiculoModelo || undefined,
      veiculoAno: veiculoAno || undefined,
      veiculoChassis: veiculoChassis || undefined,
      veiculoFrota: veiculoFrota || undefined,
      houveDeslocamento,
      kmGasto: houveDeslocamento && kmGasto ? parseFloat(kmGasto) : undefined,
      valorPorKm: houveDeslocamento && valorPorKm ? parseFloat(valorPorKm) : undefined,
      itens: itens.map((item) => ({
        tipo: item.tipo,
        descricao: item.descricao,
        quantidade: parseFloat(item.quantidade),
        valorUnitario: parseFloat(item.valorUnitario),
      })),
    });
  };

  if (loadingOS || loadingClientes || !initialized) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/ordens/${osId}`)}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Editar O.S. #{data?.os.numero ?? osId}
            </h1>
            <p className="text-muted-foreground text-sm">Atualize os dados da ordem de serviço</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Gerais */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {clientes?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  placeholder="Observações adicionais sobre o serviço..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Veículo / Maquinário */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Car size={16} className="text-muted-foreground" />
                Dados do Veículo / Maquinário
                <span className="text-xs font-normal text-muted-foreground ml-1">(Opcional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Placa</Label>
                  <Input
                    placeholder="Ex: ABC-1234"
                    value={veiculoPlaca}
                    onChange={(e) => setVeiculoPlaca(e.target.value.toUpperCase())}
                    maxLength={8}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Modelo</Label>
                  <Input
                    placeholder="Ex: Fiat Uno"
                    value={veiculoModelo}
                    onChange={(e) => setVeiculoModelo(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ano</Label>
                  <Input
                    placeholder="Ex: 2019"
                    value={veiculoAno}
                    onChange={(e) => setVeiculoAno(e.target.value)}
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Chassis</Label>
                  <Input
                    placeholder="Ex: 9BWZZZ377VT004251"
                    value={veiculoChassis}
                    onChange={(e) => setVeiculoChassis(e.target.value.toUpperCase())}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Frota</Label>
                  <Input
                    placeholder="Ex: 042"
                    value={veiculoFrota}
                    onChange={(e) => setVeiculoFrota(e.target.value)}
                    maxLength={30}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deslocamento */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin size={16} className="text-muted-foreground" />
                Deslocamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="houve-deslocamento-edit"
                  checked={houveDeslocamento}
                  onCheckedChange={(v) => setHouveDeslocamento(!!v)}
                />
                <Label htmlFor="houve-deslocamento-edit" className="cursor-pointer font-normal">
                  Houve deslocamento para atendimento?
                </Label>
              </div>
              {houveDeslocamento && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label>KM gasto</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Ex: 15"
                      value={kmGasto}
                      onChange={(e) => setKmGasto(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valor por KM (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ex: 1,50"
                      value={valorPorKm}
                      onChange={(e) => setValorPorKm(e.target.value)}
                    />
                  </div>
                  {kmGasto && valorPorKm && (
                    <div className="sm:col-span-2 text-sm text-muted-foreground">
                      Custo de deslocamento:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(custoDeslocamento)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens */}
          <Card className="border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Itens da O.S.</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                <Plus size={14} />
                Adicionar item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="hidden md:grid grid-cols-[120px_1fr_80px_110px_100px_36px] gap-2 px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descrição</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qtd.</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor Unit.</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subtotal</span>
                <span className="w-9" />
              </div>

              {itens.map((item, idx) => (
                <div key={idx} className="space-y-2 md:space-y-0">
                  <div className="hidden md:grid grid-cols-[120px_1fr_80px_110px_100px_36px] gap-2 items-center">
                    <Select value={item.tipo} onValueChange={(v) => updateItem(idx, "tipo", v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="Serviço"><span className="flex items-center gap-1.5"><Wrench size={12} /> Serviço</span></SelectItem>
                        <SelectItem value="Peça"><span className="flex items-center gap-1.5"><Package size={12} /> Peça</span></SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Ex: Troca de óleo" value={item.descricao} onChange={(e) => updateItem(idx, "descricao", e.target.value)} className="h-9" />
                    <Input type="number" min="0.01" step="0.01" placeholder="1" value={item.quantidade} onChange={(e) => updateItem(idx, "quantidade", e.target.value)} className="h-9" />
                    <Input type="number" min="0.01" step="0.01" placeholder="0,00" value={item.valorUnitario} onChange={(e) => updateItem(idx, "valorUnitario", e.target.value)} className="h-9" />
                    <p className="text-sm font-semibold text-foreground text-right pr-1">{formatCurrency(subtotais[idx] ?? 0)}</p>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(idx)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="md:hidden bg-muted/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Select value={item.tipo} onValueChange={(v) => updateItem(idx, "tipo", v)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent position="popper" sideOffset={4}>
                          <SelectItem value="Serviço">Serviço</SelectItem>
                          <SelectItem value="Peça">Peça</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <Input placeholder="Descrição do item" value={item.descricao} onChange={(e) => updateItem(idx, "descricao", e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Quantidade</Label>
                        <Input type="number" min="0.01" step="0.01" value={item.quantidade} onChange={(e) => updateItem(idx, "quantidade", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Valor Unitário</Label>
                        <Input type="number" min="0.01" step="0.01" value={item.valorUnitario} onChange={(e) => updateItem(idx, "valorUnitario", e.target.value)} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs text-muted-foreground">Subtotal</span>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(subtotais[idx] ?? 0)}</span>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal itens</span>
                  <span className="font-medium">{formatCurrency(totalItens)}</span>
                </div>
                {custoDeslocamento > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Deslocamento</span>
                    <span className="font-medium">{formatCurrency(custoDeslocamento)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Desconto (R$)</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={desconto}
                      onChange={(e) => setDesconto(e.target.value)}
                      className="w-28 h-7 text-sm"
                    />
                  </div>
                  <span className="font-medium text-destructive">-{formatCurrency(descontoNum)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">{formatCurrency(totalFinal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(`/ordens/${osId}`)} disabled={atualizar.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={atualizar.isPending} className="gap-2">
              {atualizar.isPending && <Loader2 size={14} className="animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
