-- Extensões necessárias
create extension if not exists "uuid-ossp" schema extensions;
create extension if not exists pgcrypto schema extensions;
create extension if not exists pg_cron;

-- Enums (equivalentes aos enums TypeORM do backend NestJS original)
create type tipo_duracao_atividade as enum ('pontual', 'periodo');
create type tipo_aprovacao as enum ('automatica', 'manual');
create type tipo_pergunta as enum ('texto', 'sim_nao', 'numero', 'opcoes');
create type status_beneficiario_turma as enum ('ativo', 'evadido', 'transferido');
create type tipo_anexo as enum ('atestado_medico', 'rg', 'cpf', 'comprovante_residencia', 'foto', 'outro');
create type sexo_beneficiario as enum ('M', 'F', 'O', 'N');
create type cargo_funcionario as enum ('professor', 'coordenador', 'administrativo', 'outro');
create type estado_equipamento as enum ('otimo', 'bom', 'regular', 'ruim', 'inativo');
create type status_inscricao as enum ('pendente', 'reservada', 'aprovada', 'recusada', 'expirada', 'cancelada');
create type tipo_registro_ponto as enum ('entrada', 'saida', 'entrada_intervalo', 'saida_intervalo');
create type tipo_usuario as enum ('admin', 'gestor', 'funcionario', 'beneficiario');
