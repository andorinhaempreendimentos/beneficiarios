-- Reverte 024-031: cliente decidiu que não haverá área de beneficiário
-- (sem login, sem visualização de agenda/atividades). Beneficiário passa
-- a ser gerido só por staff via CRUD, sem autenticação própria.
drop trigger if exists trg_beneficiarios_gerar_login on beneficiarios;
drop function if exists trg_beneficiario_gerar_login();
drop function if exists validar_etapa2_login(uuid, text, text);
drop function if exists validar_etapa1_login(uuid, text[]);
drop function if exists gerar_desafio_login(text, inet, text);
drop function if exists checar_e_registrar_tentativa(text);
drop function if exists limpar_rate_limit(text);
drop table if exists login_distratores;
drop table if exists login_rate_limit;
drop table if exists login_desafios;
drop function if exists gerar_usuario_login(text, uuid);
drop function if exists validar_nome_completo(text);
drop function if exists extrair_tokens(text);
drop function if exists normalizar_nome(text);

alter table beneficiarios
  drop column if exists usuario_login,
  drop column if exists nome_tokens;

delete from beneficiarios where matricula = 'TEST001';
