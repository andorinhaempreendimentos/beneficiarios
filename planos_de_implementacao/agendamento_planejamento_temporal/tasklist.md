# Tasklist: Agendamento & Grade Centrada no Núcleo

> **Escopo da Etapa Atual:** Foco exclusivo no **Agendamento, Grade do Núcleo e Alocação de Turmas (Fases 1 a 4)**.  
> A execução da atividade fim (chamada nominal em quadra, fotos probatórias e ponto eletrônico) será realizada na etapa posterior, conforme diretriz estratégica.

---

## [ETAPA ATUAL] Agendamento & Grade Centrada no Núcleo

### Fase 1: Ajuste Estrutural no Banco Oficial (`qrzszjogxrrjqjkoowoi`)
- [x] **Tarefa 1.1: Tornar `grupo_id` Opcional em `grupo_horarios`** — Criar migration 058 (`ALTER TABLE grupo_horarios ALTER COLUMN grupo_id DROP NOT NULL`) e aplicar no Supabase para permitir blocos de horário planejados/vagos pertencentes ao núcleo.
- [x] **Tarefa 1.2: Atualização de Tipagens e APIs** — Ajustar `HorarioTurmaApi`, `GrupoHorario` e `grupoHorariosApi` para permitir criação, listagem e atualização de blocos por `nucleo_id` com `grupo_id` opcional.

### Fase 2: Grade de Agendamento do Núcleo (UI Principal)
- [x] **Tarefa 2.1: Visualização da Grade Semanal no Núcleo** — Adicionar aba/seção de Grade de Horários nos detalhes do Núcleo com filtro por instrutor e visão de horários ocupados vs vagos.
- [x] **Tarefa 2.2: Modal de Criação de Bloco com Repetição Inteligente** — Incluir no modal a pergunta e seletor de repetição (múltiplos dias da semana como Ter/Qui ou Seg/Qua/Sex, quinzenal/mensal e datas pontuais).
- [x] **Tarefa 2.3: Alocação e Ações do Bloco no Núcleo** — Permitir dentro do bloco do núcleo: (a) Alocar turma existente, (b) Criar nova turma diretamente no bloco, (c) Vincular múltiplas turmas para aulões integrados, (d) Desalocar turma (tornando o bloco vago).

### Fase 3: Alinhamento do Formulário de Turmas (`GrupoForm.tsx`)
- [x] **Tarefa 3.1: Seleção de Blocos do Núcleo na Turma** — Adaptar o formulário de turmas para selecionar blocos de horário já existentes no seu núcleo, garantindo que a turma ocupe o espaço planejado.

### Fase 4: Ocupação e Prevenção de Conflitos
- [x] **Tarefa 4.1: Validação Preventiva de Choques Físicos e Escala** — Utilizar o motor `lib/agendamento.ts` para impedir sobreposição de espaço físico na mesma quadra/núcleo e choque de jornada do mesmo profissional.

---

## [ETAPA POSTERIOR] Snapshot da Aula / Sessão (Execução em Campo)

### Fase 5: Integração de Campo (Chamada, Ponto e Fotos Probatórias)
- [ ] **Tarefa 5.1: Chamada Nominal Multi-Turma** — Carregar e agrupar alunos de todas as turmas vinculadas ao bloco ativo no dia.
- [ ] **Tarefa 5.2: Gatilho de Ponto do Instrutor** — Conectar o início e término da sessão com a geração automática do registro de ponto do professor com comprovação fotográfica.

### Fase 6: Pautas Impressas e Supervisão de Campo
- [ ] **Tarefa 6.1: Pauta de Frequência A4 Dinâmica** — Gerar pautas com as datas reais calculadas pelo motor do agendamento para aquele núcleo e turmas.
- [ ] **Tarefa 6.2: Visão de Supervisão em Tempo Real** — Adaptar a tela de supervisão para exibir quais blocos físicos e turmas estão ativos no momento da visita.
