-- 055_cargos_rh_objeto_id.sql
-- Adiciona funcao_id em objeto_cargos_previstos, cadastra funções faltantes no RH e vincula por ID

-- 1. Adicionar coluna funcao_id e índice em objeto_cargos_previstos
ALTER TABLE public.objeto_cargos_previstos 
ADD COLUMN IF NOT EXISTS funcao_id UUID REFERENCES public.funcoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_objeto_cargos_previstos_funcao_id 
ON public.objeto_cargos_previstos(funcao_id);

-- 2. Adequar a função Staff para Auxiliar Administrativo
UPDATE public.funcoes 
SET nome = 'Auxiliar Administrativo',
    descricao = 'Apoio administrativo, secretaria, atendimento e controle operacional da parceria'
WHERE nome = 'Staff';

-- Sincronizar o texto descritivo nos funcionários vinculados
UPDATE public.funcionarios 
SET funcao = 'Auxiliar Administrativo'
WHERE funcao = 'Staff' OR funcao_id IN (SELECT id FROM public.funcoes WHERE nome = 'Auxiliar Administrativo');

-- 3. Cadastrar as funções de gestão faltantes no RH (caso não existam)
INSERT INTO public.funcoes (nome, descricao, permite_login, perfil_id, exige_conselho, tipo_alocacao)
SELECT 'Coordenador Geral', 'Coordenação geral do projeto, interlocução institucional e gestão de equipes', true, '7f9706e8-d9f9-4953-9e1f-e0f7e87b25e3', false, 'gestao_projeto'
WHERE NOT EXISTS (SELECT 1 FROM public.funcoes WHERE nome = 'Coordenador Geral' AND deleted_at IS NULL);

INSERT INTO public.funcoes (nome, descricao, permite_login, perfil_id, exige_conselho, tipo_alocacao)
SELECT 'Coordenador de Logística', 'Gestão de materiais esportivos, infraestrutura de polos e apoio operacional', true, '048f6061-1aed-45b5-8bee-fa4f8547f95f', false, 'operacional_nucleo'
WHERE NOT EXISTS (SELECT 1 FROM public.funcoes WHERE nome = 'Coordenador de Logística' AND deleted_at IS NULL);

INSERT INTO public.funcoes (nome, descricao, permite_login, perfil_id, exige_conselho, tipo_alocacao)
SELECT 'Supervisor de Campo', 'Supervisão técnica presencial, acompanhamento de instrutores e verificação de turmas', true, '7f9706e8-d9f9-4953-9e1f-e0f7e87b25e3', false, 'operacional_nucleo'
WHERE NOT EXISTS (SELECT 1 FROM public.funcoes WHERE nome = 'Supervisor de Campo' AND deleted_at IS NULL);

-- 4. Vincular registros existentes em objeto_cargos_previstos aos respectivos IDs de funções
DO $$
DECLARE
    id_prof UUID;
    id_coord_geral UUID;
    id_coord_log UUID;
    id_sup UUID;
    id_aux UUID;
BEGIN
    SELECT id INTO id_prof FROM public.funcoes WHERE nome = 'Professor / Instrutor' AND deleted_at IS NULL LIMIT 1;
    SELECT id INTO id_coord_geral FROM public.funcoes WHERE nome = 'Coordenador Geral' AND deleted_at IS NULL LIMIT 1;
    SELECT id INTO id_coord_log FROM public.funcoes WHERE nome = 'Coordenador de Logística' AND deleted_at IS NULL LIMIT 1;
    SELECT id INTO id_sup FROM public.funcoes WHERE nome = 'Supervisor de Campo' AND deleted_at IS NULL LIMIT 1;
    SELECT id INTO id_aux FROM public.funcoes WHERE nome = 'Auxiliar Administrativo' AND deleted_at IS NULL LIMIT 1;

    -- Instrutor Esportivo -> Professor / Instrutor
    IF id_prof IS NOT NULL THEN
        UPDATE public.objeto_cargos_previstos 
        SET funcao_id = id_prof 
        WHERE (LOWER(cargo_nome) LIKE '%instrutor%' OR LOWER(cargo_nome) LIKE '%professor%') AND funcao_id IS NULL;
    END IF;

    -- Coordenador Geral
    IF id_coord_geral IS NOT NULL THEN
        UPDATE public.objeto_cargos_previstos 
        SET funcao_id = id_coord_geral 
        WHERE LOWER(cargo_nome) LIKE '%coordenador geral%' AND funcao_id IS NULL;
    END IF;

    -- Supervisor de Campo
    IF id_sup IS NOT NULL THEN
        UPDATE public.objeto_cargos_previstos 
        SET funcao_id = id_sup 
        WHERE LOWER(cargo_nome) LIKE '%supervisor%' AND funcao_id IS NULL;
    END IF;

    -- Articulador Social / Auxiliar Administrativo
    IF id_aux IS NOT NULL THEN
        UPDATE public.objeto_cargos_previstos 
        SET funcao_id = id_aux,
            cargo_nome = 'Auxiliar Administrativo'
        WHERE (LOWER(cargo_nome) LIKE '%articulador%' OR LOWER(cargo_nome) LIKE '%auxiliar%') AND funcao_id IS NULL;
    END IF;

    -- Inserir Coordenador de Logística no objeto principal se não constar
    IF id_coord_log IS NOT NULL THEN
        INSERT INTO public.objeto_cargos_previstos (objeto_id, cargo_nome, funcao_id, quantidade_prevista, remuneracao_mensal, carga_horaria_semanal)
        SELECT o.id, 'Coordenador de Logística', id_coord_log, 2, 4000.00, '40h/sem'
        FROM public.objetos o
        WHERE o.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM public.objeto_cargos_previstos cp 
              WHERE cp.objeto_id = o.id AND (cp.funcao_id = id_coord_log OR LOWER(cp.cargo_nome) LIKE '%logística%')
          );
    END IF;
END $$;
