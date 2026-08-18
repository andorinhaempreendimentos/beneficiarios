# ARQUITETURA SUPERVISÃO, ESTOQUE E PENDÊNCIAS V2

## 1. Título e Contexto

Documentar arquitetura V2 para os novos módulos do sistema Andorinha: Supervisão, Estoque, Pendências Gerais e Relatórios.
Corrigir a arquitetura prévia que contemplava NestJS.
Refletir a realidade técnica do projeto: utilizar **Supabase diretamente do Next.js**, sem backend REST intermediário.
Garantir padronização de nomenclatura, controle de permissões por RLS, gatilhos de banco de dados e sincronização de estado com hooks do React.

## 2. Stack Atual

Utilizar tecnologias estabelecidas no projeto.
*   **Database**: Supabase Postgres.
*   **Frontend**: Next.js App Router (`/app/(dashboard)`). Uso massivo de `"use client"` para páginas interativas.
*   **Acesso a Dados**: `@supabase/ssr` e `@supabase/supabase-js`.
*   **Autenticação/Autorização**: Supabase Auth + RLS (Row Level Security). Função `has_permissao()` via claims do JWT.
*   **Storage**: Supabase Storage para fotos de supervisão e comprovantes.
*   **Jobs Assíncronos**: `pg_cron` nativo do Postgres. Sem filas externas (Bull/Redis).
*   **Regras de Negócio**: Triggers no Postgres e validações via Zod no cliente/server actions.

## 3. Distinções Importantes

### Equipamentos vs Materiais
Diferenciar rigidamente:
*   **Equipamentos (Legado/Existente)**: Ativos patrimoniais caros (computadores, mesas de som, câmeras). Possuem número de série, nota fiscal, acompanhamento unitário de estado de conservação.
*   **Materiais (Novo)**: Insumos consumíveis e genéricos (lápis, papel, bolas, cones, uniformes básicos). Controlar apenas quantidade em estoque, estoque mínimo, fluxo de entrada e saída. Não rastrear individualmente.
*   **UX**: Adicionar *tooltips* explicativos na tela de cadastro para o usuário entender a diferença e não cadastrar material na tela de equipamento e vice-versa.

### Pendências de Aula vs Pendências Gerais
Diferenciar rigidamente:
*   **Pendências de Aula (Legado/Existente)**: Relacionadas à aprovação/revisão de uma execução de aula (ex: coordenador precisa aprovar a aula do professor). Controladas em `execucoes_aula` e fluxos de aprovação específicos.
*   **Pendências Gerais (Novo)**: Ocorrências operacionais de um núcleo detectadas durante supervisão ou rotina. Exemplo: "Cesta de basquete quebrada", "Falta de giz", "Professor ausente com frequência". Entidade própria (`pendencias_gerais`), com ciclo de vida (aberta -> em_andamento -> resolvida).

---

## 4. Modelo de Dados

Mapear entidades no banco.

*   `materiais`: Catálogo mestre de itens.
*   `estoque_nucleos`: Tabela pivô de quantidade atual por núcleo.
*   `movimentacoes_estoque`: Histórico de entrada, saída, transferência, perda.
*   `termos_entrega`: Vínculo opcional para responsabilidade de entrega de materiais.
*   `supervisoes`: Visitas dos coordenadores aos núcleos.
*   `supervisoes_fotos`: Arquivos anexos das visitas.
*   `pendencias_gerais`: Ocorrências de manutenção, RH ou estrutura.

---

## 5. Migrations

Criar arquivos SQL rigorosos e completos.

### Migration 045: Tabelas de Materiais e Estoque
Nome: `045_create_materiais_estoque.sql`

