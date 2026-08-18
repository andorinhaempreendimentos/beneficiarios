# Arquitetura — Módulos de Estoque e Supervisão

## 1. Modelo de Dados

### Tabela: `materiais`
```sql
id                UUID PRIMARY KEY
nome              VARCHAR(200) NOT NULL
descricao         TEXT
unidade_medida    VARCHAR(50)  -- "unidade", "kg", "litro", "caixa"
estoque_minimo    INTEGER DEFAULT 0
foto_url          TEXT
categoria         VARCHAR(100) -- "esportivo", "limpeza", "escritório", "uniforme"
ativo             BOOLEAN DEFAULT true
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### Tabela: `estoque_nucleos`
```sql
id                UUID PRIMARY KEY
material_id       UUID → materiais(id)
nucleo_id         UUID → nucleos(id)
quantidade_atual  INTEGER DEFAULT 0
localizacao       VARCHAR(200) -- "armário A", "sala 3"
created_at        TIMESTAMP
updated_at        TIMESTAMP

UNIQUE(material_id, nucleo_id)
```

### Tabela: `movimentacoes_estoque`
```sql
id                   UUID PRIMARY KEY
material_id          UUID → materiais(id)
nucleo_id            UUID → nucleos(id)
tipo                 VARCHAR(50) -- "entrada", "saida", "transferencia", "perda", "dano"
quantidade           INTEGER NOT NULL
quantidade_anterior  INTEGER
quantidade_posterior INTEGER
responsavel_id       UUID → funcionarios(id)
beneficiario_id      UUID → beneficiarios(id) NULL  -- se for entrega para beneficiário
destino_nucleo_id    UUID → nucleos(id) NULL  -- se tipo = "transferencia"
motivo               TEXT
observacoes          TEXT
termo_assinado       BOOLEAN DEFAULT false
foto_comprovante_url TEXT
data_movimentacao    TIMESTAMP NOT NULL
created_at           TIMESTAMP
```

### Tabela: `termos_entrega`
```sql
id                  UUID PRIMARY KEY
movimentacao_id     UUID → movimentacoes_estoque(id)
recebedor_tipo      VARCHAR(50) -- "funcionario", "beneficiario"
recebedor_id        UUID NOT NULL
entregador_id       UUID → funcionarios(id)
data_entrega        TIMESTAMP
data_devolucao_prev TIMESTAMP NULL
data_devolucao_real TIMESTAMP NULL
status              VARCHAR(50) DEFAULT 'pendente' -- "pendente", "entregue", "devolvido", "atrasado"
assinatura_url      TEXT
observacoes         TEXT
created_at          TIMESTAMP
```

### Tabela: `supervisoes`
```sql
id                       UUID PRIMARY KEY
nucleo_id                UUID → nucleos(id)
supervisor_id            UUID → funcionarios(id)
data_supervisao          DATE NOT NULL
hora_entrada             TIME
hora_saida               TIME
beneficiarios_presentes  INTEGER
beneficiarios_esperados  INTEGER
professor_presente       BOOLEAN
professores_ids          UUID[] -- array de funcionarios presentes
estrutura_avaliacao      VARCHAR(50) -- "otima", "boa", "regular", "ruim", "critica"
estrutura_observacoes    TEXT
materiais_avaliacao      VARCHAR(50)
materiais_observacoes    TEXT
uniformes_avaliacao      VARCHAR(50)
uniformes_observacoes    TEXT
grade_cumprida           BOOLEAN
grade_observacoes        TEXT
observacoes_gerais       TEXT
status                   VARCHAR(50) DEFAULT 'rascunho' -- "rascunho", "finalizada"
created_at               TIMESTAMP
updated_at               TIMESTAMP
```

### Tabela: `supervisoes_fotos`
```sql
id              UUID PRIMARY KEY
supervisao_id   UUID → supervisoes(id)
categoria       VARCHAR(50) -- "espaco", "material", "equipe", "atividade"
url             TEXT NOT NULL
legenda         TEXT
ordem           INTEGER DEFAULT 0
created_at      TIMESTAMP
```

### Tabela: `pendencias`
```sql
id                    UUID PRIMARY KEY
supervisao_id         UUID → supervisoes(id) NULL -- pode vir de supervisão ou manual
nucleo_id             UUID → nucleos(id)
tipo                  VARCHAR(100) -- "estrutura", "material", "professor", "beneficiario", "outro"
titulo                VARCHAR(200) NOT NULL
descricao             TEXT NOT NULL
gravidade             VARCHAR(50) -- "baixa", "media", "alta", "critica"
responsavel_id        UUID → funcionarios(id) NULL
prazo                 DATE NULL
status                VARCHAR(50) DEFAULT 'aberta' -- "aberta", "em_andamento", "resolvida", "cancelada"
providencias          TEXT
data_resolucao        TIMESTAMP NULL
resolvido_por_id      UUID → funcionarios(id) NULL
observacoes_resolucao TEXT
created_by_id         UUID → funcionarios(id)
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

---

## 2. Backend — Novos Endpoints (NestJS)

### `/materiais`
```
GET    /materiais                    # lista todos materiais
GET    /materiais/:id                # detalhe material
POST   /materiais                    # criar material
PATCH  /materiais/:id                # atualizar material
DELETE /materiais/:id                # desativar material
```

### `/estoque`
```
GET    /estoque                      # visão geral por núcleo
GET    /estoque/nucleo/:nucleoId     # estoque de um núcleo específico
GET    /estoque/material/:materialId # onde está esse material (todos núcleos)
GET    /estoque/alertas              # materiais abaixo do mínimo
```

### `/movimentacoes`
```
GET    /movimentacoes                          # histórico completo (filtros: nucleo, material, tipo, período)
POST   /movimentacoes/entrada                  # registrar entrada
POST   /movimentacoes/saida                    # registrar saída
POST   /movimentacoes/transferencia            # transferir entre núcleos
POST   /movimentacoes/perda-dano               # registrar perda/dano
GET    /movimentacoes/:id                      # detalhe
```

### `/termos`
```
GET    /termos                                 # lista termos (filtros: status, recebedor, núcleo)
GET    /termos/:id                             # detalhe termo
POST   /termos                                 # criar termo de entrega
PATCH  /termos/:id/devolver                    # registrar devolução
PATCH  /termos/:id/assinar                     # upload assinatura
GET    /termos/pendentes                       # termos sem devolução
```

### `/supervisoes`
```
GET    /supervisoes                            # lista (filtros: núcleo, supervisor, período)
GET    /supervisoes/:id                        # detalhe
POST   /supervisoes                            # criar supervisão
PATCH  /supervisoes/:id                        # atualizar supervisão
POST   /supervisoes/:id/fotos                  # upload foto
DELETE /supervisoes/:id/fotos/:fotoId          # remover foto
PATCH  /supervisoes/:id/finalizar              # marcar como finalizada
GET    /supervisoes/nucleo/:nucleoId/historico # histórico por núcleo
```

### `/pendencias`
```
GET    /pendencias                             # lista (filtros: núcleo, status, tipo, gravidade)
GET    /pendencias/:id                         # detalhe
POST   /pendencias                             # criar pendência
PATCH  /pendencias/:id                         # atualizar
PATCH  /pendencias/:id/atribuir                # atribuir responsável
PATCH  /pendencias/:id/resolver                # marcar como resolvida
GET    /pendencias/nucleo/:nucleoId            # pendências de um núcleo
GET    /pendencias/responsavel/:funcId         # pendências de um responsável
GET    /pendencias/criticas                    # pendências críticas abertas
```

### `/relatorios`
```
GET    /relatorios/supervisoes/mensal          # relatório consolidado do mês
  Query params: ano, mes, nucleoId (opcional)
  
GET    /relatorios/estoque/movimentacao        # relatório de movimentações período
  Query params: dataInicio, dataFim, nucleoId, materialId
  
GET    /relatorios/pendencias/status           # dashboard de pendências
  Query params: nucleoId, periodo
```

---

## 3. Frontend — Novas Rotas e Telas

### `/estoque` (Admin + Coordenador)
```
/estoque                           # Dashboard: visão geral, alertas, gráficos
/estoque/materiais                 # CRUD de materiais
/estoque/materiais/novo            # Cadastrar material
/estoque/materiais/:id/editar      # Editar material
/estoque/nucleos                   # Estoque por núcleo (cards)
/estoque/nucleos/:id               # Detalhe estoque de um núcleo
/estoque/movimentacoes             # Histórico de movimentações (tabela filtros)
/estoque/movimentacoes/nova        # Registrar movimentação
/estoque/termos                    # Lista de termos de entrega/retirada
/estoque/termos/novo               # Criar termo
/estoque/termos/:id                # Detalhe termo + assinatura
```

