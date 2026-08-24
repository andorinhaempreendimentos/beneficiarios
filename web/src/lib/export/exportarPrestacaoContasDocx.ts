import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
  PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';
import { formatarData } from '@/lib/utils';
import type { DadosRelatorioPrestacaoContas } from '@/lib/api/prestacaoContas';

const TABLE_WIDTH = 9600; // DXA (~17cm para A4 com margens normais)

const CELL_MARGINS = {
  top: 100,
  bottom: 100,
  left: 140,
  right: 140,
};

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: 'D1D5DB',
};

const CELL_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
};

function createHeaderCell(
  text: string,
  widthDxa: number,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT
): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
    margins: CELL_MARGINS,
    borders: CELL_BORDERS,
    children: [
      new Paragraph({
        alignment,
        children: [
          new TextRun({
            text,
            bold: true,
            size: 18, // 9pt
            color: '1F2937',
          }),
        ],
      }),
    ],
  });
}

function createDataCell(
  text: string,
  widthDxa: number,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
  bold = false
): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    margins: CELL_MARGINS,
    borders: CELL_BORDERS,
    children: [
      new Paragraph({
        alignment,
        children: [
          new TextRun({
            text: text || '—',
            bold,
            size: 18, // 9pt
            color: '374151',
          }),
        ],
      }),
    ],
  });
}

function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 150 },
    shading: { fill: 'E5E7EB', type: ShadingType.CLEAR },
    children: [
      new TextRun({
        text: `  ${title}`,
        bold: true,
        size: 22, // 11pt
        color: '111827',
      }),
    ],
  });
}

function getSituacaoMeta(realizado: number, previsto: number): string {
  if (previsto <= 0) return 'Cumprida';
  const pct = (realizado / previsto) * 100;
  if (pct >= 100) return 'Cumprida';
  if (pct > 0) return 'Em Execução';
  return 'Não Iniciada';
}

