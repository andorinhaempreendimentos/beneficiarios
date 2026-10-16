-- 058_bloco_horarios_grupo_opcional.sql
-- Inversão da Centralidade: a Grade de Horários pertence ao Núcleo
-- Tornar grupo_id opcional em grupo_horarios para permitir blocos de horário planejados/vagos pertencentes ao núcleo

ALTER TABLE public.grupo_horarios 
ALTER COLUMN grupo_id DROP NOT NULL;

-- Comentário explicativo na coluna
COMMENT ON COLUMN public.grupo_horarios.grupo_id IS 'Turma titular alocada no bloco de horário (opcional para permitir blocos vagos/planejados do núcleo)';
