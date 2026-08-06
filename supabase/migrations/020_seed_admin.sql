-- Equivalente a SeedService (onApplicationBootstrap) — idempotente, seguro
-- pra rodar em toda migration run. Perfil Administrador + permissões totais
-- + usuário admin em auth.users (Supabase Auth, não public.usuarios direto).
--
-- Diferença necessária do NestJS original: lá o admin é criado com senha
-- hasheada via argon2 direto na tabela usuarios. Aqui a conta tem que
-- existir em auth.users primeiro (é o Supabase Auth que gerencia senha/
-- sessão) — então este seed cria o perfil e as permissões, mas o usuário
-- admin em si precisa ser criado via Supabase Auth (dashboard ou API) e
-- depois vinculado em public.usuarios com o perfil_id abaixo.
do $$
declare
  v_perfil_id uuid;
begin
  select id into v_perfil_id from perfis where nome = 'Administrador';

  if v_perfil_id is null then
    insert into perfis (nome, descricao, is_sistema)
    values ('Administrador', 'Perfil de administrador do sistema — acesso total', true)
    returning id into v_perfil_id;
  end if;

  insert into perfil_permissoes (perfil_id, modulo, acao, permitido)
  select v_perfil_id, modulo, acao, true
  from (values
    ('beneficiarios','listar'), ('beneficiarios','criar'), ('beneficiarios','editar'), ('beneficiarios','excluir'),
    ('funcionarios','listar'), ('funcionarios','criar'), ('funcionarios','editar'), ('funcionarios','excluir'),
    ('inscricoes','listar'), ('inscricoes','criar'), ('inscricoes','editar'),
    ('presenca','listar'), ('presenca','criar'),
    ('ponto','listar'), ('ponto','criar'),
    ('turmas','listar'), ('turmas','criar'), ('turmas','editar'), ('turmas','excluir'),
    ('equipamentos','listar'), ('equipamentos','criar'), ('equipamentos','editar'), ('equipamentos','excluir'),
    ('configuracoes','listar'), ('configuracoes','editar'), ('configuracoes','excluir'),
    ('relatorios','exportar'),
    ('usuarios','listar'), ('usuarios','criar'), ('usuarios','editar'), ('usuarios','excluir'),
    ('perfis','listar'), ('perfis','criar'), ('perfis','editar'), ('perfis','excluir'),
    ('objetos','listar'), ('objetos','criar'), ('objetos','editar'), ('objetos','excluir'),
    ('organizacoes','listar'), ('organizacoes','criar'), ('organizacoes','editar'), ('organizacoes','excluir'),
    ('nucleos','listar'), ('nucleos','criar'), ('nucleos','editar'), ('nucleos','excluir'),
    ('atividades','listar'), ('atividades','criar'), ('atividades','editar'), ('atividades','excluir'),
    ('comprovacoes','listar'), ('comprovacoes','criar')
  ) as p(modulo, acao)
  on conflict (perfil_id, modulo, acao) do update set permitido = true;
end $$;