```sql
-- 045_create_materiais_estoque.sql

CREATE TABLE public.materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    unidade_medida TEXT NOT NULL,
    estoque_minimo INTEGER NOT NULL DEFAULT 0,
    foto_url TEXT,
    categoria TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE public.estoque_nucleos (
    material_id UUID NOT NULL REFERENCES public.materiais(id),
    nucleo_id UUID NOT NULL REFERENCES public.nucleos(id),
    quantidade_atual INTEGER NOT NULL DEFAULT 0,
    localizacao TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (material_id, nucleo_id)
);

CREATE TABLE public.movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materiais(id),
    nucleo_id UUID NOT NULL REFERENCES public.nucleos(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'transferencia', 'perda', 'dano')),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    quantidade_anterior INTEGER NOT NULL DEFAULT 0,
    quantidade_posterior INTEGER NOT NULL DEFAULT 0,
    responsavel_id UUID NOT NULL REFERENCES public.funcionarios(id),
    beneficiario_id UUID REFERENCES public.beneficiarios(id),
    destino_nucleo_id UUID REFERENCES public.nucleos(id),
    motivo TEXT,
    observacoes TEXT,
    termo_assinado BOOLEAN NOT NULL DEFAULT false,
    foto_comprovante_url TEXT,
    data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_nucleos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- Triggers de updated_at
CREATE TRIGGER tg_materiais_updated_at BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tg_estoque_nucleos_updated_at BEFORE UPDATE ON public.estoque_nucleos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policies materiais
CREATE POLICY select_materiais ON public.materiais FOR SELECT USING (deleted_at IS NULL AND has_permissao('materiais', 'listar'));
CREATE POLICY insert_materiais ON public.materiais FOR INSERT WITH CHECK (has_permissao('materiais', 'criar'));
CREATE POLICY update_materiais ON public.materiais FOR UPDATE USING (has_permissao('materiais', 'editar'));
CREATE POLICY delete_materiais ON public.materiais FOR DELETE USING (has_permissao('materiais', 'excluir'));

-- Policies estoque_nucleos
CREATE POLICY select_estoque_nucleos ON public.estoque_nucleos FOR SELECT USING (has_permissao('estoque', 'listar'));
CREATE POLICY insert_estoque_nucleos ON public.estoque_nucleos FOR INSERT WITH CHECK (has_permissao('estoque', 'criar'));
CREATE POLICY update_estoque_nucleos ON public.estoque_nucleos FOR UPDATE USING (has_permissao('estoque', 'editar'));

-- Policies movimentacoes_estoque
CREATE POLICY select_movimentacoes ON public.movimentacoes_estoque FOR SELECT USING (has_permissao('movimentacoes', 'listar'));
CREATE POLICY insert_movimentacoes ON public.movimentacoes_estoque FOR INSERT WITH CHECK (has_permissao('movimentacoes', 'criar'));

-- Permissoes (Admin)
INSERT INTO public.perfil_permissoes (perfil_id, modulo, acao, permitido) VALUES
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'materiais', 'listar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'materiais', 'criar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'materiais', 'editar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'materiais', 'excluir', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'estoque', 'listar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'estoque', 'criar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'estoque', 'editar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'movimentacoes', 'listar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'movimentacoes', 'criar', true);

-- Permissoes (Coordenador)
INSERT INTO public.perfil_permissoes (perfil_id, modulo, acao, permitido) VALUES
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'materiais', 'listar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'estoque', 'listar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'movimentacoes', 'listar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'movimentacoes', 'criar', true);

-- Permissoes (Professor)
INSERT INTO public.perfil_permissoes (perfil_id, modulo, acao, permitido) VALUES
('b9def33a-a2a0-477d-8580-ec213d642808', 'materiais', 'listar', true),
('b9def33a-a2a0-477d-8580-ec213d642808', 'estoque', 'listar', true);
```

### Migration 046: Trigger de Movimentação de Estoque
Nome: `046_trigger_movimentacao_estoque.sql`

