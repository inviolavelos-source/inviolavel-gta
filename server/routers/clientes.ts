import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  atualizarCliente,
  buscarClientePorId,
  criarCliente,
  listarClientes,
  listarFichasCliente,
  excluirCliente,
  excluirFuncionario,
  excluirInstalacao,
  registrarLog,
  salvarFichaCliente,
} from "../db";
import { gerarFichaClientePDF } from "../services/pdfService";

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

const clienteInput = z.object({
  tipo: z.enum(["PF", "PJ"]).default("PF"),
  nomeRazao: z.string().min(2),
  cpfCnpj: z.string().min(11),
  rgIe: z.string().optional().nullable(),
  nascimento: z.string().optional().nullable(),
  telefone1: z.string().optional().nullable(),
  telefone2: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  cep: z.string().optional().nullable(),
  rua: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().max(2).optional().nullable(),
  complemento: z.string().optional().nullable(),
  referencia: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),

  // Novos campos adicionados a partir da Ficha de Cadastro PDF
  clienteNovo: z.coerce.number().optional().default(1),
  dataCadastro: z.string().optional().nullable(),
  codigo: z.string().optional().nullable(),
  modeloCentral: z.string().optional().nullable(),
  dataInstalacao: z.string().optional().nullable(),
  tipoContrato: z.enum(["PRÓPRIO", "LOCADO", "VENDIDO"]).optional().nullable(),
  ramoAtividade: z.enum(["Comercial", "Residencial", "Industrial", "Pública", "Outros"]).optional().nullable(),
  nomeFantasia: z.string().optional().nullable(),
  proximidade: z.string().optional().nullable(),
  rota: z.string().optional().nullable(),
  responsavelNome: z.string().optional().nullable(),
  responsavelNascimento: z.string().optional().nullable(),
  responsavelCpf: z.string().optional().nullable(),
  responsavelRg: z.string().optional().nullable(),
  responsavelEndereco: z.string().optional().nullable(),
  responsavelNumero: z.string().optional().nullable(),
  responsavelBairro: z.string().optional().nullable(),
  responsavelCidade: z.string().optional().nullable(),
  responsavelEstado: z.string().optional().nullable(),
  nomeProprietario: z.string().optional().nullable(),
  nomeInstalador: z.string().optional().nullable(),
  nomeVendedor: z.string().optional().nullable(),
});

export const clientesRouter = router({
  listar: publicProcedure
    .input(z.object({ busca: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      await adminCheck(ctx);
      return listarClientes(input?.busca);
    }),

  buscar: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const cliente = await buscarClientePorId(input.id);
      if (!cliente) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
      const fichas = await listarFichasCliente(input.id);
      return { ...cliente, fichas };
    }),

  criar: publicProcedure
    .input(clienteInput)
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      await criarCliente(input as any);
      await registrarLog(ctx.funcionario!.id, "CRIAR_CLIENTE", "clientes", undefined, { nome: input.nomeRazao });
      return { success: true };
    }),

  atualizar: publicProcedure
    .input(z.object({ id: z.number() }).merge(clienteInput.partial()))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const { id, ...dados } = input;
      await atualizarCliente(id, dados as any);
      await registrarLog(ctx.funcionario!.id, "ATUALIZAR_CLIENTE", "clientes", id);
      return { success: true };
    }),

  gerarFicha: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      const cliente = await buscarClientePorId(input.id);
      if (!cliente) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
      const { arquivoPath, arquivoUrl } = await gerarFichaClientePDF(cliente);
      await salvarFichaCliente(input.id, arquivoPath, arquivoUrl);
      await registrarLog(ctx.funcionario!.id, "GERAR_FICHA_PDF", "clientes", input.id, { clienteNome: cliente.nomeRazao });
      return { success: true, arquivoUrl };
    }),

  listarFichas: publicProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input, ctx }) => {
      await adminCheck(ctx);
      return listarFichasCliente(input.clienteId);
    }),

  listarParaLevantamento: publicProcedure
    .query(async ({ ctx }) => {
      await funcCheck(ctx);
      return listarClientes();
    }),

  excluir: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await adminCheck(ctx);
      await excluirCliente(input.id);
      await registrarLog(ctx.funcionario!.id, "EXCLUIR_CLIENTE", "clientes", input.id);
      return { success: true };
    }),
});
