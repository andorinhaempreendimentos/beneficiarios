-- ══ Turmas ══
alter table turmas enable row level security;
create policy turmas_select on turmas for select using (deleted_at is null and has_permissao('turmas','listar'));
create policy turmas_insert on turmas for insert with check (has_permissao('turmas','criar'));
create policy turmas_update on turmas for update using (has_permissao('turmas','editar'));
create policy turmas_delete on turmas for delete using (has_permissao('turmas','excluir'));

alter table turma_horarios enable row level security;
create policy turma_horarios_select on turma_horarios for select using (has_permissao('turmas','listar'));
create policy turma_horarios_insert on turma_horarios for insert with check (has_permissao('turmas','editar'));
create policy turma_horarios_update on turma_horarios for update using (has_permissao('turmas','editar'));
create policy turma_horarios_delete on turma_horarios for delete using (has_permissao('turmas','editar'));

-- ══ Funcionários ══
alter table funcionarios enable row level security;
create policy funcionarios_select on funcionarios for select using (deleted_at is null and has_permissao('funcionarios','listar'));
create policy funcionarios_insert on funcionarios for insert with check (has_permissao('funcionarios','criar'));
create policy funcionarios_update on funcionarios for update using (has_permissao('funcionarios','editar'));
create policy funcionarios_delete on funcionarios for delete using (has_permissao('funcionarios','excluir'));

alter table funcionario_jornada enable row level security;
create policy funcionario_jornada_select on funcionario_jornada for select using (has_permissao('funcionarios','listar'));
create policy funcionario_jornada_insert on funcionario_jornada for insert with check (has_permissao('funcionarios','editar'));
create policy funcionario_jornada_update on funcionario_jornada for update using (has_permissao('funcionarios','editar'));
create policy funcionario_jornada_delete on funcionario_jornada for delete using (has_permissao('funcionarios','editar'));

alter table turma_responsaveis enable row level security;
create policy turma_responsaveis_select on turma_responsaveis for select using (has_permissao('turmas','listar'));
create policy turma_responsaveis_insert on turma_responsaveis for insert with check (has_permissao('turmas','editar'));
create policy turma_responsaveis_update on turma_responsaveis for update using (has_permissao('turmas','editar'));
create policy turma_responsaveis_delete on turma_responsaveis for delete using (has_permissao('turmas','editar'));
