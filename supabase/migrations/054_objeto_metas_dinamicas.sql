-- 054_objeto_metas_dinamicas.sql
-- Tabela de metas dinâmicas pactuadas no plano de trabalho por objeto

CREATE TABLE IF NOT EXISTS public.objeto_metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES public.objetos(id) ON DELETE CASCADE,
    entidade_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    unidade TEXT NOT NULL,
    valor_esperado NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_objeto_metas_objeto_id ON public.objeto_metas(objeto_id);
CREATE INDEX IF NOT EXISTS idx_objeto_metas_entidade_id ON public.objeto_metas(entidade_id);

-- RLS
ALTER TABLE public.objeto_metas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para usuários autenticados
DROP POLICY IF EXISTS "objeto_metas_select" ON public.objeto_metas;
CREATE POLICY "objeto_metas_select" ON public.objeto_metas
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "objeto_metas_all" ON public.objeto_metas;
CREATE POLICY "objeto_metas_all" ON public.objeto_metas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Script de Seed / Migração automática dos dados existentes nas 7 colunas legadas da tabela objetos
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM public.objetos WHERE deleted_at IS NULL LOOP
        -- Beneficiários
        IF r.meta_beneficiarios IS NOT NULL AND r.meta_beneficiarios > 0 THEN
            IF NOT EXISTS (SELECT 1 FROM public.objeto_metas WHERE objeto_id = r.id AND entidade_id = 'participantes') THEN
                INSERT INTO public.objeto_metas (objeto_id, entidade_id, titulo, unidade, valor_esperado)
                VALUES (r.id, 'participantes', 'Beneficiários Atendidos / Matriculados', 'Pessoas / Atendidos', r.meta_beneficiarios);
            END IF;
        END IF;

        -- Núcleos / Locais
        IF r.meta_nucleos IS NOT NULL AND r.meta_nucleos > 0 THEN
            IF NOT EXISTS (SELECT 1 FROM public.objeto_metas WHERE objeto_id = r.id AND entidade_id = 'locais') THEN
                INSERT INTO public.objeto_metas (objeto_id, entidade_id, titulo, unidade, valor_esperado)
                VALUES (r.id, 'locais', 'Locais / Núcleos em Funcionamento', 'Quantidade (Unidades)', r.meta_nucleos);
            END IF;
        END IF;

        -- Aulas / Sessões
        IF r.meta_aulas_ano IS NOT NULL AND r.meta_aulas_ano > 0 THEN
            IF NOT EXISTS (SELECT 1 FROM public.objeto_metas WHERE objeto_id = r.id AND entidade_id = 'sessoes') THEN
                INSERT INTO public.objeto_metas (objeto_id, entidade_id, titulo, unidade, valor_esperado)
                VALUES (r.id, 'sessoes', 'Sessões / Aulas e Atividades Realizadas', 'Quantidade (Unidades)', r.meta_aulas_ano);
            END IF;
        END IF;

        -- Frequência Mínima
        IF r.meta_frequencia_minima IS NOT NULL AND r.meta_frequencia_minima > 0 THEN
            IF NOT EXISTS (SELECT 1 FROM public.objeto_metas WHERE objeto_id = r.id AND entidade_id = 'frequencia') THEN
                INSERT INTO public.objeto_metas (objeto_id, entidade_id, titulo, unidade, valor_esperado)
                VALUES (r.id, 'frequencia', 'Frequência Média de Participação', 'Porcentagem (%)', r.meta_frequencia_minima);
            END IF;
        END IF;

        -- Vulnerabilidade Social
        IF r.meta_vulnerabilidade_minima IS NOT NULL AND r.meta_vulnerabilidade_minima > 0 THEN
            IF NOT EXISTS (SELECT 1 FROM public.objeto_metas WHERE objeto_id = r.id AND entidade_id = 'vulnerabilidade') THEN
                INSERT INTO public.objeto_metas (objeto_id, entidade_id, titulo, unidade, valor_esperado)
                VALUES (r.id, 'vulnerabilidade', 'Inclusão Social e Vulnerabilidade', 'Porcentagem (%)', r.meta_vulnerabilidade_minima);
            END IF;
        END IF;

        -- Eventos
        IF r.meta_eventos_ano IS NOT NULL AND r.meta_eventos_ano > 0 THEN
            IF NOT EXISTS (SELECT 1 FROM public.objeto_metas WHERE objeto_id = r.id AND entidade_id = 'eventos') THEN
                INSERT INTO public.objeto_metas (objeto_id, entidade_id, titulo, unidade, valor_esperado)
                VALUES (r.id, 'eventos', 'Eventos e Ações Coletivas no Ano', 'Quantidade (Unidades)', r.meta_eventos_ano);
            END IF;
        END IF;

        -- Reuniões com Famílias
        IF r.meta_reunioes_ano IS NOT NULL AND r.meta_reunioes_ano > 0 THEN
            IF NOT EXISTS (SELECT 1 FROM public.objeto_metas WHERE objeto_id = r.id AND entidade_id = 'reunioes') THEN
                INSERT INTO public.objeto_metas (objeto_id, entidade_id, titulo, unidade, valor_esperado)
                VALUES (r.id, 'reunioes', 'Reuniões com Famílias e Responsáveis', 'Encontros / Reuniões', r.meta_reunioes_ano);
            END IF;
        END IF;
    END LOOP;
END $$;