export async function exportarRelatorioPrestacaoContasDocx(
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
  }
) {
  const {
    objeto,
    organizacao,
    periodo,
    resumoIndicadores,
    execucaoPorNucleo,
    beneficiarios,
    frequencia,
    atividadesRealizadas,
    supervisoes,
    recursosHumanos,
    materiais,
    cumprimentoMetas,
    ocorrencias,
  } = dados;

  const docChildren: any[] = [];

  // CABEÇALHO DO DOCUMENTO
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'RELATÓRIO DE EXECUÇÃO E PRESTAÇÃO DE CONTAS DO OBJETO',
          bold: true,
          size: 26, // 13pt
          color: '111827',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: objeto.nome.toUpperCase(),
          bold: true,
          size: 20, // 10pt
          color: '4B5563',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Período de Execução: ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)} • Instrumento: ${objeto.termoDeFomento || 'Termo de Colaboração'}`,
          italics: true,
          size: 18,
          color: '6B7280',
        }),
      ],
    })
  );

  // 1. IDENTIFICAÇÃO DO PROJETO E PARCERIA
  docChildren.push(
    createSectionHeading('1. IDENTIFICAÇÃO DO PROJETO E PARCERIA'),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [4800, 4800],
      rows: [
        new TableRow({
          children: [
            createDataCell(`Objeto: ${objeto.nome}`, 4800, AlignmentType.LEFT, true),
            createDataCell(`Órgão Concedente: ${objeto.concedente?.nome || 'SEJUVES'}`, 4800),
          ],
        }),
        new TableRow({
          children: [
            createDataCell(`OSC Executora: ${organizacao?.nome || 'Andorinha Empreendimentos Sociais'}`, 4800),
            createDataCell(`CNPJ da OSC: ${organizacao?.cnpj || '—'}`, 4800),
          ],
        }),
        new TableRow({
          children: [
            createDataCell(`Termo de Parceria nº: ${objeto.termoDeFomento || '002/2026'}`, 4800),
            createDataCell(`Processo Administrativo nº: ${objeto.numeroProcessoAdm || '00000.0.028571/2026'}`, 4800),
          ],
        }),
        new TableRow({
          children: [
            createDataCell(`Edital de Chamamento nº: ${objeto.editalNumero || '002/2026'}`, 4800),
            createDataCell(`Vigência: ${objeto.dataInicio ? formatarData(objeto.dataInicio) : '01/01/2026'} a ${objeto.dataTermino ? formatarData(objeto.dataTermino) : '31/12/2026'}`, 4800),
          ],
        }),
        new TableRow({
          children: [
            createDataCell(`Município / UF: ${objeto.concedente?.cidade || 'Palmas'} / ${objeto.concedente?.estado || 'TO'}`, 4800),
            createDataCell(`Conta Bancária: Banco ${objeto.contaBancariaBanco || 'Banco do Brasil'} • Ag: ${objeto.contaBancariaAgencia || '1505-9'} • CC: ${objeto.contaBancariaConta || '102938-4'}`, 4800),
          ],
        }),
      ],
    })
  );

  // 2. OBJETO E FINALIDADE DO PROJETO
  docChildren.push(
    createSectionHeading('2. OBJETO E FINALIDADE DO PROJETO'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text:
            objeto.descricao ||
            `O presente projeto tem por finalidade democratizar o acesso à prática esportiva de qualidade por meio da oferta de aulas regulares e estruturadas de futebol e futsal para crianças e adolescentes, prioritariamente matriculados na rede pública de ensino ou em situação de vulnerabilidade socioeconômica no município de ${objeto.concedente?.cidade || 'Palmas'}/${objeto.concedente?.estado || 'TO'}. A intervenção pedagógica orienta-se pela metodologia oficial "Gol do Brasil" da CBF Social, estimulando as habilidades para a vida, trabalho em equipe, cidadania e desenvolvimento integral.`,
          size: 19,
          color: '374151',
        }),
      ],
    })
  );

  // 3. RESUMO DA EXECUÇÃO
  docChildren.push(
    createSectionHeading('3. RESUMO DA EXECUÇÃO'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text:
            'Durante o período de referência, foram desenvolvidas atividades regulares de futebol e futsal nos núcleos integrantes do projeto, conforme cronograma e planejamento estabelecidos. A execução foi acompanhada por meio do cadastro dos beneficiários, controle de frequência, registros das aulas, acompanhamento dos profissionais e visitas de supervisão realizadas pela coordenação.',
          size: 19,
          color: '374151',
        }),
      ],
    }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [4800, 2400, 2400],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Indicador', 4800),
            createHeaderCell('Previsto', 2400, AlignmentType.CENTER),
            createHeaderCell('Realizado', 2400, AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Núcleos', 4800),
            createDataCell(String(resumoIndicadores.nucleos.previsto), 2400, AlignmentType.CENTER),
            createDataCell(String(resumoIndicadores.nucleos.realizado), 2400, AlignmentType.CENTER, true),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Beneficiários', 4800),
            createDataCell(String(resumoIndicadores.beneficiarios.previsto), 2400, AlignmentType.CENTER),
            createDataCell(String(resumoIndicadores.beneficiarios.realizado), 2400, AlignmentType.CENTER, true),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Turmas', 4800),
            createDataCell(String(resumoIndicadores.turmas.previsto), 2400, AlignmentType.CENTER),
            createDataCell(String(resumoIndicadores.turmas.realizado), 2400, AlignmentType.CENTER, true),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Professores', 4800),
            createDataCell(String(resumoIndicadores.professores.previsto), 2400, AlignmentType.CENTER),
            createDataCell(String(resumoIndicadores.professores.realizado), 2400, AlignmentType.CENTER, true),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Aulas/atividades', 4800),
            createDataCell(String(resumoIndicadores.aulas.previsto), 2400, AlignmentType.CENTER),
            createDataCell(String(resumoIndicadores.aulas.realizado), 2400, AlignmentType.CENTER, true),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Visitas de supervisão', 4800),
            createDataCell(String(resumoIndicadores.supervisoes.previsto), 2400, AlignmentType.CENTER),
            createDataCell(String(resumoIndicadores.supervisoes.realizado), 2400, AlignmentType.CENTER, true),
          ],
        }),
      ],
    })
  );

  // 4. EXECUÇÃO DETALHADA POR NÚCLEO ESPORTIVO
  docChildren.push(
    createSectionHeading('4. EXECUÇÃO DETALHADA POR NÚCLEO ESPORTIVO'),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [3000, 2000, 2000, 1300, 1300],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Núcleo Esportivo', 3000),
            createHeaderCell('Região / Bairro', 2000),
            createHeaderCell('Professores Vinculados', 2000),
            createHeaderCell('Alunos', 1300, AlignmentType.CENTER),
            createHeaderCell('Aulas', 1300, AlignmentType.CENTER),
          ],
        }),
        ...execucaoPorNucleo.map(
          (item) =>
            new TableRow({
              children: [
                createDataCell(item.identificacao, 3000, AlignmentType.LEFT, true),
                createDataCell(item.bairro || item.regiao || '—', 2000),
                createDataCell(item.professores.join(', '), 2000),
                createDataCell(String(item.beneficiariosAtendidos), 1300, AlignmentType.CENTER, true),
                createDataCell(String(item.aulasRealizadas), 1300, AlignmentType.CENTER),
              ],
            })
        ),
      ],
    })
  );

  // 5. DEMONSTRATIVO DE BENEFICIÁRIOS E PERFIL SOCIODEMOGRÁFICO
  docChildren.push(
    createSectionHeading('5. DEMONSTRATIVO DE BENEFICIÁRIOS E PERFIL SOCIODEMOGRÁFICO'),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [1920, 1920, 1920, 1920, 1920],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Total Cadastrados', 1920, AlignmentType.CENTER),
            createHeaderCell('Alunos Ativos', 1920, AlignmentType.CENTER),
            createHeaderCell('Feminino (%)', 1920, AlignmentType.CENTER),
            createHeaderCell('Masculino (%)', 1920, AlignmentType.CENTER),
            createHeaderCell('Vulnerabilidade (%)', 1920, AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createDataCell(String(beneficiarios.totalCadastrados), 1920, AlignmentType.CENTER, true),
            createDataCell(String(beneficiarios.ativos), 1920, AlignmentType.CENTER, true),
            createDataCell(`${beneficiarios.feminino} (${beneficiarios.totalCadastrados > 0 ? Math.round((beneficiarios.feminino / beneficiarios.totalCadastrados) * 100) : 0}%)`, 1920, AlignmentType.CENTER),
            createDataCell(`${beneficiarios.masculino} (${beneficiarios.totalCadastrados > 0 ? Math.round((beneficiarios.masculino / beneficiarios.totalCadastrados) * 100) : 0}%)`, 1920, AlignmentType.CENTER),
            createDataCell(`${beneficiarios.percentualVulnerabilidade}%`, 1920, AlignmentType.CENTER, true),
          ],
        }),
      ],
    })
  );

  // 6. FREQUÊNCIA APURADA E ASSIDUIDADE
  docChildren.push(
    createSectionHeading('6. FREQUÊNCIA APURADA E ASSIDUIDADE'),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [3600, 1500, 1500, 1500, 1500],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Núcleo Esportivo', 3600),
            createHeaderCell('Alunos Ativos', 1500, AlignmentType.CENTER),
            createHeaderCell('Presenças', 1500, AlignmentType.CENTER),
            createHeaderCell('Faltas', 1500, AlignmentType.CENTER),
            createHeaderCell('Frequência (%)', 1500, AlignmentType.CENTER),
          ],
        }),
        ...frequencia.porNucleo.map(
          (fn) =>
            new TableRow({
              children: [
                createDataCell(fn.nucleoNome, 3600),
                createDataCell(String(fn.beneficiariosAtivos), 1500, AlignmentType.CENTER),
                createDataCell(String(fn.presencasRegistradas), 1500, AlignmentType.CENTER),
                createDataCell(String(fn.faltasRegistradas), 1500, AlignmentType.CENTER),
                createDataCell(`${fn.frequenciaMedia}%`, 1500, AlignmentType.CENTER, true),
              ],
            })
        ),
      ],
    })
  );

  // 9. QUADRO DE RECURSOS HUMANOS
  docChildren.push(
    createSectionHeading('9. QUADRO DE RECURSOS HUMANOS E EQUIPE TÉCNICA'),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [3600, 2000, 2000, 2000],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Cargo / Função Prevista', 3600),
            createHeaderCell('Qtd. Prevista', 2000, AlignmentType.CENTER),
            createHeaderCell('Qtd. Realizada/Ativa', 2000, AlignmentType.CENTER),
            createHeaderCell('% Cumprimento', 2000, AlignmentType.CENTER),
          ],
        }),
        ...recursosHumanos.cargosComparativo.map(
          (c) =>
            new TableRow({
              children: [
                createDataCell(c.cargoNome, 3600, AlignmentType.LEFT, true),
                createDataCell(String(c.quantidadePrevista), 2000, AlignmentType.CENTER),
                createDataCell(String(c.quantidadeAtiva), 2000, AlignmentType.CENTER, true),
                createDataCell(`${c.percentualExecucao}%`, 2000, AlignmentType.CENTER),
              ],
            })
        ),
      ],
    })
  );

  // 11. QUADRO GERAL DE CUMPRIMENTO DAS METAS PACTUADAS
  const justMetas =
    pareceresEditados?.justificativaMetas ||
    'Todas as metas pactuadas no Plano de Trabalho foram integralmente executadas dentro dos padrões de excelência técnica e metodológica estabelecidos, com ampla adesão comunitária e frequência superior à meta mínima pactuada.';

  docChildren.push(
    createSectionHeading('11. QUADRO GERAL DE CUMPRIMENTO DAS METAS PACTUADAS'),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [4000, 1200, 1400, 1400, 1600],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Meta / Indicador Pactuado', 4000),
            createHeaderCell('Unidade', 1200, AlignmentType.CENTER),
            createHeaderCell('Previsto', 1400, AlignmentType.CENTER),
            createHeaderCell('Realizado', 1400, AlignmentType.CENTER),
            createHeaderCell('% Execução', 1600, AlignmentType.CENTER),
          ],
        }),
        ...cumprimentoMetas.map(
          (m) =>
            new TableRow({
              children: [
                createDataCell(m.meta, 4000),
                createDataCell(m.unidade, 1200, AlignmentType.CENTER),
                createDataCell(String(m.previsto), 1400, AlignmentType.CENTER),
                createDataCell(String(m.realizado), 1400, AlignmentType.CENTER, true),
                createDataCell(`${m.percentualExecucao}%`, 1600, AlignmentType.CENTER, true),
              ],
            })
        ),
      ],
    }),
    new Paragraph({
      spacing: { before: 150, after: 200 },
      children: [
        new TextRun({ text: 'Justificativa e Análise do Cumprimento de Metas: ', bold: true, size: 19 }),
        new TextRun({ text: justMetas, size: 19, color: '374151' }),
      ],
    })
  );

  // 14. RESULTADOS ALCANÇADOS E IMPACTO SOCIAL
  const resTexto =
    pareceresEditados?.impactoSocialTexto ||
    `Durante o período de ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}, a execução do projeto ${objeto.nome} gerou impacto direto na vida de ${beneficiarios.totalCadastrados} crianças e adolescentes, com foco prioritário em famílias em situação de vulnerabilidade social (${beneficiarios.percentualVulnerabilidade}% dos matriculados). Destacam-se o fortalecimento da convivência comunitária, a promoção da disciplina e cooperação por meio do futebol/futsal com metodologia Gol do Brasil da CBF, e a melhoria no rendimento escolar dos participantes.`;

  docChildren.push(
    createSectionHeading('14. RESULTADOS ALCANÇADOS E IMPACTO SOCIAL'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [new TextRun({ text: resTexto, size: 19, color: '374151' })],
    })
  );

  // 15. CONCLUSÃO E PARECER FINAL
  const concTexto =
    pareceresEditados?.conclusaoTexto ||
    `Diante do exposto, atesta-se que as atividades previstas no Plano de Trabalho foram rigorosamente executadas, atendendo aos objetivos da parceria celebrada sob o ${objeto.termoDeFomento || 'Termo de Parceria'} com o ${objeto.concedente?.nome || 'Órgão Concedente'}, demonstrando a boa e regular aplicação dos recursos e o cumprimento pleno da finalidade pública e social.`;

  docChildren.push(
    createSectionHeading('15. CONCLUSÃO E PARECER FINAL'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [new TextRun({ text: concTexto, size: 19, color: '374151' })],
    })
  );

  // 16. DOCUMENTOS COMPROBATÓRIOS (ANEXOS)
  docChildren.push(
    createSectionHeading('16. RELAÇÃO DE DOCUMENTOS COMPROBATÓRIOS (ANEXOS OFICIAIS)'),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: '1. Anexo I: Diários de classe e relatórios consolidados de frequência por turma e núcleo;', size: 18 })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: '2. Anexo II: Relatórios individuais de supervisão pedagógica in loco com fotos comprobatórias;', size: 18 })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: '3. Anexo III: Termos de entrega e cautela de materiais esportivos e uniformes assinados;', size: 18 })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: '4. Anexo IV: Relatórios de registro de ponto eletrônico e frequência da equipe de profissionais;', size: 18 })],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [new TextRun({ text: '5. Anexo V: Extratos bancários da conta corrente específica da parceria e comprovantes de despesas.', size: 18 })],
    })
  );

  // SIGNATÁRIOS E ASSINATURAS
  const respElab = signatariosEditados?.responsavelElaboracao || { nome: 'Equipe Técnica e Pedagógica', cargo: 'Coordenação de Monitoramento' };
  const coordGeral = signatariosEditados?.coordenadorGeral || { nome: 'Coordenador Geral do Projeto', cargo: 'Coordenador Geral do Objeto' };
  const repLegal = signatariosEditados?.representanteLegal || { nome: organizacao?.nomeResponsavel || 'Representante Legal da OSC', cargo: `Presidente - ${organizacao?.nome || 'OSC Executora'}` };

  docChildren.push(
    new Paragraph({ spacing: { before: 400, after: 200 } }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [3200, 3200, 3200],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 3200, type: WidthType.DXA },
              margins: CELL_MARGINS,
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_______________________________', size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: respElab.nome, bold: true, size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: respElab.cargo, size: 16, color: '6B7280' })] }),
              ],
            }),
            new TableCell({
              width: { size: 3200, type: WidthType.DXA },
              margins: CELL_MARGINS,
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_______________________________', size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: coordGeral.nome, bold: true, size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: coordGeral.cargo, size: 16, color: '6B7280' })] }),
              ],
            }),
            new TableCell({
              width: { size: 3200, type: WidthType.DXA },
              margins: CELL_MARGINS,
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_______________________________', size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: repLegal.nome, bold: true, size: 18 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: repLegal.cargo, size: 16, color: '6B7280' })] }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Criar Documento Docx
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 polegada
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Prestacao_Contas_${objeto.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${periodo.dataInicio}_${periodo.dataFim}.docx`;
  saveAs(blob, fileName);
}
