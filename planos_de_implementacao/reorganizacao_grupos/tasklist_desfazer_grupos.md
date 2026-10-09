# Tasklist: Desfazimento de Grupos e Backup Seguro

- [x] **Tarefa 1: Backup Relacional no Supabase** — Criar tabelas `backup_beneficiario_grupos` e `backup_grupos_estrutura` com dados consolidados.
- [x] **Tarefa 2: Backup Local em JSON** — Exportar snapshot completo dos 565 vínculos e 41 grupos para arquivo local `backup_matriculas_pre_reset.json`.
- [x] **Tarefa 3: Conferência dos Backups** — Validar que 100% dos 565 registros foram gravados no banco e no JSON.
- [x] **Tarefa 4: Limpeza das Matrículas** — Remover registros da tabela `beneficiario_grupos`.
- [x] **Tarefa 5: Limpeza da Estrutura de Grupos** — Remover `grupo_horarios`, `grupo_responsaveis` e `grupos`.
- [x] **Tarefa 6: Verificação de Integridade** — Confirmar 565 beneficiários intactos em `beneficiarios` e tabela `grupos` zerada.
