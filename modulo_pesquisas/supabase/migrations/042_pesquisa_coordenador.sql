-- Adicionar coordenador_id na tabela pesquisa referenciando funcionarios(id)
ALTER TABLE pesquisa ADD COLUMN IF NOT EXISTS coordenador_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL;
