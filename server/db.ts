import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  Cliente,
  ClienteFicha,
  Funcionario,
  InsertCliente,
  InsertFuncionario,
  InsertInstalacao,
  InsertInstalacaoMaterial,
  InsertPonto,
  InsertProduto,
  InsertUser,
  Instalacao,
  InstalacaoMaterial,
  Ponto,
  Produto,
  clienteFichas,
  clientes,
  funcionarios,
  instalacaoFotos,
  instalacaoMateriais,
  instalacaoTecnicos,
  instalacoes,
  logsAuditoria,
  pontos,
  produtos,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      const url = ENV.databaseUrl || "file:sqlite.db";
      const sqlite = createClient({ url });
      _db = drizzle(sqlite);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users (OAuth) ──────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Funcionários ──────────────────────────────────────────────────────────
export async function listarFuncionarios() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: funcionarios.id, nome: funcionarios.nome, email: funcionarios.email, perfil: funcionarios.perfil, telefone: funcionarios.telefone, cargo: funcionarios.cargo, ativo: funcionarios.ativo, criadoEm: funcionarios.criadoEm }).from(funcionarios).orderBy(desc(funcionarios.criadoEm));
}

export async function buscarFuncionarioPorId(id: number, incluirSenha = false) {
  const db = await getDb();
  if (!db) return undefined;
  if (incluirSenha) {
    const result = await db.select().from(funcionarios).where(eq(funcionarios.id, id)).limit(1);
    return result[0];
  }
  const result = await db.select({ id: funcionarios.id, nome: funcionarios.nome, email: funcionarios.email, perfil: funcionarios.perfil, telefone: funcionarios.telefone, cargo: funcionarios.cargo, ativo: funcionarios.ativo, criadoEm: funcionarios.criadoEm }).from(funcionarios).where(eq(funcionarios.id, id)).limit(1);
  return result[0];
}

export async function buscarFuncionarioPorEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(funcionarios).where(eq(funcionarios.email, email)).limit(1);
  return result[0];
}

export async function criarFuncionario(data: InsertFuncionario) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  const result = await db.insert(funcionarios).values(data);
  return Number(result.lastInsertRowid);
}

export async function atualizarFuncionario(id: number, data: Partial<InsertFuncionario>) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.update(funcionarios).set(data).where(eq(funcionarios.id, id));
}

export async function excluirFuncionario(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  // Desvincula instalações do funcionário antes de apagar (ou apaga os pontos também se quiser)
  await db.update(instalacoes).set({ funcionarioId: null }).where(eq(instalacoes.funcionarioId, id));
  await db.delete(pontos).where(eq(pontos.funcionarioId, id));
  await db.delete(funcionarios).where(eq(funcionarios.id, id));
}

// ─── Clientes ──────────────────────────────────────────────────────────────
export async function listarClientes(busca?: string) {
  const db = await getDb();
  if (!db) return [];
  if (busca) {
    return db.select().from(clientes).where(or(sql`${clientes.nomeRazao} LIKE ${`%${busca}%`}`, sql`${clientes.cpfCnpj} LIKE ${`%${busca}%`}`, sql`${clientes.telefone1} LIKE ${`%${busca}%`}`)).orderBy(desc(clientes.criadoEm));
  }
  return db.select().from(clientes).orderBy(desc(clientes.criadoEm));
}

export async function buscarClientePorId(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result[0];
}

export async function buscarUltimaInstalacaoPorCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(instalacoes)
    .where(eq(instalacoes.clienteId, clienteId))
    .orderBy(desc(instalacoes.id))
    .limit(1);
  return result[0];
}

export async function criarCliente(data: InsertCliente) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  const result = await db.insert(clientes).values(data);
  return Number(result.lastInsertRowid);
}

export async function atualizarCliente(id: number, data: Partial<InsertCliente>) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.update(clientes).set(data).where(eq(clientes.id, id));
}