### `/supervisoes` (Admin + Coordenador)
```
/supervisoes                       # Lista de supervisões (calendário + tabela)
/supervisoes/nova                  # Criar supervisão
/supervisoes/:id                   # Detalhe supervisão (readonly se finalizada)
/supervisoes/:id/editar            # Editar supervisão (apenas rascunho)
/supervisoes/relatorio-mensal      # Relatório consolidado mensal
```

### `/pendencias` (Admin + Coordenador + Professor)
```
/pendencias                        # Lista de pendências (kanban: abertas/andamento/resolvidas)
/pendencias/nova                   # Criar pendência manual
/pendencias/:id                    # Detalhe pendência
/pendencias/minhas                 # Pendências atribuídas ao usuário logado
```

### Ajustes em rotas existentes
```
/nucleos/:id                       # Adicionar aba "Estoque" e "Supervisões"
/professor                         # Adicionar card "Pendências" no dashboard
```

---

## 4. Permissões (RBAC)

### Admin
- Acesso total a estoque, supervisões, pendências, relatórios

### Coordenador
- Criar/editar supervisões
- Visualizar estoque (read-only)
- Criar/gerenciar pendências
- Atribuir responsáveis
- Gerar relatórios

### Professor
- Visualizar pendências atribuídas a ele
- Registrar resolução de pendências
- Visualizar estoque do seu núcleo (read-only)

### Almoxarife (novo perfil?)
- CRUD de materiais
- Registrar movimentações
- Criar termos
- Visualizar alertas

---

## 5. Integrações e Automações

### Alertas automáticos
- Email/notificação quando estoque < mínimo
- Email quando termo de devolução atrasado
- Email quando pendência crítica criada

### Workflows
- Supervisão finalizada → gera pendências automaticamente se estrutura/materiais = "ruim" ou "crítica"
- Movimentação com foto obrigatória se tipo = "perda" ou "dano"
- Pendência crítica → notifica admin imediatamente

### Relatórios agendados
- Todo dia 1º do mês: enviar relatório consolidado de supervisões do mês anterior
- Toda segunda: resumo de pendências abertas por núcleo

---

## 6. Priorização de Implementação

### Fase 1 — MVP Estoque (2-3 semanas)
1. Tabelas: `materiais`, `estoque_nucleos`, `movimentacoes_estoque`
2. Backend: CRUD materiais + movimentações básicas
3. Frontend: `/estoque/materiais`, `/estoque/nucleos`, `/estoque/movimentacoes`
4. Permissões: Admin + novo perfil Almoxarife

### Fase 2 — Termos de Entrega (1 semana)
1. Tabela: `termos_entrega`
2. Backend: CRUD termos + upload assinatura
3. Frontend: `/estoque/termos`
4. Alertas de devoluções atrasadas

### Fase 3 — Supervisões (2-3 semanas)
1. Tabelas: `supervisoes`, `supervisoes_fotos`
2. Backend: CRUD supervisões + upload fotos categorizado
3. Frontend: `/supervisoes` (formulário completo)
4. Integração com núcleos/professores

### Fase 4 — Pendências (1-2 semanas)
1. Tabela: `pendencias`
2. Backend: CRUD + atribuição + resolução
3. Frontend: `/pendencias` (kanban)
4. Integração com supervisões (geração automática)

### Fase 5 — Relatórios (1-2 semanas)
1. Backend: endpoints de relatórios consolidados
2. Frontend: `/supervisoes/relatorio-mensal`, dashboards
3. PDFs exportáveis
4. Agendamento de envios

---

## 7. Estimativa Total

- **Banco de dados**: 7 tabelas novas
- **Backend**: ~35 endpoints novos
- **Frontend**: ~15 rotas/telas novas
- **Tempo total**: 7-11 semanas (depende de recursos)

---

## 8. Dependências Técnicas

- **Upload de fotos**: já tem (Cloudflare R2)
- **Assinatura digital**: precisa adicionar lib (ex: `signature_pad`)
- **PDF**: precisa adicionar lib (ex: `pdfmake` ou `puppeteer`)
- **Notificações**: precisa implementar sistema de email (NodeMailer + templates)

---

## 9. Detalhamento Técnico — Componentes e Validações

### Componentes Reutilizáveis

#### `MaterialCard`
```tsx
// Card de material com foto, nome, estoque atual, alerta se < mínimo
props: material, estoqueAtual, estoqueMinimo, onClick
```

#### `MovimentacaoForm`
```tsx
// Formulário de movimentação com seleção de tipo, material, quantidade, motivo
// Campos condicionais: destino_nucleo_id se tipo=transferencia, beneficiario_id se saída para beneficiário
props: nucleoId, onSubmit, materiais[]
validations:
  - quantidade > 0
  - quantidade <= estoqueAtual (se saída/transferência)
  - foto obrigatória se tipo = perda/dano
  - destino_nucleo_id obrigatório se tipo = transferencia
```

#### `TermoEntregaModal`
```tsx
// Modal com preview do termo, campo de assinatura digital, campos de observação
props: termo, onAssinar, onFechar
features:
  - canvas assinatura (signature_pad)
  - preview PDF antes de finalizar
  - campos: data_entrega, data_devolucao_prev
```

#### `SupervisaoFormWizard`
```tsx
// Wizard multi-etapa: dados básicos → avaliações → fotos → finalização
steps:
  1. Núcleo, data, horários, presença
  2. Avaliações (estrutura, materiais, uniformes, grade)
  3. Upload de fotos categorizadas
  4. Observações gerais + pendências sugeridas
validations:
  - beneficiarios_presentes <= beneficiarios_esperados
  - hora_saida > hora_entrada
  - pelo menos 1 foto obrigatória se avaliação = ruim/critica
```

#### `PendenciaKanbanBoard`
```tsx
// Board Kanban com 4 colunas: Abertas / Em Andamento / Resolvidas / Canceladas
props: pendencias[], onMoverCard, onEditarPendencia
features:
  - drag & drop entre colunas
  - filtros: núcleo, tipo, gravidade, responsável
  - badges de gravidade com cores
  - contador de dias em aberto
```

#### `EstoqueAlertBadge`
```tsx
// Badge de alerta visual quando estoque < mínimo
props: estoqueAtual, estoqueMinimo
colors:
  - verde: estoque >= minimo * 2
  - amarelo: estoque >= minimo e < minimo * 2
  - vermelho: estoque < minimo
  - cinza: sem estoque
```

---

## 10. Schemas de Validação (Zod)

### `materialSchema`
```typescript
{
  nome: z.string().min(3).max(200),
  descricao: z.string().optional(),
  unidade_medida: z.enum(["unidade", "kg", "litro", "caixa", "metro", "pacote"]),
  estoque_minimo: z.number().int().min(0).default(0),
  categoria: z.enum(["esportivo", "limpeza", "escritório", "uniforme", "outro"]),
  foto_url: z.string().url().optional()
}
```

### `movimentacaoSchema`
```typescript
{
  material_id: z.string().uuid(),
  nucleo_id: z.string().uuid(),
  tipo: z.enum(["entrada", "saida", "transferencia", "perda", "dano"]),
  quantidade: z.number().int().positive(),
  destino_nucleo_id: z.string().uuid().optional(),
  beneficiario_id: z.string().uuid().optional(),
  motivo: z.string().min(10).max(500),
  observacoes: z.string().optional(),
  foto_comprovante_url: z.string().url().optional(),
  data_movimentacao: z.date()
}
// Regras condicionais:
// - se tipo = transferencia → destino_nucleo_id obrigatório
// - se tipo = perda || dano → foto_comprovante_url obrigatório
```

### `termoEntregaSchema`
```typescript
{
  movimentacao_id: z.string().uuid(),
  recebedor_tipo: z.enum(["funcionario", "beneficiario"]),
  recebedor_id: z.string().uuid(),
  entregador_id: z.string().uuid(),
  data_entrega: z.date(),
  data_devolucao_prev: z.date().optional(),
  observacoes: z.string().max(500).optional()
}
// Validação: data_devolucao_prev >= data_entrega
```

