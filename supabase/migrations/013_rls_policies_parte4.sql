-- ══ RBAC ══
alter table perfis enable row level security;
create policy perfis_select on perfis for select using (has_permissao('perfis','listar'));
create policy perfis_insert on perfis for insert with check (has_permissao('perfis','criar'));
create policy perfis_update on perfis for update using (has_permissao('perfis','editar'));
create policy perfis_delete on perfis for delete using (has_permissao('perfis','excluir') and is_sistema = false);

alter table perfil_permissoes enable row level security;
create policy perfil_permissoes_select on perfil_permissoes for select using (has_permissao('perfis','listar'));
create policy perfil_permissoes_insert on perfil_permissoes for insert with check (has_permissao('perfis','editar'));
create policy perfil_permissoes_update on perfil_permissoes for update using (has_permissao('perfis','editar'));
create policy perfil_permissoes_delete on perfil_permissoes for delete using (has_permissao('perfis','editar'));

alter table usuarios enable row level security;
create policy usuarios_select on usuarios for select using (
  deleted_at is null and (has_permissao('usuarios','listar') or id = auth.uid())
);
create policy usuarios_insert on usuarios for insert with check (has_permissao('usuarios','criar'));
create policy usuarios_update on usuarios for update using (has_permissao('usuarios','editar'));
create policy usuarios_delete on usuarios for delete using (has_permissao('usuarios','excluir'));

alter table refresh_tokens enable row level security;
create policy refresh_tokens_select on refresh_tokens for select using (usuario_id = auth.uid());
create policy refresh_tokens_insert on refresh_tokens for insert with check (usuario_id = auth.uid());
create policy refresh_tokens_update on refresh_tokens for update using (usuario_id = auth.uid());
create policy refresh_tokens_delete on refresh_tokens for delete using (usuario_id = auth.uid());
