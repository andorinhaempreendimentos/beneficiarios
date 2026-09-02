# Especificação Técnica e Funcional: Gestor de Disparo de WhatsApp

Documento de especificação e arquitetura para o módulo de disparo automatizado de mensagens WhatsApp com integração a banco de dados externo (Supabase) para envio de links de pesquisa e formulários aos beneficiários.

---

## 1. Visão Geral do Módulo

O **Gestor de Disparos de WhatsApp** é um módulo integrado ao sistema para comunicação ativa e automatizada com beneficiários e seus responsáveis legais. O objetivo principal é automatizar o envio de links de inscrição, pesquisas de satisfação e formulários cadastrais gerados em uma aplicação externa (também hospedada na Vercel com banco Supabase).

### Principais Objetivos:
- Conectar ao banco de dados Supabase da aplicação externa para extrair links de pesquisa e formulários vinculados aos beneficiários.
- Gerenciar instâncias oficiais de WhatsApp (pareamento via QR Code).
- Permitir a criação de mensagens personalizadas com tags dinâmicas (`{nome_aluno}`, `{responsavel}`, `{link_pesquisa}`, `{nucleo}`).
- Executar envios em lote com fila controlada e intervalo inteligente (anti-bloqueio).
- Registrar histórico completo com status de entrega e reenvio de falhas.

---

## 2. Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                 SISTEMA ATUAL (BENEFICIÁRIOS)               │
│                                                             │
│  ┌──────────────────────┐        ┌───────────────────────┐  │
│  │ Painel do Gestor     │        │ Motor de Fila         │  │
│  │ (Filtros + Template) │───────>│ (Cadência / Anti-Ban) │  │
│  └──────────────────────┘        └──────────┬────────────┘  │
└─────────────────────────────────────────────┼───────────────┘
                       │                      │
                       ▼                      ▼
┌───────────────────────────────┐  ┌──────────────────────────┐
│     SUPABASE EXTERNO          │  │   GATEWAY WHATSAPP       │
│     (Aplicação Secundária)    │  │   (Evolution / Z-API)    │
│                               │  │                          │
│  - Links de Pesquisa          │  │  - Pareamento QR Code    │
│  - Formulários de Inscrição   │  │  - Disparo de Mensagens  │
│  - Status de Resposta         │  │  - Webhooks de Entrega   │
└───────────────────────────────┘  └──────────┬───────────────┘
                                              │
                                              ▼
                                   ┌──────────────────────────┐
                                   │  WHATSAPP DO BENEFICIÁRIO│
                                   └──────────────────────────┘
```

---

## 3. Componentes do Sistema

### 3.1. Conector com Banco de Dados Externo (Supabase Secundário)
- **Multi-Client Supabase:** Inicialização de um cliente Supabase secundário seguro utilizando variáveis de ambiente dedicadas:
  - `EXTERNAL_SUPABASE_URL`
  - `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` / `EXTERNAL_SUPABASE_ANON_KEY`
- **Sincronização de Links:**
  - Consulta à tabela de formulários/pesquisas da aplicação externa cruzando pelo identificador do aluno (CPF, Matrícula ou ID).
  - Obtenção do link parametrizado exclusivo de cada beneficiário.
  - Verificação de status (identificar quem já respondeu e quem está pendente).

### 3.2. Gerenciador de Conexão WhatsApp (Gateway)
- **Provedor Recomendado:** Evolution API (Self-hosted/Cloud), Z-API ou Meta Cloud API.
- **Funcionalidades da Conexão:**
  - Tela de pareamento com exibição de QR Code em tempo real.
  - Indicador de status da sessão: *Conectado*, *Desconectado*, *Aguardando Leitura*.
  - Exibição do número remetente ativo e nível de bateria do aparelho.

### 3.3. Editor de Modelos de Mensagem (Templates)
- **Editor de Texto:** Campo com suporte a emojis e formatação WhatsApp (`*negrito*`, `_itálico_`, `~tachado~`).
- **Tags de Personalização Dinâmica:**
  - `{nome_aluno}`: Nome completo ou primeiro nome da criança/adolescente.
  - `{nome_responsavel}`: Nome do responsável cadastrado.
  - `{link_pesquisa}`: URL exclusiva gerada no site externo.
  - `{nucleo}`: Núcleo esportivo onde o aluno treina.
  - `{turma}`: Turma vinculada.
- **Pré-visualização Interativa:** Mockup de tela de celular simulando como a mensagem chegará ao destinatário final.

### 3.4. Segmentação e Seleção de Destinatários
- **Filtros Avançados:**
  - Por Objeto / Parceria.
  - Por Núcleo Esportivo ou Turma.
  - Por Status da Pesquisa: *Apenas Não Respondidos*, *Todos*.
  - Por Status da Matrícula: *Ativos*, *Pendentes*, *Lista de Espera*.
- **Seleção Manual:** Checkboxes individuais para inclusão/exclusão pontual de contatos.

### 3.5. Motor de Fila & Proteção Anti-Bloqueio (Anti-Ban)
Para evitar que o número de WhatsApp seja sinalizado por spam ou banido pela Meta:
- **Delay Aleatório Configurável:** Intervalo entre disparos (ex: entre 8 e 18 segundos por mensagem).
- **Janela de Envio:** Horário permitido para disparos (ex: 08:00 às 20:00).
- **Limite por Lote:** Pausa de resfriamento a cada 50 mensagens enviadas.
- **Processamento em Segundo Plano:** Fila assíncrona (Background Job) que não trava a interface do usuário.

### 3.6. Painel de Monitoramento, Histórico e Reenvio
- **Dashboard de Disparos:**
  - Total de mensagens na fila.
  - Enviadas com sucesso.
  - Entregues e Lidas (via Webhooks).
  - Falhas (número inválido, sem WhatsApp ou erro de rede).
- **Ações de Recuperação:**
  - Botão de reenvio de falhas com 1 clique.
  - Log detalhado com motivo do erro por destinatário.

---

## 4. Segurança e LGPD

1. **Proteção de Credenciais:** As chaves do Supabase externo e do gateway de WhatsApp nunca são expostas no front-end; todas as chamadas trafegam por endpoints autenticados do Next.js (API Routes / Server Actions).
2. **Opt-Out (Descadastro):** Mecanismo para registrar números que solicitarem a não recepção de mensagens automatizadas.
3. **Higienização de Números:** Normalização automática de números de telefone (DDI + DDD + 9 dígitos), eliminando caracteres especiais e espaços.

---

## 5. Estrutura de Entrega para Composição de Orçamento

| Etapa | Escopo de Desenvolvimento |
|---|---|
| **Fase 1: Conectividade & Gateway** | Conexão com Supabase externo, rotina de busca de links, integração da API de WhatsApp e tela de QR Code. |
| **Fase 2: Interface & Templates** | Tela do gestor de mensagens, editor de templates com tags dinâmicas e preview em tempo real. |
| **Fase 3: Segmentação & Filtros** | Filtros de destinatários por núcleo/turma e cruzamento com status de resposta da pesquisa. |
| **Fase 4: Motor de Fila & Anti-Ban** | Execução assíncrona com cadência de envio, pausas inteligentes e tratamento de erros. |
| **Fase 5: Histórico & Relatório** | Tabela de logs, monitoramento de status de entrega e botão de reenvio. |
