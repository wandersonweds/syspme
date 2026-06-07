# Instalação — SysPME

Guia de instalação em ambiente Windows para avaliação local do sistema.

---

## Pré-requisitos

| Software | Versão | Link |
|---|---|---|
| Node.js | 18 LTS ou superior | https://nodejs.org |
| pnpm | 8 ou superior | https://pnpm.io/installation |
| MySQL | 8.0 ou superior | https://dev.mysql.com/downloads/installer/ |

---

## Passo 1 — Node.js

Baixe e instale a versão LTS em https://nodejs.org. Após instalar, confirme no CMD:

```
node --version
```

---

## Passo 2 — pnpm

```
npm install -g pnpm
```

---

## Passo 3 — MySQL

1. Baixe o MySQL Installer em https://dev.mysql.com/downloads/installer/
2. Durante a instalação, defina uma senha para o usuário `root` e anote ela.
3. Após instalar, abra o **phpMyAdmin** (ou o MySQL Command Line Client) e crie o banco de dados:

```sql
CREATE DATABASE syspme CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> Esse passo é obrigatório. O sistema não cria o banco automaticamente — só as tabelas.

---

## Passo 4 — Configurar o projeto

1. Extraia o arquivo `SysPME-TCC.zip` em uma pasta (ex: `C:\SysPME`).
2. Copie o arquivo `.env.example` e renomeie a cópia para `.env`:
   ```
   copy .env.example .env
   ```
3. Abra o `.env` e preencha:

   ```
   DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/syspme"
   JWT_SECRET="syspme-chave-secreta-tcc-2026"
   ```

   Substitua `SUA_SENHA` pela senha do MySQL que você definiu.

---

## Passo 5 — Instalar dependências

Abra o CMD ou terminal na pasta do projeto e execute:

```
pnpm install
```

---

## Passo 6 — Criar as tabelas

```
pnpm db:push
```

Esse comando lê o schema em `drizzle/schema.ts` e cria todas as tabelas no banco `syspme`.

---

## Passo 7 — Iniciar o sistema

```
pnpm dev
```

Acesse **http://localhost:3000** no navegador.

---

## Primeiro acesso

O sistema detecta que não há usuários cadastrados e exibe a tela de **Configuração Inicial**. Crie o primeiro usuário administrador e em seguida faça login normalmente.

---

## Estrutura de pastas

```
syspme/
├── client/          → Interface (React 19 + Tailwind CSS 4)
├── server/          → Back-end (Express + tRPC)
│   ├── routers.ts   → Endpoints da API
│   └── db.ts        → Acesso ao banco de dados
├── drizzle/         → Schema e migrações
├── shared/          → Tipos compartilhados
├── uploads/         → Logomarca e arquivos (criada automaticamente)
├── .env.example     → Modelo de variáveis de ambiente
├── INSTALL.md       → Este guia
└── README.md        → Documentação do projeto
```

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Back-end | Node.js, Express 4, tRPC 11 |
| Banco de dados | MySQL 8 com Drizzle ORM |
| Autenticação | JWT com bcryptjs + jose |
| Build | Vite 7 |

---

## Problemas comuns

**`DATABASE_URL is required`**
O arquivo `.env` não foi criado ou está fora da pasta raiz do projeto.

**Erro de conexão com o MySQL**
Verifique se o serviço MySQL está rodando (Painel de Controle → Ferramentas Administrativas → Serviços → MySQL80) e se a senha no `.env` está correta.

**`pnpm db:push` falha com erro de banco não encontrado**
O banco `syspme` precisa existir antes de rodar esse comando. Crie-o pelo phpMyAdmin conforme o Passo 3.

**Porta 3000 em uso**
Encerre o processo que está usando a porta ou altere em `server/_core/index.ts`.

**`pnpm` não reconhecido no CMD**
Feche e reabra o CMD após a instalação. Se persistir, adicione `%APPDATA%\npm` ao PATH do Windows.

**Logomarca não aparece após upload**
A pasta `uploads/` é criada automaticamente na primeira execução. Verifique se o usuário do Windows tem permissão de escrita na pasta do projeto. Ao fazer backup, inclua essa pasta.
