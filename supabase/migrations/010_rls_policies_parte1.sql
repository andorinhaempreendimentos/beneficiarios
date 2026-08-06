-- ══ Objetos ══
alter table objetos enable row level security;
create policy objetos_select on objetos for select using (deleted_at is null and has_permissao('objetos','listar'));
create policy objetos_insert on objetos for insert with check (has_permissao('objetos','criar'));
create policy objetos_update on objetos for update using (has_permissao('objetos','editar'));
create policy objetos_delete on objetos for delete using (has_permissao('objetos','excluir'));

-- ══ Organizações ══
alter table organizacoes enable row level security;
create policy organizacoes_select on organizacoes for select using (deleted_at is null and has_permissao('organizacoes','listar'));
create policy organizacoes_insert on organizacoes for insert with check (has_permissao('organizacoes','criar'));
create policy organizacoes_update on organizacoes for update using (has_permissao('organizacoes','editar'));
create policy organizacoes_delete on organizacoes for delete using (has_permissao('organizacoes','excluir'));

-- ══ Núcleos ══
alter table nucleos enable row level security;
create policy nucleos_select on nucleos for select using (deleted_at is null and has_permissao('nucleos','listar'));
create policy nucleos_insert on nucleos for insert with check (has_permissao('nucleos','criar'));
create policy nucleos_update on nucleos for update using (has_permissao('nucleos','editar'));
create policy nucleos_delete on nucleos for delete using (has_permissao('nucleos','excluir'));

-- ══ Atividades e detalhes ══
alter table atividades enable row level security;
create policy atividades_select on atividades for select using (deleted_at is null and has_permissao('atividades','listar'));
create policy atividades_insert on atividades for insert with check (has_permissao('atividades','criar'));
create policy atividades_update on atividades for update using (has_permissao('atividades','editar'));
create policy atividades_delete on atividades for delete using (has_permissao('atividades','excluir'));

alter table atividade_perguntas enable row level security;
create policy atividade_perguntas_select on atividade_perguntas for select using (has_permissao('atividades','listar'));
create policy atividade_perguntas_all on atividade_perguntas for insert with check (has_permissao('atividades','editar'));
create policy atividade_perguntas_update on atividade_perguntas for update using (has_permissao('atividades','editar'));
create policy atividade_perguntas_delete on atividade_perguntas for delete using (has_permissao('atividades','editar'));

alter table atividade_turnos enable row level security;
create policy atividade_turnos_select on atividade_turnos for select using (has_permissao('atividades','listar'));
create policy atividade_turnos_insert on atividade_turnos for insert with check (has_permissao('atividades','editar'));
create policy atividade_turnos_update on atividade_turnos for update using (has_permissao('atividades','editar'));
create policy atividade_turnos_delete on atividade_turnos for delete using (has_permissao('atividades','editar'));
