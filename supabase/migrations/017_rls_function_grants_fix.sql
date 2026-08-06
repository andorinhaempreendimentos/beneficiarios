-- 016 revogou de PUBLIC, mas o Supabase concede EXECUTE explicitamente a
-- anon/authenticated via default privileges do schema public em toda
-- function nova — revoke de PUBLIC não afeta esses grants nominais.
-- Revoga explicitamente de anon (nenhum motivo pra anônimo chamar) e mantém
-- authenticated só nas 3 usadas pelas policies RLS.
revoke execute on function has_permissao(text, text) from anon;
revoke execute on function current_tipo_usuario() from anon;
revoke execute on function current_entidade_id() from anon;

revoke execute on function sync_usuario_app_metadata() from anon;
revoke execute on function sync_usuario_app_metadata() from authenticated;
revoke execute on function sync_usuario_app_metadata() from service_role;
