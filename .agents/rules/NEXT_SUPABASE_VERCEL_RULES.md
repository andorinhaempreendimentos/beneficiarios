# Diretrizes Globais: Next.js (App Router) + Supabase + Vercel

## 1. Segurança & Row Level Security (RLS)
- **Privacidade por Padrão:** NUNCA expor dados administrativos ou sensíveis para o papel anônimo (`anon`).
- **Exigência de Authenticated:** Todas as políticas de `SELECT` para dados internos/administrativos devem exigir explicitamente `TO authenticated`.

## 2. SSR (Server-Side Rendering) & Repasse de Cookies (Detalhes + Listagens)
- **Propagação de Sessão em Todas as APIs (get e list):** Ao consultar o Supabase dentro de Server Components ou Server Actions no Next.js (App Router), **tanto as buscas por ID (`get`) quanto as listagens de opções para dropdowns e tabelas (`list`)** DEVEM utilizar o cliente de servidor (`createServerClient` de `@supabase/ssr`) repassando os cookies da requisição (`next/headers`). Sem os cookies, requisições com RLS ativo retornarão array vazio `[]`, deixando dropdowns em branco.
- **Importação Dinâmica / Tratamento Defensivo:** No App Router/Turbopack, instanciar a leitura de `cookies()` via `require('next/headers')` de forma segura para compatibilidade com contextos compartilhados entre servidor e cliente.

## 3. Gerenciamento de Variáveis de Ambiente na Vercel
- **Zero Hardcode:** NUNCA utilizar fallbacks estáticos ou strings chumbadas de URLs/Chaves no código-fonte.
- **Vercel Env Vars:** Depender estritamente das variáveis de ambiente configuradas no painel da Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
