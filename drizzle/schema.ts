import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Tabela de Usuários (autenticação local) ───────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Usuários locais (login por usuário/senha) ─────────────────────────────
export const localUsers = mysqlTable("local_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  nome: varchar("nome", { length: 150 }).notNull(),
  /** Perfil de acesso: 'admin' tem acesso total, 'user' vê apenas suas próprias OS */
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Configurações da Oficina ──────────────────────────────────────────────
export const configOficina = mysqlTable("config_oficina", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 150 }).notNull().default("Minha Oficina"),
  telefone: varchar("telefone", { length: 20 }),
  /** Segundo número de telefone/WhatsApp da oficina (opcional) */
  telefone2: varchar("telefone2", { length: 20 }),
  endereco: varchar("endereco", { length: 255 }),
  cnpj: varchar("cnpj", { length: 20 }),
  email: varchar("email", { length: 150 }),
  /** URL ou caminho da logomarca da oficina (exibida no cabeçalho e nos PDFs) */
  logomarcaUrl: varchar("logomarca_url", { length: 500 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Clientes ──────────────────────────────────────────────────────────────
export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 150 }).notNull(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }).notNull(),
  endereco: varchar("endereco", { length: 255 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Ordens de Serviço ─────────────────────────────────────────────────────
export const ordensServico = mysqlTable("ordens_servico", {
  id: int("id").autoincrement().primaryKey(),
  /** Número sequencial legível da OS (1, 2, 3...). Separado do id para evitar saltos do AUTO_INCREMENT. */
  numero: int("numero").notNull().default(0),
  clienteId: int("cliente_id").notNull(),
  /** ID do usuário (mecânico) responsável pela OS. Admin pode reatribuir. */
  userId: int("user_id"),
  status: mysqlEnum("status", ["Aberta", "Em Andamento", "Finalizada", "Cancelada"])
    .default("Aberta")
    .notNull(),
  desconto: decimal("desconto", { precision: 10, scale: 2 }).default("0.00").notNull(),
  formaPagamento: mysqlEnum("forma_pagamento", [
    "Dinheiro",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Pix",
    "Boleto",
    "Outro",
  ]).default("Dinheiro"),
  valorTotal: decimal("valor_total", { precision: 10, scale: 2 }).default("0.00").notNull(),
  observacoes: text("observacoes"),
  observacaoFinal: text("observacao_final"),
  // ─── Dados do Veículo / Maquinário ────────────────────────────────────────
  veiculoPlaca: varchar("veiculo_placa", { length: 20 }),
  veiculoModelo: varchar("veiculo_modelo", { length: 100 }),
  veiculoAno: varchar("veiculo_ano", { length: 10 }),
  /** Número do chassi do veículo ou maquinário (opcional) */
  veiculoChassis: varchar("veiculo_chassis", { length: 50 }),
  /** Número de frota interno (opcional) */
  veiculoFrota: varchar("veiculo_frota", { length: 30 }),
  // ─── Deslocamento ─────────────────────────────────────────────────────────
  houveDeslocamento: boolean("houve_deslocamento").default(false).notNull(),
  kmGasto: decimal("km_gasto", { precision: 10, scale: 2 }),
  valorPorKm: decimal("valor_por_km", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Itens da OS ───────────────────────────────────────────────────────────
export const itensOs = mysqlTable("itens_os", {
  id: int("id").autoincrement().primaryKey(),
  osId: int("os_id").notNull(),
  tipo: mysqlEnum("tipo", ["Serviço", "Peça"]).notNull(),
  descricao: varchar("descricao", { length: 255 }).notNull(),
  quantidade: decimal("quantidade", { precision: 10, scale: 2 }).notNull(),
  valorUnitario: decimal("valor_unitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
});

// ─── Tipos inferidos ───────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;
export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;
export type OrdemServico = typeof ordensServico.$inferSelect;
export type InsertOrdemServico = typeof ordensServico.$inferInsert;
export type ItemOs = typeof itensOs.$inferSelect;
export type InsertItemOs = typeof itensOs.$inferInsert;
export type ConfigOficina = typeof configOficina.$inferSelect;
