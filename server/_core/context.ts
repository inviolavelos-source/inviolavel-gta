import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import type { Funcionario } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { jwtVerify } from "jose";
import { ENV } from "./env";
import { buscarFuncionarioPorId } from "../db";

export type FuncionarioSession = Omit<Funcionario, "senhaHash">;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  funcionario: FuncionarioSession | null;
};

const FUNC_COOKIE = "func_session";

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let funcionario: FuncionarioSession | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  try {
    const rawCookie = opts.req.headers.cookie ?? "";
    const cookieMap: Record<string, string> = {};
    rawCookie.split(";").forEach((c) => {
      const idx = c.indexOf("=");
      if (idx > 0) {
        cookieMap[c.slice(0, idx).trim()] = c.slice(idx + 1).trim();
      }
    });
    const token = cookieMap[FUNC_COOKIE];
    if (token) {
      const secret = new TextEncoder().encode(ENV.cookieSecret || "inviolavel_secret_key_2024");
      const { payload } = await jwtVerify(token, secret);
      const funcId = payload.id as number;
      if (funcId) {
        const func = await buscarFuncionarioPorId(funcId);
        if (func && func.ativo) {
          funcionario = func as FuncionarioSession;
        }
      }
    }
  } catch {
    funcionario = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    funcionario,
  };
}
