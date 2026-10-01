const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../informacoes/listagem_de_beneficiarios/listas de beneficiarios');
const inputDir = path.join(baseDir, 'listas_completas');
const outputFile = path.join(baseDir, 'beneficiarios_consolidado_7_nucleos.md');

const nucleosConfig = [
  {
    file: 'Listagem de beneficirios inscritos ncleo QUADRA 1206 SUL - Intrutor Kaio.md',
    nucleo: 'Núcleo Quadra 1206 Sul',
    professor: 'Kaio Felipe Moreira dos Santos'
  },
  {
    file: 'Listagem de beneficirios inscritos ncleo Santo Amaro - Intrutor Renato.md',
    nucleo: 'Núcleo Santo Amaro',
    professor: 'Renato Ferreira Fidelis'
  },
  {
    file: 'Listagem de beneficirios inscritos ncleo TAQUARI- Intrutor Aleksandro(1).md',
    nucleo: 'Campo T31 - Taquari',
    professor: 'Aleksandro Soares'
  },
  {
    file: 'Listagem de beneficirios inscritos ncleo VILA AGROTINS - Intrutor Rivaldo.md',
    nucleo: 'Núcleo Vila Agrotins',
    professor: 'Rivaldo'
  },
  {
    file: 'ATLETAS PARA SEMPRE II_2.md',
    nucleo: 'Núcleo Quadra 906 Sul',
    professor: 'Geraldo Vaz da Silva Filho'
  },
  {
    file: 'ATLETAS PARA SEMPRE II_3.md',
    nucleo: 'Haras RR',
    professor: 'Romário Ribeiro Brito'
  },
  {
    file: 'ATLETAS PARA SEMPRE II_4.md',
    nucleo: 'Complexo ARNO 51',
    professor: 'Raphael Santos Oliveira de Sousa'
  }
];

