# SysPME — Sistema de Gestão para Oficinas Mecânicas

Sistema web desenvolvido como TCC do curso de Engenharia de Software na UNIGRAN. Feito para pequenas e médias oficinas que precisam organizar clientes, ordens de serviço e emitir orçamentos/recibos em PDF sem depender de sistemas caros ou na nuvem.

---

## Tecnologias

- **Frontend:** React 19, Tailwind CSS 4, shadcn/ui
- **Backend:** Node.js, Express 4, tRPC 11
- **Banco de dados:** MySQL 8 via Drizzle ORM
- **Autenticação:** JWT + bcrypt (sem dependências externas)
- **Build:** Vite 7, TypeScript

---

## Funcionalidades

- Cadastro e gestão de clientes
- Ordens de Serviço com fluxo de status: Orçamento → Em Atendimento → Finalizado / Cancelado
- Itens por OS (serviços e peças) com cálculo automático de totais e desconto
- Campos de veículo opcionais (placa, modelo, ano)
- Registro de deslocamento (km × valor/km)
- Forma de pagamento e observação registradas na finalização
- Geração de orçamento e recibo em PDF via impressão do navegador
- Logomarca da oficina nos documentos PDF
- Dashboard com OS abertas, receita do mês e clientes ativos
- Controle de acesso com perfil Administrador e Usuário
- Gerenciamento de usuários (criar, editar, redefinir senha, excluir)
- Atribuição de responsável por OS
- Configurações da oficina (nome, CNPJ, telefone, endereço, logomarca)
- Troca de senha pelo próprio usuário

---

## Banco de dados

| Tabela | Descrição |
|---|---|
| `local_users` | Usuários do sistema |
| `config_oficina` | Dados da oficina e logomarca |
| `clientes` | Clientes cadastrados |
| `ordens_servico` | Ordens de serviço |
| `itens_os` | Serviços e peças vinculados a cada OS |

---

## Instalação

Veja o arquivo [INSTALL.md](./INSTALL.md) para o guia completo passo a passo.

Resumo rápido:

```bash
pnpm install
cp .env.example .env   # edite com seu DATABASE_URL e JWT_SECRET
pnpm db:push
pnpm dev
```

> **Atenção:** antes de rodar `pnpm db:push`, crie o banco de dados `syspme` manualmente no MySQL (via phpMyAdmin ou linha de comando). O Drizzle cria as tabelas, mas não cria o banco.

Acesse `http://localhost:3000`. No primeiro acesso o sistema pede para criar o usuário administrador.

---

## Variáveis de ambiente

```
DATABASE_URL=mysql://root:sua_senha@localhost:3306/syspme
JWT_SECRET=qualquer-texto-longo-aqui
```

---

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Inicia em modo desenvolvimento |
| `pnpm build` | Compila para produção |
| `pnpm start` | Sobe o servidor compilado |
| `pnpm db:push` | Aplica o schema no banco |
| `pnpm db:generate` | Gera os arquivos de migração SQL |
| `pnpm test` | Roda os testes |

---

## Estrutura

```
client/src/
  pages/        ← Telas da aplicação
  components/   ← Componentes reutilizáveis
  contexts/     ← Contexto de autenticação
  lib/          ← Cliente tRPC e utilitários
server/
  routers.ts    ← API (procedures tRPC)
  db.ts         ← Consultas ao banco
  storage.ts    ← Upload de arquivos
drizzle/        ← Schema e migrações
shared/         ← Tipos e constantes compartilhados
```

---

## Licença

Projeto acadêmico — UNIGRAN, Engenharia de Software, 2026.
