import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  adicionarMaterialInstalacao,
  atualizarInstalacao,
  buscarInstalacaoPorId,
  criarInstalacao,
  listarInstalacoes,
  listarMateriaisInstalacao,
  registrarLog,
  removerMaterialInstalacao,
  excluirInstalacao,
  abaterEstoque,
  salvarFotoInstalacao,
  listarFotosInstalacao,
  excluirFotoInstalacao,
} from "../db";
import { storagePut } from "../storage";
import { extractTextFromBase64 } from "../services/pdfParser";

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

export const instalacoesRouter = router({
  // ─── Admin ────────────────────────────────────────────────────────────
  listar: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      tipo: z.string().optional(),
      funcionarioId: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      await adminCheck(ctx);
      return listarInstalacoes(input);
    }),

  buscar: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      await funcCheck(ctx);
      const instalacao = await buscarInstalacaoPorId(input.id);
      if (!instalacao) throw new TRPCError({ code: "NOT_FOUND", message: "Instalação não encontrada." });

      const isAssigned = instalacao.instalacao.funcionarioId === ctx.funcionario!.id ||
        (instalacao.tecnicos && instalacao.tecnicos.some((t: any) => t.id === ctx.funcionario!.id));

      if (ctx.funcionario!.perfil !== "ADMIN" && !isAssigned) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const materiais = await listarMateriaisInstalacao(input.id);
      return { ...instalacao, materiais };
    }),

  criar: publicProcedure
    .input(z.object({
      clienteId: z.number().optional().nullable(),
      clienteProvisorio: z.string().optional().nullable(),
      tipo: z.enum(["ALARME", "CAMERA", "CERCA", "MULTIPLO"]),
      enderecoExecucao: z.string().optional().nullable(),
      dataPrevista: z.string().optional().nullable(),
      funcionarioId: z.number().optional().nullable(),
      tecnicosIds: z.array(z.number()).optional().nullable(),
      observacoes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      await criarInstalacao(input as any);
      await registrarLog(ctx.funcionario!.id, "CRIAR_INSTALACAO", "instalacoes", undefined, { tipo: input.tipo, clienteId: input.clienteId, provisorio: input.clienteProvisorio });
      return { success: true };
    }),

  atualizar: publicProcedure
    .input(z.object({
      id: z.number(),
      clienteId: z.number().optional().nullable(),
      clienteProvisorio: z.string().optional().nullable(),
      tipo: z.enum(["ALARME", "CAMERA", "CERCA", "MULTIPLO"]).optional(),
      enderecoExecucao: z.string().optional().nullable(),
      dataPrevista: z.string().optional().nullable(),
      funcionarioId: z.number().optional().nullable(),
      tecnicosIds: z.array(z.number()).optional().nullable(),
      observacoes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const { id, ...dados } = input;
      await atualizarInstalacao(id, dados as any);
      await registrarLog(ctx.funcionario!.id, "ATUALIZAR_INSTALACAO", "instalacoes", id);
      return { success: true };
    }),

  alterarStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["ORCAMENTO", "PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]),
      gps: z.object({ lat: z.string(), lon: z.string() }).optional(),
      assinaturaUrl: z.string().optional(),
      checklist: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);
      const instalacao = await buscarInstalacaoPorId(input.id);
      if (!instalacao) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.funcionario!.perfil !== "ADMIN") {
        const isAssigned = instalacao.instalacao.funcionarioId === ctx.funcionario!.id ||
          (instalacao.tecnicos && instalacao.tecnicos.some((t: any) => t.id === ctx.funcionario!.id));

        if (!isAssigned) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Esta instalação não está atribuída a você." });
        }
        // Técnico só pode mover para EM_ANDAMENTO ou CONCLUIDA
        if (input.status !== "EM_ANDAMENTO" && input.status !== "CONCLUIDA") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para alterar para este status." });
        }
      }

      const updateData: any = { status: input.status };

      if (input.status === "EM_ANDAMENTO" && input.gps) {
        updateData.latitudeInicio = input.gps.lat;
        updateData.longitudeInicio = input.gps.lon;
      }

      if (input.status === "CONCLUIDA") {
        updateData.finalizadoEm = new Date();
        if (input.gps) {
          updateData.latitudeFim = input.gps.lat;
          updateData.longitudeFim = input.gps.lon;
        }
        if (input.assinaturaUrl) updateData.assinaturaUrl = input.assinaturaUrl;
        if (input.checklist) updateData.checklist = input.checklist;
      }

      await atualizarInstalacao(input.id, updateData);

      if (input.status === "CONCLUIDA") {
        await abaterEstoque(input.id);
      }

      await registrarLog(ctx.funcionario!.id, `STATUS_${input.status}`, "instalacoes", input.id);
      return { success: true };
    }),

  analisarOrcamento: publicProcedure
    .input(z.object({ pdfBase64: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const text = await extractTextFromBase64(input.pdfBase64);
      const upperText = text.toUpperCase();

      const hasAlarme = upperText.includes("ALARME");
      const hasCamera = upperText.includes("CAMERA") || upperText.includes("CÂMERA") || upperText.includes("CFTV");
      const hasCerca = upperText.includes("CERCA") || upperText.includes("CHOQUE");

      let tipo = "ALARME"; // default
      if (hasAlarme && hasCamera && hasCerca) tipo = "MULTIPLO";
      else if (hasAlarme && hasCamera) tipo = "MULTIPLO";
      else if (hasAlarme && hasCerca) tipo = "MULTIPLO";
      else if (hasCamera && hasCerca) tipo = "MULTIPLO";
      else if (hasCamera) tipo = "CAMERA";
      else if (hasCerca) tipo = "CERCA";

      return {
        tipo,
        detalhes: text.substring(0, 1000) // snippet for logic if needed
      };
    }),

  // ─── Funcionário ──────────────────────────────────────────────────────
  minhasInstalacoes: publicProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      await funcCheck(ctx);
      return listarInstalacoes({ funcionarioId: ctx.funcionario!.id, status: input?.status });
    }),

  adicionarMaterial: publicProcedure
    .input(z.object({
      instalacaoId: z.number(),
      produtoId: z.number(),
      quantidade: z.number().positive(),
      observacoes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);
      const instalacao = await buscarInstalacaoPorId(input.instalacaoId);
      if (!instalacao) throw new TRPCError({ code: "NOT_FOUND" });
      const isAssigned = instalacao.instalacao.funcionarioId === ctx.funcionario!.id ||
        (instalacao.tecnicos && instalacao.tecnicos.some((t: any) => t.id === ctx.funcionario!.id));

      if (ctx.funcionario!.perfil !== "ADMIN" && !isAssigned) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await adicionarMaterialInstalacao({
        instalacaoId: input.instalacaoId,
        produtoId: input.produtoId,
        quantidade: String(input.quantidade) as any,
        observacoes: input.observacoes ?? null,
      });
      return { success: true };
    }),

  removerMaterial: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);
      await removerMaterialInstalacao(input.id);
      return { success: true };
    }),

  finalizar: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);
      const instalacao = await buscarInstalacaoPorId(input.id);
      if (!instalacao) throw new TRPCError({ code: "NOT_FOUND" });
      const isAssigned = instalacao.instalacao.funcionarioId === ctx.funcionario!.id ||
        (instalacao.tecnicos && instalacao.tecnicos.some((t: any) => t.id === ctx.funcionario!.id));

      if (ctx.funcionario!.perfil !== "ADMIN" && !isAssigned) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await atualizarInstalacao(input.id, { status: "CONCLUIDA", finalizadoEm: new Date() });
      await registrarLog(ctx.funcionario!.id, "FINALIZAR_INSTALACAO", "instalacoes", input.id);
      return { success: true };
    }),

  atualizarDadosTecnicos: publicProcedure
    .input(z.object({
      id: z.number(),
      zonas: z.any().optional(),
      usuarios: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);
      const instalacao = await buscarInstalacaoPorId(input.id);
      if (!instalacao) throw new TRPCError({ code: "NOT_FOUND" });

      const isAssigned = instalacao.instalacao.funcionarioId === ctx.funcionario!.id ||
        (instalacao.tecnicos && instalacao.tecnicos.some((t: any) => t.id === ctx.funcionario!.id));

      // Permitir se for admin ou se for o funcionário atribuído
      if (ctx.funcionario!.perfil !== "ADMIN" && !isAssigned) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await atualizarInstalacao(input.id, {
        zonas: input.zonas,
        usuarios: input.usuarios,
      });

      return { success: true };
    }),

  listarMateriais: publicProcedure
    .input(z.object({ instalacaoId: z.number() }))
    .query(async ({ input, ctx }) => {
      await funcCheck(ctx);
      return listarMateriaisInstalacao(input.instalacaoId);
    }),

  criarLevantamento: publicProcedure
    .input(z.object({
      clienteId: z.number().optional().nullable(),
      clienteProvisorio: z.string().optional().nullable(),
      tipo: z.enum(["ALARME", "CAMERA", "CERCA", "MULTIPLO"]),
      enderecoExecucao: z.string().optional().nullable(),
      observacoes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);
      await criarInstalacao({
        clienteId: input.clienteId ?? null,
        clienteProvisorio: input.clienteProvisorio ?? null,
        tipo: input.tipo,
        funcionarioId: ctx.funcionario!.id,
        status: "ORCAMENTO",
        enderecoExecucao: input.enderecoExecucao ?? null,
        observacoes: input.observacoes ?? null,
        criadoEm: new Date(),
      });
      return { success: true };
    }),

  excluir: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      await excluirInstalacao(input.id);
      await registrarLog(ctx.funcionario!.id, "EXCLUIR_INSTALACAO", "instalacoes", input.id);
      return { success: true };
    }),

  // ─── Fotos ────────────────────────────────────────────────────────────
  uploadFoto: publicProcedure
    .input(z.object({
      instalacaoId: z.number(),
      base64: z.string(),
      tipo: z.enum(["ANTES", "DEPOIS", "OUTROS"]),
    }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);

      const buffer = Buffer.from(input.base64.split(",")[1], "base64");
      const filename = `instalacao_${input.instalacaoId}_${Date.now()}.png`;
      const path = `instalacoes/${input.instalacaoId}/${filename}`;

      const result = await storagePut(path, buffer, "image/png");

      await salvarFotoInstalacao({
        instalacaoId: input.instalacaoId,
        url: result.url,
        path: result.key,
        tipo: input.tipo,
      });

      return { success: true, url: result.url };
    }),

  listarFotos: publicProcedure
    .input(z.object({ instalacaoId: z.number() }))
    .query(async ({ input, ctx }) => {
      await funcCheck(ctx);
      return listarFotosInstalacao(input.instalacaoId);
    }),

  excluirFoto: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);
      await excluirFotoInstalacao(input.id);
      return { success: true };
    }),
});
