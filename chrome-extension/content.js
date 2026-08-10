(function () {
  function gerarCPF() {
    const num = () => Math.floor(Math.random() * 9);
    const n = Array.from({ length: 9 }, num);
    
    let d1 = n.reduce((acc, v, i) => acc + v * (10 - i), 0) % 11;
    d1 = d1 < 2 ? 0 : 11 - d1;
    
    let d2 = [...n, d1].reduce((acc, v, i) => acc + v * (11 - i), 0) % 11;
    d2 = d2 < 2 ? 0 : 11 - d2;
    
    const digits = [...n, d1, d2].join('');
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  function gerarDados(modo) {
    const nomesF = ["Lucas", "Gabriel", "Matheus", "Pedro", "Enzo", "Felipe", "Guilherme", "Gustavo", "Arthur", "Rafael"];
    const nomesM = ["Beatriz", "Sophia", "Mariana", "Laura", "Julia", "Giovanna", "Isabella", "Manuela", "Alice", "Carolina"];
    const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes"];

    const isFeminino = Math.random() > 0.5;
    const primeiroNome = isFeminino ? nomesM[Math.floor(Math.random() * nomesM.length)] : nomesF[Math.floor(Math.random() * nomesF.length)];
    const sobrenome1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    const sobrenome2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];

    const anoNasc = 2011 + Math.floor(Math.random() * 6); // 2011 a 2016 (10 a 15 anos)
    const mesNasc = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const diaNasc = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

    if (modo === "padrao") {
      return {
        nomeCompleto: "Gabriel Santos Silva",
        cpf: gerarCPF(),
        rg: "12.345.678-9 SSP/TO",
        dataNascimento: "2013-06-15",
        sexo: "M",
        racaCor: "Parda",
        nomeMae: "Maria das Graças Santos Silva",
        cpfMae: gerarCPF(),
        telefone: "(63) 99234-5678",
        email: "gabriel.santos.teste@gmail.com",
        cep: "77001-000",
        logradouro: "Quadra 104 Sul, Alameda 02",
        numero: "15",
        bairro: "Plano Diretor Sul",
        cidade: "Palmas",
        estado: "TO",
        tamanhoUniforme: "14",
        nomeEscola: "Escola Municipal Maria Julia",
        serieEscolar: "7º Ano E.F.",
        turnoEscolar: "Manhã",
      };
    }

    return {
      nomeCompleto: `${primeiroNome} ${sobrenome1} ${sobrenome2}`,
      cpf: gerarCPF(),
      rg: `${Math.floor(10000000 + Math.random() * 90000000)} SSP/TO`,
      dataNascimento: `${anoNasc}-${mesNasc}-${diaNasc}`,
      sexo: isFeminino ? "F" : "M",
      racaCor: ["Parda", "Branca", "Preta"][Math.floor(Math.random() * 3)],
      nomeMae: `Maria ${sobrenome1} ${sobrenome2}`,
      cpfMae: gerarCPF(),
      telefone: `(63) 99${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      email: `${primeiroNome.toLowerCase()}.${sobrenome1.toLowerCase()}@gmail.com`,
      cep: "77001-000",
      logradouro: "Quadra 104 Sul",
      numero: String(Math.floor(1 + Math.random() * 100)),
      bairro: "Plano Diretor Sul",
      cidade: "Palmas",
      estado: "TO",
      tamanhoUniforme: ["12", "14", "16", "P", "M"][Math.floor(Math.random() * 5)],
      nomeEscola: "Escola Municipal de Palmas",
      serieEscolar: "7º Ano E.F.",
      turnoEscolar: Math.random() > 0.5 ? "Manhã" : "Tarde",
    };
  }

  function preencherCampo(seletor, valor) {
    if (!valor) return;
    const elemento = typeof seletor === 'string' ? document.querySelector(seletor) : seletor;
    if (!elemento) return;

    elemento.focus();
    if (elemento.tagName === 'SELECT') {
      // Procura option que contenha o valor
      let op = Array.from(elemento.options).find(o => o.value === valor || o.text.toLowerCase().includes(String(valor).toLowerCase()));
      if (op) elemento.value = op.value;
      else elemento.value = valor;
    } else {
      elemento.value = valor;
    }

    // Dispara eventos do React
    elemento.dispatchEvent(new Event('input', { bubbles: true }));
    elemento.dispatchEvent(new Event('change', { bubbles: true }));
    elemento.blur();
  }

  function preencherFormulario(modo) {
    const d = gerarDados(modo);

    // Mapeamento por name, id ou placeholder
    const campos = [
      { sel: 'input[name="nomeCompleto"], input[name="nome_completo"], input[name="nome"]', val: d.nomeCompleto },
      { sel: 'input[name="cpf"], input[name="cpfBeneficiario"]', val: d.cpf },
      { sel: 'input[name="rg"]', val: d.rg },
      { sel: 'input[name="dataNascimento"], input[name="data_nascimento"], input[type="date"]', val: d.dataNascimento },
      { sel: 'select[name="sexo"], select[name="genero"]', val: d.sexo },
      { sel: 'select[name="racaCor"], select[name="raca_cor"], select[name="raca"]', val: d.racaCor },
      { sel: 'input[name="nomeMae"], input[name="nome_mae"]', val: d.nomeMae },
      { sel: 'input[name="cpfMae"], input[name="cpf_mae"]', val: d.cpfMae },
      { sel: 'input[name="telefone"], input[name="celular"], input[name="whatsapp"]', val: d.telefone },
      { sel: 'input[name="email"]', val: d.email },
      { sel: 'input[name="cep"]', val: d.cep },
      { sel: 'input[name="logradouro"], input[name="endereco"], input[name="rua"]', val: d.logradouro },
      { sel: 'input[name="numero"]', val: d.numero },
      { sel: 'input[name="bairro"]', val: d.bairro },
      { sel: 'input[name="cidade"]', val: d.cidade },
      { sel: 'input[name="estado"], input[name="uf"]', val: d.estado },
      { sel: 'select[name="tamanhoUniforme"], select[name="tamanho_uniforme"], input[name="tamanhoUniforme"]', val: d.tamanhoUniforme },
      { sel: 'input[name="nomeEscola"], input[name="escola"]', val: d.nomeEscola },
      { sel: 'input[name="serieEscolar"], input[name="serie"]', val: d.serieEscolar },
      { sel: 'select[name="turnoEscolar"], select[name="turno"]', val: d.turnoEscolar },
    ];

    // Busca Genérica por Labels/Placeholders caso name não bata exatamente
    campos.forEach(({ sel, val }) => {
      const el = document.querySelector(sel);
      if (el) {
        preencherCampo(el, val);
      }
    });

    // Fallback: Busca por inputs genéricos na página
    const todosInputs = Array.from(document.querySelectorAll('input, select'));
    todosInputs.forEach(input => {
      const ph = (input.getAttribute('placeholder') || '').toLowerCase();
      const labelText = input.labels && input.labels[0] ? input.labels[0].innerText.toLowerCase() : '';
      const name = (input.getAttribute('name') || '').toLowerCase();
      const combined = `${ph} ${labelText} ${name}`;

      if (combined.includes('nome') && !combined.includes('mãe') && !combined.includes('mae') && !combined.includes('escola')) {
        preencherCampo(input, d.nomeCompleto);
      } else if (combined.includes('cpf') && !combined.includes('mãe') && !combined.includes('mae')) {
        preencherCampo(input, d.cpf);
      } else if (combined.includes('rg')) {
        preencherCampo(input, d.rg);
      } else if (combined.includes('nascimento') || combined.includes('data')) {
        preencherCampo(input, d.dataNascimento);
      } else if (combined.includes('mãe') || combined.includes('mae')) {
        if (combined.includes('cpf')) preencherCampo(input, d.cpfMae);
        else preencherCampo(input, d.nomeMae);
      } else if (combined.includes('tel') || combined.includes('cel') || combined.includes('whats')) {
        preencherCampo(input, d.telefone);
      } else if (combined.includes('email') || combined.includes('e-mail')) {
        preencherCampo(input, d.email);
      } else if (combined.includes('cep')) {
        preencherCampo(input, d.cep);
      } else if (combined.includes('rua') || combined.includes('logradouro') || combined.includes('endereço')) {
        preencherCampo(input, d.logradouro);
      } else if (combined.includes('número') || combined.includes('numero')) {
        preencherCampo(input, d.numero);
      } else if (combined.includes('bairro')) {
        preencherCampo(input, d.bairro);
      } else if (combined.includes('cidade')) {
        preencherCampo(input, d.cidade);
      } else if (combined.includes('escola')) {
        preencherCampo(input, d.nomeEscola);
      }
    });

    // Marca automaticamente as perguntas do PAR-Q (Respostas "Não")
    const radiosNao = document.querySelectorAll('input[type="radio"][value="nao"], input[type="radio"][value="não"], input[type="radio"][value="false"]');
    radiosNao.forEach(radio => {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Marca checkbox de termos e autorizações se existirem
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  // Ouve mensagem disparada pelo popup da extensão
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "preencher_formulario") {
      preencherFormulario(request.modo || "padrao");
      sendResponse({ status: "sucesso" });
    }
  });
})();
