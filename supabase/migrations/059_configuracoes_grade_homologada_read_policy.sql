-- ==============================================================================
-- Migração 059: Permitir leitura da chave de homologação de grade na tabela configuracoes
-- Permite que usuários autenticados e anon consultem se a grade do polo foi homologada
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'configuracoes' 
      AND policyname = 'configuracoes_grade_homologada_read'
  ) THEN
    CREATE POLICY configuracoes_grade_homologada_read ON configuracoes
      FOR SELECT TO authenticated, anon
      USING (chave LIKE 'grade_homologada_%');
  END IF;
END $$;
