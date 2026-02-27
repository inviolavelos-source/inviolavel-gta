import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { clientesRouter } from "./routers/clientes";
import { funcionariosRouter } from "./routers/funcionarios";
import { instalacoesRouter } from "./routers/instalacoes";
import { pontoRouter, relatoriosRouter } from "./routers/ponto";
import { produtosRouter } from "./routers/produtos";

export const appRouter = router({
  system: systemRouter,

  // Auth Manus OAuth (mantido para compatibilidade)
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Auth InviolavelGTA (funcionários)
  inviolavel: authRouter,

  // Módulos do sistema
  funcionarios: funcionariosRouter,
  clientes: clientesRouter,
  instalacoes: instalacoesRouter,
  produtos: produtosRouter,
  ponto: pontoRouter,
  relatorios: relatoriosRouter,
});

export type AppRouter = typeof appRouter;
