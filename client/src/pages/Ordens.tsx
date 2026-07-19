import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import {
  Plus,
  Search,
  ClipboardList,
  Filter,
  Eye,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, formatCurrency, formatDate } from "@/lib/utils-app";
import { useLocalAuth } from "@/contexts/AuthContext";

export default function Ordens() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user } = useLocalAuth();
  const isAdmin = user?.role === "admin";
  const params = new URLSearchParams(search);

  const [filtros, setFiltros] = useState({
    status: "",
    dataInicio: "",
    dataFim: "",
    clienteId: params.get("clienteId") ? Number(params.get("clienteId")) : undefined as number | undefined,
  });

  const { data: ordens, isLoading } = trpc.os.listar.useQuery(
    {
      status: filtros.status || undefined,
      dataInicio: filtros.dataInicio || undefined,
      dataFim: filtros.dataFim || undefined,
      clienteId: filtros.clienteId,
    },
    { staleTime: 0 }
  );

  const { data: clientes } = trpc.clientes.listarTodos.useQuery();
  const clienteSelecionado = clientes?.find((c) => c.id === filtros.clienteId);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Ordens de Serviço</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {clienteSelecionado
                ? `Histórico de ${clienteSelecionado.nome}`
                : `${ordens?.length ?? 0} ordem${(ordens?.length ?? 0) !== 1 ? "s" : ""} encontrada${(ordens?.length ?? 0) !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button onClick={() => navigate("/ordens/nova")} className="gap-2 shrink-0">
            <Plus size={15} />
            Nova O.S.
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            value={filtros.status || "todos"}
            onValueChange={(v) => setFiltros((p) => ({ ...p, status: v === "todos" ? "" : v }))}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Aberta">Aberta</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Finalizada">Finalizada</SelectItem>
              <SelectItem value="Cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtros.clienteId ? String(filtros.clienteId) : "todos"}
            onValueChange={(v) =>
              setFiltros((p) => ({ ...p, clienteId: v === "todos" ? undefined : Number(v) }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="todos">Todos os clientes</SelectItem>
              {clientes?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="w-36 text-sm"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros((p) => ({ ...p, dataInicio: e.target.value }))}
            />
            <span className="text-muted-foreground text-sm">até</span>
            <Input
              type="date"
              className="w-36 text-sm"
              value={filtros.dataFim}
              onChange={(e) => setFiltros((p) => ({ ...p, dataFim: e.target.value }))}
            />
          </div>

          {(filtros.status || filtros.clienteId || filtros.dataInicio || filtros.dataFim) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => setFiltros({ status: "", dataInicio: "", dataFim: "", clienteId: undefined })}
            >
              Limpar filtros
            </Button>
          )}
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
            ) : ordens?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <ClipboardList size={26} className="text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Nenhuma ordem encontrada</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Tente ajustar os filtros ou crie uma nova O.S.
                </p>
                <Button size="sm" className="mt-4 gap-2" onClick={() => navigate("/ordens/nova")}>
                  <Plus size={14} />
                  Nova O.S.
                </Button>
              </div>
            ) : (
              <>
                {/* Header desktop */}
                <div className={`hidden md:grid gap-4 px-6 py-3 border-b border-border bg-muted/30 ${isAdmin ? 'grid-cols-[auto_2fr_1.5fr_1fr_1fr_1fr_auto]' : 'grid-cols-[auto_2fr_1.5fr_1fr_1fr_auto]'}`}>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</span>
                  {isAdmin && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Responsável</span>}
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ação</span>
                </div>
                <div className="divide-y divide-border">
                  {ordens?.map((os) => (
                    <div
                      key={os.id}
                      className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/ordens/${os.id}`)}
                    >
                      {/* Desktop */}
                      <div className={`hidden md:grid gap-4 items-center ${isAdmin ? 'grid-cols-[auto_2fr_1.5fr_1fr_1fr_1fr_auto]' : 'grid-cols-[auto_2fr_1.5fr_1fr_1fr_auto]'}`}>
                        <span className="text-sm font-mono font-semibold text-muted-foreground w-10">
                          #{os.numero ?? os.id}
                        </span>
                        <p className="font-medium text-foreground truncate">{os.clienteNome}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(os.createdAt)}</p>
                        <StatusBadge status={os.status} />
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(parseFloat(String(os.valorTotal)))}
                        </p>
                        {isAdmin && (
                          <p className="text-sm text-muted-foreground truncate">
                            {(os as any).nomeResponsavel ?? <span className="italic text-muted-foreground/60">N/A</span>}
                          </p>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); navigate(`/ordens/${os.id}`); }}
                        >
                          <Eye size={15} />
                        </Button>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono font-bold text-muted-foreground shrink-0">
                            #{os.numero ?? os.id}
                          </span>
                          <p className="font-medium text-foreground truncate flex-1">{os.clienteNome}</p>
                        </div>
                        <div>
                          <StatusBadge status={os.status} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{formatDate(os.createdAt)}</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(parseFloat(String(os.valorTotal)))}
                          </span>
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
    </AppLayout>
  );
}
