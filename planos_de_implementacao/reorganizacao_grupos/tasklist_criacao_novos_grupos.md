# Tasklist: Criação da Estrutura de Grupos (Dicionário da Atividade)

- [x] **Tarefa 1: Criação dos Grupos no Banco (20 Núcleos)** — Inserir registros na tabela `grupos` gerando o nome no padrão `[Núcleo] - [termo_grupo] [Letra]` (consultando `atividades.termo_grupo`), associando núcleo, atividade, faixas etárias e vagas (sem tocar em `beneficiario_grupos`).
- [x] **Tarefa 2: Criação da Grade Semanal em `grupo_horarios`** — Inserir todos os slots semanais de horários enviados pelos 20 professores, associando dia da semana, hora de início e término.
- [x] **Tarefa 3: Vinculação dos 20 Professores em `grupo_responsaveis`** — Associar cada um dos 20 professores às turmas do seu respectivo núcleo.
- [x] **Tarefa 4: Auditoria Final de Integridade** — Validar consistência dos nomes gerados, horários, alocações de professores, conferir que `beneficiarios` permanece 100% intacto e `beneficiario_grupos` vazia.
