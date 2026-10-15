-- ============================================================
-- Módulo de Pesquisas: Criação das tabelas
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categorias de Campos
CREATE TABLE IF NOT EXISTS categoria_campo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Objetos de Pesquisa (Projetos / Eventos específicos)
CREATE TABLE IF NOT EXISTS objeto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'projeto',
  termo_fomento TEXT,
  codigo_objeto TEXT,
  codigo_programa TEXT,
  nome_programa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID
);

-- 3. Líderes
CREATE TABLE IF NOT EXISTS lider (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID
);

-- 4. Fluxos de Perguntas (Logic Graph)
CREATE TABLE IF NOT EXISTS fluxo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  flow_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  tipo TEXT CHECK (tipo IN ('fluxo', 'bloco')) NOT NULL DEFAULT 'fluxo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID
);

-- 5. Pesquisas
CREATE TABLE IF NOT EXISTS pesquisa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  token TEXT UNIQUE NOT NULL,
  publicada BOOLEAN DEFAULT false NOT NULL,
  objeto_id UUID REFERENCES objeto(id) ON DELETE CASCADE,
  lider_id UUID REFERENCES lider(id) ON DELETE SET NULL,
  fluxo_id UUID REFERENCES fluxo(id) ON DELETE SET NULL,
  exigir_cpf BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID
);

-- 6. Perguntas do Fluxo
CREATE TABLE IF NOT EXISTS pergunta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fluxo_id UUID REFERENCES fluxo(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  obrigatoria BOOLEAN DEFAULT true NOT NULL,
  ordem INTEGER NOT NULL,
  config JSONB DEFAULT '{}'::jsonb NOT NULL,
  categoria_id UUID REFERENCES categoria_campo(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Respostas (Sessão)
CREATE TABLE IF NOT EXISTS resposta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pesquisa_id UUID REFERENCES pesquisa(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Itens de Resposta
CREATE TABLE IF NOT EXISTS resposta_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resposta_id UUID REFERENCES resposta(id) ON DELETE CASCADE,
  pergunta_id UUID REFERENCES pergunta(id) ON DELETE CASCADE,
  valor JSONB NOT NULL
);

-- 9. Relatórios Salvos
CREATE TABLE IF NOT EXISTS relatorio_salvo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  filtros JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- HABILITAR RLS COM POLÍTICAS ABERTAS / PERMISSIVAS
-- ============================================================

ALTER TABLE categoria_campo ENABLE ROW LEVEL SECURITY;
ALTER TABLE objeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE lider ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluxo ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesquisa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pergunta ENABLE ROW LEVEL SECURITY;
ALTER TABLE resposta ENABLE ROW LEVEL SECURITY;
ALTER TABLE resposta_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_salvo ENABLE ROW LEVEL SECURITY;

-- Políticas gerais
DO $$
BEGIN
  -- Categoria
  DROP POLICY IF EXISTS "categoria_campo_all" ON categoria_campo;
  CREATE POLICY "categoria_campo_all" ON categoria_campo FOR ALL USING (true) WITH CHECK (true);

  -- Objeto
  DROP POLICY IF EXISTS "objeto_all" ON objeto;
  CREATE POLICY "objeto_all" ON objeto FOR ALL USING (true) WITH CHECK (true);

  -- Lider
  DROP POLICY IF EXISTS "lider_all" ON lider;
  CREATE POLICY "lider_all" ON lider FOR ALL USING (true) WITH CHECK (true);

  -- Fluxo
  DROP POLICY IF EXISTS "fluxo_all" ON fluxo;
  CREATE POLICY "fluxo_all" ON fluxo FOR ALL USING (true) WITH CHECK (true);

  -- Pesquisa
  DROP POLICY IF EXISTS "pesquisa_all" ON pesquisa;
  CREATE POLICY "pesquisa_all" ON pesquisa FOR ALL USING (true) WITH CHECK (true);

  -- Pergunta
  DROP POLICY IF EXISTS "pergunta_all" ON pergunta;
  CREATE POLICY "pergunta_all" ON pergunta FOR ALL USING (true) WITH CHECK (true);

  -- Resposta
  DROP POLICY IF EXISTS "resposta_all" ON resposta;
  CREATE POLICY "resposta_all" ON resposta FOR ALL USING (true) WITH CHECK (true);

  -- Resposta Item
  DROP POLICY IF EXISTS "resposta_item_all" ON resposta_item;
  CREATE POLICY "resposta_item_all" ON resposta_item FOR ALL USING (true) WITH CHECK (true);

  -- Relatório Salvo
  DROP POLICY IF EXISTS "relatorio_salvo_all" ON relatorio_salvo;
  CREATE POLICY "relatorio_salvo_all" ON relatorio_salvo FOR ALL USING (true) WITH CHECK (true);
END $$;
