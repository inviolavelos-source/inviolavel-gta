import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";
import { ENV } from "../_core/env";
import { publicProcedure, router } from "../_core/trpc";
import { buscarFuncionarioPorEmail } from "../db";

const FUNC_COOKIE = "func_session";
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

async function gerarToken(payload: Record<string, unknown>): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret || "inviolavel_secret_key_2024");
  const expiresAt = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresAt)
    .sign(secret);
}

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), senha: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const funcionario = await buscarFuncionarioPorEmail(input.email);
      if (!funcionario || !funcionario.ativo) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas ou conta desativada." });
      }
      const senhaValida = await bcrypt.compare(input.senha, funcionario.senhaHash);
      if (!senhaValida) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas." });
      }
      const token = await gerarToken({ id: funcionario.id, email: funcionario.email, perfil: funcionario.perfil });
      const isSecure = ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https";
      ctx.res.cookie(FUNC_COOKIE, token, {
        httpOnly: true,
        path: "/",
        sameSite: isSecure ? "none" : "lax",
        secure: isSecure,
        maxAge: ONE_YEAR_MS,
      });
      return { success: true, perfil: funcionario.perfil, nome: funcionario.nome };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const isSecure = ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https";
    ctx.res.clearCookie(FUNC_COOKIE, { httpOnly: true, path: "/", sameSite: isSecure ? "none" : "lax", secure: isSecure });
    return { success: true } as const;
  }),

  me: publicProcedure.query(({ ctx }) => {
    if (ctx.funcionario) {
      return { id: ctx.funcionario.id, nome: ctx.funcionario.nome, email: ctx.funcionario.email, perfil: ctx.funcionario.perfil };
    }
    return null;
  }),
});
