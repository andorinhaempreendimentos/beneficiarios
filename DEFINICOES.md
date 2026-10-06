# Definições

## Turma

Espaço de tempo fixo para a aplicação de aulas/atividades, como por exemplo futebol, por um professor, num determinado local para beneficiários de uma faixa etária específica.

### Tipos de turma

| Tipo | Descrição |
|---|---|
| `regular` | Turma com beneficiários. Possui vagas, faixa etária, grade de horários e controle de presença. |
| `operacional` | Turma interna sem beneficiários — usada para planejamento, reuniões ou atividades administrativas de funcionários. Não possui vagas nem faixa etária. |

### Identificador da Turma

Letra (A, B, C…) que diferencia turmas com a mesma **atividade**, **núcleo**, **idade mínima** e **idade máxima**. É um campo próprio na tabela (`identificador VARCHAR(10)`). O nome da turma é gerado automaticamente a partir desses dados.

**Formato do nome gerado:**
```
[Núcleo] - [Atividade] - Turma [Identificador]
```

**Exemplos reais:**
- `Complexo ARNO 51 - Futebol de Campo - Sub-11 - Manhã A`
- `Campo T31 - Taquari - Futebol de Campo - Sub-13 - Tarde A`

**Regra:** o identificador deve ser único por combinação de **núcleo + atividade + idade mínima + idade máxima**. Garantido por índice único no banco (`turmas_nucleo_atividade_faixa_identificador_uniq`). É um campo próprio na tabela (`identificador VARCHAR(10)`).
