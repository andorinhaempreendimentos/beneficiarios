-- Equivalentes a aprovar()/recusar()/cancelar() do InscricoesService.
create or replace function aprovar_inscricao(p_id uuid)
returns inscricoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inscricao inscricoes;
begin
  if not has_permissao('inscricoes', 'editar') then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;

  select * into v_inscricao from inscricoes where id = p_id for update;
  if v_inscricao.id is null then
    raise exception 'Inscrição não encontrada' using errcode = 'P0002';
  end if;
  if v_inscricao.status not in ('pendente', 'reservada') then
    raise exception 'Não é possível aprovar inscrição com status "%"', v_inscricao.status using errcode = '23514';
  end if;

  update inscricoes set status = 'aprovada', expira_em = null, updated_at = now()
  where id = p_id
  returning * into v_inscricao;

  insert into beneficiario_turmas (beneficiario_id, turma_id, data_matricula)
  values (v_inscricao.beneficiario_id, v_inscricao.turma_id, current_date);

  return v_inscricao;
end;
$$;

revoke execute on function aprovar_inscricao(uuid) from anon;
grant execute on function aprovar_inscricao(uuid) to authenticated;

create or replace function recusar_inscricao(p_id uuid, p_observacoes text default null)
returns inscricoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inscricao inscricoes;
begin
  if not has_permissao('inscricoes', 'editar') then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;

  select * into v_inscricao from inscricoes where id = p_id for update;
  if v_inscricao.id is null then
    raise exception 'Inscrição não encontrada' using errcode = 'P0002';
  end if;
  if v_inscricao.status not in ('pendente', 'reservada') then
    raise exception 'Não é possível recusar inscrição com status "%"', v_inscricao.status using errcode = '23514';
  end if;

  update inscricoes
  set status = 'recusada',
      observacoes = coalesce(p_observacoes, observacoes),
      updated_at = now()
  where id = p_id
  returning * into v_inscricao;

  return v_inscricao;
end;
$$;

revoke execute on function recusar_inscricao(uuid, text) from anon;
grant execute on function recusar_inscricao(uuid, text) to authenticated;

create or replace function cancelar_inscricao(p_id uuid)
returns inscricoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inscricao inscricoes;
begin
  if not has_permissao('inscricoes', 'editar') then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;

  select * into v_inscricao from inscricoes where id = p_id for update;
  if v_inscricao.id is null then
    raise exception 'Inscrição não encontrada' using errcode = 'P0002';
  end if;
  if v_inscricao.status in ('recusada', 'expirada', 'cancelada') then
    raise exception 'Inscrição já está com status "%"', v_inscricao.status using errcode = '23514';
  end if;

  update inscricoes set status = 'cancelada', updated_at = now()
  where id = p_id
  returning * into v_inscricao;

  return v_inscricao;
end;
$$;

revoke execute on function cancelar_inscricao(uuid) from anon;
grant execute on function cancelar_inscricao(uuid) to authenticated;
