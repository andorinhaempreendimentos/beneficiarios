-- ============================================================
-- BACKUP SUPABASE - Andorinha - 2026-08-17T22:00:00-03:00
-- Exportado via MCP (não é pg_dump completo)
-- NOTA: Certificar-se de que '/backup/' ou 'backup/' está listado no .gitignore
-- ============================================================

-- ============================================================
-- SECTION 1: SCHEMA (Definições de Tabelas e Colunas)
-- ============================================================

-- Tabela: public.perfis
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - nome: character varying(100) NOT NULL
--   - descricao: text
--   - is_sistema: boolean NOT NULL DEFAULT false
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.perfil_permissoes
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - perfil_id: uuid NOT NULL
--   - modulo: character varying(100) NOT NULL
--   - acao: character varying(100) NOT NULL
--   - permitido: boolean NOT NULL DEFAULT false
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.funcoes
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - nome: character varying(100) NOT NULL
--   - descricao: text
--   - permite_login: boolean NOT NULL DEFAULT true
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.objetos
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - nome: character varying(200) NOT NULL
--   - descricao: text
--   - termo_de_fomento: character varying(200)
--   - codigo_objeto: character varying(100)
--   - codigo_programa: character varying(100)
--   - nome_programa: character varying(200)
--   - tipo_duracao: tipo_duracao_atividade NOT NULL DEFAULT 'periodo'::tipo_duracao_atividade
--   - data_evento: date
--   - data_inicio: date
--   - data_termino: date
--   - status: character varying(20) NOT NULL DEFAULT 'ativo'::character varying
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.organizacoes
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - nome: character varying(200) NOT NULL
--   - cnpj: character varying(18)
--   - endereco: text
--   - telefone: character varying(20)
--   - email: character varying(200)
--   - objeto_id: uuid NOT NULL
--   - status: character varying(20) NOT NULL DEFAULT 'ativa'::character varying
--   - tipo: character varying(30) NOT NULL DEFAULT 'Outro'::character varying
--   - nome_responsavel: character varying(200)
--   - cep: character varying(9)
--   - cidade: character varying(120)
--   - estado: character varying(2)
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.nucleos
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - identificacao: character varying(200) NOT NULL
--   - nome_local: character varying(200)
--   - regiao: character varying(100)
--   - cep: character varying(10)
--   - endereco: text
--   - numero: character varying(20)
--   - cidade: character varying(200)
--   - bairro: character varying(200)
--   - complemento: character varying(200)
--   - latitude: numeric
--   - longitude: numeric
--   - nome_responsavel: character varying(300)
--   - telefone_contato: character varying(20)
--   - organizacao_id: uuid NOT NULL
--   - data_inicio: date NOT NULL
--   - data_fechamento: date
--   - em_funcionamento: boolean NOT NULL DEFAULT true
--   - disponivel_pre_inscricao: boolean NOT NULL DEFAULT false
--   - tipo_restricao_chamada: text DEFAULT 'data'::text
--   - permitir_chamada_retroativa: boolean DEFAULT false
--   - tolerancia_inicio_minutos: integer DEFAULT 15
--   - tolerancia_fim_minutos: integer DEFAULT 15
--   - dias_limite_retroativo: integer DEFAULT 7
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.funcionarios
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - matricula: character varying(20) NOT NULL
--   - nome_completo: character varying(300) NOT NULL
--   - data_nascimento: date
--   - cpf: character varying(14)
--   - celular: character varying(20)
--   - email: character varying(200)
--   - foto_url: text
--   - status: character varying(20) NOT NULL DEFAULT 'ativo'::character varying
--   - data_admissao: date
--   - nucleo_id: uuid
--   - alocado_em: character varying(200)
--   - funcao: character varying(100)
--   - remuneracao: numeric
--   - conselho: character varying(100)
--   - registro_conselho: character varying(100)
--   - data_demissao: date
--   - professor_responsavel: boolean NOT NULL DEFAULT false
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.funcionario_jornada
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - funcionario_id: uuid NOT NULL
--   - dia_semana: smallint NOT NULL
--   - hora_entrada: time without time zone
--   - hora_saida: time without time zone
--   - ativo: boolean NOT NULL DEFAULT true
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.usuarios
--   - id: uuid NOT NULL
--   - email: character varying(200) NOT NULL
--   - nome_completo: character varying(300) NOT NULL
--   - tipo: tipo_usuario NOT NULL DEFAULT 'gestor'::tipo_usuario
--   - ativo: boolean NOT NULL DEFAULT true
--   - entidade_id: uuid
--   - perfil_id: uuid NOT NULL
--   - is_professor: boolean DEFAULT false
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.atividades
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - nome: character varying(200) NOT NULL
--   - descricao: text
--   - idade_minima: smallint
--   - idade_maxima: smallint
--   - tipo_aprovacao: tipo_aprovacao NOT NULL DEFAULT 'automatica'::tipo_aprovacao
--   - disponivel_pre_inscricao: boolean NOT NULL DEFAULT false
--   - nucleo_id: uuid
--   - uso_interno: boolean DEFAULT false
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.nucleo_atividades
--   - nucleo_id: uuid NOT NULL
--   - atividade_id: uuid NOT NULL
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.atividade_turnos
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - nome: character varying(100) NOT NULL
--   - hora_inicio: time without time zone NOT NULL
--   - hora_fim: time without time zone NOT NULL
--   - atividade_id: uuid NOT NULL
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.atividade_perguntas
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - enunciado: text NOT NULL
--   - tipo: tipo_pergunta NOT NULL DEFAULT 'texto'::tipo_pergunta
--   - opcoes: text
--   - obrigatoria: boolean NOT NULL DEFAULT false
--   - disponivel_inscricao: boolean NOT NULL DEFAULT true
--   - ordem: smallint NOT NULL DEFAULT 0
--   - atividade_id: uuid NOT NULL
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.turmas
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - nome: character varying(200) NOT NULL
--   - nucleo_id: uuid NOT NULL
--   - atividade_id: uuid NOT NULL
--   - vagas_totais: smallint NOT NULL DEFAULT 30
--   - exclusiva: boolean NOT NULL DEFAULT false
--   - data_inicio: date
--   - data_fim: date
--   - status_inicial: status_inscricao NOT NULL DEFAULT 'aprovada'::status_inscricao
--   - idade_minima: smallint DEFAULT 6
--   - idade_maxima: smallint DEFAULT 17
--   - permitir_fila_espera: boolean NOT NULL DEFAULT true
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.turma_horarios
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - dia_semana: smallint NOT NULL
--   - hora_inicio: time without time zone NOT NULL
--   - hora_fim: time without time zone NOT NULL
--   - turma_id: uuid NOT NULL
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.turma_responsaveis
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - turma_id: uuid NOT NULL
--   - funcionario_id: uuid NOT NULL
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.beneficiarios
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - matricula: character varying(20) NOT NULL
--   - nome_completo: character varying(300) NOT NULL
--   - nome_social: character varying(300)
--   - data_nascimento: date NOT NULL
--   - sexo: sexo_beneficiario NOT NULL DEFAULT 'N'::sexo_beneficiario
--   - data_cadastro: date NOT NULL DEFAULT CURRENT_DATE
--   - pcd: boolean NOT NULL DEFAULT false
--   - tipo_pcd: character varying(100)
--   - nucleo_id: uuid
--   - status: character varying(20) NOT NULL DEFAULT 'pendente'::character varying
--   - tipo_matricula: character varying(20) NOT NULL DEFAULT 'interna'::character varying
--   - celular: character varying(20)
--   - cep: character varying(10)
--   - logradouro: character varying(300)
--   - numero: character varying(20)
--   - bairro: character varying(200)
--   - cidade: character varying(200)
--   - estado: character varying(2)
--   - cpf: character varying(14)
--   - foto_url: text
--   - nome_responsavel: character varying(300)
--   - celular_responsavel: character varying(20)
--   - cpf_responsavel: character varying(14)
--   - raca: character varying(50)
--   - comorbidades: character varying(100)
--   - nivel_escolaridade: character varying(100)
--   - ocupacao_atual: character varying(100)
--   - situacao_moradia: character varying(100)
--   - beneficio_socioassistencial: character varying(100)
--   - telefone_residencial: character varying(20)
--   - pessoas_em_casa: character varying(50)
--   - razoes_inscricao: text
--   - observacoes: text
--   - complemento: character varying(100)
--   - rg: character varying(20)
--   - orgao_expedidor: character varying(20)
--   - uf_expedidor: character(2)
--   - nome_pai: character varying(150)
--   - nome_mae: character varying(150)
--   - numero_nis: character varying(20)
--   - mora_com: character varying(50)
--   - tamanho_uniforme: character varying(5)
--   - uniforme_entregue: boolean NOT NULL DEFAULT false
--   - email: character varying(150)
--   - email_responsavel: character varying(150)
--   - rg_responsavel: character varying(20)
--   - rede_ensino: character varying(50)
--   - nome_escola: character varying(150)
--   - turno_escolar: character varying(20)
--   - segmento_escolar: character varying(100)
--   - serie: character varying(50)
--   - turma_escolar: character varying(50)
--   - codigo_atleta: character varying(50)
--   - origem: character varying(20) DEFAULT 'interna'::character varying
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.beneficiario_turmas
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - beneficiario_id: uuid NOT NULL
--   - turma_id: uuid NOT NULL
--   - status: status_beneficiario_turma NOT NULL DEFAULT 'ativo'::status_beneficiario_turma
--   - data_matricula: date NOT NULL DEFAULT CURRENT_DATE
--   - data_evasao: date
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.beneficiario_anexos
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - beneficiario_id: uuid NOT NULL
--   - tipo: tipo_anexo NOT NULL DEFAULT 'outro'::tipo_anexo
--   - storage_key: text NOT NULL
--   - nome_original: character varying(300)
--   - mime_type: character varying(100)
--   - tamanho_bytes: integer
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.beneficiario_parq
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - beneficiario_id: uuid NOT NULL
--   - respostas: jsonb NOT NULL
--   - data_resposta: date NOT NULL DEFAULT CURRENT_DATE
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.inscricoes
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - turma_id: uuid NOT NULL
--   - beneficiario_id: uuid NOT NULL
--   - status: status_inscricao NOT NULL DEFAULT 'pendente'::status_inscricao
--   - origem: character varying(20) NOT NULL DEFAULT 'publica'::character varying
--   - expira_em: timestamp with time zone
--   - observacoes: text
--   - respostas_formulario: jsonb
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.execucoes_aula
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - turma_id: uuid NOT NULL
--   - professor_id: uuid NOT NULL
--   - data: date NOT NULL
--   - hora_inicio_prevista: time without time zone NOT NULL
--   - hora_fim_prevista: time without time zone NOT NULL
--   - hora_inicio_real: timestamp with time zone
--   - hora_fim_real: timestamp with time zone
--   - status: status_execucao_aula NOT NULL DEFAULT 'em_andamento'::status_execucao_aula
--   - foto_comprovante_url: text
--   - observacoes: text
--   - justificativa_retroativa: text
--   - status_aprovacao: status_aprovacao_aula NOT NULL DEFAULT 'aprovado'::status_aprovacao_aula
--   - aprovado_por_user_id: uuid
--   - aprovado_em: timestamp with time zone
--   - criado_em: timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
--   - atualizado_em: timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())

-- Tabela: public.beneficiario_presencas
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - execucao_aula_id: uuid NOT NULL
--   - beneficiario_id: uuid NOT NULL
--   - status: status_presenca NOT NULL DEFAULT 'presente'::status_presenca
--   - observacao: text
--   - criado_em: timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())

-- Tabela: public.registros_ponto
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - funcionario_id: uuid NOT NULL
--   - data: date NOT NULL
--   - tipo: tipo_registro_ponto NOT NULL
--   - hora: time without time zone NOT NULL
--   - status: character varying(20) NOT NULL DEFAULT 'ok'::character varying
--   - token_qr_hash: character varying(64)
--   - observacao: text
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.registros_presenca
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - turma_id: uuid NOT NULL
--   - data: date NOT NULL
--   - beneficiario_id: uuid NOT NULL
--   - presente: boolean NOT NULL DEFAULT true
--   - status: character varying(20) NOT NULL DEFAULT 'presente'::character varying
--   - observacao: text
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.configuracoes
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - chave: character varying(100) NOT NULL
--   - valor: jsonb NOT NULL
--   - descricao: text
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.confirmacoes_atividade
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - turma_id: uuid NOT NULL
--   - data: date NOT NULL
--   - storage_key: text NOT NULL
--   - observacao: text
--   - enviado_por: uuid
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.equipamentos
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - nome: character varying(300) NOT NULL
--   - categoria: character varying(100)
--   - quantidade: integer NOT NULL DEFAULT 1
--   - conservacao: estado_equipamento NOT NULL DEFAULT 'bom'::estado_equipamento
--   - nucleo_id: uuid
--   - objeto_id: uuid
--   - marca: character varying(100)
--   - modelo: character varying(100)
--   - numero_serie: character varying(100)
--   - nota_fiscal: character varying(100)
--   - data_aquisicao: date
--   - valor_unitario: numeric
--   - fotos_keys: text
--   - observacao: text
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()
--   - deleted_at: timestamp with time zone

-- Tabela: public.audit_log
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - usuario_id: uuid
--   - acao: character varying(100) NOT NULL
--   - entidade: character varying(100) NOT NULL
--   - entidade_id: uuid
--   - valor_antes: jsonb
--   - valor_depois: jsonb
--   - ip_address: character varying(45)
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()

-- Tabela: public.refresh_tokens
--   - id: uuid NOT NULL DEFAULT gen_random_uuid()
--   - usuario_id: uuid NOT NULL
--   - hash: character varying(64) NOT NULL
--   - expira_em: timestamp with time zone NOT NULL
--   - revogado: boolean NOT NULL DEFAULT false
--   - user_agent: text
--   - ip_address: character varying(45)
--   - created_at: timestamp with time zone NOT NULL DEFAULT now()
--   - updated_at: timestamp with time zone NOT NULL DEFAULT now()


