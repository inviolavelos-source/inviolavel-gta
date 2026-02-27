import {
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

// ─── Utilizadores (base de autenticação) ───────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Funcionários ──────────────────────────────────────────────────────────
export const funcionarios = sqliteTable("funcionarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senhaHash").notNull(),
  perfil: text("perfil", { enum: ["ADMIN", "FUNCIONARIO"] }).notNull().default("FUNCIONARIO"),
  telefone: text("telefone"),
  cargo: text("cargo"),
  ativo: integer("ativo").notNull().default(1),
  criadoEm: integer("criadoEm", { mode: "timestamp" }),
  atualizadoEm: integer("atualizadoEm", { mode: "timestamp" }),
});

export type Funcionario = typeof funcionarios.$inferSelect;
export type InsertFuncionario = typeof funcionarios.$inferInsert;

// ─── Clientes ──────────────────────────────────────────────────────────────
export const clientes = sqliteTable("clientes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tipo: text("tipo", { enum: ["PF", "PJ"] }).notNull().default("PF"),
  nomeRazao: text("nomeRazao").notNull(),
  cpfCnpj: text("cpfCnpj").notNull(),
  rgIe: text("rgIe"),
  nascimento: text("nascimento"),
  telefone1: text("telefone1"),
  telefone2: text("telefone2"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  cep: text("cep"),
  rua: text("rua"),
  numero: text("numero"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  uf: text("uf"),
  clienteNovo: integer("clienteNovo").default(1),
  dataCadastro: text("dataCadastro"),
  codigo: text("codigo"),
  modeloCentral: text("modeloCentral"),
  dataInstalacao: text("dataInstalacao"),
  tipoContrato: text("tipoContrato", { enum: ["PRÓPRIO", "LOCADO", "VENDIDO"] }),
  ramoAtividade: text("ramoAtividade", { enum: ["Comercial", "Residencial", "Industrial", "Pública", "Outros"] }),
  nomeFantasia: text("nomeFantasia"),
  proximidade: text("proximidade"),
  rota: text("rota"),
  responsavelNome: text("responsavelNome"),
  responsavelNascimento: text("responsavelNascimento"),
  responsavelCpf: text("responsavelCpf"),
  responsavelRg: text("responsavelRg"),
  responsavelEndereco: text("responsavelEndereco"),
  responsavelNumero: text("responsavelNumero"),
  responsavelBairro: text("responsavelBairro"),
  responsavelCidade: text("responsavelCidade"),
  responsavelEstado: text("responsavelEstado"),
  nomeProprietario: text("nomeProprietario"),
  nomeInstalador: text("nomeInstalador"),
  nomeVendedor: text("nomeVendedor"),
  complemento: text("complemento"),
  referencia: text("referencia"),
  observacoes: text("observacoes"),
  criadoEm: integer("criadoEm", { mode: "timestamp" }),
  atualizadoEm: integer("atualizadoEm", { mode: "timestamp" }),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

// ─── Fichas PDF dos Clientes ───────────────────────────────────────────────
export const clienteFichas = sqliteTable("clienteFichas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clienteId: integer("clienteId").notNull().references(() => clientes.id),
  arquivoPath: text("arquivoPath").notNull(),
  arquivoUrl: text("arquivoUrl").notNull(),
  criadoEm: integer("criadoEm", { mode: "timestamp" }),
});

export type ClienteFicha = typeof clienteFichas.$inferSelect;

// ─── Produtos / Materiais ──────────────────────────────────────────────────
export const produtos = sqliteTable("produtos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  codigo: text("codigo"),
  nome: text("nome").notNull(),
  categoria: text("categoria", { enum: ["ALARME", "CAMERA", "CERCA", "OUTROS"] }).notNull(),
  unidade: text("unidade").default("un"),
  estoque: text("estoque").default("0"),
  ativo: integer("ativo").notNull().default(1),
  criadoEm: integer("criadoEm", { mode: "timestamp" }),
  atualizadoEm: integer("atualizadoEm", { mode: "timestamp" }),
});

export type Produto = typeof produtos.$inferSelect;
export type InsertProduto = typeof produtos.$inferInsert;

// ─── Instalações (OS) ──────────────────────────────────────────────────────
export const instalacoes = sqliteTable("instalacoes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clienteId: integer("clienteId").references(() => clientes.id),
  clienteProvisorio: text("clienteProvisorio"),
  tipo: text("tipo", { enum: ["ALARME", "CAMERA", "CERCA", "MULTIPLO"] }).notNull(),
  enderecoExecucao: text("enderecoExecucao"),
  dataPrevista: text("dataPrevista"),
  funcionarioId: integer("funcionarioId").references(() => funcionarios.id),
  status: text("status", { enum: ["ORCAMENTO", "PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"] }).notNull().default("PENDENTE"),
  observacoes: text("observacoes"),
  zonas: text("zonas", { mode: "json" }),
  usuarios: text("usuarios", { mode: "json" }),
  criadoEm: integer("criadoEm", { mode: "timestamp" }),
  atualizadoEm: integer("atualizadoEm", { mode: "timestamp" }),
  finalizadoEm: integer("finalizadoEm", { mode: "timestamp" }),
  assinaturaUrl: text("assinaturaUrl"),
  latitudeInicio: text("latitudeInicio"),
  longitudeInicio: text("longitudeInicio"),
  latitudeFim: text("latitudeFim"),
  longitudeFim: text("longitudeFim"),
  checklist: text("checklist", { mode: "json" }),
});

