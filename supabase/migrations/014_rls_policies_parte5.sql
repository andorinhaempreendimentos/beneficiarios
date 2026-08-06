-- ══ Equipamentos ══
alter table equipamentos enable row level security;
create policy equipamentos_select on equipamentos for select using (deleted_at is null and has_permissao('equipamentos','listar'));
create policy equipamentos_insert on equipamentos for insert with check (has_permissao('equipamentos','criar'));
create policy equipamentos_update on equipamentos for update using (has_permissao('equipamentos','editar'));
create policy equipamentos_delete on equipamentos for delete using (has_permissao('equipamentos','excluir'));

-- ══ Configurações ══
alter table configuracoes enable row level security;
create policy configuracoes_select on configuracoes for select using (has_permissao('configuracoes','listar'));
create policy configuracoes_insert on configuracoes for insert with check (has_permissao('configuracoes','editar'));
create policy configuracoes_update on configuracoes for update using (has_permissao('configuracoes','editar'));
create policy configuracoes_delete on configuracoes for delete using (has_permissao('configuracoes','excluir'));

-- ══ Audit log — somente leitura por permissão dedicada; escrita só via trigger/service role ══
alter table audit_log enable row level security;
create policy audit_log_select on audit_log for select using (has_permissao('configuracoes','listar'));
