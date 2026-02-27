# InviolavelGTA — TODO

## Banco de Dados & Schema
- [x] Schema Drizzle: tabelas clientes, instalacoes, instalacao_materiais, instalacao_fotos, produtos, pontos, logs_auditoria, funcionarios
- [x] Migração SQL aplicada via webdev_execute_sql

## Backend (tRPC Routers)
- [x] Router auth: login/logout/me com controle de perfil (admin/funcionario)
- [x] Router admin/funcionarios: CRUD + ativar/desativar + reset senha
- [x] Router admin/clientes: CRUD completo
- [x] Router admin/clientes PDF: gerar ficha PDF e salvar no S3
- [x] Router admin/instalacoes: CRUD + atribuição + alterar status
- [x] Router admin/produtos: CRUD com categorias
- [x] Router admin/relatorios: ponto por período, instalações, materiais
- [x] Router app/instalacoes: listar minhas instalações, detalhe
- [x] Router app/materiais: registrar materiais em OS
- [x] Router app/ponto: entrada, saída, início/fim almoço
- [x] Logs de auditoria para ações críticas

## Frontend — Layout & Navegação
- [x] Tema visual: cores InviolavelGTA (amarelo/preto/cinza escuro)
- [x] DashboardLayout com sidebar responsiva (mobile-first)
- [x] Rota /login com formulário de autenticação
- [x] Rotas protegidas por perfil (admin vs funcionário)
- [x] Dashboard Admin com cards de resumo
- [x] Dashboard Funcionário com acesso rápido

## Frontend — Módulos Admin
- [x] Página /admin/funcionarios: lista + modal criar/editar + ativar/desativar
- [x] Página /admin/clientes: lista paginada + busca
- [x] Página /admin/clientes/:id: detalhe + botão gerar PDF
- [x] Formulário de cadastro de cliente (PF/PJ) com todos os campos
- [x] Página /admin/instalacoes: lista com filtros de status/tipo
- [x] Página /admin/instalacoes/:id: detalhe + materiais + alterar status
- [x] Formulário criar/editar instalação com atribuição de funcionário
- [x] Página /admin/produtos: lista + modal criar/editar por categoria
- [x] Página /admin/relatorios/ponto: filtro por período e funcionário
- [x] Página /admin/relatorios/instalacoes: filtro por período e status
- [x] Página /admin/relatorios/materiais: consumo por OS

## Frontend — Módulos Funcionário
- [x] Página /app/dashboard: boas-vindas + atalhos rápidos
- [x] Página /app/ponto: botões entrada/saída/almoço com status do dia
- [x] Página /app/instalacoes: lista das minhas OS atribuídas
- [x] Página /app/instalacoes/:id: detalhe + registrar materiais + finalizar
- [x] Página /app/historico: histórico de OS concluídas

## Geração de PDF
- [x] Geração de ficha do cliente em PDF (server-side com PDFKit)
- [x] Upload do PDF gerado para S3
- [x] Vinculação do PDF ao registro do cliente
- [x] Download do PDF na interface

## Catálogo Inicial de Materiais
- [x] Seed dos materiais iniciais (Alarme, Câmera, Cerca Elétrica) — 39 produtos inseridos via SQL

## Testes
- [x] Testes vitest para routers críticos (auth, controlo de acesso, ponto)

## Qualidade & Entrega
- [x] Interface responsiva validada em mobile
- [x] Checkpoint final e entrega ao utilizador