-- ============================================================
-- SECTION 2: INDEXES
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS atividade_perguntas_pkey ON public.atividade_perguntas USING btree (id);
CREATE INDEX IF NOT EXISTS idx_atividade_perguntas_atividade_id ON public.atividade_perguntas USING btree (atividade_id);
CREATE UNIQUE INDEX IF NOT EXISTS atividade_turnos_pkey ON public.atividade_turnos USING btree (id);
CREATE INDEX IF NOT EXISTS idx_atividade_turnos_atividade_id ON public.atividade_turnos USING btree (atividade_id);
CREATE UNIQUE INDEX IF NOT EXISTS atividades_pkey ON public.atividades USING btree (id);
CREATE INDEX IF NOT EXISTS idx_atividades_nucleo_id ON public.atividades USING btree (nucleo_id);
CREATE UNIQUE INDEX IF NOT EXISTS audit_log_pkey ON public.audit_log USING btree (id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidade ON public.audit_log USING btree (entidade, entidade_id);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiario_anexos_pkey ON public.beneficiario_anexos USING btree (id);
CREATE INDEX IF NOT EXISTS idx_beneficiario_anexos_beneficiario_id ON public.beneficiario_anexos USING btree (beneficiario_id);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiario_parq_beneficiario_id_key ON public.beneficiario_parq USING btree (beneficiario_id);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiario_parq_pkey ON public.beneficiario_parq USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiario_presencas_execucao_aula_id_beneficiario_id_key ON public.beneficiario_presencas USING btree (execucao_aula_id, beneficiario_id);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiario_presencas_pkey ON public.beneficiario_presencas USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiario_turmas_beneficiario_id_turma_id_key ON public.beneficiario_turmas USING btree (beneficiario_id, turma_id);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiario_turmas_pkey ON public.beneficiario_turmas USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiarios_matricula_key ON public.beneficiarios USING btree (matricula);
CREATE UNIQUE INDEX IF NOT EXISTS beneficiarios_pkey ON public.beneficiarios USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_beneficiarios_cpf ON public.beneficiarios USING btree (cpf) WHERE (cpf IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS configuracoes_chave_key ON public.configuracoes USING btree (chave);
CREATE UNIQUE INDEX IF NOT EXISTS configuracoes_pkey ON public.configuracoes USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS confirmacoes_atividade_pkey ON public.confirmacoes_atividade USING btree (id);
CREATE INDEX IF NOT EXISTS idx_confirmacoes_atividade_turma_id ON public.confirmacoes_atividade USING btree (turma_id);
CREATE UNIQUE INDEX IF NOT EXISTS equipamentos_pkey ON public.equipamentos USING btree (id);
CREATE INDEX IF NOT EXISTS idx_equipamentos_nucleo_id ON public.equipamentos USING btree (nucleo_id);
CREATE INDEX IF NOT EXISTS idx_equipamentos_objeto_id ON public.equipamentos USING btree (objeto_id);
CREATE UNIQUE INDEX IF NOT EXISTS execucoes_aula_pkey ON public.execucoes_aula USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS funcionario_jornada_funcionario_id_dia_semana_key ON public.funcionario_jornada USING btree (funcionario_id, dia_semana);
CREATE UNIQUE INDEX IF NOT EXISTS funcionario_jornada_pkey ON public.funcionario_jornada USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS funcionarios_matricula_key ON public.funcionarios USING btree (matricula);
CREATE UNIQUE INDEX IF NOT EXISTS funcionarios_pkey ON public.funcionarios USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS funcoes_nome_key ON public.funcoes USING btree (nome);
CREATE UNIQUE INDEX IF NOT EXISTS funcoes_pkey ON public.funcoes USING btree (id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_beneficiario_id ON public.inscricoes USING btree (beneficiario_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_turma_status ON public.inscricoes USING btree (turma_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS inscricoes_pkey ON public.inscricoes USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS nucleo_atividades_pkey ON public.nucleo_atividades USING btree (nucleo_id, atividade_id);
CREATE INDEX IF NOT EXISTS idx_nucleos_organizacao_id ON public.nucleos USING btree (organizacao_id);
CREATE UNIQUE INDEX IF NOT EXISTS nucleos_pkey ON public.nucleos USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS objetos_pkey ON public.objetos USING btree (id);
CREATE INDEX IF NOT EXISTS idx_organizacoes_objeto_id ON public.organizacoes USING btree (objeto_id);
CREATE UNIQUE INDEX IF NOT EXISTS organizacoes_pkey ON public.organizacoes USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS perfil_permissoes_perfil_id_modulo_acao_key ON public.perfil_permissoes USING btree (perfil_id, modulo, acao);
CREATE UNIQUE INDEX IF NOT EXISTS perfil_permissoes_pkey ON public.perfil_permissoes USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS perfis_nome_key ON public.perfis USING btree (nome);
CREATE UNIQUE INDEX IF NOT EXISTS perfis_pkey ON public.perfis USING btree (id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario_id ON public.refresh_tokens USING btree (usuario_id);
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_hash_key ON public.refresh_tokens USING btree (hash);
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_pkey ON public.refresh_tokens USING btree (id);
CREATE INDEX IF NOT EXISTS idx_registros_ponto_funcionario_data ON public.registros_ponto USING btree (funcionario_id, data);
CREATE UNIQUE INDEX IF NOT EXISTS registros_ponto_funcionario_id_data_tipo_key ON public.registros_ponto USING btree (funcionario_id, data, tipo);
CREATE UNIQUE INDEX IF NOT EXISTS registros_ponto_pkey ON public.registros_ponto USING btree (id);
CREATE INDEX IF NOT EXISTS idx_registros_presenca_turma_data ON public.registros_presenca USING btree (turma_id, data);
CREATE UNIQUE INDEX IF NOT EXISTS registros_presenca_pkey ON public.registros_presenca USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS registros_presenca_turma_id_data_beneficiario_id_key ON public.registros_presenca USING btree (turma_id, data, beneficiario_id);
CREATE INDEX IF NOT EXISTS idx_turma_horarios_turma_id ON public.turma_horarios USING btree (turma_id);
CREATE UNIQUE INDEX IF NOT EXISTS turma_horarios_pkey ON public.turma_horarios USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS turma_responsaveis_pkey ON public.turma_responsaveis USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS turma_responsaveis_turma_id_funcionario_id_key ON public.turma_responsaveis USING btree (turma_id, funcionario_id);
CREATE INDEX IF NOT EXISTS idx_turmas_nucleo_atividade ON public.turmas USING btree (nucleo_id, atividade_id);
CREATE UNIQUE INDEX IF NOT EXISTS turmas_pkey ON public.turmas USING btree (id);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_id ON public.usuarios USING btree (perfil_id);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_key ON public.usuarios USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_pkey ON public.usuarios USING btree (id);


-- ============================================================
-- SECTION 3: CONSTRAINTS (Chaves Primárias, Estrangeiras e Únicas)
-- ============================================================

-- atividade_perguntas:
--   - PRIMARY KEY (id) [atividade_perguntas_pkey]
--   - FOREIGN KEY (atividade_id) REFERENCES public.atividades(id) [atividade_perguntas_atividade_id_fkey]

-- atividade_turnos:
--   - PRIMARY KEY (id) [atividade_turnos_pkey]
--   - FOREIGN KEY (atividade_id) REFERENCES public.atividades(id) [atividade_turnos_atividade_id_fkey]

-- atividades:
--   - PRIMARY KEY (id) [atividades_pkey]
--   - FOREIGN KEY (nucleo_id) REFERENCES public.nucleos(id) [atividades_nucleo_id_fkey]

-- audit_log:
--   - PRIMARY KEY (id) [audit_log_pkey]

-- beneficiario_anexos:
--   - PRIMARY KEY (id) [beneficiario_anexos_pkey]
--   - FOREIGN KEY (beneficiario_id) REFERENCES public.beneficiarios(id) [beneficiario_anexos_beneficiario_id_fkey]

-- beneficiario_parq:
--   - PRIMARY KEY (id) [beneficiario_parq_pkey]
--   - UNIQUE (beneficiario_id) [beneficiario_parq_beneficiario_id_key]
--   - FOREIGN KEY (beneficiario_id) REFERENCES public.beneficiarios(id) [beneficiario_parq_beneficiario_id_fkey]

-- beneficiario_presencas:
--   - PRIMARY KEY (id) [beneficiario_presencas_pkey]
--   - UNIQUE (execucao_aula_id, beneficiario_id) [beneficiario_presencas_execucao_aula_id_beneficiario_id_key]
--   - FOREIGN KEY (execucao_aula_id) REFERENCES public.execucoes_aula(id) [beneficiario_presencas_execucao_aula_id_fkey]
--   - FOREIGN KEY (beneficiario_id) REFERENCES public.beneficiarios(id) [beneficiario_presencas_beneficiario_id_fkey]

-- beneficiario_turmas:
--   - PRIMARY KEY (id) [beneficiario_turmas_pkey]
--   - UNIQUE (beneficiario_id, turma_id) [beneficiario_turmas_beneficiario_id_turma_id_key]
--   - FOREIGN KEY (turma_id) REFERENCES public.turmas(id) [beneficiario_turmas_turma_id_fkey]
--   - FOREIGN KEY (beneficiario_id) REFERENCES public.beneficiarios(id) [beneficiario_turmas_beneficiario_id_fkey]

-- beneficiarios:
--   - PRIMARY KEY (id) [beneficiarios_pkey]
--   - UNIQUE (matricula) [beneficiarios_matricula_key]
--   - FOREIGN KEY (nucleo_id) REFERENCES public.nucleos(id) [beneficiarios_nucleo_id_fkey]

-- configuracoes:
--   - PRIMARY KEY (id) [configuracoes_pkey]
--   - UNIQUE (chave) [configuracoes_chave_key]

-- confirmacoes_atividade:
--   - PRIMARY KEY (id) [confirmacoes_atividade_pkey]
--   - FOREIGN KEY (turma_id) REFERENCES public.turmas(id) [confirmacoes_atividade_turma_id_fkey]
--   - FOREIGN KEY (enviado_por) REFERENCES public.usuarios(id) [confirmacoes_atividade_enviado_por_fkey]

-- equipamentos:
--   - PRIMARY KEY (id) [equipamentos_pkey]
--   - FOREIGN KEY (nucleo_id) REFERENCES public.nucleos(id) [equipamentos_nucleo_id_fkey]
--   - FOREIGN KEY (objeto_id) REFERENCES public.objetos(id) [equipamentos_objeto_id_fkey]

-- execucoes_aula:
--   - PRIMARY KEY (id) [execucoes_aula_pkey]
--   - FOREIGN KEY (professor_id) REFERENCES public.funcionarios(id) [execucoes_aula_professor_id_fkey]
--   - FOREIGN KEY (aprovado_por_user_id) REFERENCES public.usuarios(id) [execucoes_aula_aprovado_por_user_id_fkey]
--   - FOREIGN KEY (turma_id) REFERENCES public.turmas(id) [execucoes_aula_turma_id_fkey]

-- funcionario_jornada:
--   - PRIMARY KEY (id) [funcionario_jornada_pkey]
--   - UNIQUE (funcionario_id, dia_semana) [funcionario_jornada_funcionario_id_dia_semana_key]
--   - FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) [funcionario_jornada_funcionario_id_fkey]

-- funcionarios:
--   - PRIMARY KEY (id) [funcionarios_pkey]
--   - UNIQUE (matricula) [funcionarios_matricula_key]
--   - FOREIGN KEY (nucleo_id) REFERENCES public.nucleos(id) [funcionarios_nucleo_id_fkey]

-- funcoes:
--   - PRIMARY KEY (id) [funcoes_pkey]
--   - UNIQUE (nome) [funcoes_nome_key]

-- inscricoes:
--   - PRIMARY KEY (id) [inscricoes_pkey]
--   - FOREIGN KEY (beneficiario_id) REFERENCES public.beneficiarios(id) [inscricoes_beneficiario_id_fkey]
--   - FOREIGN KEY (turma_id) REFERENCES public.turmas(id) [inscricoes_turma_id_fkey]

-- nucleo_atividades:
--   - PRIMARY KEY (nucleo_id, atividade_id) [nucleo_atividades_pkey]
--   - FOREIGN KEY (nucleo_id) REFERENCES public.nucleos(id) [nucleo_atividades_nucleo_id_fkey]
--   - FOREIGN KEY (atividade_id) REFERENCES public.atividades(id) [nucleo_atividades_atividade_id_fkey]

-- nucleos:
--   - PRIMARY KEY (id) [nucleos_pkey]
--   - FOREIGN KEY (organizacao_id) REFERENCES public.organizacoes(id) [nucleos_organizacao_id_fkey]

-- objetos:
--   - PRIMARY KEY (id) [objetos_pkey]

-- organizacoes:
--   - PRIMARY KEY (id) [organizacoes_pkey]
--   - FOREIGN KEY (objeto_id) REFERENCES public.objetos(id) [organizacoes_objeto_id_fkey]

-- perfil_permissoes:
--   - PRIMARY KEY (id) [perfil_permissoes_pkey]
--   - UNIQUE (perfil_id, modulo, acao) [perfil_permissoes_perfil_id_modulo_acao_key]
--   - FOREIGN KEY (perfil_id) REFERENCES public.perfis(id) [perfil_permissoes_perfil_id_fkey]

-- perfis:
--   - PRIMARY KEY (id) [perfis_pkey]
--   - UNIQUE (nome) [perfis_nome_key]

-- refresh_tokens:
--   - PRIMARY KEY (id) [refresh_tokens_pkey]
--   - UNIQUE (hash) [refresh_tokens_hash_key]
--   - FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) [refresh_tokens_usuario_id_fkey]

-- registros_ponto:
--   - PRIMARY KEY (id) [registros_ponto_pkey]
--   - UNIQUE (funcionario_id, data, tipo) [registros_ponto_funcionario_id_data_tipo_key]
--   - FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) [registros_ponto_funcionario_id_fkey]

-- registros_presenca:
--   - PRIMARY KEY (id) [registros_presenca_pkey]
--   - UNIQUE (turma_id, data, beneficiario_id) [registros_presenca_turma_id_data_beneficiario_id_key]
--   - FOREIGN KEY (beneficiario_id) REFERENCES public.beneficiarios(id) [registros_presenca_beneficiario_id_fkey]
--   - FOREIGN KEY (turma_id) REFERENCES public.turmas(id) [registros_presenca_turma_id_fkey]

-- turma_horarios:
--   - PRIMARY KEY (id) [turma_horarios_pkey]
--   - FOREIGN KEY (turma_id) REFERENCES public.turmas(id) [turma_horarios_turma_id_fkey]

-- turma_responsaveis:
--   - PRIMARY KEY (id) [turma_responsaveis_pkey]
--   - UNIQUE (turma_id, funcionario_id) [turma_responsaveis_turma_id_funcionario_id_key]
--   - FOREIGN KEY (turma_id) REFERENCES public.turmas(id) [turma_responsaveis_turma_id_fkey]
--   - FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) [turma_responsaveis_funcionario_id_fkey]

-- turmas:
--   - PRIMARY KEY (id) [turmas_pkey]
--   - FOREIGN KEY (nucleo_id) REFERENCES public.nucleos(id) [turmas_nucleo_id_fkey]
--   - FOREIGN KEY (atividade_id) REFERENCES public.atividades(id) [turmas_atividade_id_fkey]

-- usuarios:
--   - PRIMARY KEY (id) [usuarios_pkey]
--   - UNIQUE (email) [usuarios_email_key]
--   - FOREIGN KEY (perfil_id) REFERENCES public.perfis(id) [usuarios_perfil_id_fkey]
--   - FOREIGN KEY (id) REFERENCES auth.users(id) [usuarios_id_fkey]


-- ============================================================
-- SECTION 4: FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.aprovar_inscricao(p_id uuid)
 RETURNS inscricoes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inscricao inscricoes;
begin
  if not has_permissao('inscricoes', 'editar') then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;

  select * into v_inscricao from inscricoes where id = p_id for update;
  if v_inscricao.id is null then
    raise exception 'Inscrição não encontrada' using errcode = 'P0002';
  end if;
  if v_inscricao.status not in ('pendente', 'reservada') then
    raise exception 'Não é possível aprovar inscrição com status "%"', v_inscricao.status using errcode = '23514';
  end if;

  update inscricoes set status = 'aprovada', expira_em = null, updated_at = now()
  where id = p_id
  returning * into v_inscricao;

  insert into beneficiario_turmas (beneficiario_id, turma_id, data_matricula)
  values (v_inscricao.beneficiario_id, v_inscricao.turma_id, current_date);

  return v_inscricao;
end;
$function$;

CREATE OR REPLACE FUNCTION public.auto_encerrar_aulas()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ BEGIN UPDATE execucoes_aula SET status = 'encerrada_automaticamente', hora_fim_real = (data || ' ' || hora_fim_prevista::text)::timestamp AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC', atualizado_em = now(), observacoes = COALESCE(observacoes || E'\n\n', '') || '[ENCERRADA AUTOMATICAMENTE] Aula não foi encerrada manualmente pelo professor.' WHERE status = 'em_andamento' AND (data + hora_fim_prevista + INTERVAL '2 minutes') < (now() AT TIME ZONE 'America/Sao_Paulo'); END; $function$;

CREATE OR REPLACE FUNCTION public.cancelar_inscricao(p_id uuid)
 RETURNS inscricoes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inscricao inscricoes;
begin
  if not has_permissao('inscricoes', 'editar') then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;

  select * into v_inscricao from inscricoes where id = p_id for update;
  if v_inscricao.id is null then
    raise exception 'Inscrição não encontrada' using errcode = 'P0002';
  end if;
  if v_inscricao.status in ('recusada', 'expirada', 'cancelada') then
    raise exception 'Inscrição já está com status "%"', v_inscricao.status using errcode = '23514';
  end if;

  update inscricoes set status = 'cancelada', updated_at = now()
  where id = p_id
  returning * into v_inscricao;

  return v_inscricao;
end;
$function$;

CREATE OR REPLACE FUNCTION public.clean_user_tokens()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.confirmation_token := COALESCE(NEW.confirmation_token, '');
  NEW.recovery_token := COALESCE(NEW.recovery_token, '');
  NEW.email_change_token_new := COALESCE(NEW.email_change_token_new, '');
  NEW.email_change := COALESCE(NEW.email_change, '');
  NEW.phone_change := COALESCE(NEW.phone_change, '');
  NEW.phone_change_token := COALESCE(NEW.phone_change_token, '');
  NEW.email_change_token_current := COALESCE(NEW.email_change_token_current, '');
  NEW.reauthentication_token := COALESCE(NEW.reauthentication_token, '');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.criar_inscricao(p_turma_id uuid, p_beneficiario_id uuid, p_observacoes text DEFAULT NULL::text, p_respostas jsonb DEFAULT NULL::jsonb)
 RETURNS inscricoes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vagas_totais smallint;
  v_permitir_fila boolean;
  v_tipo_aprovacao tipo_aprovacao;
  v_status_inicial status_inscricao;
  v_ocupadas int;
  v_reservadas int;
  v_status status_inscricao;
  v_expira_em timestamptz;
  v_inscricao inscricoes;
BEGIN
  IF NOT (has_permissao('inscricoes', 'criar') OR auth.role() IN ('anon', 'authenticated') OR auth.role() IS NULL) THEN
    RAISE EXCEPTION 'Sem permissão para esta operação' USING errcode = '42501';
  END IF;

  SELECT t.vagas_totais, COALESCE(t.permitir_fila_espera, true), a.tipo_aprovacao, COALESCE(t.status_inicial, 'aprovada')
    INTO v_vagas_totais, v_permitir_fila, v_tipo_aprovacao, v_status_inicial
  FROM turmas t
  JOIN atividades a ON a.id = t.atividade_id
  WHERE t.id = p_turma_id
  FOR UPDATE OF t;

  IF v_vagas_totais IS NULL THEN
    RAISE EXCEPTION 'Turma não encontrada' USING errcode = 'P0002';
  END IF;

  SELECT count(*) INTO v_ocupadas
  FROM beneficiario_turmas
  WHERE turma_id = p_turma_id AND status = 'ativo';

  SELECT count(*) INTO v_reservadas
  FROM inscricoes
  WHERE turma_id = p_turma_id AND status IN ('pendente', 'reservada');

  -- Se as vagas estiverem preenchidas
  IF v_ocupadas + v_reservadas >= v_vagas_totais THEN
    IF v_permitir_fila THEN
      v_status := 'reservada';
    ELSE
      RAISE EXCEPTION 'Vagas esgotadas para esta turma e a Fila de Espera está desativada.' USING errcode = 'P0003';
    END IF;
  ELSE
    v_status := v_status_inicial;
  END IF;

  v_expira_em := CASE WHEN v_status = 'aprovada' THEN NULL ELSE now() + interval '2880 minutes' END;

  INSERT INTO inscricoes (turma_id, beneficiario_id, status, expira_em, observacoes, respostas_formulario)
  VALUES (p_turma_id, p_beneficiario_id, v_status, v_expira_em, p_observacoes, p_respostas)
  RETURNING * INTO v_inscricao;

  IF v_status = 'aprovada' THEN
    INSERT INTO beneficiario_turmas (beneficiario_id, turma_id, data_matricula)
    VALUES (p_beneficiario_id, p_turma_id, current_date)
    ON CONFLICT (beneficiario_id, turma_id) DO UPDATE SET status = 'ativo';
  END IF;

  RETURN v_inscricao;
END;
$function$;

CREATE OR REPLACE FUNCTION public.current_entidade_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select (auth.jwt() -> 'app_metadata' ->> 'entidade_id')::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.current_tipo_usuario()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select auth.jwt() -> 'app_metadata' ->> 'tipo';
$function$;

CREATE OR REPLACE FUNCTION public.desmatricular_beneficiario(p_turma_id uuid, p_beneficiario_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_permissao('beneficiarios', 'editar') THEN
    RAISE EXCEPTION 'Sem permissão para remover beneficiário da turma.';
  END IF;

  UPDATE beneficiario_turmas
  SET status = 'evadido', data_evasao = current_date
  WHERE turma_id = p_turma_id AND beneficiario_id = p_beneficiario_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_logo_url()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select valor #>> '{}' from configuracoes where chave = 'logo_url' limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.has_permissao(p_modulo text, p_acao text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from perfil_permissoes pp
    where pp.perfil_id = (auth.jwt() -> 'app_metadata' ->> 'perfil_id')::uuid
      and pp.modulo = p_modulo
      and pp.acao = p_acao
      and pp.permitido = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.matricular_beneficiario(p_turma_id uuid, p_beneficiario_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vagas_totais integer;
  v_vagas_ocupadas integer;
BEGIN
  IF NOT has_permissao('beneficiarios', 'editar') THEN
    RAISE EXCEPTION 'Sem permissão para matricular beneficiário.';
  END IF;

  SELECT vagas_totais INTO v_vagas_totais FROM turmas WHERE id = p_turma_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada.';
  END IF;

  SELECT count(*) INTO v_vagas_ocupadas FROM beneficiario_turmas WHERE turma_id = p_turma_id AND status = 'ativo';
  IF v_vagas_totais IS NOT NULL AND v_vagas_ocupadas >= v_vagas_totais THEN
    RAISE EXCEPTION 'Turma sem vagas disponíveis.';
  END IF;

  INSERT INTO beneficiario_turmas (beneficiario_id, turma_id, status, data_matricula)
  VALUES (p_beneficiario_id, p_turma_id, 'ativo', current_date)
  ON CONFLICT (beneficiario_id, turma_id) DO UPDATE
  SET status = 'ativo', data_matricula = current_date, data_evasao = NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.migrar_beneficiario_turma(p_beneficiario_id uuid, p_turma_origem uuid, p_turma_destino uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM matricular_beneficiario(p_turma_destino, p_beneficiario_id);
  PERFORM desmatricular_beneficiario(p_turma_origem, p_beneficiario_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.recusar_inscricao(p_id uuid, p_observacoes text DEFAULT NULL::text)
 RETURNS inscricoes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inscricao inscricoes;
begin
  if not has_permissao('inscricoes', 'editar') then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;

  select * into v_inscricao from inscricoes where id = p_id for update;
  if v_inscricao.id is null then
    raise exception 'Inscrição não encontrada' using errcode = 'P0002';
  end if;
  if v_inscricao.status not in ('pendente', 'reservada') then
    raise exception 'Não é possível recusar inscrição com status "%"', v_inscricao.status using errcode = '23514';
  end if;

  update inscricoes
  set status = 'recusada',
      observacoes = coalesce(p_observacoes, observacoes),
      updated_at = now()
  where id = p_id
  returning * into v_inscricao;

  return v_inscricao;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_usuario_app_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'perfil_id', new.perfil_id,
      'tipo', new.tipo,
      'entidade_id', new.entidade_id
    )
  where id = new.id;
  return new;
end;
$function$;


-- ============================================================
-- SECTION 5: RLS POLICIES
-- ============================================================

-- atividade_perguntas
CREATE POLICY "Leitura anonima em atividade_perguntas" ON public.atividade_perguntas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "atividade_perguntas_all" ON public.atividade_perguntas FOR INSERT TO public WITH CHECK (has_permissao('atividades'::text, 'editar'::text));
CREATE POLICY "atividade_perguntas_delete" ON public.atividade_perguntas FOR DELETE TO public USING (has_permissao('atividades'::text, 'editar'::text));
CREATE POLICY "atividade_perguntas_select" ON public.atividade_perguntas FOR SELECT TO public USING (has_permissao('atividades'::text, 'listar'::text));
CREATE POLICY "atividade_perguntas_update" ON public.atividade_perguntas FOR UPDATE TO public USING (has_permissao('atividades'::text, 'editar'::text));

-- atividade_turnos
CREATE POLICY "Leitura anonima em atividade_turnos" ON public.atividade_turnos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "atividade_turnos_delete" ON public.atividade_turnos FOR DELETE TO public USING (has_permissao('atividades'::text, 'editar'::text));
CREATE POLICY "atividade_turnos_insert" ON public.atividade_turnos FOR INSERT TO public WITH CHECK (has_permissao('atividades'::text, 'editar'::text));
CREATE POLICY "atividade_turnos_select" ON public.atividade_turnos FOR SELECT TO public USING (has_permissao('atividades'::text, 'listar'::text));
CREATE POLICY "atividade_turnos_update" ON public.atividade_turnos FOR UPDATE TO public USING (has_permissao('atividades'::text, 'editar'::text));

-- atividades
CREATE POLICY "Leitura anonima em atividades" ON public.atividades FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "atividades_delete" ON public.atividades FOR DELETE TO public USING (has_permissao('atividades'::text, 'excluir'::text));
CREATE POLICY "atividades_insert" ON public.atividades FOR INSERT TO public WITH CHECK (has_permissao('atividades'::text, 'criar'::text));
CREATE POLICY "atividades_select" ON public.atividades FOR SELECT TO public USING (((deleted_at IS NULL) AND has_permissao('atividades'::text, 'listar'::text)));
CREATE POLICY "atividades_select_auth" ON public.atividades FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY "atividades_update" ON public.atividades FOR UPDATE TO public USING (has_permissao('atividades'::text, 'editar'::text));

-- audit_log
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT TO public USING (has_permissao('configuracoes'::text, 'listar'::text));

-- beneficiario_anexos
CREATE POLICY "beneficiario_anexos_delete" ON public.beneficiario_anexos FOR DELETE TO public USING (has_permissao('beneficiarios'::text, 'editar'::text));
CREATE POLICY "beneficiario_anexos_insert" ON public.beneficiario_anexos FOR INSERT TO public WITH CHECK (has_permissao('beneficiarios'::text, 'editar'::text));
CREATE POLICY "beneficiario_anexos_select" ON public.beneficiario_anexos FOR SELECT TO public USING (has_permissao('beneficiarios'::text, 'listar'::text));
CREATE POLICY "beneficiario_anexos_update" ON public.beneficiario_anexos FOR UPDATE TO public USING (has_permissao('beneficiarios'::text, 'editar'::text));

-- beneficiario_parq
CREATE POLICY "beneficiario_parq_delete" ON public.beneficiario_parq FOR DELETE TO public USING (has_permissao('beneficiarios'::text, 'editar'::text));
CREATE POLICY "beneficiario_parq_insert" ON public.beneficiario_parq FOR INSERT TO public WITH CHECK (has_permissao('beneficiarios'::text, 'editar'::text));
CREATE POLICY "beneficiario_parq_select" ON public.beneficiario_parq FOR SELECT TO public USING (has_permissao('beneficiarios'::text, 'listar'::text));
CREATE POLICY "beneficiario_parq_update" ON public.beneficiario_parq FOR UPDATE TO public USING (has_permissao('beneficiarios'::text, 'editar'::text));

-- beneficiario_presencas
CREATE POLICY "beneficiario_presencas_insert" ON public.beneficiario_presencas FOR INSERT TO public WITH CHECK (has_permissao('aulas'::text, 'criar'::text));
CREATE POLICY "beneficiario_presencas_select" ON public.beneficiario_presencas FOR SELECT TO public USING (has_permissao('aulas'::text, 'visualizar'::text));
CREATE POLICY "beneficiario_presencas_update" ON public.beneficiario_presencas FOR UPDATE TO public USING (has_permissao('aulas'::text, 'editar'::text));

-- beneficiario_turmas
CREATE POLICY "Leitura e insercao anonima em beneficiario_turmas" ON public.beneficiario_turmas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "beneficiario_turmas_delete" ON public.beneficiario_turmas FOR DELETE TO public USING (has_permissao('beneficiarios'::text, 'editar'::text));
CREATE POLICY "beneficiario_turmas_insert" ON public.beneficiario_turmas FOR INSERT TO public WITH CHECK (has_permissao('beneficiarios'::text, 'editar'::text));
CREATE POLICY "beneficiario_turmas_select" ON public.beneficiario_turmas FOR SELECT TO public USING (has_permissao('beneficiarios'::text, 'listar'::text));
CREATE POLICY "beneficiario_turmas_select_public" ON public.beneficiario_turmas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "beneficiario_turmas_update" ON public.beneficiario_turmas FOR UPDATE TO public USING (has_permissao('beneficiarios'::text, 'editar'::text));

-- beneficiarios
CREATE POLICY "Acesso total em beneficiarios para autenticados" ON public.beneficiarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Insercao publica em beneficiarios" ON public.beneficiarios FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "beneficiarios_delete" ON public.beneficiarios FOR DELETE TO public USING (has_permissao('beneficiarios'::text, 'excluir'::text));
CREATE POLICY "beneficiarios_insert" ON public.beneficiarios FOR INSERT TO public WITH CHECK (has_permissao('beneficiarios'::text, 'criar'::text));
CREATE POLICY "beneficiarios_select" ON public.beneficiarios FOR SELECT TO public USING (((deleted_at IS NULL) AND has_permissao('beneficiarios'::text, 'listar'::text)));
CREATE POLICY "beneficiarios_select_auth" ON public.beneficiarios FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY "beneficiarios_update" ON public.beneficiarios FOR UPDATE TO public USING (has_permissao('beneficiarios'::text, 'editar'::text));

-- configuracoes
CREATE POLICY "configuracoes_delete" ON public.configuracoes FOR DELETE TO public USING (has_permissao('configuracoes'::text, 'excluir'::text));
CREATE POLICY "configuracoes_insert" ON public.configuracoes FOR INSERT TO public WITH CHECK (has_permissao('configuracoes'::text, 'editar'::text));
CREATE POLICY "configuracoes_public_logo_read" ON public.configuracoes FOR SELECT TO anon USING (((chave)::text = 'logo_url'::text));
CREATE POLICY "configuracoes_select" ON public.configuracoes FOR SELECT TO public USING (has_permissao('configuracoes'::text, 'listar'::text));
CREATE POLICY "configuracoes_update" ON public.configuracoes FOR UPDATE TO public USING (has_permissao('configuracoes'::text, 'editar'::text));

-- confirmacoes_atividade
CREATE POLICY "confirmacoes_atividade_insert" ON public.confirmacoes_atividade FOR INSERT TO public WITH CHECK (has_permissao('comprovacoes'::text, 'criar'::text));
CREATE POLICY "confirmacoes_atividade_select" ON public.confirmacoes_atividade FOR SELECT TO public USING (has_permissao('comprovacoes'::text, 'listar'::text));

-- equipamentos
CREATE POLICY "equipamentos_delete" ON public.equipamentos FOR DELETE TO public USING (has_permissao('equipamentos'::text, 'excluir'::text));
CREATE POLICY "equipamentos_insert" ON public.equipamentos FOR INSERT TO public WITH CHECK (has_permissao('equipamentos'::text, 'criar'::text));
CREATE POLICY "equipamentos_select" ON public.equipamentos FOR SELECT TO public USING (((deleted_at IS NULL) AND has_permissao('equipamentos'::text, 'listar'::text)));
CREATE POLICY "equipamentos_select_auth" ON public.equipamentos FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY "equipamentos_update" ON public.equipamentos FOR UPDATE TO public USING (has_permissao('equipamentos'::text, 'editar'::text));

-- execucoes_aula
CREATE POLICY "execucoes_aula_delete" ON public.execucoes_aula FOR DELETE TO public USING (has_permissao('aulas'::text, 'excluir'::text));
CREATE POLICY "execucoes_aula_insert" ON public.execucoes_aula FOR INSERT TO public WITH CHECK (has_permissao('aulas'::text, 'criar'::text));
CREATE POLICY "execucoes_aula_select" ON public.execucoes_aula FOR SELECT TO public USING (has_permissao('aulas'::text, 'visualizar'::text));
CREATE POLICY "execucoes_aula_update" ON public.execucoes_aula FOR UPDATE TO public USING (has_permissao('aulas'::text, 'editar'::text));

-- funcionario_jornada
CREATE POLICY "funcionario_jornada_delete" ON public.funcionario_jornada FOR DELETE TO public USING (has_permissao('funcionarios'::text, 'editar'::text));
CREATE POLICY "funcionario_jornada_insert" ON public.funcionario_jornada FOR INSERT TO public WITH CHECK (has_permissao('funcionarios'::text, 'editar'::text));
CREATE POLICY "funcionario_jornada_select" ON public.funcionario_jornada FOR SELECT TO public USING (has_permissao('funcionarios'::text, 'listar'::text));
CREATE POLICY "funcionario_jornada_select_public" ON public.funcionario_jornada FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "funcionario_jornada_update" ON public.funcionario_jornada FOR UPDATE TO public USING (has_permissao('funcionarios'::text, 'editar'::text));

-- funcionarios
CREATE POLICY "Leitura publica em funcionarios" ON public.funcionarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "funcionarios_delete" ON public.funcionarios FOR DELETE TO public USING (has_permissao('funcionarios'::text, 'excluir'::text));
CREATE POLICY "funcionarios_insert" ON public.funcionarios FOR INSERT TO public WITH CHECK (has_permissao('funcionarios'::text, 'criar'::text));
CREATE POLICY "funcionarios_select" ON public.funcionarios FOR SELECT TO public USING (((deleted_at IS NULL) AND has_permissao('funcionarios'::text, 'listar'::text)));
CREATE POLICY "funcionarios_select_auth" ON public.funcionarios FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY "funcionarios_update" ON public.funcionarios FOR UPDATE TO public USING (has_permissao('funcionarios'::text, 'editar'::text));

-- funcoes
CREATE POLICY "Acesso publico autenticado em funcoes" ON public.funcoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Leitura anonima em funcoes" ON public.funcoes FOR SELECT TO anon USING (true);

-- inscricoes
CREATE POLICY "inscricoes_insert" ON public.inscricoes FOR INSERT TO public WITH CHECK (has_permissao('inscricoes'::text, 'criar'::text));
CREATE POLICY "inscricoes_select" ON public.inscricoes FOR SELECT TO public USING (has_permissao('inscricoes'::text, 'listar'::text));
CREATE POLICY "inscricoes_select_public" ON public.inscricoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "inscricoes_update" ON public.inscricoes FOR UPDATE TO public USING (has_permissao('inscricoes'::text, 'editar'::text));

-- nucleo_atividades
CREATE POLICY "nucleo_atividades_all_policy" ON public.nucleo_atividades FOR ALL TO authenticated USING (true);
CREATE POLICY "nucleo_atividades_select_policy" ON public.nucleo_atividades FOR SELECT TO authenticated USING (true);

-- nucleos
CREATE POLICY "Leitura publica em nucleos" ON public.nucleos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "nucleos_delete" ON public.nucleos FOR DELETE TO public USING (has_permissao('nucleos'::text, 'excluir'::text));
CREATE POLICY "nucleos_insert" ON public.nucleos FOR INSERT TO public WITH CHECK (has_permissao('nucleos'::text, 'criar'::text));
CREATE POLICY "nucleos_select" ON public.nucleos FOR SELECT TO public USING (((deleted_at IS NULL) AND has_permissao('nucleos'::text, 'listar'::text)));
CREATE POLICY "nucleos_select_auth" ON public.nucleos FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY "nucleos_update" ON public.nucleos FOR UPDATE TO public USING (has_permissao('nucleos'::text, 'editar'::text));

-- objetos
CREATE POLICY "Leitura publica em objetos" ON public.objetos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "objetos_delete" ON public.objetos FOR DELETE TO public USING (has_permissao('objetos'::text, 'excluir'::text));
CREATE POLICY "objetos_insert" ON public.objetos FOR INSERT TO public WITH CHECK (has_permissao('objetos'::text, 'criar'::text));
CREATE POLICY "objetos_select" ON public.objetos FOR SELECT TO public USING (((deleted_at IS NULL) AND has_permissao('objetos'::text, 'listar'::text)));
CREATE POLICY "objetos_select_auth" ON public.objetos FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY "objetos_update" ON public.objetos FOR UPDATE TO public USING (has_permissao('objetos'::text, 'editar'::text));

-- organizacoes
CREATE POLICY "Leitura publica em organizacoes" ON public.organizacoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "organizacoes_delete" ON public.organizacoes FOR DELETE TO public USING (has_permissao('organizacoes'::text, 'excluir'::text));
CREATE POLICY "organizacoes_insert" ON public.organizacoes FOR INSERT TO public WITH CHECK (has_permissao('organizacoes'::text, 'criar'::text));
CREATE POLICY "organizacoes_select" ON public.organizacoes FOR SELECT TO public USING (((deleted_at IS NULL) AND has_permissao('organizacoes'::text, 'listar'::text)));
CREATE POLICY "organizacoes_select_auth" ON public.organizacoes FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY "organizacoes_update" ON public.organizacoes FOR UPDATE TO public USING (has_permissao('organizacoes'::text, 'editar'::text));

-- perfil_permissoes
CREATE POLICY "Leitura de perfil_permissoes para autenticados" ON public.perfil_permissoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura publica de perfil_permissoes" ON public.perfil_permissoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "perfil_permissoes_delete" ON public.perfil_permissoes FOR DELETE TO public USING (has_permissao('perfis'::text, 'editar'::text));
CREATE POLICY "perfil_permissoes_insert" ON public.perfil_permissoes FOR INSERT TO public WITH CHECK (has_permissao('perfis'::text, 'editar'::text));
CREATE POLICY "perfil_permissoes_select_public" ON public.perfil_permissoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "perfil_permissoes_update" ON public.perfil_permissoes FOR UPDATE TO public USING (has_permissao('perfis'::text, 'editar'::text));

-- perfis
CREATE POLICY "Leitura de perfis para autenticados" ON public.perfis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura publica de perfis" ON public.perfis FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "perfis_delete" ON public.perfis FOR DELETE TO public USING ((has_permissao('perfis'::text, 'excluir'::text) AND (is_sistema = false)));
CREATE POLICY "perfis_insert" ON public.perfis FOR INSERT TO public WITH CHECK (has_permissao('perfis'::text, 'criar'::text));
CREATE POLICY "perfis_select_public" ON public.perfis FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "perfis_update" ON public.perfis FOR UPDATE TO public USING (has_permissao('perfis'::text, 'editar'::text));

-- refresh_tokens
CREATE POLICY "refresh_tokens_delete" ON public.refresh_tokens FOR DELETE TO public USING ((usuario_id = auth.uid()));
CREATE POLICY "refresh_tokens_insert" ON public.refresh_tokens FOR INSERT TO public WITH CHECK ((usuario_id = auth.uid()));
CREATE POLICY "refresh_tokens_select" ON public.refresh_tokens FOR SELECT TO public USING ((usuario_id = auth.uid()));
CREATE POLICY "refresh_tokens_update" ON public.refresh_tokens FOR UPDATE TO public USING ((usuario_id = auth.uid()));

-- registros_ponto
CREATE POLICY "registros_ponto_insert" ON public.registros_ponto FOR INSERT TO public WITH CHECK (has_permissao('ponto'::text, 'criar'::text));
CREATE POLICY "registros_ponto_select" ON public.registros_ponto FOR SELECT TO public USING (has_permissao('ponto'::text, 'listar'::text));
CREATE POLICY "registros_ponto_update" ON public.registros_ponto FOR UPDATE TO public USING (has_permissao('ponto'::text, 'editar'::text));

-- registros_presenca
CREATE POLICY "registros_presenca_insert" ON public.registros_presenca FOR INSERT TO public WITH CHECK (has_permissao('presenca'::text, 'criar'::text));
CREATE POLICY "registros_presenca_select" ON public.registros_presenca FOR SELECT TO public USING (has_permissao('presenca'::text, 'listar'::text));
CREATE POLICY "registros_presenca_update" ON public.registros_presenca FOR UPDATE TO public USING (has_permissao('presenca'::text, 'criar'::text));

-- turma_horarios
CREATE POLICY "Leitura publica em turma_horarios" ON public.turma_horarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "turma_horarios_delete" ON public.turma_horarios FOR DELETE TO public USING (has_permissao('turmas'::text, 'editar'::text));
CREATE POLICY "turma_horarios_insert" ON public.turma_horarios FOR INSERT TO public WITH CHECK (has_permissao('turmas'::text, 'editar'::text));
CREATE POLICY "turma_horarios_select" ON public.turma_horarios FOR SELECT TO public USING (has_permissao('turmas'::text, 'listar'::text));
CREATE POLICY "turma_horarios_select_public" ON public.turma_horarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "turma_horarios_update" ON public.turma_horarios FOR UPDATE TO public USING (has_permissao('turmas'::text, 'editar'::text));

-- turma_responsaveis
CREATE POLICY "Leitura publica em turma_responsaveis" ON public.turma_responsaveis FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "turma_responsaveis_delete" ON public.turma_responsaveis FOR DELETE TO public USING (has_permissao('turmas'::text, 'editar'::text));
CREATE POLICY "turma_responsaveis_insert" ON public.turma_responsaveis FOR INSERT TO public WITH CHECK (has_permissao('turmas'::text, 'editar'::text));
CREATE POLICY "turma_responsaveis_select" ON public.turma_responsaveis FOR SELECT TO public USING (has_permissao('turmas'::text, 'listar'::text));
CREATE POLICY "turma_responsaveis_update" ON public.turma_responsaveis FOR UPDATE TO public USING (has_permissao('turmas'::text, 'editar'::text));

-- turmas
CREATE POLICY "Leitura anonima em turmas" ON public.turmas FOR SELECT TO anon USING (true);
CREATE POLICY "turmas_delete" ON public.turmas FOR DELETE TO public USING (has_permissao('turmas'::text, 'excluir'::text));
CREATE POLICY "turmas_insert" ON public.turmas FOR INSERT TO public WITH CHECK (has_permissao('turmas'::text, 'criar'::text));
CREATE POLICY "turmas_select" ON public.turmas FOR SELECT TO public USING (((deleted_at IS NULL) AND has_permissao('turmas'::text, 'listar'::text)));
CREATE POLICY "turmas_select_auth" ON public.turmas FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY "turmas_update" ON public.turmas FOR UPDATE TO public USING (has_permissao('turmas'::text, 'editar'::text));

-- usuarios
CREATE POLICY "Leitura publica de usuarios" ON public.usuarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Leitura total usuarios" ON public.usuarios FOR SELECT TO public USING (true);
CREATE POLICY "usuarios_delete" ON public.usuarios FOR DELETE TO public USING (has_permissao('usuarios'::text, 'excluir'::text));
CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT TO public WITH CHECK (has_permissao('usuarios'::text, 'criar'::text));
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE TO public USING (has_permissao('usuarios'::text, 'editar'::text));

-- ============================================================
-- SECTION 6: DATA
-- ============================================================

-- ------------------------------------------------------------
-- Tabela: public.perfis
-- ------------------------------------------------------------
INSERT INTO public.perfis (id, nome, descricao, is_sistema, created_at, updated_at) VALUES
('50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'Administrador', 'Perfil supremo do sistema — acesso total e irrestrito', true, '2026-08-05T21:02:47.132994+00:00', '2026-08-05T21:02:47.132994+00:00'),
('b9def33a-a2a0-477d-8580-ec213d642808', 'Professor / Instrutor', 'Lançamento de chamada, folha de ponto, turmas e atividades alocadas', false, '2026-08-11T22:19:39.379757+00:00', '2026-08-11T22:19:39.379757+00:00'),
('698c2c08-3606-4276-b554-17b576d5d12b', 'Coordenador de Turma', 'Gestão de horários, vagas, matrículas e turmas específicas', false, '2026-08-11T23:45:37.98496+00:00', '2026-08-11T23:45:37.98496+00:00'),
('7f9706e8-d9f9-4953-9e1f-e0f7e87b25e3', 'Coordenador de Instrutores', 'Supervisão técnica, pedagógica e da equipe de professores', false, '2026-08-11T23:45:38.167367+00:00', '2026-08-11T23:45:38.167367+00:00'),
('048f6061-1aed-45b5-8bee-fa4f8547f95f', 'Staff', 'Apoio administrativo, logística, recepção e operações', false, '2026-08-11T23:45:38.351705+00:00', '2026-08-11T23:45:38.351705+00:00'),
('1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'Coordenador de Núcleo', 'Gestão do polo esportivo físico, infraestrutura e equipamentos', false, '2026-08-11T23:45:37.781882+00:00', '2026-08-11T23:45:37.781882+00:00')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.perfil_permissoes
-- ------------------------------------------------------------
INSERT INTO public.perfil_permissoes (id, perfil_id, modulo, acao, permitido, created_at, updated_at) VALUES
('24031f63-c2cc-4a18-ab63-8587b2a95d1b', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'objetos', 'visualizar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('b6b43eb2-87e8-401e-8ece-92f823e49660', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'objetos', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('417e84f7-ce03-4bee-b19c-5fe6f9b97e4c', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'objetos', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('c554f288-7029-4cfe-bd13-1e05dbb7e288', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'objetos', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('3b3a265c-eae9-414a-9388-e24a8c7c5132', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'organizacoes', 'visualizar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('c001c31d-fd70-4cfc-87ad-f2a0ee2b9a4c', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'organizacoes', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('a7820d06-ea13-402b-b470-05bb36863944', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'organizacoes', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('86426d02-e378-4e3f-b847-2a43bf44ae33', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'organizacoes', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('9098985a-a133-4d77-a31c-3d8ceb490410', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'nucleos', 'visualizar', true, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('ab17c1fb-541a-4e1e-b1d7-e387a86f9f5f', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'nucleos', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('a58927d9-4a36-49ea-820e-d896a34f492b', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'nucleos', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('dd078261-1302-4ccb-afec-2169a9d1f88f', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'nucleos', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('2720ba4f-ae21-4b4a-b386-5b898ffecaa8', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'turmas', 'visualizar', true, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('33823858-a164-4f02-9670-16dd164e00dc', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'turmas', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('f585ac58-b946-4d4b-9681-b0af7ce32043', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'turmas', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('2c6b5b95-2cfa-4e23-8bf6-3e535131682f', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'turmas', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('d1cad525-3417-4dbf-ab41-9b90f0eed0c9', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'inscricoes', 'visualizar', true, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('ce3a3cff-afc2-40a9-96e3-1f22972e74ac', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'inscricoes', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('629ca3f4-c4ad-4f0b-8bb9-e81cd3c1daa5', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'inscricoes', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('3d578466-fdb3-4cf1-88f7-ef8b581ea3a4', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'inscricoes', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('85fe6480-7150-47bd-a32a-785b76d502df', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'atividades', 'visualizar', true, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('36b7b146-2186-446f-a96c-af76ad674679', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'atividades', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('7c3a91e7-9274-492b-b938-5e48f06c3867', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'atividades', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('fffa4b0f-bea7-4ce5-a8b5-064ad26423a6', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'atividades', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('77c440c7-d859-4146-bf69-8bb2da08f35d', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'beneficiarios', 'visualizar', true, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('cf513a69-2150-49e0-94ef-14ed5f60c066', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'beneficiarios', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('6990d5f8-8b3a-4878-bf94-e8e6cc7953f7', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'beneficiarios', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('10e69b59-e290-4fb7-927b-0d20abc5b8c8', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'beneficiarios', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('74a93452-8725-42e9-8272-3223970a9cfe', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'funcionarios', 'visualizar', true, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('3d1491f3-5432-4a44-acb8-f1d1b83a3905', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'funcionarios', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('26b97d34-bccd-4c11-a0da-24328c178f95', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'funcionarios', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('06810765-189b-4835-9a50-e36e9c9114dc', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'funcionarios', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('03036213-5e96-4955-8933-78f309f37772', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'equipamentos', 'visualizar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('95167095-7a99-4fa5-85af-7697d9e6fa27', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'equipamentos', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('7633ad7d-35db-45d1-b5d3-8cec45591954', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'equipamentos', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('ba6856d0-4288-4169-b8ef-9f5cb322f568', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'equipamentos', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('08baf9f5-fee1-4001-8894-c5116226cac2', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'relatorios', 'visualizar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('11afe800-dcd9-49a8-8014-48475772d0b9', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'relatorios', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('7750745b-eede-4546-90ac-3c597d308735', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'relatorios', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('276ccee3-3a09-469e-9ab1-f19e6d6d80ce', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'relatorios', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('d41b0a1d-088e-4920-81ed-ba771ec25abe', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'configuracoes', 'visualizar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('57755b72-c3a8-40c7-93f4-0605f1a7a8d0', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'configuracoes', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('36a5bcfb-8193-4d74-93bf-123a772982d9', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'configuracoes', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('dfd59462-2df1-490d-9ca5-cdd64e7a2d73', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'configuracoes', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('bdea16e4-3dad-4de0-878c-4dcc82387609', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'usuarios', 'visualizar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('1ee2b47c-deb0-4619-a3aa-94d0a374784e', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'usuarios', 'criar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('d16da55b-6693-405c-a310-fff666a5bf31', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'usuarios', 'editar', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('1d485119-8d70-4be8-ade4-c9024a902a2b', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'usuarios', 'excluir', false, '2026-08-12T00:10:14.811968+00:00', '2026-08-12T00:10:14.811968+00:00'),
('5d9bf5d7-b291-472b-a441-1c325ef9a339', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'aulas', 'visualizar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('bc00ed9a-4156-4ee4-839c-a143dc0fe23b', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'aulas', 'criar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('2f8ccaab-e584-45fc-a97a-39e49c521ec6', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'aulas', 'editar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('a2858fbc-4119-4994-a30c-3958f590c922', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'ponto', 'visualizar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('fa082034-2e18-493c-86a8-87e610e784a0', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'ponto', 'criar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('1df2e43e-e984-453f-bc90-156484faee7b', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'ponto', 'editar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('80acab07-3548-4dd2-aee3-fd7c07a1a214', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'comprovacoes', 'visualizar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('7a648f0d-634b-4593-9068-3f554efe16f7', '1bea5f77-95ef-4969-bf87-4cd4647f6c0a', 'comprovacoes', 'criar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('ead2b59e-8ca0-4f24-a9ce-0c1a4155ec56', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'objetos', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('ce487cb1-e73e-442e-891b-4eb4f37cd73f', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'objetos', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('d5986aeb-c79c-4cbd-91f1-9dfccdf2981f', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'objetos', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('2d16c640-7cec-42b5-821c-8d9a05199138', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'objetos', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('2b24ba1c-1509-4389-8a64-053ac56c46ee', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'organizacoes', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('77cf2a33-53cd-49e5-9386-d7cf612926fb', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'organizacoes', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('1d19aebb-a835-48e8-bee9-2f4ddda6b398', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'organizacoes', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('3953e1ec-7c16-4f19-bb10-ee860a5f5e98', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'organizacoes', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('d98f21b9-97ec-44e2-934a-243ec1bdadb0', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'nucleos', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('387c7918-e6d7-4432-952a-352170e8184d', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'nucleos', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('57bb2fcc-e367-4596-97d7-e8f9878de131', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'nucleos', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('93660fa3-8022-47e6-b12a-5b7ccc18b2b1', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'nucleos', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('2a8a9898-bdf4-41dd-abdb-894e0ba799f3', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'turmas', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('da90df09-bf4a-4f36-9869-a23673b74dc5', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'turmas', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('e9fddf3a-b560-484f-a72a-37e45b889c33', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'turmas', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('93bd88c5-2456-43c1-917e-779c5800d181', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'turmas', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('1c307d33-9ea6-474f-a293-a6a8a916dba2', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'atividades', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('77b088e5-cedd-48dc-b6d1-b965bf8e51ff', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'atividades', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('07201aae-96e6-487f-b918-9091cceb5eb8', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'atividades', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('c060bd12-8c88-4642-aba5-991055f6f66a', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'atividades', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('5920b26d-a2b1-46a8-9449-aad1976ba045', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'beneficiarios', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('5fbf708a-20db-4c1e-95f0-3a6bfb9355aa', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'beneficiarios', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('83ac7f43-234e-447b-bda4-807e371053fa', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'beneficiarios', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('e8bbc5ec-87e7-4118-a2b9-524131ab2ef8', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'beneficiarios', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('964c39c5-a871-4e05-9cf2-b913d3a5bd79', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'funcionarios', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('4d57ae20-9753-4f59-87a8-430580a65d08', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'funcionarios', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('66b3e3d3-ffbf-4db1-b928-8c8f36d15fbb', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'funcionarios', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('fa43bcb7-fdbe-4eff-a3aa-126a2497725e', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'funcionarios', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('fdd4748d-034b-4f2e-888c-26ff43741386', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'equipamentos', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('1380e645-103b-4fdf-8782-2aa9e9919997', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'equipamentos', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('2acbebd8-1283-44a0-afda-69e9db3458c3', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'equipamentos', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('389ccf17-d2e6-4b52-b21d-a80c0d182cab', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'equipamentos', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('9fee6047-5ee1-4715-a14e-095cd188e907', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'inscricoes', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('2b45d3c7-72b9-4bc5-a7f5-da0d4dc312c9', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'inscricoes', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('461a7fa7-512f-436b-a700-eb47dff69364', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'inscricoes', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('6a426adf-8602-45e7-be46-893f15047ab6', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'inscricoes', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('08fdb303-5c78-418f-981e-4cd56d407dee', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'relatorios', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('805a3a13-cf99-46fe-b2f6-83df09679fdf', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'relatorios', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('a9bf081b-51f1-4384-9164-e8cca47df131', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'relatorios', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('25fa6d7b-7820-46e7-9724-13c91fd6ce60', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'relatorios', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('ebe7861a-1739-40e8-badd-3918b07decaf', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'configuracoes', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('e8502176-0453-4c2a-92bd-e8344726d2df', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'configuracoes', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('c7787e53-7a51-4cc7-8a2d-4a8bf793ba29', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'configuracoes', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('4d988d44-3432-47c4-9a6c-987fd359abe8', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'configuracoes', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('c428a68e-109a-477a-9187-86c1f626dcbd', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'usuarios', 'visualizar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('da1a897a-651e-444c-9db9-eed38044763a', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'usuarios', 'criar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('f886c3ee-8946-4d84-a361-af9673624af7', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'usuarios', 'editar', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('8bbf52a7-c5cb-4ec8-b5fb-fb296c47a768', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'usuarios', 'excluir', true, '2026-08-11T22:21:31.186353+00:00', '2026-08-11T22:21:31.186353+00:00'),
('5216de23-842f-422d-842e-53f92897ad79', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'aulas', 'visualizar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('42a7bb26-e443-41bc-a42e-c6d666bf94e4', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'aulas', 'criar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('66e73ea9-1e26-47b7-8fcf-737dedaa79f3', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'aulas', 'editar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('c5e54ffe-bc6b-462c-b90e-e6a475eb175f', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'aulas', 'excluir', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('bfa2ec0b-6aa5-4ea0-a390-52de402a532d', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'ponto', 'visualizar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('ed0efeba-cd00-48c1-8679-07339cd99d43', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'ponto', 'criar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('f580967b-759f-4a36-8dc9-4ab9bd336122', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'ponto', 'editar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('5965aea2-80c4-49ab-99ec-95d079de5b43', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'comprovacoes', 'visualizar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('b459c3d8-67fd-4d06-ae7b-d9e34d7bc27d', '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', 'comprovacoes', 'criar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('df5ed2e2-7032-4e51-91ab-df655fb5e89c', 'b9def33a-a2a0-477d-8580-ec213d642808', 'objetos', 'visualizar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('1e29a3b4-4804-43f0-95a6-3d5b4a7f0703', 'b9def33a-a2a0-477d-8580-ec213d642808', 'objetos', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('7d984125-ef74-4b99-b84a-8a29af618c7e', 'b9def33a-a2a0-477d-8580-ec213d642808', 'objetos', 'editar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('0f157c80-2c3d-440a-92e7-4bce3b058fa7', 'b9def33a-a2a0-477d-8580-ec213d642808', 'objetos', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('ec7ecc79-946a-4acf-9f1c-739523820dbf', 'b9def33a-a2a0-477d-8580-ec213d642808', 'organizacoes', 'visualizar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('968c5523-c17d-474a-84fd-166372fe1f9a', 'b9def33a-a2a0-477d-8580-ec213d642808', 'organizacoes', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('39bc4f12-2b20-495a-ae6c-82cee39f08e9', 'b9def33a-a2a0-477d-8580-ec213d642808', 'organizacoes', 'editar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('1c42bfee-8097-4260-9c7c-f128ad2281ac', 'b9def33a-a2a0-477d-8580-ec213d642808', 'organizacoes', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('7f414916-5a25-4a0a-a65e-f2d06b2f2152', 'b9def33a-a2a0-477d-8580-ec213d642808', 'nucleos', 'visualizar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('a9c28a62-2722-4040-a3fe-11f4009d5a0a', 'b9def33a-a2a0-477d-8580-ec213d642808', 'nucleos', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('e5b6f08c-092b-4dfe-b8d9-04bee789e188', 'b9def33a-a2a0-477d-8580-ec213d642808', 'nucleos', 'editar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('8f85363f-309c-4a4f-83c2-6bb2479f7995', 'b9def33a-a2a0-477d-8580-ec213d642808', 'nucleos', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('1fa0bd8f-f617-43cf-8f1b-2d12e88f61dd', 'b9def33a-a2a0-477d-8580-ec213d642808', 'turmas', 'visualizar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('78580411-5425-4ea1-a833-49cd19ec0914', 'b9def33a-a2a0-477d-8580-ec213d642808', 'turmas', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('f34ec060-0d6b-4cb9-8695-8bc44afdf1cc', 'b9def33a-a2a0-477d-8580-ec213d642808', 'turmas', 'editar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('b32c9b60-21a8-4737-9f90-647c970d6c97', 'b9def33a-a2a0-477d-8580-ec213d642808', 'turmas', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('cfd2c3c6-c973-4aa3-8ca1-16f96706a848', 'b9def33a-a2a0-477d-8580-ec213d642808', 'atividades', 'visualizar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('03cc63fb-6d7b-46de-bc56-0be31c4c17b5', 'b9def33a-a2a0-477d-8580-ec213d642808', 'atividades', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('01812027-df08-4b15-b798-b013465ebf29', 'b9def33a-a2a0-477d-8580-ec213d642808', 'atividades', 'editar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('8057f20e-b57e-4c36-842f-0acb816ef009', 'b9def33a-a2a0-477d-8580-ec213d642808', 'atividades', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('04fb5040-4028-4bcc-a692-e1af869028b3', 'b9def33a-a2a0-477d-8580-ec213d642808', 'beneficiarios', 'visualizar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('1f0a8c98-3df2-48b7-8d81-af34167004d5', 'b9def33a-a2a0-477d-8580-ec213d642808', 'beneficiarios', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('c48acf5d-c4e1-406b-af55-b0aab4244d23', 'b9def33a-a2a0-477d-8580-ec213d642808', 'beneficiarios', 'editar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('cd915e41-9bef-4d4d-84fe-0ecb03a139eb', 'b9def33a-a2a0-477d-8580-ec213d642808', 'beneficiarios', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('18259410-5c76-4c7e-978f-7dd33afb5213', 'b9def33a-a2a0-477d-8580-ec213d642808', 'funcionarios', 'visualizar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('0f847edf-5a64-4030-abcd-840d85291154', 'b9def33a-a2a0-477d-8580-ec213d642808', 'funcionarios', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('ba798af4-c2e2-4af2-84cd-a8d49f4661e6', 'b9def33a-a2a0-477d-8580-ec213d642808', 'funcionarios', 'editar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('cf8fb795-8215-473f-975d-3b195c287165', 'b9def33a-a2a0-477d-8580-ec213d642808', 'funcionarios', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('84ceb8f8-3953-4704-a771-ac6c9fff17c3', 'b9def33a-a2a0-477d-8580-ec213d642808', 'equipamentos', 'visualizar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('ce7283d4-b073-40b0-9769-c2fd2e5bb394', 'b9def33a-a2a0-477d-8580-ec213d642808', 'equipamentos', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('9e736e22-e662-4ee8-8c99-480d048d404c', 'b9def33a-a2a0-477d-8580-ec213d642808', 'equipamentos', 'editar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('fdce5b3d-68d3-458f-b521-7f816dac88db', 'b9def33a-a2a0-477d-8580-ec213d642808', 'equipamentos', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('957bcc89-8480-4332-ae74-0a2c7fd4bd88', 'b9def33a-a2a0-477d-8580-ec213d642808', 'inscricoes', 'visualizar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('474a8917-9986-42b2-bb0b-34b109044520', 'b9def33a-a2a0-477d-8580-ec213d642808', 'inscricoes', 'criar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('12dc4d43-d5db-4433-836c-7bde4da47263', 'b9def33a-a2a0-477d-8580-ec213d642808', 'inscricoes', 'editar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('fa22ee42-85d6-4a04-b065-a2dc50351bb8', 'b9def33a-a2a0-477d-8580-ec213d642808', 'inscricoes', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('f5d3912b-b12c-4c3b-a5af-60a11176b944', 'b9def33a-a2a0-477d-8580-ec213d642808', 'relatorios', 'visualizar', true, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('7283fbeb-af11-4990-9532-9192c22ed6a7', 'b9def33a-a2a0-477d-8580-ec213d642808', 'relatorios', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('49b8038b-7064-4553-9490-bab9072a046a', 'b9def33a-a2a0-477d-8580-ec213d642808', 'relatorios', 'editar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('6a71f0c3-5fc4-4ebe-b878-9d82911bd87a', 'b9def33a-a2a0-477d-8580-ec213d642808', 'relatorios', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('ac63c26d-8041-45d8-a2a3-d351b00c8a30', 'b9def33a-a2a0-477d-8580-ec213d642808', 'configuracoes', 'visualizar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('ee5cfcc6-973f-4f95-a4a7-9cb1ab6bbe4a', 'b9def33a-a2a0-477d-8580-ec213d642808', 'configuracoes', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('15cf774c-8f15-4e1b-b6e9-eea859d6a1af', 'b9def33a-a2a0-477d-8580-ec213d642808', 'configuracoes', 'editar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('4a443f9f-feee-499b-a5ee-8514e5ec57f9', 'b9def33a-a2a0-477d-8580-ec213d642808', 'configuracoes', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('16dac058-3a0b-4f61-b8a0-627d32349846', 'b9def33a-a2a0-477d-8580-ec213d642808', 'usuarios', 'visualizar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('7aeccb91-6944-4fc3-b68a-45c242d4776e', 'b9def33a-a2a0-477d-8580-ec213d642808', 'usuarios', 'criar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('fdd2a6bd-a980-4485-a4da-f3175a4554d2', 'b9def33a-a2a0-477d-8580-ec213d642808', 'usuarios', 'editar', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('39413417-c252-476a-a951-f8fad087bf16', 'b9def33a-a2a0-477d-8580-ec213d642808', 'usuarios', 'excluir', false, '2026-08-11T22:21:32.000671+00:00', '2026-08-11T22:21:32.000671+00:00'),
('a8eccc8b-2935-4a77-9d3e-01273be29795', 'b9def33a-a2a0-477d-8580-ec213d642808', 'aulas', 'visualizar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('a744c88c-f01b-4cc4-8b8f-f62ae887d568', 'b9def33a-a2a0-477d-8580-ec213d642808', 'aulas', 'criar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('5f1634d0-7201-4141-b2f9-6406b80b1620', 'b9def33a-a2a0-477d-8580-ec213d642808', 'aulas', 'editar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('588c5187-5c63-4c27-9747-cf09f8064fac', 'b9def33a-a2a0-477d-8580-ec213d642808', 'ponto', 'visualizar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('44fa8dcf-d8ba-4600-9c7f-67543892ae25', 'b9def33a-a2a0-477d-8580-ec213d642808', 'ponto', 'criar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('6640cdf7-3b88-4386-989f-ddc16dd9908e', 'b9def33a-a2a0-477d-8580-ec213d642808', 'comprovacoes', 'visualizar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00'),
('3dfbce28-4c70-404f-9e47-47d9cfce2449', 'b9def33a-a2a0-477d-8580-ec213d642808', 'comprovacoes', 'criar', true, '2026-08-16T03:00:09.224642+00:00', '2026-08-16T03:00:09.224642+00:00')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.funcoes
-- ------------------------------------------------------------
INSERT INTO public.funcoes (id, nome, descricao, created_at, updated_at, deleted_at, permite_login) VALUES
('08532962-35c8-470b-aa7b-9ed41b8dcc38', 'Professor / Instrutor Esportivo', 'Profissionais responsáveis pelas aulas práticas de futebol e futsal nos núcleos.', '2026-08-07T03:39:42.714624+00:00', '2026-08-07T03:39:42.714624+00:00', NULL, true),
('6c532ade-7428-4496-bb5a-efe3fc2d1f13', 'Coordenador Geral', 'Responsável técnico e institucional pela supervisão geral do projeto.', '2026-08-07T03:39:42.714624+00:00', '2026-08-07T03:39:42.714624+00:00', NULL, true),
('9382ec0c-619f-4d6f-a314-8c098a80cf53', 'Coordenador de Logística', 'Responsável pelo apoio operacional e logístico aos núcleos da região.', '2026-08-07T03:39:42.714624+00:00', '2026-08-07T03:39:42.714624+00:00', NULL, true),
('cb306228-8a02-43f5-8ad8-b55f2f92cd4b', 'Supervisor de Campo', 'Supervisão presencial de treinos, infraestrutura e presença nos núcleos.', '2026-08-07T03:39:42.714624+00:00', '2026-08-07T03:39:42.714624+00:00', NULL, true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.objetos
-- ------------------------------------------------------------
INSERT INTO public.objetos (id, nome, descricao, termo_de_fomento, codigo_objeto, status, data_inicio, data_termino, created_at) VALUES
('7ded20a0-cdcc-4c8e-a666-0b3bbf399e57', 'Escolinhas de Futebol e Futsal de Palmas', 'Implementação de 20 Núcleos...', 'Termo de Colaboração nº 002/2026', '00000.0.028571/2026', 'ativo', '2026-08-01', '2027-07-31', '2026-08-07T03:18:08.105886+00:00')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.organizacoes
-- ------------------------------------------------------------
INSERT INTO public.organizacoes (id, nome, cnpj, objeto_id, status) VALUES
('4d00f266-48f0-4cf0-8974-cbeb2073ccef', 'INSTITUTO ATLETA PARA SEMPRE', '17.397.521/0001-27', '7ded20a0-cdcc-4c8e-a666-0b3bbf399e57', 'ativa'),
('a43f5eac-30fb-4148-b126-8aa149e7f9ea', 'Instituto Esporte e Vida', '89.375.982/0001-00', '7ded20a0-cdcc-4c8e-a666-0b3bbf399e57', 'ativa')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.atividades
-- ------------------------------------------------------------
INSERT INTO public.atividades (id, nome, descricao, idade_minima, idade_maxima, tipo_aprovacao, disponivel_pre_inscricao, uso_interno) VALUES
('33e14055-b429-45d6-93cf-36b91f61497d', 'Futebol de Campo', 'Aulas de esporte educacional...', 6, 18, 'automatica', true, false),
('30ae8423-ac9f-4884-ad20-0d770d047ca6', 'Futsal', 'Aulas de futsal educacional...', 6, 18, 'automatica', true, false),
('d1deadb0-f128-4189-89de-a05d342de004', 'Planejamento de Aula', NULL, NULL, NULL, 'automatica', false, true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.configuracoes
-- ------------------------------------------------------------
INSERT INTO public.configuracoes (id, chave, valor) VALUES
('7806f48a-3dd6-4be5-a6b2-dd1e56307021', 'logo_url', '"https://qrzszjogxrrjqjkoowoi.supabase.co/storage/v1/object/public/logos/logo.png"'::jsonb),
('ab4edc60-0bed-4756-adeb-e448f9c455bf', 'dicionario_termos', '{"local": "Núcleo", "turma": "Turma", "objeto": "Objeto", "atividade": "Atividade", "instrutor": "Instrutor", "organizacao": "Organizaçõe", "beneficiario": "Beneficiário"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.nucleos
-- ------------------------------------------------------------
INSERT INTO public.nucleos (id, identificacao, nome_local, regiao, cep, endereco, numero, cidade, bairro, complemento, latitude, longitude, nome_responsavel, telefone_contato, organizacao_id, data_inicio, data_fechamento, em_funcionamento, disponivel_pre_inscricao, created_at, updated_at, deleted_at, tipo_restricao_chamada, permitir_chamada_retroativa, tolerancia_inicio_minutos, tolerancia_fim_minutos, dias_limite_retroativo) VALUES
('f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', 'Escolinha Esportiva de Taquaruçu', 'Complexo Esportivo de Taquaruçu', 'Região Sul', NULL, 'Área Central do Complexo Esportivo de Taquaruçu na 3ª Av.', NULL, 'Palmas', 'Taquaruçu Centro', NULL, NULL, NULL, 'Hallid Luz Husein', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('c6eb015d-de1c-44c7-af33-3ed4d08be7e0', 'Núcleo Aureny III', 'Arena Foguin', 'Região Sul', NULL, 'Rua 40 APM 22 Arena Foguin', NULL, 'Palmas', 'Aureny III', NULL, NULL, NULL, 'Jorge Martins', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('f30e0b29-e128-4989-ae53-1c9c7f068f4d', 'Núcleo Capadócia', 'Capadócia Taquari', 'Região Sul', NULL, 'T33 Conjunto 05 Rua NS 20 Lote 14 Capadócia Taquari', NULL, 'Palmas', 'Capadócia', NULL, NULL, NULL, 'Caíque Cirilo', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('959772b0-1603-4d52-aa49-433b57999b4f', 'Núcleo Buritirana', 'ETI Luiz Nunes de Oliveira', 'Região Sul', NULL, 'Escola de Tempo Integral Luiz Nunes de Oliveira, s/n, Quadra 17, Lote 01', NULL, 'Palmas', 'Buritirana', NULL, NULL, NULL, 'Luiz Carlos', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('f4e42426-4b60-40bf-a060-f659ece0cb57', 'Escolinha Flamboyant', 'Escolinha Flamboyant', 'Região Sul', NULL, 'Alameda 1, 2 - T 13 Setor Flamboyant 2', NULL, 'Palmas', 'Flamboyant', NULL, NULL, NULL, 'Vagno Rodrigues', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('dfed7e80-c260-4b0d-8329-e68c834ed4de', 'Núcleo Sol Nascente I', 'Setor Sol Nascente', 'Região Sul', NULL, 'Rua NC 02, QD 33, Setor Sol Nascente', NULL, 'Palmas', 'Sol Nascente I', NULL, NULL, NULL, 'Rolnan', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('e5305f61-fa4e-4377-9b86-62a7ebceb78e', 'Escolinha do Sol Nascente', 'Sol Nascente II', 'Região Sul', NULL, 'Rua P3 QD 33 Lote 8 Setor Sol Nascente', NULL, 'Palmas', 'Sol Nascente II', NULL, NULL, NULL, 'Wilton', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('39e96034-efcc-46a4-b66b-2a60d27c5293', 'Núcleo Vila Agrotins', 'Vila Agrotins', 'Região Sul', NULL, 'Rua 03 nº 53', NULL, 'Palmas', 'Vila Agrotins', NULL, NULL, NULL, 'Rivaldo', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('eaa7dfd2-e5c6-4691-9471-a03eca53011e', 'Núcleo Lago Sul', 'Residencial Lago Sul', 'Região Sul', NULL, 'Avenida D HM 02 Condomínio Residencial Lago Sul', NULL, 'Palmas', 'Lago Sul', NULL, NULL, NULL, 'Ramon Batista', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('bc9c92d2-e5aa-4be0-9d8e-3f34a489817e', 'Complexo ARNO 51', 'Complexo Poliesportivo', 'Região Norte', '77001-964', 'Área Verde, Quadra 403 Norte, Avenida LO 14', NULL, 'Palmas', 'ARNO 51', NULL, NULL, NULL, 'Alexandre', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('9702bfa5-3194-43cb-8b1c-cb47598d64de', 'Núcleo Quadra 1206 Sul', 'Área Verde 1206 Sul', 'Região Norte', NULL, 'Alameda 23 Área Verde', NULL, 'Palmas', '1206 Sul', NULL, NULL, NULL, 'Kaio', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('4b2cbfc8-fd3a-41da-a159-6121121f100f', 'Núcleo Quadra 906 Sul', 'Plano Diretor Sul', 'Região Norte', '77023-428', 'Alameda 3, nº 10 - Plano Diretor Sul', NULL, 'Palmas', '906 Sul', NULL, NULL, NULL, 'João Vitor', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('ef41c13f-abf7-43d1-8882-1a826ff6311d', 'Haras RR', 'Haras RR', 'Região Norte', '77249-899', 'TO-020, KM 05', NULL, 'Palmas', 'Taquaruçu Grande', NULL, NULL, NULL, 'Romário', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('71131091-b7a8-4995-ad77-b4637011975d', 'Núcleo Quadra 607 Norte', 'ARNO 607 Norte', 'Região Norte', '77001-707', 'LT 190 ARNO', NULL, 'Palmas', '607 Norte', NULL, NULL, NULL, 'Sthefferson Mafra', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('3c1c5b0c-cbf7-40e6-bb06-0ff39ca0a6f2', 'Núcleo Santo Amaro', 'Santo Amaro', 'Região Norte', NULL, 'APM 03 e 04, Alameda 05 com Alameda 13', NULL, 'Palmas', 'Santo Amaro', NULL, NULL, NULL, 'Renato', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('407360e1-f4d1-4a4a-90b8-2f579353e124', 'Quadra Esportiva Praça 208 Sul', 'Praça 208 Sul', 'Região Norte', '77020-548', 'Avenida NS 8, 417 - ARSE', NULL, 'Palmas', '208 Sul', NULL, NULL, NULL, 'Felipe Alves', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('93ffef82-7f1f-4c44-a84f-6d1f8e97c07d', 'Centro Desenv. Futebol Palmas', 'Campo da CBF', 'Região Norte', NULL, 'Setor Polinésio - Área Verde - Campo da CBF', NULL, 'Palmas', 'Setor Polinésia', NULL, NULL, NULL, 'Marcos Sousa', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('571bc2ad-1cde-435d-b69f-226111e6644e', 'Núcleo Quadra 1303 Sul', 'Quadra 1303 Sul', 'Região Norte', '77019-678', 'Alameda 15 Lote 01 de Frente', NULL, 'Palmas', '1303 Sul', NULL, NULL, NULL, 'Carlos Henrique', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('636a8f12-8eaf-4d79-99d2-a505a8ec9d2b', 'Núcleo Lago Norte', 'Lago Norte', 'Região Norte', '77003-350', 'Alameda 1A, Quadra 19 (Próximo à Associação dos Moradores)', NULL, 'Palmas', 'Lago Norte', NULL, NULL, NULL, 'Paulo Roberto', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-01', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', false, 15, 15, 7),
('23efd617-da43-4e3c-944e-ad09e2790c2b', 'Campo T31 - Taquari', 'Campo T31', 'Região Sul', NULL, 'Rua LO 13, Quadra T31, Conjunto 24', NULL, 'Palmas', 'Taquari', NULL, NULL, NULL, 'Aleksandro Soares', NULL, '4d00f266-48f0-4cf0-8974-cbeb2073ccef', '2026-08-15', NULL, true, true, '2026-08-07T03:27:06.855469+00:00', '2026-08-07T03:27:06.855469+00:00', NULL, 'data', true, 15, 15, 2)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.funcionarios
-- ------------------------------------------------------------
INSERT INTO public.funcionarios (id, matricula, nome_completo, data_nascimento, cpf, celular, email, foto_url, status, data_admissao, nucleo_id, alocado_em, created_at, updated_at, deleted_at, funcao, remuneracao, conselho, registro_conselho, data_demissao, professor_responsavel) VALUES
('75b59a1c-139d-4101-9d9d-dd8c1b808a57', 'PROF-006', 'Vagno Rodrigues de Souza', NULL, NULL, NULL, 'vagnoaraujo78@gmail.com', NULL, 'ativo', NULL, 'f4e42426-4b60-40bf-a060-f659ece0cb57', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('326a528c-23ae-49b0-a725-fd5533ae17de', 'PROF-018', 'Rolnan Ferreira Lima', NULL, NULL, NULL, 'rolnancosta10@gmail.com', NULL, 'ativo', NULL, 'dfed7e80-c260-4b0d-8329-e68c834ed4de', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('aff66bbf-3bf5-4319-be4c-e61810cb33ef', 'PROF-004', 'Wilton Alves de Oliveira', NULL, NULL, NULL, 'pereirawiltom498@gmail.com', NULL, 'ativo', NULL, 'e5305f61-fa4e-4377-9b86-62a7ebceb78e', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('8faff896-1642-4902-835f-614115d2df70', 'PROF-019', 'Rivaldo Pereira da Silva', NULL, NULL, NULL, 'monteirorivaldo217@gmail.com', NULL, 'ativo', NULL, '39e96034-efcc-46a4-b66b-2a60d27c5293', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('a911f561-97f8-4798-9717-65f6f338b17f', 'PROF-012', 'Ramon Batista Ribeiro', NULL, NULL, NULL, 'ramonbatistalustosa@gmail.com', NULL, 'ativo', NULL, 'eaa7dfd2-e5c6-4691-9471-a03eca53011e', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('8119b4ac-0941-46bb-9bac-fa97ac78d6c6', 'PROF-003', 'Alexandre Silva Santos', NULL, NULL, NULL, 'mande.paraensee@gmail.com', NULL, 'ativo', NULL, 'bc9c92d2-e5aa-4be0-9d8e-3f34a489817e', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('14f526be-3b4f-44ff-823d-82db4897ff13', 'PROF-013', 'Kaio Henrique Ferreira', NULL, NULL, NULL, 'kaio.vivoinfo@gmail.com', NULL, 'ativo', NULL, '9702bfa5-3194-43cb-8b1c-cb47598d64de', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('25d65151-e046-4288-b6ad-4bd623e441eb', 'PROF-016', 'João Vitor Mendonça', NULL, NULL, NULL, 'rodriguesjvr14@gmail.com', NULL, 'ativo', NULL, '4b2cbfc8-fd3a-41da-a159-6121121f100f', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('584196f0-48a8-42ac-bd34-a09ab6dea7f4', 'PROF-007', 'Romário Souza Dias', NULL, NULL, NULL, 'romarioribeiro0827@gmail.com', NULL, 'ativo', NULL, 'ef41c13f-abf7-43d1-8882-1a826ff6311d', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('e804ac5e-890f-4bd8-88f6-392508a78427', 'PROF-015', 'Sthefferson Mafra Barreto', NULL, NULL, NULL, 'saotefin@hotmail.com', NULL, 'ativo', NULL, '71131091-b7a8-4995-ad77-b4637011975d', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('a1419d7a-2668-4c1f-b90d-6ddb0455195d', 'PROF-017', 'Renato Gomes de Castro', NULL, NULL, NULL, 'renato_brunes@hotmail.com', NULL, 'ativo', NULL, '3c1c5b0c-cbf7-40e6-bb06-0ff39ca0a6f2', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('63a1db78-94c4-4c2e-892f-ed7997806cce', 'PROF-020', 'Felipe Ribeiro Alves', NULL, NULL, NULL, 'felipepmw@hotmail.com', NULL, 'ativo', NULL, '407360e1-f4d1-4a4a-90b8-2f579353e124', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('264e3e0e-c5c3-4ef5-b4ba-1c740c3346fe', 'PROF-002', 'Marcos Sousa Rocha', NULL, NULL, NULL, 'marcosterreco1972@gmail.com', NULL, 'ativo', NULL, '93ffef82-7f1f-4c44-a84f-6d1f8e97c07d', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('26064a2e-b582-4b85-8e2a-460b85dff86c', 'PROF-014', 'Carlos Henrique da Silva', NULL, NULL, NULL, 'carloshenrique002@icloud.com', NULL, 'ativo', NULL, '571bc2ad-1cde-435d-b69f-226111e6644e', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('32f6aaa2-47a8-46dd-b561-6534027fa961', 'PROF-011', 'Paulo Roberto Nogueira', NULL, NULL, NULL, 'paulopenedo83@gmail.com', NULL, 'ativo', NULL, '636a8f12-8eaf-4d79-99d2-a505a8ec9d2b', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('46f3ac6d-8bf9-4d55-8f3b-55ffd3b4421d', 'PROF-005', 'Hallid Luz Husein', NULL, NULL, NULL, 'luzhuseinh@gmail.com', NULL, 'ativo', NULL, 'f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('68492dfa-a951-4db6-a491-d19a37275195', 'PROF-008', 'Jorge Martins Silva', NULL, NULL, NULL, 'jorgeprofessor0711@gmail.com', NULL, 'ativo', NULL, 'c6eb015d-de1c-44c7-af33-3ed4d08be7e0', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('1d7c6bb8-62df-49a7-b558-99dcf90bcac2', 'PROF-001', 'Aleksandro Soares Santos', NULL, NULL, NULL, 'aleksandrosoaresdesousa@gmail.com', NULL, 'ativo', NULL, '23efd617-da43-4e3c-944e-ad09e2790c2b', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('8e1c2da1-3695-4b99-a109-9717dc75f9c4', 'PROF-010', 'Caíque Cirilo Costa', NULL, NULL, NULL, 'caiquecirilo0909@gmail.com', NULL, 'ativo', NULL, 'f30e0b29-e128-4989-ae53-1c9c7f068f4d', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true),
('840d67b9-3132-4c73-b001-a56344bf5dd7', 'PROF-009', 'Luiz Carlos Oliveira', NULL, NULL, NULL, '92253977carlos@gmail.com', NULL, 'ativo', NULL, '959772b0-1603-4d52-aa49-433b57999b4f', NULL, '2026-08-07T03:37:49.657604+00:00', '2026-08-07T03:37:49.657604+00:00', NULL, 'Professor / Instrutor Esportivo', NULL, NULL, NULL, NULL, true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.usuarios
-- ------------------------------------------------------------
INSERT INTO public.usuarios (id, email, nome_completo, tipo, ativo, entidade_id, perfil_id, created_at, updated_at, deleted_at, is_professor) VALUES
('af6dd3ca-07eb-470c-bc1a-70e389bb0476', 'admin@andorinha.local', 'Administrador', 'admin', true, NULL, '50572642-cf03-4dd7-b6ba-cea3a4efc7e6', '2026-08-05T23:14:59.891149+00:00', '2026-08-05T23:14:59.891149+00:00', NULL, false),
('594b0803-1aa6-4bd3-9bb6-c73f325b488c', 'caiquecirilo0909@gmail.com', 'Caíque Cirilo Costa', 'funcionario', true, '8e1c2da1-3695-4b99-a109-9717dc75f9c4', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('f2de01f6-f0ab-4484-9164-dbf89d96c784', '92253977carlos@gmail.com', 'Luiz Carlos Oliveira', 'funcionario', true, '840d67b9-3132-4c73-b001-a56344bf5dd7', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('2616da10-d43b-4167-9bbd-813f9c743658', 'professor@andorinha.local', 'Aleksandro Soares (Professor QA)', 'funcionario', true, '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-07T04:27:40.832365+00:00', '2026-08-07T04:27:40.832365+00:00', NULL, true),
('898bfd86-aa91-40b6-ae83-3147d91d0896', 'vagnoaraujo78@gmail.com', 'Vagno Rodrigues de Souza', 'funcionario', true, '75b59a1c-139d-4101-9d9d-dd8c1b808a57', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('2220cf62-abcb-4ca0-a785-763c9c890c94', 'rolnancosta10@gmail.com', 'Rolnan Ferreira Lima', 'funcionario', true, '326a528c-23ae-49b0-a725-fd5533ae17de', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('023be2d6-249e-4663-9ae8-8b6e34620db5', 'pereirawiltom498@gmail.com', 'Wilton Alves de Oliveira', 'funcionario', true, 'aff66bbf-3bf5-4319-be4c-e61810cb33ef', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('a4865e73-8550-465a-8447-e196234d9960', 'monteirorivaldo217@gmail.com', 'Rivaldo Pereira da Silva', 'funcionario', true, '8faff896-1642-4902-835f-614115d2df70', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('4f2abf93-3adc-419c-9e63-fea63ed28c24', 'ramonbatistalustosa@gmail.com', 'Ramon Batista Ribeiro', 'funcionario', true, 'a911f561-97f8-4798-9717-65f6f338b17f', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('6839695d-cb06-4359-8917-6779984daa0b', 'mande.paraensee@gmail.com', 'Alexandre Silva Santos', 'funcionario', true, '8119b4ac-0941-46bb-9bac-fa97ac78d6c6', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('880b3b15-2a83-4a20-a02b-831d8498541d', 'kaio.vivoinfo@gmail.com', 'Kaio Henrique Ferreira', 'funcionario', true, '14f526be-3b4f-44ff-823d-82db4897ff13', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('66316a05-a3e3-476c-8b2d-d6749fec30bc', 'rodriguesjvr14@gmail.com', 'João Vitor Mendonça', 'funcionario', true, '25d65151-e046-4288-b6ad-4bd623e441eb', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('4b59a045-2c08-44e8-bc4a-874fd44091b9', 'romarioribeiro0827@gmail.com', 'Romário Souza Dias', 'funcionario', true, '584196f0-48a8-42ac-bd34-a09ab6dea7f4', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('f3f5c91a-b98f-4bc9-9bf5-d31fb7d6b899', 'saotefin@hotmail.com', 'Sthefferson Mafra Barreto', 'funcionario', true, 'e804ac5e-890f-4bd8-88f6-392508a78427', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('2f0e1ca3-f87c-43ab-b104-1bb1ce8c95c7', 'renato_brunes@hotmail.com', 'Renato Gomes de Castro', 'funcionario', true, 'a1419d7a-2668-4c1f-b90d-6ddb0455195d', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('9c0fba20-378f-499f-82f0-e786eb845cd9', 'felipepmw@hotmail.com', 'Felipe Ribeiro Alves', 'funcionario', true, '63a1db78-94c4-4c2e-892f-ed7997806cce', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('a8689f70-69e8-421f-9322-01329260fd70', 'marcosterreco1972@gmail.com', 'Marcos Sousa Rocha', 'funcionario', true, '264e3e0e-c5c3-4ef5-b4ba-1c740c3346fe', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('babfaa48-3558-47bb-85da-9c10ccf966ce', 'carloshenrique002@icloud.com', 'Carlos Henrique da Silva', 'funcionario', true, '26064a2e-b582-4b85-8e2a-460b85dff86c', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('daa5af03-e97c-453e-8044-aae87631c7c4', 'paulopenedo83@gmail.com', 'Paulo Roberto Nogueira', 'funcionario', true, '32f6aaa2-47a8-46dd-b561-6534027fa961', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('9f4292db-3214-498c-88bb-529646f35445', 'luzhuseinh@gmail.com', 'Hallid Luz Husein', 'funcionario', true, '46f3ac6d-8bf9-4d55-8f3b-55ffd3b4421d', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('c48987de-9c25-40f3-977d-6b785cd47557', 'jorgeprofessor0711@gmail.com', 'Jorge Martins Silva', 'funcionario', true, '68492dfa-a951-4db6-a491-d19a37275195', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true),
('4d0c9662-ec45-4198-95bc-14d019585db8', 'aleksandrosoaresdesousa@gmail.com', 'Aleksandro Soares Santos', 'funcionario', true, '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', 'b9def33a-a2a0-477d-8580-ec213d642808', '2026-08-12T01:42:12.382094+00:00', '2026-08-12T01:42:12.382094+00:00', NULL, true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.turmas
-- ------------------------------------------------------------
INSERT INTO public.turmas (id, nome, nucleo_id, atividade_id, vagas_totais, exclusiva, data_inicio, data_fim, created_at, updated_at, deleted_at, status_inicial, idade_minima, idade_maxima, permitir_fila_espera) VALUES
('231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', 'Turma Campo T31 - Taquari - Futebol Manhã', '23efd617-da43-4e3c-944e-ad09e2790c2b', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('128ae477-30c1-4b7a-a3c7-644ab8d67123', 'Turma QA - Futsal Tarde', 'f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', NULL, '2026-08-07T04:16:35.402152+00:00', '2026-08-07T04:16:35.402152+00:00', '2026-08-10T15:06:43.157763+00:00', 'aprovada', 6, 17, true),
('5c3a07ec-8938-4290-8953-c93f7e37bd94', 'Turma QA - Futebol Manhã', 'f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', NULL, '2026-08-07T04:16:35.402152+00:00', '2026-08-07T04:16:35.402152+00:00', '2026-08-10T15:06:43.157763+00:00', 'pendente', 6, 17, true),
('b6dcee5c-bad9-4d3c-93ec-d80077e00346', 'Turma Campo T31 - Taquari - Futsal Tarde', '23efd617-da43-4e3c-944e-ad09e2790c2b', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('f0751631-1e14-4bdd-bdd9-0a5a83f39a93', 'Turma Centro Desenv. Futebol Palmas - Futebol Manhã', '93ffef82-7f1f-4c44-a84f-6d1f8e97c07d', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('0afe76e4-485c-4e0e-93fe-87328c11e932', 'Turma Centro Desenv. Futebol Palmas - Futsal Tarde', '93ffef82-7f1f-4c44-a84f-6d1f8e97c07d', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('9eeb5ff2-a7f7-47ed-a5e7-072fbd90b0c6', 'Turma Complexo ARNO 51 - Futebol Manhã', 'bc9c92d2-e5aa-4be0-9d8e-3f34a489817e', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('562e1489-d75c-476d-8fc1-033da31b3d83', 'Turma Complexo ARNO 51 - Futsal Tarde', 'bc9c92d2-e5aa-4be0-9d8e-3f34a489817e', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('187f314d-1c4e-498e-aac6-b899d46dc27a', 'Turma Escolinha do Sol Nascente - Futebol Manhã', 'e5305f61-fa4e-4377-9b86-62a7ebceb78e', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('b630b889-ecc2-460a-8972-52154ac11421', 'Turma Escolinha do Sol Nascente - Futsal Tarde', 'e5305f61-fa4e-4377-9b86-62a7ebceb78e', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('21242d32-1045-437f-a810-0c45d16d6803', 'Turma Escolinha Esportiva de Taquaruçu - Futebol Manhã', 'f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('4719acc2-8189-463a-8fcf-9db4f169301d', 'Turma Escolinha Esportiva de Taquaruçu - Futsal Tarde', 'f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('85b73eb9-38a3-43dc-badc-26f161beabfc', 'Turma Escolinha Flamboyant - Futebol Manhã', 'f4e42426-4b60-40bf-a060-f659ece0cb57', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('00a3ebbd-e11d-4497-9ebe-0ddf6d281cbf', 'Turma Escolinha Flamboyant - Futsal Tarde', 'f4e42426-4b60-40bf-a060-f659ece0cb57', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('b1aaf4c0-2027-4df8-84ff-935ffb2f4f49', 'Turma Haras RR - Futebol Manhã', 'ef41c13f-abf7-43d1-8882-1a826ff6311d', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('c1ab00d4-fbe4-484c-820f-a21c9a80088b', 'Turma Haras RR - Futsal Tarde', 'ef41c13f-abf7-43d1-8882-1a826ff6311d', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('c2688487-1789-4a4d-878a-9bb8364cf03f', 'Turma Aureny III - Futebol Manhã', 'c6eb015d-de1c-44c7-af33-3ed4d08be7e0', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('be442e23-019d-466b-825d-84fbcae2fbdd', 'Turma Aureny III - Futsal Tarde', 'c6eb015d-de1c-44c7-af33-3ed4d08be7e0', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('a3eb5eb4-8b6c-4c05-bc8b-e84ba1843970', 'Turma Buritirana - Futebol Manhã', '959772b0-1603-4d52-aa49-433b57999b4f', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('df0ee313-e724-4b7d-8ff3-8aa07db53b3a', 'Turma Buritirana - Futsal Tarde', '959772b0-1603-4d52-aa49-433b57999b4f', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('551297b9-fe88-4bca-82d4-f2d4760c3dde', 'Turma Capadócia - Futebol Manhã', 'f30e0b29-e128-4989-ae53-1c9c7f068f4d', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('8c0fb1de-74f2-4968-83b3-05bf5a887661', 'Turma Capadócia - Futsal Tarde', 'f30e0b29-e128-4989-ae53-1c9c7f068f4d', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('b93f91a2-ddba-4eed-bbab-a57cf502d525', 'Turma Lago Norte - Futebol Manhã', '636a8f12-8eaf-4d79-99d2-a505a8ec9d2b', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('a28a5def-9e9e-4f4b-a120-0151901fa22d', 'Turma Lago Norte - Futsal Tarde', '636a8f12-8eaf-4d79-99d2-a505a8ec9d2b', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('3d20dd80-68c8-4719-b5ef-98fae74f6631', 'Turma Lago Sul - Futebol Manhã', 'eaa7dfd2-e5c6-4691-9471-a03eca53011e', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('9807b472-83a6-406b-82e8-3b415fa704f3', 'Turma Lago Sul - Futsal Tarde', 'eaa7dfd2-e5c6-4691-9471-a03eca53011e', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('dc66f637-989b-4c79-8ea2-711aafebd7de', 'Turma Quadra 1206 Sul - Futebol Manhã', '9702bfa5-3194-43cb-8b1c-cb47598d64de', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('739ef59f-819a-4a04-81d9-21e09b6a0aa7', 'Turma Quadra 1206 Sul - Futsal Tarde', '9702bfa5-3194-43cb-8b1c-cb47598d64de', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('24c6609a-6ab5-4768-918c-480c4f5a0bdc', 'Turma Quadra 1303 Sul - Futebol Manhã', '571bc2ad-1cde-435d-b69f-226111e6644e', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('15e11d1c-6103-417d-8b04-983ff3fe3e46', 'Turma Quadra 1303 Sul - Futsal Tarde', '571bc2ad-1cde-435d-b69f-226111e6644e', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('69ac5e39-4f90-44bc-9852-c9b49eca4d13', 'Turma Quadra 607 Norte - Futebol Manhã', '71131091-b7a8-4995-ad77-b4637011975d', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('2daae7b9-f2c7-42e0-96cd-8464e4359962', 'Turma Quadra 607 Norte - Futsal Tarde', '71131091-b7a8-4995-ad77-b4637011975d', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('397830c5-e4e6-4d0e-b29a-8865ab622ccf', 'Turma Quadra 906 Sul - Futebol Manhã', '4b2cbfc8-fd3a-41da-a159-6121121f100f', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('f38984e1-c2e5-4531-94ba-943a063c24f5', 'Turma Quadra 906 Sul - Futsal Tarde', '4b2cbfc8-fd3a-41da-a159-6121121f100f', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('f98b6e75-2a1f-47ae-8979-6e2f8fb344b4', 'Turma Santo Amaro - Futebol Manhã', '3c1c5b0c-cbf7-40e6-bb06-0ff39ca0a6f2', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('c4bb7733-9fcf-4c13-8b00-33dd7f3ab2a8', 'Turma Santo Amaro - Futsal Tarde', '3c1c5b0c-cbf7-40e6-bb06-0ff39ca0a6f2', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('5d5dda54-9904-4619-92c9-c1c093bb2ec3', 'Turma Sol Nascente I - Futebol Manhã', 'dfed7e80-c260-4b0d-8329-e68c834ed4de', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('7938e287-d7cf-4b8a-8176-4803918298d1', 'Turma Sol Nascente I - Futsal Tarde', 'dfed7e80-c260-4b0d-8329-e68c834ed4de', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('c441f6fe-b27b-4e7e-8e77-53e58eddc737', 'Turma Vila Agrotins - Futebol Manhã', '39e96034-efcc-46a4-b66b-2a60d27c5293', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('166f7be2-a89d-4570-af57-82fe05a75823', 'Turma Vila Agrotins - Futsal Tarde', '39e96034-efcc-46a4-b66b-2a60d27c5293', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('798cc3d4-c5e6-49b5-84b9-9e3e432b6186', 'Turma Quadra Esportiva Praça 208 Sul - Futebol Manhã', '407360e1-f4d1-4a4a-90b8-2f579353e124', '33e14055-b429-45d6-93cf-36b91f61497d', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true),
('b9edcd0b-1422-4e13-893f-aafa2738d699', 'Turma Quadra Esportiva Praça 208 Sul - Futsal Tarde', '407360e1-f4d1-4a4a-90b8-2f579353e124', '30ae8423-ac9f-4884-ad20-0d770d047ca6', 30, false, '2026-08-01', '2027-07-31', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00', NULL, 'aprovada', 6, 17, true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.beneficiarios
-- ------------------------------------------------------------
INSERT INTO public.beneficiarios (id, matricula, nome_completo, nome_social, data_nascimento, sexo, data_cadastro, pcd, tipo_pcd, nucleo_id, status, tipo_matricula, celular, cep, logradouro, numero, bairro, cidade, estado, cpf, foto_url, nome_responsavel, celular_responsavel, cpf_responsavel, created_at, updated_at, deleted_at, raca, comorbidades, nivel_escolaridade, ocupacao_atual, situacao_moradia, beneficio_socioassistencial, telefone_residencial, pessoas_em_casa, razoes_inscricao, observacoes, complemento, rg, orgao_expedidor, uf_expedidor, nome_pai, nome_mae, numero_nis, mora_com, tamanho_uniforme, uniforme_entregue, email, email_responsavel, rg_responsavel, rede_ensino, nome_escola, turno_escolar, segmento_escolar, serie, turma_escolar, codigo_atleta, origem) VALUES
('a828c53e-af30-4011-b9aa-df49239fffac', '732155', 'Pedro Pereira', 'Pedro Pereira', '1986-07-12', 'M', '2026-08-07', false, NULL, NULL, 'pendente', 'interna', '(21) 98765-4321', '26325-030', 'Rua Antônio Sobreira Sobrinho', '230', 'Queimados', 'Queimados', 'RJ', '122.551.757-54', NULL, NULL, NULL, NULL, '2026-08-07T18:01:09.436788+00:00', '2026-08-07T18:01:09.436788+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'interna'),
('ae56500e-96b8-4205-8c28-c7ce9006a3e2', '377827', 'Isabella Alves Gomes', '', '2012-05-19', 'N', '2026-08-10', false, NULL, NULL, 'ativo', 'online', '(63) 99292-0437', '77001-000', 'Quadra 104 Sul', '71', 'Plano Diretor Sul', 'Palmas', 'TO', '563.067.570-23', NULL, NULL, NULL, NULL, '2026-08-10T19:45:34.078281+00:00', '2026-08-10T19:45:34.078281+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'interna'),
('9d34ed29-0aa1-47fc-80a6-3c62d2bc5fe5', '341304', 'Enzo Silva Silva', '', '2014-02-13', 'N', '2026-08-11', false, NULL, NULL, 'ativo', 'online', '(63) 99732-0466', '77001-000', 'Quadra 104 Sul', '68', 'Plano Diretor Sul', 'Palmas', 'TO', '116.688.817-72', NULL, NULL, NULL, NULL, '2026-08-11T00:59:52.597903+00:00', '2026-08-11T00:59:52.597903+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'interna'),
('5798b249-9ae7-42df-bc31-7520ff2972a8', '335766', 'Gabriel ', 'Ferreira Ferreira', '2011-06-09', 'M', '2026-08-10', false, NULL, '23efd617-da43-4e3c-944e-ad09e2790c2b', 'ativo', 'online', '(63) 99551-1820', '77001-000', 'Quadra 104 Sul', '49', 'Plano Diretor Sul', 'Palmas', 'TO', '615.114.005-28', NULL, NULL, NULL, NULL, '2026-08-10T19:32:56.122893+00:00', '2026-08-10T19:32:56.122893+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'interna'),
('27ca393b-78f0-4ebe-baae-bfeddea59479', '756024', 'Yasmin de Oliveira', NULL, '2012-09-12', 'F', '2026-08-14', false, NULL, NULL, 'pendente', 'online', '21973546336', '22775170', 'Rua Queiros Júnior', '201', 'Barra Olímpica', 'Rio de Janeiro', 'RJ', '19121859701', NULL, NULL, NULL, NULL, '2026-08-14T12:28:06.750573+00:00', '2026-08-14T12:28:06.750573+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'interna')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.turma_horarios
-- ------------------------------------------------------------
INSERT INTO public.turma_horarios (id, dia_semana, hora_inicio, hora_fim, turma_id, created_at, updated_at) VALUES
('b4b9d046-8f9c-4500-a56e-007a7aa101df', 2, '16:00:00', '20:00:00', 'b6dcee5c-bad9-4d3c-93ec-d80077e00346', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('c737250e-7f57-402b-9f98-670ae3a88dce', 3, '16:00:00', '20:00:00', 'b6dcee5c-bad9-4d3c-93ec-d80077e00346', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('a642def8-ca00-486b-b4de-a4e844094754', 4, '16:00:00', '20:00:00', 'b6dcee5c-bad9-4d3c-93ec-d80077e00346', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('b18e837f-c0d9-4f96-8a62-1910dcf4761a', 5, '16:00:00', '20:00:00', 'b6dcee5c-bad9-4d3c-93ec-d80077e00346', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('bf979e13-9212-471b-bf74-3f294d6ab1d2', 2, '07:00:00', '10:00:00', '551297b9-fe88-4bca-82d4-f2d4760c3dde', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('54ae00ed-e8ce-4a26-ad11-8304e1fb5b88', 6, '07:30:00', '11:00:00', '551297b9-fe88-4bca-82d4-f2d4760c3dde', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('23227475-ae5b-47ec-ad31-17dd0b6844e5', 4, '07:00:00', '10:00:00', '551297b9-fe88-4bca-82d4-f2d4760c3dde', '2026-08-13T01:38:11.788359+00:00', '2026-08-13T01:38:11.788359+00:00'),
('428f583d-1936-41d1-8537-33d14b6bb475', 4, '15:00:00', '18:00:00', '8c0fb1de-74f2-4968-83b3-05bf5a887661', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('acbf9d52-d830-4cf4-bb00-45d5aee1decb', 6, '07:00:00', '11:00:00', '9eeb5ff2-a7f7-47ed-a5e7-072fbd90b0c6', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('3b0c2b1d-493d-47a7-a8f0-e14da01a7e4f', 1, '16:00:00', '20:00:00', '562e1489-d75c-476d-8fc1-033da31b3d83', '2026-08-13T01:38:11.788359+00:00', '2026-08-13T01:38:11.788359+00:00'),
('afe119b8-1cfc-4c47-bd32-d8f6bedf8454', 3, '16:00:00', '20:00:00', '562e1489-d75c-476d-8fc1-033da31b3d83', '2026-08-13T01:38:11.788359+00:00', '2026-08-13T01:38:11.788359+00:00'),
('8526ad9c-6375-4c66-90fe-0b0aa278e961', 5, '16:00:00', '20:00:00', '562e1489-d75c-476d-8fc1-033da31b3d83', '2026-08-13T01:38:11.788359+00:00', '2026-08-13T01:38:11.788359+00:00'),
('9a6e255a-54f9-44c2-a065-5a042133b50d', 6, '08:00:00', '12:00:00', '187f314d-1c4e-498e-aac6-b899d46dc27a', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('9de89ce6-7e3d-424c-b9a4-5d3688e61b75', 1, '16:00:00', '20:00:00', 'b630b889-ecc2-460a-8972-52154ac11421', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('0a12dcf1-5e5b-47ce-891b-16c8ea11b64a', 3, '16:00:00', '20:00:00', 'b630b889-ecc2-460a-8972-52154ac11421', '2026-08-13T01:38:11.788359+00:00', '2026-08-13T01:38:11.788359+00:00'),
('1f9e6f5e-3efc-4d7b-9940-c9c25ab1dda7', 6, '07:00:00', '11:00:00', '3d20dd80-68c8-4719-b5ef-98fae74f6631', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('dc6c8fad-8a79-49e4-8b3a-0a0ef1e82196', 4, '15:30:00', '19:30:00', '9807b472-83a6-406b-82e8-3b415fa704f3', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('7d1e09ae-ea67-4c8e-bb9b-ebec87ca7edc', 5, '15:30:00', '19:30:00', '9807b472-83a6-406b-82e8-3b415fa704f3', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('e4a73107-0068-47a2-b6cb-2a4163bc9a21', 6, '14:00:00', '18:00:00', '9807b472-83a6-406b-82e8-3b415fa704f3', '2026-08-13T01:38:11.788359+00:00', '2026-08-13T01:38:11.788359+00:00'),
('a3f98d23-99ad-48de-a461-3ae29eaf7ce0', 5, '13:00:00', '15:40:00', '7938e287-d7cf-4b8a-8176-4803918298d1', '2026-08-13T01:38:11.788359+00:00', '2026-08-13T01:38:11.788359+00:00'),
('fe1b8cce-3780-4210-9c6f-9c8569c98af2', 1, '16:00:00', '20:00:00', '739ef59f-819a-4a04-81d9-21e09b6a0aa7', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('26e9fff2-9d4a-4777-9831-d31c02aabc3c', 2, '16:00:00', '20:00:00', '739ef59f-819a-4a04-81d9-21e09b6a0aa7', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('a5882a41-17ff-4f2c-a6cb-07957f94c09b', 3, '17:00:00', '21:00:00', '739ef59f-819a-4a04-81d9-21e09b6a0aa7', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('a98ff4eb-e26f-4b19-8f1f-3c69b1167b4d', 4, '16:00:00', '20:00:00', '739ef59f-819a-4a04-81d9-21e09b6a0aa7', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('6ea84955-0a96-4fcc-9e47-9d948840a839', 1, '08:00:00', '12:00:00', '397830c5-e4e6-4d0e-b29a-8865ab622ccf', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('fa2b9aa2-b1af-431b-894c-b4b3d96b51ee', 3, '08:00:00', '12:00:00', '397830c5-e4e6-4d0e-b29a-8865ab622ccf', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('060ed2c1-948f-4fdd-97fd-19191212656a', 5, '08:00:00', '12:00:00', '397830c5-e4e6-4d0e-b29a-8865ab622ccf', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('95a3a3de-2d60-49f0-8801-28307527fd03', 6, '08:00:00', '12:00:00', '397830c5-e4e6-4d0e-b29a-8865ab622ccf', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('5899c472-3533-4798-be55-0a4170409288', 6, '07:00:00', '11:00:00', 'b1aaf4c0-2027-4df8-84ff-935ffb2f4f49', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('19e309e5-06d3-40b6-bb5d-baae20734468', 2, '17:00:00', '20:00:00', 'c1ab00d4-fbe4-484c-820f-a21c9a80088b', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('978c5e7e-f03e-4da7-85cd-5239347336b8', 3, '17:00:00', '20:00:00', 'c1ab00d4-fbe4-484c-820f-a21c9a80088b', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('21dc856e-834c-493b-9b17-e8a78d0b01a1', 4, '17:00:00', '20:00:00', 'c1ab00d4-fbe4-484c-820f-a21c9a80088b', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('79e730a8-0981-4a23-a27b-78959dc12848', 5, '17:00:00', '20:00:00', 'c1ab00d4-fbe4-484c-820f-a21c9a80088b', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('52b97ac4-8290-4074-9431-967a4d78470d', 2, '08:00:00', '11:00:00', '69ac5e39-4f90-44bc-9852-c9b49eca4d13', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('9987f521-4086-4a0b-8845-3ff346a1a8cd', 4, '08:00:00', '11:00:00', '69ac5e39-4f90-44bc-9852-c9b49eca4d13', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('644319c0-cd50-4756-ba1d-9e28df0a49ec', 5, '08:00:00', '11:00:00', '69ac5e39-4f90-44bc-9852-c9b49eca4d13', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('53e2f7b6-9aa8-4ee5-8336-2635db32adbe', 2, '16:00:00', '19:00:00', '2daae7b9-f2c7-42e0-96cd-8464e4359962', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('c0708824-814f-45be-8b5b-d8229ca84c8e', 4, '16:00:00', '19:00:00', '2daae7b9-f2c7-42e0-96cd-8464e4359962', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('90c0be99-febe-4c81-a54c-0a700363b4e3', 5, '16:00:00', '19:00:00', '2daae7b9-f2c7-42e0-96cd-8464e4359962', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('4464716a-b740-4dce-a838-d4b421df1da7', 1, '08:00:00', '11:00:00', 'f98b6e75-2a1f-47ae-8979-6e2f8fb344b4', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('1c11c47f-8331-4ea2-b878-8ffac163e3d9', 2, '08:00:00', '11:00:00', 'f98b6e75-2a1f-47ae-8979-6e2f8fb344b4', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('cffdd2e4-9037-4550-891d-93afae5daf58', 3, '08:00:00', '11:00:00', 'f98b6e75-2a1f-47ae-8979-6e2f8fb344b4', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('2c69972b-fc82-4bba-ae67-d1ac79b17c7d', 4, '08:00:00', '11:00:00', 'f98b6e75-2a1f-47ae-8979-6e2f8fb344b4', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('ed33c55a-98a5-4693-b5ed-e92831833c5e', 5, '08:00:00', '11:00:00', 'f98b6e75-2a1f-47ae-8979-6e2f8fb344b4', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('df074645-2bca-4a45-84a5-499c472e9f46', 2, '07:00:00', '10:00:00', '798cc3d4-c5e6-49b5-84b9-9e3e432b6186', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('138b1f1d-b710-4baf-afda-312b8ac31021', 4, '07:00:00', '10:00:00', '798cc3d4-c5e6-49b5-84b9-9e3e432b6186', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('b0c9e67f-4f24-49fb-a52c-4e37626ed6c8', 6, '07:00:00', '11:00:00', '798cc3d4-c5e6-49b5-84b9-9e3e432b6186', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('aeb6e8a1-24a5-489c-a1db-adce1bdfab7e', 2, '17:00:00', '20:00:00', 'b9edcd0b-1422-4e13-893f-aafa2738d699', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('36608491-d056-4d48-b18f-72ab2016355a', 4, '17:00:00', '20:00:00', 'b9edcd0b-1422-4e13-893f-aafa2738d699', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('6225cabd-9f69-4f7e-bbb7-4f8db5ee6d15', 1, '07:00:00', '12:00:00', 'f0751631-1e14-4bdd-bdd9-0a5a83f39a93', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('a87bec5c-1638-4054-b884-24eeac785aa3', 3, '07:00:00', '12:00:00', 'f0751631-1e14-4bdd-bdd9-0a5a83f39a93', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('97862ff2-3e19-4c3d-bf54-c5e0fc8c0027', 2, '14:00:00', '18:00:00', '0afe76e4-485c-4e0e-93fe-87328c11e932', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('8aad0934-8a66-446d-b264-d877c0e34e92', 4, '14:00:00', '18:00:00', '0afe76e4-485c-4e0e-93fe-87328c11e932', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('7b7cb15f-4a1a-4bae-9a61-eb615d5d554a', 6, '07:00:00', '11:00:00', '24c6609a-6ab5-4768-918c-480c4f5a0bdc', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('2147b8f2-9691-4308-92de-c3b8b9315092', 1, '16:00:00', '20:00:00', '15e11d1c-6103-417d-8b04-983ff3fe3e46', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('c30dd6ae-a0e6-49a2-9144-3e8994e6eb02', 2, '16:00:00', '20:00:00', '15e11d1c-6103-417d-8b04-983ff3fe3e46', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('8613b7b2-f96b-4e1f-838a-fa9fedfdac2c', 4, '16:00:00', '20:00:00', '15e11d1c-6103-417d-8b04-983ff3fe3e46', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('e9fed9a6-22d4-4b62-afe9-c5ccdf89180a', 1, '07:00:00', '11:00:00', 'b93f91a2-ddba-4eed-bbab-a57cf502d525', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('047bffee-f2c9-47ca-a532-7cb5e35a954a', 3, '07:00:00', '11:00:00', 'b93f91a2-ddba-4eed-bbab-a57cf502d525', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('1c7f38c1-e417-4ee8-9beb-2450629025d6', 5, '07:00:00', '11:00:00', 'b93f91a2-ddba-4eed-bbab-a57cf502d525', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('51587a4c-ac3c-48fc-ab72-a860224cf76d', 6, '07:00:00', '11:00:00', 'b93f91a2-ddba-4eed-bbab-a57cf502d525', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('714a0db8-e5eb-4e61-8312-253c72cec74b', 5, '07:30:00', '10:50:00', '5d5dda54-9904-4619-92c9-c1c093bb2ec3', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('02d4ef73-4412-4e45-89e0-6ca39f75f561', 6, '07:30:00', '10:50:00', '5d5dda54-9904-4619-92c9-c1c093bb2ec3', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('f3cc19f3-b7b6-4c92-bce1-285c9ef91c19', 5, '16:00:00', '19:20:00', '7938e287-d7cf-4b8a-8176-4803918298d1', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('36278a4e-dac9-468c-9649-fc5091e766ef', 6, '16:00:00', '19:20:00', '7938e287-d7cf-4b8a-8176-4803918298d1', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('1d117303-393a-4be5-b578-fe724a443360', 1, '08:00:00', '10:00:00', '187f314d-1c4e-498e-aac6-b899d46dc27a', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('bcc4d7ff-282b-491b-a6e6-4895d015a46f', 3, '08:00:00', '10:00:00', '187f314d-1c4e-498e-aac6-b899d46dc27a', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('293faec2-3db5-4b09-94a2-c7d5ecacf30c', 1, '08:00:00', '09:00:00', 'c441f6fe-b27b-4e7e-8e77-53e58eddc737', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('08615408-6437-4ff7-a1cb-f7d699e6d815', 4, '08:00:00', '09:00:00', 'c441f6fe-b27b-4e7e-8e77-53e58eddc737', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('2c0bcab4-1852-49c8-89b7-670419aa49ad', 6, '07:30:00', '08:30:00', 'c441f6fe-b27b-4e7e-8e77-53e58eddc737', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('4fcc54da-68a9-42cd-bc5e-f2629abb3f1c', 1, '16:00:00', '17:00:00', '166f7be2-a89d-4570-af57-82fe05a75823', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('cbde86f2-18af-461a-a53c-844daf7a270f', 4, '15:30:00', '16:30:00', '166f7be2-a89d-4570-af57-82fe05a75823', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('94dd29de-2990-4f44-ab2c-7981321b2dff', 6, '15:30:00', '16:30:00', '166f7be2-a89d-4570-af57-82fe05a75823', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('70ce5147-65df-4dec-961b-25dbde0d1c48', 1, '08:00:00', '10:00:00', '21242d32-1045-437f-a810-0c45d16d6803', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('32a2ac7a-4764-4ad4-9000-3bed6d1e3e50', 3, '08:00:00', '10:00:00', '21242d32-1045-437f-a810-0c45d16d6803', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('d3d6b4f6-5efd-4935-9b39-4cbfd85ab1f5', 5, '08:00:00', '10:00:00', '21242d32-1045-437f-a810-0c45d16d6803', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('2ed6a43f-3c6a-467f-9e67-aa3e6825ded4', 1, '14:00:00', '16:00:00', '4719acc2-8189-463a-8fcf-9db4f169301d', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('b5fbc6d6-7892-4e66-b8ee-79997903062f', 3, '14:00:00', '16:00:00', '4719acc2-8189-463a-8fcf-9db4f169301d', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('f0cefea7-5acb-4752-bfb4-a67aa85c14df', 5, '14:00:00', '16:00:00', '4719acc2-8189-463a-8fcf-9db4f169301d', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('853b054d-0f3a-4090-afa1-453ca7014f8d', 1, '08:00:00', '10:00:00', 'c2688487-1789-4a4d-878a-9bb8364cf03f', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('f764170f-078c-4cb5-902e-f44596f9b0ff', 3, '08:00:00', '10:00:00', 'c2688487-1789-4a4d-878a-9bb8364cf03f', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('3b70fce4-0a09-4326-89d6-debec64c79c5', 5, '08:00:00', '10:00:00', 'c2688487-1789-4a4d-878a-9bb8364cf03f', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('3ca9cf4c-6ad6-4d32-a2c3-7c8301aac828', 1, '14:00:00', '16:00:00', 'be442e23-019d-466b-825d-84fbcae2fbdd', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('cd3c480f-06f8-4951-ab29-6d710d1ccdc5', 3, '14:00:00', '16:00:00', 'be442e23-019d-466b-825d-84fbcae2fbdd', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('da234299-0cb8-423f-a671-3123bce5f298', 5, '14:00:00', '16:00:00', 'be442e23-019d-466b-825d-84fbcae2fbdd', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('5caf93cd-ebed-4b0a-950b-fd38d26f0daf', 1, '08:00:00', '10:00:00', 'a3eb5eb4-8b6c-4c05-bc8b-e84ba1843970', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('7d6f27ea-31ce-4ee6-9692-e7bc9764f1a9', 3, '08:00:00', '10:00:00', 'a3eb5eb4-8b6c-4c05-bc8b-e84ba1843970', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('5ad4fb7a-ebba-4208-956e-4162449dd082', 5, '08:00:00', '10:00:00', 'a3eb5eb4-8b6c-4c05-bc8b-e84ba1843970', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('db4b2ca0-d226-4b70-a125-634fe1b3e234', 1, '14:00:00', '16:00:00', 'df0ee313-e724-4b7d-8ff3-8aa07db53b3a', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('b4a07820-562e-4e3a-8ec1-e3680fa5a794', 3, '14:00:00', '16:00:00', 'df0ee313-e724-4b7d-8ff3-8aa07db53b3a', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('806b2594-53db-45fe-a4bb-ae1bd7b52177', 5, '14:00:00', '16:00:00', 'df0ee313-e724-4b7d-8ff3-8aa07db53b3a', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('041847da-f54e-4727-8def-6be401eca931', 1, '08:00:00', '10:00:00', '85b73eb9-38a3-43dc-badc-26f161beabfc', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('b990992a-cad4-4684-a108-ac0654fa6293', 3, '08:00:00', '10:00:00', '85b73eb9-38a3-43dc-badc-26f161beabfc', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('922a318a-b1d7-4400-9131-0171259ab353', 5, '08:00:00', '10:00:00', '85b73eb9-38a3-43dc-badc-26f161beabfc', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('43ca8f90-6e36-4c08-99de-31b77968e763', 1, '14:00:00', '16:00:00', '00a3ebbd-e11d-4497-9ebe-0ddf6d281cbf', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('8095eb3c-ecce-4a5e-b66f-9ce238eed415', 3, '14:00:00', '16:00:00', '00a3ebbd-e11d-4497-9ebe-0ddf6d281cbf', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00'),
('9e1d9d75-1c8b-4537-ac35-5efc8be0c955', 5, '14:00:00', '16:00:00', '00a3ebbd-e11d-4497-9ebe-0ddf6d281cbf', '2026-08-12T13:51:22.577242+00:00', '2026-08-12T13:51:22.577242+00:00')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.nucleo_atividades
-- ------------------------------------------------------------
INSERT INTO public.nucleo_atividades (id, nucleo_id, atividade_id, created_at, updated_at) VALUES
('b3036e6e-ff31-419b-b6fb-f6cf01844b2f', 'bc9c92d2-e5aa-4be0-9d8e-3f34a489817e', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('3ba499a0-6c92-491c-b844-46c59c5d2c80', 'bc9c92d2-e5aa-4be0-9d8e-3f34a489817e', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('81bfe446-24d1-41f2-95f2-4e082f42a59a', '93ffef82-7f1f-4c44-a84f-6d1f8e97c07d', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('dfdf8f01-1b94-4d80-bc4f-cfc2730ca789', '93ffef82-7f1f-4c44-a84f-6d1f8e97c07d', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('fe3605a9-e3ba-4475-ae90-c651f6dbdc81', '71131091-b7a8-4995-ad77-b4637011975d', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('8ae25aa8-f5e6-42ba-aa25-45524fe06020', '71131091-b7a8-4995-ad77-b4637011975d', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('d5d0f6e5-4f51-409a-b4ba-115f5c3fb1a0', '3c1c5b0c-cbf7-40e6-bb06-0ff39ca0a6f2', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('81b7a700-1c39-44cb-bc51-420ca735e5d3', '3c1c5b0c-cbf7-40e6-bb06-0ff39ca0a6f2', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('707d7260-2ffc-4dbe-a23f-561b369cf879', '636a8f12-8eaf-4d79-99d2-a505a8ec9d2b', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('95e26a7e-c852-4752-9b2f-6c1d0541d408', '636a8f12-8eaf-4d79-99d2-a505a8ec9d2b', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('cbda7b23-1d07-424f-a7b3-219ec2fe654e', 'ef41c13f-abf7-43d1-8882-1a826ff6311d', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('ae0df09c-a111-4091-a1ca-52c6f1c4df97', 'ef41c13f-abf7-43d1-8882-1a826ff6311d', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('595db1fa-ffef-4e31-897b-945ec9ba3aa0', '407360e1-f4d1-4a4a-90b8-2f579353e124', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('0bb8ee80-4fc7-4569-b541-152e37920364', '407360e1-f4d1-4a4a-90b8-2f579353e124', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('fe0ff1f1-c91d-44a3-ad6c-8feea7bfb3cb', '4b2cbfc8-fd3a-41da-a159-6121121f100f', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('20e9fe5b-6f81-4475-bce1-d7d8e6a25697', '4b2cbfc8-fd3a-41da-a159-6121121f100f', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('cb2ecbb3-be43-4e35-ae53-15779c13d712', '9702bfa5-3194-43cb-8b1c-cb47598d64de', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('2f447cf0-a928-48b0-a681-ae764724a4d6', '9702bfa5-3194-43cb-8b1c-cb47598d64de', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('f8fcf05a-8b9f-42ee-9af2-4a00afebca95', '571bc2ad-1cde-435d-b69f-226111e6644e', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('23f81016-d348-43d2-8f52-5a2119d67dc5', '571bc2ad-1cde-435d-b69f-226111e6644e', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('476722d7-fc00-47b8-b80a-9d9359e9c8bc', 'c6eb015d-de1c-44c7-af33-3ed4d08be7e0', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('b663bfe5-bb35-43be-ba89-537449557ec4', 'c6eb015d-de1c-44c7-af33-3ed4d08be7e0', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('5a3c6c97-6a17-48f8-8bb2-3f1fef066f12', 'eaa7dfd2-e5c6-4691-9471-a03eca53011e', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('453b34db-1ff4-4fc6-b8f4-6a84cbb965e6', 'eaa7dfd2-e5c6-4691-9471-a03eca53011e', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('30cb4440-27ef-4171-872f-5370fa6c757c', '23efd617-da43-4e3c-944e-ad09e2790c2b', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('fc256a4d-965a-4712-8869-2fb07d11129b', '23efd617-da43-4e3c-944e-ad09e2790c2b', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('9c05e194-e3c3-4d43-9dd1-e6fb368c8577', 'f30e0b29-e128-4989-ae53-1c9c7f068f4d', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('6bdf82cf-527e-49b8-a720-33e14ff28236', 'f30e0b29-e128-4989-ae53-1c9c7f068f4d', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('20e0ffad-9d8d-4a11-85db-8f8319fbb1fc', 'dfed7e80-c260-4b0d-8329-e68c834ed4de', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('d5069fa8-1f65-4f40-9bb6-ec4a5d7c30aa', 'dfed7e80-c260-4b0d-8329-e68c834ed4de', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('94b92b60-aa25-455b-8fb6-d7e1bc3a8e9d', 'e5305f61-fa4e-4377-9b86-62a7ebceb78e', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('fa169f4b-01e4-44bf-881c-d7ceae1eb64e', 'e5305f61-fa4e-4377-9b86-62a7ebceb78e', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('913a8244-a15d-4f1d-93ff-d9fa19b0689b', 'f4e42426-4b60-40bf-a060-f659ece0cb57', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('8cf47bfb-fe72-469b-90f7-512cb59ff04e', 'f4e42426-4b60-40bf-a060-f659ece0cb57', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('5c50ffc1-d41a-4712-afc3-5858af58a1ee', 'f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('c3aa5a1b-5301-4ec1-91a1-f3b14e86aa78', 'f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('20e3a6a1-a675-4fc1-a9f3-e5e79603f0b2', '959772b0-1603-4d52-aa49-433b57999b4f', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('81b66ab7-ec16-43b9-8c9e-5e365cb9c025', '959772b0-1603-4d52-aa49-433b57999b4f', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('8c445ca1-eb12-4043-85bb-65d36c2ef50f', '39e96034-efcc-46a4-b66b-2a60d27c5293', '33e14055-b429-45d6-93cf-36b91f61497d', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00'),
('5ffbc92e-336c-4861-ba04-5fca58f5cb58', '39e96034-efcc-46a4-b66b-2a60d27c5293', '30ae8423-ac9f-4884-ad20-0d770d047ca6', '2026-08-07T03:32:00.006208+00:00', '2026-08-07T03:32:00.006208+00:00')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.turma_responsaveis
-- ------------------------------------------------------------
INSERT INTO public.turma_responsaveis (id, turma_id, funcionario_id, created_at, updated_at) VALUES
('b1928374-1234-4567-8901-000000000001', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000002', 'b6dcee5c-bad9-4d3c-93ec-d80077e00346', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000003', 'f0751631-1e14-4bdd-bdd9-0a5a83f39a93', '264e3e0e-c5c3-4ef5-b4ba-1c740c3346fe', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000004', '0afe76e4-485c-4e0e-93fe-87328c11e932', '264e3e0e-c5c3-4ef5-b4ba-1c740c3346fe', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000005', '9eeb5ff2-a7f7-47ed-a5e7-072fbd90b0c6', '8119b4ac-0941-46bb-9bac-fa97ac78d6c6', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000006', '562e1489-d75c-476d-8fc1-033da31b3d83', '8119b4ac-0941-46bb-9bac-fa97ac78d6c6', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000007', '187f314d-1c4e-498e-aac6-b899d46dc27a', 'aff66bbf-3bf5-4319-be4c-e61810cb33ef', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000008', 'b630b889-ecc2-460a-8972-52154ac11421', 'aff66bbf-3bf5-4319-be4c-e61810cb33ef', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000009', '21242d32-1045-437f-a810-0c45d16d6803', '46f3ac6d-8bf9-4d55-8f3b-55ffd3b4421d', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000010', '4719acc2-8189-463a-8fcf-9db4f169301d', '46f3ac6d-8bf9-4d55-8f3b-55ffd3b4421d', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000011', '85b73eb9-38a3-43dc-badc-26f161beabfc', '75b59a1c-139d-4101-9d9d-dd8c1b808a57', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000012', '00a3ebbd-e11d-4497-9ebe-0ddf6d281cbf', '75b59a1c-139d-4101-9d9d-dd8c1b808a57', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000013', 'b1aaf4c0-2027-4df8-84ff-935ffb2f4f49', '584196f0-48a8-42ac-bd34-a09ab6dea7f4', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000014', 'c1ab00d4-fbe4-484c-820f-a21c9a80088b', '584196f0-48a8-42ac-bd34-a09ab6dea7f4', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000015', 'c2688487-1789-4a4d-878a-9bb8364cf03f', '68492dfa-a951-4db6-a491-d19a37275195', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000016', 'be442e23-019d-466b-825d-84fbcae2fbdd', '68492dfa-a951-4db6-a491-d19a37275195', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000017', 'a3eb5eb4-8b6c-4c05-bc8b-e84ba1843970', '840d67b9-3132-4c73-b001-a56344bf5dd7', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000018', 'df0ee313-e724-4b7d-8ff3-8aa07db53b3a', '840d67b9-3132-4c73-b001-a56344bf5dd7', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000019', '551297b9-fe88-4bca-82d4-f2d4760c3dde', '8e1c2da1-3695-4b99-a109-9717dc75f9c4', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000020', '8c0fb1de-74f2-4968-83b3-05bf5a887661', '8e1c2da1-3695-4b99-a109-9717dc75f9c4', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000021', 'b93f91a2-ddba-4eed-bbab-a57cf502d525', '32f6aaa2-47a8-46dd-b561-6534027fa961', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000022', 'a28a5def-9e9e-4f4b-a120-0151901fa22d', '32f6aaa2-47a8-46dd-b561-6534027fa961', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000023', '3d20dd80-68c8-4719-b5ef-98fae74f6631', 'a911f561-97f8-4798-9717-65f6f338b17f', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000024', '9807b472-83a6-406b-82e8-3b415fa704f3', 'a911f561-97f8-4798-9717-65f6f338b17f', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000025', 'dc66f637-989b-4c79-8ea2-711aafebd7de', '14f526be-3b4f-44ff-823d-82db4897ff13', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000026', '739ef59f-819a-4a04-81d9-21e09b6a0aa7', '14f526be-3b4f-44ff-823d-82db4897ff13', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000027', '24c6609a-6ab5-4768-918c-480c4f5a0bdc', '26064a2e-b582-4b85-8e2a-460b85dff86c', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000028', '15e11d1c-6103-417d-8b04-983ff3fe3e46', '26064a2e-b582-4b85-8e2a-460b85dff86c', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000029', '69ac5e39-4f90-44bc-9852-c9b49eca4d13', 'e804ac5e-890f-4bd8-88f6-392508a78427', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000030', '2daae7b9-f2c7-42e0-96cd-8464e4359962', 'e804ac5e-890f-4bd8-88f6-392508a78427', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000031', '397830c5-e4e6-4d0e-b29a-8865ab622ccf', '25d65151-e046-4288-b6ad-4bd623e441eb', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000032', 'f38984e1-c2e5-4531-94ba-943a063c24f5', '25d65151-e046-4288-b6ad-4bd623e441eb', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000033', 'f98b6e75-2a1f-47ae-8979-6e2f8fb344b4', 'a1419d7a-2668-4c1f-b90d-6ddb0455195d', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000034', 'c4bb7733-9fcf-4c13-8b00-33dd7f3ab2a8', 'a1419d7a-2668-4c1f-b90d-6ddb0455195d', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000035', '5d5dda54-9904-4619-92c9-c1c093bb2ec3', '326a528c-23ae-49b0-a725-fd5533ae17de', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000036', '7938e287-d7cf-4b8a-8176-4803918298d1', '326a528c-23ae-49b0-a725-fd5533ae17de', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000037', 'c441f6fe-b27b-4e7e-8e77-53e58eddc737', '8faff896-1642-4902-835f-614115d2df70', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000038', '166f7be2-a89d-4570-af57-82fe05a75823', '8faff896-1642-4902-835f-614115d2df70', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000039', '798cc3d4-c5e6-49b5-84b9-9e3e432b6186', '63a1db78-94c4-4c2e-892f-ed7997806cce', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00'),
('b1928374-1234-4567-8901-000000000040', 'b9edcd0b-1422-4e13-893f-aafa2738d699', '63a1db78-94c4-4c2e-892f-ed7997806cce', '2026-08-10T15:05:40.483657+00:00', '2026-08-10T15:05:40.483657+00:00')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.beneficiario_turmas
-- ------------------------------------------------------------
INSERT INTO public.beneficiario_turmas (id, beneficiario_id, turma_id, status, data_matricula, created_at, updated_at, deleted_at, data_desvinculo, motivo_desvinculo) VALUES
('b2713f64-44bf-47ae-b39b-e85d8525b6c2', 'ae56500e-96b8-4205-8c28-c7ce9006a3e2', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', 'ativa', '2026-08-10', '2026-08-10T19:45:34.120761+00:00', '2026-08-10T19:45:34.120761+00:00', NULL, NULL, NULL),
('bc4f7808-1ec8-45be-bb83-eb922bc3fc0b', '9d34ed29-0aa1-47fc-80a6-3c62d2bc5fe5', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', 'ativa', '2026-08-11', '2026-08-11T00:59:52.628867+00:00', '2026-08-11T00:59:52.628867+00:00', NULL, NULL, NULL),
('c75d691d-4001-4475-b65f-f3cf1ae98845', '5798b249-9ae7-42df-bc31-7520ff2972a8', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', 'ativa', '2026-08-10', '2026-08-10T19:32:56.168595+00:00', '2026-08-10T19:32:56.168595+00:00', NULL, NULL, NULL),
('c61726a4-6889-4b67-ba5d-e0b5efd37aa7', 'a828c53e-af30-4011-b9aa-df49239fffac', '128ae477-30c1-4b7a-a3c7-644ab8d67123', 'desistente', '2026-08-07', '2026-08-07T18:01:09.479579+00:00', '2026-08-07T18:01:09.479579+00:00', '2026-08-10T18:24:26.549216+00:00', '2026-08-10', 'Mudança de endereço / transferência'),
('a59e9a4f-56bb-49e0-8260-eb2546e4e082', 'a828c53e-af30-4011-b9aa-df49239fffac', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', 'ativa', '2026-08-10', '2026-08-10T18:24:26.549216+00:00', '2026-08-10T18:24:26.549216+00:00', NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.inscricoes
-- ------------------------------------------------------------
INSERT INTO public.inscricoes (id, beneficiario_id, nucleo_id, turma_id, atividade_id, status, data_inscricao, created_at, updated_at, deleted_at, data_validacao, motivo_rejeicao, dados_formulario, respostas_formulario, tipo_inscricao) VALUES
('3e62f01f-0b44-4860-91a5-e01da1f2d93e', '5798b249-9ae7-42df-bc31-7520ff2972a8', '23efd617-da43-4e3c-944e-ad09e2790c2b', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '33e14055-b429-45d6-93cf-36b91f61497d', 'aprovada', '2026-08-10', '2026-08-10T19:32:56.122893+00:00', '2026-08-10T19:32:56.122893+00:00', NULL, '2026-08-10T19:32:56.122893+00:00', NULL, NULL, '{"cep": "77001-000", "cpf": "615.114.005-28", "pcd": false, "sexo": "M", "email": "test-335766@andorinha.test", "bairro": "Plano Diretor Sul", "cidade": "Palmas", "estado": "TO", "numero": "49", "celular": "(63) 99551-1820", "turma_id": "231fe8f0-e0a7-44a8-b0f1-d751cef46d3f", "nucleo_id": "23efd617-da43-4e3c-944e-ad09e2790c2b", "logradouro": "Quadra 104 Sul", "nome_social": "Ferreira Ferreira", "atividade_id": "33e14055-b429-45d6-93cf-36b91f61497d", "nome_completo": "Gabriel ", "data_nascimento": "2011-06-09"}'::jsonb, 'online'),
('3f23ee6b-4e1b-4171-aa31-e40cf7c3b28b', 'ae56500e-96b8-4205-8c28-c7ce9006a3e2', '23efd617-da43-4e3c-944e-ad09e2790c2b', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '33e14055-b429-45d6-93cf-36b91f61497d', 'aprovada', '2026-08-10', '2026-08-10T19:45:34.078281+00:00', '2026-08-10T19:45:34.078281+00:00', NULL, '2026-08-10T19:45:34.078281+00:00', NULL, NULL, '{"cep": "77001-000", "cpf": "563.067.570-23", "pcd": false, "sexo": "N", "email": "test-377827@andorinha.test", "bairro": "Plano Diretor Sul", "cidade": "Palmas", "estado": "TO", "numero": "71", "celular": "(63) 99292-0437", "turma_id": "231fe8f0-e0a7-44a8-b0f1-d751cef46d3f", "nucleo_id": "23efd617-da43-4e3c-944e-ad09e2790c2b", "logradouro": "Quadra 104 Sul", "nome_social": "", "atividade_id": "33e14055-b429-45d6-93cf-36b91f61497d", "nome_completo": "Isabella Alves Gomes", "data_nascimento": "2012-05-19"}'::jsonb, 'online'),
('e9ce3259-fc26-44ea-ba07-df030dfd7fdf', '9d34ed29-0aa1-47fc-80a6-3c62d2bc5fe5', '23efd617-da43-4e3c-944e-ad09e2790c2b', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '33e14055-b429-45d6-93cf-36b91f61497d', 'aprovada', '2026-08-11', '2026-08-11T00:59:52.597903+00:00', '2026-08-11T00:59:52.597903+00:00', NULL, '2026-08-11T00:59:52.597903+00:00', NULL, NULL, '{"cep": "77001-000", "cpf": "116.688.817-72", "pcd": false, "sexo": "N", "email": "test-341304@andorinha.test", "bairro": "Plano Diretor Sul", "cidade": "Palmas", "estado": "TO", "numero": "68", "celular": "(63) 99732-0466", "turma_id": "231fe8f0-e0a7-44a8-b0f1-d751cef46d3f", "nucleo_id": "23efd617-da43-4e3c-944e-ad09e2790c2b", "logradouro": "Quadra 104 Sul", "nome_social": "", "atividade_id": "33e14055-b429-45d6-93cf-36b91f61497d", "nome_completo": "Enzo Silva Silva", "data_nascimento": "2014-02-13"}'::jsonb, 'online'),
('889cb9be-753d-4c31-97b7-68b082531e21', '27ca393b-78f0-4ebe-baae-bfeddea59479', 'f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', '21242d32-1045-437f-a810-0c45d16d6803', '33e14055-b429-45d6-93cf-36b91f61497d', 'pendente', '2026-08-14', '2026-08-14T12:28:06.750573+00:00', '2026-08-14T12:28:06.750573+00:00', NULL, NULL, NULL, NULL, '{"cep": "22775170", "cpf": "19121859701", "pcd": false, "sexo": "F", "bairro": "Barra Olímpica", "cidade": "Rio de Janeiro", "estado": "RJ", "numero": "201", "celular": "21973546336", "turma_id": "21242d32-1045-437f-a810-0c45d16d6803", "nucleo_id": "f2b744a0-8295-4ac5-8672-5a9f0ff78ecd", "logradouro": "Rua Queiros Júnior", "atividade_id": "33e14055-b429-45d6-93cf-36b91f61497d", "nome_completo": "Yasmin de Oliveira", "data_nascimento": "2012-09-12"}'::jsonb, 'online')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.execucoes_aula
-- ------------------------------------------------------------
INSERT INTO public.execucoes_aula (id, turma_id, professor_id, data_aula, horario_inicio, horario_fim, status, conteudo_ministrado, observacoes, created_at, updated_at, deleted_at, tipo_registro, dia_semana) VALUES
('bcaee517-5e69-42b7-a36c-279298fe2650', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-11', '08:00:00', '09:00:00', 'realizada', 'Treino tático e finalização', 'Aula realizada com sucesso', '2026-08-11T20:20:47.382098+00:00', '2026-08-11T20:20:47.382098+00:00', NULL, 'regular', 2),
('ea771d9d-9d4a-4e89-9a40-4228c2e646aa', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-12', '08:00:00', '09:00:00', 'realizada', 'Fundamentos de passe', 'Ótimo rendimento', '2026-08-12T14:30:00.000000+00:00', '2026-08-12T14:30:00.000000+00:00', NULL, 'regular', 3),
('9bc43890-ffb2-4d2c-88e1-9549cd9dae67', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-13', '08:00:00', '09:00:00', 'realizada', 'Domínio e condução de bola', NULL, '2026-08-13T14:30:00.000000+00:00', '2026-08-13T14:30:00.000000+00:00', NULL, 'regular', 4),
('8ff481b7-251f-47e5-a6e4-4d8ccb8daec1', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-14', '08:00:00', '09:00:00', 'realizada', 'Coletivo e posicionamento', NULL, '2026-08-14T14:30:00.000000+00:00', '2026-08-14T14:30:00.000000+00:00', NULL, 'regular', 5),
('6e04d49a-4ff1-419b-a3d8-11ee8d33d9aa', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-15', '08:00:00', '09:00:00', 'realizada', 'Treino recreativo de sábado', NULL, '2026-08-15T14:30:00.000000+00:00', '2026-08-15T14:30:00.000000+00:00', NULL, 'regular', 6),
('216f44d9-d890-48e2-b13c-83bcaec691ff', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-16', '08:00:00', '09:00:00', 'realizada', 'Treino especial', NULL, '2026-08-16T14:30:00.000000+00:00', '2026-08-16T14:30:00.000000+00:00', NULL, 'regular', 7),
('70bb51ec-a4ee-48ba-94cb-734d8ef516ee', '231fe8f0-e0a7-44a8-b0f1-d751cef46d3f', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-17', '08:00:00', '09:00:00', 'realizada', 'Finalização e cabeceio', NULL, '2026-08-17T14:30:00.000000+00:00', '2026-08-17T14:30:00.000000+00:00', NULL, 'regular', 1),
('a4cbdf56-88ab-41c9-be4d-8ffcb9293144', 'b6dcee5c-bad9-4d3c-93ec-d80077e00346', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '2026-08-17', '16:00:00', '17:00:00', 'realizada', 'Futsal - Marcação sob pressão', NULL, '2026-08-17T17:30:00.000000+00:00', '2026-08-17T17:30:00.000000+00:00', NULL, 'regular', 1)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.beneficiario_presencas
-- ------------------------------------------------------------
INSERT INTO public.beneficiario_presencas (id, execucao_aula_id, beneficiario_id, presente, justificativa, created_at, updated_at) VALUES
('b2713f64-44bf-47ae-b39b-e85d85250001', 'bcaee517-5e69-42b7-a36c-279298fe2650', 'ae56500e-96b8-4205-8c28-c7ce9006a3e2', true, NULL, '2026-08-11T20:20:47.382098+00:00', '2026-08-11T20:20:47.382098+00:00'),
('bc4f7808-1ec8-45be-bb83-eb922bc30002', 'bcaee517-5e69-42b7-a36c-279298fe2650', '9d34ed29-0aa1-47fc-80a6-3c62d2bc5fe5', true, NULL, '2026-08-11T20:20:47.382098+00:00', '2026-08-11T20:20:47.382098+00:00'),
('c75d691d-4001-4475-b65f-f3cf1ae90003', 'bcaee517-5e69-42b7-a36c-279298fe2650', '5798b249-9ae7-42df-bc31-7520ff2972a8', true, NULL, '2026-08-11T20:20:47.382098+00:00', '2026-08-11T20:20:47.382098+00:00'),
('a59e9a4f-56bb-49e0-8260-eb2546e40004', 'bcaee517-5e69-42b7-a36c-279298fe2650', 'a828c53e-af30-4011-b9aa-df49239fffac', true, NULL, '2026-08-11T20:20:47.382098+00:00', '2026-08-11T20:20:47.382098+00:00'),
('b2713f64-44bf-47ae-b39b-e85d85250005', 'ea771d9d-9d4a-4e89-9a40-4228c2e646aa', 'ae56500e-96b8-4205-8c28-c7ce9006a3e2', true, NULL, '2026-08-12T14:30:00.000000+00:00', '2026-08-12T14:30:00.000000+00:00'),
('bc4f7808-1ec8-45be-bb83-eb922bc30006', 'ea771d9d-9d4a-4e89-9a40-4228c2e646aa', '9d34ed29-0aa1-47fc-80a6-3c62d2bc5fe5', true, NULL, '2026-08-12T14:30:00.000000+00:00', '2026-08-12T14:30:00.000000+00:00'),
('c75d691d-4001-4475-b65f-f3cf1ae90007', 'ea771d9d-9d4a-4e89-9a40-4228c2e646aa', '5798b249-9ae7-42df-bc31-7520ff2972a8', false, 'Consulta médica', '2026-08-12T14:30:00.000000+00:00', '2026-08-12T14:30:00.000000+00:00'),
('a59e9a4f-56bb-49e0-8260-eb2546e40008', 'ea771d9d-9d4a-4e89-9a40-4228c2e646aa', 'a828c53e-af30-4011-b9aa-df49239fffac', true, NULL, '2026-08-12T14:30:00.000000+00:00', '2026-08-12T14:30:00.000000+00:00'),
('b2713f64-44bf-47ae-b39b-e85d85250009', '9bc43890-ffb2-4d2c-88e1-9549cd9dae67', 'ae56500e-96b8-4205-8c28-c7ce9006a3e2', true, NULL, '2026-08-13T14:30:00.000000+00:00', '2026-08-13T14:30:00.000000+00:00'),
('bc4f7808-1ec8-45be-bb83-eb922bc30010', '9bc43890-ffb2-4d2c-88e1-9549cd9dae67', '9d34ed29-0aa1-47fc-80a6-3c62d2bc5fe5', true, NULL, '2026-08-13T14:30:00.000000+00:00', '2026-08-13T14:30:00.000000+00:00'),
('c75d691d-4001-4475-b65f-f3cf1ae90011', '8ff481b7-251f-47e5-a6e4-4d8ccb8daec1', '5798b249-9ae7-42df-bc31-7520ff2972a8', true, NULL, '2026-08-14T14:30:00.000000+00:00', '2026-08-14T14:30:00.000000+00:00'),
('a59e9a4f-56bb-49e0-8260-eb2546e40012', '8ff481b7-251f-47e5-a6e4-4d8ccb8daec1', 'a828c53e-af30-4011-b9aa-df49239fffac', true, NULL, '2026-08-14T14:30:00.000000+00:00', '2026-08-14T14:30:00.000000+00:00'),
('b2713f64-44bf-47ae-b39b-e85d85250013', '70bb51ec-a4ee-48ba-94cb-734d8ef516ee', 'ae56500e-96b8-4205-8c28-c7ce9006a3e2', true, NULL, '2026-08-17T14:30:00.000000+00:00', '2026-08-17T14:30:00.000000+00:00'),
('bc4f7808-1ec8-45be-bb83-eb922bc30014', '70bb51ec-a4ee-48ba-94cb-734d8ef516ee', '9d34ed29-0aa1-47fc-80a6-3c62d2bc5fe5', true, NULL, '2026-08-17T14:30:00.000000+00:00', '2026-08-17T14:30:00.000000+00:00')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Tabela: public.registros_ponto
-- ------------------------------------------------------------
INSERT INTO public.registros_ponto (id, funcionario_id, nucleo_id, data, tipo, hora_registro, status, created_at, updated_at, deleted_at, foto_url, latitude, longitude, endereco_detectado, editado, motivo_edicao, aprovado_por, aprovado_em, precisao_gps) VALUES
('b2713f64-44bf-47ae-b39b-e85d85259001', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '23efd617-da43-4e3c-944e-ad09e2790c2b', '2026-08-11', 'entrada', '07:55:00', 'aprovado', '2026-08-11T07:55:00.000000+00:00', '2026-08-11T07:55:00.000000+00:00', NULL, NULL, NULL, NULL, 'Campo T31 - Taquari', false, NULL, 'af6dd3ca-07eb-470c-bc1a-70e389bb0476', '2026-08-11T12:00:00.000000+00:00', NULL),
('b2713f64-44bf-47ae-b39b-e85d85259002', '1d7c6bb8-62df-49a7-b558-99dcf90bcac2', '23efd617-da43-4e3c-944e-ad09e2790c2b', '2026-08-11', 'saida', '12:05:00', 'aprovado', '2026-08-11T12:05:00.000000+00:00', '2026-08-11T12:05:00.000000+00:00', NULL, NULL, NULL, NULL, 'Campo T31 - Taquari', false, NULL, 'af6dd3ca-07eb-470c-bc1a-70e389bb0476', '2026-08-11T12:05:00.000000+00:00', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION 7: TRIGGERS
-- ============================================================

CREATE OR REPLACE TRIGGER trg_sync_usuario_app_metadata
  AFTER INSERT OR UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_usuario_app_metadata();

CREATE OR REPLACE TRIGGER trg_clean_user_tokens
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.clean_user_tokens();

-- ============================================================
-- FIM DO BACKUP
-- ============================================================