### `supervisaoSchema`
```typescript
{
  nucleo_id: z.string().uuid(),
  supervisor_id: z.string().uuid(),
  data_supervisao: z.date(),
  hora_entrada: z.string().regex(/^\d{2}:\d{2}$/),
  hora_saida: z.string().regex(/^\d{2}:\d{2}$/),
  beneficiarios_presentes: z.number().int().min(0),
  beneficiarios_esperados: z.number().int().min(0),
  professor_presente: z.boolean(),
  professores_ids: z.array(z.string().uuid()),
  estrutura_avaliacao: z.enum(["otima", "boa", "regular", "ruim", "critica"]),
  estrutura_observacoes: z.string().optional(),
  materiais_avaliacao: z.enum(["otima", "boa", "regular", "ruim", "critica"]),
  materiais_observacoes: z.string().optional(),
  uniformes_avaliacao: z.enum(["otima", "boa", "regular", "ruim", "critica"]),
  uniformes_observacoes: z.string().optional(),
  grade_cumprida: z.boolean(),
  grade_observacoes: z.string().optional(),
  observacoes_gerais: z.string().optional()
}
// Validações:
// - hora_saida > hora_entrada
// - beneficiarios_presentes <= beneficiarios_esperados
// - se professor_presente = true → professores_ids.length > 0
// - se avaliacao = ruim/critica → observacoes obrigatória
```

### `pendenciaSchema`
```typescript
{
  supervisao_id: z.string().uuid().optional(),
  nucleo_id: z.string().uuid(),
  tipo: z.enum(["estrutura", "material", "professor", "beneficiario", "outro"]),
  titulo: z.string().min(5).max(200),
  descricao: z.string().min(10),
  gravidade: z.enum(["baixa", "media", "alta", "critica"]),
  responsavel_id: z.string().uuid().optional(),
  prazo: z.date().optional(),
  providencias: z.string().optional()
}
// Validação: prazo >= data_atual (se informado)
```

---

## 11. Fluxos de Navegação

### Fluxo 1: Registrar Movimentação de Entrada
```
/estoque/nucleos/:id
  → botão "Registrar Entrada"
  → modal MovimentacaoForm (tipo=entrada)
  → preencher: material, quantidade, motivo
  → submit
  → atualiza estoque_nucleos.quantidade_atual
  → registra movimentacoes_estoque
  → volta para /estoque/nucleos/:id com toast sucesso
```

### Fluxo 2: Criar Termo de Entrega para Beneficiário
```
/estoque/nucleos/:id
  → botão "Registrar Saída com Termo"
  → modal MovimentacaoForm (tipo=saida)
  → selecionar: material, quantidade, beneficiario
  → submit movimentação
  → abre automaticamente TermoEntregaModal
  → preencher: data_entrega, data_devolucao_prev, assinatura
  → gera PDF do termo
  → salva termo_entrega
  → volta com toast + link para download PDF
```

### Fluxo 3: Criar Supervisão Completa
```
/supervisoes
  → botão "Nova Supervisão"
  → /supervisoes/nova (SupervisaoFormWizard)
  
  Step 1: Dados Básicos
    - selecionar núcleo (dropdown)
    - data supervisão (date picker)
    - horários entrada/saída (time picker)
    - presença: beneficiários presentes/esperados (number input)
    - professores presentes (multi-select funcionarios com cargo=professor)
    
  Step 2: Avaliações
    - estrutura: select (ótima/boa/regular/ruim/crítica) + textarea observações
    - materiais: select + textarea
    - uniformes: select + textarea
    - grade cumprida: checkbox + textarea observações
    
  Step 3: Fotos
    - upload múltiplo com categorização (espaço/material/equipe/atividade)
    - drag reorder para definir ordem
    - campo legenda por foto
    
  Step 4: Finalização
    - observações gerais (textarea)
    - preview de pendências sugeridas (geradas automático se avaliação ruim/crítica)
    - botão "Salvar Rascunho" ou "Finalizar"
    
  → submit
  → se finalizar: status = finalizada, gera pendências sugeridas
  → redireciona para /supervisoes/:id (readonly)
```

### Fluxo 4: Resolver Pendência (Professor)
```
/pendencias/minhas
  → lista pendências atribuídas ao usuário
  → clicar card pendência
  → /pendencias/:id
  → botão "Registrar Resolução"
  → modal com:
    - textarea providencias tomadas
    - data resolução (default hoje)
    - campo observações
  → submit
  → atualiza pendencia.status = resolvida
  → registra data_resolucao, resolvido_por_id
  → volta para /pendencias/minhas com toast
```

### Fluxo 5: Dashboard de Estoque com Alertas
```
/estoque
  → carrega visão geral:
    - card "Materiais Cadastrados" (count)
    - card "Alertas Ativos" (count materiais abaixo mínimo)
    - card "Movimentações Hoje" (count)
    - card "Termos Pendentes Devolução" (count)
  
  → seção "Alertas de Estoque Baixo"
    - lista materiais com estoque < mínimo
    - por núcleo, com badge vermelho
    - botão "Solicitar Reposição" (cria pendência tipo=material automaticamente)
  
  → seção "Movimentações Recentes"
    - últimas 10 movimentações
    - filtros: núcleo, tipo, período
  
  → gráfico "Movimentações por Tipo (últimos 30 dias)"
    - bar chart: entrada vs saída vs transferência
```

---

## 12. Casos de Teste Críticos

### Estoque
1. ✅ Criar material com estoque mínimo = 10
2. ✅ Registrar entrada de 50 unidades no Núcleo A
3. ✅ Registrar saída de 45 unidades → deve gerar alerta (5 < 10)
4. ✅ Tentar registrar saída de 10 unidades → deve falhar (estoque insuficiente)
5. ✅ Transferir 3 unidades de Núcleo A para Núcleo B → ambos estoques atualizados
6. ✅ Registrar perda sem foto → deve falhar validação
7. ✅ Registrar perda com foto → sucesso, quantidade_anterior/posterior registrado

### Termos de Entrega
1. ✅ Criar termo com data_devolucao_prev = ontem → deve falhar
2. ✅ Criar termo válido → status = pendente
3. ✅ Passar data_devolucao_prev → status = atrasado (job automático)
4. ✅ Registrar devolução → status = devolvido, data_devolucao_real preenchida
5. ✅ Gerar PDF do termo com dados completos

### Supervisões
1. ✅ Criar supervisão com hora_saida < hora_entrada → falha
2. ✅ Criar supervisão com beneficiarios_presentes > esperados → falha
3. ✅ Marcar estrutura = crítica sem observações → falha validação
4. ✅ Finalizar supervisão com avaliação crítica → gera pendência automática tipo=estrutura gravidade=critica
5. ✅ Tentar editar supervisão finalizada → deve bloquear (apenas visualização)
6. ✅ Upload de 10 fotos categorizadas → salva supervisoes_fotos com ordem

### Pendências
1. ✅ Criar pendência com prazo no passado → falha
2. ✅ Atribuir responsável → notificação enviada
3. ✅ Mover pendência aberta → em_andamento (drag kanban)
4. ✅ Resolver pendência sem preencher providências → falha
5. ✅ Filtrar pendências críticas abertas → retorna apenas gravidade=critica e status=aberta
6. ✅ Listar pendências por responsável → retorna apenas do usuário

### Permissões
1. ✅ Professor tenta acessar /estoque/materiais/novo → 403 Forbidden
2. ✅ Coordenador tenta registrar movimentação → 403 (apenas Admin/Almoxarife)
3. ✅ Coordenador cria supervisão → sucesso
4. ✅ Professor acessa /pendencias/minhas → vê apenas atribuídas a ele
5. ✅ Admin acessa tudo → sucesso

---

## 13. Wireframes e Layout — Principais Telas

### Dashboard Estoque (`/estoque`)
```
┌─────────────────────────────────────────────────────────────┐
│ Estoque — Visão Geral                    🔍 [buscar...]     │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│ │ 📦       │  │ ⚠️       │  │ 📊       │  │ 📋       │    │
│ │ 143      │  │ 12       │  │ 28       │  │ 5        │    │
│ │ Materiais│  │ Alertas  │  │ Moviment.│  │ Termos   │    │
│ │          │  │ Ativos   │  │ Hoje     │  │ Pendentes│    │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Alertas de Estoque Baixo            [ver todos →]       │
│ ┌───────────────────────────────────────────────────┐      │
│ │ 🏐 Bola de Vôlei          Núcleo Centro    [3/10] │ 🔴  │
│ │ 🎽 Coletes Treino         Núcleo Norte     [1/5]  │ 🔴  │
│ │ 📏 Fita Métrica           Núcleo Sul       [4/8]  │ 🟡  │
│ └───────────────────────────────────────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│ 📊 Movimentações por Tipo (últimos 30 dias)                │
│ ┌─────────────────────────────────────────────────────┐    │
│ │     ███████████████████████ Entrada (145)           │    │
│ │     ████████████ Saída (78)                         │    │
│ │     ██████ Transferência (32)                       │    │
│ │     ███ Perda/Dano (15)                             │    │
│ └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│ 📋 Movimentações Recentes                                  │
│ Filtros: [Núcleo ▼] [Tipo ▼] [Período ▼]                  │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ Data       │Tipo    │Material      │Núcleo  │Qtd   │    │
│ │ 17/08 14h  │Entrada │Bola Futsal   │Centro  │+20   │    │
│ │ 17/08 11h  │Saída   │Coletes       │Norte   │-5    │    │
│ │ 16/08 16h  │Transfer│Cones Treino  │Sul→Ctr │10    │    │
│ │ 16/08 09h  │Dano    │Rede Vôlei    │Leste   │-1    │    │
│ └─────────────────────────────────────────────────────┘    │
│                                   [1] 2 3 ... 12  [→]      │
└─────────────────────────────────────────────────────────────┘
```

