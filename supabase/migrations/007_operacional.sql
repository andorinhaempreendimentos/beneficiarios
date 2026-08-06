-- Equipamentos
create table equipamentos (
  id uuid primary key default gen_random_uuid(),
  nome varchar(300) not null,
  categoria varchar(100),
  quantidade int not null default 1,
  conservacao estado_equipamento not null default 'bom',
  nucleo_id uuid references nucleos(id) on delete set null,
  objeto_id uuid references objetos(id) on delete set null,
  marca varchar(100),
  modelo varchar(100),
  numero_serie varchar(100),
  nota_fiscal varchar(100),
  data_aquisicao date,
  valor_unitario numeric(12,2),
  fotos_keys text,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_equipamentos_nucleo_id on equipamentos(nucleo_id);
create index idx_equipamentos_objeto_id on equipamentos(objeto_id);

-- Inscrições (reserva de vaga / matrícula em turma)
create table inscricoes (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete restrict,
  beneficiario_id uuid not null references beneficiarios(id) on delete restrict,
  status status_inscricao not null default 'pendente',
  origem varchar(20) not null default 'publica',
  expira_em timestamptz,
  observacoes text,
  respostas_formulario jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_inscricoes_turma_status on inscricoes(turma_id, status);
create index idx_inscricoes_beneficiario_id on inscricoes(beneficiario_id);

-- Presença
create table registros_presenca (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete restrict,
  data date not null,
  beneficiario_id uuid not null references beneficiarios(id) on delete restrict,
  presente boolean not null default true,
  status varchar(20) not null default 'presente',
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (turma_id, data, beneficiario_id)
);
create index idx_registros_presenca_turma_data on registros_presenca(turma_id, data);

-- Ponto de funcionário
create table registros_ponto (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references funcionarios(id) on delete restrict,
  data date not null,
  tipo tipo_registro_ponto not null,
  hora time not null,
  status varchar(20) not null default 'ok',
  token_qr_hash varchar(64),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (funcionario_id, data, tipo)
);
create index idx_registros_ponto_funcionario_data on registros_ponto(funcionario_id, data);

-- Comprovações de atividade (fotos/documentos de execução)
create table confirmacoes_atividade (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete restrict,
  data date not null,
  storage_key text not null,
  observacao text,
  enviado_por uuid references usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_confirmacoes_atividade_turma_id on confirmacoes_atividade(turma_id);

-- Configurações do sistema (chave/valor genérico)
create table configuracoes (
  id uuid primary key default gen_random_uuid(),
  chave varchar(100) not null unique,
  valor jsonb not null,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Log de auditoria — sem FK/cascade propositalmente (histórico não deve desaparecer)
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid,
  acao varchar(100) not null,
  entidade varchar(100) not null,
  entidade_id uuid,
  valor_antes jsonb,
  valor_depois jsonb,
  ip_address varchar(45),
  created_at timestamptz not null default now()
);
create index idx_audit_log_entidade on audit_log(entidade, entidade_id);
