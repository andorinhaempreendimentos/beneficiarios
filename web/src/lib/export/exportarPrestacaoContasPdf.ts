import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DadosRelatorioPrestacaoContas } from "@/lib/api/prestacaoContas";

function formatarData(dataIso?: string | null): string {
  if (!dataIso) return "—";
  const [ano, mes, dia] = dataIso.split("-");
  if (!ano || !mes || !dia) return dataIso;
  return `${dia}/${mes}/${ano}`;
}

export async function exportarRelatorioPrestacaoContasPdf(
  dados: DadosRelatorioPrestacaoContas,
  pareceresEditados?: {
    justificativaMetas?: string;
    impactoSocialTexto?: string;
    conclusaoTexto?: string;
  },
  signatariosEditados?: {
    responsavelElaboracao?: { nome: string; cargo: string };
    coordenadorGeral?: { nome: string; cargo: string };
    representanteLegal?: { nome: string; cargo: string };
  },
  anexosSelecionados?: {
    anexo1_nucleos?: boolean;
    anexo2_beneficiarios?: boolean;
    anexo3_frequencias?: boolean;
    anexo4_atividades?: boolean;
    anexo5_supervisoes?: boolean;
    anexo6_rh?: boolean;
    anexo7_materiais?: boolean;
    anexo8_metas?: boolean;
  }
) {
  const {
    objeto,
    organizacao,
    periodo,
    resumoIndicadores,
    execucaoPorNucleo,
    beneficiarios,
    beneficiariosLista,
    frequencia,
    atividadesRealizadas,
    supervisoes,
    recursosHumanos,
    materiais,
    cumprimentoMetas,
    ocorrencias,
  } = dados;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = margin + 12;
    }
  }

  function drawSectionTitle(title: string) {
    checkPageBreak(12);
    doc.setFillColor(2, 132, 199);
    doc.rect(margin, y, 2.5, 6, "F");

    doc.setFillColor(244, 244, 245);
    doc.rect(margin + 2.5, y, contentWidth - 2.5, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(24, 24, 27);
    doc.text(title.toUpperCase(), margin + 5, y + 4.2);

    y += 8;
  }

  function drawParagraph(text: string, isItalic = false) {
    doc.setFont("helvetica", isItalic ? "italic" : "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 67);
    const lines = doc.splitTextToSize(text, contentWidth);
    const height = lines.length * 3.5;
    checkPageBreak(height + 2);
    doc.text(lines, margin, y);
    y += height + 3;
  }

  function drawTextBox(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(39, 39, 42);
    const lines = doc.splitTextToSize(text, contentWidth - 6);
    const boxHeight = lines.length * 3.5 + 5;
    checkPageBreak(boxHeight + 3);

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(228, 228, 231);
    doc.rect(margin, y, contentWidth, boxHeight, "FD");

    doc.text(lines, margin + 3, y + 4);
    y += boxHeight + 4;
  }

  // ── CABEÇALHO DA PRIMEIRA PÁGINA ──────────────────────────────────────────

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("RELATÓRIO DE EXECUÇÃO E PRESTAÇÃO DE CONTAS DO OBJETO", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text(objeto.nome.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Período Avaliado: ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)} • Instrumento: ${objeto.termoDeFomento || "—"}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 3;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── 1. IDENTIFICAÇÃO DO PROJETO E PARCERIA ─────────────────────────────
  drawSectionTitle("1. Identificação do Projeto e Parceria");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 41 },
      2: { fontStyle: "bold", cellWidth: 45 },
      3: { cellWidth: 46 },
    },
    body: [
      ["Objeto da Parceria:", objeto.nome || "—", "Órgão Concedente:", objeto.concedente?.nome || "—"],
      ["Organização Executora (OSC):", organizacao?.nome || "—", "CNPJ da OSC:", organizacao?.cnpj || "—"],
      ["Instrumento / Termo nº:", objeto.termoDeFomento || "—", "Processo Administrativo:", objeto.numeroProcessoAdm || "—"],
      ["Edital de Chamamento nº:", objeto.editalNumero || "—", "Vigência:", `${formatarData(objeto.dataInicio)} a ${formatarData(objeto.dataTermino)}`],
      ["Município / UF:", `${objeto.concedente?.cidade || organizacao?.cidade || "—"} / ${objeto.concedente?.estado || organizacao?.estado || "—"}`, "Conta Bancária Exclusiva:", objeto.contaBancariaBanco ? `Banco ${objeto.contaBancariaBanco} • Ag: ${objeto.contaBancariaAgencia} • CC: ${objeto.contaBancariaConta}` : "—"],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ── 2. OBJETO E FINALIDADE DO PROJETO ────────────────────────────────────
  drawSectionTitle("2. Objeto e Finalidade do Projeto");
  drawTextBox(objeto.descricao || "Implementação, gestão e execução de atividades esportivas e sociais conforme plano de trabalho aprovado.");

  // ── 3. RESUMO DA EXECUÇÃO ────────────────────────────────────────────────
  drawSectionTitle("3. Resumo da Execução");
  drawParagraph("Durante o período de referência, foram desenvolvidas atividades regulares nos núcleos integrantes do projeto, acompanhadas por meio de matrículas, frequências, relatórios pedagógicos e supervisão in loco.");

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7.5, cellPadding: 1.5 },
    styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    head: [["Indicador", "Previsto", "Realizado"]],
    body: [
      ["Núcleos Esportivos", String(resumoIndicadores.nucleos.previsto), String(resumoIndicadores.nucleos.realizado)],
      ["Beneficiários Atendidos", String(resumoIndicadores.beneficiarios.previsto), String(resumoIndicadores.beneficiarios.realizado)],
      ["Turmas Ativas", String(resumoIndicadores.turmas.previsto), String(resumoIndicadores.turmas.realizado)],
      ["Professores / Equipe", String(resumoIndicadores.professores.previsto), String(resumoIndicadores.professores.realizado)],
      ["Aulas / Atividades Realizadas", String(resumoIndicadores.aulas.previsto), String(resumoIndicadores.aulas.realizado)],
      ["Visitas de Supervisão", String(resumoIndicadores.supervisoes.previsto), String(resumoIndicadores.supervisoes.realizado)],
    ],
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "center", cellWidth: 35 },
      2: { halign: "center", cellWidth: 35, fontStyle: "bold" },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ── 4. EXECUÇÃO POR NÚCLEO ───────────────────────────────────────────────
  drawSectionTitle("4. Execução por Núcleo");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
    styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
    head: [["Núcleo", "Região / Bairro", "Modalidades", "Professores", "Turmas", "Alunos", "Aulas"]],
    body: execucaoPorNucleo.map((item) => [
      item.identificacao,
      item.bairro || item.regiao || "—",
      item.modalidades.join(", ") || "—",
      item.professores.join(", ") || "—",
      String(item.totalTurmas),
      String(item.beneficiariosAtendidos),
      String(item.aulasRealizadas),
    ]),
    columnStyles: {
      0: { fontStyle: "bold" },
      4: { halign: "center", cellWidth: 15 },
      5: { halign: "center", cellWidth: 16, fontStyle: "bold" },
      6: { halign: "center", cellWidth: 15 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ── 5. BENEFICIÁRIOS ATENDIDOS ───────────────────────────────────────────
  drawSectionTitle("5. Beneficiários Atendidos");
  drawParagraph(`No período analisado, o projeto registrou o atendimento de ${beneficiarios.totalCadastrados} beneficiários cadastrados.`);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
    styles: { fontSize: 7, cellPadding: 1.2, textColor: [30, 41, 59] },
    head: [["Indicador", "Quantidade", "Faixa Etária", "Quantidade"]],
    body: [
      ["Beneficiários cadastrados", String(beneficiarios.totalCadastrados), "06 a 09 anos", String(beneficiarios.faixasEtarias.de06a09)],
      ["Beneficiários ativos", String(beneficiarios.ativos), "10 a 12 anos", String(beneficiarios.faixasEtarias.de10a12)],
      ["Novos no período", String(beneficiarios.novosNoPeriodo), "13 a 15 anos", String(beneficiarios.faixasEtarias.de13a15)],
      ["Desligados / Desistentes", String(beneficiarios.desligadosDesistentes), "16 a 18 anos", String(beneficiarios.faixasEtarias.de16a18)],
      ["Sexo Masculino / Feminino", `${beneficiarios.masculino} masc. / ${beneficiarios.feminino} fem.`, "Total Atendido", String(beneficiarios.totalCadastrados)],
    ],
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "center", cellWidth: 35 },
      2: { fontStyle: "bold" },
      3: { halign: "center", cellWidth: 35 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ── 6. FREQUÊNCIA DOS BENEFICIÁRIOS ──────────────────────────────────────
  drawSectionTitle("6. Frequência dos Beneficiários");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
    styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
    head: [["Núcleo Esportivo", "Alunos Ativos", "Presenças", "Faltas", "Freq. Média", "Situação Meta"]],
    body: frequencia.porNucleo.map((fn) => [
      fn.nucleoNome,
      String(fn.beneficiariosAtivos),
      String(fn.presencasRegistradas),
      String(fn.faltasRegistradas),
      `${fn.frequenciaMedia}%`,
      fn.frequenciaMedia >= frequencia.metaMinima ? "Atingida" : fn.frequenciaMedia > 0 ? "Abaixo da Meta" : "Sem Registro",
    ]),
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "center", cellWidth: 22 },
      2: { halign: "center", cellWidth: 22 },
      3: { halign: "center", cellWidth: 20 },
      4: { halign: "center", cellWidth: 22, fontStyle: "bold" },
      5: { halign: "center", cellWidth: 28 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 3;
  drawParagraph(`Frequência Média Global do Projeto: ${frequencia.frequenciaMediaGeral}% (Meta Mínima Contratual: ${frequencia.metaMinima}%).`, true);

  // ── 7. ATIVIDADES REALIZADAS ─────────────────────────────────────────────
  drawSectionTitle("7. Atividades Realizadas");
  if (atividadesRealizadas.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Data", "Núcleo", "Modalidade", "Atividade / Turma", "Professor", "Participantes"]],
      body: atividadesRealizadas.slice(0, 30).map((a) => [
        formatarData(a.data),
        a.nucleoNome,
        a.modalidade || "—",
        a.atividadeDescricao || a.turmaNome,
        a.professorNome || "—",
        String(a.participantesPresentes),
      ]),
      columnStyles: {
        0: { cellWidth: 20 },
        5: { halign: "center", cellWidth: 22, fontStyle: "bold" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  } else {
    drawTextBox("Nenhuma atividade específica registrada no período selecionado.");
  }

  // ── 8. ACOMPANHAMENTO E SUPERVISÃO DOS NÚCLEOS ───────────────────────────
  drawSectionTitle("8. Acompanhamento e Supervisão dos Núcleos");
  if (supervisoes.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Data", "Núcleo", "Coordenador", "Professor Presente", "Alunos", "Situação"]],
      body: supervisoes.map((s) => [
        formatarData(s.data),
        s.nucleoNome || "—",
        s.coordenadorNome || "—",
        s.professorPresente ? "Presente" : "Ausente",
        String(s.beneficiariosPresentes),
        s.situacao,
      ]),
      columnStyles: {
        0: { cellWidth: 20 },
        4: { halign: "center", cellWidth: 18 },
        5: { halign: "center", cellWidth: 22, fontStyle: "bold" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  } else {
    drawTextBox("Nenhuma visita de supervisão pedagógica registrada no período selecionado.");
  }

  // ── 9. RECURSOS HUMANOS ──────────────────────────────────────────────────
  drawSectionTitle("9. Recursos Humanos");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
    styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
    head: [["Profissional", "Função", "Núcleo / Alocação", "Período de Atuação", "Situação"]],
    body: recursosHumanos.profissionais.map((p) => [
      p.nomeCompleto,
      p.funcao || "—",
      p.nucleoOuAlocacao || "—",
      `${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}`,
      p.situacao || "Ativo",
    ]),
    columnStyles: {
      0: { fontStyle: "bold" },
      3: { halign: "center", cellWidth: 38 },
      4: { halign: "center", cellWidth: 20, fontStyle: "bold" },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // ── 10. MATERIAIS E UNIFORMES ────────────────────────────────────────────
  drawSectionTitle("10. Materiais e Uniformes");
  if (materiais.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Item / Equipamento", "Previsto", "Adquirido", "Distribuído", "Destinação"]],
      body: materiais.map((m) => [
        m.nome,
        `${m.quantidadePrevista} ${m.unidadeMedida}`,
        `${m.quantidadeAdquirida} ${m.unidadeMedida}`,
        `${m.quantidadeDistribuida} ${m.unidadeMedida}`,
        m.destinacao || "—",
      ]),
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "center", cellWidth: 25 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 25, fontStyle: "bold" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  } else {
    drawTextBox("Nenhum material movimentado no período.");
  }

  // ── 11. CUMPRIMENTO DAS METAS ────────────────────────────────────────────
  drawSectionTitle("11. Cumprimento das Metas");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
    styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
    head: [["Meta / Indicador Pactuado", "Previsto", "Executado", "% Execução", "Situação"]],
    body: cumprimentoMetas.map((m) => [
      m.meta,
      `${m.previsto} ${m.unidade}`,
      `${m.realizado} ${m.unidade}`,
      `${m.percentualExecucao}%`,
      m.situacao,
    ]),
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "center", cellWidth: 30 },
      2: { halign: "center", cellWidth: 30, fontStyle: "bold" },
      3: { halign: "center", cellWidth: 25, fontStyle: "bold" },
      4: { halign: "center", cellWidth: 25 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 3;

  const justif = pareceresEditados?.justificativaMetas || "Todas as metas pactuadas no Plano de Trabalho foram integralmente executadas dentro dos padrões de excelência técnica e metodológica estabelecidos.";
  drawTextBox(`Análise do cumprimento das metas:\n${justif}`);

  // ── 12. REGISTRO FOTOGRÁFICO ─────────────────────────────────────────────
  drawSectionTitle("12. Registro Fotográfico");
  drawTextBox("Registros fotográficos arquivados digitalmente na coordenação do projeto e relatórios de supervisão anexos.");

  // ── 13. PRINCIPAIS OCORRÊNCIAS E PROVIDÊNCIAS ────────────────────────────
  drawSectionTitle("13. Principais Ocorrências e Providências");
  if (ocorrencias.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Ocorrência / Desafio", "Gravidade", "Providência Adotada", "Status"]],
      body: ocorrencias.map((o) => [o.descricao || "—", o.gravidade || "—", o.providencias || "—", o.status || "—"]),
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  } else {
    drawTextBox("Operação sem intercorrências graves no período. Todas as rotinas foram mantidas com normalidade.");
  }

  // ── 14. RESULTADOS ALCANÇADOS E IMPACTO SOCIAL ───────────────────────────
  drawSectionTitle("14. Resultados Alcançados e Impacto Social");
  const impact = pareceresEditados?.impactoSocialTexto || `Durante o período de ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}, a execução do projeto gerou impacto direto na vida de ${beneficiarios.totalCadastrados} crianças e adolescentes, com foco prioritário em famílias em situação de vulnerabilidade social. Destacam-se o fortalecimento da convivência comunitária e promoção da disciplina.`;
  drawTextBox(impact);

  // ── 15. CONCLUSÃO E PARECER FINAL ────────────────────────────────────────
  drawSectionTitle("15. Conclusão");
  const concl = pareceresEditados?.conclusaoTexto || `Diante do exposto, atesta-se que as atividades previstas no Plano de Trabalho foram rigorosamente executadas, atendendo aos objetivos da parceria celebrada sob o ${objeto.termoDeFomento || "Termo de Colaboração"}, demonstrando a boa e regular aplicação dos recursos e o cumprimento pleno da finalidade pública e social.`;
  drawTextBox(concl);

  // ── 16. DOCUMENTOS COMPROBATÓRIOS / ANEXOS OFICIAIS ─────────────────────
  drawSectionTitle("16. Documentos Comprobatórios / Anexos Oficiais");
  
  const incl = {
    anexo1: anexosSelecionados?.anexo1_nucleos ?? true,
    anexo2: anexosSelecionados?.anexo2_beneficiarios ?? true,
    anexo3: anexosSelecionados?.anexo3_frequencias ?? true,
    anexo4: anexosSelecionados?.anexo4_atividades ?? true,
    anexo5: anexosSelecionados?.anexo5_supervisoes ?? true,
    anexo6: anexosSelecionados?.anexo6_rh ?? true,
    anexo7: anexosSelecionados?.anexo7_materiais ?? true,
    anexo8: anexosSelecionados?.anexo8_metas ?? true,
  };

  const listaAnexosOficiais = [
    `[${incl.anexo1 ? "X" : " "}] Anexo I: Relação dos núcleos esportivos em funcionamento e execução territorial (${execucaoPorNucleo.length} núcleos)`,
    `[${incl.anexo2 ? "X" : " "}] Anexo II: Relação nominal analítica de beneficiários atendidos e matriculados (${beneficiariosLista?.length || beneficiarios.totalCadastrados} alunos)`,
    `[${incl.anexo3 ? "X" : " "}] Anexo III: Relatórios consolidados e listas de frequência dos beneficiários (${frequencia.porNucleo.length} núcleos)`,
    `[${incl.anexo4 ? "X" : " "}] Anexo IV: Relatório cronológico de atividades e aulas realizadas (${atividadesRealizadas.length} aulas)`,
    `[${incl.anexo5 ? "X" : " "}] Anexo V: Relatórios individuais de supervisão pedagógica in loco com fotos comprobatórias (${supervisoes.length} visitas)`,
    `[${incl.anexo6 ? "X" : " "}] Anexo VI: Relação dos profissionais e equipe técnica (${recursosHumanos.profissionais.length} profissionais)`,
    `[${incl.anexo7 ? "X" : " "}] Anexo VII: Demonstrativo de materiais e uniformes distribuídos (${materiais.length} itens)`,
    `[${incl.anexo8 ? "X" : " "}] Anexo VIII: Demonstrativo analítico de cumprimento das metas pactuadas (${cumprimentoMetas.length} indicadores)`,
  ];

  drawTextBox(listaAnexosOficiais.join("\n"));

  // ── SIGNATÁRIOS E ASSINATURAS ────────────────────────────────────────────
  const respElab = signatariosEditados?.responsavelElaboracao || { nome: "—", cargo: "Responsável pela elaboração do relatório" };
  const coordGeral = signatariosEditados?.coordenadorGeral || { nome: "—", cargo: "Coordenação do Projeto" };
  const repLegal = signatariosEditados?.representanteLegal || { nome: organizacao?.nomeResponsavel || "—", cargo: `Representante Legal${organizacao?.nome ? ` - ${organizacao.nome}` : ""}` };

  checkPageBreak(35);
  y += 8;

  const colW = contentWidth / 3;
  const sigLineW = colW - 8;

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);

  // 1
  doc.line(margin + 4, y, margin + 4 + sigLineW, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(respElab.nome, margin + 4 + sigLineW / 2, y + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(respElab.cargo, margin + 4 + sigLineW / 2, y + 7.5, { align: "center" });

  // 2
  const x2 = margin + colW;
  doc.line(x2 + 4, y, x2 + 4 + sigLineW, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(coordGeral.nome, x2 + 4 + sigLineW / 2, y + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(coordGeral.cargo, x2 + 4 + sigLineW / 2, y + 7.5, { align: "center" });

  // 3
  const x3 = margin + colW * 2;
  doc.line(x3 + 4, y, x3 + 4 + sigLineW, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(repLegal.nome, x3 + 4 + sigLineW / 2, y + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(repLegal.cargo, x3 + 4 + sigLineW / 2, y + 7.5, { align: "center" });

  y += 18;

  // ── APÊNDICES: ANEXOS SELECIONADOS NO PDF ────────────────────────────────

  if (Object.values(incl).some(Boolean)) {
    doc.addPage();
    y = margin + 12;
  }

  function drawAnnexHeader(title: string, sub: string) {
    checkPageBreak(18);
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 3, y + 4.8);

    y += 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(sub, margin, y);
    y += 4;
  }

  // ANEXO I
  if (incl.anexo1) {
    drawAnnexHeader("ANEXO I — RELAÇÃO DOS NÚCLEOS ESPORTIVOS EM FUNCIONAMENTO", `Objeto: ${objeto.nome} • Termo: ${objeto.termoDeFomento || "—"}`);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Núcleo Esportivo", "Região / Bairro", "Modalidades", "Professores", "Turmas", "Alunos", "Aulas"]],
      body: execucaoPorNucleo.map((item) => [
        item.identificacao,
        item.bairro || item.regiao || "—",
        item.modalidades.join(", ") || "—",
        item.professores.join(", ") || "—",
        String(item.totalTurmas),
        String(item.beneficiariosAtendidos),
        String(item.aulasRealizadas),
      ]),
      columnStyles: {
        0: { fontStyle: "bold" },
        4: { halign: "center", cellWidth: 15 },
        5: { halign: "center", cellWidth: 16, fontStyle: "bold" },
        6: { halign: "center", cellWidth: 15 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ANEXO II
  if (incl.anexo2) {
    drawAnnexHeader("ANEXO II — RELAÇÃO NOMINAL DE BENEFICIÁRIOS ATENDIDOS", `Total de Cadastrados: ${beneficiarios.totalCadastrados} • Ativos: ${beneficiarios.ativos}`);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Nome do Beneficiário", "Núcleo", "Idade", "Sexo", "Vulnerável", "Situação"]],
      body: (beneficiariosLista ?? []).length > 0
        ? (beneficiariosLista ?? []).map((b) => [
            b.nomeCompleto,
            b.nucleoNome,
            b.idade > 0 ? `${b.idade} anos` : "—",
            b.sexo,
            b.vulneravel ? "Sim" : "Não",
            b.status,
          ])
        : [["Nenhum beneficiário cadastrado no período.", "—", "—", "—", "—", "—"]],
      columnStyles: {
        0: { fontStyle: "bold" },
        2: { halign: "center", cellWidth: 18 },
        3: { halign: "center", cellWidth: 15 },
        4: { halign: "center", cellWidth: 22 },
        5: { halign: "center", cellWidth: 22, fontStyle: "bold" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ANEXO III
  if (incl.anexo3) {
    drawAnnexHeader("ANEXO III — RELATÓRIOS CONSOLIDADOS DE FREQUÊNCIA POR NÚCLEO", `Frequência Média Global: ${frequencia.frequenciaMediaGeral}% (Meta Mínima: ${frequencia.metaMinima}%)`);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Núcleo Esportivo", "Alunos Ativos", "Presenças", "Faltas", "Freq. Média", "Status Meta"]],
      body: frequencia.porNucleo.map((fn) => [
        fn.nucleoNome,
        String(fn.beneficiariosAtivos),
        String(fn.presencasRegistradas),
        String(fn.faltasRegistradas),
        `${fn.frequenciaMedia}%`,
        fn.frequenciaMedia >= frequencia.metaMinima ? "Atingida" : fn.frequenciaMedia > 0 ? "Abaixo" : "Sem Registro",
      ]),
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "center", cellWidth: 22 },
        2: { halign: "center", cellWidth: 22 },
        3: { halign: "center", cellWidth: 20 },
        4: { halign: "center", cellWidth: 22, fontStyle: "bold" },
        5: { halign: "center", cellWidth: 28 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ANEXO IV
  if (incl.anexo4) {
    drawAnnexHeader("ANEXO IV — RELATÓRIO DE ATIVIDADES E AULAS REALIZADAS", `Total de Aulas Executadas no Período: ${atividadesRealizadas.length}`);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Data", "Núcleo", "Modalidade", "Conteúdo / Turma", "Professor", "Partic."]],
      body: atividadesRealizadas.length > 0
        ? atividadesRealizadas.map((a) => [
            formatarData(a.data),
            a.nucleoNome,
            a.modalidade || "—",
            a.atividadeDescricao || a.turmaNome,
            a.professorNome || "—",
            String(a.participantesPresentes),
          ])
        : [["—", "Nenhuma atividade registrada no período selecionado.", "—", "—", "—", "—"]],
      columnStyles: {
        0: { cellWidth: 20 },
        5: { halign: "center", cellWidth: 16, fontStyle: "bold" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ANEXO V
  if (incl.anexo5) {
    drawAnnexHeader("ANEXO V — RELATÓRIOS INDIVIDUAIS DE SUPERVISÃO PEDAGÓGICA", `Total de Visitas Realizadas: ${supervisoes.length}`);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Data", "Núcleo", "Coordenador", "Professor", "Presentes", "Situação"]],
      body: supervisoes.length > 0
        ? supervisoes.map((s) => [
            formatarData(s.data),
            s.nucleoNome || "—",
            s.coordenadorNome || "—",
            s.professorPresente ? "Presente" : "Ausente",
            String(s.beneficiariosPresentes),
            s.situacao,
          ])
        : [["—", "Nenhuma visita de supervisão registrada no período selecionado.", "—", "—", "—", "—"]],
      columnStyles: {
        0: { cellWidth: 20 },
        4: { halign: "center", cellWidth: 18 },
        5: { halign: "center", cellWidth: 22, fontStyle: "bold" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ANEXO VI
  if (incl.anexo6) {
    drawAnnexHeader("ANEXO VI — RELAÇÃO DOS PROFISSIONAIS E EQUIPE TÉCNICA", `Total de Profissionais Atuantes: ${recursosHumanos.profissionais.length}`);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Profissional", "Função", "Núcleo / Alocação", "Período de Atuação", "Situação"]],
      body: recursosHumanos.profissionais.length > 0
        ? recursosHumanos.profissionais.map((p) => [
            p.nomeCompleto,
            p.funcao || "—",
            p.nucleoOuAlocacao || "—",
            `${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}`,
            p.situacao || "Ativo",
          ])
        : [["Nenhum profissional vinculado no período.", "—", "—", "—", "—"]],
      columnStyles: {
        0: { fontStyle: "bold" },
        3: { halign: "center", cellWidth: 38 },
        4: { halign: "center", cellWidth: 20, fontStyle: "bold" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ANEXO VII
  if (incl.anexo7) {
    drawAnnexHeader("ANEXO VII — DEMONSTRATIVO DE MATERIAIS E UNIFORMES DISTRIBUÍDOS", `Itens Gerenciados no Estoque do Projeto: ${materiais.length}`);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Item / Equipamento", "Previsto", "Adquirido", "Distribuído", "Destinação"]],
      body: materiais.length > 0
        ? materiais.map((m) => [
            m.nome,
            `${m.quantidadePrevista} ${m.unidadeMedida}`,
            `${m.quantidadeAdquirida} ${m.unidadeMedida}`,
            `${m.quantidadeDistribuida} ${m.unidadeMedida}`,
            m.destinacao || "—",
          ])
        : [["Nenhum material movimentado no período.", "—", "—", "—", "—"]],
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "center", cellWidth: 25 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 25, fontStyle: "bold" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ANEXO VIII
  if (incl.anexo8) {
    drawAnnexHeader("ANEXO VIII — DEMONSTRATIVO ANALÍTICO DE CUMPRIMENTO DAS METAS", "Comparativo Geral do Plano de Trabalho");
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: { fillColor: [244, 244, 245], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7, cellPadding: 1.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, textColor: [30, 41, 59] },
      head: [["Meta / Indicador Pactuado", "Previsto", "Executado", "% Execução", "Situação"]],
      body: cumprimentoMetas.map((m) => [
        m.meta,
        `${m.previsto} ${m.unidade}`,
        `${m.realizado} ${m.unidade}`,
        `${m.percentualExecucao}%`,
        m.situacao,
      ]),
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "center", cellWidth: 30 },
        2: { halign: "center", cellWidth: 30, fontStyle: "bold" },
        3: { halign: "center", cellWidth: 25, fontStyle: "bold" },
        4: { halign: "center", cellWidth: 25 },
      },
    });
  }

  // ── CABEÇALHOS E RODAPÉS DE TODAS AS PÁGINAS (PÁGINA X DE Y) ────────────
  const totalPages = (doc.internal as any).getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Cabeçalho a partir da página 2
    if (i > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `RELATÓRIO DE PRESTAÇÃO DE CONTAS • ${objeto.nome.toUpperCase()} • ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}`,
        margin,
        8
      );
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.2);
      doc.line(margin, 9.5, pageWidth - margin, 9.5);
    }

    // Rodapé em todas as páginas
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Prestação de Contas — ${organizacao?.nome || "OSC"} • Instrumento: ${objeto.termoDeFomento || "—"}`,
      margin,
      pageHeight - 4.5
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 4.5, { align: "right" });
  }

  const fileName = `Prestacao_Contas_${objeto.nome.replace(/[^a-zA-Z0-9]/g, "_")}_${periodo.dataInicio}_${periodo.dataFim}.pdf`;
  doc.save(fileName);
}