### Lista de Materiais (`/estoque/materiais`)
```
┌─────────────────────────────────────────────────────────────┐
│ Materiais                    🔍 [buscar...]  [+ Novo]       │
├─────────────────────────────────────────────────────────────┤
│ Filtros: [Categoria ▼] [Status ▼]                          │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│ │ [foto]   │  │ [foto]   │  │ [foto]   │  │ [foto]   │    │
│ │          │  │          │  │          │  │          │    │
│ │ Bola     │  │ Coletes  │  │ Cones    │  │ Apito    │    │
│ │ Futsal   │  │ Treino   │  │ Sinaliz. │  │ Prof.    │    │
│ │          │  │          │  │          │  │          │    │
│ │ Unidade  │  │ Unidade  │  │ Unidade  │  │ Unidade  │    │
│ │ Min: 10  │  │ Min: 20  │  │ Min: 50  │  │ Min: 5   │    │
│ │          │  │          │  │          │  │          │    │
│ │ 🔴 8 tot │  │ 🟢 45 tot│  │ 🟡 52 tot│  │ 🟢 12 tot│    │
│ │          │  │          │  │          │  │          │    │
│ │ [✏️] [🗑️]│  │ [✏️] [🗑️]│  │ [✏️] [🗑️]│  │ [✏️] [🗑️]│    │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Estoque por Núcleo (`/estoque/nucleos/:id`)
```
┌─────────────────────────────────────────────────────────────┐
│ ← Núcleo Centro — Estoque                                   │
├─────────────────────────────────────────────────────────────┤
│ [+ Entrada] [- Saída] [↔️ Transferência] [❌ Perda/Dano]    │
├─────────────────────────────────────────────────────────────┤
│ 🔍 [buscar material...]          [Categoria ▼] [Status ▼]   │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Material           │ Quantidade │ Mínimo │ Local     │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 🏐 Bola Futsal     │ 8 un 🔴   │ 10     │ Armário A │  │
│ │ 🎽 Coletes Treino  │ 25 un 🟢  │ 20     │ Sala 2    │  │
│ │ 📏 Cones Sinalizaç │ 52 un 🟡  │ 50     │ Depósito  │  │
│ │ 🏃 Arco Ginástica  │ 15 un 🟢  │ 10     │ Quadra    │  │
│ │ 🧤 Luvas Goleiro   │ 3 un 🔴   │ 5      │ Armário B │  │
│ └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 📊 Movimentações Recentes (este núcleo)                     │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 17/08 14h — Entrada: Bola Futsal (+20) — Admin João  │  │
│ │ 16/08 11h — Saída: Coletes Treino (-5) — Alm. Maria  │  │
│ │ 15/08 09h — Transferência: Cones → Núcleo Sul (-10)  │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Formulário de Movimentação (Modal)
```
┌─────────────────────────────────────────────┐
│ Registrar Movimentação — Entrada            │
├─────────────────────────────────────────────┤
│ Núcleo: [Núcleo Centro          ▼]          │
│                                             │
│ Material: [Bola Futsal          ▼] *        │
│                                             │
│ Quantidade: [______] unidades *             │
│                                             │
│ Motivo: *                                   │
│ ┌─────────────────────────────────────┐     │
│ │                                     │     │
│ │                                     │     │
│ └─────────────────────────────────────┘     │
│                                             │
│ Observações:                                │
│ ┌─────────────────────────────────────┐     │
│ │                                     │     │
│ └─────────────────────────────────────┘     │
│                                             │
│ Data: [17/08/2026 14:30] *                  │
│                                             │
│           [Cancelar]  [Registrar]           │
└─────────────────────────────────────────────┘
```

### Supervisão — Wizard Step 1
```
┌─────────────────────────────────────────────────────────────┐
│ Nova Supervisão                           Passo 1 de 4      │
├─────────────────────────────────────────────────────────────┤
│ Dados Básicos                                               │
│                                                             │
│ Núcleo: * [Selecionar núcleo              ▼]               │
│                                                             │
│ Data da Supervisão: * [17/08/2026]                          │
│                                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐           │
│ │ Hora Entrada: *     │  │ Hora Saída: *       │           │
│ │ [09:00]             │  │ [12:00]             │           │
│ └─────────────────────┘  └─────────────────────┘           │
│                                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐           │
│ │ Beneficiários       │  │ Beneficiários       │           │
│ │ Esperados: *        │  │ Presentes: *        │           │
│ │ [30]                │  │ [28]                │           │
│ └─────────────────────┘  └─────────────────────┘           │
│                                                             │
│ Professor Presente? [✓] Sim  [ ] Não                        │
│                                                             │
│ Professores que Acompanharam: *                             │
│ ┌───────────────────────────────────────────────┐           │
│ │ [✓] Prof. Carlos Silva                        │           │
│ │ [✓] Prof. Ana Santos                          │           │
│ │ [ ] Prof. João Oliveira                       │           │
│ │ [ ] Prof. Maria Costa                         │           │
│ └───────────────────────────────────────────────┘           │
│                                                             │
│                         [Cancelar]  [Próximo →]            │
└─────────────────────────────────────────────────────────────┘
```

### Supervisão — Wizard Step 2
```
┌─────────────────────────────────────────────────────────────┐
│ Nova Supervisão                           Passo 2 de 4      │
├─────────────────────────────────────────────────────────────┤
│ Avaliações                                                  │
│                                                             │
│ 🏢 Estrutura Física: *                                      │
│ ( ) Ótima  ( ) Boa  (•) Regular  ( ) Ruim  ( ) Crítica    │
│                                                             │
│ Observações:                                                │
│ ┌───────────────────────────────────────────────┐           │
│ │ Quadra precisa pintura nas linhas             │           │
│ └───────────────────────────────────────────────┘           │
│                                                             │
│ 📦 Materiais Esportivos: *                                  │
│ ( ) Ótima  (•) Boa  ( ) Regular  ( ) Ruim  ( ) Crítica    │
│                                                             │
│ Observações:                                                │
│ ┌───────────────────────────────────────────────┐           │
│ │                                               │           │
│ └───────────────────────────────────────────────┘           │
│                                                             │
│ 🎽 Uniformes: *                                             │
│ (•) Ótima  ( ) Boa  ( ) Regular  ( ) Ruim  ( ) Crítica    │
│                                                             │
│ Observações:                                                │
│ ┌───────────────────────────────────────────────┐           │
│ │                                               │           │
│ └───────────────────────────────────────────────┘           │
│                                                             │
│ 📅 Grade de Atividades Cumprida? *                          │
│ (•) Sim  [ ] Não                                            │
│                                                             │
│ Observações:                                                │
│ ┌───────────────────────────────────────────────┐           │
│ │                                               │           │
│ └───────────────────────────────────────────────┘           │
│                                                             │
│                      [← Voltar]  [Próximo →]               │
└─────────────────────────────────────────────────────────────┘
```

