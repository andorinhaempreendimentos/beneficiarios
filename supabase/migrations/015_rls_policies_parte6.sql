-- ══ Inscrições ══
alter table inscricoes enable row level security;
create policy inscricoes_select on inscricoes for select using (has_permissao('inscricoes','listar'));
create policy inscricoes_insert on inscricoes for insert with check (has_permissao('inscricoes','criar'));
create policy inscricoes_update on inscricoes for update using (has_permissao('inscricoes','editar'));

-- ══ Presença ══
alter table registros_presenca enable row level security;
create policy registros_presenca_select on registros_presenca for select using (has_permissao('presenca','listar'));
create policy registros_presenca_insert on registros_presenca for insert with check (has_permissao('presenca','criar'));
create policy registros_presenca_update on registros_presenca for update using (has_permissao('presenca','criar'));

-- ══ Ponto ══
alter table registros_ponto enable row level security;
create policy registros_ponto_select on registros_ponto for select using (has_permissao('ponto','listar'));
create policy registros_ponto_insert on registros_ponto for insert with check (has_permissao('ponto','criar'));

-- ══ Comprovações de atividade ══
alter table confirmacoes_atividade enable row level security;
create policy confirmacoes_atividade_select on confirmacoes_atividade for select using (has_permissao('comprovacoes','listar'));
create policy confirmacoes_atividade_insert on confirmacoes_atividade for insert with check (has_permissao('comprovacoes','criar'));
