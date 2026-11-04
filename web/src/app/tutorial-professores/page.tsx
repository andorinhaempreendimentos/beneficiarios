"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Lock, ArrowRight, ChevronLeft, ChevronRight, AlertCircle, RotateCcw } from "lucide-react";

interface PoloOption {
  id: string;
  polo: string;
}

interface EtapaNome {
  etapa: number;
  rotulo: string;
  opcoes: string[];
}

interface CredenciaisResultado {
  nome: string;
  polo: string;
  email: string;
  senha: string;
}

export default function TutorialProfessoresPage() {
  // Carrossel de Vídeos
  const [slideAtual, setSlideAtual] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [video1Visto, setVideo1Visto] = useState(false);
  const [video2Visto, setVideo2Visto] = useState(false);

  // Formulário de Acesso
  const [polos, setPolos] = useState<PoloOption[]>([]);
  const [poloSelecionado, setPoloSelecionado] = useState("");
  const [telefone, setTelefone] = useState("");

  // Desafio do Nome
  const [carregandoEtapas, setCarregandoEtapas] = useState(false);
  const [etapas, setEtapas] = useState<EtapaNome[]>([]);
  const [etapaAtualIndex, setEtapaAtualIndex] = useState(0);
  const [partesEscolhidas, setPartesEscolhidas] = useState<string[]>([]);

  // Submissão e Resultado
  const [validando, setValidando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<CredenciaisResultado | null>(null);
  const [senhaCopiada, setSenhaCopiada] = useState(false);
  const [textoBtnCopiar, setTextoBtnCopiar] = useState("Copiar Senha");

  const secaoLiberacaoRef = useRef<HTMLElement>(null);
  const cardResultadoRef = useRef<HTMLDivElement>(null);

  // Carregar lista pública de polos ao montar
  useEffect(() => {
    async function carregarPolos() {
      try {
        const res = await fetch("/api/tutorial-professores");
        const data = await res.json();
        if (data.polos) setPolos(data.polos);
      } catch (e) {
        console.error("Erro ao carregar polos:", e);
      }
    }
    carregarPolos();
  }, []);

  // Navegar entre slides
  function irParaSlide(index: number) {
    if (index < 0 || index > 1) return;
    setSlideAtual(index);
    if (trackRef.current) {
      const width = trackRef.current.clientWidth;
      trackRef.current.scrollTo({ left: width * index, behavior: "smooth" });
    }
  }

  // Auto-avanço de vídeo ao marcar o checkbox
  function handleCheckVideo1(checked: boolean) {
    setVideo1Visto(checked);
    if (checked) {
      setTimeout(() => irParaSlide(1), 350);
    }
  }

  function handleCheckVideo2(checked: boolean) {
    setVideo2Visto(checked);
    if (checked) {
      if (!video1Visto) {
        setTimeout(() => irParaSlide(0), 350);
      } else {
        setTimeout(() => {
          secaoLiberacaoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 450);
      }
    }
  }

  // Máscara de telefone
  function handleTelefoneChange(valor: string) {
    let v = valor.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    }
    setTelefone(v);
  }

  // Ao mudar de Polo
  async function handlePoloChange(id: string) {
    setPoloSelecionado(id);
    setPartesEscolhidas([]);
    setEtapaAtualIndex(0);
    setErro("");
    setResultado(null);
    setSenhaCopiada(false);

    if (!id) {
      setEtapas([]);
      return;
    }

    setCarregandoEtapas(true);
    try {
      const res = await fetch(`/api/tutorial-professores?poloId=${id}`);
      const data = await res.json();
      if (data.etapas) {
        setEtapas(data.etapas);
      }
    } catch (e) {
      console.error("Erro ao carregar etapas do nome:", e);
    } finally {
      setCarregandoEtapas(false);
    }
  }

  // Clique em uma opção de nome
  function handleEscolherParte(opcao: string) {
    const novasPartes = [...partesEscolhidas, opcao];
    setPartesEscolhidas(novasPartes);
    setEtapaAtualIndex(prev => prev + 1);
  }

  // Reiniciar escolha do nome
  function reiniciarNome() {
    setPartesEscolhidas([]);
    setEtapaAtualIndex(0);
    setErro("");
  }

  // Validação e Envio
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    // 1. Validar vídeos
    if (!video1Visto || !video2Visto) {
      setErro("Você precisa marcar que assistiu aos dois vídeos tutoriais antes de liberar sua senha.");
      if (!video1Visto) irParaSlide(0);
      else irParaSlide(1);
      return;
    }

    // 2. Validar polo
    if (!poloSelecionado) {
      setErro("Por favor, selecione o seu Núcleo / Polo no Passo 1.");
      return;
    }

    // 3. Validar telefone
    const telClean = telefone.replace(/\D/g, "");
    if (!telClean || telClean.length < 8) {
      setErro("Digite o seu número de WhatsApp / celular no Passo 2.");
      return;
    }

    // 4. Validar se montou todo o nome
    if (partesEscolhidas.length < etapas.length) {
      setErro("Você precisa selecionar todas as partes do seu nome no Passo 3.");
      return;
    }

    setValidando(true);
    try {
      const res = await fetch("/api/tutorial-professores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poloId: poloSelecionado,
          telefone: telClean,
          partesEscolhidas
        })
      });

      const data = await res.json();
      if (!data.success) {
        setErro(data.erro || "Dados não conferem.");
        return;
      }

      setResultado(data.professor);
      setSenhaCopiada(false);
      setTimeout(() => {
        cardResultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);

    } catch {
      setErro("Falha de conexão com o servidor. Tente novamente.");
    } finally {
      setValidando(false);
    }
  }

  // Copiar Senha
  function handleCopiarSenha() {
    if (!resultado) return;
    navigator.clipboard.writeText(resultado.senha).then(() => {
      setSenhaCopiada(true);
      setTextoBtnCopiar("Copiado!");
      setTimeout(() => setTextoBtnCopiar("Copiar Novamente"), 2500);
    });
  }

  const totalConfirmados = (video1Visto ? 1 : 0) + (video2Visto ? 1 : 0);
  const etapaAtual = etapas[etapaAtualIndex];
  const nomeCompletoMontado = etapas.length > 0 && etapaAtualIndex >= etapas.length;

  return (
    <div className="bg-slate-100 text-slate-800 antialiased min-h-screen py-3 px-3 sm:py-6 sm:px-6">
      <main className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto space-y-4 pb-12">

        {/* CABEÇALHO */}
        <header className="bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-400/20 text-sky-200 border border-sky-400/30">
                Painel do Professor
              </span>
              <span className="text-[10px] font-bold text-sky-300/80">
                Passo Obrigatório
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              Tutorial das Turmas & Liberação de Senha
            </h1>
            <p className="text-xs text-sky-100/90 leading-relaxed font-medium">
              Assista aos 2 tutoriais nos slides abaixo, confirme cada visualização e em seguida libere sua senha de acesso.
            </p>
          </div>
        </header>

        {/* SEÇÃO 1: VÍDEOS EM CARROSSEL LATERAL */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-600">
                1. Vídeos Tutoriais
              </h2>
              <span className="text-[10px] text-slate-400 font-bold ml-1">
                (Deslize ↔)
              </span>
            </div>
            <span
              className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border transition-colors ${
                totalConfirmados === 2
                  ? "text-emerald-800 bg-emerald-100 border-emerald-300"
                  : totalConfirmados === 1
                  ? "text-amber-800 bg-amber-100 border-amber-300"
                  : "text-rose-800 bg-rose-100 border-rose-300"
              }`}
            >
              {totalConfirmados === 2 ? "✓ 2 de 2 confirmados" : `${totalConfirmados} de 2 confirmados`}
            </span>
          </div>

          <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4 space-y-3 overflow-hidden">
            {/* Controles de navegação */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => irParaSlide(slideAtual - 1)}
                  disabled={slideAtual === 0}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black text-sm flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-800">
                  Vídeo {slideAtual + 1} de 2
                </span>
                <button
                  type="button"
                  onClick={() => irParaSlide(slideAtual + 1)}
                  disabled={slideAtual === 1}
                  className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-black text-sm flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Pills para alternar direto */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => irParaSlide(0)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide transition-all ${
                    slideAtual === 0 ? "bg-sky-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  1. Grade
                </button>
                <button
                  type="button"
                  onClick={() => irParaSlide(1)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all ${
                    slideAtual === 1 ? "bg-sky-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  2. Alunos
                </button>
              </div>
            </div>

            {/* Track Horizontal */}
            <div
              ref={trackRef}
              className="flex overflow-x-auto no-scrollbar space-x-4 scroll-smooth snap-x snap-mandatory"
              style={{ scrollSnapType: "x mandatory" }}
              onScroll={() => {
                if (trackRef.current) {
                  const width = trackRef.current.clientWidth || 1;
                  const idx = Math.round(trackRef.current.scrollLeft / width);
                  if (idx !== slideAtual && (idx === 0 || idx === 1)) {
                    setSlideAtual(idx);
                  }
                }
              }}
            >
              {/* SLIDE 1 */}
              <div className="w-full shrink-0 space-y-3 snap-center">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      Grade de Horários e Faixas Etárias
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Conferência dos dias de aula e confirmação da grade do núcleo.
                    </p>
                  </div>
                </div>

                <div className="w-full ratio-16-9 bg-black rounded-xl overflow-hidden shadow-inner">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/d4JDELOl4R8"
                    title="Vídeo de confirmação das turmas e grade de horários"
                    frameBorder="0"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    video1Visto
                      ? "border-emerald-400 bg-emerald-50/80 text-emerald-950"
                      : "border-slate-200 bg-slate-50 active:bg-sky-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={video1Visto}
                    onChange={(e) => handleCheckVideo1(e.target.checked)}
                    className="w-5 h-5 rounded-md text-sky-600 border-2 border-slate-300 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-700 leading-tight block">
                      Assisti ao vídeo sobre a <strong>Grade de Horários</strong> e entendi o procedimento.
                    </span>
                    <span className="text-[10px] text-sky-600 font-semibold mt-0.5 block">
                      ↳ Ao marcar, avança automaticamente para o próximo vídeo
                    </span>
                  </div>
                </label>
              </div>

              {/* SLIDE 2 */}
              <div className="w-full shrink-0 space-y-3 snap-center">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      Enturmação e Presença dos Alunos
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Como adicionar e validar cada aluno na turma sem misturar idades.
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-[240px] sm:max-w-[270px] ratio-9-16 bg-black rounded-xl overflow-hidden shadow-inner mx-auto">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/PaTCRozZn3o"
                    title="Vídeo de explicação da enturmação dos alunos"
                    frameBorder="0"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    video2Visto
                      ? "border-emerald-400 bg-emerald-50/80 text-emerald-950"
                      : "border-slate-200 bg-slate-50 active:bg-sky-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={video2Visto}
                    onChange={(e) => handleCheckVideo2(e.target.checked)}
                    className="w-5 h-5 rounded-md text-sky-600 border-2 border-slate-300 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-700 leading-tight block">
                      Assisti ao vídeo sobre a <strong>Enturmação dos Alunos</strong> e entendi o procedimento.
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">
                      ↳ Ao marcar, avança para o formulário de liberação de senha
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              <span>👈 Deslize</span>
              <span className="font-bold text-sky-700">Mostrando Vídeo {slideAtual + 1}</span>
              <span>Deslize 👉</span>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: LIBERAÇÃO DE SENHA */}
        <section
          ref={secaoLiberacaoRef}
          id="secao-liberacao"
          className="bg-white rounded-2xl border-2 border-sky-500/40 shadow-sm p-4 sm:p-5 space-y-4"
        >
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                Validação de Identidade
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                3 Passos
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1.5">
              2. Liberar Minha Senha
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Informe seu polo, telefone e acerte seu nome completo para liberar a senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* PASSO 1: POLO */}
            <div className="space-y-1.5">
              <label htmlFor="select-polo" className="block text-xs font-black uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                <span>Qual é o seu Núcleo / Polo?</span>
              </label>
              <select
                id="select-polo"
                value={poloSelecionado}
                onChange={(e) => handlePoloChange(e.target.value)}
                className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-sky-600 focus:outline-none transition-all cursor-pointer"
              >
                <option value="">-- Toque para escolher seu polo --</option>
                {polos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.polo}
                  </option>
                ))}
              </select>
            </div>

            {/* PASSO 2: TELEFONE */}
            <div className="space-y-1.5">
              <label htmlFor="input-telefone" className="block text-xs font-black uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-black flex items-center justify-center shrink-0">2</span>
                <span>Seu WhatsApp / Celular:</span>
              </label>
              <input
                id="input-telefone"
                type="tel"
                inputMode="numeric"
                value={telefone}
                onChange={(e) => handleTelefoneChange(e.target.value)}
                placeholder="(63) 9XXXX-XXXX"
                maxLength={16}
                autoComplete="tel"
                className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200 text-sm sm:text-base font-bold text-slate-900 bg-slate-50 focus:bg-white focus:border-sky-600 focus:outline-none transition-all tracking-wide"
              />
              <p className="text-[11px] text-slate-400 leading-tight">
                Digite o número com DDD cadastrado no grupo dos professores.
              </p>
            </div>

            {/* PASSO 3: MONTE O NOME SEQUENCIALMENTE */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-black flex items-center justify-center shrink-0">3</span>
                  <span>Acerte o seu Nome Completo:</span>
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    !poloSelecionado
                      ? "text-slate-500 bg-slate-100 border-slate-200"
                      : nomeCompletoMontado
                      ? "text-emerald-800 bg-emerald-100 border-emerald-300 font-black"
                      : "text-sky-800 bg-sky-100 border-sky-300 font-black"
                  }`}
                >
                  {!poloSelecionado
                    ? "Aguardando Polo"
                    : nomeCompletoMontado
                    ? "Nome Completo Montado"
                    : `Etapa ${etapaAtualIndex + 1} de ${etapas.length}`}
                </span>
              </div>

              {/* Chips das partes montadas */}
              <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Nome montado até agora:
                  </span>
                  {partesEscolhidas.length > 0 && (
                    <button
                      type="button"
                      onClick={reiniciarNome}
                      className="text-[11px] font-black text-rose-600 hover:text-rose-700 flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reiniciar Nome</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[38px] items-center">
                  {!poloSelecionado ? (
                    <span className="text-xs text-slate-400 italic">
                      👉 Selecione seu polo no <strong>Passo 1</strong> para começar a montar seu nome.
                    </span>
                  ) : partesEscolhidas.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      Nenhuma parte selecionada ainda. Toque na primeira opção abaixo.
                    </span>
                  ) : (
                    partesEscolhidas.map((parte, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 text-white font-extrabold text-xs shadow-xs"
                      >
                        <span className="text-[10px] font-bold text-sky-200 uppercase">{idx + 1}º</span>
                        <span>{parte}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Opções da Etapa Atual */}
              {poloSelecionado && !nomeCompletoMontado && etapaAtual && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
                      <span>
                        Toque no seu <strong className="text-sky-700 underline underline-offset-2">{etapaAtual.rotulo}</strong>:
                      </span>
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {etapaAtualIndex + 1} de {etapas.length}
                    </span>
                  </div>

                  {carregandoEtapas ? (
                    <div className="p-4 text-center text-xs text-slate-400">Carregando opções...</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {etapaAtual.opcoes.map((opcao, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleEscolherParte(opcao)}
                          className="w-full min-h-[48px] px-2.5 py-2 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-sky-50 active:bg-sky-100 active:scale-[0.98] transition-all text-xs sm:text-sm font-bold text-slate-800 shadow-2xs flex items-center justify-center text-center cursor-pointer"
                        >
                          {opcao}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem quando montou tudo */}
              {nomeCompletoMontado && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>Todas as partes do nome foram selecionadas. Agora confirme abaixo!</span>
                </div>
              )}
            </div>

            {/* ALERTA DE ERRO */}
            {erro && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{erro}</span>
              </div>
            )}

            {/* BOTÃO CONFIRMAR */}
            <button
              type="submit"
              disabled={validando}
              className="w-full min-h-[52px] bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              <span>{validando ? "Validando Dados..." : "Confirmar e Revelar Minha Senha"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* CARD RESULTADO */}
          {resultado && (
            <div ref={cardResultadoRef} className="pt-2">
              <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl space-y-3.5">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-white text-emerald-700 font-black flex items-center justify-center text-base shadow shrink-0">
                    <Check className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-200 block">
                      Identidade Confirmada com Sucesso
                    </span>
                    <h3 className="text-base sm:text-lg font-black leading-tight">
                      {resultado.nome}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-emerald-100 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                  Polo: <strong className="text-white">{resultado.polo}</strong>
                </p>

                <div className="space-y-2.5 bg-white/10 p-3 sm:p-4 rounded-xl border border-white/20">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 block">
                      E-mail de Login:
                    </span>
                    <span className="text-xs sm:text-sm font-black font-mono text-white break-all select-all block mt-0.5">
                      {resultado.email}
                    </span>
                  </div>

                  <div className="pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 block">
                        Sua Senha Padrão:
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-300">
                        Toque em copiar para desbloquear o acesso 👇
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex-1 min-h-[46px] text-base sm:text-lg font-black font-mono tracking-wider bg-white text-emerald-950 px-3 flex items-center justify-center rounded-xl shadow-inner select-all">
                        {resultado.senha}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopiarSenha}
                        className="min-h-[46px] px-4 bg-emerald-950 hover:bg-black active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{textoBtnCopiar}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* BOTÃO DE LOGIN COM BLOQUEIO ATÉ COPIAR SENHA */}
                <div className="pt-1 space-y-1.5">
                  {senhaCopiada ? (
                    <Link
                      href={`/login?email=${encodeURIComponent(resultado.email)}&senha=${encodeURIComponent(resultado.senha)}`}
                      className="w-full min-h-[50px] bg-white text-emerald-950 hover:bg-emerald-50 active:scale-[0.98] rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-center shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Entrar no Sistema Agora</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full min-h-[50px] bg-white/30 text-white/70 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-not-allowed border border-white/20 select-none"
                    >
                      <Lock className="w-4 h-4 text-white/60" />
                      <span>Copie a Senha Acima para Desbloquear</span>
                    </button>
                  )}

                  <p className="text-[11px] text-center text-amber-200 font-bold flex items-center justify-center gap-1.5">
                    {senhaCopiada ? (
                      <span className="text-emerald-100 font-medium">
                        ✓ Senha copiada! Ao tocar acima, seus dados já estarão preenchidos.
                      </span>
                    ) : (
                      <>
                        <span>🔒</span>
                        <span>Primeiro toque no botão <strong>&quot;Copiar Senha&quot;</strong> para liberar o acesso.</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

        </section>

        {/* RODAPÉ */}
        <footer className="text-center text-[11px] text-slate-400 py-2">
          Projeto Social Esportivo — Sistema de Gestão de Beneficiários
        </footer>

      </main>
    </div>
  );
}