### Kanban de Pendências (`/pendencias`)
```
┌─────────────────────────────────────────────────────────────┐
│ Pendências               🔍 [buscar...]  [+ Nova Pendência] │
├─────────────────────────────────────────────────────────────┤
│ Filtros: [Núcleo ▼] [Tipo ▼] [Gravidade ▼] [Responsável ▼] │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│ │ ABERTAS  │  │ ANDAMENTO│  │RESOLVIDAS│  │CANCELADAS│    │
│ │   (8)    │  │   (5)    │  │   (12)   │  │   (2)    │    │
│ ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤    │
│ │┌────────┐│  │┌────────┐│  │┌────────┐│  │┌────────┐│    │
│ ││🔴 CRIT ││  ││🟡 MÉDIA││  ││🟢 BAIXA││  ││        ││    │
│ ││        ││  ││        ││  ││        ││  ││        ││    │
│ ││Pintura ││  ││Reposição│  ││Conserto││  ││        ││    │
│ ││quadra  ││  ││bolas   ││  ││rede    ││  ││        ││    │
│ ││Centro  ││  ││Norte   ││  ││Sul     ││  ││        ││    │
│ ││        ││  ││        ││  ││        ││  ││        ││    │
│ ││Prazo:  ││  ││@Maria  ││  ││✓17/08  ││  ││        ││    │
│ ││20/08   ││  ││        ││  ││        ││  ││        ││    │
│ ││        ││  ││        ││  ││        ││  ││        ││    │
│ ││3 dias  ││  ││        ││  ││        ││  ││        ││    │
│ │└────────┘│  │└────────┘│  │└────────┘│  │└────────┘│    │
│ │┌────────┐│  │┌────────┐│  │┌────────┐│  │          │    │
│ ││🔴 ALTA ││  ││🟢 BAIXA││  ││🟡 MÉDIA││  │          │    │
│ ││        ││  ││        ││  ││        ││  │          │    │
│ ││Falta   ││  ││Lista   ││  ││Troca   ││  │          │    │
│ ││prof.   ││  ││presença││  ││coletes ││  │          │    │
│ ││Leste   ││  ││Centro  ││  ││Norte   ││  │          │    │
│ │└────────┘│  │└────────┘│  │└────────┘│  │          │    │
│ │  [...]   │  │  [...]   │  │  [...]   │  │          │    │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 14. Jobs Automáticos e Agendamentos

### Jobs Diários (cron)

#### 1. Verificar Termos Atrasados
```
Frequência: 00:00 todos os dias
Ação:
  - SELECT termos WHERE status = 'entregue' AND data_devolucao_prev < HOJE
  - UPDATE status = 'atrasado'
  - Notificar: responsável almoxarife + admin
  - Email: lista termos atrasados com dados do recebedor
```

#### 2. Verificar Estoques Baixos
```
Frequência: 08:00 todos os dias
Ação:
  - SELECT materiais m 
    JOIN estoque_nucleos e ON m.id = e.material_id
    WHERE e.quantidade_atual < m.estoque_minimo
  - Se houver alertas: enviar email consolidado para almoxarife + admin
  - Email: tabela com material, núcleo, quantidade atual, mínimo
```

#### 3. Lembrete Supervisões Pendentes
```
Frequência: 18:00 todos os dias
Ação:
  - SELECT supervisoes WHERE status = 'rascunho' AND created_at < HOJE - 3 dias
  - Notificar supervisor responsável
  - Email: "Você tem supervisões em rascunho há mais de 3 dias"
```

### Jobs Semanais

#### 4. Resumo Semanal de Pendências
```
Frequência: Segunda-feira 08:00
Ação:
  - Gerar relatório consolidado:
    - Pendências abertas por núcleo
    - Pendências críticas sem responsável
    - Pendências atrasadas (prazo vencido)
  - Enviar para: todos coordenadores + admin
```

### Jobs Mensais

#### 5. Relatório Mensal de Supervisões
```
Frequência: Dia 1 de cada mês, 09:00
Ação:
  - Gerar relatório do mês anterior:
    - Número de supervisões por núcleo
    - Média de presença de beneficiários
    - Distribuição de avaliações (estrutura/materiais/uniformes)
    - Pendências geradas por supervisões
  - Exportar PDF
  - Enviar para: admin + coordenadores
```

#### 6. Relatório de Movimentações
```
Frequência: Dia 1 de cada mês, 10:00
Ação:
  - Gerar relatório do mês anterior:
    - Total movimentações por tipo
    - Materiais mais movimentados
    - Núcleos com mais entradas/saídas
    - Perdas e danos registrados
  - Exportar PDF
  - Enviar para: almoxarife + admin
```

---

## 15. Notificações e Emails

### Templates de Email

#### Template 1: Alerta Estoque Baixo
```
Assunto: ⚠️ Alerta — Materiais Abaixo do Estoque Mínimo

Olá [Nome],

Os seguintes materiais estão com estoque abaixo do mínimo:

┌────────────────────┬───────────┬──────────┬─────────┐
│ Material           │ Núcleo    │ Atual    │ Mínimo  │
├────────────────────┼───────────┼──────────┼─────────┤
│ Bola Futsal        │ Centro    │ 8        │ 10      │
│ Luvas Goleiro      │ Centro    │ 3        │ 5       │
│ Coletes Treino     │ Norte     │ 1        │ 5       │
└────────────────────┴───────────┴──────────┴─────────┘

Acesse o sistema para registrar reposição:
[Link: /estoque/nucleos]

---
Sistema Andorinha — Gestão de Núcleos Esportivos
```

#### Template 2: Termo Atrasado
```
Assunto: 🚨 Termo de Entrega Atrasado — Devolução Pendente

Olá [Nome],

Os seguintes termos de entrega estão com devolução atrasada:

Material: Bola Futsal (5 unidades)
Recebedor: João Silva (Beneficiário)
Data Prevista: 15/08/2026
Dias de Atraso: 2 dias

Núcleo: Centro
Responsável Entrega: Maria Santos

Acesse para registrar devolução:
[Link: /estoque/termos/:id]

---
Sistema Andorinha
```

#### Template 3: Pendência Crítica Criada
```
Assunto: 🔴 Pendência Crítica — Ação Imediata Necessária

Olá [Nome Admin],

Uma pendência CRÍTICA foi registrada:

Título: Pintura urgente da quadra - risco de acidente
Núcleo: Centro
Tipo: Estrutura
Gravidade: Crítica
Prazo: 20/08/2026 (3 dias)

Descrição:
Linhas da quadra completamente apagadas, gerando risco 
de acidentes durante treinos. Supervisão #142 registrou 
avaliação crítica.

Criada por: Coord. Ana Silva
Data: 17/08/2026 14:30

Acesse para atribuir responsável:
[Link: /pendencias/:id]

---
Sistema Andorinha
```

#### Template 4: Pendência Atribuída
```
Assunto: 📋 Você foi designado para uma pendência

Olá [Nome Responsável],

Você foi designado para resolver a seguinte pendência:

Título: Reposição de bolas de vôlei
Núcleo: Norte
Gravidade: Média
Prazo: 25/08/2026

Descrição:
Estoque de bolas de vôlei está crítico (2/10). 
Necessário reposição urgente para não interromper 
as atividades da próxima semana.

Atribuído por: Admin João
Data: 17/08/2026

Acesse para ver detalhes:
[Link: /pendencias/:id]

---
Sistema Andorinha
```

---

## 16. Migrations SQL — Ordem de Execução

### Migration 1: `create_materiais_table.sql`
```sql
CREATE TABLE materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  unidade_medida VARCHAR(50) NOT NULL,
  estoque_minimo INTEGER DEFAULT 0 CHECK (estoque_minimo >= 0),
  foto_url TEXT,
  categoria VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materiais_categoria ON materiais(categoria);
CREATE INDEX idx_materiais_ativo ON materiais(ativo);
```

### Migration 2: `create_estoque_nucleos_table.sql`
```sql
CREATE TABLE estoque_nucleos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materiais(id) ON DELETE CASCADE,
  nucleo_id UUID NOT NULL REFERENCES nucleos(id) ON DELETE CASCADE,
  quantidade_atual INTEGER DEFAULT 0 CHECK (quantidade_atual >= 0),
  localizacao VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(material_id, nucleo_id)
);

CREATE INDEX idx_estoque_nucleo ON estoque_nucleos(nucleo_id);
CREATE INDEX idx_estoque_material ON estoque_nucleos(material_id);
```

### Migration 3: `create_movimentacoes_estoque_table.sql`
```sql
CREATE TABLE movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materiais(id),
  nucleo_id UUID NOT NULL REFERENCES nucleos(id),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'transferencia', 'perda', 'dano')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  quantidade_anterior INTEGER,
  quantidade_posterior INTEGER,
  responsavel_id UUID NOT NULL REFERENCES funcionarios(id),
  beneficiario_id UUID REFERENCES beneficiarios(id),
  destino_nucleo_id UUID REFERENCES nucleos(id),
  motivo TEXT NOT NULL,
  observacoes TEXT,
  termo_assinado BOOLEAN DEFAULT false,
  foto_comprovante_url TEXT,
  data_movimentacao TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movimentacoes_material ON movimentacoes_estoque(material_id);
