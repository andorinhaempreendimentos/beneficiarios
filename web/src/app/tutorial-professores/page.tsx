"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Check,
  CheckCircle2,
  ArrowRight,
  Lock,
  Copy,
  Sparkles,
  AlertCircle,
  Eye,
} from "lucide-react";

interface PoloOption {
  id: string;
  polo: string;
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
  function handlePoloChange(id: string) {
    setPoloSelecionado(id);
    setErro("");
    setResultado(null);
    setSenhaCopiada(false);
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
      setErro("Digite o seu número de WhatsApp com DDD no Passo 2.");
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
        }),
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
                Acesso Inicial
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">
              Treinamento &amp; Desbloqueio de Acesso
            </h1>

            <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
              Assista aos dois vídeos tutoriais abaixo para aprender a criar suas turmas e enturmar os alunos. Em seguida, selecione seu polo para liberar sua senha padrão.
            </p>

            {/* Barra de Progresso */}
            <div className="pt-2 flex items-center gap-3">
              <div className="flex-1 bg-sky-950/60 rounded-full h-2.5 overflow-hidden border border-sky-400/20">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(totalConfirmados / 2) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-extrabold text-emerald-300 shrink-0">
                {totalConfirmados} de 2 vídeos vistos
              </span>
            </div>
          </div>
        </header>

        {/* SEÇÃO 1: CARROSSEL DE VÍDEOS */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs">
                1
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Vídeos Obrigatórios
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => irParaSlide(0)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  slideAtual === 0
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Vídeo 1 {video1Visto && "✓"}
              </button>
              <button
                type="button"
                onClick={() => irParaSlide(1)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  slideAtual === 1
                    ? "bg-white text-sky-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Vídeo 2 {video2Visto && "✓"}
              </button>
            </div>
          </div>

          {/* Container do Carrossel com Scroll Snap */}
          <div className="relative">
            <div
              ref={trackRef}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar gap-4 pb-2"
              style={{ scrollSnapType: "x mandatory" }}
              onScroll={() => {
                if (!trackRef.current) return;
                const scrollLeft = trackRef.current.scrollLeft;
                const width = trackRef.current.clientWidth;
                const novoIdx = Math.round(scrollLeft / width);
                if (novoIdx !== slideAtual && (novoIdx === 0 || novoIdx === 1)) {
                  setSlideAtual(novoIdx);
                }
              }}
            >
              {/* SLIDE 1: VÍDEO 1 - GRADE E HORÁRIOS */}
              <div className="w-full shrink-0 snap-center space-y-3">
                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
                  <div className="p-2.5 bg-slate-950/80 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Play className="w-3.5 h-3.5 text-red-500 shrink-0 fill-red-500" />
                      <span className="text-xs font-black truncate">
                        Vídeo 1: Grade de Aulas e Horários
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                      Passo 1 de 2
                    </span>
                  </div>

                  {/* Player 9:16 Responsivo */}
                  <div className="bg-black flex justify-center items-center py-1">
                    <div className="w-full max-w-[240px] sm:max-w-[270px] mx-auto aspect-[9/16] relative bg-black rounded-lg overflow-hidden shadow-2xl">
                      <iframe
                        src="https://www.youtube-nocookie.com/embed/d4JDELOl4R8?rel=0&playsinline=1"
                        title="Vídeo 1: Grade de Aulas e Horários"
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>

                {/* Checkbox de Confirmação Vídeo 1 */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    video1Visto
                      ? "bg-emerald-50/70 border-emerald-500 text-emerald-950"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
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
                      Assisti ao vídeo sobre a <strong>Grade e Horários</strong> e compreendi o processo.
                    </span>
                    <span className="text-[10px] text-sky-600 font-semibold mt-0.5 block">
                      ↳ Ao marcar, avança automaticamente para o Vídeo 2
                    </span>
                  </div>
                </label>
              </div>

              {/* SLIDE 2: VÍDEO 2 - ENTURMAÇÃO DE ALUNOS */}
              <div className="w-full shrink-0 snap-center space-y-3">
                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
                  <div className="p-2.5 bg-slate-950/80 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Play className="w-3.5 h-3.5 text-red-500 shrink-0 fill-red-500" />
                      <span className="text-xs font-black truncate">
                        Vídeo 2: Enturmação dos Alunos
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                      Passo 2 de 2
                    </span>
                  </div>

                  {/* Player Vertical Shorts */}
                  <div className="bg-black flex justify-center items-center py-1">
                    <div className="w-full max-w-[240px] sm:max-w-[270px] mx-auto aspect-[9/16] relative bg-black rounded-lg overflow-hidden shadow-2xl">
                      <iframe
                        src="https://www.youtube-nocookie.com/embed/PaTCRozZn3o?rel=0&playsinline=1"
                        title="Vídeo 2: Enturmação dos Alunos"
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>

                {/* Checkbox de Confirmação Vídeo 2 */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    video2Visto
                      ? "bg-emerald-50/70 border-emerald-500 text-emerald-950"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
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
              <span className="font-bold text-sky-700">Mostrando Vídeo {slideAtual + 1} de 2</span>
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
                2 Passos
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1.5">
              2. Liberar Minha Senha de Acesso
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Selecione o seu núcleo esportivo e digite seu número de WhatsApp para liberar sua senha padrão.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* PASSO 1: POLO / NÚCLEO */}
            <div className="space-y-1.5">
              <label htmlFor="select-polo" className="block text-xs font-black uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                <span>Selecione o seu Núcleo / Polo:</span>
              </label>
              <select
                id="select-polo"
                value={poloSelecionado}
                onChange={(e) => handlePoloChange(e.target.value)}
                className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-sky-600 focus:outline-none transition-all cursor-pointer"
              >
                <option value="">-- Toque para escolher seu polo esportivo --</option>
                {polos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.polo}
                  </option>
                ))}
              </select>
            </div>

            {/* PASSO 2: TELEFONE / WHATSAPP */}
            <div className="space-y-1.5">
              <label htmlFor="input-telefone" className="block text-xs font-black uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">2</span>
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
              <span>{validando ? "Validando Dados..." : "Liberar Minha Senha de Acesso"}</span>
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
