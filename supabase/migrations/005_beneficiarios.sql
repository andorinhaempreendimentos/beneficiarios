-- Beneficiários
create table beneficiarios (
  id uuid primary key default gen_random_uuid(),
  matricula varchar(20) not null unique,
  nome_completo varchar(300) not null,
  nome_social varchar(300),
  data_nascimento date not null,
  sexo sexo_beneficiario not null default 'N',
  data_cadastro date not null default current_date,
  pcd boolean not null default false,
  tipo_pcd varchar(100),
  nucleo_id uuid references nucleos(id) on delete set null,
  status varchar(20) not null default 'ativo',
  tipo_matricula varchar(20) not null default 'regular',
  celular varchar(20) not null,
  cep varchar(10),
  logradouro varchar(300),
  numero varchar(20),
  bairro varchar(200),
  cidade varchar(200),
  estado varchar(2),
  cpf varchar(14),
  foto_url text,
  nome_responsavel varchar(300),
  celular_responsavel varchar(20),
  cpf_responsavel varchar(14),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index idx_beneficiarios_cpf on beneficiarios(cpf) where cpf is not null;

-- Matrícula do beneficiário em turma
create table beneficiario_turmas (
  id uuid primary key default gen_random_uuid(),
  beneficiario_id uuid not null references beneficiarios(id) on delete restrict,
  turma_id uuid not null references turmas(id) on delete restrict,
  status status_beneficiario_turma not null default 'ativo',
  data_matricula date not null default current_date,
  data_evasao date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (beneficiario_id, turma_id)
);

-- Anexos do beneficiário (documentos, atestados)
create table beneficiario_anexos (
  id uuid primary key default gen_random_uuid(),
  beneficiario_id uuid not null references beneficiarios(id) on delete cascade,
  tipo tipo_anexo not null default 'outro',
  storage_key text not null,
  nome_original varchar(300),
  mime_type varchar(100),
  tamanho_bytes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_beneficiario_anexos_beneficiario_id on beneficiario_anexos(beneficiario_id);

-- PAR-Q (questionário de prontidão para atividade física) — 1:1 com beneficiário
create table beneficiario_parq (
  id uuid primary key default gen_random_uuid(),
  beneficiario_id uuid not null unique references beneficiarios(id) on delete cascade,
  respostas jsonb not null,
  data_resposta date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
