-- create function concede EXECUTE a PUBLIC por padrão (SQL standard) —
-- revoke ... from anon (feito dentro de 018/019) não remove esse grant
-- herdado, só um grant nominal direto. Precisa revogar de PUBLIC mesmo.
revoke execute on function criar_inscricao(uuid, uuid, text, jsonb) from public;
revoke execute on function aprovar_inscricao(uuid) from public;
revoke execute on function recusar_inscricao(uuid, text) from public;
revoke execute on function cancelar_inscricao(uuid) from public;

grant execute on function criar_inscricao(uuid, uuid, text, jsonb) to authenticated;
grant execute on function aprovar_inscricao(uuid) to authenticated;
grant execute on function recusar_inscricao(uuid, text) to authenticated;
grant execute on function cancelar_inscricao(uuid) to authenticated;
