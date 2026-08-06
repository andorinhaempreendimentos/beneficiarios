-- Sincroniza perfil_id e tipo de public.usuarios para auth.users.raw_app_meta_data,
-- para que fiquem disponíveis como app_metadata no JWT (claim padrão do Supabase Auth,
-- sem precisar de Custom Access Token Hook).
create or replace function sync_usuario_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'perfil_id', new.perfil_id,
      'tipo', new.tipo,
      'entidade_id', new.entidade_id
    )
  where id = new.id;
  return new;
end;
$$;

create trigger trg_sync_usuario_app_metadata
  after insert or update of perfil_id, tipo, entidade_id on usuarios
  for each row
  execute function sync_usuario_app_metadata();
