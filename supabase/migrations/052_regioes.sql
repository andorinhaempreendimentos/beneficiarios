-- Migration: 052_regioes.sql
-- Criação da entidade Regiões, relacionamento com Núcleos e Objetos, RLS com RBAC e migração de dados legados.

-- 1. Criação da tabela regioes
CREATE TABLE IF NOT EXISTS public.regioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(200) NOT NULL,
  descricao text,
  objeto_id uuid NOT NULL REFERENCES public.objetos(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_regioes_objeto_id ON public.regioes(objeto_id);

-- 2. Adicionar regiao_id na tabela nucleos
ALTER TABLE public.nucleos
ADD COLUMN IF NOT EXISTS regiao_id uuid REFERENCES public.regioes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nucleos_regiao_id ON public.nucleos(regiao_id);

-- 3. Migração de dados legados (popula regioes a partir de nucleos.regiao textual existente)
DO $$
DECLARE
  r RECORD;
  v_regiao_id uuid;
BEGIN
  FOR r IN
    SELECT DISTINCT n.regiao, o.objeto_id
    FROM public.nucleos n
    JOIN public.organizacoes o ON o.id = n.organizacao_id
    WHERE n.regiao IS NOT NULL 
      AND trim(n.regiao) <> '' 
      AND n.regiao_id IS NULL
  LOOP
    -- Busca se já existe registro equivalente para este objeto
    SELECT id INTO v_regiao_id
    FROM public.regioes
    WHERE lower(trim(nome)) = lower(trim(r.regiao))
      AND objeto_id = r.objeto_id
      AND deleted_at IS NULL
    LIMIT 1;

    -- Se não existir, insere nova região
    IF v_regiao_id IS NULL THEN
      INSERT INTO public.regioes (nome, objeto_id)
      VALUES (trim(r.regiao), r.objeto_id)
      RETURNING id INTO v_regiao_id;
    END IF;

    -- Atualiza os núcleos associados
    UPDATE public.nucleos
    SET regiao_id = v_regiao_id
    WHERE regiao = r.regiao 
      AND regiao_id IS NULL;
  END LOOP;
END $$;

-- 4. Permissões de RBAC para o módulo regioes
DO $$
DECLARE
  v_perfil_admin_id uuid;
BEGIN
  SELECT id INTO v_perfil_admin_id FROM public.perfis WHERE nome = 'Administrador' LIMIT 1;
  IF v_perfil_admin_id IS NOT NULL THEN
    INSERT INTO public.perfil_permissoes (perfil_id, modulo, acao, permitido)
    VALUES
      (v_perfil_admin_id, 'regioes', 'listar', true),
      (v_perfil_admin_id, 'regioes', 'visualizar', true),
      (v_perfil_admin_id, 'regioes', 'criar', true),
      (v_perfil_admin_id, 'regioes', 'editar', true),
      (v_perfil_admin_id, 'regioes', 'excluir', true)
    ON CONFLICT (perfil_id, modulo, acao) DO UPDATE SET permitido = true;
  END IF;
END $$;

-- 5. Políticas de Row Level Security (RLS)
ALTER TABLE public.regioes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regioes' AND policyname = 'regioes_select') THEN
    CREATE POLICY regioes_select ON public.regioes
      FOR SELECT
      USING (
        deleted_at IS NULL
        AND (
          has_permissao('regioes', 'listar')
          OR has_permissao('regioes', 'visualizar')
          OR has_permissao('nucleos', 'listar')
          OR has_permissao('nucleos', 'visualizar')
          OR current_tipo_usuario() IN ('admin', 'gestor')
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regioes' AND policyname = 'regioes_insert') THEN
    CREATE POLICY regioes_insert ON public.regioes
      FOR INSERT
      WITH CHECK (
        has_permissao('regioes', 'criar')
        OR (has_permissao('nucleos', 'criar') AND current_tipo_usuario() IN ('admin', 'gestor'))
        OR current_tipo_usuario() = 'admin'
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regioes' AND policyname = 'regioes_update') THEN
    CREATE POLICY regioes_update ON public.regioes
      FOR UPDATE
      USING (
        has_permissao('regioes', 'editar')
        OR (has_permissao('nucleos', 'editar') AND current_tipo_usuario() IN ('admin', 'gestor'))
        OR current_tipo_usuario() = 'admin'
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regioes' AND policyname = 'regioes_delete') THEN
    CREATE POLICY regioes_delete ON public.regioes
      FOR DELETE
      USING (
        has_permissao('regioes', 'excluir')
        OR current_tipo_usuario() = 'admin'
      );
  END IF;
END $$;
