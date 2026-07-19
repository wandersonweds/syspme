import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, KeyRound, Pencil, ShieldCheck, User, Trash2 } from "lucide-react";

type ModalMode = "criar" | "editar" | "senha" | null;

interface FormUsuario {
  username: string;
  password: string;
  nome: string;
  role: "user" | "admin";
}

interface FormSenha {
  novaSenha: string;
  confirmar: string;
}

export default function GerenciarUsuarios() {
  const { user } = useLocalAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formUsuario, setFormUsuario] = useState<FormUsuario>({
    username: "",
    password: "",
    nome: "",
    role: "user",
  });
  const [formSenha, setFormSenha] = useState<FormSenha>({ novaSenha: "", confirmar: "" });

  // Redireciona se não for admin
  if (user && user.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  const { data: usuarios, isLoading } = trpc.usuarios.listar.useQuery(undefined, {
    staleTime: 0,
  });

  const criarMutation = trpc.usuarios.criar.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      utils.usuarios.listar.invalidate();
      setModal(null);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const atualizarMutation = trpc.usuarios.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado!");
      utils.usuarios.listar.invalidate();
      setModal(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const redefinirSenhaMutation = trpc.usuarios.redefinirSenha.useMutation({
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setModal(null);
      setFormSenha({ novaSenha: "", confirmar: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deletarMutation = trpc.usuarios.deletar.useMutation({
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso!");
      utils.usuarios.listar.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleDeletar(u: { id: number; nome: string }) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${u.nome}"? Esta ação não pode ser desfeita.`)) return;
    deletarMutation.mutate({ id: u.id });
  }

  function resetForm() {
    setFormUsuario({ username: "", password: "", nome: "", role: "user" });
  }

  function abrirCriar() {
    resetForm();
    setSelectedId(null);
    setModal("criar");
  }

  function abrirEditar(u: { id: number; nome: string; role: string }) {
    setSelectedId(u.id);
    setFormUsuario((prev) => ({ ...prev, nome: u.nome, role: u.role as "user" | "admin" }));
    setModal("editar");
  }

  function abrirSenha(id: number) {
    setSelectedId(id);
    setFormSenha({ novaSenha: "", confirmar: "" });
    setModal("senha");
  }

  function handleCriar() {
    if (!formUsuario.username || !formUsuario.password || !formUsuario.nome) {
      toast.error("Preencha todos os campos");
      return;
    }
    criarMutation.mutate(formUsuario);
  }

  function handleEditar() {
    if (!selectedId || !formUsuario.nome) return;
    atualizarMutation.mutate({ id: selectedId, nome: formUsuario.nome, role: formUsuario.role });
  }

  function handleRedefinirSenha() {
    if (!selectedId) return;
    if (formSenha.novaSenha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (formSenha.novaSenha !== formSenha.confirmar) {
      toast.error("As senhas não coincidem");
      return;
    }
    redefinirSenhaMutation.mutate({ id: selectedId, novaSenha: formSenha.novaSenha });
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os usuários e permissões do sistema
            </p>
          </div>
          <Button onClick={abrirCriar} className="gap-2">
            <UserPlus size={16} />
            Novo Usuário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
            ) : !usuarios?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum usuário encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {usuarios.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {u.role === "admin" ? (
                          <ShieldCheck size={16} className="text-primary" />
                        ) : (
                          <User size={16} className="text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.nome}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className="ml-2 text-xs"
                      >
                        {u.role === "admin" ? "Admin" : "Usuário"}
                      </Badge>
                      {u.id === user?.id && (
                        <Badge variant="outline" className="text-xs">
                          Você
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => abrirEditar(u)}
                      >
                        <Pencil size={13} />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => abrirSenha(u.id)}
                      >
                        <KeyRound size={13} />
                        Senha
                      </Button>
                      {u.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletar(u)}
                          disabled={deletarMutation.isPending}
                        >
                          <Trash2 size={13} />
                          Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Criar Usuário */}
        <Dialog open={modal === "criar"} onOpenChange={(o) => !o && setModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input
                  placeholder="Ex: João Silva"
                  value={formUsuario.nome}
                  onChange={(e) => setFormUsuario((p) => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Usuário (login)</Label>
                <Input
                  placeholder="Ex: joao.silva"
                  value={formUsuario.username}
                  onChange={(e) => setFormUsuario((p) => ({ ...p, username: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Senha inicial</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formUsuario.password}
                  onChange={(e) => setFormUsuario((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Perfil de acesso</Label>
                <Select
                  value={formUsuario.role}
                  onValueChange={(v) => setFormUsuario((p) => ({ ...p, role: v as "user" | "admin" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button onClick={handleCriar} disabled={criarMutation.isPending}>
                {criarMutation.isPending ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Usuário */}
        <Dialog open={modal === "editar"} onOpenChange={(o) => !o && setModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input
                  value={formUsuario.nome}
                  onChange={(e) => setFormUsuario((p) => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Perfil de acesso</Label>
                <Select
                  value={formUsuario.role}
                  onValueChange={(v) => setFormUsuario((p) => ({ ...p, role: v as "user" | "admin" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditar} disabled={atualizarMutation.isPending}>
                {atualizarMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Redefinir Senha */}
        <Dialog open={modal === "senha"} onOpenChange={(o) => !o && setModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nova senha</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formSenha.novaSenha}
                  onChange={(e) => setFormSenha((p) => ({ ...p, novaSenha: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar nova senha</Label>
                <Input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={formSenha.confirmar}
                  onChange={(e) => setFormSenha((p) => ({ ...p, confirmar: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button onClick={handleRedefinirSenha} disabled={redefinirSenhaMutation.isPending}>
                {redefinirSenhaMutation.isPending ? "Salvando..." : "Redefinir Senha"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
