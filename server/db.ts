import { and, desc, eq, gte, ilike, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Cliente,
  ConfigOficina,
  InsertCliente,
  InsertLocalUser,
  InsertOrdemServico,
  InsertUser,
  ItemOs,
  LocalUser,
  OrdemServico,
  clientes,
  configOficina,
  itensOs,
  localUsers,
  ordensServico,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Usuários sistema ───────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Usuários Locais ───────────────────────────────────────────────────────
export async function getLocalUserByUsername(username: string): Promise<LocalUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(localUsers).where(eq(localUsers.username, username)).limit(1);
  return result[0];
}

export async function createLocalUser(data: InsertLocalUser): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(localUsers).values(data);
}

export async function countLocalUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(localUsers);
  return Number(result[0]?.count ?? 0);
}

// ─── Clientes ──────────────────────────────────────────────────────────────
export async function listarClientes(busca?: string): Promise<Cliente[]> {
  const db = await getDb();
  if (!db) return [];
  if (busca) {
    const termo = `%${busca}%`;
    return db
      .select()
      .from(clientes)
      .where(
        and(
          eq(clientes.ativo, true),
          or(
            like(clientes.nome, termo),
            like(clientes.cpfCnpj, termo),
            like(clientes.telefone, termo),
            like(clientes.email, termo)
          )
        )
      )
      .orderBy(clientes.nome);
  }
  return db.select().from(clientes).where(eq(clientes.ativo, true)).orderBy(clientes.nome);
}

export async function listarTodosClientes(): Promise<Cliente[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientes).orderBy(clientes.nome);
}

export async function getClienteById(id: number): Promise<Cliente | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result[0];
}

export async function criarCliente(data: InsertCliente): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clientes).values(data);
  return (result[0] as any).insertId as number;
}

export async function atualizarCliente(id: number, data: Partial<InsertCliente>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(clientes).set(data).where(eq(clientes.id, id));
}

export async function inativarCliente(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(clientes).set({ ativo: false }).where(eq(clientes.id, id));
}

// ─── Ordens de Serviço ─────────────────────────────────────────────────────
export async function listarOS(filtros?: {
  clienteId?: number;
  status?: string;
  dataInicio?: Date;
  dataFim?: Date;
  /** Quando definido, filtra apenas OS deste usuário (para perfil 'user') */
  userId?: number;
}): Promise<(OrdemServico & { clienteNome: string; nomeResponsavel: string | null })[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filtros?.clienteId) conditions.push(eq(ordensServico.clienteId, filtros.clienteId));
  if (filtros?.status) conditions.push(eq(ordensServico.status, filtros.status as any));
  if (filtros?.dataInicio) conditions.push(gte(ordensServico.createdAt, filtros.dataInicio));
  if (filtros?.dataFim) conditions.push(lte(ordensServico.createdAt, filtros.dataFim));
  if (filtros?.userId !== undefined) conditions.push(eq(ordensServico.userId, filtros.userId));

  const responsavelAlias = db._.schema ? localUsers : localUsers;
  const rows = await db
    .select()
    .from(ordensServico)
    .leftJoin(clientes, eq(ordensServico.clienteId, clientes.id))
    .leftJoin(localUsers, eq(ordensServico.userId, localUsers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(ordensServico.createdAt));

  return rows.map((r) => ({
    ...r.ordens_servico,
    clienteNome: r.clientes?.nome ?? "—",
    nomeResponsavel: r.local_users?.nome ?? null,
  }));
}

export async function getOSById(id: number): Promise<OrdemServico | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ordensServico).where(eq(ordensServico.id, id)).limit(1);
  return result[0];
}

export async function criarOS(data: InsertOrdemServico): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Gera número sequencial legível (1, 2, 3...) independente do AUTO_INCREMENT do id
  const [maxRow] = await db
    .select({ maxNumero: sql<number>`COALESCE(MAX(numero), 0)` })
    .from(ordensServico);
  const proximoNumero = (maxRow?.maxNumero ?? 0) + 1;
  const result = await db.insert(ordensServico).values({ ...data, numero: proximoNumero });
  return (result[0] as any).insertId as number;
}

export async function atualizarOS(id: number, data: Partial<InsertOrdemServico>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(ordensServico).set(data).where(eq(ordensServico.id, id));
}

// ─── Itens da OS ───────────────────────────────────────────────────────────
export async function getItensByOsId(osId: number): Promise<ItemOs[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(itensOs).where(eq(itensOs.osId, osId));
}

export async function criarItensOS(items: typeof itensOs.$inferInsert[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  if (items.length > 0) await db.insert(itensOs).values(items);
}

export async function deletarItensByOsId(osId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(itensOs).where(eq(itensOs.osId, osId));
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export async function getDashboardMetrics(userId?: number) {
  const db = await getDb();
  if (!db) return { osAbertas: 0, osEmAndamento: 0, faturamentoMes: 0, totalClientes: 0 };

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  // Condição de escopo: se userId definido, filtra apenas OS do usuário
  const scopeAberta = userId
    ? and(eq(ordensServico.status, "Aberta"), eq(ordensServico.userId, userId))
    : eq(ordensServico.status, "Aberta");
  const scopeAndamento = userId
    ? and(eq(ordensServico.status, "Em Andamento"), eq(ordensServico.userId, userId))
    : eq(ordensServico.status, "Em Andamento");
  const scopeFaturamento = userId
    ? and(eq(ordensServico.status, "Finalizada"), gte(ordensServico.createdAt, inicioMes), eq(ordensServico.userId, userId))
    : and(eq(ordensServico.status, "Finalizada"), gte(ordensServico.createdAt, inicioMes));

  const [osAbertas, osEmAndamento, faturamento, totalClientes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(ordensServico).where(scopeAberta),
    db.select({ count: sql<number>`count(*)` }).from(ordensServico).where(scopeAndamento),
    db.select({ total: sql<string>`COALESCE(SUM(valor_total), 0)` }).from(ordensServico).where(scopeFaturamento),
    db.select({ count: sql<number>`count(*)` }).from(clientes).where(eq(clientes.ativo, true)),
  ]);

  return {
    osAbertas: Number(osAbertas[0]?.count ?? 0),
    osEmAndamento: Number(osEmAndamento[0]?.count ?? 0),
    faturamentoMes: parseFloat(faturamento[0]?.total ?? "0"),
    totalClientes: Number(totalClientes[0]?.count ?? 0),
  };
}

// ─── Config Oficina ────────────────────────────────────────────────────────
export async function getConfigOficina(): Promise<ConfigOficina | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(configOficina).limit(1);
  return result[0];
}

export async function upsertConfigOficina(data: Partial<ConfigOficina>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getConfigOficina();
  if (existing) {
    await db.update(configOficina).set(data).where(eq(configOficina.id, existing.id));
  } else {
    await db.insert(configOficina).values(data as any);
  }
}

// ─── Gerenciamento de Usuários Locais (Admin) ──────────────────────────────
export async function listarLocalUsers(): Promise<LocalUser[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(localUsers).orderBy(localUsers.nome);
}

export async function getLocalUserById(id: number): Promise<LocalUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(localUsers).where(eq(localUsers.id, id)).limit(1);
  return result[0];
}

export async function atualizarLocalUser(
  id: number,
  data: Partial<Pick<InsertLocalUser, "nome" | "passwordHash" | "role">>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(localUsers).set(data).where(eq(localUsers.id, id));
}

export async function deletarLocalUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(localUsers).where(eq(localUsers.id, id));
}
