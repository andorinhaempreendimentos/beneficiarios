-- Equivalente a InscricoesService.inscrever() — lock pessimista na turma,
-- conta ocupação (matriculados + reservas ativas) e decide status conforme
-- tipo_aprovacao da atividade. security definer replica o acesso irrestrito
-- que o TypeORM tem hoje (sem RLS); o has_permissao() no topo replica o
-- @Permissao('inscricoes','criar') do controller.
create or replace function criar_inscricao(
  p_turma_id uuid,
  p_beneficiario_id uuid,
  p_observacoes text default null,
  p_respostas jsonb default null
)
returns inscricoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vagas_totais smallint;
  v_tipo_aprovacao tipo_aprovacao;
  v_ocupadas int;
  v_reservadas int;
  v_automatica boolean;
  v_status status_inscricao;
  v_expira_em timestamptz;
  v_inscricao inscricoes;
begin
  if not has_permissao('inscricoes', 'criar') then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;

  select t.vagas_totais, a.tipo_aprovacao
    into v_vagas_totais, v_tipo_aprovacao
  from turmas t
  join atividades a on a.id = t.atividade_id
  where t.id = p_turma_id
  for update of t;

  if v_vagas_totais is null then
    raise exception 'Turma não encontrada' using errcode = 'P0002';
  end if;

  select count(*) into v_ocupadas
  from beneficiario_turmas
  where turma_id = p_turma_id and status = 'ativo';

  select count(*) into v_reservadas
  from inscricoes
  where turma_id = p_turma_id and status in ('pendente', 'reservada');

  if v_ocupadas + v_reservadas >= v_vagas_totais then
    raise exception 'Sem vagas disponíveis nesta turma' using errcode = '23514';
  end if;

  v_automatica := v_tipo_aprovacao = 'automatica';
  v_status := case when v_automatica then 'aprovada' else 'pendente' end;
  v_expira_em := case when v_automatica then null else now() + interval '2880 minutes' end;

  insert into inscricoes (turma_id, beneficiario_id, status, expira_em, observacoes, respostas_formulario)
  values (p_turma_id, p_beneficiario_id, v_status, v_expira_em, p_observacoes, p_respostas)
  returning * into v_inscricao;

  if v_automatica then
    insert into beneficiario_turmas (beneficiario_id, turma_id, data_matricula)
    values (p_beneficiario_id, p_turma_id, current_date);
  end if;

  return v_inscricao;
end;
$$;

revoke execute on function criar_inscricao(uuid, uuid, text, jsonb) from anon;
grant execute on function criar_inscricao(uuid, uuid, text, jsonb) to authenticated;
