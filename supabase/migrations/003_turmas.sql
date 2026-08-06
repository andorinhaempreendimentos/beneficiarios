-- Turmas
create table turmas (
  id uuid primary key default gen_random_uuid(),
  nome varchar(200) not null,
  nucleo_id uuid not null references nucleos(id) on delete restrict,
  atividade_id uuid not null references atividades(id) on delete restrict,
  vagas_totais smallint not null default 30,
  exclusiva boolean not null default false,
  data_inicio date,
  data_fim date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_turmas_nucleo_atividade on turmas(nucleo_id, atividade_id);

-- Horários da turma
create table turma_horarios (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null,
  turma_id uuid not null references turmas(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_turma_horarios_turma_id on turma_horarios(turma_id);
