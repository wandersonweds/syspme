import { useState, useEffect, useRef } from "react";
import { Settings, Loader2, Save, KeyRound, ImagePlus, X, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { maskCpfCnpj, maskTelefone } from "@/lib/utils-app";

export default function Configuracoes() {
  const { user } = useLocalAuth();
  const isAdmin = user?.role === "admin";
  const { data, isLoading } = trpc.config.get.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    telefone2: "",
    endereco: "",
    cnpj: "",
    email: "",
  });
  const [initialized, setInitialized] = useState(false);

  // Logomarca
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Alterar senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  useEffect(() => {
    if (data && !initialized) {
      setForm({
        nome: data.nome ?? "",
        telefone: data.telefone ?? "",
        telefone2: data.telefone2 ?? "",
        endereco: data.endereco ?? "",
        cnpj: data.cnpj ?? "",
        email: data.email ?? "",
      });
      if (data.logomarcaUrl) setLogoPreview(data.logomarcaUrl);
      setInitialized(true);
    }
  }, [data, initialized]);

  const salvar = trpc.config.salvar.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      utils.config.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadLogoMutation = trpc.config.uploadLogo.useMutation({
    onSuccess: (result) => {
      setLogoPreview(result.logoUrl ?? null);
      setLogoFile(null);
      setUploadingLogo(false);
      toast.success("Logomarca atualizada com sucesso!");
      utils.config.get.invalidate();
    },
    onError: (e) => {
      setUploadingLogo(false);
      toast.error(e.message);
    },
  });

  const alterarSenhaMutation = trpc.localAuth.alterarSenha.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) return toast.error("O nome da oficina é obrigatório.");
    salvar.mutate(form);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadLogoMutation.mutate({ base64, mimeType: logoFile.type, fileName: logoFile.name });
    };
    reader.readAsDataURL(logoFile);
  };

  const handleAlterarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual) return toast.error("Informe a senha atual.");
    if (novaSenha.length < 6) return toast.error("A nova senha deve ter pelo menos 6 caracteres.");
    if (novaSenha !== confirmarSenha) return toast.error("As senhas não coincidem.");
    alterarSenhaMutation.mutate({ senhaAtual, novaSenha });
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Dados da oficina exibidos nos recibos e documentos gerados.
          </p>
        </div>

        {/* Logomarca — apenas admin */}
        {!isAdmin && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <ShieldAlert size={15} className="shrink-0" />
            As configurações da oficina só podem ser alteradas pelo administrador.
          </div>
        )}
        {isAdmin && (<>
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ImagePlus size={16} className="text-muted-foreground" />
              Logomarca da Oficina
            </CardTitle>
            <CardDescription>
              Aparece no cabeçalho dos orçamentos e recibos em PDF. Formatos: PNG, JPG. Máx. 2MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logomarca" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImagePlus size={28} className="text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5"
                  >
                    <ImagePlus size={14} />
                    {logoPreview ? "Trocar imagem" : "Selecionar imagem"}
                  </Button>
                  {logoPreview && !logoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => {
                        setLogoPreview(null);
                        uploadLogoMutation.mutate({ base64: "", mimeType: "", fileName: "" });
                      }}
                    >
                      <X size={14} />
                      Remover
                    </Button>
                  )}
                </div>
                {logoFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {logoFile.name}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUploadLogo}
                      disabled={uploadingLogo}
                      className="gap-1.5"
                    >
                      {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Salvar logo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setLogoFile(null); setLogoPreview(data?.logomarcaUrl ?? null); }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados da Oficina */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings size={16} className="text-muted-foreground" />
              Dados da Oficina
            </CardTitle>
            <CardDescription>
              Estas informações aparecem no cabeçalho dos recibos em PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome da Oficina *</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                    placeholder="Ex: Oficina do João"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cnpj">CPF/CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={form.cnpj}
                      onChange={(e) => setForm((p) => ({ ...p, cnpj: maskCpfCnpj(e.target.value) }))}
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={form.telefone}
                      onChange={(e) => setForm((p) => ({ ...p, telefone: maskTelefone(e.target.value) }))}
                      placeholder="(47) 99999-0000"
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone2">Telefone 2 <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                  <Input
                    id="telefone2"
                    value={form.telefone2}
                    onChange={(e) => setForm((p) => ({ ...p, telefone2: maskTelefone(e.target.value) }))}
                    placeholder="(47) 99999-0000"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="contato@oficina.com.br"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={form.endereco}
                    onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                    placeholder="Rua das Oficinas, 100 - Itajaí/SC"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={salvar.isPending} className="gap-2">
                    {salvar.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Salvar configurações
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        </>)}

        {/* Alterar Senha */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <KeyRound size={16} className="text-muted-foreground" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Altere a senha de acesso da sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAlterarSenha} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="senha-atual">Senha atual</Label>
                <Input
                  id="senha-atual"
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite a senha atual"
                  autoComplete="current-password"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nova-senha">Nova senha</Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                  <Input
                    id="confirmar-senha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={alterarSenhaMutation.isPending} className="gap-2">
                  {alterarSenhaMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  Alterar senha
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
