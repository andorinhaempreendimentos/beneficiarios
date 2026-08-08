-- Seed de dados de teste para desenvolvimento local.
-- Espelha os antigos mocks (web/src/lib/mock/*.ts) adaptados ao schema real
-- do Postgres (uuids, enums corretos, FKs obrigatórias).
do $$
declare
  v_obj1 uuid; v_obj2 uuid; v_obj3 uuid; v_obj4 uuid;
  v_org1 uuid; v_org2 uuid; v_org3 uuid; v_org4 uuid;
  v_n1 uuid; v_n2 uuid; v_n3 uuid; v_n4 uuid; v_n5 uuid;
  v_a1 uuid; v_a2 uuid; v_a3 uuid; v_a4 uuid; v_a5 uuid;
  v_t1 uuid; v_t2 uuid; v_t3 uuid; v_t4 uuid;
  v_b1 uuid; v_b3 uuid; v_b4 uuid;
begin
  if exists (select 1 from objetos limit 1) then
    raise notice 'Seed abortado: tabela objetos já contém dados.';
    return;
  end if;

  -- Objetos
  insert into objetos (nome, descricao, termo_de_fomento, codigo_objeto, codigo_programa, nome_programa, tipo_duracao, data_inicio, data_termino, status)
  values ('Programa Esporte na Comunidade', 'Fomento de atividades esportivas em comunidades periféricas', 'TF-2024/001', 'OBJ-001', 'PRG-010', 'Esporte para Todos', 'periodo', '2024-03-01', '2025-02-28', 'ativo')
  returning id into v_obj1;

  insert into objetos (nome, descricao, termo_de_fomento, codigo_objeto, tipo_duracao, data_evento, status)
  values ('Corrida Solidária 2024', 'Evento beneficente com corrida de rua', 'TF-2024/012', 'OBJ-002', 'pontual', '2024-09-15', 'encerrado')
  returning id into v_obj2;

  insert into objetos (nome, descricao, codigo_objeto, codigo_programa, nome_programa, tipo_duracao, data_inicio, data_termino, status)
  values ('Inclusão pelo Esporte', 'Projeto voltado a PcD em modalidades adaptadas', 'OBJ-003', 'PRG-020', 'Vida Ativa', 'periodo', '2025-01-01', '2025-12-31', 'ativo')
  returning id into v_obj3;

  insert into objetos (nome, tipo_duracao, data_evento, status)
  values ('Festival de Artes Marciais', 'pontual', '2025-05-20', 'planejado')
  returning id into v_obj4;

  -- Organizações
  insert into organizacoes (nome, tipo, cnpj, nome_responsavel, telefone, email, cep, endereco, cidade, estado, objeto_id, status)
  values ('Instituto Vida Ativa', 'Instituto', '12.345.678/0001-90', 'Carlos Mendes', '11999887766', 'contato@vidaativa.org.br', '01310-100', 'Av. Paulista, 1000', 'São Paulo', 'SP', v_obj1, 'ativa')
  returning id into v_org1;

  insert into organizacoes (nome, tipo, cnpj, nome_responsavel, telefone, email, cidade, estado, objeto_id, status)
  values ('ONG Esporte Solidário', 'ONG', '98.765.432/0001-10', 'Ana Souza', '21988776655', 'admin@esportesolidario.org', 'Rio de Janeiro', 'RJ', v_obj1, 'ativa')
  returning id into v_org2;

  insert into organizacoes (nome, tipo, nome_responsavel, telefone, cidade, estado, objeto_id, status)
  values ('Associação Mãos que Formam', 'Associação', 'Roberto Lima', '31977665544', 'Belo Horizonte', 'MG', v_obj3, 'ativa')
  returning id into v_org3;

  insert into organizacoes (nome, tipo, cnpj, nome_responsavel, email, cidade, estado, objeto_id, status)
  values ('Fundação Corrida Livre', 'Fundação', '11.222.333/0001-44', 'Marcos Oliveira', 'marcos@corridalivre.org', 'Curitiba', 'PR', v_obj2, 'inativa')
  returning id into v_org4;

  -- Núcleos
  insert into nucleos (identificacao, nome_local, regiao, cep, endereco, numero, cidade, bairro, latitude, longitude, nome_responsavel, telefone_contato, organizacao_id, data_inicio, em_funcionamento, disponivel_pre_inscricao)
  values ('Núcleo Vila Esperança', 'Escola Municipal Vila Esperança', 'Sudeste', '20941-000', 'Rua das Palmeiras', '120', 'Rio de Janeiro', 'São Cristóvão', -22.8968, -43.2196, 'Marcos Alves', '(21) 98877-1122', v_org1, '2023-02-01', true, true)
  returning id into v_n1;

  insert into nucleos (identificacao, nome_local, regiao, cep, endereco, numero, cidade, bairro, nome_responsavel, telefone_contato, organizacao_id, data_inicio, em_funcionamento, disponivel_pre_inscricao)
  values ('Núcleo Jardim das Flores', 'Quadra Poliesportiva Jardim das Flores', 'Sudeste', '21941-590', 'Av. Brasil', '4500', 'Rio de Janeiro', 'Jardim das Flores', 'Renata Souza', '(21) 99123-4455', v_org1, '2022-08-15', true, true)
  returning id into v_n2;

  insert into nucleos (identificacao, nome_local, regiao, cep, endereco, numero, cidade, bairro, nome_responsavel, telefone_contato, organizacao_id, data_inicio, data_fechamento, em_funcionamento, disponivel_pre_inscricao)
  values ('Núcleo Boa Vista', 'Centro Comunitário Boa Vista', 'Nordeste', '50030-230', 'Rua da Aurora', '88', 'Recife', 'Boa Vista', 'Carlos Eduardo Lima', '(81) 98456-7890', v_org2, '2021-05-10', '2025-12-20', false, false)
  returning id into v_n3;

  insert into nucleos (identificacao, nome_local, regiao, cep, endereco, numero, cidade, bairro, nome_responsavel, telefone_contato, organizacao_id, data_inicio, em_funcionamento, disponivel_pre_inscricao)
  values ('Núcleo Alto do Céu', 'Ginásio Alto do Céu', 'Nordeste', '50751-030', 'Rua do Sol', '230', 'Recife', 'Alto do Céu', 'Juliana Ferreira', '(81) 99887-6655', v_org2, '2024-01-20', true, true)
  returning id into v_n4;

  insert into nucleos (identificacao, nome_local, regiao, cep, endereco, numero, cidade, bairro, nome_responsavel, telefone_contato, organizacao_id, data_inicio, em_funcionamento, disponivel_pre_inscricao)
  values ('Núcleo Vila Nova', 'Quadra Vila Nova', 'Sul', '90040-060', 'Av. Ipiranga', '1500', 'Porto Alegre', 'Azenha', 'Paulo Ricardo', '(51) 99765-4321', v_org3, '2023-09-05', true, true)
  returning id into v_n5;

  -- Atividades (mock não vincula a núcleo, mas o schema real exige — distribuídas de forma coerente com as turmas abaixo)
  insert into atividades (nome, disponivel_pre_inscricao, idade_minima, idade_maxima, nucleo_id, tipo_aprovacao)
  values ('Futebol', true, 6, 17, v_n1, 'automatica')
  returning id into v_a1;

  insert into atividades (nome, disponivel_pre_inscricao, idade_minima, idade_maxima, nucleo_id, tipo_aprovacao)
  values ('Futsal', true, 8, 16, v_n1, 'automatica')
  returning id into v_a2;

  insert into atividades (nome, disponivel_pre_inscricao, idade_minima, nucleo_id, tipo_aprovacao)
  values ('Funcional', true, 14, v_n2, 'automatica')
  returning id into v_a3;

  insert into atividades (nome, disponivel_pre_inscricao, idade_minima, nucleo_id, tipo_aprovacao)
  values ('Karatê', false, 5, v_n4, 'manual')
  returning id into v_a4;

  insert into atividades (nome, disponivel_pre_inscricao, idade_minima, nucleo_id, tipo_aprovacao)
  values ('Jiu-Jitsu', true, 7, v_n5, 'automatica')
  returning id into v_a5;

  -- Turmas
  insert into turmas (nome, nucleo_id, atividade_id, vagas_totais, exclusiva, data_inicio)
  values ('Futebol Manhã A', v_n1, v_a1, 30, false, '2023-02-05')
  returning id into v_t1;

  insert into turmas (nome, nucleo_id, atividade_id, vagas_totais, exclusiva, data_inicio)
  values ('Futsal Tarde B', v_n1, v_a2, 25, true, '2023-03-01')
  returning id into v_t2;

  insert into turmas (nome, nucleo_id, atividade_id, vagas_totais, exclusiva, data_inicio)
  values ('Funcional Noite', v_n2, v_a3, 20, false, '2023-09-10')
  returning id into v_t3;

  insert into turmas (nome, nucleo_id, atividade_id, vagas_totais, exclusiva, data_inicio)
  values ('Jiu-Jitsu Manhã', v_n5, v_a5, 22, false, '2023-10-02')
  returning id into v_t4;

  -- Funcionários
  insert into funcionarios (matricula, nome_completo, professor_responsavel, cpf, data_nascimento, status, data_admissao, funcao, remuneracao, nucleo_id, alocado_em)
  values ('FN-0001', 'Marcos Alves Pereira', true, '123.456.789-00', '1988-05-12', 'contratado', '2023-02-01', 'Instrutor', 2400.00, v_n1, 'Núcleo Vila Esperança');

  insert into funcionarios (matricula, nome_completo, professor_responsavel, cpf, data_nascimento, status, data_admissao, funcao, remuneracao, nucleo_id, alocado_em)
  values ('FN-0002', 'Renata Souza Braga', true, '987.654.321-00', '1990-11-03', 'contratado', '2022-08-15', 'Coordenador de núcleo', 3200.00, v_n1, 'Núcleo Vila Esperança');

  insert into funcionarios (matricula, nome_completo, professor_responsavel, cpf, data_nascimento, status, data_admissao, data_demissao, funcao, nucleo_id, alocado_em)
  values ('FN-0003', 'Carlos Eduardo Lima', false, '456.123.789-00', '1985-02-27', 'demitido', '2021-05-10', '2025-12-20', 'Monitor', v_n3, 'Núcleo Boa Vista');

  insert into funcionarios (matricula, nome_completo, professor_responsavel, cpf, data_nascimento, status, data_admissao, funcao, remuneracao, alocado_em)
  values ('FN-0004', 'Juliana Ferreira Costa', true, '321.654.987-00', '1992-07-19', 'contratado', '2024-01-20', 'Coordenador de projeto', 3800.00, 'Administração');

  insert into funcionarios (matricula, nome_completo, professor_responsavel, cpf, data_nascimento, status, data_admissao, funcao, nucleo_id, alocado_em)
  values ('FN-0005', 'Paulo Ricardo Santos', true, '654.987.321-00', '1987-12-01', 'licenca_medica', '2023-09-05', 'Instrutor', v_n5, 'Núcleo Vila Nova');

  insert into funcionarios (matricula, nome_completo, professor_responsavel, cpf, data_nascimento, status, data_admissao, funcao, conselho, registro_conselho, alocado_em)
  values ('FN-0006', 'Fernanda Lopes Martins', false, '789.321.654-00', '1995-04-08', 'pendente', '2026-07-01', 'Fisioterapeuta', 'CREFITO', 'CREFITO-12345', 'Múlti. núcleos');

  -- Beneficiários (status mantido como texto livre, igual ao usado pela UI)
  insert into beneficiarios (matricula, nome_completo, data_nascimento, sexo, data_cadastro, pcd, nucleo_id, status, tipo_matricula, celular, cep, logradouro, numero, bairro, cidade, estado)
  values ('2024-0001', 'Ana Beatriz Souza Lima', '2012-04-15', 'F', '2024-02-01', false, v_n1, 'ativo', 'online', '21987654321', '20941-000', 'Rua das Palmeiras', '45', 'São Cristóvão', 'Rio de Janeiro', 'RJ')
  returning id into v_b1;

  insert into beneficiarios (matricula, nome_completo, data_nascimento, sexo, data_cadastro, pcd, nucleo_id, status, tipo_matricula, celular, cep, logradouro, numero, bairro, cidade, estado)
  values ('2024-0002', 'Pedro Henrique Alves', '2010-09-22', 'M', '2024-02-03', false, v_n1, 'Fila de espera', 'online', '21988552211', '20941-010', 'Rua Barão de São Félix', '12', 'São Cristóvão', 'Rio de Janeiro', 'RJ');

  insert into beneficiarios (matricula, nome_completo, data_nascimento, sexo, data_cadastro, pcd, tipo_pcd, nucleo_id, status, tipo_matricula, celular, cep, logradouro, numero, bairro, cidade, estado)
  values ('2024-0003', 'Maria Clara Ferreira', '2014-01-30', 'F', '2024-01-20', true, 'Autismo (Leve)', v_n2, 'ativo', 'interna', '21998877665', '21941-590', 'Av. Brasil', '300', 'Jardim das Flores', 'Rio de Janeiro', 'RJ')
  returning id into v_b3;

  insert into beneficiarios (matricula, nome_completo, data_nascimento, sexo, data_cadastro, pcd, nucleo_id, status, tipo_matricula, celular, cep, logradouro, numero, bairro, cidade, estado)
  values ('2024-0004', 'João Vitor Martins', '2009-11-05', 'M', '2023-11-10', false, v_n5, 'inativo', 'online', '51998765432', '90040-060', 'Av. Ipiranga', '1520', 'Azenha', 'Porto Alegre', 'RS')
  returning id into v_b4;

  insert into beneficiarios (matricula, nome_completo, data_nascimento, sexo, data_cadastro, pcd, nucleo_id, status, tipo_matricula, celular, cep, logradouro, numero, bairro, cidade, estado)
  values ('2024-0005', 'Larissa Gomes Cardoso', '2013-06-18', 'F', '2024-03-02', false, v_n4, 'pendente', 'online', '81997765544', '50751-030', 'Rua do Sol', '210', 'Alto do Céu', 'Recife', 'PE');

  insert into beneficiarios (matricula, nome_completo, data_nascimento, sexo, data_cadastro, pcd, nucleo_id, status, tipo_matricula, celular, cep, logradouro, numero, bairro, cidade, estado)
  values ('2024-0006', 'Gabriel Rodrigues Nunes', '2011-03-08', 'M', '2024-02-14', false, v_n5, 'pendente', 'interna', '51988112233', '90040-070', 'Av. Ipiranga', '1600', 'Azenha', 'Porto Alegre', 'RS');

  -- Vínculos beneficiário ↔ turma (só os que o mock marcava como ativos/evadidos)
  insert into beneficiario_turmas (beneficiario_id, turma_id, status, data_matricula)
  values (v_b1, v_t1, 'ativo', '2024-02-05');

  insert into beneficiario_turmas (beneficiario_id, turma_id, status, data_matricula, data_evasao)
  values (v_b3, v_t3, 'ativo', '2024-01-25', null);

  insert into beneficiario_turmas (beneficiario_id, turma_id, status, data_matricula, data_evasao)
  values (v_b4, v_t4, 'evadido', '2023-11-15', '2023-11-15');

  -- Equipamentos
  insert into equipamentos (nome, categoria, quantidade, conservacao, nucleo_id, objeto_id, nota_fiscal, data_aquisicao, valor_unitario)
  values ('Bola de Futebol Oficial', 'Esportivo', 20, 'bom', v_n1, v_obj1, 'NF-2024-0045', '2024-03-10', 89.90);

  insert into equipamentos (nome, categoria, quantidade, conservacao, nucleo_id, objeto_id, nota_fiscal, data_aquisicao, valor_unitario)
  values ('Colchonete EVA', 'Esportivo', 40, 'otimo', v_n2, v_obj1, 'NF-2024-0102', '2024-05-15', 35.00);

  insert into equipamentos (nome, categoria, quantidade, conservacao, nucleo_id, objeto_id, nota_fiscal, data_aquisicao, valor_unitario)
  values ('Notebook Dell Inspiron', 'Informática', 3, 'bom', v_n1, v_obj1, 'NF-2024-0200', '2024-01-20', 3200.00);

  insert into equipamentos (nome, categoria, quantidade, conservacao, nucleo_id, objeto_id, observacao)
  values ('Kimono Jiu-Jitsu Infantil', 'Vestuário', 15, 'regular', v_n5, v_obj1, 'Alguns com costura soltando');

  insert into equipamentos (nome, categoria, quantidade, conservacao, nucleo_id, data_aquisicao, valor_unitario)
  values ('Mesa de Escritório', 'Mobiliário', 5, 'bom', v_n1, '2023-06-10', 450.00);
end $$;
