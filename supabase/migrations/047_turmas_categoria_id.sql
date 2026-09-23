-- Adicionar categoria_id na tabela turmas
ALTER TABLE turmas
  ADD COLUMN IF NOT EXISTS categoria_id uuid REFERENCES categoria_turmas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_turmas_categoria_id ON turmas(categoria_id);
