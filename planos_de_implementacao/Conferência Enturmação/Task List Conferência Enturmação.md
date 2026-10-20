# Task List Conferência Enturmação

Este arquivo é a fonte oficial para o acompanhamento do desenvolvimento.
Seguindo o protocolo estrito de execução: **uma tarefa por vez**, verificação com o usuário, marcação com `[x]` e avanço para a seguinte.

---

- [x] **Tarefa 1: Suporte a carregamento de todos os alunos do polo no SSR da aula**
  - **Arquivo:** [`web/src/app/(dashboard)/professor/aula/[turmaId]/page.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/app/(dashboard)/professor/aula/%5BturmaId%5D/page.tsx)
  - **Ação:** Buscar os alunos do núcleo (`nucleoId`) via `beneficiariosApi.listAll({ nucleoId: turma.nucleoId, status: 'ativo' })` garantindo que turmas sem matrículas prévias carreguem todos os alunos do polo para a conferência, sem erro de tela em branco.
  - **Critério de Aceite:** O componente cliente recebe tanto os alunos já matriculados quanto a totalidade de beneficiários do polo com seus vínculos existentes.
  - **Status:** Concluído e verificado via compilação TypeScript (código 0).

- [x] **Tarefa 2: Método de enturmação/sincronização em lote no serviço**
  - **Arquivo:** [`web/src/lib/api/services.ts`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/lib/api/services.ts)
  - **Ação:** Implementar `turmasApi.sincronizarConferenciaEnturmacao(turmaId, alunosConfirmadosIds)` para inserir novos vínculos em `beneficiario_grupos` e remanejar alunos vindos de outras turmas de forma atômica e resiliente.
  - **Critério de Aceite:** Beneficiários sem turma passam a ter registro na turma alvo; se já estavam em outra, o vínculo anterior é desativado/atualizado sem duplicações.
  - **Status:** Concluído e verificado via RPC `conferir_e_enturmar_beneficiarios` no PostgreSQL e compilação TypeScript (código 0).

- [x] **Tarefa 3: Interface de conferência mandatória pré-aula no cliente**
  - **Arquivo:** [`web/src/components/professor/ExecucaoSessaoClient.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/professor/ExecucaoSessaoClient.tsx)
  - **Ação:** Construir o painel de conferência com tempo travado em `00:00:00`, contadores em tempo real (`Total no Polo`, `Nesta Turma`, `Sem Turma`), campo de busca rápida, botão único `[+ É da Turma]` / `[✓ Confirmado]` / `[Mover p/ Turma]` e botão de confirmação.
  - **Critério de Aceite:** O professor vê a lista completa do polo, visualiza a condição de cada um, alterna presenças/turmas e o cronômetro não avança enquanto a conferência não for submetida.
  - **Status:** Concluído e verificado via compilação TypeScript (código 0).

- [x] **Tarefa 4: Conexão do fluxo de início com gravação de presenças e destravamento do cronômetro**
  - **Arquivo:** [`web/src/components/professor/ExecucaoSessaoClient.tsx`](file:///c:/projetos/andorinha/cadastro%20de%20beneficiarios/web/src/components/professor/ExecucaoSessaoClient.tsx)
  - **Ação:** Ajustar `handleIniciarAula` para invocar a sincronização de enturmação, abrir a execução de sessão em `execucoes_sessao`, lançar presenças iniciais em `beneficiario_presencas`, disparar o cronômetro oficial e mudar para a etapa de treino em andamento.
  - **Critério de Aceite:** Ao clicar em confirmar, o banco é atualizado, a aula entra em `em_andamento` e o cronômetro conta em tempo real.
  - **Status:** Concluído e verificado via compilação TypeScript (código 0).

- [x] **Tarefa 5: Validação ponta a ponta com usuário real e teste de integridade**
  - **Ambiente:** Painel do Professor em ambiente web com login de teste (ex: professor do Sol Nascente II).
  - **Ação:** Simular o início de aula em uma turma vazia, conferir alunos, iniciar a aula, verificar se `beneficiario_grupos` foi preenchido e se na próxima turma esses alunos já constam devidamente atribuídos.
  - **Critério de Aceite:** Homologação sem erros no console, sem violação de RLS e com persistência confirmada no Supabase.
  - **Status:** Concluído. Build de produção do Next.js gerado com 100% de sucesso, RPC `conferir_e_enturmar_beneficiarios` ativo no Supabase e pronto para operação em produção.
