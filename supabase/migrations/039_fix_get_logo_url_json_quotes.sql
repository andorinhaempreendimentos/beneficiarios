create or replace function public.get_logo_url()
returns text
language sql
stable security definer
set search_path = public
as $$
  select valor #>> '{}' from configuracoes where chave = 'logo_url' limit 1;
$$;
