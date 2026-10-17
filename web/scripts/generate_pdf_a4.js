const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { QRCodeSVG } = require('qrcode.react');
const { jsPDF } = require('jspdf');

const nucleos = [
  { id: '23efd617-da43-4e3c-944e-ad09e2790c2b', identificacao: 'Campo T31 - Taquari', nome_local: 'Campo T31', bairro: 'Taquari', cidade: 'Palmas', estado: 'TO' },
  { id: '93ffef82-7f1f-4c44-a84f-6d1f8e97c07d', identificacao: 'Centro Desenv. Futebol Palmas', nome_local: 'Campo da CBF', bairro: 'Setor Polinésia', cidade: 'Palmas', estado: 'TO' },
  { id: 'bc9c92d2-e5aa-4be0-9d8e-3f34a489817e', identificacao: 'Complexo ARNO 51', nome_local: 'Complexo Poliesportivo', bairro: 'ARNO 51', cidade: 'Palmas', estado: 'TO' },
  { id: 'f2b744a0-8295-4ac5-8672-5a9f0ff78ecd', identificacao: 'Escolinha Esportiva de Taquaruçu', nome_local: 'Complexo Esportivo de Taquaruçu', bairro: 'Taquaruçu Centro', cidade: 'Palmas', estado: 'TO' },
  { id: 'f4e42426-4b60-40bf-a060-f659ece0cb57', identificacao: 'Escolinha Flamboyant', nome_local: 'Escolinha Flamboyant', bairro: 'Flamboyant', cidade: 'Palmas', estado: 'TO' },
  { id: 'ef41c13f-abf7-43d1-8882-1a826ff6311d', identificacao: 'Haras RR', nome_local: 'Haras RR', bairro: 'Taquaruçu Grande', cidade: 'Palmas', estado: 'TO' },
  { id: 'c6eb015d-de1c-44c7-af33-3ed4d08be7e0', identificacao: 'Núcleo Aureny III', nome_local: 'Arena Foguin', bairro: 'Aureny III', cidade: 'Palmas', estado: 'TO' },
  { id: '959772b0-1603-4d52-aa49-433b57999b4f', identificacao: 'Núcleo Buritirana', nome_local: 'ETI Luiz Nunes de Oliveira', bairro: 'Buritirana', cidade: 'Palmas', estado: 'TO' },
  { id: 'f30e0b29-e128-4989-ae53-1c9c7f068f4d', identificacao: 'Núcleo Capadócia', nome_local: 'Capadócia Taquari', bairro: 'Capadócia', cidade: 'Palmas', estado: 'TO' },
  { id: '636a8f12-8eaf-4d79-99d2-a505a8ec9d2b', identificacao: 'Núcleo Lago Norte', nome_local: 'Lago Norte', bairro: 'Lago Norte', cidade: 'Palmas', estado: 'TO' },
  { id: 'eaa7dfd2-e5c6-4691-9471-a03eca53011e', identificacao: 'Núcleo Lago Sul', nome_local: 'Residencial Lago Sul', bairro: 'Lago Sul', cidade: 'Palmas', estado: 'TO' },
  { id: '9702bfa5-3194-43cb-8b1c-cb47598d64de', identificacao: 'Núcleo Quadra 1206 Sul', nome_local: 'Área Verde 1206 Sul', bairro: '1206 Sul', cidade: 'Palmas', estado: 'TO' },
  { id: '571bc2ad-1cde-435d-b69f-226111e6644e', identificacao: 'Núcleo Quadra 1303 Sul', nome_local: 'Quadra 1303 Sul', bairro: '1303 Sul', cidade: 'Palmas', estado: 'TO' },
  { id: '71131091-b7a8-4995-ad77-b4637011975d', identificacao: 'Núcleo Quadra 407 Norte', nome_local: 'ARNO 407 Norte', bairro: '407 Norte', cidade: 'Palmas', estado: 'TO' },
  { id: '4b2cbfc8-fd3a-41da-a159-6121121f100f', identificacao: 'Núcleo Quadra 906 Sul', nome_local: 'Plano Diretor Sul', bairro: '906 Sul', cidade: 'Palmas', estado: 'TO' },
  { id: '3c1c5b0c-cbf7-40e6-bb06-0ff39ca0a6f2', identificacao: 'Núcleo Santo Amaro', nome_local: 'Santo Amaro', bairro: 'Santo Amaro', cidade: 'Palmas', estado: 'TO' },
  { id: 'dfed7e80-c260-4b0d-8329-e68c834ed4de', identificacao: 'Núcleo Sol Nascente I', nome_local: 'Setor Sol Nascente', bairro: 'Sol Nascente I', cidade: 'Palmas', estado: 'TO' },
  { id: '39e96034-efcc-46a4-b66b-2a60d27c5293', identificacao: 'Núcleo Vila Agrotins', nome_local: 'Vila Agrotins', bairro: 'Vila Agrotins', cidade: 'Palmas', estado: 'TO' },
  { id: '407360e1-f4d1-4a4a-90b8-2f579353e124', identificacao: 'Quadra Esportiva Praça 208 Sul', nome_local: 'Praça 208 Sul', bairro: '208 Sul', cidade: 'Palmas', estado: 'TO' },
  { id: 'e5305f61-fa4e-4377-9b86-62a7ebceb78e', identificacao: 'Sol Nascente II', nome_local: 'Sol Nascente II', bairro: 'Sol Nascente II', cidade: 'Palmas', estado: 'TO' }
];

