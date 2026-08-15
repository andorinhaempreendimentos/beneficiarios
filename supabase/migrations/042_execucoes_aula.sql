DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_execucao_aula') THEN
    CREATE TYPE status_execucao_aula AS ENUM ('em_andamento', 'concluida', 'pendente_aprovacao', 'rejeitada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_aprovacao_aula') THEN
    CREATE TYPE status_aprovacao_aula AS ENUM ('aprovado', 'pendente_aprovacao', 'rejeitado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_presenca') THEN
    CREATE TYPE status_presenca AS ENUM ('presente', 'falta', 'falta_justificada');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.execucoes_aula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_inicio_prevista TIME NOT NULL,
  hora_fim_prevista TIME NOT NULL,
  hora_inicio_real TIMESTAMP WITH TIME ZONE,
  hora_fim_real TIMESTAMP WITH TIME ZONE,
  status status_execucao_aula NOT NULL DEFAULT 'em_andamento',
  foto_comprovante_url TEXT,
  observacoes TEXT,
  justificativa_retroativa TEXT,
  status_aprovacao status_aprovacao_aula NOT NULL DEFAULT 'aprovado',
  aprovado_por_user_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  aprovado_em TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.beneficiario_presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_aula_id UUID NOT NULL REFERENCES public.execucoes_aula(id) ON DELETE CASCADE,
  beneficiario_id UUID NOT NULL REFERENCES public.beneficiarios(id) ON DELETE CASCADE,
  status status_presenca NOT NULL DEFAULT 'presente',
  observacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(execucao_aula_id, beneficiario_id)
);

ALTER TABLE public.execucoes_aula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiario_presencas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.execucoes_aula;
CREATE POLICY "Enable all for authenticated users" ON public.execucoes_aula FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.beneficiario_presencas;
CREATE POLICY "Enable all for authenticated users" ON public.beneficiario_presencas FOR ALL USING (auth.role() = 'authenticated');
