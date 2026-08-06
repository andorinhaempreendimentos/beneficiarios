-- Substitui R2 por Supabase Storage. Buckets privados (sem acesso público
-- direto) — leitura só via signed URL gerada no cliente com supabase-js,
-- igual ao StorageService.signedUrl() do NestJS original.
-- Um bucket por entidade, espelhando o limite de arquivo do controller
-- original (5 MB fotos) e mantendo separação de permissão por tabela.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('beneficiario-fotos', 'beneficiario-fotos', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('beneficiario-anexos', 'beneficiario-anexos', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('funcionario-fotos', 'funcionario-fotos', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('equipamento-fotos', 'equipamento-fotos', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('comprovacoes', 'comprovacoes', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;
