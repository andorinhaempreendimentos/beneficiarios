-- Banco curado de nomes/sobrenomes comuns no Brasil, usados como
-- distratores na grade de login — nunca extraídos de outros beneficiários
-- (vazaria fragmento de PII de terceiros). Tamanho/frequência similar aos
-- nomes reais evita que o nome certo "destaque" visualmente na grade.
create table login_distratores (
  id uuid primary key default gen_random_uuid(),
  token varchar(50) not null unique,
  categoria varchar(20) not null default 'geral' -- 'primeiro_nome' | 'sobrenome' | 'geral'
);
alter table login_distratores enable row level security;
revoke all on login_distratores from anon, authenticated;
grant select on login_distratores to service_role;

insert into login_distratores (token, categoria) values
  ('jorge','primeiro_nome'),('fabricio','primeiro_nome'),('marcelo','primeiro_nome'),
  ('rafael','primeiro_nome'),('gustavo','primeiro_nome'),('leandro','primeiro_nome'),
  ('rodrigo','primeiro_nome'),('felipe','primeiro_nome'),('bruno','primeiro_nome'),
  ('diego','primeiro_nome'),('thiago','primeiro_nome'),('vinicius','primeiro_nome'),
  ('juliana','primeiro_nome'),('fernanda','primeiro_nome'),('camila','primeiro_nome'),
  ('patricia','primeiro_nome'),('aline','primeiro_nome'),('bruna','primeiro_nome'),
  ('larissa','primeiro_nome'),('debora','primeiro_nome'),('renata','primeiro_nome'),
  ('milani','sobrenome'),('andrade','sobrenome'),('matias','sobrenome'),
  ('braganca','sobrenome'),('nogueira','sobrenome'),('carvalho','sobrenome'),
  ('teixeira','sobrenome'),('barbosa','sobrenome'),('cavalcanti','sobrenome'),
  ('monteiro','sobrenome'),('correia','sobrenome'),('pinheiro','sobrenome'),
  ('siqueira','sobrenome'),('azevedo','sobrenome'),('figueiredo','sobrenome'),
  ('bezerra','sobrenome'),('macedo','sobrenome'),('quental','sobrenome'),
  ('valadares','sobrenome'),('serpa','sobrenome')
on conflict (token) do nothing;
