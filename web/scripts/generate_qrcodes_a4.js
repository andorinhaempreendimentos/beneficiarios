const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { QRCodeSVG } = require('qrcode.react');

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

function generateSvgQr(url, size = 280) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(QRCodeSVG, {
      value: url,
      size: size,
      level: 'H',
      includeMargin: true,
    })
  );
}

function generateSvgQrSmall(url, size = 130) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(QRCodeSVG, {
      value: url,
      size: size,
      level: 'H',
      includeMargin: true,
    })
  );
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Codes A4 - Inscrição nos Núcleos | Projeto Andorinha</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <!-- Biblioteca para download direto em PDF sem quebra de página -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0f172a;
      color: #0f172a;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* BARRA SUPERIOR DE CONTROLE (NÃO SAI NA IMPRESSÃO) */
    .top-controls {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #1e293b;
      color: white;
      padding: 12px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      border-bottom: 1px solid #334155;
    }

    .top-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .top-title h1 {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #f8fafc;
    }

    .top-title span.badge {
      background: #0284c7;
      color: #e0f2fe;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .controls-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .select-control {
      background: #0f172a;
      border: 1px solid #475569;
      color: #f8fafc;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }

    .select-control:focus {
      border-color: #38bdf8;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .btn-download {
      background: #059669;
      color: white;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
    }
    .btn-download:hover {
      background: #047857;
      transform: translateY(-1px);
    }
    .btn-download:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-zip {
      background: #7c3aed;
      color: white;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
    }
    .btn-zip:hover {
      background: #6d28d9;
      transform: translateY(-1px);
    }

    .btn-primary {
      background: #0284c7;
      color: white;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
    }
    .btn-primary:hover {
      background: #0369a1;
      transform: translateY(-1px);
    }

    .view-mode-tabs {
      display: inline-flex;
      background: #0f172a;
      border-radius: 8px;
      padding: 2px;
      border: 1px solid #334155;
    }

    .view-tab {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .view-tab.active {
      background: #0284c7;
      color: white;
    }

    /* CONTAINER PRINCIPAL DAS FOLHAS */
    .pages-container {
      padding: 24px 12px 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
    }

    /* ========================================================
       ESTILOS EXCLUSIVOS PARA O CARTAZ A4 (RIGOROSAMENTE 1 PÁGINA)
       Dimensões: 210mm x 297mm
       ======================================================== */
    .a4-page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      min-height: 297mm;
      background: #ffffff;
      margin: 0 auto;
      padding: 8mm 12mm 6mm;
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-radius: 6px;
      box-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Moldura visual decorativa do cartaz */
    .a4-border-frame {
      position: absolute;
      inset: 4mm;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      pointer-events: none;
    }

    .cartaz-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }

    /* Header Institucional */
    .cartaz-header {
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 2px dashed #cbd5e1;
    }

    .badge-institucional {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0284c7;
      color: #ffffff;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 14px;
      border-radius: 9999px;
      margin-bottom: 6px;
    }

    .cartaz-title {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.03em;
      line-height: 1.1;
      text-transform: uppercase;
    }

    .cartaz-subtitle {
      font-size: 12px;
      font-weight: 700;
      color: #0369a1;
      margin-top: 4px;
      letter-spacing: 0.02em;
    }

    /* Card do Núcleo */
    .nucleo-badge-card {
      margin: 10px 0;
      background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
      border: 3px solid #0284c7;
      border-radius: 16px;
      padding: 12px 18px;
      text-align: center;
      box-shadow: 0 6px 18px -4px rgba(2, 132, 199, 0.12);
    }

    .nucleo-tag {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #0369a1;
      margin-bottom: 2px;
    }

    .nucleo-nome {
      font-size: 32px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 2px 0 4px;
      line-height: 1.15;
    }

    .nucleo-local {
      font-size: 14px;
      font-weight: 700;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    /* Área Central com QR Code */
    .qr-central-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 8px 0;
      text-align: center;
    }

    .qr-box {
      background: #ffffff;
      padding: 12px;
      border-radius: 20px;
      border: 3.5px solid #0f172a;
      box-shadow: 0 14px 28px -8px rgba(15, 23, 42, 0.18);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .qr-box svg {
      display: block;
      width: 280px;
      height: 280px;
    }

    .qr-instructions-pill {
      margin-top: 10px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #0f172a;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      padding: 6px 20px;
      border-radius: 9999px;
      letter-spacing: 0.02em;
    }

    /* 3 Passos Rápidos para os Pais */
    .steps-row {
      display: grid;
      grid-cols: 3;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 10px 0 6px;
    }

    .step-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 8px 6px;
      text-align: center;
    }

    .step-number {
      width: 22px;
      height: 22px;
      background: #0284c7;
      color: white;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 900;
      margin-bottom: 2px;
    }

    .step-text {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.25;
    }

    /* Rodapé do Cartaz */
    .cartaz-footer {
      border-top: 2px dashed #cbd5e1;
      padding-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
    }

    .cartaz-footer strong {
      color: #0f172a;
    }

    /* ========================================================
       MODO GRADE (4 CARTÕES POR FOLHA A4)
       ======================================================== */
    .grid-view-container {
      display: none;
      width: 100%;
      flex-direction: column;
      align-items: center;
      gap: 32px;
    }

    .a4-grid-page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      min-height: 297mm;
      background: #ffffff;
      margin: 0 auto;
      padding: 8mm;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 6mm;
      box-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.5);
      border-radius: 6px;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }

    .mini-card {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      background: #ffffff;
      overflow: hidden;
    }

    .mini-card-header {
      width: 100%;
      background: #0284c7;
      color: white;
      padding: 4px 6px;
      border-radius: 6px;
      margin-bottom: 4px;
    }

    .mini-card-header h4 {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mini-card-nome {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
      margin: 2px 0;
    }

    .mini-card-local {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
    }

    .mini-card-qr {
      background: #ffffff;
      padding: 4px;
      border-radius: 10px;
      border: 2px solid #0f172a;
      margin: 4px 0;
      display: inline-flex;
    }

    .mini-card-qr svg {
      width: 120px;
      height: 120px;
      display: block;
    }

    .mini-card-cta {
      font-size: 9.5px;
      font-weight: 800;
      color: #0284c7;
      text-transform: uppercase;
    }

    /* REGRAS CRÍTICAS PARA IMPRESSÃO - 100% EXATO A4 */
    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      html, body {
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: hidden !important;
      }

      .top-controls, .no-print {
        display: none !important;
      }

      .pages-container {
        padding: 0 !important;
        gap: 0 !important;
        display: block !important;
      }

      .a4-page {
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        min-height: 297mm !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 8mm 12mm 6mm !important;
        overflow: hidden !important;
      }

      .a4-grid-page {
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        min-height: 297mm !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 8mm !important;
        overflow: hidden !important;
      }
    }
  </style>
