-- Inserir permissões de pesquisas para Coordenador de Núcleo e Administrador
INSERT INTO perfil_permissoes (perfil_id, modulo, acao, permitido)
VALUES 
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'pesquisas', 'listar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'pesquisas', 'visualizar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'pesquisas', 'criar', true),
  ('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'pesquisas', 'editar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'pesquisas', 'listar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'pesquisas', 'visualizar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'pesquisas', 'criar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'pesquisas', 'editar', true),
  ('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'pesquisas', 'excluir', true)
ON CONFLICT (perfil_id, modulo, acao) DO UPDATE SET permitido = true;
