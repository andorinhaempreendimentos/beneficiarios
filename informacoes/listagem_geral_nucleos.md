# Tela: Listagem Geral de Núcleos (Dashboard / Painel)

Documentação dos campos, gráficos gerenciais, listagem e exportação da tela de núcleos.

## Campos do Formulário / Filtros

| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Pesquisar** | Texto (`text`) | Opcional | Busca de núcleo por termo/nome |
| **Data inicial** | Data (`date`) | Opcional | Data inicial para o relatório de exportação (no modal) |
| **Data final** | Data (`date`) | Opcional | Data final para o relatório de exportação (no modal) |
| **Formato** | Seleção (`select2`) | Opcional | Formato do arquivo a exportar: `PDF` ou `XLSX (Excel)` (no modal) |

---

## Seções Informativas e Gráficos Gerenciais
- **Ocupação Global (Gráfico Radial Bar)**: Exibe a taxa de ocupação total de alunos ativos em relação ao número total de vagas.
- **Top Núcleos (Gráfico Horizontal Bar)**: Ranking dos 5 maiores núcleos por volume de alunos ativos.
- **Status Operacional (Gráfico Donut)**: Proporção entre núcleos ativos, inativos e encerrados.
- **Distribuição por Curso (Gráfico Bar)**: Top 5 atividades/modalidades com maior número de alunos matriculados.
- **Tabela de Núcleos**: Exibe nome do núcleo com tooltip de endereço, status (Ativo/Inativo), data de início (período), lista de turmas ativas com quantidade de beneficiários e ações.

---

## Botões e Ações
- **Novo núcleo**: Redireciona para o formulário de criação de novo núcleo.
- **Exportar (Modal)**: Abre modal para configuração de intervalo de datas e formato de arquivo.
- **Exportar (Submeter)**: Dispara o download do relatório consolidado dos núcleos.
- **Pesquisar**: Executa a busca textual sobre a listagem de núcleos.
- **Turma na Tabela**: Clique abre os detalhes da turma específica do núcleo.
- **Tabela - Acessar**: Redireciona para a página de detalhes do núcleo.
- **Tabela - Editar**: Redireciona para o formulário de edição do núcleo.