```sql
-- 046_trigger_movimentacao_estoque.sql

CREATE OR REPLACE FUNCTION public.atualizar_estoque_apos_movimentacao()
RETURNS TRIGGER AS $$
DECLARE
    v_qtd_atual INTEGER := 0;
BEGIN
    -- Obter a quantidade atual, ou 0 se não existir
    SELECT quantidade_atual INTO v_qtd_atual
    FROM public.estoque_nucleos
    WHERE material_id = NEW.material_id AND nucleo_id = NEW.nucleo_id;

    IF v_qtd_atual IS NULL THEN
        v_qtd_atual := 0;
    END IF;

    NEW.quantidade_anterior := v_qtd_atual;

    IF NEW.tipo = 'entrada' THEN
        NEW.quantidade_posterior := v_qtd_atual + NEW.quantidade;
        
        INSERT INTO public.estoque_nucleos (material_id, nucleo_id, quantidade_atual)
        VALUES (NEW.material_id, NEW.nucleo_id, NEW.quantidade_posterior)
        ON CONFLICT (material_id, nucleo_id) 
        DO UPDATE SET quantidade_atual = EXCLUDED.quantidade_atual, updated_at = now();

    ELSIF NEW.tipo IN ('saida', 'perda', 'dano') THEN
        IF v_qtd_atual < NEW.quantidade THEN
            RAISE EXCEPTION 'Estoque insuficiente no núcleo de origem.';
        END IF;

        NEW.quantidade_posterior := v_qtd_atual - NEW.quantidade;

        UPDATE public.estoque_nucleos
        SET quantidade_atual = NEW.quantidade_posterior, updated_at = now()
        WHERE material_id = NEW.material_id AND nucleo_id = NEW.nucleo_id;

    ELSIF NEW.tipo = 'transferencia' THEN
        IF NEW.destino_nucleo_id IS NULL THEN
            RAISE EXCEPTION 'Transferência exige núcleo de destino.';
        END IF;

        IF v_qtd_atual < NEW.quantidade THEN
            RAISE EXCEPTION 'Estoque insuficiente no núcleo de origem para transferência.';
        END IF;

        -- Reduz do núcleo origem
        NEW.quantidade_posterior := v_qtd_atual - NEW.quantidade;

        UPDATE public.estoque_nucleos
        SET quantidade_atual = NEW.quantidade_posterior, updated_at = now()
        WHERE material_id = NEW.material_id AND nucleo_id = NEW.nucleo_id;

        -- Aumenta no núcleo destino
        INSERT INTO public.estoque_nucleos (material_id, nucleo_id, quantidade_atual)
        VALUES (NEW.material_id, NEW.destino_nucleo_id, NEW.quantidade)
        ON CONFLICT (material_id, nucleo_id) 
        DO UPDATE SET quantidade_atual = public.estoque_nucleos.quantidade_atual + EXCLUDED.quantidade_atual, updated_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_atualizar_estoque
BEFORE INSERT ON public.movimentacoes_estoque
FOR EACH ROW EXECUTE FUNCTION public.atualizar_estoque_apos_movimentacao();
```

### Migration 047: Termos de Entrega
Nome: `047_create_termos_entrega.sql`

```sql
-- 047_create_termos_entrega.sql

CREATE TABLE public.termos_entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimentacao_id UUID NOT NULL REFERENCES public.movimentacoes_estoque(id),
    recebedor_tipo TEXT NOT NULL CHECK (recebedor_tipo IN ('funcionario', 'beneficiario')),
    recebedor_id UUID NOT NULL,
    entregador_id UUID NOT NULL REFERENCES public.funcionarios(id),
    data_entrega TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_devolucao_prev TIMESTAMPTZ,
    data_devolucao_real TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('pendente', 'entregue', 'devolvido', 'atrasado')),
    assinatura_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.termos_entrega ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER tg_termos_entrega_updated_at BEFORE UPDATE ON public.termos_entrega FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY select_termos ON public.termos_entrega FOR SELECT USING (has_permissao('termos', 'listar'));
CREATE POLICY insert_termos ON public.termos_entrega FOR INSERT WITH CHECK (has_permissao('termos', 'criar'));
CREATE POLICY update_termos ON public.termos_entrega FOR UPDATE USING (has_permissao('termos', 'editar'));

-- Permissoes
INSERT INTO public.perfil_permissoes (perfil_id, modulo, acao, permitido) VALUES
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'termos', 'listar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'termos', 'criar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'termos', 'editar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'termos', 'listar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'termos', 'criar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'termos', 'editar', true);
```

