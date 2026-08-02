# Tela: Listagem de Funcionários (Pessoal)

Documentação dos campos, filtros, visão geral e tabela de funcionários cadastrados.

## Campos do Formulário / Filtros

| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Buscar** | Texto (`text`) | Opcional | Busca textual por Nome ou CPF do funcionário |
| **Alocado em** | Seleção (`select2`) | Opcional | Opções: Todos, Administração, Múlti. núcleos, ou núcleo específico |
| **Função** | Seleção (`select2`) | Opcional | Opções: Todas, Articulador social, Coordenador de núcleo, Coordenador de projeto, Coordenador de setor, Instrutor, Monitor |
| **Status** | Seleção (`select2`) | Opcional | Opções: Todos, Contratado, Demitido |
| **Data de admissão de** | Data (`date`) | Opcional | Período inicial da data de admissão |
| **Até** | Data (`date`) | Opcional | Período final da data de admissão |

---

## Seções Informativas e Tabela
- **Cards de Visão Geral**: Exibe estatísticas de quantidade de **Admitidos** (em destaque azul) e **Desligados** (em destaque vermelho).
- **Tabela de Funcionários**: Lista com Matrícula, Nome, Status, CPF, Função, Data de Admissão, Local Alocado e Ações.
- **Paginação**: Navegação paginada (20 registros por página).

---

## Botões e Ações
- **Cadastrar Novo Funcionário**: Redireciona para o formulário de cadastro de funcionário.
- **Exibir / Ocultar Filtros**: Alterna a visibilidade dos filtros.
- **Filtrar**: Aplica os parâmetros de filtro informados.
- **Limpar**: Reseta os filtros aplicados.
- **Tabela - Detalhes (Ícone Lupa)**: Abre os detalhes do funcionário.
- **Tabela - Editar (Ícone Lápis)**: Abre a edição dos dados do funcionário.
- **Tabela - Remover (Ícone Lixeira)**: Exclui o cadastro do funcionário mediante confirmação.
