-- Migration 022: Inscrição Pública Atômica e Segura
-- Permite que usuários anônimos (públicos) cadastrem pré-inscrição de beneficiário
-- e vinculem à turma de forma transacional e atômica, sem expor leitura pública da tabela beneficiarios.

CREATE OR REPLACE FUNCTION public.inscrever_beneficiario_publico(
  p_dados_beneficiario jsonb,
  p_turma_id uuid,
  p_observacoes text DEFAULT 'Inscrição pública online',
  p_respostas jsonb DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vagas_totais smallint;
  v_permitir_fila boolean;
  v_tipo_aprovacao tipo_aprovacao;
  v_status_inicial status_inscricao;
  v_nucleo_id uuid;
  v_ocupadas int;
  v_reservadas int;
  v_status status_inscricao;
  v_expira_em timestamptz;
  v_matricula text;
  v_beneficiario_id uuid;
  v_inscricao_id uuid;
  v_sexo_raw text;
  v_sexo_val sexo_beneficiario;
  v_pcd boolean;
  v_data_nasc date;
BEGIN
  -- 1. Validar turma existente e travar para contagem concorrente
  SELECT 
    t.nucleo_id,
    t.vagas_totais, 
    COALESCE(t.permitir_fila_espera, true), 
    COALESCE(a.tipo_aprovacao, 'manual'::tipo_aprovacao), 
    COALESCE(t.status_inicial, 'pendente'::status_inscricao)
  INTO 
    v_nucleo_id,
    v_vagas_totais, 
    v_permitir_fila, 
    v_tipo_aprovacao, 
    v_status_inicial
  FROM turmas t
  LEFT JOIN atividades a ON a.id = t.atividade_id
  WHERE t.id = p_turma_id
  FOR UPDATE OF t;

  IF v_vagas_totais IS NULL THEN
    RAISE EXCEPTION 'Turma não encontrada' USING errcode = 'P0002';
  END IF;

  -- 2. Validar campos obrigatórios do beneficiário
  IF p_dados_beneficiario->>'nomeCompleto' IS NULL OR trim(p_dados_beneficiario->>'nomeCompleto') = '' THEN
    RAISE EXCEPTION 'Nome completo do beneficiário é obrigatório' USING errcode = '23514';
  END IF;

  IF p_dados_beneficiario->>'dataNascimento' IS NULL OR trim(p_dados_beneficiario->>'dataNascimento') = '' THEN
    RAISE EXCEPTION 'Data de nascimento é obrigatória' USING errcode = '23514';
  END IF;

  v_data_nasc := (p_dados_beneficiario->>'dataNascimento')::date;

  -- Normalizar Sexo
  v_sexo_raw := lower(COALESCE(p_dados_beneficiario->>'sexo', 'n'));
  IF v_sexo_raw IN ('m', 'masculino') THEN
    v_sexo_val := 'M'::sexo_beneficiario;
  ELSIF v_sexo_raw IN ('f', 'feminino') THEN
    v_sexo_val := 'F'::sexo_beneficiario;
  ELSIF v_sexo_raw IN ('o', 'outro', 'outros') THEN
    v_sexo_val := 'O'::sexo_beneficiario;
  ELSE
    v_sexo_val := 'N'::sexo_beneficiario;
  END IF;

  v_pcd := COALESCE((p_dados_beneficiario->>'pcd')::boolean, false);
  v_matricula := COALESCE(nullif(trim(p_dados_beneficiario->>'matricula'), ''), (floor(100000 + random() * 900000))::text);

  -- 3. Inserir Beneficiário com privilégios elevados da RPC
  INSERT INTO public.beneficiarios (
    matricula,
    nome_completo,
    nome_social,
    data_nascimento,
    sexo,
    pcd,
    tipo_pcd,
    nucleo_id,
    status,
    tipo_matricula,
    origem,
    celular,
    email,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    cpf,
    rg,
    raca,
    nome_responsavel,
    celular_responsavel,
    cpf_responsavel,
    email_responsavel,
    nome_escola,
    rede_ensino,
    turno_escolar,
    tamanho_uniforme
  ) VALUES (
    v_matricula,
    trim(p_dados_beneficiario->>'nomeCompleto'),
    nullif(trim(p_dados_beneficiario->>'nomeSocial'), ''),
    v_data_nasc,
    v_sexo_val,
    v_pcd,
    nullif(trim(p_dados_beneficiario->>'tipoPcd'), ''),
    COALESCE(nullif(p_dados_beneficiario->>'nucleoId', '')::uuid, v_nucleo_id),
    'pendente',
    'online',
    'publica',
    nullif(trim(p_dados_beneficiario->>'celular'), ''),
    nullif(trim(p_dados_beneficiario->>'email'), ''),
    nullif(trim(p_dados_beneficiario->>'cep'), ''),
    nullif(trim(p_dados_beneficiario->>'logradouro'), ''),
    nullif(trim(p_dados_beneficiario->>'numero'), ''),
    nullif(trim(p_dados_beneficiario->>'complemento'), ''),
    nullif(trim(p_dados_beneficiario->>'bairro'), ''),
    COALESCE(nullif(trim(p_dados_beneficiario->>'cidade'), ''), 'Palmas'),
    COALESCE(nullif(trim(p_dados_beneficiario->>'estado'), ''), 'TO'),
    nullif(trim(p_dados_beneficiario->>'cpf'), ''),
    nullif(trim(p_dados_beneficiario->>'rg'), ''),
    nullif(trim(p_dados_beneficiario->>'raca'), ''),
    nullif(trim(p_dados_beneficiario->>'nomeResponsavel'), ''),
    COALESCE(nullif(trim(p_dados_beneficiario->>'celularResponsavel'), ''), nullif(trim(p_dados_beneficiario->>'whatsappResponsavel'), '')),
    nullif(trim(p_dados_beneficiario->>'cpfResponsavel'), ''),
    nullif(trim(p_dados_beneficiario->>'emailResponsavel'), ''),
    nullif(trim(p_dados_beneficiario->>'nomeEscola'), ''),
    nullif(trim(p_dados_beneficiario->>'redeEnsino'), ''),
    nullif(trim(p_dados_beneficiario->>'turnoEscolar'), ''),
    nullif(trim(p_dados_beneficiario->>'tamanhoCamisa'), '')
  )
  RETURNING id INTO v_beneficiario_id;

  -- 4. Avaliar vagas e status da inscrição
  SELECT count(*) INTO v_ocupadas
  FROM beneficiario_turmas
  WHERE turma_id = p_turma_id AND status = 'ativo';

  SELECT count(*) INTO v_reservadas
  FROM inscricoes
  WHERE turma_id = p_turma_id AND status IN ('pendente', 'reservada');

  IF v_ocupadas + v_reservadas >= v_vagas_totais THEN
    IF v_permitir_fila THEN
      v_status := 'reservada'::status_inscricao;
    ELSE
      RAISE EXCEPTION 'Vagas esgotadas para esta turma e a Fila de Espera está desativada.' USING errcode = 'P0003';
    END IF;
  ELSE
    IF v_tipo_aprovacao = 'automatica' THEN
      v_status := 'aprovada'::status_inscricao;
    ELSE
      v_status := v_status_inicial;
    END IF;
  END IF;

  v_expira_em := CASE WHEN v_status = 'aprovada' THEN NULL ELSE now() + interval '2880 minutes' END;

  -- 5. Inserir registro na tabela inscricoes
  INSERT INTO public.inscricoes (
    turma_id,
    beneficiario_id,
    status,
    origem,
    expira_em,
    observacoes,
    respostas_formulario
  ) VALUES (
    p_turma_id,
    v_beneficiario_id,
    v_status,
    'publica',
    v_expira_em,
    p_observacoes,
    p_respostas
  )
  RETURNING id INTO v_inscricao_id;

  -- 6. Se aprovada automaticamente, vincular à turma
  IF v_status = 'aprovada' THEN
    INSERT INTO public.beneficiario_turmas (beneficiario_id, turma_id, data_matricula, status)
    VALUES (v_beneficiario_id, p_turma_id, current_date, 'ativo')
    ON CONFLICT (beneficiario_id, turma_id) DO UPDATE SET status = 'ativo';
  END IF;

  -- 7. Registrar respostas do PAR-Q se fornecidas
  IF p_respostas IS NOT NULL AND p_respostas->'parQ' IS NOT NULL THEN
    INSERT INTO public.beneficiario_parq (beneficiario_id, respostas, data_resposta)
    VALUES (v_beneficiario_id, p_respostas->'parQ', current_date);
  END IF;

  -- 8. Retornar payload de confirmação para o frontend
  RETURN jsonb_build_object(
    'sucesso', true,
    'id', v_inscricao_id,
    'inscricaoId', v_inscricao_id,
    'beneficiarioId', v_beneficiario_id,
    'turmaId', p_turma_id,
    'status', v_status,
    'matricula', v_matricula
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.inscrever_beneficiario_publico(jsonb, uuid, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.inscrever_beneficiario_publico(jsonb, uuid, text, jsonb) TO anon, authenticated, service_role;