### Migration 048: Supervisões e Fotos
Nome: `048_create_supervisoes.sql`

```sql
-- 048_create_supervisoes.sql

CREATE TABLE public.supervisoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nucleo_id UUID NOT NULL REFERENCES public.nucleos(id),
    coordenador_id UUID NOT NULL REFERENCES public.funcionarios(id),
    data_supervisao DATE NOT NULL,
    hora_entrada TIME NOT NULL,
    hora_saida TIME,
    beneficiarios_presentes INTEGER,
    beneficiarios_esperados INTEGER,
    professor_presente BOOLEAN,
    professores_ids UUID[],
    estrutura_avaliacao TEXT,
    estrutura_observacoes TEXT,
    materiais_avaliacao TEXT,
    materiais_observacoes TEXT,
    uniformes_avaliacao TEXT,
    uniformes_observacoes TEXT,
    grade_cumprida BOOLEAN,
    grade_observacoes TEXT,
    observacoes_gerais TEXT,
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE public.supervisoes_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisao_id UUID NOT NULL REFERENCES public.supervisoes(id),
    categoria TEXT NOT NULL CHECK (categoria IN ('espaco', 'material', 'equipe', 'atividade')),
    url TEXT NOT NULL,
    legenda TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.supervisoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisoes_fotos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER tg_supervisoes_updated_at BEFORE UPDATE ON public.supervisoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policies supervisoes
CREATE POLICY select_supervisoes ON public.supervisoes FOR SELECT USING (deleted_at IS NULL AND has_permissao('supervisoes', 'listar'));
CREATE POLICY insert_supervisoes ON public.supervisoes FOR INSERT WITH CHECK (has_permissao('supervisoes', 'criar'));
CREATE POLICY update_supervisoes ON public.supervisoes FOR UPDATE USING (has_permissao('supervisoes', 'editar'));
CREATE POLICY delete_supervisoes ON public.supervisoes FOR DELETE USING (has_permissao('supervisoes', 'excluir'));

-- Policies fotos
CREATE POLICY select_supervisoes_fotos ON public.supervisoes_fotos FOR SELECT USING (has_permissao('supervisoes', 'listar'));
CREATE POLICY insert_supervisoes_fotos ON public.supervisoes_fotos FOR INSERT WITH CHECK (has_permissao('supervisoes', 'criar'));
CREATE POLICY delete_supervisoes_fotos ON public.supervisoes_fotos FOR DELETE USING (has_permissao('supervisoes', 'editar'));

-- Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('supervisao-fotos', 'supervisao-fotos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Permissoes Storage
CREATE POLICY "Permitir leitura fotos" ON storage.objects FOR SELECT USING (bucket_id = 'supervisao-fotos' AND has_permissao('supervisoes', 'listar'));
CREATE POLICY "Permitir upload fotos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'supervisao-fotos' AND has_permissao('supervisoes', 'criar'));

-- Permissoes (Admin/Coordenador)
INSERT INTO public.perfil_permissoes (perfil_id, modulo, acao, permitido) VALUES
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'supervisoes', 'listar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'supervisoes', 'criar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'supervisoes', 'editar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'supervisoes', 'excluir', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'supervisoes', 'listar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'supervisoes', 'criar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'supervisoes', 'editar', true);
```

### Migration 049: Pendências Gerais
Nome: `049_create_pendencias_gerais.sql`

