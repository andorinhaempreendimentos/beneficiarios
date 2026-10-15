-- 1. Adicionar colunas de núcleo e turma na tabela pesquisa
ALTER TABLE pesquisa 
  ADD COLUMN IF NOT EXISTS nucleo_id UUID REFERENCES nucleos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL;

-- 2. Adicionar colunas de rastreamento do beneficiário e snapshot na tabela resposta
ALTER TABLE resposta 
  ADD COLUMN IF NOT EXISTS beneficiario_id UUID REFERENCES beneficiarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS matricula TEXT,
  ADD COLUMN IF NOT EXISTS nucleo_id UUID REFERENCES nucleos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL;

-- 3. Índices para agilizar buscas por matrícula e turma
CREATE INDEX IF NOT EXISTS idx_pesquisa_turma_id ON pesquisa(turma_id);
CREATE INDEX IF NOT EXISTS idx_pesquisa_nucleo_id ON pesquisa(nucleo_id);
CREATE INDEX IF NOT EXISTS idx_resposta_matricula ON resposta(pesquisa_id, matricula);
CREATE INDEX IF NOT EXISTS idx_resposta_beneficiario ON resposta(beneficiario_id);
