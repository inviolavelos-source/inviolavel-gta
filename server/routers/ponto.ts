import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  buscarPontoHoje,
  criarOuAtualizarPonto,
  listarFuncionarios,
  listarInstalacoes,
  listarPontos,
  relatorioMateriaisPorOS,
  registrarLog,
  resumoDashboardAdmin,
  resumoDashboardFuncionario,
} from "../db";

const adminCheck = async (ctx: { funcionario: { id: number; perfil: string } | null }) => {
  if (!ctx.funcionario || ctx.funcionario.perfil !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
};

const funcCheck = async (ctx: { funcionario: { id: number; perfil: string } | null }) => {
  if (!ctx.funcionario) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Autenticação necessária." });
  }
};

function dataHoje(): string {
  return new Date().toISOString().split("T")[0]!;
}

export const pontoRouter = router({
  // ─── Funcionário: registrar ponto ──────────────────────────────────────
  registrar: publicProcedure
    .input(z.object({
      tipo: z.enum(["ENTRADA", "INICIO_ALMOCO", "FIM_ALMOCO", "SAIDA"]),
      horaManual: z.string().optional(),
      justificativa: z.string().optional(),
      gps: z.object({ lat: z.string(), lon: z.string() }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);
      const hoje = dataHoje();
      const campo = {
        ENTRADA: "horaEntrada",
        INICIO_ALMOCO: "horaInicioAlmoco",
        FIM_ALMOCO: "horaFimAlmoco",
        SAIDA: "horaSaida",
      }[input.tipo] as any;

      const isManual = !!input.horaManual;
      let valor = new Date();

      if (isManual) {
        const [h, m] = input.horaManual!.split(":").map(Number);
        valor = new Date();
        valor.setHours(h || 0, m || 0, 0, 0);
      }

      await criarOuAtualizarPonto(ctx.funcionario!.id, hoje, campo, valor.toISOString(), isManual, input.justificativa, input.gps);
      return { success: true, tipo: input.tipo, hora: valor };
    }),

  meuPontoHoje: publicProcedure.query(async ({ ctx }) => {
    await funcCheck(ctx);
    const hoje = dataHoje();
    return buscarPontoHoje(ctx.funcionario!.id, hoje);
  }),

  // ─── Funcionário: histórico de ponto ────────────────────────────────────
  meuHistorico: publicProcedure
    .input(z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      await funcCheck(ctx);
      return listarPontos({ de: input.dataInicio, ate: input.dataFim, funcionarioId: ctx.funcionario!.id });
    }),

  // ─── Admin: relatório de ponto ─────────────────────────────────────────
  relatorio: publicProcedure
    .input(z.object({
      de: z.string(),
      ate: z.string(),
      funcionarioId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      await adminCheck(ctx);
      return listarPontos(input);
    }),
});

export const relatoriosRouter = router({
  dashboardAdmin: publicProcedure.query(async ({ ctx }) => {
    await adminCheck(ctx);
    return resumoDashboardAdmin();
  }),

  dashboardFuncionario: publicProcedure.query(async ({ ctx }) => {
    await funcCheck(ctx);
    return resumoDashboardFuncionario(ctx.funcionario!.id);
  }),

  instalacoes: publicProcedure
    .input(z.object({
      de: z.string().optional(),
      ate: z.string().optional(),
      status: z.string().optional(),
      tipo: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const filtros: Record<string, unknown> = {};
      if (input?.de) filtros.de = new Date(input.de);
      if (input?.ate) filtros.ate = new Date(input.ate);
      if (input?.status) filtros.status = input.status;
      if (input?.tipo) filtros.tipo = input.tipo;
      return listarInstalacoes(filtros as any);
    }),

  materiais: publicProcedure
    .input(z.object({ instalacaoId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      await adminCheck(ctx);
      return relatorioMateriaisPorOS(input?.instalacaoId);
    }),

  funcionarios: publicProcedure.query(async ({ ctx }) => {
    await adminCheck(ctx);
    return listarFuncionarios();
  }),
});
