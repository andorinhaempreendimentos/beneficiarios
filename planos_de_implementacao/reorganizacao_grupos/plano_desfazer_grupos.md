# Plano de Desfazimento e Reorganização de Grupos com Backup Seguro

## 1. Objetivo
Desfazer a estrutura atual dos 41 grupos e suas 565 matrículas para permitir uma reorganização limpa e do zero, **sem perder o histórico de alocação de nenhum aluno** e garantindo recuperação total a qualquer momento.

---

## 2. Análise de Dependências e Impactos

### Tabelas Envolvidas
| Tabela | Quantidade Atual | Ação Proposta | Impacto |
|---|---|---|---|
| `beneficiarios` | **565 registros** | **NENHUMA (Intacta)** | **Zero perda.** Todos os cadastros pessoais, CPFs, contatos e núcleos são preservados. |
| `beneficiario_grupos` | **565 matrículas** | **Backup Total + Limpeza** | Alunos ficam com status "desalocado" (sem grupo atribuído) no sistema. |
| `grupo_horarios` | 26 horários | **Backup Total + Limpeza** | Grade semanal de polos/núcleos fica vazia temporariamente. |
| `grupo_responsaveis` | Vinculações | **Backup Total + Limpeza** | Professores ficam desvinculados de grupos até a nova grade. |
| `grupos` | 41 grupos | **Backup Total + Limpeza** | Lista de turmas/grupos fica zerada para recadastro. |
| `execucoes_sessao` | 0 registros | Já zerada | Sem impacto. |
| `beneficiario_presencas`| 0 registros | Já zerada | Sem impacto. |

### Impacto Visual nas Telas
1. **Tela de Beneficiários (`/beneficiarios`)**: Todos os 565 beneficiários continuam visíveis, porém sem etiqueta de turma associada.
2. **Tela de Grupos/Turmas (`/turmas`)**: Exibirá lista vazia aguardando criação dos novos grupos.
3. **Portal do Professor (`/professor`)**: Professores não verão turmas até que os novos grupos sejam associados a eles.
4. **Relatórios e Vagas**: Ocupação de vagas aparecerá como 0 até os beneficiários serem rematriculados.

---

## 3. Estratégia de Backup em Dupla Camada

### Camada 1: Snapshot Relacional no Supabase (SQL)
Criar tabelas de backup no banco que consolidam os dados de aluno, grupo, núcleo e atividade:
- **`backup_beneficiario_grupos`**:
  - `beneficiario_id`, `beneficiario_nome`, `cpf`, `data_nascimento`
  - `nucleo_id`, `nucleo_nome`
  - `grupo_id`, `grupo_nome`
  - `atividade_id`, `atividade_nome`
  - `data_matricula`, `status`
  - `data_backup`
- **`backup_grupos_estrutura`**:
  - Snapshot de todos os 41 grupos com seus nomes, núcleos e atividades originais.

### Camada 2: Arquivo Físico Local (JSON)
- Exportar snapshot completo em arquivo local:
  `planos_de_implementacao/reorganizacao_grupos/backup_matriculas_pre_reset.json`
- Garantir redundância fora da nuvem antes de qualquer exclusão.

---

## 4. Etapas de Execução

### Passo 1: Execução dos Backups
1. Gerar tabela `backup_beneficiario_grupos` no Supabase via script SQL cruzando `beneficiario_grupos`, `beneficiarios`, `grupos`, `nucleos` e `atividades`.
2. Gerar tabela `backup_grupos_estrutura` com os grupos e horários atuais.
3. Exportar JSON consolidado para disco local.
4. **Verificação de Fato**: Validar contagem de 565 registros no backup.

### Passo 2: Limpeza Controlada
1. Excluir registros de `beneficiario_grupos` (565 linhas).
2. Excluir registros de `grupo_horarios` e `grupo_responsaveis`.
3. Excluir registros de `grupos` (41 linhas).
4. **Verificação de Fato**: Confirmar 0 grupos e 565 beneficiários ativos em `beneficiarios`.

### Passo 3: Script de Rollback / Reassociação Pronta
- Deixar preparado um script que possa:
  - **Opção A (Restauração Total)**: Recriar exatamente os 41 grupos e reatribuir os 565 alunos do backup com 1 comando.
  - **Opção B (Mapeamento De ➔ Para)**: Conectar os alunos do backup para os novos grupos criados.
