# Tela: Listagem e Filtro de Beneficiários do Núcleo

Documentação dos campos de filtro, listagem e ações da tela de beneficiários por núcleo.

## Campos do Formulário / Filtros

| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Nome** | Texto (`text`) | Opcional | Busca por nome parcial ou completo do beneficiário |
| **Matrícula** | Texto (`text`) | Opcional | Busca pelo código/número da matrícula |
| **Data de nascimento** | Data (`date`) | Opcional | Filtro por data exata de nascimento |
| **CPF** | Texto com Máscara (`text`) | Opcional | Filtro por número de CPF com máscara |
| **Status** | Seleção (`select`) | Opcional | Opções: Novo cadastro, Comparecer a sede, Aguardando seletiva, Fila de espera, Desistente, Aprovado |
| **Atividade** | Seleção (`select2`) | Opcional | Opções: Futebol, Futsal, Funcional, Karatê, Jiu-Jitsu |
| **Tipo de matrícula** | Seleção (`select`) | Opcional | Opções: Todos, Online, Interna |
| **Idade Mínima** | Número (`number`) | Opcional | Idade mínima do beneficiário |
| **Idade Máxima** | Número (`number`) | Opcional | Idade máxima do beneficiário |
| **Data de início** | Data (`date`) | Opcional | Filtro por período de cadastro (início) |
| **Data de fim** | Data (`date`) | Opcional | Filtro por período de cadastro (fim) |
| **Imprimir fichas** | Checkbox (`checkbox`) | Opcional | Opção para modo de impressão de fichas |
| **Exibir apenas ativos** | Checkbox (`checkbox`) | Opcional | Restringe resultado a beneficiários ativos |

---

## Seções Informativas e Tabela
- **Card Contador**: Exibe o total geral de beneficiários ativos no núcleo.
- **Tabela de Beneficiários**: Exibe colunas com Matrícula, Status, Nome (com badge ONLINE/INTERNA), Idade, Atividades (com vínculo da turma) e Ações.
- **Paginação**: Controle para navegar entre as páginas de resultados (30 registros por página).

---

## Botões e Ações
- **Novo Beneficiário**: Abre o formulário de cadastro de um novo beneficiário.
- **Exibir / Ocultar Filtros**: Alterna a visibilidade do painel de filtros.
- **Filtrar**: Submete os filtros preenchidos.
- **Limpar**: Reseta todos os parâmetros de busca.
- **Tabela - Acessar**: Abre os detalhes do beneficiário.
- **Tabela - Editar**: Abre o formulário de edição do beneficiário.
- **Tabela - Remover**: Exclui o vínculo/registro do beneficiário mediante confirmação.