export async function excluirCliente(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");

  // Buscar instalações do cliente para apagar os materiais delas primeiro
  const clientInsts = await db.select({ id: instalacoes.id }).from(instalacoes).where(eq(instalacoes.clienteId, id));
  for (const inst of clientInsts) {
    await db.delete(instalacaoMateriais).where(eq(instalacaoMateriais.instalacaoId, inst.id));
    await db.delete(instalacaoFotos).where(eq(instalacaoFotos.instalacaoId, inst.id));
  }

  await db.delete(instalacoes).where(eq(instalacoes.clienteId, id));
  await db.delete(clienteFichas).where(eq(clienteFichas.clienteId, id));
  await db.delete(clientes).where(eq(clientes.id, id));
}

export async function salvarFichaCliente(clienteId: number, arquivoPath: string, arquivoUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.insert(clienteFichas).values({ clienteId, arquivoPath, arquivoUrl });
}

export async function listarFichasCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clienteFichas).where(eq(clienteFichas.clienteId, clienteId)).orderBy(desc(clienteFichas.criadoEm));
}

// ─── Produtos ──────────────────────────────────────────────────────────────
export async function listarProdutos(categoria?: string) {
  const db = await getDb();
  if (!db) return [];
  if (categoria) {
    return db.select().from(produtos).where(and(eq(produtos.categoria, categoria as "ALARME" | "CAMERA" | "CERCA" | "OUTROS"), eq(produtos.ativo, 1))).orderBy(produtos.nome);
  }
  return db.select().from(produtos).where(eq(produtos.ativo, 1)).orderBy(produtos.categoria, produtos.nome);
}

export async function buscarProdutoPorId(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  return result[0];
}

export async function criarProduto(data: InsertProduto) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.insert(produtos).values(data);
}

export async function atualizarProduto(id: number, data: Partial<InsertProduto>) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.update(produtos).set(data).where(eq(produtos.id, id));
}

// ─── Instalações ──────────────────────────────────────────────────────────
export async function listarInstalacoes(filtros?: { status?: string; tipo?: string; funcionarioId?: number; de?: Date; ate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filtros?.status) conditions.push(eq(instalacoes.status, filtros.status as any));
  if (filtros?.tipo) conditions.push(eq(instalacoes.tipo, filtros.tipo as any));

  // Se filtrar por funcionário, buscar os que ele é o principal OU está na lista de técnicos
  if (filtros?.funcionarioId) {
    const subquery = db.select({ id: instalacaoTecnicos.instalacaoId })
      .from(instalacaoTecnicos)
      .where(eq(instalacaoTecnicos.funcionarioId, filtros.funcionarioId));

    conditions.push(or(
      eq(instalacoes.funcionarioId, filtros.funcionarioId),
      sql`${instalacoes.id} IN (${subquery})`
    ));
  }

  if (filtros?.de) conditions.push(gte(instalacoes.criadoEm, filtros.de));
  if (filtros?.ate) conditions.push(lte(instalacoes.criadoEm, filtros.ate));

  const query = db
    .select({ instalacao: instalacoes, clienteNomeJoin: clientes.nomeRazao, funcionarioNome: funcionarios.nome })
    .from(instalacoes)
    .leftJoin(clientes, eq(instalacoes.clienteId, clientes.id))
    .leftJoin(funcionarios, eq(instalacoes.funcionarioId, funcionarios.id));

  const results = conditions.length > 0
    ? await query.where(and(...conditions)).orderBy(desc(instalacoes.criadoEm))
    : await query.orderBy(desc(instalacoes.criadoEm));

  return results.map(r => ({
    ...r,
    clienteNome: r.clienteNomeJoin || r.instalacao.clienteProvisorio || "Sem nome"
  }));
}

