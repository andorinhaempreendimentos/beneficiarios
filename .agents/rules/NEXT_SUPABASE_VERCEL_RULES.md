# Diretrizes Globais: Next.js (App Router) + Supabase + Vercel

## 1. Segurança & Row Level Security (RLS)
- **Privacidade por Padrão:** NUNCA expor dados administrativos ou sensíveis para o papel anônimo (`anon`).
- **Exigência de Authenticated:** Todas as políticas de `SELECT` para dados internos/administrativos devem exigir explicitamente `TO authenticated`.

## 2. SSR (Server-Side Rendering) & Repasse de Cookies
- **Propagação de Sessão:** Ao consultar o Supabase dentro de Server Components ou Server Actions no Next.js (App Router), SEMPRE utilizar o cliente de servidor (`createServerClient` de `@supabase/ssr`) repassando os cookies da requisição (`next/headers`) para que o Supabase reconheça o JWT do usuário logado durante a renderização no servidor.
- **Importação Dinâmica:** No App Router/Turbopack, importar `next/headers` de forma condicional/dinâmica para evitar erros de compilação em contextos compartilhados com Client Components.

## 3. Gerenciamento de Variáveis de Ambiente na Vercel
- **Zero Hardcode:** NUNCA utilizar fallbacks estáticos ou strings chumbadas de URLs/Chaves no código-fonte.
- **Vercel Env Vars:** Depender estritamente das variáveis de ambiente configuradas no painel da Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
