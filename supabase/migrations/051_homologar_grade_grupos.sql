-- 051_homologar_grade_grupos.sql
-- Função agnóstica RPC para homologação de grade semanal de grupos por polo esportivo.
-- Executa com SECURITY DEFINER para garantir atomicidade e isolamento de RLS sem expor tabelas ao anon.

CREATE OR REPLACE FUNCTION public.homologar_grade_grupos(
  p_nucleo_id uuid,
  p_responsavel_id uuid,
  p_grupos jsonb,
  p_dias_selecionados jsonb,
  p_grade_horarios jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grupo_elem jsonb;
  v_horario_elem jsonb;
  v_grupo_id_orig text;
  v_identificador text;
  v_min int;
  v_max int;
  v_nome text;
  v_grupo_id uuid;
  v_map_grupos jsonb := '{}'::jsonb;
  v_dia text;
  v_dia_num smallint;
  v_inicio text;
  v_fim text;
  v_ids_json jsonb;
  v_elem_id text;
  v_resolved_id uuid;
  v_primary_grupo_id uuid;
  v_adicionais_ids uuid[];
  v_chave_config text;
  v_grupos_result jsonb := '[]'::jsonb;
BEGIN
  IF p_nucleo_id IS NULL THEN
    RAISE EXCEPTION 'ID do núcleo não informado.';
  END IF;

  -- 1. Criar ou atualizar cada grupo com base nas faixas etárias
  FOR v_grupo_elem IN SELECT * FROM jsonb_array_elements(p_grupos)
  LOOP
    v_grupo_id_orig := v_grupo_elem->>'id';
    v_identificador := COALESCE(NULLIF(TRIM(v_grupo_elem->>'identificador'), ''), 'A');
    v_min := (v_grupo_elem->>'min')::int;
    v_max := (v_grupo_elem->>'max')::int;
    v_nome := NULLIF(TRIM(COALESCE(v_grupo_elem->>'label', v_grupo_elem->>'nome', '')), '');
    IF v_nome IS NULL THEN
      v_nome := 'Turma ' || v_identificador;
    END IF;

    -- Verificar se já existe um grupo com este identificador neste núcleo
    SELECT id INTO v_grupo_id
    FROM public.grupos
    WHERE nucleo_id = p_nucleo_id
      AND identificador = v_identificador
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_grupo_id IS NOT NULL THEN
      UPDATE public.grupos
      SET nome = v_nome,
          idade_minima = v_min,
          idade_maxima = v_max,
          updated_at = NOW()
      WHERE id = v_grupo_id;
    ELSE
      INSERT INTO public.grupos (
        nome,
        identificador,
        nucleo_id,
        idade_minima,
        idade_maxima,
        vagas_totais,
        status_inicial,
        tipo,
        created_at,
        updated_at
      )
      VALUES (
        v_nome,
        v_identificador,
        p_nucleo_id,
        v_min,
        v_max,
        30,
        'aprovada'::status_inscricao,
        'regular'::tipo_turma,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_grupo_id;
    END IF;

    -- Mapear ID temporário/original para o UUID final no banco
    v_map_grupos := jsonb_set(v_map_grupos, ARRAY[v_grupo_id_orig], to_jsonb(v_grupo_id::text));

    -- Vincular responsável se fornecido
    IF p_responsavel_id IS NOT NULL THEN
      INSERT INTO public.grupo_responsaveis (grupo_id, funcionario_id, created_at, updated_at)
      VALUES (v_grupo_id, p_responsavel_id, NOW(), NOW())
      ON CONFLICT (grupo_id, funcionario_id) DO NOTHING;
    END IF;

    v_grupos_result := v_grupos_result || jsonb_build_object(
      'id', v_grupo_id,
      'identificador', v_identificador,
      'nome', v_nome,
      'min', v_min,
      'max', v_max
    );
  END LOOP;

  -- 2. Limpar horários anteriores deste núcleo
  DELETE FROM public.grupo_horarios
  WHERE nucleo_id = p_nucleo_id;

  -- 3. Inserir os novos horários da grade semanal
  FOR v_horario_elem IN SELECT * FROM jsonb_array_elements(p_grade_horarios)
  LOOP
    v_dia := LOWER(TRIM(COALESCE(v_horario_elem->>'dia', 'seg')));
    v_dia_num := CASE v_dia
      WHEN 'dom' THEN 0
      WHEN 'seg' THEN 1
      WHEN 'ter' THEN 2
      WHEN 'qua' THEN 3
      WHEN 'qui' THEN 4
      WHEN 'sex' THEN 5
      WHEN 'sab' THEN 6
      WHEN '0' THEN 0
      WHEN '1' THEN 1
      WHEN '2' THEN 2
      WHEN '3' THEN 3
      WHEN '4' THEN 4
      WHEN '5' THEN 5
      WHEN '6' THEN 6
      ELSE 1
    END;

    v_inicio := v_horario_elem->>'inicio';
    v_fim := v_horario_elem->>'fim';
    IF LENGTH(v_inicio) = 5 THEN v_inicio := v_inicio || ':00'; END IF;
    IF LENGTH(v_fim) = 5 THEN v_fim := v_fim || ':00'; END IF;

    -- Extrair turmasIds / gruposIds
    v_ids_json := COALESCE(v_horario_elem->'turmasIds', v_horario_elem->'gruposIds', '[]'::jsonb);
    v_primary_grupo_id := NULL;
    v_adicionais_ids := '{}'::uuid[];

    FOR v_elem_id IN SELECT jsonb_array_elements_text(v_ids_json)
    LOOP
      v_resolved_id := (v_map_grupos->>v_elem_id)::uuid;
      -- Se não estava no mapa, tenta usar o próprio UUID se for válido
      IF v_resolved_id IS NULL AND v_elem_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_resolved_id := v_elem_id::uuid;
      END IF;

      IF v_resolved_id IS NOT NULL THEN
        IF v_primary_grupo_id IS NULL THEN
          v_primary_grupo_id := v_resolved_id;
        ELSE
          v_adicionais_ids := array_append(v_adicionais_ids, v_resolved_id);
        END IF;
      END IF;
    END LOOP;

    IF v_primary_grupo_id IS NOT NULL THEN
      INSERT INTO public.grupo_horarios (
        nucleo_id,
        grupo_id,
        grupos_adicionais_ids,
        responsavel_id,
        dia_semana,
        hora_inicio,
        hora_fim,
        tipo_recorrencia,
        created_at,
        updated_at
      )
      VALUES (
        p_nucleo_id,
        v_primary_grupo_id,
        CASE WHEN array_length(v_adicionais_ids, 1) > 0 THEN v_adicionais_ids ELSE NULL END,
        p_responsavel_id,
        v_dia_num,
        v_inicio::time,
        v_fim::time,
        'semanal',
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;

  -- 4. Registrar a homologação oficial na tabela configuracoes
  v_chave_config := 'grade_homologada_' || p_nucleo_id::text;

  INSERT INTO public.configuracoes (chave, valor, updated_at)
  VALUES (
    v_chave_config,
    jsonb_build_object(
      'homologado', true,
      'homologado_em', NOW(),
      'responsavel_id', p_responsavel_id,
      'dias_selecionados', p_dias_selecionados
    ),
    NOW()
  )
  ON CONFLICT (chave) DO UPDATE
  SET valor = EXCLUDED.valor,
      updated_at = NOW();

  RETURN jsonb_build_object(
    'sucesso', true,
    'nucleo_id', p_nucleo_id,
    'grupos', v_grupos_result
  );
END;
$$;
