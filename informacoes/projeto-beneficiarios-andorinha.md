# Projeto Beneficiários Andorinha

## 1. Visão Geral

Sistema para controlar a execução de atividades de prestação de serviços realizadas por organizações (institutos, ONGs, entidades etc.) em benefício de participantes de programas incentivados/fomentados pelo governo — majoritariamente na área do esporte.

Além do acompanhamento das atividades, o sistema deve controlar:
- Recursos Humanos (folha de ponto por profissional)
- Equipamentos e materiais adquiridos para a execução do projeto
- Relatórios de participação e demais relatórios gerenciais/oficiais

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Hospedagem | Hostinger Business Web Hosting (Node.js Web App, processo persistente) |
| Backend | Node.js + TypeScript + NestJS |
| Banco de dados | MySQL |
| Frontend (painel admin/organização) | React + Next.js + Tailwind |
| Interface de campo (instrutor/beneficiário) | PWA mobile-first (sem app nativo) |
| Armazenamento de arquivos | Configurável pelo admin: disco do servidor (padrão) **ou** S3-compatible externo (AWS S3 / Cloudflare R2) — ver seção 6.2 |
| Geração de PDF | PDFKit (ou @react-pdf/renderer) — geração nativa em Node, sem depender de navegador headless |
| Geração de Excel | ExcelJS |
| Autenticação | JWT + RBAC (perfis: admin, gestor, funcionário/instrutor, beneficiário) |

## 3. Hierarquia de Dados

```
OBJETO (Evento ou Projeto)
  └── Organização Responsável (instituto/ONG/entidade)
        └── Local (ex.: escola)
              └── Turma
                    └── Atividade (ex.: "matéria")
                          └── Instrutor/Professor
                                └── Beneficiário (aluno)
```

## 4. Perfis de Usuário e Permissões

| Perfil | Descrição |
|---|---|
| **Admin** | Acesso total ao sistema, sem restrições |
| **Gestor** | Usuário designado pelo admin, com permissões configuráveis por uma **tabela de permissões** (ações liberadas/restritas por módulo) |
| **Funcionário/Instrutor** | Perfil operacional, restrito a: comprovar realização de atividades (fotos), bater o próprio ponto (folha de ponto), usar a lista de presença dos beneficiários da(s) turma(s) sob sua responsabilidade |
| **Beneficiário** (indireto) | Não acessa um painel administrativo; interage via link público de inscrição |

**Tabela de Permissões (Gestor):** matriz configurável pelo admin, definindo por módulo/ação (ex.: cadastrar objeto, aprovar inscrição, editar turma, gerar relatório) se determinado gestor tem permissão. Deve ser possível criar múltiplos "perfis de gestor" (templates de permissão) e aplicá-los a usuários, além de ajustes individuais quando necessário.

## 5. Módulos e Entidades

### 5.1 Objeto (Projeto/Evento)
Cadastro de Objetos (projetos, eventos) que dão origem a toda a estrutura abaixo.

**Campos do cadastro:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| Nome do Projeto | Sim | Nome do projeto |
| Descrição | Não | Detalhes sobre o projeto |
| Termo de Fomento | Não | Número do termo |
| Código do Objeto | Não | Código identificador |
| Código do Programa | Não | Código do programa associado |
| Nome do Programa | Não | Nome do programa associado |

**Duração do Objeto:**
O cadastro deve permitir escolher o tipo de duração:
- **Evento Pontual** — ocorre em um único dia. Campo: *Data do Evento*.
- **Evento de Período** (ex.: uma corrida de vários dias) — ocorre ao longo de um intervalo. Campos: *Data de Início* e *Data de Término*.

### 5.2 Organização
- Cadastro de organizações responsáveis pela execução (institutos, ONGs, associações etc.)
- Atributo: **Tipo de organização** (Instituto, ONG, Associação, etc.)

### 5.3 Pessoal (Recursos Humanos)
- Cadastro de instrutores/professores (e demais funções, ex.: Auxiliar Operacional, Monitor)
- Confirmação de realização de atividade com envio de fotos pelo instrutor/professor
- Bater ponto (autoatendimento), via QR Code
- Folha de ponto por profissional (carga horária, telefone, e-mail)

### 5.4 Patrimonial / Equipamentos
- Listagem de equipamentos utilizados nas atividades/projetos
- Controle de estoque com envio de foto e nota fiscal na aquisição de materiais

