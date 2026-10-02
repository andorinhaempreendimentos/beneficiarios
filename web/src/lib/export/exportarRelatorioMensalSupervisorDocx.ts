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
  ShadingType,
  PageBreak,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { formatarData } from '@/lib/utils';
import type { SupervisaoApi, TurmaApi } from '@/lib/api/services';

const TABLE_WIDTH = 9600; // DXA (~17cm para folha A4)

const CELL_MARGINS = {
  top: 100,
  bottom: 100,
  left: 140,
  right: 140,
};

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '94A3B8',
};

const CELL_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
};

function createCell(
  text: string,
  widthDxa: number,
  opts?: {
    bold?: boolean;
    header?: boolean;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    color?: string;
  }
): TableCell {
  const isHeader = opts?.header ?? false;
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    shading: isHeader ? { fill: 'F1F5F9', type: ShadingType.CLEAR } : undefined,
    margins: CELL_MARGINS,
    borders: CELL_BORDERS,
    children: [
      new Paragraph({
        alignment: opts?.alignment ?? AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold: opts?.bold ?? isHeader,
            size: isHeader ? 17 : 17, // ~8.5pt
            color: opts?.color ?? '1E293B',
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 22, // 11pt
        color: '0F172A',
        font: 'Calibri',
      }),
    ],
  });
}

function createSubHeading(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 140, after: 60 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 19, // 9.5pt
        color: '334155',
        font: 'Calibri',
      }),
    ],
  });
}

function createTextBlock(content?: string | null): Paragraph {
  const txt = content && content.trim() ? content.trim() : '—';
  return new Paragraph({
    spacing: { before: 40, after: 100 },
    children: [
      new TextRun({
        text: txt,
        size: 18, // 9pt
        color: '334155',
        font: 'Calibri',
      }),
    ],
  });
}

async function fetchImageBuffer(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return new Uint8Array(arr);
  } catch {
    return null;
  }
}

export interface SinteseMesRelatorio {
  pontosPositivos?: string;
  dificuldades?: string;
  pendenciasMesSeguinte?: string;
  providenciasNecessarias?: string;
}

