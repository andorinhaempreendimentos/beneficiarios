# Tela: Listagem Geral de Beneficiários

Documentação dos campos, filtros, estatísticas e listagem geral de todos os beneficiários do sistema.

## Campos do Formulário / Filtros

| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Nome** | Texto (`text`) | Opcional | Busca pelo nome do beneficiário |
| **Matrícula** | Texto (`text`) | Opcional | Busca pelo código da matrícula |
| **Data de nascimento** | Data (`date`) | Opcional | Filtro por data exata de nascimento |
| **CPF** | Texto com Máscara (`text`) | Opcional | Filtro por CPF do beneficiário |
| **Status** | Seleção (`select`) | Opcional | Opções: Novo cadastro, Comparecer a sede, Aguardando seletiva, Fila de espera, Desistente, Aprovado |
| **Atividade** | Seleção (`select2`) | Opcional | Opções: Futebol, Futsal, Funcional, Karatê, Jiu-Jitsu |
| **Tipo de matrícula** | Seleção (`select`) | Opcional | Opções: Todos, Online, Interna |
| **Idade Mínima** | Número (`number`) | Opcional | Idade mínima do beneficiário |
| **Idade Máxima** | Número (`number`) | Opcional | Idade máxima do beneficiário |
| **Data de início** | Data (`date`) | Opcional | Período inicial de cadastro |
| **Data de fim** | Data (`date`) | Opcional | Período final de cadastro |
| **Núcleo** | Seleção (`select2`) | Opcional | Filtro por núcleo específico ou todos |
| **Ordenar por** | Seleção (`select`) | Opcional | Opções: Data de criação (crescente/decrescente), Ordem alfabética, Atualizados recentemente |
| **Formato** | Seleção (`select`) | Opcional | Opções: `ver na página` (HTML) ou `xlsx (excel)` |
| **Imprimir fichas** | Checkbox (`checkbox`) | Opcional | Alterna para modo de impressão |
| **Exibir apenas ativos** | Checkbox (`checkbox`) | Opcional | Filtra apenas beneficiários com cadastro ativo |

---

## Seções Informativas e Tabela
- **Card Total de Ativos**: Exibe o total geral de beneficiários ativos e o total de vínculos ativos em turmas.
- **Card Total de Evadidos**: Exibe o total de beneficiários evadidos (vínculos encerrados) com link de atalho.
- **Tabela Geral de Beneficiários**: Exibe Matrícula, Status, Nome (com badge ONLINE/INTERNA), Idade, Atividades (com link da turma) e Ações.
- **Paginação**: Controle de navegação por páginas (30 registros por página).

---

## Botões e Ações
- **Novo Beneficiário**: Redireciona para o formulário de cadastro de novo beneficiário.
- **Exibir / Ocultar Filtros**: Alterna a visibilidade dos filtros de busca.
- **Filtrar**: Aplica os filtros e parâmetros selecionados.
- **Limpar**: Reseta todos os parâmetros da busca.
- **Tabela - Acessar**: Abre os detalhes do beneficiário.
- **Tabela - Editar**: Abre o formulário de edição do beneficiário.
- **Tabela - Remover**: Exclui o registro do beneficiário mediante confirmação.