### 5.5 Locais (Núcleos/Polos)
- Cadastro de localidades onde as atividades são realizadas (ex.: escolas, núcleos, polos)
- **Endereço via API do IBGE:** no cadastro do Local, buscar/preencher estado, cidade e demais dados de localidade com base na API do IBGE, reduzindo erro de digitação e padronizando os dados usados depois na validação por cidade (ver seção 5.9)

### 5.6 Turmas
- Cada Local pode receber uma ou mais Atividades, divididas em Turmas
- Turmas devem controlar:
  - Disponibilidade de horários
  - Vagas disponíveis/ocupadas
  - Disponibilidade e/ou presença dos professores
- **Turma Exclusiva:** cada turma tem um indicador de exclusividade — se marcada como exclusiva, o beneficiário matriculado nela não pode se inscrever em nenhuma outra turma/atividade; se não exclusiva, pode acumular outras turmas (ver regra de sobreposição em 5.8)

### 5.7 Atividades
- Cada Atividade (a "matéria") tem:
  - **Idade limite** (mínima e/ou máxima) — usada para validar a inscrição do beneficiário
  - **Grade horária** — usada para verificar disponibilidade e detectar sobreposição de horário entre turmas/atividades diferentes

### 5.8 Beneficiários
- Cadastro de pessoas que usufruem de uma atividade — vinculadas a uma turma, um instrutor, um local/núcleo/polo e um objeto executado por uma organização
- Lista de presença

**Vínculo Beneficiário × Turma:**
- Se a turma do beneficiário for **exclusiva**, ele não pode se inscrever em outra turma/atividade
- Se **não exclusiva**, o sistema deve checar, no momento da inscrição, se o beneficiário já está inscrito em outra(s) turma(s) — inclusive de outros locais/núcleos — e alertar/bloquear em caso de **sobreposição de horário** (com base na grade horária da Atividade)
- **Limite de idade** validado contra a Atividade
- **Documentos exigidos:** configurável pelo admin (por Atividade ou globalmente) — decide se CPF, RG, comprovante de residência etc. são obrigatórios. Padrão sugerido: solicitar CPF e dados básicos, **sem torná-los obrigatórios**

### 5.9 Cadastro Público de Beneficiários (Inscrições)

- Cada link de inscrição pública já é gerado vinculado a **Turma → Local → Organização → Objeto**, o que naturalmente restringe quem pode se inscrever em cada turma (sem necessidade de GPS)
- Quando o CEP for solicitado (opcional, dependendo da configuração), o sistema compara a **cidade do CEP** com a cidade do Local, como camada adicional de consistência — não é uma trava rígida, é um alerta/validação
- **Tipos de aprovação** (configurável por Objeto/Organização/Turma):
  - **Automática** — inscrição já é aprovada no ato
  - **Manual** — inscrição fica pendente até aprovação por gestor, admin ou instrutor (se autorizado)

**Controle de concorrência em inscrições (evitar overbooking):**

Como pode haver concorrência real na hora da inscrição (principalmente em turmas de aprovação automática com poucas vagas), sugiro o seguinte fluxo:

1. Assim que o usuário preenche os dados mínimos (CPF, quando obrigatório, ou nome + dados básicos) e clica em **"Confirmar Interesse"**, o sistema cria uma **reserva temporária de vaga** (status `pendente_confirmação`) com um **TTL curto** (ex.: 10–15 minutos)
2. Essa reserva computa no total de "vagas ocupadas" da turma, para que outro usuário não veja/ocupe a mesma vaga simultaneamente (checagem feita em transação com lock, comparando `vagas_totais - (matriculados + reservas_ativas)`)
3. Se o usuário concluir a inscrição dentro do prazo, a reserva vira:
   - Inscrição **confirmada** (se aprovação automática), ou
   - Inscrição **pendente de aprovação manual** (some da contagem de "vaga livre" mas aguarda gestor/admin/instrutor)
4. Se o TTL expirar sem confirmação, a reserva é liberada automaticamente (job de limpeza periódico, ou checagem "lazy" no próximo acesso à turma) e a vaga volta a ficar disponível
5. Se a turma esgotar durante a espera de alguém, o sistema deve avisar claramente ("vaga não garantida até a confirmação") e, opcionalmente, oferecer **lista de espera**

### 5.10 Relatórios
- Página de relatórios com **filtros compostos** (por objeto, organização, local, turma, atividade, período, status de beneficiário etc.) para montar relatórios de diferentes áreas, tipos e objetivos — sem um layout rígido único
- A planilha de referência do Ministério do Esporte enviada mostra o tipo de informação esperada (não é um formulário fixo a ser replicado literalmente, mas dá o vocabulário de campos):
  - Cabeçalho: Entidade, Projeto, Termo de Fomento
  - Por Núcleo/Subnúcleo: nome, dia/horário de funcionamento, endereço
  - Recursos Humanos por função (Instrutor, Auxiliar Operacional, Monitor etc.): carga horária, telefone, e-mail
  - Beneficiários: nome, CPF, idade, modalidade/atividade esportiva