CREATE INDEX idx_movimentacoes_nucleo ON movimentacoes_estoque(nucleo_id);
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes_estoque(tipo);
CREATE INDEX idx_movimentacoes_data ON movimentacoes_estoque(data_movimentacao DESC);
```

### Migration 4: `create_termos_entrega_table.sql`
```sql
CREATE TABLE termos_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movimentacao_id UUID NOT NULL REFERENCES movimentacoes_estoque(id) ON DELETE CASCADE,
  recebedor_tipo VARCHAR(50) NOT NULL CHECK (recebedor_tipo IN ('funcionario', 'beneficiario')),
  recebedor_id UUID NOT NULL,
  entregador_id UUID NOT NULL REFERENCES funcionarios(id),
  data_entrega TIMESTAMP NOT NULL,
  data_devolucao_prev TIMESTAMP,
  data_devolucao_real TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'entregue', 'devolvido', 'atrasado')),
  assinatura_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (data_devolucao_prev IS NULL OR data_devolucao_prev >= data_entrega)
);

CREATE INDEX idx_termos_status ON termos_entrega(status);
CREATE INDEX idx_termos_recebedor ON termos_entrega(recebedor_id);
CREATE INDEX idx_termos_data_devolucao_prev ON termos_entrega(data_devolucao_prev);
```

### Migration 5: `create_supervisoes_table.sql`
```sql
CREATE TABLE supervisoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucleo_id UUID NOT NULL REFERENCES nucleos(id),
  supervisor_id UUID NOT NULL REFERENCES funcionarios(id),
  data_supervisao DATE NOT NULL,
  hora_entrada TIME NOT NULL,
  hora_saida TIME NOT NULL,
  beneficiarios_presentes INTEGER CHECK (beneficiarios_presentes >= 0),
  beneficiarios_esperados INTEGER CHECK (beneficiarios_esperados >= 0),
  professor_presente BOOLEAN,
  professores_ids UUID[],
  estrutura_avaliacao VARCHAR(50) CHECK (estrutura_avaliacao IN ('otima', 'boa', 'regular', 'ruim', 'critica')),
  estrutura_observacoes TEXT,
  materiais_avaliacao VARCHAR(50) CHECK (materiais_avaliacao IN ('otima', 'boa', 'regular', 'ruim', 'critica')),
  materiais_observacoes TEXT,
  uniformes_avaliacao VARCHAR(50) CHECK (uniformes_avaliacao IN ('otima', 'boa', 'regular', 'ruim', 'critica')),
  uniformes_observacoes TEXT,
  grade_cumprida BOOLEAN,
  grade_observacoes TEXT,
  observacoes_gerais TEXT,
  status VARCHAR(50) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizada')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (hora_saida > hora_entrada),
  CHECK (beneficiarios_presentes <= beneficiarios_esperados)
);

CREATE INDEX idx_supervisoes_nucleo ON supervisoes(nucleo_id);
CREATE INDEX idx_supervisoes_data ON supervisoes(data_supervisao DESC);
CREATE INDEX idx_supervisoes_status ON supervisoes(status);
```

### Migration 6: `create_supervisoes_fotos_table.sql`
```sql
CREATE TABLE supervisoes_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisao_id UUID NOT NULL REFERENCES supervisoes(id) ON DELETE CASCADE,
  categoria VARCHAR(50) CHECK (categoria IN ('espaco', 'material', 'equipe', 'atividade')),
  url TEXT NOT NULL,
  legenda TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supervisoes_fotos_supervisao ON supervisoes_fotos(supervisao_id);
CREATE INDEX idx_supervisoes_fotos_ordem ON supervisoes_fotos(supervisao_id, ordem);
```

### Migration 7: `create_pendencias_table.sql`
```sql
CREATE TABLE pendencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisao_id UUID REFERENCES supervisoes(id),
  nucleo_id UUID NOT NULL REFERENCES nucleos(id),
  tipo VARCHAR(100) NOT NULL CHECK (tipo IN ('estrutura', 'material', 'professor', 'beneficiario', 'outro')),
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NOT NULL,
  gravidade VARCHAR(50) NOT NULL CHECK (gravidade IN ('baixa', 'media', 'alta', 'critica')),
  responsavel_id UUID REFERENCES funcionarios(id),
  prazo DATE,
  status VARCHAR(50) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida', 'cancelada')),
  providencias TEXT,
  data_resolucao TIMESTAMP,
  resolvido_por_id UUID REFERENCES funcionarios(id),
  observacoes_resolucao TEXT,
  created_by_id UUID NOT NULL REFERENCES funcionarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pendencias_nucleo ON pendencias(nucleo_id);
CREATE INDEX idx_pendencias_status ON pendencias(status);
CREATE INDEX idx_pendencias_gravidade ON pendencias(gravidade);
CREATE INDEX idx_pendencias_responsavel ON pendencias(responsavel_id);
CREATE INDEX idx_pendencias_prazo ON pendencias(prazo);
```

---

## 17. Tecnologias e Bibliotecas Necessárias

### Backend (NestJS)
```json
{
  "@nestjs/schedule": "^4.0.0",        // jobs cron automáticos
  "@nestjs/bull": "^10.0.0",           // filas processamento assíncrono
  "bull": "^4.11.0",                   // Redis queue (opcional)
  "nodemailer": "^6.9.0",              // envio emails
  "@aws-sdk/client-s3": "^3.400.0",    // upload Cloudflare R2 (já tem)
  "date-fns": "^2.30.0",               // manipulação datas
  "class-validator": "^0.14.0",        // validações (já tem)
  "class-transformer": "^0.5.1"        // transformações (já tem)
}
```

### Frontend (Next.js)
```json
{
  "signature_pad": "^4.1.7",           // assinatura digital canvas
  "react-dnd": "^16.0.1",              // drag & drop kanban
  "react-dnd-html5-backend": "^16.0.1",
  "recharts": "^2.9.0",                // gráficos dashboard
  "date-fns": "^2.30.0",               // manipulação datas
  "react-hook-form": "^7.47.0",        // formulários (já tem)
  "zod": "^3.22.0",                    // validações (já tem)
  "@dnd-kit/core": "^6.0.8",           // alternativa DnD (mais leve)
  "@dnd-kit/sortable": "^7.0.2"        // sortable lists (fotos)
}
```

### Geração de PDFs
```
Opção 1 (recomendada): @react-pdf/renderer
  - Componentes React para gerar PDF
  - Funciona SSR (Next.js)
  - Mais fácil manutenção

Opção 2: pdfmake
  - Configuração JSON
  - Mais controle baixo nível
  - Curva aprendizado maior

Opção 3: puppeteer (apenas backend)
  - Renderiza HTML → PDF
  - Mais pesado (Chrome headless)
  - Melhor para relatórios complexos
```

---

## 18. Segurança e Validações de Negócio

### Regras de Negócio Críticas

#### Estoque
1. **Quantidade nunca negativa**: trigger DB + validação backend + validação frontend
2. **Saída/Transferência**: verificar estoque disponível ANTES de registrar
3. **Movimentações com foto obrigatória**: tipo = "perda" ou "dano"
4. **Transferência**: origem ≠ destino
5. **Concorrência**: lock otimista na tabela `estoque_nucleos` (usar `updated_at` como versão)

```sql
-- Trigger: atualizar estoque automaticamente após movimentação
CREATE OR REPLACE FUNCTION atualizar_estoque_apos_movimentacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Entrada
  IF NEW.tipo = 'entrada' THEN
    UPDATE estoque_nucleos 
    SET quantidade_atual = quantidade_atual + NEW.quantidade,
        updated_at = CURRENT_TIMESTAMP
    WHERE material_id = NEW.material_id AND nucleo_id = NEW.nucleo_id;
    
  -- Saída, Perda, Dano
  ELSIF NEW.tipo IN ('saida', 'perda', 'dano') THEN
    UPDATE estoque_nucleos 
    SET quantidade_atual = quantidade_atual - NEW.quantidade,
        updated_at = CURRENT_TIMESTAMP
    WHERE material_id = NEW.material_id AND nucleo_id = NEW.nucleo_id;
    
  -- Transferência
  ELSIF NEW.tipo = 'transferencia' THEN
    -- Diminui origem
    UPDATE estoque_nucleos 
    SET quantidade_atual = quantidade_atual - NEW.quantidade,
        updated_at = CURRENT_TIMESTAMP
    WHERE material_id = NEW.material_id AND nucleo_id = NEW.nucleo_id;
    
    -- Aumenta destino (cria se não existir)
    INSERT INTO estoque_nucleos (material_id, nucleo_id, quantidade_atual)
    VALUES (NEW.material_id, NEW.destino_nucleo_id, NEW.quantidade)
    ON CONFLICT (material_id, nucleo_id) 
    DO UPDATE SET quantidade_atual = estoque_nucleos.quantidade_atual + NEW.quantidade,
                  updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_estoque
