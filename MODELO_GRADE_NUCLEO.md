# Modelo de Configuração de Grade — Núcleos

Utilize este documento como padrão para coletar, estruturar e cadastrar as turmas e horários de cada núcleo esportivo.

---

## 1. Dados do Núcleo

- **Identificação / Nome:** `[Ex: Campo T31 - Taquari]`
- **Modalidade:** `[Ex: Futebol de Campo]`
- **Dias de Atendimento:** `[Ex: Segunda a Sexta]`
- **Turno Principal:** `[Ex: Manhã / Tarde]`
- **Professor(a) Responsável:** `[Nome completo do professor cadastrado]`

---

## 2. Estrutura Padrão de Turmas

| Nome da Turma | Faixa Etária | Vagas | Turno |
|---|---|---|---|
| `[Núcleo] - Planejamento` | — *(Sem faixa)* | 0 | `[Manhã/Tarde]` |
| `[Núcleo] - [Modalidade] - Sub-7 - [Turno A]` | Sub-7 | 20 | `[Turno]` |
| `[Núcleo] - [Modalidade] - Sub-9 - [Turno A]` | Sub-9 | 20 | `[Turno]` |
| `[Núcleo] - [Modalidade] - Sub-11 - [Turno A]` | Sub-11 | 20 | `[Turno]` |
| `[Núcleo] - [Modalidade] - Sub-13 - [Turno A]` | Sub-13 | 20 | `[Turno]` |
| `[Núcleo] - [Modalidade] - Sub-15 - [Turno A]` | Sub-15 | 20 | `[Turno]` |
| `[Núcleo] - [Modalidade] - Sub-17 - [Turno A]` | Sub-17 | 20 | `[Turno]` |

> **Nota de Nomenclatura:** Manter sempre o padrão: `[Espaço] - [Bairro] - [Modalidade] - [Faixa] - [Turno Letra]`.

---

## 3. Matriz Semanal de Horários

### Segunda-feira (Dia 1)
- **14h00 às 18h00** (ou 08h00 às 12h00): `Planejamento Pedagógico / Administrativo`

### Terça-feira (Dia 2) e Quinta-feira (Dia 4)
- **16h00 às 17h00**: `Sub-7`
- **17h00 às 18h00**: `Sub-9`
- **18h00 às 19h00**: `Sub-11`

### Quarta-feira (Dia 3) e Sexta-feira (Dia 5)
- **16h00 às 17h00**: `Sub-13`
- **17h00 às 18h00**: `Sub-15`
- **18h00 às 19h00**: `Sub-17`

---

## 4. Checklist de Cadastro no Banco de Dados

1. [ ] **Verificar Núcleo:** conferir se o registro existe na tabela `public.nucleos`.
2. [ ] **Cadastrar / Ajustar Turmas:**
   - Conferir se cada faixa (Sub-7 a Sub-17) tem sua respectiva turma em `public.turmas`.
   - Turma de `Planejamento` cadastrada com `faixa_etaria_id = null`.
3. [ ] **Vincular Responsável:**
   - Inserir vínculo na tabela `public.turma_responsaveis` (`turma_id`, `funcionario_id`).
4. [ ] **Inserir Slots de Horário:**
   - Inserir registros na tabela `public.turma_horarios`:
     - `dia_semana` (1 = Segunda, 2 = Terça, ..., 6 = Sábado)
     - `hora_inicio` e `hora_fim` (formato `HH:MM:00`)
5. [ ] **Conferir no Painel do Professor:**
   - Acessar a grade semanal do professor e validar se os 13 blocos aparecem organizados por dia e horário.
