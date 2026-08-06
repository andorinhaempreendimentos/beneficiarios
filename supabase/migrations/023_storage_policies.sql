-- RLS em storage.objects, uma policy por bucket, replicando exatamente a
-- permissão do controller que fazia o upload/leitura no NestJS original
-- (beneficiarios/editar para fotos e anexos, funcionarios/editar,
-- equipamentos/editar, comprovacoes/criar+listar).
create policy beneficiario_fotos_all on storage.objects for all using (
  bucket_id = 'beneficiario-fotos' and has_permissao('beneficiarios','editar')
) with check (
  bucket_id = 'beneficiario-fotos' and has_permissao('beneficiarios','editar')
);

create policy beneficiario_anexos_storage_all on storage.objects for all using (
  bucket_id = 'beneficiario-anexos' and has_permissao('beneficiarios','editar')
) with check (
  bucket_id = 'beneficiario-anexos' and has_permissao('beneficiarios','editar')
);

create policy funcionario_fotos_all on storage.objects for all using (
  bucket_id = 'funcionario-fotos' and has_permissao('funcionarios','editar')
) with check (
  bucket_id = 'funcionario-fotos' and has_permissao('funcionarios','editar')
);

create policy equipamento_fotos_all on storage.objects for all using (
  bucket_id = 'equipamento-fotos' and has_permissao('equipamentos','editar')
) with check (
  bucket_id = 'equipamento-fotos' and has_permissao('equipamentos','editar')
);

create policy comprovacoes_storage_select on storage.objects for select using (
  bucket_id = 'comprovacoes' and has_permissao('comprovacoes','listar')
);
create policy comprovacoes_storage_insert on storage.objects for insert with check (
  bucket_id = 'comprovacoes' and has_permissao('comprovacoes','criar')
);
