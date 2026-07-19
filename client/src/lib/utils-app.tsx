import { cn } from "@/lib/utils";

// ─── Máscaras de input ────────────────────────────────────────────────────
/** Aplica máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) conforme a quantidade de dígitos */
export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Aplica máscara de telefone: (00) 00000-0000 para celular ou (00) 0000-0000 para fixo */
export function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

// ─── Formatação de moeda ───────────────────────────────────────────────────
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Formatação de data ────────────────────────────────────────────────────
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Badge de status da OS ─────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  Aberta: {
    label: "Aberta",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "Em Andamento": {
    label: "Em Andamento",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  Finalizada: {
    label: "Finalizada",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Cancelada: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Fluxo de status ───────────────────────────────────────────────────────
export const STATUS_FLOW = ["Aberta", "Em Andamento", "Finalizada", "Cancelada"] as const;
export type OSStatus = (typeof STATUS_FLOW)[number];

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Pix",
  "Boleto",
  "Outro",
] as const;
