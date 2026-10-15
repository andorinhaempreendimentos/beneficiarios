# Arquitetura e Engenharia do Módulo de Pesquisas & Formulários Dinâmicos

Este documento descreve detalhadamente a engenharia, modelagem relacional, construtor de grafos, motor de execução, segurança anti-fraude, distribuição multicanal e inteligência analítica do **Módulo de Pesquisas**.

A documentação abaixo foi elaborada com **terminologia agnóstica**, permitindo sua compreensão, reutilização e adaptação para qualquer domínio de aplicação (SaaS corporativo, auditoria de campo, pesquisa de mercado, avaliação de impacto institucional, NPS, RH ou operações setoriais).

---

## 1. Glossário de Equivalência: Termos do Negócio vs. Termos Agnósticos

Para abstrair a regra de negócio específica do projeto original, a tabela abaixo mapeia cada termo do sistema para o seu equivalente genérico de engenharia:

| Termo Original no Sistema | Termo Agnóstico Adotado | Descrição Funcional |
| :--- | :--- | :--- |
| **Andorinha / Instituto** | **Plataforma / Sistema** | A aplicação central que hospeda e gerencia os módulos. |
| **Beneficiário / Aluno** | **Usuário / Respondente / Entidade Cadastrada** | Indivíduo alvo da coleta de dados, cadastrado previamente na base. |
| **Matrícula** | **ID de Registro / Código Cadastral** | Identificador único alfanumérico atribuído ao respondente na base. |
| **Núcleo / Local** | **Polo / Unidade Operacional / Filial** | Ponto físico ou centro regional onde os respondentes estão vinculados. |
| **Turma / Grupo** | **Coorte / Grupo de Atendimento / Segmento** | Agrupamento de respondentes submetidos a uma mesma rotina ou atividade. |
| **Professor / Instrutor** | **Operador de Campo / Agente Técnico** | Profissional responsável pela condução das atividades locais. |
| **Coordenador / Líder** | **Gestor Regional / Supervisor da Unidade** | Usuário administrativo que gerencia uma ou mais unidades/polos. |
| **Objeto (Termo de Fomento / Emenda)** | **Entidade de Escopo / Projeto / Programa** | O instrumento guarda-chuva, convênio, evento ou iniciativa à qual a pesquisa está atrelada. |
| **Desafio KYC do Aluno** | **Desafio de Validação Cadastral / KYC** | Mecanismo anti-fraude de confirmação de identidade antes de liberar o preenchimento. |

---

## 2. Inventário e Caminho Exato dos Arquivos

Todos os arquivos que constituem o módulo estão localizados exatamente nos caminhos abaixo na estrutura do repositório:

### 2.1. Camada de Banco de Dados (PostgreSQL / Supabase Migrations)
* Arquivo Principal: [`supabase/migrations/040_pesquisas_modulo.sql`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/supabase/migrations/040_pesquisas_modulo.sql)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\supabase\migrations\040_pesquisas_modulo.sql`
* Carga Inicial de Testes/Seed: [`supabase/migrations/041_seed_pesquisas.sql`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/supabase/migrations/041_seed_pesquisas.sql)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\supabase\migrations\041_seed_pesquisas.sql`
* Evolução de Gestores: [`supabase/migrations/042_pesquisa_coordenador.sql`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/supabase/migrations/042_pesquisa_coordenador.sql)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\supabase\migrations\042_pesquisa_coordenador.sql`
* Matriz de Permissões RLS: [`supabase/migrations/047_pesquisas_permissoes.sql`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/supabase/migrations/047_pesquisas_permissoes.sql)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\supabase\migrations\047_pesquisas_permissoes.sql`
* Vínculos Territoriais e Cadastrais: [`supabase/migrations/048_pesquisa_nucleo_turma_beneficiario.sql`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/supabase/migrations/048_pesquisa_nucleo_turma_beneficiario.sql)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\supabase\migrations\048_pesquisa_nucleo_turma_beneficiario.sql`

### 2.2. Camada de Serviço e Regras de Negócio
* Serviço Central do Módulo: [`web/src/services/pesquisasDb.ts`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/services/pesquisasDb.ts)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\services\pesquisasDb.ts`

