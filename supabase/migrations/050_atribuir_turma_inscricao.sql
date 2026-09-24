-- Migration 050: RPC atribuir_turma_inscricao
-- Permite que professores (funcionários autenticados) atribuam turma a inscrições sem turma,
-- sem precisar da permissão genérica 'beneficiarios → editar'.

CREATE OR REPLACE FUNCTION public.atribuir_turma_inscricao(
  p_inscricao_id uuid,
  p_turma_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_beneficiario_id uuid;
  v_vagas_totais    integer;
  v_vagas_ocupadas  integer;
BEGIN
  -- Apenas funcionários autenticados (entidade_id presente no JWT)
  IF (auth.jwt() -> 'app_metadata' ->> 'entidade_id') IS NULL THEN
    RAISE EXCEPTION 'Sem permissão para atribuir turma.';
  END IF;

  -- Busca beneficiário da inscrição
  SELECT beneficiario_id INTO v_beneficiario_id
  FROM inscricoes
  WHERE id = p_inscricao_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inscrição não encontrada.';
  END IF;

  -- Verifica vagas disponíveis na turma
  SELECT vagas_totais INTO v_vagas_totais
  FROM turmas
  WHERE id = p_turma_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada.';
  END IF;

  SELECT count(*) INTO v_vagas_ocupadas
  FROM beneficiario_turmas
  WHERE turma_id = p_turma_id AND status = 'ativo';

  IF v_vagas_totais IS NOT NULL AND v_vagas_ocupadas >= v_vagas_totais THEN
    RAISE EXCEPTION 'Turma sem vagas disponíveis.';
  END IF;

  -- Atualiza a inscrição
  UPDATE inscricoes
  SET turma_id = p_turma_id,
      status   = 'aprovada'
  WHERE id = p_inscricao_id;

  -- Cria ou reativa o vínculo na turma
  INSERT INTO beneficiario_turmas (beneficiario_id, turma_id, status, data_matricula)
  VALUES (v_beneficiario_id, p_turma_id, 'ativo', current_date)
  ON CONFLICT (beneficiario_id, turma_id) DO UPDATE
    SET status        = 'ativo',
        data_matricula = current_date,
        data_evasao   = NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.atribuir_turma_inscricao(uuid, uuid) FROM public;
GRANT  EXECUTE ON FUNCTION public.atribuir_turma_inscricao(uuid, uuid) TO authenticated;
