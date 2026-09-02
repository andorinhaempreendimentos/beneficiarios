-- 045_prestacao_contas_schema.sql
-- Estrutura para Órgãos Concedentes, Metas Contratuais do Objeto, Quadro de Cargos,
-- Atividades Complementares Extra-Grade e Histórico de Prestação de Contas.

-- 1. Tabela de Órgãos Concedentes (Poder Público financiador)
CREATE TABLE IF NOT EXISTS public.concedentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    esfera VARCHAR(50) NOT NULL DEFAULT 'municipal' CHECK (esfera IN ('municipal', 'estadual', 'federal')),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    responsavel_nome VARCHAR(255),
    responsavel_cargo VARCHAR(255),
    telefone VARCHAR(30),
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_concedentes_nome ON public.concedentes(nome);

-- 2. Alteração na tabela objetos (Metas Contratuais, Concedente e Processo)
ALTER TABLE public.objetos
    ADD COLUMN IF NOT EXISTS concedente_id UUID REFERENCES public.concedentes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS modalidade_parceria VARCHAR(50) DEFAULT 'termo_colaboracao' CHECK (modalidade_parceria IN ('termo_colaboracao', 'termo_fomento', 'acordo_cooperacao')),
    ADD COLUMN IF NOT EXISTS numero_processo_adm VARCHAR(100),
    ADD COLUMN IF NOT EXISTS edital_numero VARCHAR(100),
    ADD COLUMN IF NOT EXISTS conta_bancaria_banco VARCHAR(100),
    ADD COLUMN IF NOT EXISTS conta_bancaria_agencia VARCHAR(20),
    ADD COLUMN IF NOT EXISTS conta_bancaria_conta VARCHAR(30),
    ADD COLUMN IF NOT EXISTS meta_beneficiarios INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meta_nucleos INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meta_aulas_ano INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meta_frequencia_minima NUMERIC(5,2) DEFAULT 75.00,
    ADD COLUMN IF NOT EXISTS meta_vulnerabilidade_minima NUMERIC(5,2) DEFAULT 70.00,
    ADD COLUMN IF NOT EXISTS meta_eventos_ano INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meta_reunioes_ano INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_objetos_concedente_id ON public.objetos(concedente_id);

-- 3. Tabela de Quadro de Cargos Previstos por Objeto (Dinâmico)
CREATE TABLE IF NOT EXISTS public.objeto_cargos_previstos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES public.objetos(id) ON DELETE CASCADE,
    cargo_nome VARCHAR(150) NOT NULL,
    quantidade_prevista INT NOT NULL DEFAULT 1,
    remuneracao_mensal NUMERIC(12,2) DEFAULT 0.00,
    carga_horaria_semanal VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_objeto_cargos_objeto_id ON public.objeto_cargos_previstos(objeto_id);

-- 4. Tabela de Atividades Complementares Extra-Grade (Eventos, Reuniões de Pais, Capacitações, Oficinas)
CREATE TABLE IF NOT EXISTS public.atividades_complementares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES public.objetos(id) ON DELETE CASCADE,
    nucleo_id UUID REFERENCES public.nucleos(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('evento_esportivo', 'reuniao_familia', 'capacitacao', 'oficina_socioeducativa', 'outro')),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    horario_inicio TIME,
    horario_fim TIME,
    responsavel_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    quantidade_participantes INT NOT NULL DEFAULT 0,
    fotos_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_atividades_comp_objeto_id ON public.atividades_complementares(objeto_id);
CREATE INDEX IF NOT EXISTS idx_atividades_comp_data ON public.atividades_complementares(data);

