-- Objetos (projetos de fomento)
create table objetos (
  id uuid primary key default gen_random_uuid(),
  nome varchar(200) not null,
  descricao text,
  termo_de_fomento varchar(200),
  codigo_objeto varchar(100),
  codigo_programa varchar(100),
  nome_programa varchar(200),
  tipo_duracao tipo_duracao_atividade not null default 'periodo',
  data_evento date,
  data_inicio date,
  data_termino date,
  status varchar(20) not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Organizações
create table organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome varchar(200) not null,
  cnpj varchar(18),
  endereco text,
  telefone varchar(20),
  email varchar(200),
  objeto_id uuid not null references objetos(id) on delete restrict,
  status varchar(20) not null default 'ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_organizacoes_objeto_id on organizacoes(objeto_id);

-- Núcleos
create table nucleos (
  id uuid primary key default gen_random_uuid(),
  identificacao varchar(200) not null,
  nome_local varchar(200),
  regiao varchar(100),
  cep varchar(10),
  endereco text,
  numero varchar(20),
  cidade varchar(200),
  bairro varchar(200),
  complemento varchar(200),
  latitude numeric(10,7),
  longitude numeric(10,7),
  nome_responsavel varchar(300),
  telefone_contato varchar(20),
  organizacao_id uuid not null references organizacoes(id) on delete restrict,
  data_inicio date not null,
  data_fechamento date,
  em_funcionamento boolean not null default true,
  disponivel_pre_inscricao boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_nucleos_organizacao_id on nucleos(organizacao_id);

-- Atividades
create table atividades (
  id uuid primary key default gen_random_uuid(),
  nome varchar(200) not null,
  descricao text,
  idade_minima smallint,
  idade_maxima smallint,
  tipo_aprovacao tipo_aprovacao not null default 'automatica',
  disponivel_pre_inscricao boolean not null default false,
  nucleo_id uuid not null references nucleos(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_atividades_nucleo_id on atividades(nucleo_id);

-- Perguntas de atividade (formulário de inscrição)
create table atividade_perguntas (
  id uuid primary key default gen_random_uuid(),
  enunciado text not null,
  tipo tipo_pergunta not null default 'texto',
  opcoes text,
  obrigatoria boolean not null default false,
  disponivel_inscricao boolean not null default true,
  ordem smallint not null default 0,
  atividade_id uuid not null references atividades(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_atividade_perguntas_atividade_id on atividade_perguntas(atividade_id);

-- Turnos de atividade
create table atividade_turnos (
  id uuid primary key default gen_random_uuid(),
  nome varchar(100) not null,
  hora_inicio time not null,
  hora_fim time not null,
  atividade_id uuid not null references atividades(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_atividade_turnos_atividade_id on atividade_turnos(atividade_id);