export type Instalacao = typeof instalacoes.$inferSelect;
export type InsertInstalacao = typeof instalacoes.$inferInsert;

// ─── Materiais usados por Instalação ──────────────────────────────────────
export const instalacaoMateriais = sqliteTable("instalacaoMateriais", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  instalacaoId: integer("instalacaoId").notNull().references(() => instalacoes.id),
  produtoId: integer("produtoId").notNull().references(() => produtos.id),
  quantidade: text("quantidade").notNull(),
  observacoes: text("observacoes"),
  criadoEm: integer("criadoEm", { mode: "timestamp" }),
});

export type InstalacaoMaterial = typeof instalacaoMateriais.$inferSelect;
export type InsertInstalacaoMaterial = typeof instalacaoMateriais.$inferInsert;

// ─── Fotos das Instalações ─────────────────────────────────────────────────
export const instalacaoFotos = sqliteTable("instalacaoFotos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  instalacaoId: integer("instalacaoId").notNull().references(() => instalacoes.id),
  arquivoPath: text("arquivoPath").notNull(),
  arquivoUrl: text("arquivoUrl").notNull(),
  tipo: text("tipo", { enum: ["ANTES", "DEPOIS", "OUTROS"] }).default("OUTROS"),
  criadoEm: integer("criadoEm", { mode: "timestamp" }),
});

export type InstalacaoFoto = typeof instalacaoFotos.$inferSelect;

// ─── Técnicos atribuídos por Instalação ──────────────────────────────────
export const instalacaoTecnicos = sqliteTable("instalacaoTecnicos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  instalacaoId: integer("instalacaoId").notNull().references(() => instalacoes.id),
  funcionarioId: integer("funcionarioId").notNull().references(() => funcionarios.id),
});

export type InstalacaoTecnico = typeof instalacaoTecnicos.$inferSelect;

// ─── Registros de Ponto ────────────────────────────────────────────────────
export const pontos = sqliteTable(
  "pontos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    funcionarioId: integer("funcionarioId").notNull().references(() => funcionarios.id),
    data: text("data").notNull(),
    horaEntrada: text("horaEntrada"),
    isManualEntrada: integer("isManualEntrada").default(0),
    horaInicioAlmoco: text("horaInicioAlmoco"),
    isManualInicioAlmoco: integer("isManualInicioAlmoco").default(0),
    horaFimAlmoco: text("horaFimAlmoco"),
    isManualFimAlmoco: integer("isManualFimAlmoco").default(0),
    horaSaida: text("horaSaida"),
    isManualSaida: integer("isManualSaida").default(0),
    latEntrada: text("latEntrada"),
    lonEntrada: text("lonEntrada"),
    latSaida: text("latSaida"),
    lonSaida: text("lonSaida"),
    justificativaManual: text("justificativaManual"),
    criadoEm: integer("criadoEm", { mode: "timestamp" }),
    atualizadoEm: integer("atualizadoEm", { mode: "timestamp" }),
  },
  (t) => [unique("uniq_ponto_func_data").on(t.funcionarioId, t.data)]
);

export type Ponto = typeof pontos.$inferSelect;
export type InsertPonto = typeof pontos.$inferInsert;

// ─── Logs de Auditoria ─────────────────────────────────────────────────────
export const logsAuditoria = sqliteTable("logsAuditoria", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  funcionarioId: integer("funcionarioId").references(() => funcionarios.id),
  acao: text("acao").notNull(),
  entidade: text("entidade").notNull(),
  entidadeId: integer("entidadeId"),
  detalhes: text("detalhes", { mode: "json" }),
  criadoEm: integer("criadoEm", { mode: "timestamp" }),
});

export type LogAuditoria = typeof logsAuditoria.$inferSelect;
