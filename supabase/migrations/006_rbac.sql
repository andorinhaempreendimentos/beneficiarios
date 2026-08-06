-- Perfis (grupos de permissão)
create table perfis (
  id uuid primary key default gen_random_uuid(),
  nome varchar(100) not null unique,
  descricao text,
  is_sistema boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Permissões por perfil (módulo + ação)
create table perfil_permissoes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  modulo varchar(100) not null,
  acao varchar(100) not null,
  permitido boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (perfil_id, modulo, acao)
);

-- Usuários da aplicação — 1:1 com auth.users do Supabase Auth.
-- id é o mesmo id de auth.users (FK direta), não um uuid independente.
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar(200) not null unique,
  nome_completo varchar(300) not null,
  tipo tipo_usuario not null default 'gestor',
  ativo boolean not null default true,
  entidade_id uuid,
  perfil_id uuid not null references perfis(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_usuarios_perfil_id on usuarios(perfil_id);

-- Refresh tokens — mantido só para compatibilidade de auditoria/histórico.
-- Supabase Auth já gerencia refresh/rotação nativamente; esta tabela não é
-- mais o mecanismo de sessão, mas fica disponível se algum fluxo customizado
-- (ex: login de beneficiário) precisar registrar emissões.
create table refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  hash varchar(64) not null unique,
  expira_em timestamptz not null,
  revogado boolean not null default false,
  user_agent text,
  ip_address varchar(45),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_refresh_tokens_usuario_id on refresh_tokens(usuario_id);
