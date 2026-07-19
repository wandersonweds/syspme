import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { storagePut } from "./storage";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  atualizarCliente,
  atualizarLocalUser,
  atualizarOS,
  countLocalUsers,
  criarCliente,
  criarItensOS,
  criarOS,
  deletarItensByOsId,
  getClienteById,
  getConfigOficina,
  getDashboardMetrics,
  getItensByOsId,
  getLocalUserById,
  getLocalUserByUsername,
  getOSById,
  inativarCliente,
  listarClientes,
  listarLocalUsers,
  listarOS,
  listarTodosClientes,
  createLocalUser,
  upsertConfigOficina,
  deletarLocalUser,
} from "./db";

const LOCAL_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "syspme-secret-key-change-in-production"
);
const LOCAL_COOKIE = "syspme_local_session";

const FORMAS_PAGAMENTO = ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Pix", "Boleto", "Outro"] as const;

// ─── Helpers JWT local ─────────────────────────────────────────────────────
async function signLocalJWT(payload: { id: number; username: string; nome: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(LOCAL_JWT_SECRET);
}

async function verifyLocalJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, LOCAL_JWT_SECRET);
    return payload as { id: number; username: string; nome: string; role: string };
  } catch {
    return null;
  }
}

// ─── Middleware de autenticação local ──────────────────────────────────────
async function requireLocalAuth(ctx: any) {
  const token = ctx.req.cookies?.[LOCAL_COOKIE];
  if (!token) throw new Error("Não autenticado");
  const payload = await verifyLocalJWT(token);
  if (!payload) throw new Error("Sessão inválida");
  return payload;
}

async function requireAdmin(ctx: any) {
  const payload = await requireLocalAuth(ctx);
  if (payload.role !== "admin") throw new Error("Acesso restrito ao administrador");
  return payload;
}