- Exportação em PDF e Excel

## 6. Configurações Gerais do Sistema

### 6.1 Dicionário de Termos (Glossário Configurável)
Área de configuração onde o admin define a **nomenclatura usada em toda a interface**, permitindo adaptar o sistema ao vocabulário de cada contrato/programa sem alterar código. Exemplos de termos que devem ser configuráveis:

| Conceito interno | Opções de nomenclatura (exemplos) |
|---|---|
| Local | Núcleo, Polo, Local, Unidade |
| Beneficiário | Beneficiário, Aluno, Participante |
| Objeto | Projeto, Evento, Termo |
| Instrutor | Instrutor, Professor, Educador |
| Turma | Turma, Grupo, Classe |

O sistema deve armazenar o termo interno fixo (para lógica/banco de dados) e mapear para o **label de exibição** configurado — trocar o termo não deve exigir migração de dados, apenas mudar o rótulo na tela.

### 6.2 Armazenamento de Arquivos (Configurável)

Na área administrativa, o admin poderá escolher onde os arquivos do sistema (fotos de comprovação de aula, notas fiscais, documentos de beneficiários etc.) são armazenados:

- **Disco do próprio servidor (Business Web Hosting)** — opção padrão, sem custo/serviço adicional
- **Serviço externo S3-compatible** (AWS S3 ou Cloudflare R2) — para maior escalabilidade, CDN de entrega e independência da cota de disco do plano de hospedagem

**Requisitos técnicos:**
- A camada de acesso a arquivos deve ser implementada como uma interface única no backend (`StorageService`), com uma implementação para disco local e outra para S3-compatible, ambas atrás do mesmo contrato (`upload()`, `getUrl()`, `delete()`) — isso permite trocar o provedor pela configuração, sem alterar o restante do código
- A troca de provedor deve poder ser feita a qualquer momento pela área administrativa; arquivos já enviados antes da troca **não são migrados automaticamente** entre destinos (migração, se necessária, é um processo à parte)

**Estratégia de deploy (decidida):** o deploy no Business Web Hosting será feito manualmente via `git pull` no servidor (SSH), não pelo pipeline automático de build da Hostinger. Isso garante um deploy incremental — arquivos não rastreados pelo Git (como os uploads em produção) nunca são apagados. Estrutura:
- `uploads/.gitkeep` versionado no repositório (garante a existência da pasta)
- `uploads/*` no `.gitignore` (com exceção do `.gitkeep`) — arquivos enviados em produção nunca entram no controle de versão
- Após o `pull`, rodar `npm install` e reiniciar o processo Node manualmente (via hPanel ou PM2/systemd, conforme disponibilidade)

## 7. Funcionalidades-Chave (Casos de Uso)

| Funcionalidade | Descrição |
|---|---|
| Cadastrar Objetos | Cadastro de projetos e eventos |
| Cadastrar Entidades | Núcleos, turmas, alunos, professores |
| Cadastro Público | Inscrição de beneficiários, com reserva temporária de vaga e aprovação automática ou manual |
| Bater Ponto | Registro de ponto dos profissionais via QR Code |
| Lista de Presença | Controle de presença dos alunos/beneficiários |
| Comprovar Aula | Instrutor envia fotos como comprovação da atividade realizada |
| Controlar Estoque | Registro de materiais/equipamentos com foto e nota fiscal |
| Relatórios | Geração de relatórios com filtros compostos, em PDF e Excel |
| Gestão de Permissões | Admin define tabela de permissões por gestor |
| Dicionário de Termos | Admin configura a nomenclatura exibida no sistema |
| Configuração de Storage | Admin escolhe entre disco do servidor ou S3-compatible externo |

## 8. Pontos em Aberto

- Detalhamento fino da tabela de permissões do Gestor (lista completa de ações granularizáveis por módulo)
- TTL exato da reserva temporária de vaga e se haverá lista de espera
- Regras de notificação (e-mail/SMS/WhatsApp?) para aprovação manual, pendência de vaga e lembretes de atividades
- Campos exatos exigidos no cadastro de Beneficiário além dos citados (ex.: responsável legal para menores de idade?)
- Necessidade de assinatura eletrônica ou termo de aceite no cadastro público