-- 5. Tabela de Histórico de Emissões de Prestação de Contas
CREATE TABLE IF NOT EXISTS public.relatorios_prestacao_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objeto_id UUID NOT NULL REFERENCES public.objetos(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    tipo_periodo VARCHAR(50) NOT NULL DEFAULT 'trimestral',
    dados_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
    pareceres JSONB NOT NULL DEFAULT '{}'::JSONB,
    signatarios JSONB NOT NULL DEFAULT '{}'::JSONB,
    emitido_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'emitido',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_relatorios_pc_objeto_id ON public.relatorios_prestacao_contas(objeto_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_pc_periodo ON public.relatorios_prestacao_contas(data_inicio, data_fim);

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE public.concedentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objeto_cargos_previstos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades_complementares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_prestacao_contas ENABLE ROW LEVEL SECURITY;

-- 7. Inserir Permissões de Perfil para os novos módulos
INSERT INTO public.perfil_permissoes (perfil_id, modulo, acao, permitido) VALUES
  -- Admin
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'concedentes', 'listar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'concedentes', 'criar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'concedentes', 'editar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'concedentes', 'excluir', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'atividades_complementares', 'listar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'atividades_complementares', 'criar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'atividades_complementares', 'editar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'atividades_complementares', 'excluir', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'prestacao_contas', 'listar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'prestacao_contas', 'criar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'prestacao_contas', 'editar', true),
  -- Coordenador
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'concedentes', 'listar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'atividades_complementares', 'listar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'atividades_complementares', 'criar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'atividades_complementares', 'editar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'prestacao_contas', 'listar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'prestacao_contas', 'criar', true),
  -- Professor
  ('b9def33a-a2a0-477d-8580-ec213d642808', 'atividades_complementares', 'listar', true),
  ('b9def33a-a2a0-477d-8580-ec213d642808', 'atividades_complementares', 'criar', true)
ON CONFLICT DO NOTHING;

-- 8. Policies RLS
-- concedentes
DROP POLICY IF EXISTS select_concedentes ON public.concedentes;
CREATE POLICY select_concedentes ON public.concedentes FOR SELECT USING (has_permissao('concedentes', 'listar') OR has_permissao('concedentes', 'visualizar') OR has_permissao('concedentes', 'editar') OR has_permissao('concedentes', 'excluir') OR has_permissao('objetos', 'listar') OR has_permissao('objetos', 'visualizar') OR has_permissao('objetos', 'editar') OR has_permissao('objetos', 'excluir'));

DROP POLICY IF EXISTS insert_concedentes ON public.concedentes;
CREATE POLICY insert_concedentes ON public.concedentes FOR INSERT WITH CHECK (has_permissao('concedentes', 'criar') OR has_permissao('objetos', 'criar'));

DROP POLICY IF EXISTS update_concedentes ON public.concedentes;
CREATE POLICY update_concedentes ON public.concedentes FOR UPDATE USING (has_permissao('concedentes', 'editar') OR has_permissao('concedentes', 'excluir') OR has_permissao('objetos', 'editar') OR has_permissao('objetos', 'excluir')) WITH CHECK (has_permissao('concedentes', 'editar') OR has_permissao('concedentes', 'excluir') OR has_permissao('objetos', 'editar') OR has_permissao('objetos', 'excluir'));

DROP POLICY IF EXISTS delete_concedentes ON public.concedentes;
CREATE POLICY delete_concedentes ON public.concedentes FOR DELETE USING (has_permissao('concedentes', 'excluir') OR has_permissao('objetos', 'excluir'));

-- objeto_cargos_previstos
DROP POLICY IF EXISTS select_objeto_cargos ON public.objeto_cargos_previstos;
CREATE POLICY select_objeto_cargos ON public.objeto_cargos_previstos FOR SELECT USING (has_permissao('objetos', 'listar'));

DROP POLICY IF EXISTS insert_objeto_cargos ON public.objeto_cargos_previstos;
CREATE POLICY insert_objeto_cargos ON public.objeto_cargos_previstos FOR INSERT WITH CHECK (has_permissao('objetos', 'criar') OR has_permissao('objetos', 'editar'));

DROP POLICY IF EXISTS update_objeto_cargos ON public.objeto_cargos_previstos;
CREATE POLICY update_objeto_cargos ON public.objeto_cargos_previstos FOR UPDATE USING (has_permissao('objetos', 'editar'));

DROP POLICY IF EXISTS delete_objeto_cargos ON public.objeto_cargos_previstos;
CREATE POLICY delete_objeto_cargos ON public.objeto_cargos_previstos FOR DELETE USING (has_permissao('objetos', 'editar'));

-- atividades_complementares
DROP POLICY IF EXISTS select_atividades_comp ON public.atividades_complementares;
CREATE POLICY select_atividades_comp ON public.atividades_complementares FOR SELECT USING (deleted_at IS NULL AND has_permissao('atividades_complementares', 'listar'));

DROP POLICY IF EXISTS insert_atividades_comp ON public.atividades_complementares;
CREATE POLICY insert_atividades_comp ON public.atividades_complementares FOR INSERT WITH CHECK (has_permissao('atividades_complementares', 'criar'));

DROP POLICY IF EXISTS update_atividades_comp ON public.atividades_complementares;
CREATE POLICY update_atividades_comp ON public.atividades_complementares FOR UPDATE USING (has_permissao('atividades_complementares', 'editar'));

DROP POLICY IF EXISTS delete_atividades_comp ON public.atividades_complementares;
CREATE POLICY delete_atividades_comp ON public.atividades_complementares FOR DELETE USING (has_permissao('atividades_complementares', 'excluir'));

-- relatorios_prestacao_contas
DROP POLICY IF EXISTS select_relatorios_pc ON public.relatorios_prestacao_contas;
CREATE POLICY select_relatorios_pc ON public.relatorios_prestacao_contas FOR SELECT USING (has_permissao('prestacao_contas', 'listar') OR has_permissao('relatorios', 'listar'));

DROP POLICY IF EXISTS insert_relatorios_pc ON public.relatorios_prestacao_contas;
CREATE POLICY insert_relatorios_pc ON public.relatorios_prestacao_contas FOR INSERT WITH CHECK (has_permissao('prestacao_contas', 'criar') OR has_permissao('relatorios', 'criar'));

DROP POLICY IF EXISTS update_relatorios_pc ON public.relatorios_prestacao_contas;
CREATE POLICY update_relatorios_pc ON public.relatorios_prestacao_contas FOR UPDATE USING (has_permissao('prestacao_contas', 'editar') OR has_permissao('relatorios', 'editar'));