export async function buscarInstalacaoPorId(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ instalacao: instalacoes, clienteNomeJoin: clientes.nomeRazao, funcionarioNome: funcionarios.nome })
    .from(instalacoes)
    .leftJoin(clientes, eq(instalacoes.clienteId, clientes.id))
    .leftJoin(funcionarios, eq(instalacoes.funcionarioId, funcionarios.id))
    .where(eq(instalacoes.id, id))
    .limit(1);

  if (!result[0]) return undefined;

  // Buscar técnicos adicionais
  const tecnicos = await db
    .select({ id: funcionarios.id, nome: funcionarios.nome })
    .from(instalacaoTecnicos)
    .innerJoin(funcionarios, eq(instalacaoTecnicos.funcionarioId, funcionarios.id))
    .where(eq(instalacaoTecnicos.instalacaoId, id));

  return {
    ...result[0],
    tecnicos,
    clienteNome: result[0].clienteNomeJoin || result[0].instalacao.clienteProvisorio || "Sem nome"
  };
}

export async function criarInstalacao(data: InsertInstalacao & { tecnicosIds?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");

  const { id, tecnicosIds, ...rest } = data as any;
  const result = await db.insert(instalacoes).values(rest);
  const instalacaoId = Number(result.lastInsertRowid);

  if (tecnicosIds && Array.isArray(tecnicosIds)) {
    for (const funcId of tecnicosIds) {
      await db.insert(instalacaoTecnicos).values({ instalacaoId, funcionarioId: funcId });
    }
  }

  return instalacaoId;
}

export async function atualizarInstalacao(id: number, data: Partial<InsertInstalacao> & { tecnicosIds?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");

  const { tecnicosIds, ...rest } = data as any;

  if (Object.keys(rest).length > 0) {
    await db.update(instalacoes).set(rest).where(eq(instalacoes.id, id));
  }

  if (tecnicosIds && Array.isArray(tecnicosIds)) {
    // Sincronizar técnicos: remover todos e adicionar os novos
    await db.delete(instalacaoTecnicos).where(eq(instalacaoTecnicos.instalacaoId, id));
    for (const funcId of tecnicosIds) {
      await db.insert(instalacaoTecnicos).values({ instalacaoId: id, funcionarioId: funcId });
    }
  }
}

export async function excluirInstalacao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.delete(instalacaoMateriais).where(eq(instalacaoMateriais.instalacaoId, id));
  await db.delete(instalacaoFotos).where(eq(instalacaoFotos.instalacaoId, id));
  await db.delete(instalacoes).where(eq(instalacoes.id, id));
}

// ─── Materiais de Instalação ───────────────────────────────────────────────
export async function listarMateriaisInstalacao(instalacaoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ material: instalacaoMateriais, produtoNome: produtos.nome, produtoCodigo: produtos.codigo, produtoUnidade: produtos.unidade })
    .from(instalacaoMateriais)
    .leftJoin(produtos, eq(instalacaoMateriais.produtoId, produtos.id))
    .where(eq(instalacaoMateriais.instalacaoId, instalacaoId))
    .orderBy(instalacaoMateriais.criadoEm);
}

export async function adicionarMaterialInstalacao(data: InsertInstalacaoMaterial) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.insert(instalacaoMateriais).values(data);
}

export async function abaterEstoque(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");

  // Buscar materiais da instalação
  const materiais = await db
    .select()
    .from(instalacaoMateriais)
    .where(eq(instalacaoMateriais.instalacaoId, id));

  for (const m of materiais) {
    const produto = await db
      .select()
      .from(produtos)
      .where(eq(produtos.id, m.produtoId))
      .limit(1);

    if (produto[0]) {
      const estoqueAtual = parseFloat(produto[0].estoque || "0");
      const qtdUsada = parseFloat(m.quantidade);
      const novoEstoque = Math.max(0, estoqueAtual - qtdUsada);

      await db
        .update(produtos)
        .set({ estoque: String(novoEstoque) })
        .where(eq(produtos.id, m.produtoId));
    }
  }
}

export async function removerMaterialInstalacao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.delete(instalacaoMateriais).where(eq(instalacaoMateriais.id, id));
}
// ─── Fotos das Instalações ─────────────────────────────────────────────────
export async function salvarFotoInstalacao(data: { instalacaoId: number; url: string; path: string; tipo: "ANTES" | "DEPOIS" | "OUTROS" }) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.insert(instalacaoFotos).values({
    instalacaoId: data.instalacaoId,
    arquivoUrl: data.url,
    arquivoPath: data.path,
    tipo: data.tipo,
    criadoEm: new Date(),
  });
}

