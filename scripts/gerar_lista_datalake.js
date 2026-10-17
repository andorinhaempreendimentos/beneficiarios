const fs = require('fs');

async function main() {
  console.log('Buscando dados diretamente da API do Datalake...');
  const res = await fetch('https://beneficiarios-andorinha.vercel.app/api/datalake', {
    headers: {
      'x-datalake-senha': 'Datalake123#',
    },
  });

  if (!res.ok) {
    throw new Error(`Erro na API: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const list = json.alunos || [];

  console.log(`Sucesso! Total de alunos recebidos: ${list.length}`);

  // Formato: Nome - Núcleo - Nascimento
  const formatarData = (d) => {
    if (!d) return 'Não informada';
    if (d.includes('-')) {
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return d;
  };

  const linhasTexto = list.map((a, i) => {
    const nasc = formatarData(a.data_nascimento);
    return `${i + 1}. ${a.nome_completo} - ${a.nucleo_nome} - ${nasc}`;
  });

  // Salvar no arquivo txt
  const txtPath = 'C:/Users/livia/.gemini/antigravity/brain/dcaced52-a9f2-4a19-bcc0-9a36014c9760/beneficiarios_datalake_lista_completa.txt';
  fs.writeFileSync(txtPath, linhasTexto.join('\n'), 'utf8');

  // Organizar e agrupar por Núcleo para o Markdown
  const porNucleo = {};
  for (const a of list) {
    const n = a.nucleo_nome || 'Sem Núcleo';
    if (!porNucleo[n]) porNucleo[n] = [];
    porNucleo[n].push(a);
  }

  let md = '# Listagem Completa de Beneficiários do Datalake\n\n';
  md += `> Total de registros consolidados: **${list.length} beneficiários**\n`;
  md += `> Formato: **Nome - Núcleo - Data de Nascimento**\n\n`;

  const nucleosOrdenados = Object.keys(porNucleo).sort();

  for (const n of nucleosOrdenados) {
    const alunos = porNucleo[n];
    md += `### ${n} (${alunos.length} alunos)\n\n`;
    md += '| # | Nome Completo | Data de Nascimento | Origem |\n';
    md += '|:--|:--------------|:------------------:|:------:|\n';
    alunos.forEach((aluno, idx) => {
      const nasc = formatarData(aluno.data_nascimento);
      const origemBadge = aluno.origem === 'banco_ativo' ? 'Banco Ativo' : 'Formulário Online';
      md += `| ${idx + 1} | ${aluno.nome_completo} | ${nasc} | ${origemBadge} |\n`;
    });
    md += '\n';
  }

  const mdPath = 'C:/Users/livia/.gemini/antigravity/brain/dcaced52-a9f2-4a19-bcc0-9a36014c9760/beneficiarios_datalake.md';
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log(`Arquivos gerados com sucesso:\n- ${txtPath}\n- ${mdPath}`);
}

main().catch((err) => {
  console.error('Falha:', err);
  process.exit(1);
});
