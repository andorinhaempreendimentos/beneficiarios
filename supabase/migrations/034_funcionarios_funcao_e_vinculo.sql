alter table funcionarios drop column cargo;

alter table funcionarios
  add column funcao varchar(100),
  add column remuneracao numeric(10,2),
  add column conselho varchar(100),
  add column registro_conselho varchar(100),
  add column data_demissao date,
  add column professor_responsavel boolean not null default false;

drop type if exists cargo_funcionario;
