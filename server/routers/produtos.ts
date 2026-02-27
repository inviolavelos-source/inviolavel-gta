import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { atualizarProduto, buscarProdutoPorId, criarProduto, listarProdutos, registrarLog } from "../db";

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

export const produtosRouter = router({
  listar: publicProcedure
    .input(z.object({ categoria: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      await funcCheck(ctx);
      return listarProdutos(input?.categoria);
    }),

  buscar: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      await funcCheck(ctx);
      const produto = await buscarProdutoPorId(input.id);
      if (!produto) throw new TRPCError({ code: "NOT_FOUND" });
      return produto;
    }),

  criar: publicProcedure
    .input(z.object({
      codigo: z.string().optional().nullable(),
      nome: z.string().min(2),
      categoria: z.enum(["ALARME", "CAMERA", "CERCA", "OUTROS"]),
      unidade: z.string().default("un"),
      estoque: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      await criarProduto({ ...input, estoque: String(input.estoque) as any });
      await registrarLog(ctx.funcionario!.id, "CRIAR_PRODUTO", "produtos", undefined, { nome: input.nome });
      return { success: true };
    }),

  atualizar: publicProcedure
    .input(z.object({
      id: z.number(),
      codigo: z.string().optional().nullable(),
      nome: z.string().min(2).optional(),
      categoria: z.enum(["ALARME", "CAMERA", "CERCA", "OUTROS"]).optional(),
      unidade: z.string().optional(),
      estoque: z.number().optional(),
      ativo: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const { id, estoque, ativo, ...rest } = input;
      const dados: Record<string, unknown> = { ...rest };
      if (estoque !== undefined) dados.estoque = String(estoque);
      if (ativo !== undefined) dados.ativo = ativo ? 1 : 0;
      await atualizarProduto(id, dados as any);
      await registrarLog(ctx.funcionario!.id, "ATUALIZAR_PRODUTO", "produtos", id);
      return { success: true };
    }),
});
