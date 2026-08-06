create extension if not exists unaccent schema public;

alter table beneficiarios
  add column usuario_login varchar(150) unique,
  add column nome_tokens text[];

comment on column beneficiarios.usuario_login is 'gerado automaticamente: 2 primeiros nomes normalizados separados por ponto (ex: pedro.cardoso)';
comment on column beneficiarios.nome_tokens is 'nomes normalizados (lowercase, sem acento, sem partículas) usados na grade de login';

-- normaliza: lowercase + remove acento. Base de tudo que segue.
create or replace function normalizar_nome(p_texto text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(unaccent(trim(p_texto)));
$$;

-- separa nome completo em tokens normalizados, removendo partículas comuns
-- (de/da/do/dos/das/e) que não ajudam a identificar a pessoa e só
-- confundiriam a grade de login.
create or replace function extrair_tokens(p_nome_completo text)
returns text[]
language sql
immutable
set search_path = public
as $$
  select array_agg(t order by ordinality)
  from unnest(string_to_array(normalizar_nome(p_nome_completo), ' ')) with ordinality as u(t, ordinality)
  where t <> '' and t not in ('de', 'da', 'do', 'dos', 'das', 'e');
$$;

-- valida a regra de cadastro: exige nome + sobrenome (mínimo 2 tokens após
-- remover partículas). "Pedro" falha, "Pedro Cardoso" passa.
create or replace function validar_nome_completo(p_nome_completo text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(array_length(extrair_tokens(p_nome_completo), 1), 0) >= 2;
$$;

-- gera "primeironome.segundonome" a partir dos 2 primeiros tokens
-- (pós-remoção de partículas). Resolve colisão com sufixo numérico
-- incremental (pedro.cardoso, pedro.cardoso2, pedro.cardoso3...).
create or replace function gerar_usuario_login(p_nome_completo text, p_excluir_id uuid default null)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_tokens text[];
  v_base text;
  v_candidato text;
  v_sufixo int := 1;
begin
  v_tokens := extrair_tokens(p_nome_completo);
  if coalesce(array_length(v_tokens, 1), 0) < 2 then
    raise exception 'Nome completo deve ter nome e sobrenome' using errcode = '23514';
  end if;

  v_base := v_tokens[1] || '.' || v_tokens[2];
  v_candidato := v_base;

  while exists (
    select 1 from beneficiarios
    where usuario_login = v_candidato and (p_excluir_id is null or id <> p_excluir_id)
  ) loop
    v_sufixo := v_sufixo + 1;
    v_candidato := v_base || v_sufixo::text;
  end loop;

  return v_candidato;
end;
$$;