</head>
<body>

  <!-- BARRA DE CONTROLE INTERATIVA (VISÍVEL APENAS NA TELA) -->
  <div class="top-controls">
    <div class="top-title">
      <span class="badge">A4 Pronto para Impressão</span>
      <h1>QR Codes dos Núcleos • Projeto Andorinha</h1>
    </div>

    <div class="controls-actions">
      <!-- Seletor de Modo de Visualização -->
      <div class="view-mode-tabs">
        <button type="button" class="view-tab active" onclick="switchView('posters')">
          📄 Cartaz A4 (1 por folha)
        </button>
        <button type="button" class="view-tab" onclick="switchView('grid')">
          🗂️ Fichas A6 (4 por folha)
        </button>
      </div>

      <!-- Filtro por Núcleo -->
      <select id="selectNucleo" class="select-control" onchange="filterNucleo(this.value)">
        <option value="ALL">Mostrar Todos os 20 Núcleos</option>
        ${nucleos.map((n, i) => `<option value="${n.id}">${i + 1}. ${n.identificacao}</option>`).join('')}
      </select>

      <!-- Botão para Baixar PDF Direto (html2pdf) -->
      <button type="button" class="btn btn-download" id="btnDownloadPdf" onclick="downloadPdf()">
        📥 Baixar PDF Direto
      </button>

      <!-- Botão para Baixar ZIP dos PDFs Separados -->
      <a href="qrcodes-nucleos-pdfs-separados.zip" download="qrcodes_nucleos_pdfs_separados.zip" class="btn btn-zip">
        📦 Baixar ZIP (PDFs Separados)
      </a>

      <!-- Botão de Impressão Nativa -->
      <button type="button" class="btn btn-primary" onclick="window.print()">
        🖨️ Imprimir / Salvar PDF
      </button>
    </div>
  </div>

  <!-- CONTAINER DE CARTAZES A4 (1 POR FOLHA) -->
  <div id="postersView" class="pages-container">
    ${nucleos.map((n) => {
      const url = `https://beneficiarios-andorinha.vercel.app/inscricao/nucleo/${n.id}/cadastro`;
      const svgQr = generateSvgQr(url, 280);
      return `
    <!-- PÁGINA A4 DO NÚCLEO: ${n.identificacao} -->
    <div class="a4-page nucleo-page" data-nucleo-id="${n.id}">
      <div class="a4-border-frame"></div>
      <div class="cartaz-content">
        
        <!-- Topo Institucional -->
        <div class="cartaz-header">
          <div class="badge-institucional">
            ⚽ PROJETO ANDORINHA • ESPORTE & CIDADANIA
          </div>
          <h2 class="cartaz-title">INSCRIÇÕES ABERTAS</h2>
          <div class="cartaz-subtitle">MATRÍCULA DE ALUNOS E ATLETAS • GRATUITO</div>
        </div>

        <!-- Identificação do Núcleo -->
        <div class="nucleo-badge-card">
          <div class="nucleo-tag">NÚCLEO OFICIAL DE TREINAMENTO</div>
          <div class="nucleo-nome">${n.identificacao}</div>
          <div class="nucleo-local">
            <span>📍 ${n.nome_local || n.identificacao}</span>
            <span>•</span>
            <span>Bairro: ${n.bairro || 'Palmas'}</span>
            <span>•</span>
            <span>${n.cidade || 'Palmas'} - ${n.estado || 'TO'}</span>
          </div>
        </div>

        <!-- QR Code Central Gigante -->
        <div class="qr-central-container">
          <div class="qr-box">
            ${svgQr}
          </div>
          <div class="qr-instructions-pill">
            📱 APONTE A CÂMERA DO SEU CELULAR
          </div>
        </div>

        <!-- 3 Passos Fáceis -->
        <div class="steps-row">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-text">Abra a câmera do seu celular</div>
          </div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-text">Aponte para o QR Code acima</div>
          </div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-text">Preencha os dados do responsável e aluno</div>
          </div>
        </div>

        <!-- Rodapé do Cartaz -->
        <div class="cartaz-footer">
          <div>
            <strong>100% Gratuito</strong> • Uniforme Completo Incluso
          </div>
          <div>
            Coordenação Geral • Palmas - Tocantins
          </div>
        </div>

      </div>
    </div>
      `;
    }).join('\n')}
  </div>

  <!-- CONTAINER DE GRADE (4 CARTÕES POR FOLHA A4) -->
  <div id="gridView" class="grid-view-container pages-container">
    ${(() => {
      let gridPagesHtml = '';
      for (let i = 0; i < nucleos.length; i += 4) {
        const batch = nucleos.slice(i, i + 4);
        gridPagesHtml += `
      <div class="a4-grid-page">
        ${batch.map((n) => {
          const url = `https://beneficiarios-andorinha.vercel.app/inscricao/nucleo/${n.id}/cadastro`;
          const svgQrSmall = generateSvgQrSmall(url, 120);
          return `
          <div class="mini-card" data-nucleo-id="${n.id}">
            <div class="mini-card-header">
              <h4>Projeto Andorinha</h4>
            </div>
            <div>
              <div class="mini-card-nome">${n.identificacao}</div>
              <div class="mini-card-local">📍 ${n.bairro || 'Palmas'} - TO</div>
            </div>
            <div class="mini-card-qr">
              ${svgQrSmall}
            </div>
            <div>
              <div class="mini-card-cta">📱 Aponte a Câmera</div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
        `;
      }
      return gridPagesHtml;
    })()}
  </div>

  <script>
    function filterNucleo(id) {
      const posters = document.querySelectorAll('.nucleo-page');
      const miniCards = document.querySelectorAll('.mini-card');
      const btnDl = document.getElementById('btnDownloadPdf');

      posters.forEach(page => {
        if (id === 'ALL' || page.getAttribute('data-nucleo-id') === id) {
          page.style.display = 'flex';
        } else {
          page.style.display = 'none';
        }
      });

      miniCards.forEach(card => {
        if (id === 'ALL' || card.getAttribute('data-nucleo-id') === id) {
          card.style.opacity = '1';
        } else {
          card.style.opacity = '0.15';
        }
      });

      if (id === 'ALL') {
        btnDl.innerHTML = '📥 Baixar PDF Completo (20 Núcleos)';
      } else {
        btnDl.innerHTML = '📥 Baixar PDF deste Núcleo';
      }
    }

    function switchView(mode) {
      const postersView = document.getElementById('postersView');
      const gridView = document.getElementById('gridView');
      const tabs = document.querySelectorAll('.view-tab');

      if (mode === 'posters') {
        postersView.style.display = 'flex';
        gridView.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
      } else {
        postersView.style.display = 'none';
        gridView.style.display = 'flex';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
      }
    }

    async function downloadPdf() {
      const btn = document.getElementById('btnDownloadPdf');
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Gerando PDF, aguarde...';
      btn.disabled = true;

      const sel = document.getElementById('selectNucleo').value;
      const isGridView = document.getElementById('gridView').style.display === 'flex';
      let elementToExport;
      let filename;

      if (sel === 'ALL' && !isGridView) {
        // Download instantâneo do PDF vetorial de 20 páginas pré-compilado
        const a = document.createElement('a');
        a.href = 'qrcodes-todos-os-nucleos-andorinha.pdf';
        a.download = 'qrcodes_todos_os_nucleos_andorinha.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 600);
        return;
      }

      if (isGridView) {
        elementToExport = document.getElementById('gridView');
        filename = 'fichas_qrcodes_nucleos_andorinha.pdf';
      } else {
        elementToExport = document.querySelector(\`.nucleo-page[data-nucleo-id="\${sel}"]\`);
        const nucleoNome = (elementToExport.querySelector('.nucleo-nome')?.textContent || 'nucleo').trim().replace(/[^a-zA-Z0-9]/g, '_');
        filename = \`cartaz_qrcode_\${nucleoNome}.pdf\`;
      }

      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        if (typeof html2pdf !== 'undefined') {
          await html2pdf().set(opt).from(elementToExport).save();
        } else {
          window.print();
        }
      } catch (err) {
        console.error('Erro na exportacao html2pdf:', err);
        alert('Abrindo o diálogo de impressão para salvar o PDF diretamente.');
        window.print();
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>
`;

// Salva nos dois locais (artefato do assistente e pasta pública do Next.js)
const brainPath = 'C:\\\\Users\\\\livia\\\\.gemini\\\\antigravity\\\\brain\\\\0104a02e-fa2b-466f-86da-eeb18866d8cf\\\\qrcodes_nucleos_a4.html';
const webPublicPath = path.resolve(__dirname, '..', 'public', 'qrcodes-nucleos-a4.html');

fs.writeFileSync(brainPath, html, 'utf-8');
console.log('Salvo em:', brainPath);

fs.writeFileSync(webPublicPath, html, 'utf-8');
console.log('Salvo em:', webPublicPath);
