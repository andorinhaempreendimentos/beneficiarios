-- Function central de autorização — equivalente ao PermissaoGuard do NestJS.
-- Lê perfil_id do JWT (app_metadata, sincronizado por trigger em usuarios)
-- e verifica se existe permissão permitido=true para (modulo, acao).
create or replace function has_permissao(p_modulo text, p_acao text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from perfil_permissoes pp
    where pp.perfil_id = (auth.jwt() -> 'app_metadata' ->> 'perfil_id')::uuid
      and pp.modulo = p_modulo
      and pp.acao = p_acao
      and pp.permitido = true
  );
$$;

-- Helper: tipo de usuário logado (admin/gestor/funcionario/beneficiario), a
-- partir do app_metadata. Usado em policies que precisam diferenciar
-- beneficiário (sem perfil_id) de usuário staff.
create or replace function current_tipo_usuario()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select auth.jwt() -> 'app_metadata' ->> 'tipo';
$$;

-- Helper: entidade_id do usuário logado (beneficiario_id quando tipo=beneficiario,
-- funcionario_id quando tipo=funcionario). Usado para policies de "próprio registro".
create or replace function current_entidade_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select (auth.jwt() -> 'app_metadata' ->> 'entidade_id')::uuid;
$$;
