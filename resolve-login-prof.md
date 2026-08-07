# Erro de login — professor@andorinha.local

Diagnóstico do erro "Database error querying schema" ao tentar logar com
`professor@andorinha.local`. Levantado em 2026-08-07. Nada foi alterado na
base nem no código ao produzir este documento.

## Causa

Não é RLS nem problema de schema. É um scan error do GoTrue. Nos logs de
auth do projeto, toda tentativa de login com esse e-mail retorna 500:

```
error finding user: sql: Scan error on column index 3,
name "confirmation_token": converting NULL to string is unsupported
error_code: unexpected_failure   grant_type: password   path: /token
```

O GoTrue (Go) mapeia `confirmation_token`, `recovery_token`,
`email_change_token_new` e `email_change` como `string` não-nulável. No
Postgres essas quatro colunas são nullable **e não têm default**. Se a linha
em `auth.users` for criada por `INSERT` SQL direto sem passar esses campos,
elas ficam `NULL`, o driver quebra ao ler a linha, e o supabase-js traduz o
500 genérico para a mensagem "Database error querying schema".

## Evidência na base

| | admin@andorinha.local | professor@andorinha.local |
|---|---|---|
| confirmation_token | `''` | **NULL** |
| recovery_token | `''` | **NULL** |
| email_change_token_new | `''` | **NULL** |
| email_change | `''` | **NULL** |
| linha em `auth.identities` | sim | **não** |
| login | funciona | 500 |

O admin foi criado via Dashboard/Admin API, que preenche string vazia. O
professor foi criado por SQL direto — não existe migration versionada
criando esse usuário, então foi inserção manual. Senha,
`email_confirmed_at`, `perfil_id`, `tipo` e `raw_app_meta_data` estão todos
corretos; o único problema são os `NULL` e a identity ausente.

## Solução proposta

Migration idempotente `040_fix_auth_users_null_tokens.sql`, em dois passos.

### Passo 1 — eliminar os NULL (é o que destrava o login)

```sql
update auth.users set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  email_change               = coalesce(email_change, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, '')
where confirmation_token is null or recovery_token is null
   or email_change_token_new is null or email_change_token_current is null
   or email_change is null or phone_change is null
   or phone_change_token is null or reauthentication_token is null;
```

### Passo 2 — criar a identity do provider `email`

```sql
insert into auth.identities
  (provider_id, user_id, identity_data, provider,
   last_sign_in_at, created_at, updated_at)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email,
                          'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
from auth.users u
where not exists (
  select 1 from auth.identities i
  where i.user_id = u.id and i.provider = 'email'
);
```

Sem identity o usuário não tem provider vinculado, o que afeta reset de
senha e o array `identities` no objeto de usuário retornado pelo Auth.

## Prevenção

Usuários novos devem ser criados via `supabase.auth.admin.createUser`
(service role) em vez de `INSERT` em `auth.users`. A Admin API preenche as
colunas de token e cria a identity. Se a criação manual em SQL for mantida,
o `INSERT` precisa passar `''` explicitamente nesses oito campos.

## Ponto adiante (não corrigido aqui)

`public.usuarios.entidade_id` está `null` para esse professor, e o mesmo
`null` aparece no `raw_app_meta_data`. Depois do login voltar, qualquer tela
do Portal do Professor que resolva o funcionário por `entidade_id` não vai
encontrar registro. Provavelmente é o próximo erro na fila.
