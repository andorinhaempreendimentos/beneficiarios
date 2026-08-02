# Tela: Detalhes do Núcleo (Visualização e Dashboard)

Documentação dos campos, cadastros rápidos e elementos de visualização da tela de detalhes de um Núcleo/Polo.

## Campos de Entrada / Modais

| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Buscar ficha por CPF** | Seleção / Auto-complete (`select` / `select2`) | Opcional | Busca de beneficiário pré-existente por CPF dentro do modal "Cadastrar Beneficiário" |

---

## Seções e Elementos Informativos

| Seção | Tipo | Descrição / Conteúdo |
| :--- | :--- | :--- |
| **Detalhes do Núcleo** | Card Informativo | Exibe endereço completo, total de beneficiários cadastrados e mensagem de suporte |
| **Beneficiários (Gráficos)** | Gráficos (ApexCharts) | Exibe total e percentual de beneficiários **Ativos** e **Inativos** |
| **Controle Interno** | Widget / Contador | Exibe quantidade de controles/inspeções e botões de ação |
| **Eventos** | Widget / Contador | Exibe quantidade de eventos do núcleo e botões de ação |
| **Pessoal** | Widget / Contador | Exibe quantidade de membros da equipe vinculados ao núcleo |
| **Aba Turmas** | Tabela | Lista de turmas vinculadas com ID, Nome, Responsáveis, Horário, Dias, Qtd Beneficiários, Início e Duração |
| **Aba Beneficiários** | Tabela | Lista paginada de beneficiários vinculados ao núcleo com ID, Nome, Idade e Atividades |

---

## Botões e Ações
- **Editar núcleo**: Abre o formulário de edição do núcleo.
- **Cadastrar Beneficiário (Modal)**: Abre modal para busca rápida por CPF e inclusão no núcleo.
- **Visualizar Beneficiários (Ícone Lupa)**: Redireciona para a listagem completa de beneficiários do núcleo.
- **Cadastrar Beneficiário (Ícone +)**: Redireciona para o formulário de novo beneficiário vinculado ao núcleo.
- **Ações dos Widgets (Controle Interno, Eventos, Pessoal)**: Botões de visualizar lista e cadastrar novo registro.
- **Ações de Turmas (Listar / Cadastrar)**: Navegação rápida para gestão de turmas do núcleo.
- **Tabela Turmas - Acessar**: Abre os detalhes da turma correspondente.
- **Tabela Turmas - Exportar relatório**: Exporta relatório da turma em Excel (`.xlsx`).
- **Tabela Beneficiários - Editar / Remover**: Permite alterar dados ou desvincular/remover o beneficiário.
