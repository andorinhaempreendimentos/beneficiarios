-- Segunda confirmação: celular (4 últimos dígitos) ou data de nascimento
-- completa. Só acessível depois de etapa1 aprovada (etapa=2 no desafio).
-- Marca o nonce como usado em qualquer caminho (sucesso ou falha) —
-- nonce é de uso único, sem replay.
create or replace function validar_etapa2_login(
  p_nonce uuid,
  p_tipo text, -- 'celular' | 'nascimento'
  p_valor text
)
returns table(aprovado boolean, beneficiario_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_desafio login_desafios;
  v_beneficiario beneficiarios;
  v_ok boolean := false;
begin
  select * into v_desafio from login_desafios where login_desafios.nonce = p_nonce for update;

  if v_desafio.nonce is null or v_desafio.usado or v_desafio.expira_em < now() or v_desafio.etapa <> 2 then
    return query select false, null::uuid;
    return;
  end if;

  if v_desafio.beneficiario_id is not null then
    select * into v_beneficiario from beneficiarios where id = v_desafio.beneficiario_id;

    if p_tipo = 'celular' then
      v_ok := right(regexp_replace(v_beneficiario.celular, '\D', '', 'g'), 4)
              = right(regexp_replace(p_valor, '\D', '', 'g'), 4);
    elsif p_tipo = 'nascimento' then
      v_ok := v_beneficiario.data_nascimento = p_valor::date;
    end if;
  end if;

  update login_desafios set usado = true where login_desafios.nonce = p_nonce;

  if v_ok then
    return query select true, v_desafio.beneficiario_id;
  else
    return query select false, null::uuid;
  end if;
end;
$$;

revoke execute on function validar_etapa2_login(uuid, text, text) from public;
grant execute on function validar_etapa2_login(uuid, text, text) to service_role;
