-- Função SECURITY DEFINER para retornar logo_url sem depender de RLS
-- Necessário porque a tela de login (anon) precisa ler a logo antes de autenticar
create or replace function public.get_logo_url()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select valor::text from configuracoes where chave = 'logo_url' limit 1;
$$;

grant execute on function public.get_logo_url() to anon, authenticated;