function drawVectorQr(doc, url, x0, y0, totalWidth) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QRCodeSVG, {
      value: url,
      size: 200,
      level: 'H',
      includeMargin: true,
    })
  );

  const viewBoxMatch = svg.match(/viewBox="0\s+0\s+(\d+)\s+(\d+)"/);
  const totalSize = viewBoxMatch ? parseInt(viewBoxMatch[1], 10) : 65;
  const cell = totalWidth / totalSize;

  doc.setFillColor(255, 255, 255);
  doc.rect(x0, y0, totalWidth, totalWidth, 'F');

  doc.setFillColor(15, 23, 42); // Navy 900
  const matches = [...svg.matchAll(/M(\d+)\s+(\d+)h(\d+)v1/g)];
  for (const m of matches) {
    const x = parseInt(m[1], 10);
    const y = parseInt(m[2], 10);
    const w = parseInt(m[3], 10);
    doc.rect(x0 + x * cell, y0 + y * cell, w * cell, cell, 'F');
  }
}

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: true,
});

nucleos.forEach((n, index) => {
  if (index > 0) {
    doc.addPage();
  }

  const url = `https://beneficiarios-andorinha.vercel.app/inscricao/nucleo/${n.id}/cadastro`;

  // 1. Moldura Decorativa Externa (A4: 210 x 297mm)
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.8);
  doc.roundedRect(6, 6, 198, 285, 4, 4, 'D');

  // 2. Topo Institucional
  // Badge Projeto Andorinha
  doc.setFillColor(2, 132, 199); // sky-600
  doc.roundedRect(55, 14, 100, 8, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('PROJETO ANDORINHA • ESPORTE & CIDADANIA', 105, 19.5, { align: 'center' });

  // Título e Subtítulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('INSCRIÇÕES ABERTAS', 105, 30, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(3, 105, 161); // sky-700
  doc.text('MATRÍCULA DE ALUNOS E ATLETAS • GRATUITO', 105, 36, { align: 'center' });

  // Linha tracejada
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(16, 40, 194, 40);

  // 3. Card do Núcleo
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(2, 132, 199); // sky-600
  doc.setLineWidth(1);
  doc.roundedRect(16, 44, 178, 38, 5, 5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(3, 105, 161);
  doc.text('NÚCLEO OFICIAL DE TREINAMENTO', 105, 51, { align: 'center' });

  // Nome do Núcleo (com auto-ajuste de fonte se muito longo)
  const nomeNucleo = n.identificacao;
  const fontSize = nomeNucleo.length > 25 ? 20 : 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  doc.setTextColor(15, 23, 42);
  doc.text(nomeNucleo, 105, 63, { align: 'center', maxWidth: 170 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  const localTxt = `${n.nome_local || n.identificacao}  •  Bairro: ${n.bairro || 'Palmas'}  •  ${n.cidade || 'Palmas'} - ${n.estado || 'TO'}`;
  doc.text(localTxt, 105, 74, { align: 'center' });

  // 4. QR Code Box Central
  const qrBoxY = 88;
  const qrBoxSize = 98; // mm
  const qrBoxX = (210 - qrBoxSize) / 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.2);
  doc.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 14, 6, 6, 'FD');

  // Desenha o QR Code vetorial real no centro
  const qrSize = 82;
  const qrX = (210 - qrSize) / 2;
  const qrY = qrBoxY + 6;
  drawVectorQr(doc, url, qrX, qrY, qrSize);

  // Pílula inferior do QR Code
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(52, qrBoxY + qrSize + 9, 106, 9, 4.5, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('APONTE A CÂMERA DO SEU CELULAR', 105, qrBoxY + qrSize + 15, { align: 'center' });

  // 5. 3 Passos Fáceis para os Pais
  const stepsY = 210;
  const colW = 56;
  const gap = 5;
  const startX = 16;

  const steps = [
    { num: '1', title: 'Abra a câmera', desc: 'Abra o leitor ou câmera do celular' },
    { num: '2', title: 'Aponte o código', desc: 'Foque a lente no QR Code acima' },
    { num: '3', title: 'Preencha online', desc: 'Informe os dados do aluno em 2 min' },
  ];

  steps.forEach((s, sIdx) => {
    const x = startX + sIdx * (colW + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, stepsY, colW, 28, 3, 3, 'FD');

    // Círculo com o número
    doc.setFillColor(2, 132, 199);
    doc.circle(x + colW / 2, stepsY + 7, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(s.num, x + colW / 2, stepsY + 8.5, { align: 'center' });

    // Textos do passo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(s.title, x + colW / 2, stepsY + 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(s.desc, x + colW / 2, stepsY + 22, { align: 'center', maxWidth: colW - 4 });
  });

  // 6. Rodapé
  const footerY = 250;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(16, footerY, 194, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('100% Gratuito  •  Uniforme Completo Incluso', 16, footerY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Coordenação Geral  •  Palmas - Tocantins', 194, footerY + 8, { align: 'right' });
});

// Salva o PDF real nos dois locais
const brainPdfPath = 'C:\\\\Users\\\\livia\\\\.gemini\\\\antigravity\\\\brain\\\\0104a02e-fa2b-466f-86da-eeb18866d8cf\\\\qrcodes_todos_os_nucleos_andorinha.pdf';
const webPublicPdfPath = path.resolve(__dirname, '..', 'public', 'qrcodes-todos-os-nucleos-andorinha.pdf');

doc.save(brainPdfPath);
console.log('PDF gerado em:', brainPdfPath);

doc.save(webPublicPdfPath);
console.log('PDF gerado em:', webPublicPdfPath);