```sql
-- 049_create_pendencias_gerais.sql

CREATE TABLE public.pendencias_gerais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisao_id UUID REFERENCES public.supervisoes(id),
    nucleo_id UUID NOT NULL REFERENCES public.nucleos(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('estrutura', 'material', 'professor', 'beneficiario', 'outro')),
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    gravidade TEXT NOT NULL CHECK (gravidade IN ('baixa', 'media', 'alta', 'critica')),
    responsavel_id UUID REFERENCES public.funcionarios(id),
    prazo DATE,
    status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida', 'cancelada')),
    providencias TEXT,
    data_resolucao TIMESTAMPTZ,
    resolvido_por_id UUID REFERENCES public.funcionarios(id),
    observacoes_resolucao TEXT,
    created_by_id UUID NOT NULL REFERENCES public.funcionarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.pendencias_gerais ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER tg_pendencias_gerais_updated_at BEFORE UPDATE ON public.pendencias_gerais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY select_pendencias ON public.pendencias_gerais FOR SELECT USING (deleted_at IS NULL AND has_permissao('pendencias_gerais', 'listar'));
CREATE POLICY insert_pendencias ON public.pendencias_gerais FOR INSERT WITH CHECK (has_permissao('pendencias_gerais', 'criar'));
CREATE POLICY update_pendencias ON public.pendencias_gerais FOR UPDATE USING (has_permissao('pendencias_gerais', 'editar'));
CREATE POLICY delete_pendencias ON public.pendencias_gerais FOR DELETE USING (has_permissao('pendencias_gerais', 'excluir'));

INSERT INTO public.perfil_permissoes (perfil_id, modulo, acao, permitido) VALUES
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'pendencias_gerais', 'listar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'pendencias_gerais', 'criar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'pendencias_gerais', 'editar', true),
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'pendencias_gerais', 'excluir', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'pendencias_gerais', 'listar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'pendencias_gerais', 'criar', true),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'pendencias_gerais', 'editar', true),
('b9def33a-a2a0-477d-8580-ec213d642808', 'pendencias_gerais', 'listar', true),
('b9def33a-a2a0-477d-8580-ec213d642808', 'pendencias_gerais', 'editar', true); -- para dar baixa nas designadas
```

### Migration 050: Automations (pg_cron)
Nome: `050_automations_estoque_supervisao.sql`

```sql
-- 050_automations_estoque_supervisao.sql

-- 1. Termos Atrasados
CREATE OR REPLACE FUNCTION public.verificar_termos_atrasados() RETURNS void AS $$
BEGIN
    UPDATE public.termos_entrega
    SET status = 'atrasado', updated_at = now()
    WHERE status = 'pendente' 
      AND data_devolucao_prev < now() 
      AND data_devolucao_real IS NULL;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('verificar-termos-atrasados', '0 0 * * *', 'SELECT public.verificar_termos_atrasados();');

-- 2. Estoques Baixos (gera pendencia geral automática)
CREATE OR REPLACE FUNCTION public.verificar_estoques_baixos() RETURNS void AS $$
BEGIN
    INSERT INTO public.pendencias_gerais (nucleo_id, tipo, titulo, descricao, gravidade, created_by_id)
    SELECT 
        en.nucleo_id, 
        'material', 
        'Estoque baixo de ' || m.nome,
        'O material ' || m.nome || ' está com ' || en.quantidade_atual || ' em estoque. Mínimo: ' || m.estoque_minimo,
        'media',
        (SELECT id FROM public.funcionarios WHERE matricula = 'admin' LIMIT 1) -- fallback root
    FROM public.estoque_nucleos en
    JOIN public.materiais m ON en.material_id = m.id
    WHERE en.quantidade_atual < m.estoque_minimo
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('verificar-estoques-baixos', '0 8 * * *', 'SELECT public.verificar_estoques_baixos();');

-- 3. Lembrete de Rascunho
CREATE OR REPLACE FUNCTION public.lembrete_supervisoes_rascunho() RETURNS void AS $$
BEGIN
    -- Log ou notificação via trigger table (sistema de notificações a implementar depois)
    -- Por hora, apenas anota logs
    RAISE NOTICE 'Executando verificação de rascunhos.';
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('lembrete-supervisoes-rascunho', '0 18 * * *', 'SELECT public.lembrete_supervisoes_rascunho();');

-- 4. Trigger de Pendência Crítica na Supervisão
CREATE OR REPLACE FUNCTION public.gerar_pendencias_supervisao_critica() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'finalizada' AND OLD.status = 'rascunho' THEN
        IF NEW.estrutura_avaliacao IN ('ruim', 'critica') THEN
            INSERT INTO public.pendencias_gerais (supervisao_id, nucleo_id, tipo, titulo, descricao, gravidade, created_by_id)
            VALUES (NEW.id, NEW.nucleo_id, 'estrutura', 'Problema Crítico de Estrutura', NEW.estrutura_observacoes, 'critica', NEW.coordenador_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_supervisao_critica
AFTER UPDATE ON public.supervisoes
FOR EACH ROW EXECUTE FUNCTION public.gerar_pendencias_supervisao_critica();
```

