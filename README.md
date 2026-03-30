# Modas

Loja em `Next.js` com painel admin, `Prisma` e suporte a `PostgreSQL`.

## Stack

- `Next.js 15`
- `React 19`
- `Prisma 7`
- `PostgreSQL`
- `Vercel`

## Requisitos

- `Node.js 20+`
- `npm`

## Instalação local

```bash
npm install
```

Crie um `.env.local` com as variáveis necessárias.

## Variáveis de ambiente

Obrigatórias para login admin:

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

Obrigatória para persistência real com banco:

```env
DATABASE_URL=
```

Opcionais para envio real de e-mail no formulário:

```env
RESEND_API_KEY=
CONTACT_EMAIL_FROM=
CONTACT_EMAIL_TO=
```

Observações:

- Sem `DATABASE_URL`, o projeto usa os arquivos em `data/*.json` como fallback local.
- Sem `RESEND_API_KEY` e `CONTACT_EMAIL_FROM`, o formulário retorna fallback para `mailto`.
- Em produção na Vercel, o preset do projeto está fixado em `Next.js` também por `vercel.json`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run db:generate
npm run db:push
npm run db:seed
```

## Banco de dados

Aplicar schema:

```bash
npm run db:push
```

Popular dados iniciais:

```bash
npm run db:seed
```

## Deploy

Produção usa `Vercel`.

Com a CLI:

```bash
vercel
vercel --prod
```

Antes do deploy, confirme que as envs de produção estão configuradas no projeto da Vercel.
