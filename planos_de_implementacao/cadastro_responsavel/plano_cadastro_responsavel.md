# Plano de Implementação: Cadastro de Alunos pelo Responsável

## 1. Princípios e Regra de Segurança Absoluta

- **Isolamento Total das Tabelas Oficiais de Produção**:
  - As tabelas `beneficiarios`, `grupos`, `grupo_horarios` e `beneficiario_grupos` permanecem **estritamente intocadas** em modo somente leitura.
  - O sistema lê apenas as turmas e horários daquele núcleo para o responsável escolher.
- **Persistência Segura em Tabela de Respostas (`respostas_conferencia_beneficiarios`)**:
  - A inscrição individual enviada pelo responsável é registrada com segurança no campo `novos_alunos_cadastrados` (JSONB) vinculado ao núcleo, contendo os dados do aluno e os contatos do responsável.
  - Permite auditoria, conferência e homologação posterior pela coordenação.

---

## 2. Rota e Arquitetura

- **URL Pública**: `/cadastro-alunos/[nucleoId]/responsavel`
- **Acesso**: Livre (aberto via WhatsApp sem necessidade de login)
- **API Endpoint**: `POST /api/cadastro-alunos/responsavel`

---

## 3. Especificação do Formulário

### 3.1 Dados do Filho (Aluno):
1. **Nome Completo do Aluno** (obrigatório, uppercase)
2. **Data de Nascimento** (obrigatório, calcula idade e exibe badge)
3. **Sexo** (obrigatório, botões Masculino M e Feminino F)
4. **CPF do Aluno** (opcional, com máscara `000.000.000-00`)
5. **Turma / Horário de Interesse** (obrigatório, com destaque inteligente "Sugerida por idade")

### 3.2 Dados do Responsável:
1. **Nome Completo do Responsável** (obrigatório)
2. **Parentesco** (Mãe / Pai / Responsável Legal)
3. **WhatsApp / Celular** (obrigatório, com máscara `(00) 00000-0000`)
4. **Observações** (opcional, alergias, restrições médicas ou observações gerais)

---

## 4. Experiência de Sucesso / Comprovante

- Card de confirmação amigável para a família:
  - Nome do filho e turma escolhida (com dias e horários da semana)
  - Mensagem de acolhimento informando que o professor e a coordenação entrarão em contato pelo WhatsApp.
  - Opção de cadastrar outro filho no mesmo núcleo.
