# Gestão de matrícula pelo professor — adicionar, remover, migrar

Diagnóstico da ausência das operações de adicionar beneficiário à turma,
remover e migrar entre turmas, pelo professor. Levantado em 2026-08-07.
Nada foi alterado no código nem na base ao produzir este documento.

## Causa

A funcionalidade não existe em nenhuma das quatro camadas. Não é permissão
bloqueando — é ausência de implementação.

A raiz é conceitual: o modelo de matrícula foi construído inteiro em volta do
fluxo **público de auto-inscrição** (beneficiário se inscreve pelo link →
staff aprova). Nunca houve um caminho de gestão de turma pelo lado do staff.

Existem duas tabelas e só a primeira tem operações:

- `inscricoes` — o **pedido**. Tem `criar_inscricao`, `aprovar_inscricao`,
  `recusar_inscricao`, `cancelar_inscricao` (migrations 018 e 019).
- `beneficiario_turmas` — a **matrícula efetiva**. Não tem nenhuma function.
  Só é escrita como efeito colateral de `criar_inscricao`
  (`018_inscricoes_criar.sql:63`) e `aprovar_inscricao`
  (`019_inscricoes_transicoes.sql:27`).

## Situação por camada

| camada | adicionar | remover | migrar |
|---|---|---|---|
| function no banco | só via `criar_inscricao` (exige vaga + aprovação) | **não existe** | **não existe** |
| API `services.ts` | `inscricoesApi.criar` | **não existe** | **não existe** |
| UI | nenhuma tela | nenhuma tela | nenhuma tela |
| permissão | já tem | já tem | já tem |

`/turmas/[id]/inscricoes/page.tsx` é read-only — a única ação por linha é o
link "Ver aluno" (linha 80). `/turmas/[id]/page.tsx` mostra apenas a
**contagem** de matriculados (linha 64), não a lista. Sem roster renderizado
não há onde pendurar botão de remover ou migrar.

## Permissão foi descartada como causa

Existe **um único perfil** na base — `Administrador`, 53 permissões,
`is_sistema = true` — e os dois usuários (admin e professor) apontam para ele.

O professor já tem `beneficiarios:editar`, que é exatamente o que as policies
de `beneficiario_turmas` exigem
(`012_rls_policies_parte3.sql:13-15`):

```sql
create policy beneficiario_turmas_insert on beneficiario_turmas
  for insert with check (has_permissao('beneficiarios','editar'));
create policy beneficiario_turmas_update on beneficiario_turmas
  for update using (has_permissao('beneficiarios','editar'));
create policy beneficiario_turmas_delete on beneficiario_turmas
  for delete using (has_permissao('beneficiarios','editar'));
```

Ou seja: se as functions e a UI existissem, o professor conseguiria usar hoje
sem nenhuma mudança de permissão.

## Estrutura relevante

`beneficiario_turmas` (`005_beneficiarios.sql:34`):

```sql
create table beneficiario_turmas (
  id uuid primary key default gen_random_uuid(),
  beneficiario_id uuid not null references beneficiarios(id) on delete restrict,
  turma_id uuid not null references turmas(id) on delete restrict,
  status status_beneficiario_turma not null default 'ativo',
  data_matricula date not null default current_date,
  data_evasao date,
  ...
  unique (beneficiario_id, turma_id)
);
```

Dois detalhes que condicionam a solução: o `unique (beneficiario_id,
turma_id)` e o `on delete restrict` nas duas FKs.

## Solução proposta

### 1. Migration `040_matricula_gestao.sql`

Três functions novas, seguindo o padrão de 018/019 — `security definer`,
`has_permissao` no topo, `for update` na turma, `set search_path = public`,
`revoke execute from anon` / `grant execute to authenticated`.

**`matricular_beneficiario(p_turma_id, p_beneficiario_id)`**
Insere direto em `beneficiario_turmas`, sem passar por `inscricoes`. Reusar o
mesmo lock e a mesma contagem de vagas do `criar_inscricao`
(`018_inscricoes_criar.sql:31-52`). Precisa de
`on conflict (beneficiario_id, turma_id) do update` para reativar matrícula
com `status = 'evadido'` em vez de estourar o unique index.

**`desmatricular_beneficiario(p_turma_id, p_beneficiario_id, p_motivo)`**
`update` para `status = 'evadido'` e `data_evasao = current_date`. Soft
delete, não `delete`: a FK é `on delete restrict` e o histórico de presença
precisa continuar resolvendo o aluno.

**`migrar_beneficiario_turma(p_beneficiario_id, p_turma_origem, p_turma_destino)`**
As duas operações em uma transação só. Travar a turma destino e checar vaga
**antes** de evadir da origem — na ordem inversa, se a destino estiver cheia,
o aluno fica sem turma nenhuma.

### 2. API

Três métodos em `inscricoesApi`, ou um `matriculasApi` novo, via
`sb.rpc(...)` — mesmo formato de `services.ts:1014-1035`.

### 3. UI

Renderizar o roster de matriculados no `/turmas/[id]` (hoje só tem
contagem), com botão de remover por linha e modal de migrar com select das
outras turmas. É aqui que mora a maior parte do trabalho.

## Pontos adiante (não corrigidos)

**`cancelar_inscricao` não desmatricula.** Ela marca
`inscricoes.status = 'cancelada'` (`019_inscricoes_transicoes.sql:93`) e para
aí — a linha em `beneficiario_turmas` continua `ativo`. Então o botão
"cancelar" da tela `/inscricoes` já hoje deixa o aluno matriculado na turma,
contando vaga e aparecendo na chamada. É bug existente, independente da
feature nova, e provavelmente é a razão de a remoção "não existir" na prática
ter passado despercebida.

**RLS sem escopo de turma.** As policies de `beneficiario_turmas` checam só
`has_permissao('beneficiarios','editar')` — nada amarra o professor às turmas
dele. Com as functions novas em `security definer`, qualquer professor
poderia migrar aluno de qualquer turma de qualquer núcleo. Se a intenção é
restringir, precisa de um predicado ligando `current_entidade_id()`
(`009_rls_function.sql:36`) ao funcionário responsável pela turma — dentro
das functions ou nas policies.

**Não existe perfil "Professor".** O professor usa o perfil `Administrador`
com as 53 permissões. Qualquer discussão de "o que o professor pode fazer" é
inócua enquanto ele for admin. Ver também `resolve-login-prof.md`, onde o
`entidade_id` nulo desse mesmo usuário impede resolver qual funcionário ele é
— o que é pré-requisito para qualquer escopo por turma.
