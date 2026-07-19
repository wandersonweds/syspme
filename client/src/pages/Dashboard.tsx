import { useLocation } from "wouter";
import {
  ClipboardList,
  Users,
  TrendingUp,
  Plus,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wrench,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, formatCurrency, formatDate } from "@/lib/utils-app";

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useLocalAuth();

  const { data: metrics, isLoading: loadingMetrics } = trpc.dashboard.metrics.useQuery();
  const { data: ultimasOS, isLoading: loadingOS } = trpc.dashboard.ultimasOS.useQuery();

  const recentes = ultimasOS?.slice(0, 5) ?? [];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Bom dia, {user?.nome?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Aqui está o resumo da sua oficina hoje.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/clientes/novo")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <UserPlus size={15} />
              Novo Cliente
            </Button>
            <Button onClick={() => navigate("/ordens/nova")} size="sm" className="gap-2">
              <Plus size={15} />
              Nova O.S.
            </Button>
          </div>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="OS Abertas"
            value={metrics?.osAbertas ?? 0}
            icon={ClipboardList}
            color="bg-blue-50 text-blue-600"
            loading={loadingMetrics}
          />
          <MetricCard
            title="Em Andamento"
            value={metrics?.osEmAndamento ?? 0}
            icon={Clock}
            color="bg-amber-50 text-amber-600"
            loading={loadingMetrics}
          />
          <MetricCard
            title="Faturamento do Mês"
            value={formatCurrency(metrics?.faturamentoMes ?? 0)}
            icon={TrendingUp}
            color="bg-emerald-50 text-emerald-600"
            loading={loadingMetrics}
          />
          <MetricCard
            title="Total de Clientes"
            value={metrics?.totalClientes ?? 0}
            icon={Users}
            color="bg-purple-50 text-purple-600"
            loading={loadingMetrics}
          />
        </div>

        {/* Atalhos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/ordens/nova")}
            className="group flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Plus size={22} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Nova O.S.</p>
              <p className="text-sm text-muted-foreground">Registrar nova ordem de serviço</p>
            </div>
            <ArrowRight
              size={16}
              className="ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0"
            />
          </button>

          <button
            onClick={() => navigate("/clientes/novo")}
            className="group flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent/30 transition-colors">
              <UserPlus size={22} className="text-accent-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Novo Cliente</p>
              <p className="text-sm text-muted-foreground">Cadastrar novo cliente</p>
            </div>
            <ArrowRight
              size={16}
              className="ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0"
            />
          </button>
        </div>

        {/* Últimas OS */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Últimas Ordens de Serviço</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1"
              onClick={() => navigate("/ordens")}
            >
              Ver todas <ArrowRight size={12} />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingOS ? (
              <div className="px-6 pb-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Wrench size={22} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Nenhuma ordem de serviço registrada.</p>
                <Button
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => navigate("/ordens/nova")}
                >
                  <Plus size={14} />
                  Criar primeira O.S.
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentes.map((os) => (
                  <button
                    key={os.id}
                    onClick={() => navigate(`/ordens/${os.id}`)}
                    className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">
                        #{os.numero ?? os.id}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{os.clienteNome}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(os.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={os.status} />
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(parseFloat(String(os.valorTotal)))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
