-- Migration 048: Inscrição direta no Núcleo (sem turma definida)
-- Permite que o aluno se cadastre no núcleo sem escolher turma.
-- O professor atribui a turma depois pelo painel.

-- 1. turma_id passa a ser nullable
ALTER TABLE inscricoes ALTER COLUMN turma_id DROP NOT NULL;

-- 2. Adicionar nucleo_id para rastrear qual núcleo originou a inscrição sem turma
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS nucleo_id uuid REFERENCES nucleos(id) ON DELETE SET NULL;

-- Índice para facilitar busca de inscrições sem turma por núcleo
CREATE INDEX IF NOT EXISTS idx_inscricoes_nucleo_id ON inscricoes(nucleo_id) WHERE turma_id IS NULL;

-- 3. Constraint: ao menos turma_id ou nucleo_id deve estar preenchido
ALTER TABLE inscricoes ADD CONSTRAINT inscricoes_turma_ou_nucleo_check
  CHECK (turma_id IS NOT NULL OR nucleo_id IS NOT NULL);

-- 4. Função pública para inscrição direta no núcleo (sem turma)
CREATE OR REPLACE FUNCTION public.inscrever_em_nucleo_publico(
  p_dados_beneficiario jsonb,
  p_nucleo_id uuid,
  p_observacoes text DEFAULT 'Inscrição pública no núcleo'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nucleo_existe boolean;
  v_matricula text;
  v_beneficiario_id uuid;
  v_inscricao_id uuid;
  v_sexo_raw text;
  v_sexo_val sexo_beneficiario;
  v_pcd boolean;
  v_data_nasc date;
BEGIN
  -- 1. Validar núcleo existente e em funcionamento
  SELECT EXISTS (
    SELECT 1 FROM nucleos
    WHERE id = p_nucleo_id
      AND COALESCE(em_funcionamento, true) = true
  ) INTO v_nucleo_existe;

  IF NOT v_nucleo_existe THEN
    RAISE EXCEPTION 'Núcleo não encontrado ou inativo' USING errcode = 'P0002';
  END IF;

  -- 2. Validar campos obrigatórios
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

  -- 3. Inserir Beneficiário
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
    p_nucleo_id,
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

  -- 4. Inserir inscrição sem turma (turma_id NULL)
  INSERT INTO public.inscricoes (
    nucleo_id,
    beneficiario_id,
    status,
    origem,
    observacoes
  ) VALUES (
    p_nucleo_id,
    v_beneficiario_id,
    'pendente',
    'publica',
    p_observacoes
  )
  RETURNING id INTO v_inscricao_id;

  -- 5. Retornar payload de confirmação
  RETURN jsonb_build_object(
    'sucesso', true,
    'id', v_inscricao_id,
    'inscricaoId', v_inscricao_id,
    'beneficiarioId', v_beneficiario_id,
    'nucleoId', p_nucleo_id,
    'status', 'pendente',
    'matricula', v_matricula
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.inscrever_em_nucleo_publico(jsonb, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.inscrever_em_nucleo_publico(jsonb, uuid, text) TO anon, authenticated, service_role;
