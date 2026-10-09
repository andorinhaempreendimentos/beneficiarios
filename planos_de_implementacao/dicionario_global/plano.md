# Plano de Implementação: Vocabulário Dinâmico por Objeto e Atividade

## 1. Contexto e Objetivo
Tornar o vocabulário da aplicação 100% dinâmico e agnóstico ao domínio de negócio (ex: Esportes, Educação, Cursos Profissionalizantes, Assistência Social).
O vocabulário atua em dois níveis hierárquicos:
1. **Nível Macro (Objeto)**: Define os termos padrão do projeto ativo (refletidos no Sidebar, menus principais e visões agregadas).
2. **Nível Micro (Atividade)**: Quando uma atividade tiver termos próprios configurados (ex: "Futebol" usa "Atleta" e "Treino", enquanto um "Curso de Informática" no mesmo objeto usa "Aluno" e "Aula"), os termos da atividade têm precedência sobre os do objeto.

---

## 2. Regra de Resolução Hierárquica
Ao renderizar qualquer termo no sistema:
```
1. Existe termo na Atividade ativa?
   ├── SIM ➔ Usar termo da Atividade (termo_grupo, termo_sessao, termo_responsavel, termo_participante)
   └── NÃO ➔ Ir para o passo 2

2. Existe termo no Objeto ativo selecionado?
   ├── SIM ➔ Usar termo do Objeto (termo_grupo, termo_sessao, termo_responsavel, termo_participante)
   └── NÃO ➔ Ir para o passo 3

3. Fallback do Sistema:
   └── Usar TERMOS_PADRAO (configuracao global ou padroes do sistema)
```

---

## 3. Fases de Execução

### Fase 1: Banco de Dados (Supabase)
- **1.1. Tabela `objetos`**:
  - Adicionar colunas:
    - `termo_grupo` (`VARCHAR(50)`, default `'Grupo'`)
    - `termo_sessao` (`VARCHAR(50)`, default `'Sessão'`)
    - `termo_responsavel` (`VARCHAR(50)`, default `'Professor'`)
    - `termo_participante` (`VARCHAR(50)`, default `'Beneficiário'`)
- **1.2. Tabela `usuarios`**:
  - Adicionar coluna `objeto_id` (`UUID`, foreign key para `objetos(id)`, nullable) para vincular usuários restritos a um objeto específico.
- **1.3. Dados Iniciais**:
  - Preencher vocabulário nos objetos existentes no banco.

---

### Fase 2: Camada de Tipos e Serviços (TypeScript)
- **2.1. Tipos**:
  - `web/src/lib/types.ts`: Atualizar interface `Objeto` e `Usuario`.
  - `web/src/lib/supabase/types.ts`: Atualizar tipos de `objetos` e `usuarios`.
- **2.2. Serviços**:
  - `web/src/lib/api/services.ts`: Atualizar `objetosApi` (`list`, `getById`, `create`, `update`).
- **2.3. Interface de Edição de Objeto**:
  - Incluir campos de vocabulário no formulário de Objeto (`ObjetoForm.tsx`).

---

### Fase 3: Provedores de Estado e Dicionário (Frontend)
- **3.1. `LocationFilterProvider.tsx`**:
  - Adicionar estado `objetoId` (`"Todos"` ou UUID do objeto ativo).
  - Persistir seleção no `localStorage` (`andorinha_filtro_objeto`).
  - Carregar lista de objetos disponíveis via `objetosApi`.
  - Integrar filtro em cascata: quando um objeto for selecionado, restringir as organizações e núcleos às pertencentes a ele.
- **3.2. `DictionaryProvider.tsx`**:
  - Conectar com `LocationFilterProvider` e `useAuth`.
  - Identificar o objeto ativo atual.
  - Expandir função `t()` para suportar override de atividade:
    `t(conceito, fallback, plural, overrideAtividade?)`.
  - Expor helper hook `useTermosAtividade(atividade)` ou passar contexto local.

---

### Fase 4: Barra de Status Superior (`TopLocationBar.tsx`)
- **4.1. Seletor de Objeto**:
  - Adicionar dropdown "Objeto" como primeiro filtro da barra de status.
  - Para super admin / gestor geral: permitir alternar livremente entre objetos disponíveis.
  - Para usuário vinculado a objeto específico: fixar o objeto, impedindo ou desabilitando a troca.
- **4.2. Feedback Visual**:
  - Exibir indicação clara do objeto ativo selecionado.

---

### Fase 5: Sidebar e Telas Globais
- **5.1. `Sidebar.tsx`**:
  - Garantir que todos os rótulos de itens de menu e cabeçalhos de seção usem a função `t()`:
    - Beneficiários / Atletas / Alunos
    - Grupos / Turmas / Equipes
    - Professores / Treinadores / Instrutores
    - Aulas / Treinos / Sessões
  - Ao alternar o objeto na barra superior, os nomes do Sidebar devem mudar imediatamente sem recarregar a página.
- **5.2. Telas Específicas de Atividades e Grupos**:
  - Passar a atividade vinculada para o hook de vocabulário nas telas de chamada, frequência e matrículas.

---

### Fase 6: Validação e Garantia de Qualidade
- **6.1. Integridade de Banco**:
  - Conferir dados no Supabase.
- **6.2. Testes de Comportamento**:
  - Alternância de objeto no topo e reação imediata do Sidebar.
  - Precedência dos termos de uma atividade específica quando visualizada.
- **6.3. Compilação TypeScript**:
  - `tsc --noEmit` com 0 erros.
