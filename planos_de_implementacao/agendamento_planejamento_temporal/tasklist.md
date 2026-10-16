# Tasklist: Agendamento & Blocos de Horário

> **Escopo da Etapa Atual:** Foco exclusivo no **Agendamento e Planejamento Temporal (Fases 1 a 3)**.  
> A execução da atividade fim (o snapshot da Aula/Sessão, chamada em campo, fotos e ponto) será realizada na etapa posterior, conforme diretriz estratégica.

---

## [ETAPA ATUAL] Agendamento & Planejamento Temporal

### Fase 1: Estrutura de Dados e Tipos no Banco Oficial (`qrzszjogxrrjqjkoowoi`)
- [x] **Tarefa 1.1: Migration de Campos do Bloco no Banco** — Adicionar em `grupo_horarios` as colunas opcionais `tipo_recorrencia`, `dia_mes`, `ordem_semana_mes`, `ajuste_fim_de_semana`, `data_especifica` e `grupos_adicionais_ids`.
- [x] **Tarefa 1.2: Tipagem TypeScript e Schemas de API** — Atualizar as interfaces `HorarioTurmaApi` e tipos de slots/blocos em `web/src/lib/api/services.ts` para refletir as propriedades do Bloco de Horário.

### Fase 2: Interface Visual de Configuração do Bloco de Horário
- [x] **Tarefa 2.1: Refatoração do Modal de Bloco (`GradeSemanal.tsx`)** — Renomear referências visuais de "Slot" para "Bloco de Horário" e adicionar as abas de recorrência (**Dia único**, **Semanal**, **Mensal**).
- [x] **Tarefa 2.2: Seletor de Enturmação Conjunta** — Permitir vincular turmas adicionais parceiras no mesmo bloco de horário dentro do modal.
- [x] **Tarefa 2.3: Atualização do Formulário de Turma (`GrupoForm.tsx`)** — Ajustar salvamento e carregamento dos blocos com os novos campos de recorrência.

### Fase 3: Motor de Projeção Temporal e Prevenção de Conflitos
- [x] **Tarefa 3.1: Motor de Cálculo de Datas (`lib/agendamento.ts`)** — Criar funções utilitárias puras que recebem a regra do bloco e geram o calendário exato de aulas para qualquer mês selecionado (com suporte a feriados/fins de semana).
- [x] **Tarefa 3.2: Validação Preventiva de Choques** — Implementar detecção de sobreposição de espaço no núcleo e choque de horário de instrutor.

---

## [ETAPA POSTERIOR] Snapshot da Aula / Sessão (Execução da Atividade Fim)

### Fase 4: Integração de Campo (Chamada, Ponto e Fotos Probatórias)
- [ ] **Tarefa 4.1: Chamada Nominal Multi-Turma** — Adaptar a tela de chamada (`/turmas/[id]/presenca`) para carregar e agrupar alunos de todas as turmas que compartilham o mesmo bloco.
- [ ] **Tarefa 4.2: Gatilho de Ponto do Instrutor** — Conectar o início e fim da sessão com a geração automática do registro de ponto do professor e foto comprobatória imutável.

### Fase 5: Pautas Impressas e Supervisão de Campo
- [ ] **Tarefa 5.1: Pauta de Frequência A4 com Datas Reais** — Atualizar o gerador de PDF/HTML de pauta para usar as datas projetadas pelo motor do agendamento.
- [ ] **Tarefa 5.2: Visão da Supervisão em Tempo Real** — Adaptar a tela de supervisão para exibir quais blocos e turmas estão ativos no momento exato da visita.
