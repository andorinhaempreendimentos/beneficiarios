# Plano de Implementação: Cadastro Rápido de Alunos pelos Professores

## 1. Princípios e Regra de Segurança Absoluta

- **Isolamento Total das Tabelas Oficiais de Produção**:
  - As tabelas `beneficiarios`, `grupos`, `grupo_horarios` e `beneficiario_grupos` permanecem **estritamente intocadas** em modo somente leitura.
  - O sistema apenas lê as turmas daquele núcleo para permitir a associação do aluno à turma correta.
- **Persistência Segura em Tabela de Respostas (`respostas_conferencia_beneficiarios`)**:
  - Todos os alunos cadastrados pelo professor são gravados exclusivamente na tabela `respostas_conferencia_beneficiarios` no campo `novos_alunos_cadastrados` (JSONB).
  - Nenhuma gravação direta na tabela oficial `beneficiarios`.
  - Dados permanecem disponíveis para auditoria e posterior homologação pela coordenação.

---

## 2. Arquitetura da Solução

### 2.1 Rota da Interface Pública do Professor
- **URL**: `/cadastro-alunos/[nucleoId]`
- **Público**: Professores dos 13 núcleos que ainda não possuem alunos cadastrados no sistema.
- **Funcionamento**:
  - Acesso direto sem login via link do WhatsApp com UUID ou identificação do núcleo.
  - Carregamento dos dados do núcleo, professor e turmas existentes.
  - Se o professor já enviou uma lista anteriormente, exibe os alunos previamente cadastrados para revisão ou complementação.

### 2.2 Rota de API (Next.js App Router)
- **`GET /api/cadastro-alunos/[nucleoId]`**:
  - Retorna identificação do núcleo, professor responsável, modalidade e lista de turmas ativas com dias, horários e faixas etárias.
  - Retorna resposta prévia salva (se houver).
- **`POST /api/cadastro-alunos`**:
  - Valida e grava a lista de alunos na tabela `respostas_conferencia_beneficiarios`.
  - Campos salvos por aluno: `idTemp`, `nomeCompleto`, `dataNascimento`, `idade`, `sexo`, `cpf`, `turmaId`, `turmaNome`.

---

## 3. Especificação do Formulário de Cadastro Rápido

### Campos do Formulário:
1. **Nome Completo do Aluno** (obrigatório):
   - Texto em caixa alta automática.
2. **Data de Nascimento** (obrigatório):
   - Campo date.
   - Cálculo automático da idade em tempo real exibido em badge.
3. **Sexo** (obrigatório):
   - Seletor em botões de toque: **Masculino (M)** ou **Feminino (F)**.
4. **CPF do Aluno** (opcional):
   - Máscara automática `000.000.000-00`.
5. **Turma de Destino** (obrigatório):
   - Select contendo as turmas cadastradas para o núcleo (com dias e horários).
   - Sugestão inteligente com destaque visual se a idade do aluno bater com a faixa etária da turma (`idade >= idadeMinima && idade <= idadeMaxima`).

### Lista Interativa de Alunos Adicionados:
- Exibição de cards com os alunos já inseridos pelo professor.
- Contador em tempo real: "Total de Alunos Adicionados: X".
- Opção de remover aluno da lista antes de enviar.

### Finalização e Envio:
- Botão "Finalizar e Enviar Lista de Alunos".
- Confirmação visual e tela de sucesso com resumo da lista enviada.

---

## 4. Atualização no Painel Administrativo (`/conferencia-beneficiarios/respostas`)

- Atualizar o gerador de links para que os 13 núcleos sem alunos tenham o link apontando para `/cadastro-alunos/[nucleoId]`.
- Atualizar o texto gerado do botão "Copiar Link WhatsApp" para indicar claramente que é o link de cadastro de alunos.
