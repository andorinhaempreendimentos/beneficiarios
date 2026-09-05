-- Migration 023: Consulta Pública Segura de Comprovante de Inscrição
-- Permite consultar dados do comprovante usando o ID da inscrição sem expor tabelas privadas.

CREATE OR REPLACE FUNCTION public.consultar_inscricao_publica(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', i.id,
    'status', i.status,
    'protocolo', b.matricula,
    'data_inscricao', i.created_at,
    'expira_em', i.expira_em,
    'beneficiario_nome', b.nome_completo,
    'turma_nome', t.nome,
    'atividade_nome', a.nome,
    'nucleo_nome', n.identificacao,
    'nucleo_cidade', n.cidade,
    'nucleo_endereco', COALESCE(n.endereco, '') || CASE WHEN n.numero IS NOT NULL AND n.numero <> '' THEN ', ' || n.numero ELSE '' END || CASE WHEN n.bairro IS NOT NULL AND n.bairro <> '' THEN ' - ' || n.bairro ELSE '' END
  ) INTO v_res
  FROM inscricoes i
  JOIN beneficiarios b ON b.id = i.beneficiario_id
  JOIN turmas t ON t.id = i.turma_id
  LEFT JOIN atividades a ON a.id = t.atividade_id
  LEFT JOIN nucleos n ON n.id = t.nucleo_id
  WHERE i.id = p_id;

  RETURN v_res;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consultar_inscricao_publica(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.consultar_inscricao_publica(uuid) TO anon, authenticated, service_role;
