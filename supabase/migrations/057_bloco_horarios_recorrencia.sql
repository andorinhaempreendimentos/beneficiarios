-- 057_bloco_horarios_recorrencia.sql
-- Evolução de Slots para Blocos de Horário: suporte a recorrência e enturmação conjunta

-- 1. Tornar dia_semana opcional (para blocos pontuais ou mensais com dia fixo)
ALTER TABLE public.grupo_horarios 
ALTER COLUMN dia_semana DROP NOT NULL;

-- 2. Adicionar novas colunas de recorrência e enturmação conjunta
ALTER TABLE public.grupo_horarios
ADD COLUMN IF NOT EXISTS tipo_recorrencia TEXT NOT NULL DEFAULT 'semanal' 
    CHECK (tipo_recorrencia IN ('semanal', 'mensal_dia_fixo', 'mensal_dia_semana', 'pontual')),
ADD COLUMN IF NOT EXISTS dia_mes SMALLINT 
    CHECK (dia_mes IS NULL OR (dia_mes >= 1 AND dia_mes <= 31)),
ADD COLUMN IF NOT EXISTS ordem_semana_mes SMALLINT 
    CHECK (ordem_semana_mes IS NULL OR ordem_semana_mes IN (1, 2, 3, 4, -1)),
ADD COLUMN IF NOT EXISTS ajuste_fim_de_semana TEXT DEFAULT 'manter' 
    CHECK (ajuste_fim_de_semana IS NULL OR ajuste_fim_de_semana IN ('manter', 'proximo_util', 'anterior_util')),
ADD COLUMN IF NOT EXISTS data_especifica DATE,
ADD COLUMN IF NOT EXISTS grupos_adicionais_ids UUID[] DEFAULT '{}'::uuid[];

-- 3. Índices para otimização de busca de agenda
CREATE INDEX IF NOT EXISTS idx_grupo_horarios_tipo_recorrencia 
ON public.grupo_horarios(tipo_recorrencia);

CREATE INDEX IF NOT EXISTS idx_grupo_horarios_data_especifica 
ON public.grupo_horarios(data_especifica) 
WHERE data_especifica IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grupo_horarios_grupos_adicionais 
ON public.grupo_horarios USING GIN (grupos_adicionais_ids) 
WHERE array_length(grupos_adicionais_ids, 1) > 0;

-- 4. Comentários para documentação de schema
COMMENT ON COLUMN public.grupo_horarios.tipo_recorrencia IS 'Tipo de recorrência: semanal, mensal_dia_fixo, mensal_dia_semana, pontual';
COMMENT ON COLUMN public.grupo_horarios.dia_mes IS 'Dia do mês (1 a 31) para mensal_dia_fixo';
COMMENT ON COLUMN public.grupo_horarios.ordem_semana_mes IS 'Ordem da semana no mês (1, 2, 3, 4 ou -1 para última) para mensal_dia_semana';
COMMENT ON COLUMN public.grupo_horarios.ajuste_fim_de_semana IS 'Ajuste se cair em fim de semana: manter, proximo_util, anterior_util';
COMMENT ON COLUMN public.grupo_horarios.data_especifica IS 'Data específica para agendamentos pontuais';
COMMENT ON COLUMN public.grupo_horarios.grupos_adicionais_ids IS 'Array de UUIDs de turmas parceiras integradas no mesmo bloco';
