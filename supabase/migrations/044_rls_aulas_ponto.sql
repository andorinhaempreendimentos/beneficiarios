-- Migration: Endurecer RLS de execucoes_aula, beneficiario_presencas, registros_ponto
-- Criar módulos de permissão: aulas, ponto, comprovacoes

-- 1. Permissões para módulos novos (Admin, Professor, Coordenador)
INSERT INTO perfil_permissoes (perfil_id, modulo, acao, permitido) VALUES
  -- Admin (50572642...)
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'aulas', 'visualizar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'aulas', 'criar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'aulas', 'editar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'aulas', 'excluir', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'ponto', 'visualizar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'ponto', 'criar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'ponto', 'editar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'comprovacoes', 'visualizar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'comprovacoes', 'criar', true),
  -- Professor (b9def33a...)
  ('b9def33a-a2a0-477d-8580-ec213d642808', 'aulas', 'visualizar', true),
  ('b9def33a-a2a0-477d-8580-ec213d642808', 'aulas', 'criar', true),
  ('b9def33a-a2a0-477d-8580-ec213d642808', 'aulas', 'editar', true),
  ('b9def33a-a2a0-477d-8580-ec213d642808', 'ponto', 'visualizar', true),
  ('b9def33a-a2a0-477d-8580-ec213d642808', 'ponto', 'criar', true),
  ('b9def33a-a2a0-477d-8580-ec213d642808', 'comprovacoes', 'visualizar', true),
  ('b9def33a-a2a0-477d-8580-ec213d642808', 'comprovacoes', 'criar', true),
  -- Coordenador (1bea5f77...)
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'aulas', 'visualizar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'aulas', 'criar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'aulas', 'editar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'ponto', 'visualizar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'ponto', 'criar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'ponto', 'editar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'comprovacoes', 'visualizar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'comprovacoes', 'criar', true)
ON CONFLICT DO NOTHING;

-- 2. Substituir policies abertas de execucoes_aula
DROP POLICY IF EXISTS "Enable all for authenticated users" ON execucoes_aula;
CREATE POLICY execucoes_aula_select ON execucoes_aula FOR SELECT USING (has_permissao('aulas', 'visualizar'));
CREATE POLICY execucoes_aula_insert ON execucoes_aula FOR INSERT WITH CHECK (has_permissao('aulas', 'criar'));
CREATE POLICY execucoes_aula_update ON execucoes_aula FOR UPDATE USING (has_permissao('aulas', 'editar'));
CREATE POLICY execucoes_aula_delete ON execucoes_aula FOR DELETE USING (has_permissao('aulas', 'excluir'));

-- 3. Substituir policies abertas de beneficiario_presencas
DROP POLICY IF EXISTS "Enable all for authenticated users" ON beneficiario_presencas;
CREATE POLICY beneficiario_presencas_select ON beneficiario_presencas FOR SELECT USING (has_permissao('aulas', 'visualizar'));
CREATE POLICY beneficiario_presencas_insert ON beneficiario_presencas FOR INSERT WITH CHECK (has_permissao('aulas', 'criar'));
CREATE POLICY beneficiario_presencas_update ON beneficiario_presencas FOR UPDATE USING (has_permissao('aulas', 'editar'));

-- 4. Completar registros_ponto com UPDATE policy
CREATE POLICY IF NOT EXISTS registros_ponto_update ON registros_ponto FOR UPDATE USING (has_permissao('ponto', 'editar'));
