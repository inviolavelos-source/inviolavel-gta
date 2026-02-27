import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  atualizarFuncionario,
  buscarFuncionarioPorEmail,
  buscarFuncionarioPorId,
  criarFuncionario,
  listarFuncionarios,
  excluirFuncionario,
  registrarLog,
} from "../db";

// Middleware de verificação de admin via funcionario context
const adminCheck = async (ctx: { funcionario: { perfil: string } | null }) => {
  if (!ctx.funcionario || ctx.funcionario.perfil !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
};

const funcCheck = async (ctx: { funcionario: { id: number; perfil: string } | null }) => {
  if (!ctx.funcionario) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Autenticação necessária." });
  }
};

export const funcionariosRouter = router({
  listar: publicProcedure.query(async ({ ctx }) => {
    await adminCheck(ctx);
    return listarFuncionarios();
  }),

  buscar: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const func = await buscarFuncionarioPorId(input.id);
      if (!func) throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado." });
      return func;
    }),

  criar: publicProcedure
    .input(
      z.object({
        nome: z.string().min(2),
        email: z.string().email(),
        senha: z.string().min(6),
        perfil: z.enum(["ADMIN", "FUNCIONARIO"]).default("FUNCIONARIO"),
        telefone: z.string().optional(),
        cargo: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const existente = await buscarFuncionarioPorEmail(input.email);
      if (existente) throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado." });
      const senhaHash = await bcrypt.hash(input.senha, 12);
      await criarFuncionario({
        nome: input.nome,
        email: input.email,
        senhaHash,
        perfil: input.perfil,
        telefone: input.telefone ?? null,
        cargo: input.cargo ?? null,
      });
      await registrarLog(ctx.funcionario!.id, "CRIAR_FUNCIONARIO", "funcionarios", undefined, { email: input.email });
      return { success: true };
    }),

  atualizar: publicProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(2).optional(),
        telefone: z.string().optional(),
        cargo: z.string().optional(),
        perfil: z.enum(["ADMIN", "FUNCIONARIO"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const { id, ...dados } = input;
      await atualizarFuncionario(id, dados);
      await registrarLog(ctx.funcionario!.id, "ATUALIZAR_FUNCIONARIO", "funcionarios", id);
      return { success: true };
    }),

  alterarStatus: publicProcedure
    .input(z.object({ id: z.number(), ativo: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      await atualizarFuncionario(input.id, { ativo: input.ativo ? 1 : 0 });
      await registrarLog(ctx.funcionario!.id, input.ativo ? "ATIVAR_FUNCIONARIO" : "DESATIVAR_FUNCIONARIO", "funcionarios", input.id);
      return { success: true };
    }),

  resetarSenha: publicProcedure
    .input(z.object({ id: z.number(), novaSenha: z.string().min(6) }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const senhaHash = await bcrypt.hash(input.novaSenha, 12);
      await atualizarFuncionario(input.id, { senhaHash });
      await registrarLog(ctx.funcionario!.id, "RESETAR_SENHA", "funcionarios", input.id);
      return { success: true };
    }),

  alterarSenha: publicProcedure
    .input(z.object({ senhaAtual: z.string(), novaSenha: z.string().min(6) }))
    .mutation(async ({ input, ctx }) => {
      await funcCheck(ctx);
      const func = await buscarFuncionarioPorId(ctx.funcionario!.id, true);
      if (!func) throw new TRPCError({ code: "NOT_FOUND" });
      const valida = await bcrypt.compare(input.senhaAtual, (func as any).senhaHash);
      if (!valida) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta." });
      const senhaHash = await bcrypt.hash(input.novaSenha, 12);
      await atualizarFuncionario(ctx.funcionario!.id, { senhaHash });
      return { success: true };
    }),

  excluir: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      // Evitar que o admin se exclua
      if (ctx.funcionario!.id === input.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível excluir o seu próprio usuário." });
      }
      await excluirFuncionario(input.id);
      await registrarLog(ctx.funcionario!.id, "EXCLUIR_FUNCIONARIO", "funcionarios", input.id);
      return { success: true };
    }),
});
