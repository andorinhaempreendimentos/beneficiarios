# Formulário: Cadastro de Núcleo (Polo / Local)

Documentação dos campos do formulário de cadastro de Núcleo/Polo do sistema de referência.

## Campos do Formulário

| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Identificação** | Texto (`text`) | **Obrigatório** | Nome/identificação do núcleo |
| **Nome do local** | Texto (`text`) | Opcional | Nome do local físico onde funciona o núcleo |
| **Região** | Texto (`text`) | Opcional | Região/Estado do núcleo |
| **CEP** | Texto (`text`) | Opcional | Código de Endereçamento Postal |
| **Endereço** | Texto (`text`) | Opcional | Logradouro do núcleo |
| **Número** | Texto (`text`) | Opcional | Número do endereço |
| **Cidade** | Texto (`text`) | Opcional | Município |
| **Bairro** | Texto (`text`) | Opcional | Bairro do núcleo |
| **Complemento** | Texto (`text`) | Opcional | Complemento do endereço |
| **Localização no Mapa** | Mapa Interativo / Busca (Google Maps API) | Opcional | Busca de local e marcação de coordenadas (`latitude` e `longitude`) |
| **Nome do responsável** | Texto (`text`) | Opcional | Nome da pessoa responsável pelo núcleo |
| **Telefone de contato** | Telefone (`tel`) | Opcional | Telefone com DDD (máscara de telefone) |
| **Data de início** | Data (`date`) | **Obrigatório** | Data de início de funcionamento do núcleo |
| **Data de fechamento** | Data (`date`) | Opcional | Data de término/encerramento das atividades |
| **Em funcionamento?** | Interruptor/Checkbox (`switch`) | Opcional | Status de funcionamento ativo do núcleo (padrão: marcado) |
| **Disponível na pré inscrição** | Interruptor/Checkbox (`switch`) | Opcional | Define se o núcleo aparece para escolha na pré-inscrição (padrão: marcado) |

---

## Botões e Ações
- **Salvar**: Submete o formulário.
- **Voltar**: Retorna para a listagem de núcleos.