export interface DadosRelatorioMensalSupervisor {
  mes: number;
  ano: number;
  coordenadorNome: string;
  regiao: string;
  dataEntrega: string;
  supervisoes: SupervisaoApi[];
  professoresMap?: Record<string, string>;
  turmasMap?: Record<string, TurmaApi[]>;
  sinteseMes?: SinteseMesRelatorio;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export async function exportarRelatorioMensalSupervisorDocx(dados: DadosRelatorioMensalSupervisor) {
  const { mes, ano, coordenadorNome, regiao, dataEntrega, supervisoes, professoresMap, turmasMap, sinteseMes } = dados;

  const nomeMes = MESES[mes - 1] || `Mês ${mes}`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const periodoStr = `01/${String(mes).padStart(2, '0')}/${ano} a ${ultimoDia}/${String(mes).padStart(2, '0')}/${ano}`;

  // Núcleos únicos acompanhados
  const nucleosIdsUnicos = Array.from(new Set(supervisoes.map((s) => s.nucleoId)));
  const totalNucleosAcompanhados = nucleosIdsUnicos.length;
  const totalSupervisoesRealizadas = supervisoes.length;

  const children: (Paragraph | Table)[] = [];

  // Cabeçalho Oficial
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'INSTITUTO ATLETA PARA SEMPRE – IAPS',
          bold: true,
          size: 24, // 12pt
          color: '0F172A',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: 'PROJETO ESCOLINHAS DE FUTEBOL E FUTSAL DE PALMAS',
          bold: true,
          size: 21, // 10.5pt
          color: '1E293B',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: 'NÚCLEOS DE INCLUSÃO E CIDADANIA',
          bold: true,
          size: 20, // 10pt
          color: '334155',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 200 },
      children: [
        new TextRun({
          text: 'RELATÓRIO MENSAL DE SUPERVISÃO DOS NÚCLEOS',
          bold: true,
          size: 24, // 12pt
          color: '0284C7', // Tom azul escuro institucional
          font: 'Calibri',
        }),
      ],
    })
  );

  // Tabela de Identificação
  const wId1 = 2600;
  const wId2 = 2200;
  const wId3 = 2600;
  const wId4 = 2200;

  children.push(
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            createCell('Mês/Ano:', wId1, { bold: true }),
            createCell(`${nomeMes}/${ano}`, wId2),
            createCell('Coordenador(a):', wId3, { bold: true }),
            createCell(coordenadorNome || '—', wId4),
          ],
        }),
        new TableRow({
          children: [
            createCell('Região/Coordenação:', wId1, { bold: true }),
            createCell(regiao || 'Palmas - TO', wId2),
            createCell('Período do relatório:', wId3, { bold: true }),
            createCell(periodoStr, wId4),
          ],
        }),
        new TableRow({
          children: [
            createCell('Nº de núcleos acompanhados:', wId1, { bold: true }),
            createCell(String(totalNucleosAcompanhados), wId2),
            createCell('Nº de supervisões realizadas:', wId3, { bold: true }),
            createCell(String(totalSupervisoesRealizadas), wId4),
          ],
        }),
        new TableRow({
          children: [
            createCell('Data de entrega:', wId1, { bold: true }),
            createCell(dataEntrega || formatarData(new Date().toISOString()), wId2 + wId3 + wId4),
          ],
        }),
      ],
    })
  );

  // 1. RESUMO DAS SUPERVISÕES REALIZADAS NO MÊS
  children.push(createSectionHeading('1. RESUMO DAS SUPERVISÕES REALIZADAS NO MÊS'));

  const wResData = 1100;
  const wResNucleo = 1700;
  const wResProf = 1500;
  const wResHora = 1100;
  const wResBen = 1100;
  const wResSit = 1000;
  const wResPend = 1050;
  const wResProv = 1050;

  const resumoRows: TableRow[] = [
    new TableRow({
      children: [
        createCell('Data', wResData, { header: true }),
        createCell('Núcleo', wResNucleo, { header: true }),
        createCell('Professor(a)', wResProf, { header: true }),
        createCell('Horário', wResHora, { header: true }),
        createCell('Beneficiários', wResBen, { header: true }),
        createCell('Situação', wResSit, { header: true }),
        createCell('Pendências', wResPend, { header: true }),
        createCell('Providências', wResProv, { header: true }),
      ],
    }),
  ];

  for (const s of supervisoes) {
    const nomeNucleo = s.nucleo?.identificacao || '—';
    const horario = s.horaSaida ? `${s.horaEntrada} às ${s.horaSaida}` : s.horaEntrada;
    
    // Nomes dos professores
    let profNome = '—';
    if (s.professoresIds && s.professoresIds.length > 0 && professoresMap) {
      profNome = s.professoresIds.map((id) => professoresMap[id] || id).join(', ');
    } else if (turmasMap && turmasMap[s.nucleoId]) {
      const profsTurma = Array.from(new Set(turmasMap[s.nucleoId].flatMap((t) => t.responsaveisNomes || []).filter(Boolean)));
      if (profsTurma.length > 0) profNome = profsTurma.join(', ');
    }

    const benTxt = s.beneficiariosPresentes != null
      ? `${s.beneficiariosPresentes}${s.beneficiariosEsperados != null ? ` / ${s.beneficiariosEsperados}` : ''}`
      : '—';

    // Situação
    const regular = s.estruturaAvaliacao === 'regular' || s.materiaisAvaliacao === 'regular';
    const critica = s.estruturaAvaliacao === 'ruim' || s.estruturaAvaliacao === 'critica' || s.materiaisAvaliacao === 'ruim' || s.materiaisAvaliacao === 'critica';
    const situacao = critica ? 'Requer atenção' : regular ? 'Regular' : 'Conforme';

    const pendencias = s.gradeCumprida === false ? 'Grade horária pendente' : (s.estruturaObservacoes || s.materiaisObservacoes || 'Nenhuma');
    const providencias = s.observacoesGerais || 'Acompanhamento de rotina';

    resumoRows.push(
      new TableRow({
        children: [
          createCell(formatarData(s.dataSupervisao), wResData),
          createCell(nomeNucleo, wResNucleo),
          createCell(profNome, wResProf),
          createCell(horario, wResHora),
          createCell(benTxt, wResBen),
          createCell(situacao, wResSit),
          createCell(pendencias, wResPend),
          createCell(providencias, wResProv),
        ],
      })
    );
  }

  if (supervisoes.length === 0) {
    for (let i = 0; i < 6; i++) {
      resumoRows.push(
        new TableRow({
          children: [
            createCell('', wResData),
            createCell('', wResNucleo),
            createCell('', wResProf),
            createCell('', wResHora),
            createCell('', wResBen),
            createCell('', wResSit),
            createCell('', wResPend),
            createCell('', wResProv),
          ],
        })
      );
    }
  }

  children.push(
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      rows: resumoRows,
    })
  );

  // 2. SÍNTESE DO MÊS (Só renderiza se houver conteúdo preenchido)
  const temSintese = sinteseMes && (
    (sinteseMes.pontosPositivos && sinteseMes.pontosPositivos.trim().length > 0) ||
    (sinteseMes.dificuldades && sinteseMes.dificuldades.trim().length > 0) ||
    (sinteseMes.pendenciasMesSeguinte && sinteseMes.pendenciasMesSeguinte.trim().length > 0) ||
    (sinteseMes.providenciasNecessarias && sinteseMes.providenciasNecessarias.trim().length > 0)
  );

  let proximoNumeroSecao = 2;

  if (temSintese) {
    children.push(createSectionHeading('2. SÍNTESE DO MÊS'));

    if (sinteseMes.pontosPositivos?.trim()) {
      children.push(createSubHeading('Principais pontos positivos observados:'));
      children.push(createTextBlock(sinteseMes.pontosPositivos));
    }
    if (sinteseMes.dificuldades?.trim()) {
      children.push(createSubHeading('Principais dificuldades/ocorrências:'));
      children.push(createTextBlock(sinteseMes.dificuldades));
    }
    if (sinteseMes.pendenciasMesSeguinte?.trim()) {
      children.push(createSubHeading('Pendências que permanecem para o mês seguinte:'));
      children.push(createTextBlock(sinteseMes.pendenciasMesSeguinte));
    }
    if (sinteseMes.providenciasNecessarias?.trim()) {
      children.push(createSubHeading('Providências e encaminhamentos necessários:'));
      children.push(createTextBlock(sinteseMes.providenciasNecessarias));
    }

    proximoNumeroSecao = 3;
  }

  // 3. REGISTRO DETALHADO POR SUPERVISÃO
  if (supervisoes.length === 0) {
    children.push(
      createSectionHeading(`${proximoNumeroSecao}. REGISTRO DETALHADO – SUPERVISÃO Nº 1 (MODELO)`)
    );

    const wD1 = 2400;
    const wD2 = 2400;
    const wD3 = 2400;
    const wD4 = 2400;

    children.push(
      new Table({
        width: { size: TABLE_WIDTH, type: WidthType.DXA },
        rows: [
          new TableRow({
            children: [
              createCell('Data:', wD1, { bold: true }),
              createCell('___/___/______', wD2),
              createCell('Núcleo:', wD3, { bold: true }),
              createCell('________________________', wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Entrada:', wD1, { bold: true }),
              createCell('___:___', wD2),
              createCell('Saída:', wD3, { bold: true }),
              createCell('___:___', wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Professor(a):', wD1, { bold: true }),
              createCell('________________________', wD2),
              createCell('Presença:', wD3, { bold: true }),
              createCell('☐ Presente   ☐ Ausente', wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Turma(s)/faixa etária:', wD1, { bold: true }),
              createCell('________________________', wD2),
              createCell('Beneficiários presentes:', wD3, { bold: true }),
              createCell('Presentes: ____   Esperados: ____', wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Grade de horários:', wD1, { bold: true }),
              createCell('☐ Conforme   ☐ Não conforme', wD2),
              createCell('Frequência/chamada:', wD3, { bold: true }),
              createCell('☐ Conferida   ☐ Pendente', wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Espaço físico:', wD1, { bold: true }),
              createCell('☐ Adequado   ☐ Requer atenção', wD2),
              createCell('Materiais esportivos:', wD3, { bold: true }),
              createCell('☐ Adequados   ☐ Pendentes', wD4),
            ],
          }),
        ],
      })
    );

    children.push(createSubHeading('Atividades desenvolvidas:'));
    children.push(createTextBlock('(Nenhuma supervisão registrada para este período)'));

    children.push(createSubHeading('Observações / Recomendações:'));
    children.push(createTextBlock('—'));

    children.push(createSubHeading('Orientações repassadas ao professor:'));
    children.push(createTextBlock('—'));

    children.push(
      new Paragraph({
        spacing: { before: 100, after: 180 },
        children: [
          new TextRun({ text: 'Registro fotográfico: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({ text: '☐ Anexado   ☒ Não se aplica', size: 18, font: 'Calibri' }),
        ],
      })
    );
  } else {
    supervisoes.forEach((s, idx) => {
      const numSup = idx + 1;
      children.push(
        createSectionHeading(`${proximoNumeroSecao}. REGISTRO DETALHADO – SUPERVISÃO Nº ${numSup}`)
      );

    const nomeNucleo = s.nucleo?.identificacao || '—';
    const profPresente = s.professorPresente === true;
    const profAusente = s.professorPresente === false;
    const gradeOk = s.gradeCumprida === true;
    const gradeNao = s.gradeCumprida === false;
    const freqOk = true; // Por padrão conferida in loco
    const espacoOk = s.estruturaAvaliacao === 'otima' || s.estruturaAvaliacao === 'boa' || s.estruturaAvaliacao === null;
    const matOk = s.materiaisAvaliacao === 'otima' || s.materiaisAvaliacao === 'boa' || s.materiaisAvaliacao === null;

    let profNome = '—';
    if (s.professoresIds && s.professoresIds.length > 0 && professoresMap) {
      profNome = s.professoresIds.map((id) => professoresMap[id] || id).join(', ');
    } else if (turmasMap && turmasMap[s.nucleoId]) {
      const profsTurma = Array.from(new Set(turmasMap[s.nucleoId].flatMap((t) => t.responsaveisNomes || []).filter(Boolean)));
      if (profsTurma.length > 0) profNome = profsTurma.join(', ');
    }

    let turmasFaixas = 'Turmas regulares de futebol/futsal';
    if (turmasMap && turmasMap[s.nucleoId]) {
      const faixas = turmasMap[s.nucleoId]
        .map((t) => t.faixaEtaria?.nome || t.categoria?.nome || t.nome)
        .filter(Boolean);
      if (faixas.length > 0) turmasFaixas = Array.from(new Set(faixas)).join(', ');
    }

    const presentesTxt = s.beneficiariosPresentes != null
      ? `${s.beneficiariosPresentes}${s.beneficiariosEsperados != null ? ` (esperados: ${s.beneficiariosEsperados})` : ''}`
      : '—';

    const wD1 = 2400;
    const wD2 = 2400;
    const wD3 = 2400;
    const wD4 = 2400;

    children.push(
      new Table({
        width: { size: TABLE_WIDTH, type: WidthType.DXA },
        rows: [
          new TableRow({
            children: [
              createCell('Data:', wD1, { bold: true }),
              createCell(formatarData(s.dataSupervisao), wD2),
              createCell('Núcleo:', wD3, { bold: true }),
              createCell(nomeNucleo, wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Entrada:', wD1, { bold: true }),
              createCell(s.horaEntrada, wD2),
              createCell('Saída:', wD3, { bold: true }),
              createCell(s.horaSaida || '—', wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Professor(a):', wD1, { bold: true }),
              createCell(profNome, wD2),
              createCell('Presença:', wD3, { bold: true }),
              createCell(`${profPresente ? '☒' : '☐'} Presente   ${profAusente ? '☒' : '☐'} Ausente`, wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Turma(s)/faixa etária:', wD1, { bold: true }),
              createCell(turmasFaixas, wD2),
              createCell('Beneficiários presentes:', wD3, { bold: true }),
              createCell(presentesTxt, wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Grade de horários:', wD1, { bold: true }),
              createCell(`${gradeOk ? '☒' : '☐'} Conforme   ${gradeNao ? '☒' : '☐'} Não conforme`, wD2),
              createCell('Frequência/chamada:', wD3, { bold: true }),
              createCell(`${freqOk ? '☒' : '☐'} Conferida   ☐ Pendente`, wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Espaço físico:', wD1, { bold: true }),
              createCell(`${espacoOk ? '☒' : '☐'} Adequado   ${!espacoOk ? '☒' : '☐'} Requer atenção`, wD2),
              createCell('Materiais esportivos:', wD3, { bold: true }),
              createCell(`${matOk ? '☒' : '☐'} Adequados   ${!matOk ? '☒' : '☐'} Pendentes`, wD4),
            ],
          }),
          new TableRow({
            children: [
              createCell('Atividade acompanhada:', wD1, { bold: true }),
              createCell('Treinamento e vivência esportiva em campo/quadra', wD2 + wD3 + wD4),
            ],
          }),
        ],
      })
    );

    // Campos textuais detalhados
    children.push(createSubHeading('Observações da supervisão:'));
    children.push(createTextBlock(s.observacoesGerais || 'Atividades desenvolvidas dentro da normalidade operacional.'));

    children.push(createSubHeading('Ocorrências/dificuldades identificadas:'));
    const difs = [s.estruturaObservacoes, s.materiaisObservacoes, s.uniformesObservacoes, s.gradeObservacoes].filter(Boolean).join('; ');
    children.push(createTextBlock(difs || 'Nenhuma ocorrência prejudicial identificada no momento da visita.'));

    children.push(createSubHeading('Orientações repassadas ao professor:'));
    children.push(createTextBlock('Reforçada a necessidade de registro rigoroso da lista de presença diária e zeladoria dos materiais e uniformes.'));

    children.push(createSubHeading('Pendências e providências adotadas:'));
    children.push(createTextBlock(!espacoOk || !matOk ? 'Encaminhado comunicado à coordenação para reposição/reparo necessário.' : 'Sem pendências operacionais.'));

    children.push(createSubHeading('Prazo para regularização/acompanhamento:'));
    children.push(createTextBlock('Próxima visita de supervisão in loco.'));

    const temFotosNestaSup = s.fotos && s.fotos.length > 0;
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 180 },
        children: [
          new TextRun({ text: 'Registro fotográfico: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({ text: `${temFotosNestaSup ? '☒' : '☐'} Anexado   ${!temFotosNestaSup ? '☒' : '☐'} Não se aplica`, size: 18, font: 'Calibri' }),
        ],
      })
    );
  });
  }

  proximoNumeroSecao++;

  // 4. REGISTRO FOTOGRÁFICO
  const todasFotos = supervisoes.flatMap((s) => (s.fotos || []).map((f) => ({ ...f, nucleoNome: s.nucleo?.identificacao || 'Núcleo', data: s.dataSupervisao })));
  
  children.push(createSectionHeading(`${proximoNumeroSecao}. REGISTRO FOTOGRÁFICO`));

  if (todasFotos.length === 0) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 180 },
        children: [
          new TextRun({
            text: 'Nenhum registro fotográfico anexado no sistema para este período.',
            size: 18,
            font: 'Calibri',
            italics: true,
            color: '64748B',
          }),
        ],
      })
    );
  } else {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({
            text: `Registros fotográficos comprobatórios das visitas aos núcleos no período (${todasFotos.length} imagem(ns)):`,
            size: 18,
            font: 'Calibri',
          }),
        ],
      })
    );

    // Tentativa de embutir imagens (até 12 fotos para manter documento leve e estável)
    const fotosProcessar = todasFotos.slice(0, 12);
    for (const foto of fotosProcessar) {
      const buffer = await fetchImageBuffer(foto.url);
      if (buffer) {
        try {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 60 },
              children: [
                new ImageRun({
                  type: foto.url.toLowerCase().includes('.png') ? 'png' : 'jpg',
                  data: buffer,
                  transformation: {
                    width: 380,
                    height: 250,
                  },
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 160 },
              children: [
                new TextRun({
                  text: `Foto — ${foto.nucleoNome} (${formatarData(foto.data)})${foto.legenda ? ` · ${foto.legenda}` : ''}`,
                  size: 16,
                  color: '64748B',
                  font: 'Calibri',
                  italics: true,
                }),
              ],
            })
          );
        } catch {
          // Fallback caso gere erro na imagem
          children.push(
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [
                new TextRun({
                  text: `• Foto arquivada: ${foto.nucleoNome} (${formatarData(foto.data)}) - ${foto.url}`,
                  size: 16,
                  color: '64748B',
                  font: 'Calibri',
                }),
              ],
            })
          );
        }
      }
    }
  }

  proximoNumeroSecao++;

  // 5. DECLARAÇÃO DO COORDENADOR
  children.push(
    createSectionHeading('DECLARAÇÃO DO COORDENADOR'),
    new Paragraph({
      spacing: { before: 120, after: 300 },
      children: [
        new TextRun({
          text: 'Declaro que as informações constantes neste relatório refletem com fidedignidade as visitas de supervisão realizadas aos núcleos sob minha responsabilidade no período indicado, bem como as condições verificadas in loco.',
          size: 19,
          font: 'Calibri',
          color: '334155',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 100, after: 400 },
      children: [
        new TextRun({
          text: `Palmas - TO, ${dataEntrega || formatarData(new Date().toISOString())}`,
          size: 19,
          font: 'Calibri',
          color: '334155',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 40 },
      children: [
        new TextRun({
          text: '___________________________________________________________',
          color: '64748B',
          size: 18,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: coordenadorNome || 'Coordenador(a) Responsável',
          bold: true,
          size: 20,
          color: '0F172A',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      children: [
        new TextRun({
          text: 'Coordenador(a) de Núcleo',
          size: 18,
          color: '64748B',
          font: 'Calibri',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 2.54 cm
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeCoordNome = (coordenadorNome || 'Coordenador').replace(/[^a-zA-Z0-9_-]/g, '_');
  const nomeArquivo = `Relatorio_Mensal_Supervisao_${safeCoordNome}_${nomeMes}_${ano}.docx`;
  saveAs(blob, nomeArquivo);
}
