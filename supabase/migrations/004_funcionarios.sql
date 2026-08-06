-- Funcionários
create table funcionarios (
  id uuid primary key default gen_random_uuid(),
  matricula varchar(20) not null unique,
  nome_completo varchar(300) not null,
  data_nascimento date,
  cpf varchar(14),
  celular varchar(20),
  email varchar(200),
  cargo cargo_funcionario not null default 'professor',
  foto_url text,
  status varchar(20) not null default 'ativo',
  data_admissao date,
  nucleo_id uuid references nucleos(id) on delete set null,
  alocado_em varchar(200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Jornada semanal do funcionário
create table funcionario_jornada (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references funcionarios(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_entrada time,
  hora_saida time,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (funcionario_id, dia_semana)
);

-- Responsáveis (funcionários) por turma
create table turma_responsaveis (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete cascade,
  funcionario_id uuid not null references funcionarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (turma_id, funcionario_id)
);
