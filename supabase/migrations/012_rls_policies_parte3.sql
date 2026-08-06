-- ══ Beneficiários ══
-- Nota: hoje (NestJS) beneficiário loga com perfilId vazio e não passa em
-- nenhum @Permissao — não existe self-service real ainda. RLS replica esse
-- comportamento (só role/permissão), sem cláusula de "próprio registro".
alter table beneficiarios enable row level security;
create policy beneficiarios_select on beneficiarios for select using (deleted_at is null and has_permissao('beneficiarios','listar'));
create policy beneficiarios_insert on beneficiarios for insert with check (has_permissao('beneficiarios','criar'));
create policy beneficiarios_update on beneficiarios for update using (has_permissao('beneficiarios','editar'));
create policy beneficiarios_delete on beneficiarios for delete using (has_permissao('beneficiarios','excluir'));

alter table beneficiario_turmas enable row level security;
create policy beneficiario_turmas_select on beneficiario_turmas for select using (has_permissao('beneficiarios','listar'));
create policy beneficiario_turmas_insert on beneficiario_turmas for insert with check (has_permissao('beneficiarios','editar'));
create policy beneficiario_turmas_update on beneficiario_turmas for update using (has_permissao('beneficiarios','editar'));
create policy beneficiario_turmas_delete on beneficiario_turmas for delete using (has_permissao('beneficiarios','editar'));

alter table beneficiario_anexos enable row level security;
create policy beneficiario_anexos_select on beneficiario_anexos for select using (has_permissao('beneficiarios','listar'));
create policy beneficiario_anexos_insert on beneficiario_anexos for insert with check (has_permissao('beneficiarios','editar'));
create policy beneficiario_anexos_update on beneficiario_anexos for update using (has_permissao('beneficiarios','editar'));
create policy beneficiario_anexos_delete on beneficiario_anexos for delete using (has_permissao('beneficiarios','editar'));

alter table beneficiario_parq enable row level security;
create policy beneficiario_parq_select on beneficiario_parq for select using (has_permissao('beneficiarios','listar'));
create policy beneficiario_parq_insert on beneficiario_parq for insert with check (has_permissao('beneficiarios','editar'));
create policy beneficiario_parq_update on beneficiario_parq for update using (has_permissao('beneficiarios','editar'));
create policy beneficiario_parq_delete on beneficiario_parq for delete using (has_permissao('beneficiarios','editar'));
