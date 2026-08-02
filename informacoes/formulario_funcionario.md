# Formulário: Cadastro e Edição de Funcionário (Pessoal)

Documentação dos campos do formulário de criação e edição de funcionários no sistema de referência.

## Campos do Formulário

| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Nome completo** | Texto (`text`) | **Obrigatório** | Nome completo do funcionário |
| **Professor responsável de turma** | Interruptor/Checkbox (`switch`) | Opcional | Define se o funcionário pode ser responsável por turmas (`Sim`/`Não`) |
| **Foto** | Arquivo (`file`) | Opcional | Upload da foto de perfil |
| **Documento CPF/CNPJ** | Texto com Máscara (`text`) | Opcional | CPF/CNPJ com formato de máscara |
| **Data de Nascimento** | Data (`date`) | Opcional | Data de nascimento do funcionário |
| **Status** | Seleção (`select2`) | **Obrigatório** | Opções: contratado, voluntário, demitido, pendente, Licença Médica, Licença Maternidade, Afastado INSS |
| **Data de admissão** | Data (`date`) | **Obrigatório** | Data de admissão no projeto |
| **Data de demissão** | Data (`date`) | Opcional | Data de demissão (se aplicável) |
| **Função** | Seleção (`select2`) | **Obrigatório** | Lista ampla de funções (Agente comunitário, Instrutor, Coordenador, Monitor, etc.) |
| **Remuneração** | Texto (`text`) | Opcional | Valor da remuneração/salário |
| **Núcleo** | Seleção (`select2`) | Opcional | Núcleo vinculado ou "Sem núcleo definido" |
| **Alocado em** | Seleção (`select2`) | **Obrigatório** | Local de alocação (Administração, Múlti. núcleos, Nenhum, Serviços gerais, ou Núcleo específico) |
| **Observação** | Área de texto (`textarea`) | Opcional | Observações adicionais sobre o funcionário |
| **Conselho** *(Condicional)* | Seleção (`select2`) | Opcional | Exibido se a função for Fisioterapeuta/Técnico de Enfermagem (CREFITO, COREN) |
| **Registro** *(Condicional)* | Texto (`text`) | Opcional | Número do registro no conselho de classe |
| **Conta de acesso** *(Condicional)* | Seleção (`select2`) | Opcional | Vínculo com a conta de usuário no sistema |
| **Entrada Padrão (Preenchimento Rápido)** | Horário (`time`) | Opcional | Horário padrão de entrada para aplicação em lote |
| **Saída Padrão (Preenchimento Rápido)** | Horário (`time`) | Opcional | Horário padrão de saída para aplicação em lote |
| **Jornada de Trabalho (Tabela Semanal)** | Tabela com Switches e Horários (`checkbox` / `time`) | Opcional | Configuração por dia da semana (Segunda a Domingo) indicando se trabalha (`Sim`/`Não`), horário de entrada e saída |

---

## Botões e Ações
- **Aplicar aos dias ativos**: Aplica os horários padrão de entrada/saída a todos os dias marcados como "Sim".
- **Salvar**: Atualiza (modo edição) ou cria (modo novo) o registro do funcionário no sistema.