AFTER INSERT ON movimentacoes_estoque
FOR EACH ROW EXECUTE FUNCTION atualizar_estoque_apos_movimentacao();
```

#### Supervisões
1. **Edição bloqueada se finalizada**: apenas visualização
2. **Avaliação ruim/crítica sem observação**: validação obrigatória
3. **Professor presente = true**: array `professores_ids` não vazio
4. **Fotos**: mínimo 1 foto se avaliação = ruim ou crítica

#### Pendências
1. **Prazo no passado**: rejeitar na criação
2. **Status resolvida**: campos `providencias`, `data_resolucao`, `resolvido_por_id` obrigatórios
3. **Gravidade crítica**: notificação imediata para admin
4. **Atribuição**: apenas funcionários ativos

#### Termos de Entrega
1. **Devolução antes da entrega**: validação `data_devolucao_real >= data_entrega`
2. **Status atrasado**: job automático diário
3. **Assinatura obrigatória**: antes de finalizar termo

### Permissões por Endpoint (Guards)

```typescript
// Exemplo guard NestJS
@Controller('estoque')
export class EstoqueController {
  
  @Get('nucleos/:id')
  @Roles('admin', 'coordenador', 'almoxarife', 'professor') // todos veem
  getEstoqueNucleo(@Param('id') id: string) {}
  
  @Post('movimentacoes')
  @Roles('admin', 'almoxarife') // apenas estes registram
  registrarMovimentacao(@Body() dto: MovimentacaoDto) {}
  
  @Patch('materiais/:id')
  @Roles('admin', 'almoxarife')
  atualizarMaterial(@Param('id') id: string, @Body() dto: MaterialDto) {}
}

@Controller('supervisoes')
export class SupervisoesController {
  
  @Post()
  @Roles('admin', 'coordenador') // apenas estes criam
  criarSupervisao(@Body() dto: SupervisaoDto) {}
  
  @Get(':id')
  @Roles('admin', 'coordenador', 'professor') // todos veem
  getSupervisao(@Param('id') id: string) {}
}

@Controller('pendencias')
export class PendenciasController {
  
  @Get('minhas')
  @Roles('professor', 'coordenador', 'admin')
  @UseGuards(PendenciasOwnerGuard) // filtra por responsavel_id = user.id
  getMinhasPendencias(@Request() req) {}
  
  @Patch(':id/resolver')
  @Roles('professor', 'coordenador', 'admin')
  @UseGuards(PendenciasResponsavelGuard) // só resolve se for responsável
  resolverPendencia(@Param('id') id: string, @Body() dto: ResolverDto) {}
}
```

---

## 19. Performance e Otimizações

### Índices Críticos (já incluídos nas migrations)
```sql
-- Consultas mais frequentes
CREATE INDEX idx_movimentacoes_data ON movimentacoes_estoque(data_movimentacao DESC);
CREATE INDEX idx_supervisoes_nucleo_data ON supervisoes(nucleo_id, data_supervisao DESC);
CREATE INDEX idx_pendencias_status_gravidade ON pendencias(status, gravidade);
CREATE INDEX idx_estoque_material_nucleo ON estoque_nucleos(material_id, nucleo_id);
```

### Queries Otimizadas

#### Dashboard Estoque — Materiais Abaixo do Mínimo
```sql
-- Evitar N+1, trazer tudo em uma query
SELECT 
  m.id, m.nome, m.foto_url, m.estoque_minimo,
  n.id as nucleo_id, n.nome as nucleo_nome,
  e.quantidade_atual, e.localizacao
FROM materiais m
JOIN estoque_nucleos e ON m.id = e.material_id
JOIN nucleos n ON e.nucleo_id = n.id
WHERE e.quantidade_atual < m.estoque_minimo
  AND m.ativo = true
ORDER BY (m.estoque_minimo - e.quantidade_atual) DESC;
```

#### Histórico Movimentações com Paginação
```sql
SELECT 
  mov.id, mov.tipo, mov.quantidade, mov.data_movimentacao,
  mat.nome as material_nome,
  nuc.nome as nucleo_nome,
  func.nome as responsavel_nome,
  ben.nome as beneficiario_nome,
  dest_nuc.nome as destino_nucleo_nome
FROM movimentacoes_estoque mov
JOIN materiais mat ON mov.material_id = mat.id
JOIN nucleos nuc ON mov.nucleo_id = nuc.id
JOIN funcionarios func ON mov.responsavel_id = func.id
LEFT JOIN beneficiarios ben ON mov.beneficiario_id = ben.id
LEFT JOIN nucleos dest_nuc ON mov.destino_nucleo_id = dest_nuc.id
WHERE 
  ($1::uuid IS NULL OR mov.nucleo_id = $1)
  AND ($2::varchar IS NULL OR mov.tipo = $2)
  AND mov.data_movimentacao BETWEEN $3 AND $4
ORDER BY mov.data_movimentacao DESC
LIMIT $5 OFFSET $6;
```

#### Supervisões com Fotos (eager loading)
```sql
-- Evitar N+1 ao listar supervisões com fotos
SELECT 
  s.*,
  n.nome as nucleo_nome,
  f.nome as supervisor_nome,
  json_agg(
    json_build_object(
      'id', sf.id,
      'url', sf.url,
      'categoria', sf.categoria,
      'legenda', sf.legenda,
      'ordem', sf.ordem
    ) ORDER BY sf.ordem
  ) FILTER (WHERE sf.id IS NOT NULL) as fotos
FROM supervisoes s
JOIN nucleos n ON s.nucleo_id = n.id
JOIN funcionarios f ON s.supervisor_id = f.id
LEFT JOIN supervisoes_fotos sf ON s.id = sf.supervisao_id
WHERE s.nucleo_id = $1
  AND s.data_supervisao BETWEEN $2 AND $3
GROUP BY s.id, n.nome, f.nome
ORDER BY s.data_supervisao DESC;
```

### Cache Strategy (opcional, futuro)
```typescript
// Redis cache para dados que mudam pouco
@CacheKey('materiais:ativos')
@CacheTTL(3600) // 1 hora
async getMateriaisAtivos() {}

@CacheKey('nucleos:estoque:${nucleoId}')
@CacheTTL(300) // 5 minutos
async getEstoqueNucleo(nucleoId: string) {}

