-- Simplifica status do beneficiário para: pendente | ativo | inativo
-- Legado: 'Novo cadastro' | 'Comparecer a sede' | 'Aguardando seletiva' | 'Fila de espera' -> pendente
--         'Aprovado' -> ativo
--         'Desistente' -> inativo

alter table beneficiarios alter column status drop default;

update beneficiarios
set status = case
  when status in ('Aprovado', 'ativo') then 'ativo'
  when status in ('Desistente', 'inativo') then 'inativo'
  else 'pendente'
end;

alter table beneficiarios alter column status set default 'pendente';

alter table beneficiarios
  add constraint beneficiarios_status_check
  check (status in ('pendente', 'ativo', 'inativo'));