// ─── Router principal ──────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ── Auth Local (usuário/senha) ──
  localAuth: router({
    login: publicProcedure
      .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getLocalUserByUsername(input.username);
        if (!user) throw new Error("Usuário ou senha inválidos");
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new Error("Usuário ou senha inválidos");
        const token = await signLocalJWT({
          id: user.id,
          username: user.username,
          nome: user.nome,
          role: user.role,
        });
        const cookieOpts = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(LOCAL_COOKIE, token, {
          ...cookieOpts,
          maxAge: 8 * 60 * 60 * 1000,
        });
        return { success: true, nome: user.nome, role: user.role };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOpts = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(LOCAL_COOKIE, { ...cookieOpts, maxAge: -1 });
      return { success: true };
    }),

    me: publicProcedure.query(async ({ ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_COOKIE];
      if (!token) return null;
      const payload = await verifyLocalJWT(token);
      if (!payload) return null;
      // Se o JWT foi gerado antes da migração de role, busca o role atualizado do banco
      if (!payload.role) {
        const user = await getLocalUserById(payload.id);
        if (user) return { ...payload, role: user.role, nome: user.nome };
      }
      return payload;
    }),

    setup: publicProcedure
      .input(
        z.object({
          username: z.string().min(3),
          password: z.string().min(6),
          nome: z.string().min(2),
        })
      )
      .mutation(async ({ input }) => {
        const count = await countLocalUsers();
        if (count > 0) throw new Error("Configuração inicial já realizada");
        const hash = await bcrypt.hash(input.password, 12);
        // O primeiro usuário criado é sempre admin
        await createLocalUser({
          username: input.username,
          passwordHash: hash,
          nome: input.nome,
          role: "admin",
        });
        return { success: true };
      }),

    hasUsers: publicProcedure.query(async () => {
      const count = await countLocalUsers();
      return count > 0;
    }),

    /** Altera a senha do usuário logado */
    alterarSenha: publicProcedure
      .input(
        z.object({
          senhaAtual: z.string().min(1),
          novaSenha: z.string().min(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const payload = await requireLocalAuth(ctx);
        const user = await getLocalUserById(payload.id);
        if (!user) throw new Error("Usuário não encontrado");
        const valid = await bcrypt.compare(input.senhaAtual, user.passwordHash);
        if (!valid) throw new Error("Senha atual incorreta");
        const hash = await bcrypt.hash(input.novaSenha, 12);
        await atualizarLocalUser(payload.id, { passwordHash: hash });
        return { success: true };
      }),
  }),

  // ── Gerenciamento de Usuários (Admin) ──
  usuarios: router({
    listar: publicProcedure.query(async ({ ctx }) => {
      await requireAdmin(ctx);
      const users = await listarLocalUsers();
      // Não retornar o hash da senha
      return users.map(({ passwordHash: _, ...u }) => u);
    }),

    criar: publicProcedure
      .input(
        z.object({
          username: z.string().min(3),
          password: z.string().min(6),
          nome: z.string().min(2),
          role: z.enum(["user", "admin"]).default("user"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const existing = await getLocalUserByUsername(input.username);
        if (existing) throw new Error("Nome de usuário já existe");
        const hash = await bcrypt.hash(input.password, 12);
        await createLocalUser({
          username: input.username,
          passwordHash: hash,
          nome: input.nome,
          role: input.role,
        });
        return { success: true };
      }),

    atualizar: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(2).optional(),
          role: z.enum(["user", "admin"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const { id, ...data } = input;
        await atualizarLocalUser(id, data);
        return { success: true };
      }),

    redefinirSenha: publicProcedure
      .input(
        z.object({
          id: z.number(),
          novaSenha: z.string().min(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const hash = await bcrypt.hash(input.novaSenha, 12);
        await atualizarLocalUser(input.id, { passwordHash: hash });
        return { success: true };
      }),

    deletar: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        const payload = await verifyLocalJWT(ctx.req.cookies?.[LOCAL_COOKIE]);
        if (!payload) throw new Error("Não autenticado");
        if (payload.id === input.id) throw new Error("Você não pode excluir sua própria conta");
        await deletarLocalUser(input.id);
        return { success: true };
      }),
  }),

  // ── Dashboard ──
  dashboard: router({
    metrics: publicProcedure.query(async ({ ctx }) => {
      const payload = await requireLocalAuth(ctx);
      // Admin vê métricas globais; user vê apenas suas OS
      if (payload.role === "admin") {
        return getDashboardMetrics();
      }
      return getDashboardMetrics(payload.id);
    }),
    ultimasOS: publicProcedure.query(async ({ ctx }) => {
      const payload = await requireLocalAuth(ctx);
      const filtro = payload.role === "admin" ? undefined : { userId: payload.id };
      return listarOS(filtro);
    }),
  }),

  // ── Clientes ──
  clientes: router({
    listar: publicProcedure
      .input(z.object({ busca: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        return listarClientes(input?.busca);
      }),

    listarTodos: publicProcedure.query(async ({ ctx }) => {
      await requireLocalAuth(ctx);
      return listarTodosClientes();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        return getClienteById(input.id);
      }),

    criar: publicProcedure
      .input(
        z.object({
          nome: z.string().min(2),
          telefone: z.string().min(8),
          cpfCnpj: z.string().min(11),
          endereco: z.string().min(5),
          email: z.string().email(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        const id = await criarCliente(input);
        return { id };
      }),

    atualizar: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(2),
          telefone: z.string().min(8),
          cpfCnpj: z.string().min(11),
          endereco: z.string().min(5),
          email: z.string().email(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        const { id, ...data } = input;
        await atualizarCliente(id, data);
        return { success: true };
      }),

    inativar: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        await inativarCliente(input.id);
        return { success: true };
      }),
  }),

  // ── Ordens de Serviço ──
  os: router({
    listar: publicProcedure
      .input(
        z
          .object({
            clienteId: z.number().optional(),
            status: z.string().optional(),
            dataInicio: z.string().optional(),
            dataFim: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input, ctx }) => {
        const payload = await requireLocalAuth(ctx);
        // user só vê suas próprias OS; admin vê todas
        const userIdFiltro = payload.role === "admin" ? undefined : payload.id;
        return listarOS({
          clienteId: input?.clienteId,
          status: input?.status,
          dataInicio: input?.dataInicio ? new Date(input.dataInicio) : undefined,
          dataFim: input?.dataFim ? new Date(input.dataFim + "T23:59:59") : undefined,
          userId: userIdFiltro,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        const os = await getOSById(input.id);
        if (!os) throw new Error("OS não encontrada");
        const itens = await getItensByOsId(input.id);
        const cliente = await getClienteById(os.clienteId);
        return { os, itens, cliente };
      }),

    criar: publicProcedure
      .input(
        z.object({
          clienteId: z.number(),
          desconto: z.number().min(0).default(0),
          observacoes: z.string().optional(),
          // Veículo / Maquinário
          veiculoPlaca: z.string().optional(),
          veiculoModelo: z.string().optional(),
          veiculoAno: z.string().optional(),
          veiculoChassis: z.string().optional(),
          veiculoFrota: z.string().optional(),
          // Deslocamento
          houveDeslocamento: z.boolean().default(false),
          kmGasto: z.number().min(0).optional(),
          valorPorKm: z.number().min(0).optional(),
          itens: z.array(
            z.object({
              tipo: z.enum(["Serviço", "Peça"]),
              descricao: z.string().min(1),
              quantidade: z.number().positive(),
              valorUnitario: z.number().positive(),
            })
          ).min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const payload = await requireLocalAuth(ctx);
        const subtotais = input.itens.map((i) => i.quantidade * i.valorUnitario);
        const totalItens = subtotais.reduce((a, b) => a + b, 0);
        // Calcula custo de deslocamento
        const custoDeslocamento =
          input.houveDeslocamento && input.kmGasto && input.valorPorKm
            ? input.kmGasto * input.valorPorKm
            : 0;
        const valorTotal = Math.max(0, totalItens + custoDeslocamento - input.desconto);

        const osId = await criarOS({
          clienteId: input.clienteId,
          userId: payload.id,
          desconto: String(input.desconto),
          valorTotal: String(valorTotal),
          observacoes: input.observacoes,
          veiculoPlaca: input.veiculoPlaca,
          veiculoModelo: input.veiculoModelo,
          veiculoAno: input.veiculoAno,
          veiculoChassis: input.veiculoChassis,
          veiculoFrota: input.veiculoFrota,
          houveDeslocamento: input.houveDeslocamento,
          kmGasto: input.kmGasto !== undefined ? String(input.kmGasto) : undefined,
          valorPorKm: input.valorPorKm !== undefined ? String(input.valorPorKm) : undefined,
        });

        await criarItensOS(
          input.itens.map((item, idx) => ({
            osId,
            tipo: item.tipo,
            descricao: item.descricao,
            quantidade: String(item.quantidade),
            valorUnitario: String(item.valorUnitario),
            subtotal: String(subtotais[idx]),
          }))
        );

        return { id: osId };
      }),

    atualizarStatus: publicProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["Aberta", "Em Andamento", "Finalizada", "Cancelada"]),
          observacaoFinal: z.string().optional(),
          formaPagamento: z.enum(FORMAS_PAGAMENTO).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        const update: Record<string, unknown> = { status: input.status };
        if (input.observacaoFinal !== undefined) update.observacaoFinal = input.observacaoFinal;
        if (input.formaPagamento !== undefined) update.formaPagamento = input.formaPagamento;
        await atualizarOS(input.id, update as Parameters<typeof atualizarOS>[1]);
        return { success: true };
      }),

    /** Admin pode reatribuir uma OS para outro usuário */
    reatribuir: publicProcedure
      .input(z.object({ osId: z.number(), userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await requireAdmin(ctx);
        await atualizarOS(input.osId, { userId: input.userId } as any);
        return { success: true };
      }),

    atualizar: publicProcedure
      .input(
        z.object({
          id: z.number(),
          clienteId: z.number(),
          desconto: z.number().min(0).default(0),
          observacoes: z.string().optional(),
          // Veículo / Maquinário
          veiculoPlaca: z.string().optional(),
          veiculoModelo: z.string().optional(),
          veiculoAno: z.string().optional(),
          veiculoChassis: z.string().optional(),
          veiculoFrota: z.string().optional(),
          // Deslocamento
          houveDeslocamento: z.boolean().default(false),
          kmGasto: z.number().min(0).optional(),
          valorPorKm: z.number().min(0).optional(),
          itens: z.array(
            z.object({
              tipo: z.enum(["Serviço", "Peça"]),
              descricao: z.string().min(1),
              quantidade: z.number().positive(),
              valorUnitario: z.number().positive(),
            })
          ).min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        const subtotais = input.itens.map((i) => i.quantidade * i.valorUnitario);
        const totalItens = subtotais.reduce((a, b) => a + b, 0);
        const custoDeslocamento =
          input.houveDeslocamento && input.kmGasto && input.valorPorKm
            ? input.kmGasto * input.valorPorKm
            : 0;
        const valorTotal = Math.max(0, totalItens + custoDeslocamento - input.desconto);

        await atualizarOS(input.id, {
          clienteId: input.clienteId,
          desconto: String(input.desconto),
          valorTotal: String(valorTotal),
          observacoes: input.observacoes,
          veiculoPlaca: input.veiculoPlaca,
          veiculoModelo: input.veiculoModelo,
          veiculoAno: input.veiculoAno,
          veiculoChassis: input.veiculoChassis,
          veiculoFrota: input.veiculoFrota,
          houveDeslocamento: input.houveDeslocamento,
          kmGasto: input.kmGasto !== undefined ? String(input.kmGasto) : undefined,
          valorPorKm: input.valorPorKm !== undefined ? String(input.valorPorKm) : undefined,
        });

        await deletarItensByOsId(input.id);
        await criarItensOS(
          input.itens.map((item, idx) => ({
            osId: input.id,
            tipo: item.tipo,
            descricao: item.descricao,
            quantidade: String(item.quantidade),
            valorUnitario: String(item.valorUnitario),
            subtotal: String(subtotais[idx]),
          }))
        );

        return { success: true };
      }),

    // Gera dados para PDF (retorna JSON, o frontend renderiza e usa window.print)
    dadosPDF: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        const os = await getOSById(input.id);
        if (!os) throw new Error("OS não encontrada");
        const itens = await getItensByOsId(input.id);
        const cliente = await getClienteById(os.clienteId);
        const oficina = await getConfigOficina();
        return { os, itens, cliente, oficina };
      }),
  }),

  // ── Config Oficina ──
  config: router({
    get: publicProcedure.query(async ({ ctx }) => {
      await requireLocalAuth(ctx);
      return getConfigOficina();
    }),
    salvar: publicProcedure
      .input(
        z.object({
          nome: z.string().min(2),
          telefone: z.string().optional(),
          telefone2: z.string().optional(),
          endereco: z.string().optional(),
          cnpj: z.string().optional(),
          email: z.string().optional(),
          logomarcaUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        await upsertConfigOficina(input);
        return { success: true };
      }),

    /** Upload de logomarca: recebe base64, salva no S3 e atualiza config */
    uploadLogo: publicProcedure
      .input(
        z.object({
          base64: z.string(),
          mimeType: z.string(),
          fileName: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireLocalAuth(ctx);
        // Remover logo (base64 vazio = remover)
        if (!input.base64) {
          await upsertConfigOficina({ logomarcaUrl: null } as any);
          return { logoUrl: null };
        }
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] ?? "png";
        const key = `logos/logomarca.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await upsertConfigOficina({ logomarcaUrl: url } as any);
        return { logoUrl: url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
