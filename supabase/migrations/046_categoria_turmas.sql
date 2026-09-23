-- Tabela de categorias de turmas (faixa etária padrão do projeto)
CREATE TABLE categoria_turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(50) NOT NULL UNIQUE,
  sigla varchar(10) NOT NULL UNIQUE,
  idade_minima smallint NOT NULL,
  idade_maxima smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_categoria_idade CHECK (idade_minima <= idade_maxima)
);

-- Seed das categorias padrão (escolinhas de futebol)
INSERT INTO categoria_turmas (nome, sigla, idade_minima, idade_maxima) VALUES
  ('Sub-6',  'S6',  5,  6),
  ('Sub-8',  'S8',  7,  8),
  ('Sub-10', 'S10', 9,  10),
  ('Sub-12', 'S12', 11, 12),
  ('Sub-14', 'S14', 13, 14),
  ('Sub-16', 'S16', 15, 16),
  ('Sub-17', 'S17', 17, 17);

-- RLS
ALTER TABLE categoria_turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categoria_turmas_select" ON categoria_turmas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categoria_turmas_insert" ON categoria_turmas
  FOR INSERT TO authenticated WITH CHECK (has_permissao('categoria-turmas', 'criar'));

CREATE POLICY "categoria_turmas_update" ON categoria_turmas
  FOR UPDATE TO authenticated USING (has_permissao('categoria-turmas', 'editar'));

CREATE POLICY "categoria_turmas_delete" ON categoria_turmas
  FOR DELETE TO authenticated USING (has_permissao('categoria-turmas', 'excluir'));
