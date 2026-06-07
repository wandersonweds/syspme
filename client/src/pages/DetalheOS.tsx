import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  Pencil,
  Wrench,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  ThumbsUp,
  Car,
  Navigation,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { useLocalAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StatusBadge, formatCurrency, formatDate, formatDateTime, FORMAS_PAGAMENTO } from "@/lib/utils-app";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_ICONS: Record<string, any> = {
  Aberta: AlertCircle,
  "Em Andamento": Clock,
  Finalizada: CheckCircle2,
  Cancelada: XCircle,
};

function StatusFlow({ current }: { current: string }) {
  const steps = ["Aberta", "Em Andamento", "Finalizada"];
  const cancelada = current === "Cancelada";

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {cancelada ? (
        <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
          <XCircle size={16} /> Cancelada
        </span>
      ) : (
        steps.map((step, idx) => {
          const currentIdx = steps.indexOf(current);
          const isActive = step === current;
          const isDone = currentIdx > idx;
          return (
            <div key={step} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isActive || isDone ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full border border-current" />
                )}
                {step}
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight size={12} className="text-muted-foreground" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Componente de impressão: Orçamento ─────────────────────────────────────
function OrcamentoPrint({
  os,
  itens,
  cliente,
  oficina,
}: {
  os: any;
  itens: any[];
  cliente: any;
  oficina: any;
}) {
  return (
    <div id="pdf-content" className="hidden print:block p-8 max-w-2xl mx-auto font-sans text-gray-900">
      {/* Cabeçalho */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{oficina?.nome ?? "Oficina"}</h1>
            {oficina?.cnpj && <p className="text-sm text-gray-600">CNPJ: {oficina.cnpj}</p>}
            {oficina?.telefone && <p className="text-sm text-gray-600">Tel: {oficina.telefone}</p>}
            {oficina?.email && <p className="text-sm text-gray-600">{oficina.email}</p>}
            {oficina?.endereco && <p className="text-sm text-gray-600">{oficina.endereco}</p>}
          </div>
          <div className="text-right">
            {/* Destaque: ORÇAMENTO */}
            <div className="inline-block border-2 border-gray-800 px-4 py-1 mb-2">
              <p className="text-xl font-black text-gray-800 tracking-widest uppercase">Orçamento</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">O.S. #{os.numero ?? os.id}</p>
            <p className="text-sm text-gray-600">Data: {formatDate(os.createdAt)}</p>
            <p className="text-sm font-semibold mt-1 text-orange-600">Aguardando aprovação</p>
          </div>
        </div>
      </div>

      {/* Aviso de orçamento */}
      <div className="mb-5 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
        <strong>ORÇAMENTO SUJEITO A APROVAÇÃO</strong> — Este documento é um orçamento e não representa
        cobrança. Após aprovação, será emitido o recibo de serviço.
      </div>

      {/* Dados do cliente */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <h2 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">Dados do Cliente</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{cliente?.nome}</span></div>
          <div><span className="text-gray-500">CPF/CNPJ:</span> <span className="font-medium">{cliente?.cpfCnpj}</span></div>
          <div><span className="text-gray-500">Telefone:</span> <span className="font-medium">{cliente?.telefone}</span></div>
          <div><span className="text-gray-500">E-mail:</span> <span className="font-medium">{cliente?.email}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Endereço:</span> <span className="font-medium">{cliente?.endereco}</span></div>
        </div>
      </div>

      {/* Itens */}
      <div className="mb-6">
        <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Serviços e Peças</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Descrição</th>
              <th className="text-right p-2">Qtd.</th>
              <th className="text-right p-2">Valor Unit.</th>
              <th className="text-right p-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item: any, idx: number) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="p-2 border-b border-gray-200">{item.tipo}</td>
                <td className="p-2 border-b border-gray-200">{item.descricao}</td>
                <td className="p-2 border-b border-gray-200 text-right">{parseFloat(String(item.quantidade))}</td>
                <td className="p-2 border-b border-gray-200 text-right">{formatCurrency(parseFloat(String(item.valorUnitario)))}</td>
                <td className="p-2 border-b border-gray-200 text-right font-medium">{formatCurrency(parseFloat(String(item.subtotal)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totais */}
      <div className="no-break flex justify-end mb-6">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(itens.reduce((a: number, i: any) => a + parseFloat(String(i.subtotal)), 0))}</span>
          </div>
          {parseFloat(String(os.desconto)) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Desconto</span>
              <span>-{formatCurrency(parseFloat(String(os.desconto)))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-1 mt-1">
            <span>Total do Orçamento</span>
            <span>{formatCurrency(parseFloat(String(os.valorTotal)))}</span>
          </div>
          {os.formaPagamento && (
            <div className="flex justify-between text-gray-600">
              <span>Pagamento previsto</span>
              <span>{os.formaPagamento}</span>
            </div>
          )}
        </div>
      </div>

      {os.observacoes && (
        <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
          <span className="font-semibold">Observações: </span>{os.observacoes}
        </div>
      )}

      {/* Assinatura */}
      <div className="no-break mt-10 pt-6 border-t border-gray-300 grid grid-cols-2 gap-8 text-sm text-gray-600">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-8">Assinatura do Cliente</div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-8">Responsável pela Oficina</div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        Orçamento gerado em {formatDateTime(new Date())} · SysPME
      </div>
    </div>
  );
}

// ─── Componente de impressão: Recibo ────────────────────────────────────────
function ReciboPrint({
  os,
  itens,
  cliente,
  oficina,
}: {
  os: any;
  itens: any[];
  cliente: any;
  oficina: any;
}) {
  return (
    <div id="pdf-content" className="hidden print:block p-8 max-w-2xl mx-auto font-sans text-gray-900">
      {/* Cabeçalho */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{oficina?.nome ?? "Oficina"}</h1>
            {oficina?.cnpj && <p className="text-sm text-gray-600">CNPJ: {oficina.cnpj}</p>}
            {oficina?.telefone && <p className="text-sm text-gray-600">Tel: {oficina.telefone}</p>}
            {oficina?.email && <p className="text-sm text-gray-600">{oficina.email}</p>}
            {oficina?.endereco && <p className="text-sm text-gray-600">{oficina.endereco}</p>}
          </div>
          <div className="text-right">
            {/* Destaque: RECIBO */}
            <div className="inline-block border-2 border-green-700 bg-green-50 px-4 py-1 mb-2">
              <p className="text-xl font-black text-green-800 tracking-widest uppercase">Recibo</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">O.S. #{os.numero ?? os.id}</p>
            <p className="text-sm text-gray-600">Data: {formatDate(os.createdAt)}</p>
            <p className="text-sm font-semibold mt-1 text-green-700">✓ Serviço Finalizado</p>
          </div>
        </div>
      </div>

      {/* Aviso de recibo */}
      <div className="mb-5 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
        <strong>RECIBO DE SERVIÇO FINALIZADO</strong> — Confirma-se que os serviços descritos abaixo
        foram realizados e o pagamento foi efetuado conforme acordado.
      </div>

      {/* Dados do cliente */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <h2 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">Dados do Cliente</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{cliente?.nome}</span></div>
          <div><span className="text-gray-500">CPF/CNPJ:</span> <span className="font-medium">{cliente?.cpfCnpj}</span></div>
          <div><span className="text-gray-500">Telefone:</span> <span className="font-medium">{cliente?.telefone}</span></div>
          <div><span className="text-gray-500">E-mail:</span> <span className="font-medium">{cliente?.email}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Endereço:</span> <span className="font-medium">{cliente?.endereco}</span></div>
        </div>
      </div>

      {/* Itens */}
      <div className="mb-6">
        <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Serviços e Peças Realizados</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Descrição</th>
              <th className="text-right p-2">Qtd.</th>
              <th className="text-right p-2">Valor Unit.</th>
              <th className="text-right p-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item: any, idx: number) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="p-2 border-b border-gray-200">{item.tipo}</td>
                <td className="p-2 border-b border-gray-200">{item.descricao}</td>
                <td className="p-2 border-b border-gray-200 text-right">{parseFloat(String(item.quantidade))}</td>
                <td className="p-2 border-b border-gray-200 text-right">{formatCurrency(parseFloat(String(item.valorUnitario)))}</td>
                <td className="p-2 border-b border-gray-200 text-right font-medium">{formatCurrency(parseFloat(String(item.subtotal)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totais */}
      <div className="no-break flex justify-end mb-6">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(itens.reduce((a: number, i: any) => a + parseFloat(String(i.subtotal)), 0))}</span>
          </div>
          {parseFloat(String(os.desconto)) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Desconto</span>
              <span>-{formatCurrency(parseFloat(String(os.desconto)))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-1 mt-1">
            <span>Total Pago</span>
            <span>{formatCurrency(parseFloat(String(os.valorTotal)))}</span>
          </div>
          {os.formaPagamento && (
            <div className="flex justify-between text-gray-600">
              <span>Forma de pagamento</span>
              <span>{os.formaPagamento}</span>
            </div>
          )}
        </div>
      </div>

      {os.observacoes && (
        <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
          <span className="font-semibold">Observações: </span>{os.observacoes}
        </div>
      )}

      {/* Observação Final */}
      {os.observacaoFinal && (
        <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-700">
          <span className="font-semibold">Observação Final: </span>{os.observacaoFinal}
        </div>
      )}
      {/* Confirmação de pagamento */}
      <div className="no-break mt-6 bg-green-50 border border-green-300 rounded-lg p-4 text-sm text-green-800 text-center">
        <p className="font-bold text-base mb-1">✓ Pagamento Confirmado</p>
        <p>Declaro que os serviços descritos neste recibo foram devidamente realizados e o pagamento no valor de <strong>{formatCurrency(parseFloat(String(os.valorTotal)))}</strong> foi recebido integralmente via <strong>{os.formaPagamento ?? 'conforme acordado'}</strong>.</p>
      </div>

      {/* Assinatura */}
      <div className="no-break mt-10 pt-6 border-t border-gray-300 grid grid-cols-2 gap-8 text-sm text-gray-600">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-8">Assinatura do Cliente</div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-8">Responsável pela Oficina</div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        Recibo gerado em {formatDateTime(new Date())} · SysPME
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function DetalheOS() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const osId = Number(params.id);
  const utils = trpc.useUtils();
  const { user } = useLocalAuth();
  const isAdmin = user?.role === "admin";
  const [confirmFinalizar, setConfirmFinalizar] = useState(false);
  const [observacaoFinal, setObservacaoFinal] = useState("");
  const [formaPagamentoFinal, setFormaPagamentoFinal] = useState<string>("Dinheiro");
  const [confirmVoltarEtapa, setConfirmVoltarEtapa] = useState(false);

  const { data, isLoading } = trpc.os.getById.useQuery({ id: osId });
  const { data: pdfData } = trpc.os.dadosPDF.useQuery({ id: osId }, { staleTime: 0 });
  const { data: usuarios } = trpc.usuarios.listar.useQuery(undefined, { enabled: isAdmin });

  const reatribuir = trpc.os.reatribuir.useMutation({
    onSuccess: () => {
      toast.success("Responsável atualizado!");
      utils.os.getById.invalidate({ id: osId });
    },
    onError: (e) => toast.error(e.message),
  });

  const atualizarStatus = trpc.os.atualizarStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      utils.os.getById.invalidate({ id: osId });
      utils.os.dadosPDF.invalidate({ id: osId });
      utils.os.listar.invalidate();
      utils.dashboard.metrics.invalidate();
      setConfirmFinalizar(false);
    },
    onError: (e) => toast.error(e.message),
  });

    // Gera HTML completo em nova janela para garantir PDF multipágina sem cortes
  const buildPrintHtml = (tipo: "orcamento" | "recibo") => {
    if (!pdfData) return "";
    const { os: osData, itens: itensData, cliente: clienteData, oficina: oficData } = pdfData;
    const fmtCurrency = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const fmtDate = (d: Date | string) =>
      new Date(d).toLocaleDateString("pt-BR");
    const totalBrutoHtml = itensData.reduce((a: number, i: any) => a + parseFloat(String(i.subtotal)), 0);
    const descontoHtml = parseFloat(String(osData.desconto));
    const isOrcamento = tipo === "orcamento";

    const itensRows = itensData
      .map((item: any, idx: number) => `
        <tr style="background:${idx % 2 === 0 ? "#fff" : "#f9f9f9"}">
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${item.tipo}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${item.descricao}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${parseFloat(String(item.quantidade))}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${fmtCurrency(parseFloat(String(item.valorUnitario)))}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${fmtCurrency(parseFloat(String(item.subtotal)))}</td>
        </tr>`)
      .join("");

    return `<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="UTF-8">
      <title>${isOrcamento ? "Orçamento" : "Recibo"} - O.S. #${osData.numero ?? osData.id}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 20mm 15mm; }
        h1 { font-size: 20px; font-weight: 700; }
        h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #1f2937; color: #fff; }
        thead th { padding: 7px 8px; text-align: left; font-size: 12px; }
        thead th:nth-child(n+3) { text-align: right; }
        .section { margin-bottom: 20px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 20px; }
        .totals-inner { width: 240px; }
        .totals-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
        .totals-row.total { font-weight: 700; font-size: 15px; border-top: 2px solid #374151; padding-top: 6px; margin-top: 4px; }
        .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; }
        .sig-line { text-align: center; padding-top: 40px; border-top: 1px solid #9ca3af; font-size: 12px; color: #555; }
        .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 20px; }
        .badge { display: inline-block; padding: 2px 10px; font-size: 14px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
        .badge-orc { border: 2px solid #1f2937; color: #1f2937; }
        .badge-rec { border: 2px solid #166534; background: #f0fdf4; color: #166534; }
        @page { margin: 15mm 12mm; size: A4; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <div style="border-bottom:2px solid #1f2937;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start">
        <div style="display:flex;align-items:flex-start;gap:12px">
          ${oficData?.logomarcaUrl ? `<img src="${oficData.logomarcaUrl.startsWith('http') ? oficData.logomarcaUrl : window.location.origin + oficData.logomarcaUrl}" alt="Logo" style="width:60px;height:60px;object-fit:contain;border-radius:4px" />` : ""}
          <div>
            <h1>${oficData?.nome ?? "Oficina"}</h1>
            ${oficData?.cnpj ? `<p>CPF/CNPJ: ${oficData.cnpj}</p>` : ""}
            ${oficData?.telefone ? `<p>Tel: ${oficData.telefone}</p>` : ""}
            ${oficData?.email ? `<p>${oficData.email}</p>` : ""}
            ${oficData?.endereco ? `<p>${oficData.endereco}</p>` : ""}
          </div>
        </div>
        <div style="text-align:right">
          <div class="badge ${isOrcamento ? "badge-orc" : "badge-rec"}">${isOrcamento ? "Orçamento" : "Recibo"}</div>
          <p style="font-size:18px;font-weight:700;margin-top:6px">O.S. #${osData.numero ?? osData.id}</p>
          <p style="color:#555">Data: ${fmtDate(osData.createdAt)}</p>
          ${isOrcamento ? '<p style="color:#d97706;font-weight:600">Aguardando aprovação</p>' : '<p style="color:#166534;font-weight:600">✓ Serviço Finalizado</p>'}
        </div>
      </div>
      <div class="section" style="background:#f9fafb;border-radius:8px;padding:12px">
        <h2>Dados do Cliente</h2>
        <div class="grid2">
          <div><span style="color:#6b7280">Nome:</span> <strong>${clienteData?.nome ?? ""}</strong></div>
          <div><span style="color:#6b7280">CPF/CNPJ:</span> <strong>${clienteData?.cpfCnpj ?? ""}</strong></div>
          <div><span style="color:#6b7280">Telefone:</span> <strong>${clienteData?.telefone ?? ""}</strong></div>
          <div><span style="color:#6b7280">E-mail:</span> <strong>${clienteData?.email ?? ""}</strong></div>
          <div style="grid-column:span 2"><span style="color:#6b7280">Endereço:</span> <strong>${clienteData?.endereco ?? ""}</strong></div>
        </div>
        ${(osData.veiculoPlaca || osData.veiculoModelo || osData.veiculoAno) ? `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb">
          <h2 style="margin-bottom:6px">Veículo</h2>
          <div class="grid2">
            ${osData.veiculoPlaca ? `<div><span style="color:#6b7280">Placa:</span> <strong style="font-family:monospace">${osData.veiculoPlaca}</strong></div>` : ""}
            ${osData.veiculoModelo ? `<div><span style="color:#6b7280">Modelo:</span> <strong>${osData.veiculoModelo}</strong></div>` : ""}
            ${osData.veiculoAno ? `<div><span style="color:#6b7280">Ano:</span> <strong>${osData.veiculoAno}</strong></div>` : ""}
          </div>
        </div>` : ""}
      </div>
      <div class="section">
        <h2>Serviços e Peças</h2>
        <table>
          <thead><tr>
            <th>Tipo</th><th>Descrição</th>
            <th style="text-align:right">Qtd.</th>
            <th style="text-align:right">Valor Unit.</th>
            <th style="text-align:right">Subtotal</th>
          </tr></thead>
          <tbody>${itensRows}</tbody>
        </table>
      </div>
      <div class="totals">
        <div class="totals-inner">
          <div class="totals-row"><span style="color:#6b7280">Subtotal</span><span>${fmtCurrency(totalBrutoHtml)}</span></div>
          ${descontoHtml > 0 ? `<div class="totals-row" style="color:#dc2626"><span>Desconto</span><span>-${fmtCurrency(descontoHtml)}</span></div>` : ""}
          ${osData.houveDeslocamento && osData.kmGasto && osData.valorPorKm ? `<div class="totals-row"><span style="color:#6b7280">Deslocamento (${parseFloat(String(osData.kmGasto))} km)</span><span>${fmtCurrency(parseFloat(String(osData.kmGasto)) * parseFloat(String(osData.valorPorKm)))}</span></div>` : ""}
          <div class="totals-row total"><span>${isOrcamento ? "Total do Orçamento" : "Total"}</span><span>${fmtCurrency(parseFloat(String(osData.valorTotal)))}</span></div>
          ${osData.formaPagamento ? `<div class="totals-row" style="color:#6b7280"><span>${isOrcamento ? "Pagamento previsto" : "Forma de pagamento"}</span><span>${osData.formaPagamento}</span></div>` : ""}
        </div>
      </div>
      ${osData.observacoes ? `<div style="border-top:1px solid #e5e7eb;padding-top:12px;font-size:12px;color:#555"><strong>Observações:</strong> ${osData.observacoes}</div>` : ""}
      ${!isOrcamento && osData.observacaoFinal ? `<div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:8px;font-size:12px;color:#374151"><strong>Observação Final:</strong> ${osData.observacaoFinal}</div>` : ""}
      ${!isOrcamento ? `<div style="margin-top:20px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;text-align:center;font-size:12px;color:#166534">
        <p style="font-weight:700;font-size:14px;margin-bottom:6px">✓ Pagamento Confirmado</p>
        <p>Declaro que os serviços descritos neste recibo foram devidamente realizados e o pagamento no valor de <strong>${fmtCurrency(parseFloat(String(osData.valorTotal)))}</strong> foi recebido integralmente via <strong>${osData.formaPagamento ?? 'conforme acordado'}</strong>.</p>
      </div>` : ""}
      <div class="sig">
        <div class="sig-line">Assinatura do Cliente</div>
        <div class="sig-line">Responsável pela Oficina</div>
      </div>
      <div class="footer">${isOrcamento ? "Orçamento" : "Recibo"} gerado em ${new Date().toLocaleString("pt-BR")} · SysPME</div>
    </body></html>`;
  };

  const handlePrintOrcamento = () => {
    const html = buildPrintHtml("orcamento");
    if (!html) return toast.error("Aguarde os dados carregarem.");
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return toast.error("Permita pop-ups para gerar o PDF.");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };
  const handlePrintRecibo = () => {
    const html = buildPrintHtml("recibo");
    if (!html) return toast.error("Aguarde os dados carregarem.");
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return toast.error("Permita pop-ups para gerar o PDF.");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };
  const handleDownloadRecibo = useCallback(() => {
    const html = buildPrintHtml("recibo");
    if (!html) return toast.error("Aguarde os dados carregarem.");
    const osNum = pdfData?.os?.numero ?? pdfData?.os?.id ?? osId;
    // Abre nova janela com o HTML do recibo e aciona o diálogo de impressão
    // O usuário escolhe "Salvar como PDF" no diálogo do browser
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return toast.error("Permita pop-ups para gerar o PDF.");
    // Injeta o título do arquivo sugerido via <title>
    const htmlComTitulo = html.replace(
      /<title>[^<]*<\/title>/i,
      `<title>Recibo-OS-${osNum}</title>`
    );
    w.document.write(htmlComTitulo);
    w.document.close();
    w.focus();
    // Aguarda o documento carregar antes de acionar print
    setTimeout(() => {
      w.print();
      // Fecha a janela após o diálogo de impressão ser fechado
      w.onafterprint = () => w.close();
    }, 400);
  }, [pdfData, osId]);

  const handleFinalizarServico = () => {
    atualizarStatus.mutate({
      id: osId,
      status: "Finalizada",
      observacaoFinal: observacaoFinal.trim() || undefined,
      formaPagamento: formaPagamentoFinal as any,
    });
  };

  if (isLoading) {
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

  if (!data) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto text-center py-16">
          <p className="text-muted-foreground">Ordem de serviço não encontrada.</p>
          <Button className="mt-4" onClick={() => navigate("/ordens")}>
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const { os, itens, cliente } = data;
  const totalBruto = itens.reduce((a, i) => a + parseFloat(String(i.subtotal)), 0);
  const isFinalizada = os.status === "Finalizada";
  const isCancelada = os.status === "Cancelada";
  const isAberta = os.status === "Aberta";
  const isEmAndamento = os.status === "Em Andamento";
  const canFinalize = isEmAndamento; // só pode finalizar quando Em Andamento

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/ordens")}>
              <ArrowLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-foreground">O.S. #{os.numero ?? os.id}</h1>
                <StatusBadge status={os.status} />
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                Criada em {formatDateTime(os.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-11 sm:ml-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/ordens/${osId}/editar`)}
              disabled={isFinalizada || isCancelada}
            >
              <Pencil size={14} />
              Editar
            </Button>

            {/* Botão Orçamento: disponível quando não finalizada/cancelada */}
            {!isFinalizada && !isCancelada && (
              <Button variant="outline" size="sm" className="gap-2" onClick={handlePrintOrcamento}>
                <Printer size={14} />
                Imprimir Orçamento
              </Button>
            )}

            {/* Botão Voltar Etapa: Em Andamento → Aberta ou Finalizada → Em Andamento */}
            {(isEmAndamento || isFinalizada) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => setConfirmVoltarEtapa(true)}
                disabled={atualizarStatus.isPending}
              >
                <ArrowLeft size={14} />
                Voltar Etapa
              </Button>
            )}
            {/* Botão Orçamento Aprovado: aparece apenas quando status = Aberta */}
            {isAberta && (
              <Button
                size="sm"
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => atualizarStatus.mutate({ id: osId, status: "Em Andamento" })}
                disabled={atualizarStatus.isPending}
              >
                <ThumbsUp size={14} />
                Orçamento Aprovado
              </Button>
            )}
            {/* Botão Finalizar Serviço: aparece apenas quando Em Andamento */}
            {canFinalize && (
              <Button
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setConfirmFinalizar(true)}
                disabled={atualizarStatus.isPending}
              >
                <CheckCircle2 size={14} />
                Finalizar Serviço
              </Button>
            )}

            {/* Botões Recibo: disponíveis apenas quando finalizada */}
            {isFinalizada && (
              <>
                <Button size="sm" className="gap-2" onClick={handlePrintRecibo}>
                  <Printer size={14} />
                  Imprimir Recibo
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={handleDownloadRecibo}>
                  <Download size={14} />
                  Salvar como PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Reatribuição de responsável (apenas admin) */}
        {isAdmin && usuarios && usuarios.length > 1 && (
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground shrink-0">
                  <User size={14} className="text-muted-foreground" />
                  Responsável pela O.S.
                </div>
                <Select
                  value={String(data?.os?.userId ?? "")}
                  onValueChange={(val) => reatribuir.mutate({ osId, userId: Number(val) })}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.nome} {u.role === "admin" ? "(admin)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reatribuir.isPending && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fluxo de status */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Fluxo de Status</p>
                <StatusFlow current={os.status} />
              </div>
              {/* Controle manual de status (apenas para Cancelar ou ajustes) */}
              {!isFinalizada && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Cancelar O.S.:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => atualizarStatus.mutate({ id: osId, status: "Cancelada" })}
                    disabled={atualizarStatus.isPending || isCancelada}
                  >
                    <XCircle size={13} />
                    Cancelar
                  </Button>
                  {atualizarStatus.isPending && (
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados do cliente */}
          <Card className="border-border lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User size={16} className="text-muted-foreground" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <p className="font-semibold text-foreground">{cliente?.nome}</p>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="shrink-0" />
                  <span>{cliente?.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="shrink-0" />
                  <span className="truncate">{cliente?.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="shrink-0 mt-0.5" />
                  <span>{cliente?.endereco}</span>
                </div>
              </div>
              <Separator />
              <div className="text-sm">
                <span className="text-muted-foreground">CPF/CNPJ: </span>
                <span className="font-mono">{cliente?.cpfCnpj}</span>
              </div>
            </CardContent>
          </Card>

          {/* Itens e totais */}
          <Card className="border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText size={16} className="text-muted-foreground" />
                Itens da O.S.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {itens.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 py-2.5 border-b border-border last:border-0"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      {item.tipo === "Serviço" ? (
                        <Wrench size={13} className="text-muted-foreground" />
                      ) : (
                        <Package size={13} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.tipo} · {parseFloat(String(item.quantidade))} ×{" "}
                        {formatCurrency(parseFloat(String(item.valorUnitario)))}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground shrink-0">
                    {formatCurrency(parseFloat(String(item.subtotal)))}
                  </p>
                </div>
              ))}

              <Separator />

              {/* Totais */}
              <div className="space-y-1.5 text-sm pt-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totalBruto)}</span>
                </div>
                {parseFloat(String(os.desconto)) > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Desconto</span>
                    <span>-{formatCurrency(parseFloat(String(os.desconto)))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-foreground pt-1 border-t border-border">
                  <span>Total</span>
                  <span>{formatCurrency(parseFloat(String(os.valorTotal)))}</span>
                </div>
                {os.formaPagamento && (
                  <div className="flex justify-between text-muted-foreground text-xs pt-1">
                    <span>Forma de pagamento</span>
                    <span>{os.formaPagamento}</span>
                  </div>
                )}
              </div>

              {os.observacoes && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="text-muted-foreground font-medium">Observações: </span>
                    <span className="text-foreground">{os.observacoes}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Veículo e Deslocamento */}
        {(os.veiculoPlaca || os.veiculoModelo || os.veiculoAno || os.houveDeslocamento) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(os.veiculoPlaca || os.veiculoModelo || os.veiculoAno) && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Car size={16} className="text-muted-foreground" />
                    Veículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {os.veiculoPlaca && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Placa</span>
                      <span className="font-mono font-semibold">{os.veiculoPlaca}</span>
                    </div>
                  )}
                  {os.veiculoModelo && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modelo</span>
                      <span className="font-medium">{os.veiculoModelo}</span>
                    </div>
                  )}
                  {os.veiculoAno && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ano</span>
                      <span className="font-medium">{os.veiculoAno}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {os.houveDeslocamento && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Navigation size={16} className="text-muted-foreground" />
                    Deslocamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {os.kmGasto && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">KM gasto</span>
                      <span className="font-medium">{parseFloat(String(os.kmGasto))} km</span>
                    </div>
                  )}
                  {os.valorPorKm && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor por KM</span>
                      <span className="font-medium">{formatCurrency(parseFloat(String(os.valorPorKm)))}</span>
                    </div>
                  )}
                  {os.kmGasto && os.valorPorKm && (
                    <div className="flex justify-between font-semibold border-t border-border pt-2">
                      <span>Custo total</span>
                      <span>{formatCurrency(parseFloat(String(os.kmGasto)) * parseFloat(String(os.valorPorKm)))}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

            {/* Dialog de confirmação para finalizar serviço */}
      {/* Dialog: Voltar Etapa */}
      <AlertDialog open={confirmVoltarEtapa} onOpenChange={setConfirmVoltarEtapa}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voltar Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              {isFinalizada
                ? "Deseja reverter esta O.S. de Finalizada para Em Andamento?"
                : "Deseja reverter esta O.S. de Em Andamento para Aberta?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const novoStatus = isFinalizada ? "Em Andamento" : "Aberta";
                atualizarStatus.mutate({ id: osId, status: novoStatus as any });
                setConfirmVoltarEtapa(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmFinalizar} onOpenChange={setConfirmFinalizar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que o serviço da O.S. #{data?.os?.numero ?? osId} foi concluído? Após finalizar, será possível imprimir o <strong>Recibo de Serviço Finalizado</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Forma de Pagamento
              </label>
              <Select value={formaPagamentoFinal} onValueChange={setFormaPagamentoFinal}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Observação Final <span className="text-xs text-muted-foreground font-normal">(opcional — aparece no recibo)</span>
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Ex: Troca de óleo realizada, filtros substituídos, freios revisados..."
                value={observacaoFinal}
                onChange={(e) => setObservacaoFinal(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalizarServico}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {atualizarStatus.isPending ? (
                <Loader2 size={14} className="animate-spin mr-2" />
              ) : null}
              Confirmar Finalização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
