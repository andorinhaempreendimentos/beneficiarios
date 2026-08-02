# Tela: Listagem de Atividades (Cursos / Modalidades)

Documentação dos elementos e tabela da tela de listagem de atividades.

## Campos do Formulário / Elementos da Tabela

| Campo / Coluna | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Seleção de Item** | Checkbox (`checkbox`) | Opcional | Caixa de seleção por linha/lote |
| **ID** | Texto / Link | Informativo | Código identificador da atividade |
| **Nome** | Texto / Link | Informativo | Nome da atividade (ex: Funcional, Futebol, Futsal, Jiu-Jitsu, Karatê) |
| **Turnos** | Tags / Badges | Informativo | Quantidade de turmas por turno (manhã/tarde) |
| **Turmas** | Badge em destaque | Informativo | Quantidade total de turmas vinculadas à atividade |
| **Ativa na pré inscrição** | Texto (`Sim`/`Não`) | Informativo | Indica se a atividade fica visível no formulário público de pré-inscrição |
| **Perguntas adicionais** | Número | Informativo | Quantidade de perguntas personalizadas configuradas para a atividade |
| **Cadastrado em** | Data | Informativo | Data de criação do registro |

---

## Botões e Ações
- **Nova atividade**: Redireciona para o formulário de cadastro de nova atividade.
- **Tabela - Detalhes (Ícone Lupa)**: Redireciona para a visualização da atividade.
- **Tabela - Editar (Ícone Lápis)**: Redireciona para o formulário de edição da atividade.