function limpa(val) {
  if (!val) return '—';
  let s = val
    .replace(/<br[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s || s === '-' || s === 'N/A' || s === 'null') return '—';
  return s;
}

function limpaNome(val) {
  let s = limpa(val);
  if (s === '—') return s;
  // Remover qualquer 'sim' ou 'não' acidental do OCR no final
  s = s.replace(/\s+(sim|não|nao)$/i, '').trim();
  // Se veio Sexo fundido
  s = s.replace(/\s*Sexo:.*$/i, '').trim();
  return s;
}

function parseFicha(block, config) {
  // 1. Nome do aluno
  const nomeM = block.match(/\|\s*\*\*Nome:\*\*\s*([^|\n]+)/i);
  const nome = limpaNome(nomeM ? nomeM[1] : '');

  // 2. Data de nascimento
  let nascM = block.match(/\|\s*\*\*Data de Nascimento:\*\*\s*([^|\n]+)/i);
  let nasc = limpa(nascM ? nascM[1] : '');
  if (nasc.includes('PCD')) {
    nasc = nasc.split('PCD')[0].trim();
  }

  // 3. Sexo
  let sexoM = block.match(/\|\s*\*\*Sexo:\*\*\s*([^|\n]+)/i);
  let sexo = limpa(sexoM ? sexoM[1] : '');
  if (!sexo || sexo === '—') {
    if (block.match(/Sexo:\s*Masculino/i)) sexo = 'Masculino';
    else if (block.match(/Sexo:\s*Feminino/i)) sexo = 'Feminino';
  }

  // 4. CPF do aluno
  let cpfM = block.match(/\|\s*\*\*CPF:\*\*\s*([^|\n]+)/i);
  let cpf = limpa(cpfM ? cpfM[1] : '');
  if (cpf.length > 14) {
    const d = cpf.replace(/\D/g, '');
    if (d.length >= 11) cpf = d.slice(0, 11);
  }

  // 5. RG / Certidão
  let rgM = block.match(/\|\s*\*\*RG \/ Certidão:\*\*\s*([^|\n]+)/i);
  let rg = limpa(rgM ? rgM[1] : '');

  // 6. PCD e Tipo
  let pcdM = block.match(/\|\s*\*\*PCD e qual\?:\*\*\s*([^|\n]+)/i);
  let pcdRaw = limpa(pcdM ? pcdM[1] : '');
  let pcd = 'Não';
  let tipoPcd = '—';
  if (pcdRaw !== '—' && pcdRaw !== '-' && !pcdRaw.toLowerCase().startsWith('não')) {
    pcd = 'Sim';
    tipoPcd = pcdRaw.replace(/^sim\s*[-:]?\s*/i, '').trim() || 'Sim';
  }

  // 7. Telefones
  let telM = block.match(/\|\s*\*\*Telefones:\*\*\s*([^|\n]+)/i);
  let tel = limpa(telM ? telM[1] : '').replace(/\s*\/\s*$/, '').trim();

  // 8. E-mail
  let emailM = block.match(/\|\s*\*\*E-mail:\*\*\s*([^|\n]+)/i);
  let email = limpa(emailM ? emailM[1] : '');

  // 9. Endereço
  let endM = block.match(/\|\s*\*\*Endereço:\*\*\s*([^|\n]+)/i);
  let end = limpa(endM ? endM[1] : '');

  // 10. Bairro
  let bairroM = block.match(/\|\s*\*\*Bairro:\*\*\s*([^|\n]+)/i);
  let bairro = limpa(bairroM ? bairroM[1] : '');

  // 11. Cidade e Estado
  let cidEstM = block.match(/\|\s*\*\*Cidade\/Estado:\*\*\s*([^|\n]+)/i);
  let cidEstRaw = limpa(cidEstM ? cidEstM[1] : '');
  let cidade = 'Palmas';
  let estado = 'TO';
  if (cidEstRaw !== '—') {
    const parts = cidEstRaw.split('/');
    if (parts[0] && parts[0].trim()) cidade = parts[0].trim();
    if (parts[1] && parts[1].trim()) estado = parts[1].trim().toUpperCase();
  }

  // 12. CEP
  let cepM = block.match(/\|\s*\*\*CEP:\*\*\s*([^|\n]+)/i);
  let cep = limpa(cepM ? cepM[1] : '');

  // 13. Responsável
  let respM = block.match(/\|\s*\*\*Nome do Resp\.:\*\*\s*([^|\n]+)/i);
  let resp = limpa(respM ? respM[1] : '');

  // 14. CPF Responsável
  let cpfRespM = block.match(/\|\s*\*\*CPF \/ RG do Resp\.:\*\*\s*([^|\n]+)/i);
  let cpfResp = limpa(cpfRespM ? cpfRespM[1] : '');
  if (cpfResp !== '—') {
    cpfResp = cpfResp.split('/')[0].trim();
    if (cpfResp === '-') cpfResp = '—';
  }

  // 15. Nome da Mãe
  let maeM = block.match(/\|\s*\*\*Nome da Mãe:\*\*\s*([^|\n]+)/i);
  let mae = limpa(maeM ? maeM[1] : '');

  // 16. Nome do Pai
  let paiM = block.match(/\|\s*\*\*Nome do Pai:\*\*\s*([^|\n]+)/i);
  let pai = limpa(paiM ? paiM[1] : '');

  // 17. Contato de Emergência
  let emergM = block.match(/CONTATO DE EMERGÊNCIA[\s\S]*?Nome:\s*([^|\n<]+)[\s\S]*?Telefone Celular:\s*([^|\n<]+)/i);
  let emerg = '—';
  if (emergM) {
    const n = limpa(emergM[1]);
    const t = limpa(emergM[2]);
    if (n !== '—' && t !== '—') emerg = `${n} — ${t}`;
    else if (n !== '—') emerg = n;
    else if (t !== '—') emerg = t;
  }

  // 18. Escolaridade
  let escM = block.match(/\|\s*\*\*Escolaridade:\*\*\s*([^|\n]+)/i);
  let escolaridade = limpa(escM ? escM[1] : '');

  // 19. Tipo de escola
  let tipoEscM = block.match(/\|\s*\*\*Tipo de Escola:\*\*\s*([^|\n]+)/i);
  let tipoEscola = limpa(tipoEscM ? tipoEscM[1] : '');

  // 20. Turno escolar
  let turnoEscM = block.match(/\|\s*\*\*Turno:\*\*\s*([^|\n]+)/i);
  let turnoEscolar = limpa(turnoEscM ? turnoEscM[1] : '');

  // 21. Série
  let serieM = block.match(/\|\s*\*\*Série:\*\*\s*([^|\n]+)/i);
  let serie = limpa(serieM ? serieM[1] : '');

  // 22. Nome da Escola
  let nomeEscM = block.match(/\|\s*\*\*Nome da Escola:\*\*\s*([^|\n]+)/i);
  let nomeEscola = limpa(nomeEscM ? nomeEscM[1] : '');

  // 23. Tamanho da camisa
  let tamM = block.match(/\|\s*\*\*Tamanho da Camisa:\*\*\s*([^|\n]+)/i);
  let tamanhoCamisa = limpa(tamM ? tamM[1] : '');

  // 24. Camisa entregue
  let camEntM = block.match(/\|\s*\*\*Camisa Entregue:\*\*\s*([^|\n]+)/i);
  let camisaEntregue = limpa(camEntM ? camEntM[1] : '');
  if (camisaEntregue.toLowerCase().includes('sim')) camisaEntregue = 'Sim';
  else if (camisaEntregue.toLowerCase().includes('não') || camisaEntregue.toLowerCase().includes('nao')) camisaEntregue = 'Não';

  // 25. Data do cadastro
  let dataCadM = block.match(/Data do Cadastro:\s*\*?([^\n|<]+)/i);
  let dataCadastro = limpa(dataCadM ? dataCadM[1].replace(/\*/g, '') : '');

  // 26. Observação
  let obsM = block.match(/\|\s*\*\*Observação:\*\*\s*([^|\n]+)/i);
  let obs = limpa(obsM ? obsM[1] : '');

  return {
    professor: config.professor,
    nome,
    nasc,
    sexo,
    cpf,
    rg,
    pcd,
    tipoPcd,
    tel,
    email,
    end,
    bairro,
    cidade,
    estado,
    cep,
    resp,
    cpfResp,
    mae,
    pai,
    emerg,
    escolaridade,
    tipoEscola,
    turnoEscolar,
    serie,
    nomeEscola,
    tamanhoCamisa,
    camisaEntregue,
    dataCadastro,
    nucleo: config.nucleo,
    obs
  };
}

console.log('Iniciando processamento dos 7 núcleos...');

const listaConsolidadaPorNucleo = {};
const vistos = new Set();
let totalBruto = 0;
let totalDeduplicado = 0;

for (const cfg of nucleosConfig) {
  const filePath = path.join(inputDir, cfg.file);
  const content = fs.readFileSync(filePath, 'utf8');
  const blocks = content.split(/FICHA CADASTRAL/i).slice(1);
  listaConsolidadaPorNucleo[cfg.nucleo] = [];

  for (const b of blocks) {
    totalBruto++;
    const aluno = parseFicha(b, cfg);
    if (!aluno.nome || aluno.nome === '—') continue;

    // Deduplicação intra-núcleo por Nome + Data de Nascimento
    const chave = aluno.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() + '|' + aluno.nasc + '|' + cfg.nucleo;
    if (vistos.has(chave)) {
      console.log(`[Deduplicado] Aluno repetido no mesmo núcleo: ${aluno.nome} (${aluno.nasc}) - ${cfg.nucleo}`);
      continue;
    }
    vistos.add(chave);
    totalDeduplicado++;
    listaConsolidadaPorNucleo[cfg.nucleo].push(aluno);
  }
}

console.log(`\nTotal de fichas analisadas: ${totalBruto}`);
console.log(`Total de alunos consolidados únicos: ${totalDeduplicado}`);

// Gerar o documento Markdown consolidado
let md = `# Listagem Consolidada de Beneficiários — Atletas para Sempre\n\n`;
md += `Documento consolidado a partir das fichas cadastrais completas dos 7 núcleos de atendimento.\n\n`;
md += `**Total de Fichas Analisadas:** ${totalBruto}\n`;
md += `**Total de Beneficiários Únicos:** ${totalDeduplicado}\n\n`;

md += `## Resumo por Núcleo\n\n`;
md += `| Núcleo | Professor Responsável | Total de Alunos |\n`;
md += `|---|---|---|\n`;

for (const cfg of nucleosConfig) {
  const qtd = listaConsolidadaPorNucleo[cfg.nucleo].length;
  md += `| ${cfg.nucleo} | ${cfg.professor} | ${qtd} |\n`;
}
md += `| **Total Geral** | | **${totalDeduplicado}** |\n\n`;
md += `---\n\n`;

for (const cfg of nucleosConfig) {
  const alunos = listaConsolidadaPorNucleo[cfg.nucleo];
  md += `# ${cfg.nucleo} — Professor ${cfg.professor}\n\n`;
  md += `Total de alunos: **${alunos.length}**\n\n`;

  alunos.forEach((a, idx) => {
    md += `### ${idx + 1}. ${a.nome}\n\n`;
    md += `- **Professor:** ${a.professor}\n`;
    md += `- **Nome do aluno:** ${a.nome}\n`;
    md += `- **Data de nascimento:** ${a.nasc}\n`;
    md += `- **Sexo:** ${a.sexo}\n`;
    md += `- **CPF do aluno:** ${a.cpf}\n`;
    md += `- **RG / Certidão:** ${a.rg}\n`;
    md += `- **PCD (Sim/Não):** ${a.pcd}\n`;
    md += `- **Tipo de PCD:** ${a.tipoPcd}\n`;
    md += `- **Telefones:** ${a.tel}\n`;
    md += `- **E-mail:** ${a.email}\n`;
    md += `- **Endereço:** ${a.end}\n`;
    md += `- **Bairro:** ${a.bairro}\n`;
    md += `- **Cidade:** ${a.cidade}\n`;
    md += `- **Estado (UF):** ${a.estado}\n`;
    md += `- **CEP:** ${a.cep}\n`;
    md += `- **Nome do responsável:** ${a.resp}\n`;
    md += `- **CPF do responsável:** ${a.cpfResp}\n`;
    md += `- **Nome da mãe:** ${a.mae}\n`;
    md += `- **Nome do pai:** ${a.pai}\n`;
    md += `- **Contato de emergência:** ${a.emerg}\n`;
    md += `- **Escolaridade:** ${a.escolaridade}\n`;
    md += `- **Tipo de escola (Municipal/Estadual/Particular):** ${a.tipoEscola}\n`;
    md += `- **Turno escolar:** ${a.turnoEscolar}\n`;
    md += `- **Série:** ${a.serie}\n`;
    md += `- **Nome da escola:** ${a.nomeEscola}\n`;
    md += `- **Tamanho da camisa:** ${a.tamanhoCamisa}\n`;
    md += `- **Camisa entregue (Sim/Não):** ${a.camisaEntregue}\n`;
    md += `- **Data do cadastro:** ${a.dataCadastro}\n`;
    md += `- **Núcleo:** ${a.nucleo}\n`;
    md += `- **Observação:** ${a.obs}\n\n`;
  });

  md += `---\n\n`;
}

fs.writeFileSync(outputFile, md, 'utf8');
console.log(`Arquivo consolidado gerado com sucesso em:\n${outputFile}`);
