-- ==============================================================================
-- Migração 053: Vocabulário Dinâmico em Objetos e Vínculo de Usuário ao Objeto
-- ==============================================================================

-- 1. Adicionar colunas de vocabulário na tabela objetos
ALTER TABLE public.objetos
  ADD COLUMN IF NOT EXISTS termo_grupo VARCHAR(50) DEFAULT 'Grupo',
  ADD COLUMN IF NOT EXISTS termo_sessao VARCHAR(50) DEFAULT 'Sessão',
  ADD COLUMN IF NOT EXISTS termo_responsavel VARCHAR(50) DEFAULT 'Professor',
  ADD COLUMN IF NOT EXISTS termo_participante VARCHAR(50) DEFAULT 'Beneficiário';

-- 2. Adicionar coluna objeto_id na tabela usuarios para restringir escopo institucional
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS objeto_id UUID REFERENCES public.objetos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_objeto_id ON public.usuarios(objeto_id);

-- 3. Preencher valores padrão para objetos existentes
UPDATE public.objetos
SET
  termo_grupo = COALESCE(termo_grupo, 'Grupo'),
  termo_sessao = COALESCE(termo_sessao, 'Sessão'),
  termo_responsavel = COALESCE(termo_responsavel, 'Professor'),
  termo_participante = COALESCE(termo_participante, 'Beneficiário')
WHERE termo_grupo IS NULL
   OR termo_sessao IS NULL
   OR termo_responsavel IS NULL
   OR termo_participante IS NULL;

-- 4. Customização específica para o projeto existente de Escolinhas de Futebol de Palmas
UPDATE public.objetos
SET
  termo_grupo = 'Turma',
  termo_sessao = 'Treino',
  termo_responsavel = 'Professor',
  termo_participante = 'Aluno'
WHERE id = '7ded20a0-cdcc-4c8e-a666-0b3bbf399e57';
