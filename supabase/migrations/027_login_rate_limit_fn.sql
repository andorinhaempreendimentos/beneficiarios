-- Checa e incrementa em uma única chamada atômica (evita race entre
-- "checar" e "registrar" em requests concorrentes do mesmo IP).
-- Retorna false se bloqueado; true e incrementa contador se liberado.
-- Bloqueio progressivo: a cada 5 tentativas seguidas sem sucesso, dobra
-- a janela de bloqueio (1min, 2min, 4min...), até um teto de 60min.
create or replace function checar_e_registrar_tentativa(p_chave text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row login_rate_limit;
  v_janela_minutos int;
begin
  select * into v_row from login_rate_limit where chave = p_chave for update;

  if v_row.chave is null then
    insert into login_rate_limit (chave, tentativas, updated_at)
    values (p_chave, 1, now());
    return true;
  end if;

  if v_row.bloqueado_until is not null and v_row.bloqueado_until > now() then
    return false;
  end if;

  -- janela de bloqueio anterior expirou — zera se passou tempo suficiente
  if v_row.bloqueado_until is not null and v_row.bloqueado_until <= now() then
    update login_rate_limit set tentativas = 1, bloqueado_until = null, updated_at = now()
    where chave = p_chave;
    return true;
  end if;

  if v_row.tentativas + 1 >= 5 then
    v_janela_minutos := least(60, power(2, floor((v_row.tentativas + 1) / 5.0))::int);
    update login_rate_limit
    set tentativas = v_row.tentativas + 1,
        bloqueado_until = now() + (v_janela_minutos || ' minutes')::interval,
        updated_at = now()
    where chave = p_chave;
    return false;
  end if;

  update login_rate_limit set tentativas = v_row.tentativas + 1, updated_at = now()
  where chave = p_chave;
  return true;
end;
$$;

-- chamado no sucesso (etapa 2 concluída) — zera o contador dessa chave.
create or replace function limpar_rate_limit(p_chave text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from login_rate_limit where chave = p_chave;
$$;

revoke execute on function checar_e_registrar_tentativa(text) from public;
revoke execute on function limpar_rate_limit(text) from public;
grant execute on function checar_e_registrar_tentativa(text) to service_role;
grant execute on function limpar_rate_limit(text) to service_role;
