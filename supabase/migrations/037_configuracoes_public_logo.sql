-- Permite leitura pública apenas da chave logo_url (usada na tela de login sem auth)
create policy "configuracoes_public_logo_read" on configuracoes
  for select to anon
  using (chave = 'logo_url');
