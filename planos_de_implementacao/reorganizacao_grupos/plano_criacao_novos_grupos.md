# Plano de Implementação: Criação da Estrutura de Grupos da Rede (Dicionário da Atividade)

## 1. Regra de Formação do Nome do Grupo

O nome físico de cada grupo/turma gerado no banco segue estritamente a fórmula:
```
[Nome do Núcleo] - [termo_grupo da Atividade] [Letra]
```

- **Fonte do Termo**: Coluna `termo_grupo` da tabela `atividades` vinculada à modalidade do grupo.
  - Para `Futebol de Campo` (`termo_grupo = "Turma"`): `[Nome do Núcleo] - Turma [Letra]`
  - Para `Futsal` (`termo_grupo = "Turma"`): `[Nome do Núcleo] - Turma [Letra]`
  - Se outra atividade definir `"Equipe"` ou `"Grupo"`: adota dinamicamente o termo configurado.
- **Identificador**: `A`, `B`, `C`, `D`, `E`...
- **Proibição Absoluta**: Nunca incluir idade, esporte ou turno no texto do nome (idade e horários são persistidos exclusivamente nas colunas `idade_minima`, `idade_maxima` e na tabela `grupo_horarios`).

---

## 2. Escopo Unificado (20 Núcleos e 20 Professores)

Criar exclusivamente a estrutura organizacional (`grupos`, `grupo_horarios`, `grupo_responsaveis`).
**Não vincular beneficiários agora (`beneficiario_grupos` permanece vazia nesta fase).**

| # | Núcleo | Professor | Modalidade | termo_grupo | Nomes das Turmas Geradas |
|---|---|---|---|---|---|
| 1 | Campo T31 - Taquari | Aleksandro Soares Santos | Futebol de Campo | Turma | Turma A, Turma B, Turma C, Turma D, Turma E |
| 2 | Centro Desenv. Futebol Palmas | Marcos Sousa Rocha | Futebol de Campo | Turma | Turma A, Turma B, Turma C, Turma D, Turma E |
| 3 | Complexo ARNO 51 | Alexandre Silva Santos | Futebol de Campo | Turma | Turma A |
| 4 | Escolinha do Sol Nascente | Wiltom Pereira dias | Futebol de Campo | Turma | Turma A, Turma B, Turma C |
| 5 | Escolinha Esportiva de Taquaruçu | Hallid Luz Husein | Futsal | Turma | Turma A, Turma B, Turma C, Turma D |
| 6 | Escolinha Flamboyant | Vagno Rodrigues de Souza | Futebol de Campo | Turma | Turma A, Turma B, Turma C, Turma D |
| 7 | Haras RR | Romário Ribeiro Brito | Futebol de Campo | Turma | Turma A, Turma B, Turma C |
| 8 | Núcleo Aureny III | Jorge Martins Silva | Futebol de Campo | Turma | Turma A, Turma B, Turma C |
| 9 | Núcleo Buritirana | Luiz Carlos Oliveira | Futebol de Campo | Turma | Turma A, Turma B, Turma C, Turma D, Turma E |
| 10 | Núcleo Capadócia | Caíque Cirilo Costa | Futebol de Campo | Turma | Turma A |
| 11 | Núcleo Lago Norte | Paulo Roberto Nogueira | Futebol de Campo | Turma | Turma A |
| 12 | Núcleo Lago Sul | Ramon Batista Ribeiro | Futebol de Campo | Turma | Turma A, Turma B, Turma C |
| 13 | Núcleo Quadra 1206 Sul | Kaio Henrique Ferreira | Futebol de Campo | Turma | Turma A, Turma B |
| 14 | Núcleo Quadra 1303 Sul | Carlos Henrique Araújo Lima | Futebol de Campo | Turma | Turma A, Turma B, Turma C, Turma D |
| 15 | Núcleo Quadra 607 Norte | Sthefferson Mafra Vieira | Futebol de Campo | Turma | Turma A, Turma B, Turma C, Turma D |
| 16 | Núcleo Quadra 906 Sul | João Vitor Mendonça | Futsal | Turma | Turma A, Turma B |
| 17 | Núcleo Santo Amaro | Renato Gomes de Castro | Futsal | Turma | Turma A |
| 18 | Núcleo Sol Nascente I | Rolnan Costa Santos | Futebol de Campo | Turma | Turma A, Turma B |
| 19 | Núcleo Vila Agrotins | Rivaldo Monteiro Corrêa | Futebol de Campo | Turma | Turma A, Turma B, Turma C, Turma D |
| 20 | Quadra Esportiva Praça 208 Sul | Felipe Ribeiro Alves | Futsal | Turma | Turma A, Turma B, Turma C, Turma D |

---

## 3. Estrutura Técnica das Tabelas a Alimentar

1. **`grupos`**:
   - `id`: UUID gerado
   - `nome`: `[Identificação do Núcleo] - [termo_grupo] [Letra]` (ex: `Campo T31 - Taquari - Turma A`)
   - `identificador`: `A`, `B`, `C`...
   - `nucleo_id`: UUID do núcleo correspondente
   - `atividade_id`: UUID da modalidade
   - `idade_minima` e `idade_maxima`: limites etários da conferência
   - `vagas_totais`: 30 a 50
   - `tipo`: `'regular'`

2. **`grupo_horarios`**:
   - `grupo_id`: FK para a turma criada
   - `dia_semana`: 1 (Seg) a 7 (Dom)
   - `hora_inicio` e `hora_fim`: extraídos dos horários da conferência do professor
   - `nucleo_id` e `atividade_id`

3. **`grupo_responsaveis`**:
   - `grupo_id`: FK para a turma criada
   - `funcionario_id`: FK para o professor correspondente

4. **`beneficiario_grupos`**:
   - **0 registros.** Permanecer vazia nesta fase.
