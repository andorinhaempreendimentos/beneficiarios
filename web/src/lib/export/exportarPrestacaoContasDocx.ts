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
          text: `Período de Execução: ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)} • Instrumento: ${objeto.termoDeFomento || '—'}`,
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
            createDataCell(`Objeto: ${objeto.nome || '—'}`, 4800, AlignmentType.LEFT, true),
            createDataCell(`Órgão Concedente: ${objeto.concedente?.nome || '—'}`, 4800),
          ],
        }),
        new TableRow({
          children: [
            createDataCell(`OSC Executora: ${organizacao?.nome || '—'}`, 4800),
            createDataCell(`CNPJ da OSC: ${organizacao?.cnpj || '—'}`, 4800),
          ],
        }),
        new TableRow({
          children: [
            createDataCell(`Termo de Parceria nº: ${objeto.termoDeFomento || '—'}`, 4800),
            createDataCell(`Processo Administrativo nº: ${objeto.numeroProcessoAdm || '—'}`, 4800),
          ],
        }),
        new TableRow({
          children: [
            createDataCell(`Edital de Chamamento nº: ${objeto.editalNumero || '—'}`, 4800),
            createDataCell(`Vigência: ${objeto.dataInicio && objeto.dataTermino ? `${formatarData(objeto.dataInicio)} a ${formatarData(objeto.dataTermino)}` : '—'}`, 4800),
          ],
        }),
        new TableRow({
          children: [
            createDataCell(`Município / UF: ${objeto.concedente?.cidade || organizacao?.cidade ? `${objeto.concedente?.cidade || organizacao?.cidade} / ${objeto.concedente?.estado || organizacao?.estado || ''}` : '—'}`, 4800),
            createDataCell(`Conta Bancária: ${objeto.contaBancariaBanco ? `Banco ${objeto.contaBancariaBanco} • Ag: ${objeto.contaBancariaAgencia || '—'} • CC: ${objeto.contaBancariaConta || '—'}` : '—'}`, 4800),
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
          text: objeto.descricao || '—',
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

  // 4. EXECUÇÃO POR NÚCLEO
  docChildren.push(
    createSectionHeading('4. EXECUÇÃO POR NÚCLEO'),
    new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: 'Apresentar a execução individualizada de cada núcleo.',
          size: 19,
          color: '374151',
        }),
      ],
    }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [2200, 1600, 1400, 1600, 800, 1000, 1000],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Núcleo', 2200),
            createHeaderCell('Região/Bairro', 1600),
            createHeaderCell('Modalidade', 1400),
            createHeaderCell('Professor', 1600),
            createHeaderCell('Nº Turmas', 800, AlignmentType.CENTER),
            createHeaderCell('Beneficiários', 1000, AlignmentType.CENTER),
            createHeaderCell('Aulas', 1000, AlignmentType.CENTER),
          ],
        }),
        ...execucaoPorNucleo.map(
          (item) =>
            new TableRow({
              children: [
                createDataCell(item.identificacao, 2200, AlignmentType.LEFT, true),
                createDataCell(item.bairro || item.regiao || '—', 1600),
                createDataCell(item.modalidades.join(', ') || '—', 1400),
                createDataCell(item.professores.join(', ') || '—', 1600),
                createDataCell(String(item.totalTurmas), 800, AlignmentType.CENTER),
                createDataCell(String(item.beneficiariosAtendidos), 1000, AlignmentType.CENTER, true),
                createDataCell(String(item.aulasRealizadas), 1000, AlignmentType.CENTER),
              ],
            })
        ),
      ],
    })
  );

  // 5. BENEFICIÁRIOS ATENDIDOS
  docChildren.push(
    createSectionHeading('5. BENEFICIÁRIOS ATENDIDOS'),
    new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: `No período analisado, o projeto registrou o atendimento de ${beneficiarios.totalCadastrados} beneficiários, distribuídos entre os diferentes núcleos e turmas.`,
          size: 19,
          color: '374151',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: '5.1 Demonstrativo de beneficiários',
          bold: true,
          size: 19,
        }),
      ],
    }),
    new Table({
      width: { size: 6000, type: WidthType.DXA },
      columnWidths: [4000, 2000],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Indicador', 4000),
            createHeaderCell('Quantidade', 2000, AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Beneficiários cadastrados', 4000),
            createDataCell(String(beneficiarios.totalCadastrados), 2000, AlignmentType.CENTER, true),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Beneficiários ativos', 4000),
            createDataCell(String(beneficiarios.ativos), 2000, AlignmentType.CENTER, true),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Novos beneficiários no período', 4000),
            createDataCell(String(beneficiarios.novosNoPeriodo), 2000, AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Beneficiários desligados/desistentes', 4000),
            createDataCell(String(beneficiarios.desligadosDesistentes), 2000, AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Beneficiários do sexo feminino', 4000),
            createDataCell(String(beneficiarios.feminino), 2000, AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Beneficiários do sexo masculino', 4000),
            createDataCell(String(beneficiarios.masculino), 2000, AlignmentType.CENTER),
          ],
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 150, after: 100 },
      children: [
        new TextRun({
          text: 'Quando necessário, deverão ser apresentados demonstrativos por núcleo, turma, modalidade, faixa etária e período de atendimento.',
          italics: true,
          size: 17,
          color: '6B7280',
        }),
      ],
    }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [2600, 1400, 1400, 1400, 1400, 1400],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Faixa Etária', 2600),
            createHeaderCell('06 a 09 anos', 1400, AlignmentType.CENTER),
            createHeaderCell('10 a 12 anos', 1400, AlignmentType.CENTER),
            createHeaderCell('13 a 15 anos', 1400, AlignmentType.CENTER),
            createHeaderCell('16 a 18 anos', 1400, AlignmentType.CENTER),
            createHeaderCell('Total Atendido', 1400, AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createDataCell('Quantidade de Alunos', 2600),
            createDataCell(String(beneficiarios.faixasEtarias.de06a09), 1400, AlignmentType.CENTER),
            createDataCell(String(beneficiarios.faixasEtarias.de10a12), 1400, AlignmentType.CENTER),
            createDataCell(String(beneficiarios.faixasEtarias.de13a15), 1400, AlignmentType.CENTER),
            createDataCell(String(beneficiarios.faixasEtarias.de16a18), 1400, AlignmentType.CENTER),
            createDataCell(String(beneficiarios.totalCadastrados), 1400, AlignmentType.CENTER, true),
          ],
        }),
      ],
    })
  );

  // 6. FREQUÊNCIA DOS BENEFICIÁRIOS
  docChildren.push(
    createSectionHeading('6. FREQUÊNCIA DOS BENEFICIÁRIOS'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text:
            'A frequência dos beneficiários deverá ser acompanhada durante todo o período de execução das atividades, permitindo verificar a participação efetiva no projeto.',
          size: 19,
          color: '374151',
        }),
      ],
    }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [3600, 1500, 1500, 1500, 1500],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Núcleo', 3600),
            createHeaderCell('Beneficiários Ativos', 1500, AlignmentType.CENTER),
            createHeaderCell('Presenças Registradas', 1500, AlignmentType.CENTER),
            createHeaderCell('Faltas', 1500, AlignmentType.CENTER),
            createHeaderCell('Frequência Média', 1500, AlignmentType.CENTER),
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
    }),
    new Paragraph({
      spacing: { before: 150, after: 80 },
      children: [
        new TextRun({ text: 'Frequência média geral do projeto: ', bold: true, size: 19 }),
        new TextRun({ text: `${frequencia.frequenciaMediaGeral}%`, bold: true, size: 19, color: '111827' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'Os registros de frequência deverão permanecer arquivados como documentação comprobatória da execução.',
          italics: true,
          size: 17,
          color: '6B7280',
        }),
      ],
    })
  );

  // 7. ATIVIDADES REALIZADAS
  docChildren.push(
    createSectionHeading('7. ATIVIDADES REALIZADAS'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: 'As atividades desenvolvidas no período compreenderam aulas e treinamentos de futebol e futsal, além de outras ações previstas no planejamento do projeto.',
          size: 19,
          color: '374151',
        }),
      ],
    }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [1400, 2200, 1600, 2200, 1200, 1000],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Data', 1400),
            createHeaderCell('Núcleo', 2200),
            createHeaderCell('Modalidade', 1600),
            createHeaderCell('Atividade', 2200),
            createHeaderCell('Professor', 1200),
            createHeaderCell('Partic.', 1000, AlignmentType.CENTER),
          ],
        }),
        ...(atividadesRealizadas.length > 0
          ? atividadesRealizadas.slice(0, 15).map(
              (a) =>
                new TableRow({
                  children: [
                    createDataCell(formatarData(a.data), 1400),
                    createDataCell(a.nucleoNome, 2200),
                    createDataCell(a.modalidade || '—', 1600),
                    createDataCell(a.atividadeDescricao || a.turmaNome, 2200),
                    createDataCell(a.professorNome || '—', 1200),
                    createDataCell(String(a.participantesPresentes), 1000, AlignmentType.CENTER, true),
                  ],
                })
            )
          : [
              new TableRow({
                children: [createDataCell('Nenhuma atividade registrada no período.', TABLE_WIDTH, AlignmentType.CENTER)],
              }),
            ]),
      ],
    })
  );

  // 8. ACOMPANHAMENTO E SUPERVISÃO DOS NÚCLEOS
  docChildren.push(
    createSectionHeading('8. ACOMPANHAMENTO E SUPERVISÃO DOS NÚCLEOS'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: 'Durante a execução do projeto, deverão ser realizadas visitas periódicas aos núcleos pela coordenação, com o objetivo de acompanhar o funcionamento das atividades e verificar as condições de execução.',
          size: 19,
          color: '374151',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Demonstrativo das visitas', bold: true, size: 19 })],
    }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [1400, 2400, 2000, 1800, 1000, 1000],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Data', 1400),
            createHeaderCell('Núcleo', 2400),
            createHeaderCell('Coordenador', 2000),
            createHeaderCell('Professor', 1800),
            createHeaderCell('Presentes', 1000, AlignmentType.CENTER),
            createHeaderCell('Situação', 1000, AlignmentType.CENTER),
          ],
        }),
        ...(supervisoes.length > 0
          ? supervisoes.map(
              (s) =>
                new TableRow({
                  children: [
                    createDataCell(formatarData(s.data), 1400),
                    createDataCell(s.nucleoNome || '—', 2400),
                    createDataCell(s.coordenadorNome || '—', 2000),
                    createDataCell(s.professorPresente ? 'Presente' : 'Ausente', 1800),
                    createDataCell(String(s.beneficiariosPresentes), 1000, AlignmentType.CENTER),
                    createDataCell(s.situacao, 1000, AlignmentType.CENTER, true),
                  ],
                })
            )
          : [
              new TableRow({
                children: [createDataCell('Nenhuma visita de supervisão registrada no período.', TABLE_WIDTH, AlignmentType.CENTER)],
              }),
            ]),
      ],
    })
  );

  // 9. RECURSOS HUMANOS
  docChildren.push(
    createSectionHeading('9. RECURSOS HUMANOS'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: 'Apresentar os profissionais que efetivamente atuaram durante o período.',
          size: 19,
          color: '374151',
        }),
      ],
    }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [2600, 2000, 2200, 1600, 1200],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Profissional', 2600),
            createHeaderCell('Função', 2000),
            createHeaderCell('Núcleo/Área', 2200),
            createHeaderCell('Período de Atuação', 1600, AlignmentType.CENTER),
            createHeaderCell('Situação', 1200, AlignmentType.CENTER),
          ],
        }),
        ...(recursosHumanos.profissionais.length > 0
          ? recursosHumanos.profissionais.map(
              (p) =>
                new TableRow({
                  children: [
                    createDataCell(p.nomeCompleto, 2600, AlignmentType.LEFT, true),
                    createDataCell(p.funcao || '—', 2000),
                    createDataCell(p.nucleoOuAlocacao || '—', 2200),
                    createDataCell(`${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}`, 1600, AlignmentType.CENTER),
                    createDataCell(p.situacao || 'Ativo', 1200, AlignmentType.CENTER, true),
                  ],
                })
            )
          : [
              new TableRow({
                children: [createDataCell('Nenhum profissional vinculado no período.', TABLE_WIDTH, AlignmentType.CENTER)],
              }),
            ]),
      ],
    }),
    new Paragraph({
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({
          text: 'Deverão ser mantidos os documentos comprobatórios referentes à contratação e atuação dos profissionais, conforme as exigências do instrumento e do Plano de Trabalho.',
          italics: true,
          size: 17,
          color: '6B7280',
        }),
      ],
    })
  );

  // 10. MATERIAIS E UNIFORMES
  docChildren.push(
    createSectionHeading('10. MATERIAIS E UNIFORMES'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: 'Apresentar os materiais adquiridos, recebidos, distribuídos ou utilizados durante a execução do projeto.',
          size: 19,
          color: '374151',
        }),
      ],
    }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [2800, 1800, 1800, 1800, 1400],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Item', 2800),
            createHeaderCell('Qtd. Prevista', 1800, AlignmentType.CENTER),
            createHeaderCell('Qtd. Adquirida/Recebida', 1800, AlignmentType.CENTER),
            createHeaderCell('Qtd. Distribuída', 1800, AlignmentType.CENTER),
            createHeaderCell('Destinação', 1400),
          ],
        }),
        ...(materiais.length > 0
          ? materiais.map(
              (m) =>
                new TableRow({
                  children: [
                    createDataCell(m.nome, 2800, AlignmentType.LEFT, true),
                    createDataCell(`${m.quantidadePrevista} ${m.unidadeMedida}`, 1800, AlignmentType.CENTER),
                    createDataCell(`${m.quantidadeAdquirida} ${m.unidadeMedida}`, 1800, AlignmentType.CENTER),
                    createDataCell(`${m.quantidadeDistribuida} ${m.unidadeMedida}`, 1800, AlignmentType.CENTER, true),
                    createDataCell(m.destinacao || '—', 1400),
                  ],
                })
            )
          : [
              new TableRow({
                children: [createDataCell('Nenhum material movimentado no período.', TABLE_WIDTH, AlignmentType.CENTER)],
              }),
            ]),
      ],
    }),
    new Paragraph({
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({
          text: 'Quando houver entrega individual de materiais ou uniformes aos beneficiários ou profissionais, recomenda-se manter termo/lista de entrega e recebimento, contendo identificação, quantidade, data e assinatura do destinatário.',
          italics: true,
          size: 17,
          color: '6B7280',
        }),
      ],
    })
  );

  // 11. CUMPRIMENTO DAS METAS
  const justMetas =
    pareceresEditados?.justificativaMetas ||
    'Todas as metas pactuadas no Plano de Trabalho foram integralmente executadas dentro dos padrões de excelência técnica e metodológica estabelecidos, com ampla adesão comunitária e frequência superior à meta mínima pactuada.';

  docChildren.push(
    createSectionHeading('11. CUMPRIMENTO DAS METAS'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: 'A análise deverá comparar diretamente aquilo que foi previsto no Plano de Trabalho com o resultado efetivamente alcançado.',
          size: 19,
          color: '374151',
        }),
      ],
    }),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [3600, 1600, 1600, 1600, 1200],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Meta/Indicador', 3600),
            createHeaderCell('Previsto', 1600, AlignmentType.CENTER),
            createHeaderCell('Executado', 1600, AlignmentType.CENTER),
            createHeaderCell('Percentual de Execução', 1600, AlignmentType.CENTER),
            createHeaderCell('Situação', 1200, AlignmentType.CENTER),
          ],
        }),
        ...cumprimentoMetas.map(
          (m) =>
            new TableRow({
              children: [
                createDataCell(m.meta, 3600),
                createDataCell(`${m.previsto} ${m.unidade}`, 1600, AlignmentType.CENTER),
                createDataCell(`${m.realizado} ${m.unidade}`, 1600, AlignmentType.CENTER, true),
                createDataCell(`${m.percentualExecucao}%`, 1600, AlignmentType.CENTER, true),
                createDataCell(m.situacao, 1200, AlignmentType.CENTER),
              ],
            })
        ),
      ],
    }),
    new Paragraph({
      spacing: { before: 150, after: 200 },
      children: [
        new TextRun({ text: 'Análise do cumprimento das metas: ', bold: true, size: 19 }),
        new TextRun({ text: justMetas, size: 19, color: '374151' }),
      ],
    })
  );

  // 12. REGISTRO FOTOGRÁFICO
  docChildren.push(
    createSectionHeading('12. REGISTRO FOTOGRÁFICO'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: 'Inserir registros fotográficos que demonstrem a efetiva realização das atividades.',
          size: 19,
          color: '374151',
        }),
      ],
    })
  );

  // 13. PRINCIPAIS OCORRÊNCIAS E PROVIDÊNCIAS
  docChildren.push(
    createSectionHeading('13. PRINCIPAIS OCORRÊNCIAS E PROVIDÊNCIAS'),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [3000, 1800, 3200, 1600],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createHeaderCell('Ocorrência / Desafio Registrado', 3000),
            createHeaderCell('Gravidade', 1800),
            createHeaderCell('Providência Adotada', 3200),
            createHeaderCell('Status', 1600, AlignmentType.CENTER),
          ],
        }),
        ...(dados.ocorrencias.length > 0
          ? dados.ocorrencias.map(
              (o) =>
                new TableRow({
                  children: [
                    createDataCell(o.titulo, 3000),
                    createDataCell(o.gravidade, 1800),
                    createDataCell(o.providencias || '—', 3200),
                    createDataCell(o.status, 1600, AlignmentType.CENTER, true),
                  ],
                })
            )
          : [
              new TableRow({
                children: [
                  createDataCell(
                    'Operação sem intercorrências graves no período. Todas as rotinas foram mantidas com normalidade.',
                    TABLE_WIDTH,
                    AlignmentType.CENTER
                  ),
                ],
              }),
            ]),
      ],
    })
  );

  // 14. RESULTADOS ALCANÇADOS
  const resTexto =
    pareceresEditados?.impactoSocialTexto ||
    `Durante o período de ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}, a execução do projeto ${objeto.nome} gerou impacto direto na vida de ${beneficiarios.totalCadastrados} crianças e adolescentes, com foco prioritário em famílias em situação de vulnerabilidade social (${beneficiarios.percentualVulnerabilidade}% dos matriculados). Destacam-se o fortalecimento da convivência comunitária, a promoção da disciplina e cooperação por meio do futebol/futsal com metodologia Gol do Brasil da CBF, e a melhoria no rendimento escolar dos participantes.`;

  docChildren.push(
    createSectionHeading('14. RESULTADOS ALCANÇADOS'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [new TextRun({ text: resTexto, size: 19, color: '374151' })],
    })
  );

  // 15. CONCLUSÃO
  const concTexto =
    pareceresEditados?.conclusaoTexto ||
    `Diante do exposto, atesta-se que as atividades previstas no Plano de Trabalho foram rigorosamente executadas, atendendo aos objetivos da parceria celebrada sob o ${objeto.termoDeFomento || 'Termo de Parceria'} com o ${objeto.concedente?.nome || 'Órgão Concedente'}, demonstrando a boa e regular aplicação dos recursos e o cumprimento pleno da finalidade pública e social.`;

  docChildren.push(
    createSectionHeading('15. CONCLUSÃO'),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [new TextRun({ text: concTexto, size: 19, color: '374151' })],
    })
  );

  // 16. DOCUMENTOS COMPROBATÓRIOS / ANEXOS
  docChildren.push(
    createSectionHeading('16. DOCUMENTOS COMPROBATÓRIOS / ANEXOS'),
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
  const respElab = signatariosEditados?.responsavelElaboracao || { nome: '—', cargo: 'Responsável pela elaboração do relatório' };
  const coordGeral = signatariosEditados?.coordenadorGeral || { nome: '—', cargo: 'Coordenação do Projeto' };
  const repLegal = signatariosEditados?.representanteLegal || { nome: organizacao?.nomeResponsavel || '—', cargo: `Representante legal${organizacao?.nome ? ` - ${organizacao.nome}` : ''}` };

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
