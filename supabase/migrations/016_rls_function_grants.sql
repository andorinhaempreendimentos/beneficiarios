-- Fecha os advisories de segurança do linter: essas functions são helpers
-- internos usados dentro de policies RLS, não endpoints públicos. Por padrão
-- o Postgres concede EXECUTE a PUBLIC (o que o PostgREST expõe como RPC).
-- Revoga de anon/PUBLIC; mantém só para authenticated, que é quem as RLS
-- policies efetivamente invocam ao avaliar SELECT/INSERT/UPDATE/DELETE.
revoke execute on function has_permissao(text, text) from public;
grant execute on function has_permissao(text, text) to authenticated;

revoke execute on function current_tipo_usuario() from public;
grant execute on function current_tipo_usuario() to authenticated;

revoke execute on function current_entidade_id() from public;
grant execute on function current_entidade_id() to authenticated;

-- Trigger function — nunca deve ser chamada diretamente (depende de
-- contexto NEW/OLD/TG_OP). Execução de trigger não checa EXECUTE do
-- grantee, então revogar de todos não quebra o trigger em usuarios.
revoke execute on function sync_usuario_app_metadata() from public;
