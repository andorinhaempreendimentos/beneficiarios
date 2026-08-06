-- Monta a grade da etapa 1. Grid fixo de 8 badges: se o beneficiário existe,
-- 2 corretas (mesmos tokens usados para gerar usuario_login) + 6 distratoras;
-- se não existe, 8 distratoras e zero corretas — grade sempre "cheia" e
-- indistinguível visualmente, então não dá pra enumerar logins válidos
-- observando o tamanho/composição da grade.
create or replace function gerar_desafio_login(
  p_usuario_login text,
  p_ip inet default null,
  p_user_agent text default null
)
returns table(nonce uuid, badges text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  v_beneficiario beneficiarios;
  v_corretos text[] := array[]::text[];
  v_distratores text[];
  v_badges text[];
  v_nonce uuid;
begin
  select * into v_beneficiario
  from beneficiarios
  where beneficiarios.usuario_login = p_usuario_login and deleted_at is null;

  if v_beneficiario.id is not null and array_length(v_beneficiario.nome_tokens, 1) >= 2 then
    v_corretos := array[v_beneficiario.nome_tokens[1], v_beneficiario.nome_tokens[2]];
  end if;

  select array_agg(d.token) into v_distratores
  from (
    select token from login_distratores
    where token <> all(v_corretos)
    order by random()
    limit (8 - coalesce(array_length(v_corretos, 1), 0))
  ) d;

  select array_agg(upper(x) order by random()) into v_badges
  from unnest(array_cat(v_corretos, v_distratores)) x;

  insert into login_desafios (beneficiario_id, badges, badges_corretos, ip, user_agent)
  values (
    v_beneficiario.id,
    to_jsonb(v_badges),
    to_jsonb((select array_agg(upper(c)) from unnest(v_corretos) c)),
    p_ip,
    p_user_agent
  )
  returning login_desafios.nonce into v_nonce;

  return query select v_nonce, v_badges;
end;
$$;

revoke execute on function gerar_desafio_login(text, inet, text) from public;
grant execute on function gerar_desafio_login(text, inet, text) to service_role;
