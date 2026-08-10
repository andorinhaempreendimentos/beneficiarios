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
        nomeSocial: "",
        cpf: gerarCPF(),
        rg: "12.345.678-9 SSP/TO",
        dataNascimento: "2013-06-15",
        sexo: "Masculino",
        raca: "Parda",
        pcd: "Não",
        celular: "(63) 99234-5678",
        telefoneResidencial: "(63) 3215-1234",
        email: "gabriel.santos.teste@gmail.com",
        celularWhatsapp: "Sim",
        cep: "77001-000",
        logradouro: "Quadra 104 Sul, Alameda 02",
        numero: "15",
        complemento: "Lote 08",
        bairro: "Plano Diretor Sul",
        cidade: "Palmas",
        estado: "TO",
        numeroNis: "12345678901",
        nomePai: "Carlos Eduardo Silva",
        nomeMae: "Maria das Graças Santos Silva",
        moraCom: "Pais",
        tamanhoUniforme: "14",
        nomeResponsavel: "Maria das Graças Santos Silva",
        emailResponsavel: "maria.graca.teste@gmail.com",
        rgResponsavel: "98.765.432-1 SSP/TO",
        cpfResponsavel: gerarCPF(),
        nivelEscolaridade: "Ensino Fundamental",
        ocupacaoAtual: "Estudante",
        situacaoMoradia: "Própria quitada",
        beneficioSocioassistencial: "Não",
        comorbidades: "Nenhuma das anteriores",
        razoesInscricao: "Prática de esporte, saúde e integração social no projeto.",
        redeEnsino: "Municipal",
        nomeEscola: "Escola Municipal Maria Julia",
        turno: "Manhã",
        serie: "7º Ano E.F.",
        turmaEscolar: "Turma 702",
      };
    }

    return {
      nomeCompleto: `${primeiroNome} ${sobrenome1} ${sobrenome2}`,
      nomeSocial: "",
      cpf: gerarCPF(),
      rg: `${Math.floor(10000000 + Math.random() * 90000000)} SSP/TO`,
      dataNascimento: `${anoNasc}-${mesNasc}-${diaNasc}`,
      sexo: isFeminino ? "Feminino" : "Masculino",
      raca: ["Preta", "Parda", "Branca"][Math.floor(Math.random() * 3)],
      pcd: "Não",
      celular: `(63) 99${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      telefoneResidencial: "(63) 3215-0000",
      email: `${primeiroNome.toLowerCase()}.${sobrenome1.toLowerCase()}@gmail.com`,
      celularWhatsapp: "Sim",
      cep: "77001-000",
      logradouro: "Quadra 104 Sul",
      numero: String(Math.floor(1 + Math.random() * 100)),
      complemento: "",
      bairro: "Plano Diretor Sul",
      cidade: "Palmas",
      estado: "TO",
      numeroNis: String(Math.floor(10000000000 + Math.random() * 90000000000)),
      nomePai: `Carlos ${sobrenome1}`,
      nomeMae: `Maria ${sobrenome2}`,
      moraCom: "Pais",
      tamanhoUniforme: ["P", "M", "12", "14", "16"][Math.floor(Math.random() * 5)],
      nomeResponsavel: `Maria ${sobrenome2}`,
      emailResponsavel: `maria.${sobrenome2.toLowerCase()}@gmail.com`,
      rgResponsavel: `${Math.floor(10000000 + Math.random() * 90000000)} SSP/TO`,
      cpfResponsavel: gerarCPF(),
      nivelEscolaridade: "Ensino Fundamental",
      ocupacaoAtual: "Estudante",
      situacaoMoradia: "Própria quitada",
      beneficioSocioassistencial: "Não",
      comorbidades: "Nenhuma das anteriores",
      razoesInscricao: "Desenvolvimento esportivo e lazer.",
      redeEnsino: "Municipal",
      nomeEscola: "Escola Municipal de Palmas",
      turno: Math.random() > 0.5 ? "Manhã" : "Tarde",
      serie: "7º Ano E.F.",
      turmaEscolar: "Turma A",
    };
  }

  function descolapsarSecoes() {
    // 1. Abre todas as secoes sanfona (FormSection) que estiverem fechadas
    const botoes = Array.from(document.querySelectorAll('button[type="button"]'));
    botoes.forEach(btn => {
      const h3 = btn.querySelector('h3');
      const svg = btn.querySelector('svg');
      // Se tiver h3 (titulo de secao) e chevron nao rotacionado (fechado)
      if (h3 && svg && !svg.classList.contains('rotate-180')) {
        btn.click();
      }
    });

    // 2. Abre tags <details> fechadas se existirem
    document.querySelectorAll('details').forEach(d => {
      d.open = true;
    });

    // 3. Remove display: none de secoes sanfona ocultas
    document.querySelectorAll('.hidden, [style*="display: none"]').forEach(el => {
      if (el.tagName !== 'INPUT' && el.tagName !== 'SCRIPT') {
        el.classList.remove('hidden');
        if (el.style.display === 'none') el.style.display = 'block';
      }
    });
  }

  function preencherCampo(elemento, valor) {
    if (!elemento || valor === undefined || valor === null) return;

    elemento.focus();
    if (elemento.tagName === 'SELECT') {
      let op = Array.from(elemento.options).find(o => 
        o.value === valor || o.text.trim().toLowerCase() === String(valor).trim().toLowerCase() || o.text.toLowerCase().includes(String(valor).toLowerCase())
      );
      if (op) elemento.value = op.value;
      else elemento.value = valor;
    } else if (elemento.tagName === 'TEXTAREA' || elemento.tagName === 'INPUT') {
      elemento.value = valor;
    }

    // Dispara eventos para atualizar o estado do React
    elemento.dispatchEvent(new Event('input', { bubbles: true }));
    elemento.dispatchEvent(new Event('change', { bubbles: true }));
    elemento.blur();
  }

  function clicarOpcaoRadioGroup(nomeHiddenInput, valorDesejado) {
    // 1. Procura o campo hidden gerado pelo RadioGroup
    const inputHidden = document.querySelector(`input[type="hidden"][name="${nomeHiddenInput}"]`);
    if (inputHidden && inputHidden.parentElement) {
      // Procura o botao filho que contenha a opcao desejada
      const botoes = Array.from(inputHidden.parentElement.querySelectorAll('button[type="button"]'));
      const btnOpcao = botoes.find(b => b.innerText.trim().toLowerCase() === String(valorDesejado).trim().toLowerCase());
      if (btnOpcao) {
        btnOpcao.click();
        return;
      }
    }

    // 2. Fallback para radio tradicional <input type="radio">
    const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${nomeHiddenInput}"], input[type="radio"]`));
    const radioMatch = radios.find(r => r.value === valorDesejado || (r.labels && r.labels[0] && r.labels[0].innerText.includes(valorDesejado)));
    if (radioMatch) {
      radioMatch.checked = true;
      radioMatch.dispatchEvent(new Event('change', { bubbles: true }));
      radioMatch.click();
    }
  }

  function preencherFormulario(modo) {
    // Passo 1: Descolapsa todas as secoes fechadas do formulario
    descolapsarSecoes();

    // Pequeno intervalo para permitir montagem dos elementos no DOM caso React precise re-renderizar
    setTimeout(() => {
      const d = gerarDados(modo);

      // Preenchimento de inputs e selects diretos por atributo 'name'
      Object.entries(d).forEach(([chave, valor]) => {
        const el = document.querySelector(`input[name="${chave}"], select[name="${chave}"], textarea[name="${chave}"]`);
        if (el && el.type !== 'hidden' && el.type !== 'radio' && el.type !== 'checkbox') {
          preencherCampo(el, valor);
        }
      });

      // Preenchimento dos componentes RadioGroup (Botoes de selecao customizados do React)
      clicarOpcaoRadioGroup("sexo", d.sexo);
      clicarOpcaoRadioGroup("pcd", d.pcd);
      clicarOpcaoRadioGroup("celularWhatsapp", d.celularWhatsapp);
      clicarOpcaoRadioGroup("moraCom", d.moraCom);
      clicarOpcaoRadioGroup("tamanhoUniforme", d.tamanhoUniforme);

      // Responde "Não" para todas as 10 perguntas do PAR-Q (Questionario de saude)
      for (let i = 0; i < 10; i++) {
        clicarOpcaoRadioGroup(`parq-${i}`, "Não");
      }

      // Marcar Checkbox de Termo de Aceite ("Li e concordo...")
      const termoCheckbox = document.querySelector('input[name="termoAceito"], input[type="checkbox"]');
      if (termoCheckbox && !termoCheckbox.checked) {
        termoCheckbox.checked = true;
        termoCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        termoCheckbox.click();
      }

      // Preenche os dados de endereco caso haja estado/cidade customizado
      const elLogradouro = document.querySelector('input[name="logradouro"]');
      if (elLogradouro) preencherCampo(elLogradouro, d.logradouro);

      const elBairro = document.querySelector('input[name="bairro"]');
      if (elBairro) preencherCampo(elBairro, d.bairro);

      const elCidade = document.querySelector('input[name="cidade"]');
      if (elCidade) preencherCampo(elCidade, d.cidade);

      const elEstado = document.querySelector('input[name="estado"]');
      if (elEstado) preencherCampo(elEstado, d.estado);

    }, 150);
  }

  // Ouve mensagens da extensao do Chrome
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "preencher_formulario") {
      preencherFormulario(request.modo || "padrao");
      sendResponse({ status: "sucesso" });
    }
  });
})();
