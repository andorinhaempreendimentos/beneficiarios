# Fluxo de Testes do Caminho Crítico (Golden Path)

Guia prático para testes ponta a ponta (*End-to-End*) das rotinas vitais do sistema **Andorinha Beneficiários**.

---

## 1. Fluxo de Beneficiário: Autocadastro e Matrícula

### 1.1. Autocadastro Público (Sem Login)
* **Rota**: `/inscricao`
* **Passos**:
  1. Acessar o portal público de inscrição.
  2. Selecionar **Estado** (ex: TO) ➔ **Cidade** (ex: Palmas) ➔ **Núcleo** com vagas disponíveis.
  3. Escolher a modalidade esportiva e turma desejada.
  4. Preencher dados cadastrais:
     * Nome completo do aluno e data de nascimento.
     * CPF do aluno ou do responsável legal.
     * Questionário de saúde e aptidão física (PAR-Q).
     * Endereço e telefone para contato institucional.
  5. Enviar o formulário de inscrição.
* **Resultado Esperado**: Exibição da tela de sucesso com número de protocolo / confirmação de pré-inscrição.

### 1.2. Validação e Matrícula no Painel Interno
* **Rotas**: `/beneficiarios` e `/turmas` (Perfil: Administrador / Coordenador)
* **Passos**:
  1. Autenticar no painel administrativo.
  2. Localizar o aluno recém-inscrito na listagem `/beneficiarios`.
  3. Validar documentos e confirmar a matrícula ativa na turma escolhida.
  4. Acessar `/turmas` e inspecionar a turma vinculada.
* **Resultado Esperado**: Aluno listado com status `Ativo` e contador de vagas ocupadas da turma incrementado corretamente.

---

## 2. Fluxo Operacional do Professor: Aula e Chamada

### 2.1. Abertura da Execução de Aula
* **Rota**: `/aulas` (Perfil: Professor / Instrutor)
* **Passos**:
  1. Logar com credenciais de professor da turma.
  2. Localizar a turma e abrir a execução da aula agendada para a data corrente.
* **Resultado Esperado**: Tela de chamada renderizada listando todos os alunos matriculados ativos.

### 2.2. Registro de Chamada e Conclusão
* **Passos**:
  1. Marcar status de presença para cada aluno (`Presente`, `Falta` ou `Justificada`).
  2. Inserir resumo das atividades esportivas executadas no diário de classe.
  3. Clicar no botão **Finalizar Aula**.
* **Resultado Esperado**: Aula salva com status `Concluída` e registros de presença persistidos com integridade.

---

## 3. Fluxo de Frequência, Auditoria e Relatório

### 3.1. Auditoria e Diário de Classe
* **Rota**: `/relatorios` (Perfil: Administrador / Gestor)
* **Passos**:
  1. Acessar a aba **Presença** no painel de relatórios.
  2. Filtrar pela turma e pelo período correspondente à aula executada.
* **Resultado Esperado**: Grade de frequência consolidada refletindo exatamente as presenças registradas pelo professor.

### 3.2. Exportação de Relatório Oficial
* **Passos**:
  1. Clicar no botão de exportação (**PDF** ou **Excel**).
  2. Abrir o arquivo baixado.
* **Resultado Esperado**: Documento gerado com cabeçalho do Concedente/Objeto, listagem de alunos e percentual de frequência computado.

---

## 4. Política de Limpeza Segura (Preservação de Dados)

1. **Testes Temporários**: Qualquer registro criado com prefixo `QA` ou `Teste` deve ser removido após a validação.
2. **Preservação**: Nunca alterar ou excluir registros reais de turmas, núcleos, beneficiários ou contratos pré-existentes.