---

## 6. Frontend — Services

Implementar de acordo com o padrão Supabase SSR Client para o App Router Next.js.
Local: `src/services/`

### 6.1 `materiais.service.ts`

```typescript
import { createClient } from '@/lib/supabase/client';
import { getSupabase } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { paginar } from '@/utils/pagination';

export type MaterialApi = {
  id: string;
  nome: string;
  descricao: string | null;
  unidadeMedida: string;
  estoqueMinimo: number;
  fotoUrl: string | null;
  categoria: string;
  ativo: boolean;
};

const mapMaterial = (r: any): MaterialApi => ({
  id: r.id,
  nome: r.nome,
  descricao: r.descricao,
  unidadeMedida: r.unidade_medida,
  estoqueMinimo: r.estoque_minimo,
  fotoUrl: r.foto_url,
  categoria: r.categoria,
  ativo: r.ativo,
});

const toMaterialRow = (b: Partial<MaterialApi>): Partial<Database['public']['Tables']['materiais']['Insert']> => ({
  nome: b.nome,
  descricao: b.descricao,
  unidade_medida: b.unidadeMedida,
  estoque_minimo: b.estoqueMinimo,
  foto_url: b.fotoUrl,
  categoria: b.categoria,
  ativo: b.ativo,
});

export const materiaisService = {
  async list({ pagina = 1, limite = 10, busca = '', ativo }: { pagina?: number; limite?: number; busca?: string; ativo?: boolean }) {
    const sb = await getSupabase();
    let q = sb.from('materiais').select('*', { count: 'exact' }).is('deleted_at', null);

    if (busca) q = q.ilike('nome', `%${busca}%`);
    if (ativo !== undefined) q = q.eq('ativo', ativo);

    const { data, count, error } = await paginar(q, pagina, limite);
    if (error) throw error;

    return {
      data: data.map(mapMaterial),
      total: count || 0,
      pagina,
      limite,
    };
  },

  async get(id: string) {
    const sb = await getSupabase();
    const { data, error } = await sb.from('materiais').select('*').eq('id', id).single();
    if (error) throw error;
    return mapMaterial(data);
  },

  async create(body: Omit<MaterialApi, 'id'>) {
    const sb = createClient();
    const { data, error } = await sb.from('materiais').insert(toMaterialRow(body)).select('*').single();
    if (error) throw error;
    return mapMaterial(data);
  },

  async update(id: string, body: Partial<MaterialApi>) {
    const sb = createClient();
    const { data, error } = await sb.from('materiais').update(toMaterialRow(body)).eq('id', id).select('*').single();
    if (error) throw error;
    return mapMaterial(data);
  },

  async remove(id: string) {
    const sb = createClient();
    const { error } = await sb.from('materiais').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async uploadFoto(file: File) {
    const sb = createClient();
    const ext = file.name.split('.').pop();
    const path = `materiais/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { data, error } = await sb.storage.from('supervisao-fotos').upload(path, file, { upsert: true });
    if (error) throw error;
    return sb.storage.from('supervisao-fotos').getPublicUrl(data.path).data.publicUrl;
  }
};
```

### 6.2 `movimentacoes.service.ts`

Seguir mesmo padrão:
1. `list()` com filtros de `nucleo_id` e `tipo`.
2. `create()` inserindo na tabela `movimentacoes_estoque`. Trigger processa saldo.
3. Não expor `update` ou `remove` para movimentação de estoque finalizada (segurança).

### 6.3 `pendenciasGerais.service.ts`

Seguir padrão CRUD, mais método de aprovação:
`resolverPendencia(id: string, providencias: string, fotoUrl?: string)` chamando `.update({ status: 'resolvida', providencias, data_resolucao: now() })`.

---

## 7. Frontend — Rotas e Telas

Estrutura App Router. Todas as páginas clientes devem estar em `src/app/(dashboard)/`.

*   `/estoque` — Dashboard resumido (cards de estoque baixo).
*   `/estoque/materiais` — Tabela CRUD.
*   `/estoque/movimentacoes` — Histórico e filtro avançado.
*   `/estoque/movimentacoes/nova` — Formulário de entrada/saída.
*   `/supervisoes` — Lista em tabela e view de calendário.
*   `/supervisoes/nova` — Form Wizard de Múltiplos Passos.
*   `/pendencias-gerais` — View Kanban usando `dnd-kit` ou listas separadas.

### Wireframe ASCII - Form Wizard Supervisão

```
+-------------------------------------------------------------+
| Nova Supervisão - Núcleo Centro                             |
+-------------------------------------------------------------+
| [Passo 1: Presença] -> Passo 2: Estrutura -> Passo 3: Fotos |
|                                                             |
| Data: [ 10/10/2023 ]   Entrada: [ 14:00 ]                   |
|                                                             |
| Beneficiários Esperados: [ 30 ]  Presentes: [ 25 ]          |
|                                                             |
| Professores Presentes:                                      |
| [X] João Silva                                              |
| [ ] Maria Souza                                             |
|                                                             |
|                   [ Cancelar ]     [ Próximo Passo -> ]     |
+-------------------------------------------------------------+
```

---

## 8. Frontend — Componentes

Construir componentes client-side ricos em interatividade.

*   `SupervisaoFormWizard`: Usar `react-hook-form` com modo modo `mode: 'onChange'`. Quebrar schema do Zod em parts. Manter status de `rascunho` via Auto-Save.
*   `KanbanPendencias`: Criar colunas (Aberta, Em Andamento, Resolvida). Mapear array do backend.
*   `MovimentacaoForm`: Usar seletor assíncrono para buscar materiais e núcleos destino (se transferência).

---

## 9. Frontend — Sidebar

Atualizar `src/components/layout/Sidebar.tsx` utilizando padrão de collapsibles existente.

```tsx
// Exemplo inclusão na Sidebar
const secoes = [
  // ... outras
  {
    titulo: 'Estoque',
    icone: Box,
    itens: [
      { label: 'Visão Geral', href: '/estoque' },
      { label: 'Materiais', href: '/estoque/materiais' },
      { label: 'Movimentações', href: '/estoque/movimentacoes' },
      { label: 'Termos de Entrega', href: '/estoque/termos' },
    ]
  },
  {
    titulo: 'Qualidade',
    icone: CheckSquare,
    itens: [
      { label: 'Supervisões', href: '/supervisoes' },
      { label: 'Pendências Gerais', href: '/pendencias-gerais' },
    ]
  }
];
```

---

## 10. Schemas de Validação (Zod)

Utilizar Zod para validar formulários. Exemplo Supervisão:

```typescript
import { z } from 'zod';