export async function listarFotosInstalacao(instalacaoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(instalacaoFotos)
    .where(eq(instalacaoFotos.instalacaoId, instalacaoId))
    .orderBy(desc(instalacaoFotos.criadoEm));
}

export async function excluirFotoInstalacao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  await db.delete(instalacaoFotos).where(eq(instalacaoFotos.id, id));
}

// ─── Ponto ─────────────────────────────────────────────────────────────────
export async function buscarPontoHoje(funcionarioId: number, dataStr: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pontos).where(and(eq(pontos.funcionarioId, funcionarioId), sql`${pontos.data} = ${dataStr}`)).limit(1);
  return result[0];
}

export async function criarOuAtualizarPonto(
  funcionarioId: number,
  dataStr: string,
  campo: "horaEntrada" | "horaInicioAlmoco" | "horaFimAlmoco" | "horaSaida",
  valor: string,
  isManual: boolean = false,
  justificativa?: string,
  gps?: { lat: string; lon: string }
) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");

  const existente = await buscarPontoHoje(funcionarioId, dataStr);
  const manualField = `isManual${campo.replace("hora", "")}` as any;

  const setUpdate: any = { [campo]: valor };
  if (isManual) {
    setUpdate[manualField] = 1;
    if (justificativa) setUpdate.justificativaManual = justificativa;
  }

  if (gps && campo === "horaEntrada") {
    setUpdate.latEntrada = gps.lat;
    setUpdate.lonEntrada = gps.lon;
  }
  if (gps && campo === "horaSaida") {
    setUpdate.latSaida = gps.lat;
    setUpdate.lonSaida = gps.lon;
  }

  if (existente) {
    await db
      .update(pontos)
      .set(setUpdate)
      .where(and(eq(pontos.funcionarioId, funcionarioId), sql`${pontos.data} = ${dataStr}`));
  } else {
    const insertData: any = {
      funcionarioId,
      data: dataStr,
      [campo]: valor,
    };
    if (isManual) {
      insertData[manualField] = 1;
      if (justificativa) insertData.justificativaManual = justificativa;
    }
    if (gps && campo === "horaEntrada") {
      insertData.latEntrada = gps.lat;
      insertData.lonEntrada = gps.lon;
    }
    await db.insert(pontos).values(insertData as InsertPonto);
  }
}

export async function listarPontos(filtros: { funcionarioId?: number; de: string; ate: string }) {
  const db = await getDb();
  if (!db) return [];
  const whereConditions = [];
  whereConditions.push(sql`${pontos.data} >= ${filtros.de}`);
  whereConditions.push(sql`${pontos.data} <= ${filtros.ate}`);
  if (filtros.funcionarioId) whereConditions.push(eq(pontos.funcionarioId, filtros.funcionarioId));
  return db
    .select({ ponto: pontos, funcionarioNome: funcionarios.nome })
    .from(pontos)
    .leftJoin(funcionarios, eq(pontos.funcionarioId, funcionarios.id))
    .where(and(...whereConditions))
    .orderBy(desc(pontos.data), funcionarios.nome);
}

// ─── Logs de Auditoria ─────────────────────────────────────────────────────
export async function registrarLog(funcionarioId: number | null, acao: string, entidade: string, entidadeId?: number, detalhes?: unknown) {
  const db = await getDb();
  if (!db) return;
  await db.insert(logsAuditoria).values({ funcionarioId, acao, entidade, entidadeId: entidadeId ?? null, detalhes: detalhes ?? null });
}

