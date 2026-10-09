# Tasklist: Cadastro Rápido de Alunos pelos Professores

- [x] **Tarefa 1: Estrutura da API (`/api/cadastro-alunos/[nucleoId]` e POST)** — Criar endpoint dedicado para buscar informações do núcleo, professor e turmas existentes, e endpoint POST para salvar os alunos cadastrados com segurança em `respostas_conferencia_beneficiarios` sem tocar no banco oficial.
- [x] **Tarefa 2: Interface Mobile-First de Cadastro Rápido (`/cadastro-alunos/[nucleoId]`)** — Desenvolver a página com cabeçalho do núcleo/professor, formulário dos 5 campos (nome, nascimento, sexo, CPF, turma), cálculo automático de idade, sugestão visual de turma e listagem interativa dos alunos adicionados com contagem e remoção.
- [x] **Tarefa 3: Persistência, Confirmação e Tela de Sucesso** — Integrar envio para a API, tratamento de erros, confirmação antes do envio final e tela de agradecimento com resumo da quantidade de alunos cadastrados.
- [x] **Tarefa 4: Atualização dos Links no Painel Administrativo (`/conferencia-beneficiarios/respostas`)** — Atualizar o gerador de links para que os 13 núcleos sem alunos tenham o link direcionado para `/cadastro-alunos/[nucleoId]` com texto correspondente de WhatsApp.
- [ ] **Tarefa 5: Validação TypeScript, Build e Deploy em Produção** — Executar checagem estática de tipos (`tsc --noEmit`), commit, push para o repositório remoto e validação do deploy no Vercel.