export const supervisaoSchema = z.object({
  nucleoId: z.string().uuid('Núcleo inválido'),
  dataSupervisao: z.string().min(1, 'Data obrigatória'),
  horaEntrada: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Hora inválida'),
  horaSaida: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional().nullable(),
  beneficiariosPresentes: z.number().min(0).optional(),
  beneficiariosEsperados: z.number().min(0).optional(),
  estruturaAvaliacao: z.enum(['excelente', 'boa', 'regular', 'ruim', 'critica']).optional(),
  // ...
});
```

---

## 11. Fluxos de Navegação

1.  **Fluxo de Controle de Estoque:**
    Almoxarife entra -> Acessa Materiais -> Cadastra "Bola de Futsal Penalty" -> Vai em Movimentações -> Lança "Entrada" de 20 un. para o Núcleo A.
2.  **Fluxo de Supervisão:**
    Coordenador chega no núcleo -> Abre app no tablet -> Vai em Nova Supervisão -> Salva rascunho. Bate fotos no Passo 3 do Wizard -> Finaliza. Se avaliou estrutura como crítica -> Sistema lança Pendência Geral -> Volta para listagem.
3.  **Fluxo de Resolução de Pendência:**
    Professor abre app -> Vê pendência "Cesta quebrada" na sua dashboard -> Conserta com fita -> Muda status para Resolvida -> Anexa foto do conserto -> Salva.

---

## 12. Casos de Teste

Verificar manualmente durante implementação:
*   [ ] CT-01: Inserir Material sem nome (Deve barrar Zod).
*   [ ] CT-02: Saída de material maior que estoque atual (Deve barrar na Trigger Postgres).
*   [ ] CT-03: Transferência sem núcleo destino (Deve barrar na Trigger).
*   [ ] CT-04: Coordenador acessa pendências de núcleo X, sendo que perfil é liberado (RLS Check).
*   [ ] CT-05: Professor tenta editar supervisão (Deve dar erro RLS `has_permissao('supervisoes', 'editar')` false).

---

## 13. Regras de Negócio e Segurança

Impor regras no nível do banco via RLS e Triggers:
1.  **Mutabilidade Histórica**: `movimentacoes_estoque` não pode sofrer `UPDATE` ou `DELETE` genérico. Apenas `INSERT`.
2.  **Acesso Granular**: Funções RLS `has_permissao` baseadas no ID do JWT `auth.jwt() -> 'app_metadata' -> 'perfil_id'`.
3.  **Supressão Lógica (Soft Delete)**: `materiais`, `supervisoes` e `pendencias_gerais` usam `deleted_at`. Views frontends devem filtrar ou usar view/policies com `deleted_at IS NULL`.

---

## 14. Jobs Automáticos (pg_cron)

Configurados na migration `050`. Assegurar que a extensão do `pg_cron` esteja ativada na org do Supabase. Executar rotinas diárias e noturnas que limpam rascunhos, atualizam termos e disparam alertas, sem onerar requisições HTTP do Next.js.

---

## 15. Roadmap de Implementação

Trabalhar de forma faseada.

*   **Fase 1: Database Setup**. Rodar SQL das migrations 045 a 050. Testar triggers isoladamente no SQL Editor.
*   **Fase 2: Services e Contextos**. Criar functions `.ts` integrando aos serviços front-end.
*   **Fase 3: CRUD Materiais e Movimentações**. UI do Estoque.
*   **Fase 4: Formulário de Supervisão**. Criar UI do Wizard. Ligar uploader do Supabase Storage.
*   **Fase 5: Pendências Gerais e Kanban**. Conectar pendências e implementar drag-and-drop.

---

## 16. Riscos e Mitigações

*   **Risco**: Triggers de estoque conflitarem em inserções simultâneas massivas.
    *   **Mitigação**: Utilizado `ON CONFLICT DO UPDATE`. Garantido lock de linha implícito no PG.
*   **Risco**: Bloqueio de UI no upload de fotos da supervisão devido a baixa conexão de internet em campo.
    *   **Mitigação**: Next.js client component usando compressão de imagem antes do upload e status progress bar assíncrona.

-- Fim do Documento --
