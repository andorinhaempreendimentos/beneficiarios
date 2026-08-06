# Regras e Arquitetura do Projeto Andorinha

## Autenticação & RLS (Row Level Security)
1. **Dados Administrativos:** NUNCA expor dados administrativos a usuários anônimos (`anon`).
2. **Segurança de Acesso:** Toda consulta a dados sensíveis (beneficiários, funcionários, turmas, núcleos, etc.) exige a role `authenticated`.
3. **Redirecionamento:** O middleware (`proxy.ts`) bloqueia acessos não autenticados enviando para `/login`.

## Práticas de SSR & Supabase
1. **Cookies no Servidor:** Em Server Components do Next.js (App Router), o cliente Supabase em `services.ts` DEVE utilizar `createServerClient` do `@supabase/ssr` com a leitura dinâmica de cookies (`require('next/headers')`) para transmitir a sessão do usuário autenticado no servidor.
2. **Variáveis de Ambiente Vercel:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   As variáveis devem ser lidas exclusivamente do ambiente (Vercel / `.env.local`), evitando fallbacks hardcoded no código.