// Invalidar cache após movimentação
async registrarMovimentacao(dto: MovimentacaoDto) {
  const result = await this.repository.save(dto);
  await this.cacheManager.del(`nucleos:estoque:${dto.nucleoId}`);
  return result;
}
```

---

## 20. Roadmap de Implementação Detalhado

### **Fase 1 — MVP Estoque (2-3 semanas)**

#### Semana 1: Backend Base
- [ ] Criar migrations: materiais, estoque_nucleos, movimentacoes_estoque
- [ ] Aplicar migrations no banco
- [ ] Criar entities NestJS (TypeORM/Prisma)
- [ ] Implementar CRUD materiais (controllers + services)
- [ ] Implementar endpoints estoque: `/estoque/nucleos/:id`, `/estoque/alertas`
- [ ] Implementar endpoints movimentacoes: entrada, saída, transferência
- [ ] Criar trigger `atualizar_estoque_apos_movimentacao`
- [ ] Adicionar guards de permissão (admin, almoxarife)
- [ ] Testes unitários: services
- [ ] Testes e2e: endpoints principais

#### Semana 2: Frontend Base
- [ ] Criar rotas: `/estoque`, `/estoque/materiais`, `/estoque/nucleos`
- [ ] Implementar dashboard estoque (cards + alertas)
- [ ] Implementar CRUD materiais (lista + formulário)
- [ ] Implementar `MaterialCard` component
- [ ] Implementar `EstoqueAlertBadge` component
- [ ] Implementar página estoque por núcleo
- [ ] Criar `MovimentacaoForm` component (entrada, saída, transferência)
- [ ] Integrar upload de fotos (perda/dano)

#### Semana 3: Refinamento + Job Alertas
- [ ] Implementar histórico de movimentações (tabela + filtros + paginação)
- [ ] Adicionar validações frontend (Zod schemas)
- [ ] Implementar job diário: verificar estoques baixos
- [ ] Implementar envio de email (template alerta estoque baixo)
- [ ] Adicionar gráfico "Movimentações por Tipo" (Recharts)
- [ ] Testes E2E frontend: fluxos completos
- [ ] Ajustar permissões: novo perfil "Almoxarife"
- [ ] Documentação: endpoints + schemas

**Entregável Fase 1**: Sistema de estoque funcional com alertas automáticos

---

### **Fase 2 — Termos de Entrega (1-2 semanas)**

#### Semana 4: Backend Termos
- [ ] Criar migration: termos_entrega
- [ ] Implementar endpoints: `/termos` (CRUD + devolver + assinar)
- [ ] Implementar job diário: verificar termos atrasados
- [ ] Implementar envio de email (template termo atrasado)
- [ ] Testes unitários + e2e

#### Semana 5: Frontend Termos + Assinatura
- [ ] Criar rotas: `/estoque/termos`, `/estoque/termos/:id`
- [ ] Implementar lista de termos (tabela + filtros)
- [ ] Implementar `TermoEntregaModal` component
- [ ] Integrar `signature_pad` (canvas assinatura)
- [ ] Implementar geração PDF termo (opção: @react-pdf/renderer)
- [ ] Adicionar fluxo: saída → criar termo automaticamente
- [ ] Implementar página detalhe termo (visualização + devolução)

**Entregável Fase 2**: Termos de entrega com assinatura digital + controle devoluções

---

### **Fase 3 — Supervisões (2-3 semanas)**

#### Semana 6: Backend Supervisões
- [ ] Criar migrations: supervisoes, supervisoes_fotos
- [ ] Implementar endpoints: `/supervisoes` (CRUD + fotos + finalizar)
- [ ] Implementar upload categorizado de fotos
- [ ] Implementar job semanal: lembrete supervisões pendentes
- [ ] Testes unitários + e2e

#### Semana 7-8: Frontend Supervisões (Wizard)
- [ ] Criar rotas: `/supervisoes`, `/supervisoes/nova`, `/supervisoes/:id`
- [ ] Implementar lista supervisões (calendário + tabela)
- [ ] Implementar `SupervisaoFormWizard` (4 steps)
  - Step 1: Dados básicos
  - Step 2: Avaliações
  - Step 3: Upload fotos categorizadas (com @dnd-kit/sortable)
  - Step 4: Finalização + pendências sugeridas
- [ ] Implementar página detalhe supervisão (readonly se finalizada)
- [ ] Adicionar aba "Supervisões" em `/nucleos/:id`
- [ ] Integração: gerar pendências automáticas se avaliação crítica

**Entregável Fase 3**: Sistema de supervisões completo com fotos e avaliações

---

### **Fase 4 — Pendências (1-2 semanas)**

#### Semana 9: Backend Pendências
- [ ] Criar migration: pendencias
- [ ] Implementar endpoints: `/pendencias` (CRUD + atribuir + resolver)
- [ ] Implementar endpoint: `/pendencias/criticas`, `/pendencias/minhas`
- [ ] Implementar notificações: pendência crítica criada, atribuída
- [ ] Implementar job semanal: resumo pendências abertas
- [ ] Testes unitários + e2e

#### Semana 10: Frontend Pendências (Kanban)
- [ ] Criar rotas: `/pendencias`, `/pendencias/nova`, `/pendencias/:id`
- [ ] Implementar `PendenciaKanbanBoard` component (drag & drop)
- [ ] Integrar @dnd-kit (4 colunas: abertas/andamento/resolvidas/canceladas)
- [ ] Implementar filtros: núcleo, tipo, gravidade, responsável
- [ ] Implementar página detalhe pendência (atribuir + resolver)
- [ ] Adicionar rota `/pendencias/minhas` (professor)
- [ ] Adicionar card "Pendências" no dashboard professor

**Entregável Fase 4**: Kanban de pendências com atribuição e resolução

---

### **Fase 5 — Relatórios e Automações (1-2 semanas)**

#### Semana 11: Backend Relatórios
- [ ] Implementar endpoints: `/relatorios/supervisoes/mensal`
- [ ] Implementar endpoints: `/relatorios/estoque/movimentacao`
- [ ] Implementar endpoints: `/relatorios/pendencias/status`
- [ ] Implementar geração PDF backend (Puppeteer ou pdfmake)
- [ ] Implementar job mensal: relatório supervisões
- [ ] Implementar job mensal: relatório movimentações
- [ ] Testes unitários

#### Semana 12: Frontend Relatórios + Dashboards
- [ ] Criar rota: `/supervisoes/relatorio-mensal`
- [ ] Implementar dashboards com gráficos (Recharts):
  - Supervisões: média presença, distribuição avaliações
  - Estoque: movimentações por tipo, perdas/danos
  - Pendências: status, gravidade, núcleos
- [ ] Implementar export PDF (botão download)
- [ ] Adicionar calendário de supervisões (biblioteca: react-big-calendar)
- [ ] Implementar filtros de período (date range picker)

**Entregável Fase 5**: Relatórios consolidados + dashboards analíticos

---

## 21. Checklist Final Antes do Deploy

### Backend
- [ ] Todas migrations aplicadas no banco de produção
- [ ] Seeds de dados iniciais (materiais comuns, categorias)
- [ ] Variáveis de ambiente configuradas (email, R2, database)
- [ ] Jobs cron configurados e rodando
- [ ] Logs estruturados (Winston ou similar)
- [ ] Rate limiting em endpoints públicos
- [ ] CORS configurado corretamente
- [ ] Healthcheck endpoint (`/health`)

### Frontend
- [ ] Build de produção sem erros
- [ ] Variáveis de ambiente produção
- [ ] Service Worker PWA configurado (se aplicável)
- [ ] Imagens otimizadas (next/image)
- [ ] Testes E2E passando
- [ ] Lighthouse score > 90 (performance, accessibility)
- [ ] Meta tags SEO
- [ ] Favicon e manifest.json

### Segurança
- [ ] Todas rotas protegidas com guards
- [ ] Validações backend em todos endpoints
- [ ] SQL injection: usar prepared statements (TypeORM/Prisma já protege)
- [ ] XSS: sanitização de inputs (class-validator já protege)
- [ ] CSRF: tokens em formulários
- [ ] Rate limiting: evitar brute force
- [ ] Secrets fora do código (variáveis ambiente)
- [ ] HTTPS obrigatório em produção

### Documentação
- [ ] README atualizado
- [ ] Documentação API (Swagger/OpenAPI)
- [ ] Guia de instalação
- [ ] Guia de contribuição
- [ ] Changelog
- [ ] Este arquivo (ARQUITETURA_ESTOQUE_SUPERVISAO.md) revisado

### Monitoramento
- [ ] Logs centralizados
- [ ] Alertas de erro (Sentry ou similar)
- [ ] Métricas de performance (APM)
- [ ] Backup automático banco de dados
- [ ] Plano de rollback

---

## 22. Estimativa de Custo/Recursos

### Desenvolvimento
- **Backend**: 4-5 semanas dev sênior (NestJS)
- **Frontend**: 5-6 semanas dev sênior (Next.js)
- **QA/Testes**: 1-2 semanas tester
- **Design/UX**: 1 semana designer (wireframes + componentes)
- **DevOps**: 3-5 dias (CI/CD + monitoramento)

**Total**: ~10-12 semanas (2,5-3 meses) com 2 devs full-time

### Infraestrutura Adicional
- **Email**: SendGrid free tier (100 emails/dia) ou SMTP próprio
- **Storage**: Cloudflare R2 (já tem) — estimar +500MB fotos supervisões/mês
- **Redis** (opcional, cache): Upstash free tier ou Redis local
- **Monitoring**: Sentry free tier (5k events/mês)

---

## 23. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Complexidade wizard supervisão (UX) | Média | Alto | Prototipar wizard em Figma antes, validar com usuários |
| Geração PDF lenta (relatórios) | Alta | Médio | Usar queue assíncrona (Bull), gerar em background |
| Concorrência em estoque (race condition) | Média | Alto | Lock otimista na tabela, retry em caso de conflito |
| Upload fotos grande volume | Média | Médio | Compressão client-side, limite 10 fotos/supervisão |
| Jobs cron não executando | Baixa | Alto | Monitoramento ativo, alertas se job falhar 2x seguidas |
| Usuários não entendendo kanban | Média | Médio | Tutorial interativo na primeira visita, tooltips |
| Termos de entrega sem valor jurídico | Baixa | Alto | Consultar jurídico sobre assinatura digital válida |

---

## Conclusão

Este documento detalha completamente a arquitetura dos módulos de **Estoque** e **Supervisão** para o sistema Andorinha. A implementação seguindo este plano resultará em:

✅ Controle completo de materiais esportivos por núcleo  
✅ Rastreabilidade total de movimentações  
✅ Termos de entrega com assinatura digital  
✅ Sistema robusto de supervisões com fotos categorizadas  
✅ Gestão de pendências em kanban  
✅ Relatórios consolidados mensais  
✅ Automações e alertas proativos  

**Próxima ação recomendada**: Iniciar Fase 1 (MVP Estoque) com as migrations e endpoints backend básicos.
