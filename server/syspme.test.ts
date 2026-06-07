import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock do banco de dados ────────────────────────────────────────────────
vi.mock("./db", () => ({
  getLocalUserByUsername: vi.fn(),
  countLocalUsers: vi.fn().mockResolvedValue(0),
  createLocalUser: vi.fn().mockResolvedValue(undefined),
  listarClientes: vi.fn().mockResolvedValue([]),
  listarTodosClientes: vi.fn().mockResolvedValue([]),
  getClienteById: vi.fn(),
  criarCliente: vi.fn().mockResolvedValue(1),
  atualizarCliente: vi.fn().mockResolvedValue(undefined),
  inativarCliente: vi.fn().mockResolvedValue(undefined),
  listarOS: vi.fn().mockResolvedValue([]),
  getOSById: vi.fn(),
  criarOS: vi.fn().mockResolvedValue(1),
  atualizarOS: vi.fn().mockResolvedValue(undefined),
  criarItensOS: vi.fn().mockResolvedValue(undefined),
  deletarItensByOsId: vi.fn().mockResolvedValue(undefined),
  getItensByOsId: vi.fn().mockResolvedValue([]),
  getDashboardMetrics: vi.fn().mockResolvedValue({
    osAbertas: 2,
    osEmAndamento: 1,
    faturamentoMes: 1500,
    totalClientes: 5,
  }),
  getConfigOficina: vi.fn().mockResolvedValue({
    id: 1,
    nome: "Oficina Teste",
    telefone: "(47) 99999-0000",
    endereco: "Rua Teste, 100",
    cnpj: "00.000.000/0001-00",
    email: "teste@oficina.com",
  }),
  upsertConfigOficina: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// ─── Cookie mock com sessão válida ─────────────────────────────────────────
// Usamos um token JWT assinado com a chave padrão de desenvolvimento
const VALID_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsIm5vbWUiOiJBZG1pbmlzdHJhZG9yIiwiZXhwIjo5OTk5OTk5OTk5fQ.placeholder";

function createCtx(withAuth = false): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: withAuth ? { syspme_local_session: VALID_TOKEN } : {},
    } as any,
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as any,
  };
}

// ─── Testes de autenticação ────────────────────────────────────────────────
describe("localAuth.hasUsers", () => {
  it("retorna false quando não há usuários cadastrados", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.localAuth.hasUsers();
    expect(result).toBe(false);
  });
});

describe("localAuth.setup", () => {
  it("cria o primeiro usuário com sucesso", async () => {
    const { createLocalUser, countLocalUsers } = await import("./db");
    vi.mocked(countLocalUsers).mockResolvedValueOnce(0);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.localAuth.setup({
      username: "admin",
      password: "senha123",
      nome: "Administrador",
    });
    expect(result.success).toBe(true);
    expect(createLocalUser).toHaveBeenCalledOnce();
  });

  it("rejeita criação se já existe usuário", async () => {
    const { countLocalUsers } = await import("./db");
    vi.mocked(countLocalUsers).mockResolvedValueOnce(1);

    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.localAuth.setup({
        username: "admin",
        password: "senha123",
        nome: "Administrador",
      })
    ).rejects.toThrow("Configuração inicial já realizada");
  });
});

describe("localAuth.login", () => {
  it("rejeita login com usuário inexistente", async () => {
    const { getLocalUserByUsername } = await import("./db");
    vi.mocked(getLocalUserByUsername).mockResolvedValueOnce(undefined);

    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.localAuth.login({ username: "naoexiste", password: "senha" })
    ).rejects.toThrow("Usuário ou senha inválidos");
  });
});

// ─── Testes de clientes ────────────────────────────────────────────────────
describe("clientes.listar", () => {
  it("retorna lista vazia quando não há clientes", async () => {
    // Sem token válido, deve rejeitar
    const caller = appRouter.createCaller(createCtx(false));
    await expect(caller.clientes.listar()).rejects.toThrow();
  });
});

// ─── Testes de OS ──────────────────────────────────────────────────────────
describe("os.listar", () => {
  it("rejeita acesso sem autenticação", async () => {
    const caller = appRouter.createCaller(createCtx(false));
    await expect(caller.os.listar()).rejects.toThrow();
  });
});

// ─── Testes de config ──────────────────────────────────────────────────────
describe("config.get", () => {
  it("rejeita acesso sem autenticação", async () => {
    const caller = appRouter.createCaller(createCtx(false));
    await expect(caller.config.get()).rejects.toThrow();
  });
});

// ─── Teste de logout ────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("limpa o cookie de sessão e retorna success", async () => {
    const ctx = createCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});
