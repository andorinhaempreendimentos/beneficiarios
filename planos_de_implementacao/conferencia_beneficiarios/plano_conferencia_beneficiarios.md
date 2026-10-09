# Plano de Implementação: Conferência e Distribuição de Beneficiários nos Núcleos

## 1. Princípios e Regra de Ouro de Segurança

- **Isolamento Total dos Dados Oficiais (Somente Leitura)**:
  - As tabelas de produção `beneficiarios`, `grupos`, `grupo_horarios` e `beneficiario_grupos` permanecem **estritamente intocadas**.
  - O sistema apenas lê os alunos já cadastrados e a estrutura de turmas para alimentar a interface do professor.
- **Persistência Exclusiva em Tabela de Respostas**:
  - Todas as confirmações, distribuições na grade, alocações de alunos e novos cadastros feitos pelos professores serão salvos em uma tabela dedicada (`respostas_conferencia_beneficiarios`).
  - Nenhuma alteração é aplicada no banco oficial de forma automática. Todas as respostas ficam organizadas para auditoria e posterior homologação pela coordenação.

---

## 2. Arquitetura de Rotas e Páginas

1. **Rota Pública do Professor (Link Único do WhatsApp)**:
   - URL: `/conferencia-beneficiarios/[nucleoId]`
   - O professor acessa diretamente o link do seu núcleo (via UUID ou identificador do núcleo).
   - O sistema detecta automaticamente se o núcleo possui alunos cadastrados (Cenário A) ou se não possui nenhum aluno (Cenário B).

2. **Rota do Painel Administrativo / Coordenação**:
   - URL: `/conferencia-beneficiarios/respostas`
   - Acesso restrito por senha (`Conferencia123#`).
   - Gerador de links individuais com botão "Copiar Link WhatsApp" para cada um dos 20 professores.
   - Acompanhamento do progresso de preenchimento (núcleos concluídos vs. pendentes).
   - Visualização detalhada das respostas coletadas, distribuições e listas de alunos.

3. **Rotas de API (Next.js App Router)**:
   - `GET /api/conferencia-beneficiarios/[nucleoId]`: Retorna dados do núcleo, turmas existentes na tabela `grupos`/`grupo_horarios`, alunos vinculados ao núcleo (apenas leitura de `beneficiarios`) e status de resposta prévia.
   - `POST /api/conferencia-beneficiarios`: Registra a resposta enviada pelo professor na tabela `respostas_conferencia_beneficiarios`.

---

## 3. Cenário A: Núcleos COM Alunos Cadastrados (7 Núcleos)

*Núcleos com alunos no banco: Campo T31 (101), Vila Agrotins (100), 1206 Sul (80), Complexo ARNO 51 (79), Santo Amaro (78), 906 Sul (73), Haras RR (53).*

### Passo 1: Conferência do Quantitativo de Alunos
- Exibe o total de alunos atualmente cadastrados no sistema para aquele núcleo.
- O professor confirma se o número confere ou edita informando a quantidade real atendida.

### Passo 2: Distribuição de Vagas na Grade Semanal
- Exibe as turmas reais do núcleo já cadastradas na tabela `grupos` e seus horários em `grupo_horarios`.
- Cada turma possui um seletor de quantidade (1 a 150 alunos).
- **Regra de Alunos Únicos**: Se uma turma treina em múltiplos dias da semana (ex: Turma A treina Terça e Quinta com 20 vagas), o valor informado é de 20 alunos reais únicos, sem duplicar a contagem entre os dias.

### Passo 3: Alocação Inteligente de Alunos por Faixa Etária
- O professor pode clicar em uma turma da grade para visualizar os alunos do núcleo.
- A lista destaca os alunos que **ainda não foram atribuídos** a nenhuma turma.
- O sistema calcula a idade de cada aluno com base na sua `data_nascimento` e confronta com a `idade_minima` e `idade_maxima` da turma.
- Cada card de aluno exibe a sugestão inteligente:
  > *"Pela idade (ex: 10 anos), esse aluno poderia participar da [Nome da Turma] ([Dias da Semana] das [Início] às [Fim])."*
- O professor confirma a alocação do aluno naquela turma com um toque.
- O aluno alocado sai da lista de pendentes e passa a constar como vinculado àquela turma no rascunho de resposta.

---

## 4. Cenário B: Núcleos SEM Alunos Cadastrados (13 Núcleos)

*Núcleos: Taquaruçu, Aureny III, Capadócia, Lago Norte, Buritirana, Sol Nascente, Flamboyant, Lago Sul, 1303 Sul, 607 Norte, Sol Nascente I, Praça 208 Sul, Centro Desenv. Palmas.*

### Passo 1: Informar Total de Alunos Atendidos
- O professor informa a quantidade total de alunos que atende semanalmente no núcleo.

### Passo 2: Distribuição de Vagas na Grade Semanal
- Mesma interface da grade de turmas com o select de quantidade (1 a 150 alunos) por turma única.

### Passo 3: Cadastro Rápido de Alunos
- Interface rápida para inclusão de alunos básicos:
  1. Nome completo (obrigatório)
  2. CPF (opcional)
  3. Data de nascimento (obrigatório — calcula a idade e sugere a turma adequada)
  4. Sexo: M / F (obrigatório)
  5. Núcleo (fixado automaticamente pelo link)
- Os dados digitados são gravados exclusivamente dentro da resposta da conferência.

---

## 5. Estrutura da Tabela no Banco (`respostas_conferencia_beneficiarios`)

Tabela dedicada para armazenar todas as respostas sem impactar a produção:
```sql
CREATE TABLE IF NOT EXISTS respostas_conferencia_beneficiarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucleo_id UUID REFERENCES nucleos(id) ON DELETE SET NULL,
  nucleo_nome TEXT NOT NULL,
  professor_nome TEXT,
  tem_alunos_pre_existentes BOOLEAN NOT NULL DEFAULT FALSE,
  total_alunos_sistema INTEGER,
  total_alunos_informado INTEGER NOT NULL,
  distribuicao_turmas JSONB NOT NULL,
  alocacoes_alunos JSONB,
  novos_alunos_cadastrados JSONB,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. Experiência de Uso (UX & Mobile First)

- **Mobile First**: Totalmente otimizado para celulares, com botões amplos, fontes legíveis e navegação suave.
- **Feedback Imediato**: Contadores visuais de vagas preenchidas vs. vagas totais, barras de progresso e confirmações claras.
- **Sem Perda de Dados**: Estado persistido no rascunho local da página antes do envio final.
