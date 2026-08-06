-- Valida a seleção da grade. Aprova com hits>=2 e misses==0 (regra
-- inicial rígida, conforme especificado). O confidence_score fica
-- registrado para calibragem futura sem mudar a UX agora.
create or replace function validar_etapa1_login(p_nonce uuid, p_selecionados text[])
returns table(aprovado boolean, confidence_score numeric, hits int, misses int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desafio login_desafios;
  v_corretos text[];
  v_selecionados_upper text[];
  v_hits int;
  v_misses int;
  v_total_corretos int;
begin
  select * into v_desafio from login_desafios where login_desafios.nonce = p_nonce for update;

  if v_desafio.nonce is null or v_desafio.usado or v_desafio.expira_em < now() then
    return query select false, 0::numeric, 0, 0;
    return;
  end if;

  select array_agg(upper(x)) into v_selecionados_upper from unnest(p_selecionados) x;
  select array_agg(x::text) into v_corretos from jsonb_array_elements_text(v_desafio.badges_corretos) x;
  v_total_corretos := coalesce(array_length(v_corretos, 1), 0);

  select count(*) into v_hits from unnest(v_selecionados_upper) s where s = any(v_corretos);
  select count(*) into v_misses from unnest(v_selecionados_upper) s where not (s = any(v_corretos));

  update login_desafios
  set etapa = 2, tentativas = tentativas + 1
  where login_desafios.nonce = p_nonce;

  return query select
    (v_hits >= 2 and v_misses = 0 and v_total_corretos >= 2),
    case when v_total_corretos > 0
      then round((v_hits - v_misses)::numeric / v_total_corretos, 2)
      else 0::numeric
    end,
    v_hits,
    v_misses;
end;
$$;

revoke execute on function validar_etapa1_login(uuid, text[]) from public;
grant execute on function validar_etapa1_login(uuid, text[]) to service_role;
