# Tasklist: Vocabulário Dinâmico por Objeto e Atividade

- [ ] **Tarefa 1: Banco de Dados (Supabase)** — Criar colunas de vocabulário na tabela `objetos` (`termo_grupo`, `termo_sessao`, `termo_responsavel`, `termo_participante`) e coluna `objeto_id` em `usuarios`.
- [ ] **Tarefa 2: Tipos e Serviços (TypeScript)** — Atualizar `web/src/lib/types.ts`, `web/src/lib/supabase/types.ts` e `services.ts` (`objetosApi`, `usuariosApi`).
- [ ] **Tarefa 3: Provedor de Localização e Filtros** — Adicionar `objetoId` no `LocationFilterProvider.tsx` com persistência em `localStorage` e filtro em cascata.
- [ ] **Tarefa 4: Provedor de Dicionário Hierárquico** — Atualizar `DictionaryProvider.tsx` para aplicar resolução hierárquica (`Atividade` > `Objeto` > `Padrão`).
- [ ] **Tarefa 5: Barra de Topo (`TopLocationBar`)** — Inserir seletor de Objeto no topo e aplicar restrição para usuário vinculado.
- [ ] **Tarefa 6: Sidebar Dinâmico** — Atualizar `Sidebar.tsx` para refletir termos dinâmicos do objeto ativo em menus e seções.
- [ ] **Tarefa 7: Formulário de Objeto** — Adicionar campos de vocabulário no formulário de edição/criação de Objeto (`ObjetoForm.tsx`).
- [ ] **Tarefa 8: Validação e Compilação** — Executar compilação TypeScript (`tsc --noEmit`), testar alternância de objeto e precedência de atividade.
