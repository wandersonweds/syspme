import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus,
  Search,
  UserX,
  Pencil,
  Eye,
  Users,
  Phone,
  Mail,
  MapPin,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { maskCpfCnpj, maskTelefone } from "@/lib/utils-app";

interface ClienteForm {
  nome: string;
  telefone: string;
  cpfCnpj: string;
  endereco: string;
  email: string;
}

const emptyForm: ClienteForm = { nome: "", telefone: "", cpfCnpj: "", endereco: "", email: "" };

function ClienteFormDialog({
  open,
  onClose,
  initial,
  clienteId,
}: {
  open: boolean;
  onClose: () => void;
  initial?: ClienteForm;
  clienteId?: number;
}) {
  const [form, setForm] = useState<ClienteForm>(initial ?? emptyForm);
  const utils = trpc.useUtils();

  const criar = trpc.clientes.criar.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      utils.clientes.listar.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const atualizar = trpc.clientes.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      utils.clientes.listar.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.telefone || !form.cpfCnpj || !form.endereco || !form.email) {
      return toast.error("Preencha todos os campos obrigatórios");
    }
    if (clienteId) {
      atualizar.mutate({ id: clienteId, ...form });
    } else {
      criar.mutate(form);
    }
  };

  const isLoading = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{clienteId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {clienteId ? "Atualize os dados do cliente." : "Preencha os dados do novo cliente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: João da Silva"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm((p) => ({ ...p, telefone: maskTelefone(e.target.value) }))}
                placeholder="(47) 99999-0000"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
              <Input
                id="cpfCnpj"
                value={form.cpfCnpj}
                onChange={(e) => setForm((p) => ({ ...p, cpfCnpj: maskCpfCnpj(e.target.value) }))}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="joao@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endereco">Endereço *</Label>
            <Input
              id="endereco"
              value={form.endereco}
              onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
              placeholder="Rua das Flores, 123 - Itajaí/SC"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 size={14} className="animate-spin mr-2" />}
              {clienteId ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Clientes({ openNew }: { openNew?: boolean } = {}) {
  const [, navigate] = useLocation();
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(openNew ?? false);
  const [editando, setEditando] = useState<{ id: number; form: ClienteForm } | null>(null);
  const [inativando, setInativando] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: clientes, isLoading } = trpc.clientes.listar.useQuery(
    { busca: busca || undefined },
    { staleTime: 30_000 }
  );

  const inativar = trpc.clientes.inativar.useMutation({
    onSuccess: () => {
      toast.success("Cliente inativado com sucesso.");
      utils.clientes.listar.invalidate();
      setInativando(null);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {clientes?.length ?? 0} cliente{(clientes?.length ?? 0) !== 1 ? "s" : ""} ativo
              {(clientes?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
            <Plus size={15} />
            Novo Cliente
          </Button>
        </div>

        {/* Busca */}
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabela */}
        <Card className="border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : clientes?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Users size={26} className="text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Nenhum cliente encontrado</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {busca ? "Tente outro termo de busca." : "Comece cadastrando o primeiro cliente."}
                </p>
                {!busca && (
                  <Button size="sm" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
                    <Plus size={14} />
                    Novo Cliente
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Header da tabela (desktop) */}
                <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-4 px-6 py-3 border-b border-border bg-muted/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefone</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-mail</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CPF/CNPJ</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</span>
                </div>
                <div className="divide-y divide-border">
                  {clientes?.map((c) => (
                    <div
                      key={c.id}
                      className="px-6 py-4 hover:bg-muted/30 transition-colors"
                    >
                      {/* Desktop */}
                      <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-4 items-center">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{c.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.endereco}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone size={13} className="shrink-0" />
                          <span className="truncate">{c.telefone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail size={13} className="shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                        <span className="text-sm text-muted-foreground font-mono">{c.cpfCnpj}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={15} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/ordens?clienteId=${c.id}`)}>
                              <Eye size={14} className="mr-2" /> Ver O.S.
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setEditando({
                                  id: c.id,
                                  form: {
                                    nome: c.nome,
                                    telefone: c.telefone,
                                    cpfCnpj: c.cpfCnpj,
                                    endereco: c.endereco,
                                    email: c.email,
                                  },
                                })
                              }
                            >
                              <Pencil size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setInativando(c.id)}
                            >
                              <UserX size={14} className="mr-2" /> Inativar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-foreground">{c.nome}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/ordens?clienteId=${c.id}`)}>
                                <Eye size={14} className="mr-2" /> Ver O.S.
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setEditando({
                                    id: c.id,
                                    form: {
                                      nome: c.nome,
                                      telefone: c.telefone,
                                      cpfCnpj: c.cpfCnpj,
                                      endereco: c.endereco,
                                      email: c.email,
                                    },
                                  })
                                }
                              >
                                <Pencil size={14} className="mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setInativando(c.id)}
                              >
                                <UserX size={14} className="mr-2" /> Inativar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Phone size={11} />{c.telefone}</span>
                          <span className="flex items-center gap-1"><Mail size={11} />{c.email}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} />{c.endereco}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Novo cliente */}
      <ClienteFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
      />

      {/* Dialog: Editar cliente */}
      {editando && (
        <ClienteFormDialog
          open={true}
          onClose={() => setEditando(null)}
          initial={editando.form}
          clienteId={editando.id}
        />
      )}

      {/* Dialog: Confirmar inativação */}
      <Dialog open={inativando !== null} onOpenChange={(o) => !o && setInativando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inativar cliente</DialogTitle>
            <DialogDescription>
              O cliente será ocultado das buscas, mas seu histórico de ordens de serviço será
              preservado. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInativando(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={inativar.isPending}
              onClick={() => inativando && inativar.mutate({ id: inativando })}
            >
              {inativar.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
              Inativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
