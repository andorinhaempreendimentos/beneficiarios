# Guia Consolidado: Padrão de Relatório de Frequência de Beneficiários (HTML / A4)

Este documento consolida todas as regras de layout, paginação A4, tipografia, calendário e simulação de frequência utilizadas para gerar o arquivo [`modelo-relatorio-frequencia.html`](./modelo-relatorio-frequencia.html).

---

## 1. Estrutura de Página e Paginação por Turma (A4 Retrato)

1. **Configuração da Folha A4:**
   - `@page { size: A4 portrait; margin: 10mm; }`
   - Cada folha `.page` possui `width: 210mm; min-height: 297mm; padding: 15mm 10mm;` na visualização em tela e `page-break-after: always; break-after: page; page-break-inside: avoid; break-inside: avoid;` no `@media print`.
2. **Cabeçalho Completo por Turma (e NÃO por Núcleo):**
   - **Toda turma** inicia em uma nova página A4 trazendo o **Cabeçalho Completo** na sua 1ª página (`p_idx == 1`).
3. **Divisão de Turmas Grandes (`> 28` alunos):**
   - **Até 28 alunos:** A turma inteira cabe em **1 única página A4** contendo: Cabeçalho Completo + Tabela de Alunos + `DIAS SEM AULA` + `Assinaturas` + `Rodapé`.
   - **Mais de 28 alunos:** A listagem da turma é dividida em **2 páginas**:
     - Regra de corte segura: `split_first_page = min(31, total_alunos - 10)` (garante que a 2ª página nunca fique vazia nem com menos de 10 alunos).
     - **Página 1 (`Pág. 1/2`):** Exibe o Cabeçalho Completo + primeira parte da tabela + nota `<div class="continue-note">Continua na próxima página...</div>` + Rodapé (**sem** `DIAS SEM AULA` e **sem** `Assinaturas`).
     - **Página 2 (`Pág. 2/2`):** **Não repete o cabeçalho** — inicia diretamente na continuação da tabela de chamada e, somente após o último aluno da turma, exibe `DIAS SEM AULA`, `Assinaturas` (`Responsável Administrativo` e `Professor`) e `Rodapé`.

---

## 2. Cabeçalho, Identidade Visual e Rodapé

1. **Topo (`.top-header`):**
   - **Lado esquerdo:**
     - Título `RELATÓRIO DE PRESENÇA` (`font-size: 24px; font-weight: 800; color: #000;`).
     - Subtítulo imediatamente abaixo: `Núcleo: <Nome do Núcleo>` (`font-size: 13.5px;`, com o nome em negrito).
   - **Lado direito:**
     - Logo oficial *"Escolinha de Futebol e Futsal — Atletas Para Sempre"* embutida em Base64 (`height: 68px; width: auto;`), recortada sem margens brancas excedentes.
2. **Linhas de Metadados (`.info-row`):**
   - **1ª Linha (`border-dashed`):**
     - Esquerda: `Turma: ` seguido de badge destacada `.turma-badge` (`background-color: #0f2942; color: #ffffff; font-weight: 800; font-size: 11.5px; padding: 3px 10px; border-radius: 4px; print-color-adjust: exact;`).
     - Direita: `Pauta: <Período>` (ex.: `Setembro/Outubro 2026 (15/09 a 09/10)`).
   - **2ª Linha (`border-solid`):**
     - Esquerda: `Atividade: <Modalidade>` (ex.: `Futebol`, `Futsal`, `Futebol / Futebol Society`).
     - Direita: `Dias:` com a lista de dias da semana e horários reais da turma (`font-weight: 700; font-size: 9.8px;`).
   - **3ª Linha (`border-dashed`):**
     - Esquerda: `Professor: <Nome do Professor ou —>`.
   - **4ª Linha (`border-solid`):**
     - Esquerda: `Instrutor:` | Direita: `Agente de Saúde:`.
3. **Caixa de Legenda (`.legend`):**
   - Sem ícone de impressora.
   - Fundo `#f8f9fa`, borda `1px solid #d0d5dd`, centralizada, contendo mini-badges coloridos para `P` (`#006600`) e `F` (`#990000`), além de `TP`, `%P`, `TF`, `%F`, `A/A` e `S/A`.
4. **Rodapé Fixo (`.footer`):**
   - Borda superior sólida (`1.5px solid #000000`) e texto centralizado em negrito: **`ATLETAS PARA SEMPRE`**.

---

## 3. Tabela de Chamada, Tipografia e Quadradinhos `P` / `F`

1. **Formatação dos Nomes dos Alunos (`td.student-name`):**
   - Sempre convertidos para **Title Case** com preposições em minúsculo (`da`, `de`, `do`, `das`, `dos`, `e`), ex.: `Arthur Santos Medrado`, `Lucas da Silva Pereira` — **nunca** em CAIXA ALTA.
   - Sempre em linha única (`white-space: nowrap; font-size: 11px; font-weight: 500; text-align: left; padding: 1px 6px;`).
2. **Colunas de Datas (`th.col-date`) e Células `P` / `F` (`.status-p`, `.status-f`):**
   - Largura fixa compacta: `width: 27px; min-width: 27px; max-width: 27px; height: 19px; padding: 1px;`. Isso garante que mesmo turmas com 15 aulas no período não comprimam os nomes dos alunos.
   - Cabeçalho de data (`th.col-date`): `font-size: 8.5px; letter-spacing: -0.2px; white-space: nowrap;` para que datas `DD/MM` nunca encavalem.
   - Célula de Presença (`.status-p`): fundo verde `#006600`, texto branco `#ffffff`, `font-weight: 800`, `font-size: 11px`.
   - Célula de Falta (`.status-f`): fundo vermelho `#990000`, texto branco `#ffffff`, `font-weight: 800`, `font-size: 11px`.
   - Obrigatório incluir `-webkit-print-color-adjust: exact; print-color-adjust: exact;` para impressão fiel das cores no PDF.
3. **Colunas de Totais (`TP`, `%P`, `TF`, `%F`):**
   - `TP` e `%P`: texto verde `#006600` (`font-size: 10.5px`, sem fundo colorido).
   - `TF` e `%F`: texto vermelho `#990000` (`font-size: 10.5px`, sem fundo colorido).
   - Percentuais formatados com 2 casas decimais e vírgula (`80,00%`).

---

## 4. Regras de Negócio: Calendário Real e Frequência (> 75%)

1. **Datas Reais do Calendário:**
   - As colunas de datas devem ser calculadas estritamente a partir do calendário oficial para o período da pauta, filtrando apenas os dias da semana (`weekday`) em que aquela turma específica tem aula (incluindo treinos combinados e aulões de sábado quando previstos no quadro da turma).
2. **Simulação Realista de Presença (`> 75%`):**
   - Toda turma individualmente deve ter média de presença **logo acima de 75%** (faixa entre `~77%` e `88%`, média global em torno de `~82%`), nunca inflada artificialmente para 95%–100% (exceto turmas de 2 alunos onde 1 falta já derrubaria abaixo do mínimo, ajustadas pelo piso de `76,5%`).
3. **Ocultação de Núcleos via CSS:**
   - Para ocultar núcleos específicos sem remover do código-fonte (ex.: `Núcleo: Centro Desenv. Futebol Palmas`), aplicar `display: none !important;` tanto no bloco `.page` da turma (`#turma-6`) quanto no `<option value="turma-6">` correspondente da barra de navegação superior.

---

## 5. Como Regerar o Relatório

Execute o script gerador da skill:

```powershell
python ".agents/skills/relatorio-frequencia-html/scripts/generate_all_turmas.py"
```
