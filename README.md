# Projeto Inviolável GTA — Gestão de Monitoramento Eletrônico

Este é um sistema de gestão completo para empresas de segurança e monitoramento, desenvolvido com uma arquitetura moderna, robusta e escalável.

## 🛠️ Stack Tecnológica

- **Frontend**: React + Vite + TypeScript
- **Backend API**: Node.js + tRPC (Type-safe API)
- **Banco de Dados**: SQLite com Drizzle ORM
- **Estilo**: Tailwind CSS v4 + Shadcn UI (Componentes Premium)
- **Geração de PDF**: PDFKit
- **Ícones**: Lucide React
- **Navegação**: Wouter (Leve e rápida)

## 🚀 Como Executar o Projeto

1.  **Instalar Dependências**:
    ```bash
    npm install
    ```

2.  **Iniciar Banco de Dados**:
    O projeto já inclui um arquivo `sqlite.db`. Caso deseje iniciar do zero:
    ```bash
    npx drizzle-kit push
    ```

3.  **Popular Banco de Dados (Seed)**:
    Necessário para criar o primeiro usuário Administrador (`123456`):
    ```bash
    npm run seed
    ```

4.  **Rodar em Desenvolvimento**:
    ```bash
    npm run dev
    ```
    O sistema estará disponível em `http://localhost:3000`.

## 🔐 Acesso Inicial (Admin)

- **Usuário**: (Usar o e-mail cadastrado no seed, ex: `admin@inviolavel.com`)
- **Senha**: `123456`

## 📂 Estrutura de Pastas Principal

- `/client`: Código fonte do frontend (Vite/React).
- `/server`: Lógica do servidor Express e Routers tRPC.
- `/shared`: Tipos e esquemas compartilhados entre client/server.
- `/drizzle`: Definições de esquema do banco de dados e migrações.
- `/uploads`: Pasta onde ficam as fotos de instalações e assinaturas digitais.

## ✨ Funcionalidades Implementadas

- **Dashboard Administrativo**: Visão geral com gráficos de produtividade (Recharts).
- **Gestão de Clientes**: CRUD completo e geração de Ficha em PDF.
- **Gestão de OS/Instalações**: Atribuição de técnicos, checklists, assinaturas digitais e upload de fotos (Antes/Depois).
- **Controle de Estoque**: Abate automático de materiais ao finalizar instalações.
- **Registo de Ponto**: Controle de jornada de funcionários com geolocalização (GPS).
- **Modo Mobile**: Interface otimizada para técnicos utilizarem em smartphones.

---
© 2026 INVIOLÁVEL — Desenvolvido para máxima segurança e eficiência.
