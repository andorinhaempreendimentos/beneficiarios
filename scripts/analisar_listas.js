const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../informacoes/listagem_de_beneficiarios/listas de beneficiarios/listas_completas');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

console.log('Arquivos encontrados:', files.length);

const relatorio = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Dividir por fichas cadastrais
  // Pode ser '## **FICHA CADASTRAL**' ou '**FICHA CADASTRAL**' ou 'FICHA CADASTRAL'
  const rawBlocks = content.split(/FICHA CADASTRAL/i).slice(1);
  
  let countFichas = 0;
  let countComNome = 0;
  let countComCpf = 0;
  let countSemCpf = 0;
  let countComNascimento = 0;
  let countCamisa = 0;
  let countComTelefone = 0;
  let countComResponsavel = 0;
  let countComEndereco = 0;
  let nucleosDetectados = new Set();
  let modalidadesDetectadas = new Set();
  let errosFormato = [];

  rawBlocks.forEach((block, idx) => {
    countFichas++;

    // Nome
    const nomeM = block.match(/\|\s*\*\*Nome:\*\*\s*([^|\n]+)/i);
    let nome = '';
    if (nomeM) {
      nome = nomeM[1].replace(/<br[^>]*>/gi, ' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
      nome = nome.replace(/\s+(sim|não|nao)$/i, '').trim();
      countComNome++;
      if (nome.length < 3) {
        errosFormato.push(`Ficha #${idx+1}: Nome muito curto ou vazio (${nome})`);
      }
    } else {
      errosFormato.push(`Ficha #${idx+1}: Campo Nome não localizado`);
    }

    // CPF
    const cpfM = block.match(/\|\s*\*\*CPF:\*\*\s*([^|\n]+)/i);
    const cpfDigits = cpfM ? cpfM[1].replace(/\D/g, '') : '';
    if (cpfDigits.length === 11) {
      countComCpf++;
    } else {
      countSemCpf++;
    }

    // Data de Nascimento
    const nascM = block.match(/\|\s*\*\*Data de Nascimento:\*\*\s*([^|\n]+)/i);
    if (nascM && nascM[1].trim()) {
      countComNascimento++;
    }

    // Camisa
    const camisaM = block.match(/\|\s*\*\*Tamanho da Camisa:\*\*\s*([^|\n]+)/i);
    if (camisaM && camisaM[1].trim()) {
      countCamisa++;
    }

    // Telefones
    const telM = block.match(/\|\s*\*\*Telefones:\*\*\s*([^|\n]+)/i);
    if (telM && telM[1].replace(/\D/g, '').length >= 8) {
      countComTelefone++;
    }

    // Responsavel
    const respM = block.match(/\|\s*\*\*Nome do Resp\.:\*\*\s*([^|\n]+)/i);
    if (respM && respM[1].replace(/<br[^>]*>/gi, '').trim().length > 2) {
      countComResponsavel++;
    }

    // Endereco
    const endM = block.match(/\|\s*\*\*Endereço:\*\*\s*([^|\n]+)/i);
    if (endM && endM[1].trim()) {
      countComEndereco++;
    }

    // Núcleo
    const nucM = block.match(/Núcleo:\s*([^\n|]+)/i);
    if (nucM) {
      nucleosDetectados.add(nucM[1].trim().replace(/<[^>]+>/g, ''));
    }

    // Modalidade
    const modM = block.match(/Modalidade:\s*([^\n|]+)/i);
    if (modM) {
      modalidadesDetectadas.add(modM[1].trim().replace(/<[^>]+>/g, ''));
    }
  });

  relatorio.push({
    arquivo: file,
    tamanhoBytes: fs.statSync(filePath).size,
    totalFichas: countFichas,
    comNome: countComNome,
    comCpfValido: countComCpf,
    semCpf: countSemCpf,
    comNascimento: countComNascimento,
    comCamisa: countCamisa,
    comTelefone: countComTelefone,
    comResponsavel: countComResponsavel,
    comEndereco: countComEndereco,
    nucleos: Array.from(nucleosDetectados),
    modalidades: Array.from(modalidadesDetectadas),
    amostraErros: errosFormato.slice(0, 3)
  });
}

console.log(JSON.stringify(relatorio, null, 2));
