# Formulário: Cadastro e Edição de Atividade

Documentação dos campos do formulário de criação e edição de Atividades (Modalidades).

## Campos do Formulário

| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Nome** | Texto (`text`) | **Obrigatório** | Nome da atividade (ex: Funcional, Futebol, Karatê) |
| **Disponível no formulário de inscrição?** | Interruptor/Checkbox (`switch`) | Opcional | Define se a atividade fica visível na pré-inscrição pública (`Sim`/`Não`) |
| **Turnos para o formulário de pré inscrição: Manhã** | Interruptor/Checkbox (`switch`) | Opcional | Habilita o turno da Manhã para a pré-inscrição (`Sim`/`Não`) |
| **Turnos para o formulário de pré inscrição: Tarde** | Interruptor/Checkbox (`switch`) | Opcional | Habilita o turno da Tarde para a pré-inscrição (`Sim`/`Não`) |
| **Turnos para o formulário de pré inscrição: Noite** | Interruptor/Checkbox (`switch`) | Opcional | Habilita o turno da Noite para a pré-inscrição (`Sim`/`Não`) |
| **Pergunta** *(Campos Dinâmicos)* | Texto (`text`) com ícone de ajuda | Opcional | Pergunta personalizada vinculada à atividade para a pré-inscrição |
| **Disponível no formulário de inscrição? (Por Pergunta)** | Interruptor/Checkbox (`switch`) | Opcional | Ativa ou desativa a pergunta no formulário de inscrição (`Sim`/`Não`) |

---

## Botões e Ações
- **Adicionar pergunta**: Insere um novo bloco dinâmico de pergunta personalizada.
- **Remover (por pergunta)**: Exclui a pergunta dinâmica correspondente.
- **Salvar**: Submete as alterações da atividade.
- **Ver detalhes**: Redireciona para a página de visualização da atividade.
- **Voltar**: Retorna para a listagem geral de atividades.