// ─── Relatórios ────────────────────────────────────────────────────────────
export async function relatorioMateriaisPorOS(instalacaoId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({
      instalacaoId: instalacaoMateriais.instalacaoId,
      produtoNome: produtos.nome,
      produtoCodigo: produtos.codigo,
      categoria: produtos.categoria,
      unidade: produtos.unidade,
      quantidade: instalacaoMateriais.quantidade,
      observacoes: instalacaoMateriais.observacoes,
      clienteNome: clientes.nomeRazao,
      tipo: instalacoes.tipo,
      status: instalacoes.status,
    })
    .from(instalacaoMateriais)
    .leftJoin(produtos, eq(instalacaoMateriais.produtoId, produtos.id))
    .leftJoin(instalacoes, eq(instalacaoMateriais.instalacaoId, instalacoes.id))
    .leftJoin(clientes, eq(instalacoes.clienteId, clientes.id));
  if (instalacaoId) {
    return query.where(eq(instalacaoMateriais.instalacaoId, instalacaoId));
  }
  return query.orderBy(desc(instalacaoMateriais.criadoEm));
}

export async function resumoDashboardAdmin() {
  const db = await getDb();
  if (!db) return { totalClientes: 0, totalInstalacoes: 0, totalFuncionarios: 0, instalacoesPendentes: 0, instalacoesConcluidas: 0 };

  const [totalClientes] = await db.select({ count: sql<number>`count(*)` }).from(clientes);
  const [totalInstalacoes] = await db.select({ count: sql<number>`count(*)` }).from(instalacoes);
  const [totalFuncionarios] = await db.select({ count: sql<number>`count(*)` }).from(funcionarios).where(eq(funcionarios.ativo, 1));
  const [instalacoesPendentes] = await db.select({ count: sql<number>`count(*)` }).from(instalacoes).where(eq(instalacoes.status, "PENDENTE"));
  const [instalacoesConcluidas] = await db.select({ count: sql<number>`count(*)` }).from(instalacoes).where(eq(instalacoes.status, "CONCLUIDA"));

  // Desempenho por técnico
  const performanceTecnicos = await db
    .select({
      id: funcionarios.id,
      nome: funcionarios.nome,
      concluidas: sql<number>`count(*)`,
    })
    .from(instalacoes)
    .innerJoin(funcionarios, eq(instalacoes.funcionarioId, funcionarios.id))
    .where(eq(instalacoes.status, "CONCLUIDA"))
    .groupBy(funcionarios.id, funcionarios.nome)
    .orderBy(desc(sql`count(*)`));

  // Produtos com estoque baixo (< 10)
  const estoqueBaixo = await db
    .select()
    .from(produtos)
    .where(sql`CAST(${produtos.estoque} AS REAL) < 10`)
    .limit(10);

  return {
    totalClientes: Number(totalClientes?.count ?? 0),
    totalInstalacoes: Number(totalInstalacoes?.count ?? 0),
    totalFuncionarios: Number(totalFuncionarios?.count ?? 0),
    instalacoesPendentes: Number(instalacoesPendentes?.count ?? 0),
    instalacoesConcluidas: Number(instalacoesConcluidas?.count ?? 0),
    performanceTecnicos,
    estoqueBaixo,
  };
}

export async function resumoDashboardFuncionario(funcionarioId: number) {
  const db = await getDb();
  if (!db) return { totalAtribuidas: 0, totalConcluidas: 0, totalPendentes: 0 };
  const [totalAtribuidas] = await db.select({ count: sql<number>`count(*)` }).from(instalacoes).where(eq(instalacoes.funcionarioId, funcionarioId));
  const [totalConcluidas] = await db.select({ count: sql<number>`count(*)` }).from(instalacoes).where(and(eq(instalacoes.funcionarioId, funcionarioId), eq(instalacoes.status, "CONCLUIDA")));
  const [totalPendentes] = await db.select({ count: sql<number>`count(*)` }).from(instalacoes).where(and(eq(instalacoes.funcionarioId, funcionarioId), eq(instalacoes.status, "PENDENTE")));
  return {
    totalAtribuidas: Number(totalAtribuidas?.count ?? 0),
    totalConcluidas: Number(totalConcluidas?.count ?? 0),
    totalPendentes: Number(totalPendentes?.count ?? 0),
  };
}
