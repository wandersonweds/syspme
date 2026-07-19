import { useState } from "react";
import { useLocation } from "wouter";
import { Wrench, Eye, EyeOff, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch } = useLocalAuth();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  const [setupMode, setSetupMode] = useState(false);
  const [setupForm, setSetupForm] = useState({ username: "", password: "", nome: "" });

  const utils = trpc.useUtils();
  const { data: hasUsers, isLoading: checkingUsers } = trpc.localAuth.hasUsers.useQuery();

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: async () => {
      await refetch();
      navigate("/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  const setupMutation = trpc.localAuth.setup.useMutation({
    onSuccess: () => {
      toast.success("Conta criada! Agora faça login.");
      setForm((p) => ({ ...p, username: setupForm.username, password: "" }));
      setSetupMode(false);
      // Invalida a query hasUsers para que o componente detecte que já existe usuário
      // e exiba o formulário de login sem precisar atualizar a página
      utils.localAuth.hasUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error("Preencha todos os campos");
    loginMutation.mutate(form);
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupForm.username || !setupForm.password || !setupForm.nome)
      return toast.error("Preencha todos os campos");
    if (setupForm.password.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    setupMutation.mutate(setupForm);
  };

  if (checkingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  const isFirstAccess = !hasUsers;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Wrench size={20} className="text-primary-foreground" />
        </div>
        <div>
          <p className="font-display font-semibold text-foreground text-lg leading-tight">SysPME</p>
          <p className="text-muted-foreground text-xs">Sistema de Gestão para Oficinas</p>
        </div>
      </div>

      {/* Card de login */}
      <Card className="w-full max-w-sm border-border shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            {isFirstAccess || setupMode ? "Configuração inicial" : "Entrar"}
          </CardTitle>
          <CardDescription>
            {isFirstAccess || setupMode
              ? "Crie o usuário administrador do sistema"
              : "Acesse o sistema com suas credenciais"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFirstAccess || setupMode ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  placeholder="Ex: João Silva"
                  value={setupForm.nome}
                  onChange={(e) => setSetupForm((p) => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setup-user">Usuário</Label>
                <Input
                  id="setup-user"
                  placeholder="Ex: admin"
                  value={setupForm.username}
                  onChange={(e) => setSetupForm((p) => ({ ...p, username: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setup-pass">Senha (mín. 6 caracteres)</Label>
                <div className="relative">
                  <Input
                    id="setup-pass"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={setupForm.password}
                    onChange={(e) => setSetupForm((p) => ({ ...p, password: e.target.value }))}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={setupMutation.isPending}>
                {setupMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                Criar conta
              </Button>
              {!isFirstAccess && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setSetupMode(false)}
                >
                  Voltar ao login
                </Button>
              )}
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  placeholder="Seu usuário"
                  value={form.username}
                  autoComplete="username"
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    autoComplete="current-password"
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                Entrar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground/50 text-xs mt-6">
        © {new Date().getFullYear()} SysPME · Todos os direitos reservados
      </p>
    </div>
  );
}