### 2.3. Páginas da Interface (Next.js App Router)
* Listagem e Criação de Pesquisas: [`web/src/app/(dashboard)/pesquisas/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/page.tsx)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\app\(dashboard)\pesquisas\page.tsx`
* Gestão de Fluxos e Blocos: [`web/src/app/(dashboard)/pesquisas/fluxos/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/fluxos/page.tsx)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\app\(dashboard)\pesquisas\fluxos\page.tsx`
* Construtor Visual de Fluxo (Flow Builder): [`web/src/app/(dashboard)/pesquisas/fluxos/[id]/builder/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/fluxos/[id]/builder/page.tsx)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\app\(dashboard)\pesquisas\fluxos\[id]\builder\page.tsx`
* Distribuição, Métricas de Adesão e Disparo: [`web/src/app/(dashboard)/pesquisas/[id]/distribuir/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/[id]/distribuir/page.tsx)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\app\(dashboard)\pesquisas\[id]\distribuir\page.tsx`
* Relatórios Analíticos da Pesquisa: [`web/src/app/(dashboard)/pesquisas/[id]/relatorios/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/[id]/relatorios/page.tsx)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\app\(dashboard)\pesquisas\[id]\relatorios\page.tsx`
* Relatórios Globais e Filtro Multidimensional: [`web/src/app/(dashboard)/pesquisas/relatorios/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/relatorios/page.tsx)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\app\(dashboard)\pesquisas\relatorios\page.tsx`
* Inteligência e Distribuição Territorial: [`web/src/app/(dashboard)/pesquisas/territorial/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/territorial/page.tsx)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\app\(dashboard)\pesquisas\territorial\page.tsx`
* Gestão de Entidades de Escopo / Projetos: [`web/src/app/(dashboard)/pesquisas/objetos/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/objetos/page.tsx)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\app\(dashboard)\pesquisas\objetos\page.tsx`
* Motor de Execução Pública de Respostas: [`web/src/app/r/[token]/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/r/[token]/page.tsx)
  * Caminho absoluto: `c:\projetos\andorinha\cadastro de beneficiarios\web\src\app\r\[token]\page.tsx`

### 2.4. Componentes Visuais e Grafos
* Nós do React Flow:
  * [`web/src/components/pesquisas/builder/StartNode.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/builder/StartNode.tsx)
  * [`web/src/components/pesquisas/builder/EndNode.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/builder/EndNode.tsx)
  * [`web/src/components/pesquisas/builder/QuestionNode.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/builder/QuestionNode.tsx)
  * [`web/src/components/pesquisas/builder/SubflowNode.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/builder/SubflowNode.tsx)
  * [`web/src/components/pesquisas/builder/BlockNode.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/builder/BlockNode.tsx)
  * [`web/src/components/pesquisas/builder/ButtonEdge.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/builder/ButtonEdge.tsx)
* Mapa Coroplético Vetorial: [`web/src/components/pesquisas/MapaBrasil.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/MapaBrasil.tsx)
* Gestão de Categorias Transversais: [`web/src/components/pesquisas/CategoriasCampo.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/CategoriasCampo.tsx)
* Componente de Busca Assíncrona: [`web/src/components/ui/AsyncSelect.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/ui/AsyncSelect.tsx)

---

## 3. Arquitetura de Dados (Modelo Entidade-Relacionamento)

O modelo de dados do módulo foi projetado para acomodar tanto **flexibilidade de grafos condicionais arbitrários** quanto **alta performance em consultas analíticas relacionais**.

```
  ┌─────────────────────────┐         ┌─────────────────────────┐
  │         objeto          │         │      funcionarios       │
  │   (Entidade de Escopo)  │         │   (Gestores Regionais)  │
  └────────────┬────────────┘         └────────────┬────────────┘
               │ 1                                 │ 1
               │          N ┌──────────────┐ N     │
               └────────────┤   pesquisa   ├───────┘
                            └──┬───┬───┬───┘
                               │   │   │
              ┌────────────────┘   │   └────────────────┐
            N │                  1 │                  N │
   ┌──────────▼────────┐    ┌──────▼───────┐    ┌───────▼────────┐
   │      resposta     │    │    fluxo     │    │ unidades/polos │
   │  (Sessão Submissão│    │ (Grafo JSON) │    │   e coortes    │
   └──────────┬────────┘    └──────┬───────┘    └────────────────┘
            1 │                  1 │
            N │                  N │
   ┌──────────▼────────┐    ┌──────▼───────┐
   │   resposta_item   │    │   pergunta   │
   │  (Valores JSONB)  │    │ (Relacional) │
   └───────────────────┘    └──────────────┘
```

### 3.1. Descrição Técnica das Tabelas

1. **`categoria_campo`**:
   * **Objetivo:** Normaliza os eixos de agrupamento analítico e demográfico (ex: `Dados Pessoais`, `Gênero`, `Faixa Etária`, `Renda Familiar`, `Localidade`, `Nível de Satisfação`).
   * **Campos:** `id UUID PK`, `nome TEXT`, `user_id UUID`, `created_at TIMESTAMPTZ`.

2. **`objeto` (Entidade de Escopo / Projeto)**:
   * **Objetivo:** Registra os projetos, eventos ou iniciativas corporativas aos quais pesquisas estão associadas.
   * **Campos:** `id UUID PK`, `nome TEXT`, `descricao TEXT`, `tipo TEXT ('projeto' | 'evento')`, `termo_fomento TEXT`, `codigo_objeto TEXT`, `codigo_programa TEXT`, `nome_programa TEXT`, `created_at TIMESTAMPTZ`.

3. **`fluxo` (Definição de Lógica do Questionário)**:
   * **Objetivo:** Guarda o modelo estrutural do formulário e o grafo de nós.
   * **Campos:**
     * `id UUID PK`.
     * `nome TEXT` e `descricao TEXT`.
     * `tipo TEXT CHECK (tipo IN ('fluxo', 'bloco'))`: Determina se é um fluxo autônomo completo ou um bloco modular para ser exibido em tela única agrupada.
     * `flow_data JSONB`: Armazena o estado do grafo React Flow (`nodes` com posições `{x, y}` e `edges` com regras de salto condicional).

4. **`pesquisa` (Instância Publicável)**:
   * **Objetivo:** Representa a campanha de coleta ativa ou em rascunho.
   * **Campos:**
     * `id UUID PK`.
     * `titulo TEXT`, `descricao TEXT`.
     * `token TEXT UNIQUE`: Slug seguro de acesso público (ex: `/r/aBc123XyZ`).
     * `publicada BOOLEAN DEFAULT false`: Flag que bloqueia ou libera o acesso ao formulário.
     * `exigir_cpf BOOLEAN DEFAULT false`: Flag que ativa o gateway de documento do respondente.
     * `objeto_id UUID FK`: Projeto associado.
     * `coordenador_id UUID FK`: Gestor responsável pela campanha.
     * `nucleo_id UUID FK` e `turma_id UUID FK`: Restrição territorial/coorte opcional.
     * `fluxo_id UUID FK`: Estrutura de perguntas aplicada.

5. **`pergunta` (Extração Relacional do Fluxo)**:
   * **Objetivo:** Tabela relacional gerada a partir dos nós do fluxo para viabilizar queries analíticas rápidas sem necessidade de parser de JSONB no Postgres.
   * **Campos:**
     * `id UUID PK`, `fluxo_id UUID FK`.
     * `tipo TEXT`: Tipos primitivos suportados:
       * Textuais: `texto_curto`, `textarea`.
       * Seleção: `multipla` (com `min_respostas` e `max_respostas`).
       * Contatos: `whatsapp`, `email`.
       * Validados: `cpf`, `cep`, `estado`, `cidade`, `bairro`, `logradouro`, `numero`.
       * Numéricos/Escala: `numero`, `avaliacao` (estrelas de 1 a 5).
     * `obrigatoria BOOLEAN`, `ordem INTEGER`.
     * `config JSONB`: Armazena opções `{id, texto}` e limites.
     * `categoria_id UUID FK`: Vinculação com o eixo demográfico.

6. **`resposta` e `resposta_item`**:
   * `resposta`: Cabeçalho da submissão com rastreamento:
     * `id UUID PK`, `pesquisa_id UUID FK`.
     * `fingerprint TEXT`: Hash do dispositivo do respondente.
     * `cpf TEXT`: Documento normalizado (quando exigido).
     * `beneficiario_id UUID FK`: Identificador do respondente autenticado.
     * `matricula TEXT`: Código de registro institucional.
     * `nucleo_id UUID FK`, `turma_id UUID FK`: Snapshot de unidade e coorte.
     * `created_at TIMESTAMPTZ`: Carimbo de data/hora UTC.
   * `resposta_item`: Tuplas de respostas individuais:
     * `id UUID PK`, `resposta_id UUID FK`, `pergunta_id UUID FK`, `valor JSONB`.

---

## 4. O Construtor Visual de Grafos (Flow Builder)

Implementado com `@xyflow/react` em [`fluxos/[id]/builder/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/fluxos/[id]/builder/page.tsx).

### 4.1. Tipos de Nós Especializados
* **`StartNode`:** Início obrigatório do formulário.
* **`EndNode`:** Fim do fluxo que ativa a submissão das respostas acumuladas.
* **`QuestionNode`:**
  * Apresenta o tipo da questão, título e badge de obrigatoriedade.
  * **Handles Condicionais Dinâmicos:** Se a pergunta for do tipo `multipla` com resposta única (`max_respostas === 1`), cada opção cadastrada renderiza um ponto de conexão exclusivo à direita (`Position.Right`) indexado pelo UUID da opção ([`QuestionNode.tsx#L108-L124`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/builder/QuestionNode.tsx#L108-L124)). Isso permite criar ramificações condicionais diretas sem regras textuais externas.
* **`SubflowNode`:** Referencia um outro fluxo cadastrado, permitindo aninhamento modular de perguntas.
* **`BlockNode`:** Aponta para um fluxo do tipo `bloco`, instruindo o motor de execução a renderizar todas as perguntas desse bloco simultaneamente em tela única (ex: formulário de endereço completo).

### 4.2. Arestas Interativas (`ButtonEdge`)
* As arestas usam curvas de Bezier com área de colisão expandida (`strokeWidth={15}` transparente) para facilitar o foco do mouse.
* Conexões condicionais recebem o badge visual `"Se: [Nome da Opção]"` em cor de destaque e exibem botão de exclusão rápido no hover.

### 4.3. Sincronização Relacional
Ao persistir o fluxo, a função [`handleSaveFlow`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/fluxos/[id]/builder/page.tsx#L534-L605) realiza duas operações atômicas:
1. Grava o JSON integral do grafo (`nodes` e `edges`) na coluna `flow.flow_data`.
2. Ordena os nós do tipo `question` com base em sua posição vertical no canvas (`position.y`) e chama [`dbService.syncPerguntas`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/services/pesquisasDb.ts#L445-L457), garantindo que a tabela `pergunta` reflita fielmente a sequência espacial do builder.

---

## 5. Motor de Execução Pública (`/r/[token]`)

A página [`web/src/app/r/[token]/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/r/[token]/page.tsx) funciona como uma **máquina de estados finitos** guiada pelo grafo:

### 5.1. Algoritmo de Transição de Estados
1. O motor inicia no nó conectado à aresta que parte de `start`.
2. A cada resposta do usuário, o sistema executa a validação do tipo primitivo (validação de CPF, formato de e-mail, máscara telefônica, dígitos de CEP, etc.).
3. Na função [`handleAvancar`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/r/[token]/page.tsx#L882-L959):
   * Se for pergunta com múltiplas opções, procura uma aresta cujo `sourceHandle` ou `edge.data.opcaoId` coincida com a opção marcada.
   * Se não houver correspondência condicional, segue a aresta padrão incondicional (`sourceHandle: 'output'`).
4. **Pilha de Subfluxos Recursivos (`subflowStack`):**
   * Ao encontrar um nó `subflow`, o contexto atual (respostas acumuladas, lista de perguntas, nó de retorno) é empurrado para a pilha [`subflowStack`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/r/[token]/page.tsx#L94-L95).
   * O motor carrega as perguntas do subfluxo.
   * Ao atingir o `end` do subfluxo, a função [`finalizarFluxoOuSubfluxo`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/r/[token]/page.tsx#L817-L880) desempilha o contexto pai, mescla as respostas e retoma a navegação do fluxo primário.

### 5.2. Automações de Campo em Tempo Real
* **Enriquecimento Dinâmico de Cidades:** Se houver um campo do tipo `estado` selecionado, um efeito colateral consulta automaticamente a API de localidades do IBGE e preenche dinamicamente o dropdown do campo `cidade` sem recarregar a tela ([`page.tsx#L330-L346`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/r/[token]/page.tsx#L330-L346)).

---

## 6. Camada de Segurança, Verificação de Identidade (KYC) e Anti-Fraude

O módulo implementa um conjunto triplo de proteção para assegurar a autenticidade das respostas:

### 6.1. Ofuscação de Parâmetros na URL
Para links individuais distribuídos a respondentes cadastrados:
* O sistema não expõe o ID de registro ou matrícula em texto puro na URL.
* As funções [`encodeMatricula`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/services/pesquisasDb.ts#L7-L24) e [`decodeMatricula`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/services/pesquisasDb.ts#L26-L46) aplicam uma máscara bitwise com chave constante (`XOR Salt: "andorinha_beneficiario_2026"`) e codificam o resultado em Base64 URL-safe (sem os caracteres `+`, `/` e `=`).
* Isso impede que usuários forjem links alterando sequenciais na barra de endereços.

### 6.2. Desafio Cadastral Dinâmico (KYC Anti-Spoofing)
Implementado em [`getDesafioBeneficiario`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/services/pesquisasDb.ts#L609-L737):
* Quando um respondente acessa seu link individual (`/r/[token]?m=[encoded]`), antes de visualizar o questionário, o sistema consulta a base institucional e gera um desafio com 4 a 5 perguntas de verificação pessoal:
  1. **Primeiro Nome:** Nome real + 2 distratores aleatórios de outros respondentes reais da mesma unidade operacional.
  2. **Dia de Nascimento:** Dia real + 2 distratores calculados matematicamente (+7 dias, -4 dias).
  3. **Mês de Nascimento:** Mês real + 2 distratores rotativos da lista de meses.
  4. **Ano de Nascimento:** Ano real + 2 distratores calculados (+2 anos, -2 anos).
  5. **Último Sobrenome:** Sobrenome real + 2 distratores de outros respondentes da mesma unidade.
* Caso o respondente erre qualquer item, o questionário é bloqueado.

### 6.3. Bloqueio de Duplicidade
* **Device Fingerprint:** Armazenamento em `localStorage` de hash gerado a partir de User-Agent, resolução de tela e entropia aleatória (`hasDeviceResponded`).
* **Matrícula / ID:** [`hasMatriculaResponded`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/services/pesquisasDb.ts#L502-L512) verifica se o registro já concluiu a pesquisa.
* **Documento (CPF):** [`hasCpfResponded`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/services/pesquisasDb.ts#L739-L752) impede submissões duplicadas normalizando os dígitos numéricos.

---

## 7. Módulo de Distribuição e Engajamento Multicanal

Localizado em [`[id]/distribuir/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/[id]/distribuir/page.tsx):

### 7.1. Monitoramento de Coortes em Tempo Real
Quando a pesquisa está associada a uma unidade ou grupo:
* Consulta os membros ativos através de [`getAlunosTurmaComStatus`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/services/pesquisasDb.ts#L605-L607).
* Computa quatro métricas principais:
  * **Total de Membros Cadastrados**.
  * **Total de Respondidos**.
  * **Total de Pendentes**.
  * **Taxa de Adesão / Conversão (%)**.

### 7.2. Canais de Disparo
* **QR Code:** Renderização em tempo real via `qrcode.react` (`QRCodeCanvas`) com botão de download em arquivo `.png` de alta resolução para impressão de cartazes de campo.
* **Mensageria Direta (WhatsApp):** Cada linha da tabela de respondentes pendentes conta com link de disparo pré-formatado via API do WhatsApp (`https://api.whatsapp.com/send?phone=...&text=...`), adaptando a mensagem para o titular ou para o contato de referência cadastrado.

---

## 8. Inteligência Analítica, Relatórios e Mapas Territoriais

### 8.1. Relatórios e Cruzamento de Dados
* **Individual por Pesquisa:** [`[id]/relatorios/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/[id]/relatorios/page.tsx).
* **Global / Multi-Pesquisa:** [`relatorios/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/relatorios/page.tsx).
* **Filtros por Tags com Lógica AND / OR:**
  * O sistema varre todas as opções de múltipla escolha e respostas textuais e monta um índice dinâmico em memória.
  * O usuário pode adicionar tags compostas (`[Pergunta]: [Valor]`) e alternar a lógica de agregação entre `AND` (interseção estrita) e `OR` (união flexível).
* **Gráficos Analíticos:** Renderização automática com `recharts` (`BarChart`, `ResponsiveContainer`, `Cell`) para questões de múltipla escolha e notas de avaliação.
* **Exportação XLS:** Geração instantânea de planilhas Excel via `xlsx` (SheetJS) com cabeçalhos normalizados e data/hora local.
* **Presets Salvos:** Permite persistir filtros complexos na tabela `relatorio_salvo`.

### 8.2. Módulo Territorial (Mapas Coropléticos)
Localizado em [`territorial/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/pesquisas/territorial/page.tsx) e [`MapaBrasil.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/pesquisas/MapaBrasil.tsx):
* **Renderização Vetorial:** Usa `react-simple-maps` (`ComposableMap`, `Geographies`, `Geography`).
* **Drilldown Hierárquico:**
  * No escopo nacional, renderiza os 27 estados da federação com base em GeoJSON centralizado.
  * Ao clicar em um estado específico, o componente consulta em tempo real a malha municipal do IBGE:
    ```
    https://servicodados.ibge.gov.br/api/v3/malhas/estados/{UF}?formato=application/vnd.geo+json&intragranularidade=municipio
    ```
  * Recalcula a projeção geográfica (`center` e `scale`) dinamicamente com base nos limites cartesianos (bounding box) da malha do estado.
* **Mapa de Calor (D3 Scale):** Usa `d3-scale` (`scaleLinear`) para mapear o volume de respostas por localidade em gradientes de cor, acompanhado de um ranking lateral ordenado com barras de progresso percentuais.

---

## 9. Mecanismo Complementar de Busca Textual e Filtros

Para além dos formulários e pesquisas analíticas, a busca textual do sistema é padronizada através do componente [`AsyncSelect.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/ui/AsyncSelect.tsx):
* **Debounce Assíncrono:** Temporizador de 300ms que previne sobrecarga de requisições ao Supabase durante a digitação.
* **Consulta Parcial:** Executa consultas assíncronas no PostgreSQL usando filtros `.ilike()` e `.or()`, retornando opções formatadas em pares `{ value, label, sublabel }`.
