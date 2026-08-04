# Andorinha API

Backend do sistema de gestão de beneficiários. NestJS 11 + TypeORM 1.1 + MySQL.

## Rodar local

```bash
npm install
cp .env.example .env    # preencher DB_* com o banco _dev da Hostinger
npm run start:dev
```

- API: `http://localhost:3001/api/v1`
- Health: `http://localhost:3001/health`
- Docs: `http://localhost:3001/api/docs`

## Scripts

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Dev com watch |
| `npm run build` | Compila para `dist/` |
| `npm start` | Roda o build (é o que a Hostinger executa) |
| `npm test` | Testes |
| `npm run typecheck` | `tsc --noEmit` |

## Banco de dados

O MySQL usado em desenvolvimento é o **banco `_dev` remoto da Hostinger** —
mesmo host de produção, `DB_NAME` diferente. Requer o IP liberado em
hPanel › Bancos de Dados › Remote MySQL.

Descobrir o IP público atual:

```bash
curl -s ifconfig.me
```

**Migrations rodam no boot** (`DB_MIGRATIONS_RUN=true`). Isso não é preferência:
a Hostinger não permite executar o CLI do TypeORM por SSH no Web App gerenciado,
então o boot é a única janela para evoluir o schema.

Gerar uma migration nova (local, com o banco acessível):

```bash
npx typeorm-ts-node-commonjs migration:generate src/database/migrations/NomeDaMigration -d src/database/data-source.ts
```

## Deploy na Hostinger

Segundo Web App do mesmo repositório, apontando para a pasta `api`:

| Campo | Valor |
|---|---|
| Root Directory | `api` |
| Node version | 22 ou 24 |
| Entry file | `dist/main.js` |
| Build command | `npm run build` |
| Start command | `npm start` |

### Variáveis de ambiente no painel

Cadastrar tudo do `.env.example`, com estas diferenças:

- **`PORT` — não cadastrar.** A Hostinger injeta o valor dela; definir a variável
  sobrescreve e o app fica inacessível.
- `NODE_ENV=production`
- `FRONTEND_URL=https://dominio.com` (sem barra no final)
- `COOKIE_DOMAIN=.dominio.com` — com o ponto inicial, para o cookie valer no
  subdomínio da API
- `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` diferentes dos de desenvolvimento

Gerar segredo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Observações do ambiente

- Push na `main` dispara rebuild automático dos dois Web Apps (web e api)
- O build sobrescreve `/home/{user}/domains/{dominio}/nodejs` — nada gravado ali
  sobrevive. Por isso os uploads vão para o Cloudflare R2, não para disco
- Restart sem rebuild: botão **Restart** no dashboard do Web App
- Swagger fica desabilitado quando `NODE_ENV=production`
