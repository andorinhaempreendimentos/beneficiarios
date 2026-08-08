-- Tipo de matrícula passa a registrar a origem do cadastro: online | interna
-- 'online'  -> vindo do formulário de inscrição pública
-- 'interna' -> cadastrado por alguém da equipe pelo painel
-- Legado: default 'regular' nunca foi preenchido por formulário; vira 'interna'.

alter table beneficiarios alter column tipo_matricula drop default;

update beneficiarios
set tipo_matricula = case
  when lower(tipo_matricula) = 'online' then 'online'
  else 'interna'
end;

alter table beneficiarios alter column tipo_matricula set default 'interna';

alter table beneficiarios
  add constraint beneficiarios_tipo_matricula_check
  check (tipo_matricula in ('online', 'interna'));
