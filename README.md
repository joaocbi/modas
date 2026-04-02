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

Obrigatórias para checkout Mercado Pago direto:

```env
MERCADO_PAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_WEBHOOK_SECRET=
```

Observações:

- Sem `DATABASE_URL`, o projeto usa os arquivos em `data/*.json` como fallback local.
- Sem `RESEND_API_KEY` e `CONTACT_EMAIL_FROM`, o formulário retorna fallback para `mailto`.
- Sem `MERCADO_PAGO_ACCESS_TOKEN`, o checkout direto com `Pix` e `cartão` fica desativado.
- Sem `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, o checkout com cartão fica desativado, mas `Pix` ainda pode funcionar se o token estiver presente.
- `MERCADO_PAGO_WEBHOOK_SECRET` é opcional, mas recomendado para validar a assinatura do webhook do Mercado Pago.
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

## Mercado Pago

O checkout direto foi integrado na página `carrinho` com:

- `Pix` gerando QR code e código copia e cola
- `cartão` com tokenização segura via `MercadoPago.js`
- `webhook` em `/api/payments/mercado-pago/webhook`

Fluxo:

1. Cliente adiciona produtos ao carrinho
2. Frontend envia o pedido para `/api/payments/mercado-pago/payment`
3. Backend cria o pedido interno e o pagamento no Mercado Pago
4. Webhook atualiza o status final do pedido
