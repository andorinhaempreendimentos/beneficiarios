-- 056_inversao_objeto_organizacao.sql
-- Inversão da relação hierárquica: o Objeto passa a referenciar a Organização Executora (1:N)

-- 1. Adicionar coluna organizacao_id e índice na tabela objetos
ALTER TABLE public.objetos 
ADD COLUMN IF NOT EXISTS organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_objetos_organizacao_id 
ON public.objetos(organizacao_id);

-- 2. Migrar os dados existentes (vincula cada objeto à sua respectiva organização executora)
UPDATE public.objetos o
SET organizacao_id = org.id
FROM public.organizacoes org
WHERE org.objeto_id = o.id AND o.organizacao_id IS NULL;

-- 3. Tornar a coluna objeto_id em organizacoes opcional (DROP NOT NULL)
ALTER TABLE public.organizacoes 
ALTER COLUMN objeto_id DROP NOT NULL;
