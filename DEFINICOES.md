# Definições

## Turma

Espaço de tempo fixo para a aplicação de aulas/atividades, como por exemplo futebol, por um professor, num determinado local para beneficiários de uma faixa etária específica.

### Tipos de turma

| Tipo | Descrição |
|---|---|
| `regular` | Turma com beneficiários. Possui vagas, faixa etária, grade de horários e controle de presença. |
| `operacional` | Turma interna sem beneficiários — usada para planejamento, reuniões ou atividades administrativas de funcionários. Não possui vagas nem faixa etária. |

### Identificador da Turma

Letra (A, B, C…) que diferencia turmas com a mesma **atividade** no mesmo **núcleo**. É um campo próprio na tabela (`identificador VARCHAR(10)`). O nome da turma é gerado automaticamente a partir de `[Núcleo] - [Atividade] - Turma [Identificador]`.

A faixa etária (`idade_minima` / `idade_maxima`) é dado estruturado separado — **não aparece no nome**.

**Formato do nome gerado:**
```
[Núcleo] - [Atividade] - Turma [Identificador]
```

**Exemplos reais:**
- `Campo T31 - Taquari - Futebol de Campo - Turma A` (6–7 anos)
- `Campo T31 - Taquari - Futebol de Campo - Turma B` (8–9 anos)
- `Campo T31 - Taquari - Futebol de Campo - Turma C` (10–11 anos)

**Regra:** o identificador deve ser único por combinação de **núcleo + atividade**. Garantido por índice único no banco (`turmas_nucleo_atividade_identificador_uniq`). É um campo próprio na tabela (`identificador VARCHAR(10)`).
