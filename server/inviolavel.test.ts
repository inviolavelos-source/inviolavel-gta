import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Contexto de Admin ──────────────────────────────────────────────────────
function createAdminCtx(): TrpcContext {
  return {
    user: null,
    funcionario: {
      id: 1,
      openId: null,
      nome: "Admin Teste",
      email: "admin@inviolavelgta.com",
      senhaHash: "hash",
      perfil: "ADMIN",
      cargo: "Administrador",
      telefone: null,
      ativo: 1,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ── Contexto de Funcionário ────────────────────────────────────────────────
function createFuncCtx(): TrpcContext {
  return {
    user: null,
    funcionario: {
      id: 2,
      openId: null,
      nome: "Funcionário Teste",
      email: "func@inviolavelgta.com",
      senhaHash: "hash",
      perfil: "FUNCIONARIO",
      cargo: "Técnico",
      telefone: null,
      ativo: 1,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ── Contexto sem autenticação ──────────────────────────────────────────────
function createAnonCtx(): TrpcContext {
  return {
    user: null,
    funcionario: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("limpa o cookie de sessão e retorna sucesso", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      funcionario: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string) => clearedCookies.push(name) } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("inviolavel.me", () => {
  it("retorna null quando não autenticado", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    const result = await caller.inviolavel.me();
    expect(result).toBeNull();
  });

  it("retorna dados do funcionário quando autenticado", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.inviolavel.me();
    expect(result).not.toBeNull();
    expect(result?.perfil).toBe("ADMIN");
  });
});

describe("Controlo de acesso — Admin", () => {
  it("bloqueia acesso de funcionário a endpoints de admin (funcionários)", async () => {
    const caller = appRouter.createCaller(createFuncCtx());
    await expect(caller.funcionarios.listar()).rejects.toThrow();
  });

  it("bloqueia acesso anónimo a endpoints protegidos", async () => {
    const caller = appRouter.createCaller(createAnonCtx());
    await expect(caller.ponto.meuPontoHoje()).rejects.toThrow();
  });
});

describe("Controlo de acesso — Funcionário", () => {
  it("bloqueia acesso de funcionário ao relatório de ponto (admin only)", async () => {
    const caller = appRouter.createCaller(createFuncCtx());
    await expect(caller.ponto.relatorio({ de: "2025-01-01", ate: "2025-12-31" })).rejects.toThrow();
  });
});
