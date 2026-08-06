create or replace function trg_beneficiario_gerar_login()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not validar_nome_completo(new.nome_completo) then
    raise exception 'nome_completo deve conter nome e sobrenome (ex: "Pedro Cardoso")' using errcode = '23514';
  end if;

  if tg_op = 'INSERT' or new.nome_completo is distinct from old.nome_completo then
    new.nome_tokens := extrair_tokens(new.nome_completo);
    new.usuario_login := gerar_usuario_login(new.nome_completo, new.id);
  end if;

  return new;
end;
$$;

create trigger trg_beneficiarios_gerar_login
  before insert or update of nome_completo on beneficiarios
  for each row
  execute function trg_beneficiario_gerar_login();

-- backfill dos beneficiários já cadastrados (se houver)
update beneficiarios
set nome_tokens = extrair_tokens(nome_completo),
    usuario_login = gerar_usuario_login(nome_completo, id)
where usuario_login is null;
