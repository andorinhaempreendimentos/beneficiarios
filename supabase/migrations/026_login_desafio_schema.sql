-- Efêmero por natureza — sem soft delete, sem updated_at. Um nonce vive
-- ~5min e é descartado (ou expira) depois de um único uso.
create table login_desafios (
  nonce uuid primary key default gen_random_uuid(),
  beneficiario_id uuid references beneficiarios(id) on delete cascade,
  badges jsonb not null,
  badges_corretos jsonb not null,
  etapa smallint not null default 1,
  tentativas smallint not null default 0,
  usado boolean not null default false,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '5 minutes')
);
create index idx_login_desafios_expira_em on login_desafios(expira_em);

-- só service_role toca aqui (via Edge Function) — nunca exposto por RPC
-- direto ao cliente, senão o próprio front conseguiria ler badges_corretos.
alter table login_desafios enable row level security;
revoke all on login_desafios from anon, authenticated;

-- rate limit dedicado — chave livre (ip::text ou beneficiario_id::text),
-- bloqueio progressivo simples: dobra a janela de bloqueio a cada excesso.
create table login_rate_limit (
  chave text primary key,
  tentativas smallint not null default 0,
  bloqueado_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table login_rate_limit enable row level security;
revoke all on login_rate_limit from anon, authenticated;
