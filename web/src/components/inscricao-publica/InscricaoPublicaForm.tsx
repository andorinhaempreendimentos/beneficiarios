"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CheckCircle, ArrowLeft, MapPin, ShieldCheck, AlertTriangle } from "lucide-react";
import { z } from "zod";
import type { PerguntaParQ } from "@/lib/types";
import { validarCpf, validarEmail } from "@/lib/mascaras";
import { beneficiariosApi, inscricoesApi, turmasApi, configuracoesApi } from "@/lib/api/services";
import {
  obterGeolocalizacaoNavegador,
  validarConformidadeLocalizacao,
  type GeolocalizacaoConfig,
  type CoordenadasUsuario,
  type ResultadoValidacaoGeo,
} from "@/lib/geolocation";

const inscricaoSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  nomeResponsavel: z.string().min(3, "Nome do responsável deve ter no mínimo 3 caracteres").optional().or(z.literal("")),
  whatsappResponsavel: z.string().min(1, "Telefone do responsável é obrigatório").optional().or(z.literal("")),
});

type FieldErrors = Partial<Record<string, string>>;

const PERGUNTAS_PARQ = [
  "Algum médico já disse que possui problema de coração e recomendou só praticar atividade física supervisionado?",
  "Sente dor no peito quando pratica atividade física?",
  "No último mês, sentiu dor no peito quando não estava praticando atividade física?",
  "Perde o equilíbrio devido a tontura ou já perdeu a consciência?",
  "Tem algum problema ósseo ou articular que poderia ser piorado pela atividade física?",
  "Toma atualmente algum medicamento para pressão arterial ou problema de coração?",
  "Sabe de outra razão pela qual não deveria praticar atividade física?",
  "Tem diabetes controlada com insulina?",
  "Tem mais de 65 anos e não está acostumado a praticar atividade física?",
  "Está gestante ou suspeita estar gestante?",
];

interface InscricaoPublicaFormProps {
  turmaId: string;
  onSubmit?: (data: FormData) => void;
}

export function InscricaoPublicaForm({ turmaId, onSubmit }: InscricaoPublicaFormProps) {
  const router = useRouter();

  // Estados do Beneficiário
  const [dataNascimento, setDataNascimento] = useState("");
  const [idade, setIdade] = useState<number | null>(null);
  const [sexo, setSexo] = useState("Masculino");
  const [pcd, setPcd] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState<"RG" | "Certidao">("RG");

  // Estados de Endereço & ViaCEP
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("Palmas");
  const [estado, setEstado] = useState("TO");
  const [loadingCep, setLoadingCep] = useState(false);

  // Acordeões colapsados por padrão
  const [parqAberto, setParqAberto] = useState(false);
  const [termosAberto, setTermosAberto] = useState(false);

  // PAR-Q (Todas preenchidas com "Não" por padrão)
  const [parQ, setParQ] = useState<PerguntaParQ[]>(
    PERGUNTAS_PARQ.map((p) => ({ pergunta: p, resposta: "Não" }))
  );

  // Termos e autorizações (Pré-marcados por padrão)
  const [autParticipacao, setAutParticipacao] = useState(true);
  const [autImagem, setAutImagem] = useState(true);
  const [aceiteLGPD, setAceiteLGPD] = useState(true);

  // Feedback e submissão
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Estado de Geolocalização
  const [geoConfig, setGeoConfig] = useState<GeolocalizacaoConfig | null>(null);
  const [coordsUser, setCoordsUser] = useState<CoordenadasUsuario | null>(null);
  const [geoValidacao, setGeoValidacao] = useState<ResultadoValidacaoGeo | null>(null);
  const [checandoGeo, setChecandoGeo] = useState(false);

  useEffect(() => {
    configuracoesApi
      .get("geolocalizacao_inscricao")
      .then((res) => {
        if (res?.valor && typeof res.valor === "object") {
          const cfg = res.valor as GeolocalizacaoConfig;
          setGeoConfig(cfg);
          if (cfg.ativo) {
            setChecandoGeo(true);
            obterGeolocalizacaoNavegador()
              .then((coords) => {
                setCoordsUser(coords);
                const val = validarConformidadeLocalizacao({
                  coords,
                  config: cfg,
                  cidadeNome: cidade,
                  estadoUf: estado,
                });
                setGeoValidacao(val);
              })
              .finally(() => setChecandoGeo(false));
          }
        }
      })
      .catch(() => {});
  }, [cidade, estado]);

  // Cálculo de Idade
  function handleDataNascimentoChange(dataStr: string) {
    setDataNascimento(dataStr);
    if (!dataStr) {
      setIdade(null);
      return;
    }
    const nasc = new Date(dataStr);
    const hoje = new Date();
    let id = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      id--;
    }
    setIdade(id);
  }

  // Auto-completar CEP
  async function handleCepBlur() {
    if (!cep) return;
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    try {
      setLoadingCep(true);
      const { buscarEnderecoPorCep } = await import("@/lib/cep");
      const res = await buscarEnderecoPorCep(cepLimpo);
      if (res) {
        if (res.logradouro) setLogradouro(res.logradouro);
        if (res.bairro) setBairro(res.bairro);
        if (res.localidade) setCidade(res.localidade);
        if (res.uf) setEstado(res.uf);
      }
    } catch (e) {
      console.warn("Erro ao buscar CEP:", e);
    } finally {
      setLoadingCep(false);
    }
  }

  // Avaliação da exibição do responsável legal (Menor de 18 anos ou PCD)
  const ehMenor = idade !== null && idade < 18;
  const precisaResponsavel = ehMenor || pcd;

  // Ano de Nascimento para certidão
  const anoNascimento = dataNascimento ? new Date(dataNascimento).getFullYear() : 0;
  const certidaoNovoModelo = anoNascimento === 0 || anoNascimento >= 2010;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const cpf = String(formData.get("cpf") || "").trim();
    const rg = String(formData.get("rg") || "").trim();
    const cpfResponsavel = String(formData.get("cpfResponsavel") || "").trim();
    const emailResponsavel = String(formData.get("emailResponsavel") || "").trim();

    // Validações de CPF
    if (cpf && !validarCpf(cpf)) {
      setErro("CPF do beneficiário inválido. Por favor, confira os números digitados.");
      return;
    }

    if (precisaResponsavel && cpfResponsavel && !validarCpf(cpfResponsavel)) {
      setErro("CPF do responsável inválido. Por favor, confira os números digitados.");
      return;
    }

    if (emailResponsavel && !validarEmail(emailResponsavel)) {
      setErro("Endereço de e-mail do responsável inválido.");
      return;
    }

    const parsed = inscricaoSchema.safeParse({
      nomeCompleto: formData.get("nomeCompleto") as string,
      dataNascimento,
      nomeResponsavel: formData.get("nomeResponsavel") as string,
      whatsappResponsavel: formData.get("whatsappResponsavel") as string,
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      
      if (precisaResponsavel && (!formData.get("nomeResponsavel") || !formData.get("whatsappResponsavel"))) {
        if (!formData.get("nomeResponsavel")) errors.nomeResponsavel = "Nome do responsável é obrigatório";
        if (!formData.get("whatsappResponsavel")) errors.whatsappResponsavel = "Telefone do responsável é obrigatório";
        setFieldErrors(errors);
      } else if (parsed.error.issues.some(e => e.path[0] === 'nomeResponsavel' || e.path[0] === 'whatsappResponsavel') && !precisaResponsavel) {
         // se nao precisa responsavel ignora erros de responsavel
         delete errors.nomeResponsavel;
         delete errors.whatsappResponsavel;
         setFieldErrors(errors);
      }

      if (Object.keys(errors).length > 0) {
        setErro("Corrija os erros destacados no formulário.");
        return;
      }
    } else {
       if (precisaResponsavel && (!formData.get("nomeResponsavel") || !formData.get("whatsappResponsavel"))) {
         const errors: FieldErrors = {};
         if (!formData.get("nomeResponsavel")) errors.nomeResponsavel = "Nome do responsável é obrigatório";
         if (!formData.get("whatsappResponsavel")) errors.whatsappResponsavel = "Telefone do responsável é obrigatório";
         setFieldErrors(errors);
         setErro("Corrija os erros destacados no formulário.");
         return;
       }
    }

    // Validação de Faixa etária da turma
    if (dataNascimento) {
      try {
        const turmaInfo = await turmasApi.get(turmaId);
        const min = turmaInfo.idadeMinima ?? 6;
        const max = turmaInfo.idadeMaxima ?? 17;
        if (idade !== null && (idade < min || idade > max)) {
          setErro(`A idade do beneficiário (${idade} anos) está fora do limite permitido para esta turma (Permitido: ${min} a ${max} anos).`);
          return;
        }
      } catch (e) {
        // Prossegue se falhar consulta de limite de turma
      }
    }

    // Validação de Geolocalização (se ativa nas configurações globais)
    if (geoConfig?.ativo && geoConfig.nivel !== "desativado") {
      const val = validarConformidadeLocalizacao({
        coords: coordsUser,
        config: geoConfig,
        cidadeNome: cidade,
        estadoUf: estado,
      });
      setGeoValidacao(val);
      if (!val.valido && geoConfig.modo === "bloqueio") {
        setErro(val.mensagem);
        return;
      }
    }

    if (!aceiteLGPD || !autParticipacao) {
      setErro("É necessário aceitar os Termos de Participação e LGPD para concluir a inscrição.");
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    try {
      setLoading(true);

      // Montagem do documento (RG x Certidão)
      let documentoFinal = "";
      if (tipoDocumento === "RG") {
        documentoFinal = rg;
      } else if (certidaoNovoModelo) {
        documentoFinal = String(formData.get("matriculaCertidao") || "");
      } else {
        const termo = String(formData.get("certidaoTermo") || "");
        const livro = String(formData.get("certidaoLivro") || "");
        const folha = String(formData.get("certidaoFolha") || "");
        documentoFinal = `Termo: ${termo}, Livro: ${livro}, Folha: ${folha}`;
      }

      // Payload Real para o Supabase
      const payloadBeneficiario: Record<string, unknown> = {
        nomeCompleto: formData.get("nomeCompleto"),
        dataNascimento,
        sexo,
        cpf,
        rg: documentoFinal,
        raca: formData.get("raca"),
        nis: formData.get("nis"),
        pcd,
        tipoPcd: pcd ? formData.get("tipoPcd") : null,

        // Responsável
        nomeResponsavel: precisaResponsavel ? formData.get("nomeResponsavel") : null,
        parentescoResponsavel: precisaResponsavel ? formData.get("parentescoResponsavel") : null,
        cpfResponsavel: precisaResponsavel ? cpfResponsavel : null,
        celular: precisaResponsavel ? formData.get("whatsappResponsavel") : null,
        email: precisaResponsavel ? emailResponsavel : null,

        // Endereço
        cep: cep.replace(/\D/g, ""),
        logradouro: formData.get("logradouro") || logradouro,
        numero: formData.get("numero"),
        complemento: formData.get("complemento"),
        bairro: formData.get("bairro") || bairro,
        cidade: formData.get("cidade") || cidade,
        estado: formData.get("estado") || estado,

        // Escola & Uniforme
        nomeEscola: formData.get("nomeEscola"),
        redeEnsino: formData.get("redeEnsino"),
        turnoEscolar: formData.get("turnoEscolar"),
        tamanhoCamisa: formData.get("tamanhoCamisa"),
        tamanhoCalcao: formData.get("tamanhoCalcao"),

        // Termos & status
        autParticipacao,
        autImagem,
        aceiteLGPD,
        status: "pendente",
        tipoMatricula: "online",
      };

      const createdBeneficiario = await beneficiariosApi.create(payloadBeneficiario);
      const novaInscricao = await inscricoesApi.criar(createdBeneficiario.id, turmaId, "Inscrição pública online", { parQ });

      const tipoStatus = novaInscricao.status === "reservada" ? "fila" : novaInscricao.status;
      router.push(`/inscricao/confirmacao?turmaId=${turmaId}&tipo=${tipoStatus}`);
    } catch (err: any) {
      console.error("Erro na inscrição pública:", err);
      setErro(err?.message || "Ocorreu um erro ao processar sua inscrição. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="turmaId" value={turmaId} />

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* 1. Identificação do Beneficiário */}
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700 text-xs font-bold">1</span>
            Identificação do Beneficiário
          </h2>
          <span className="text-[11px] text-zinc-400 font-medium">* Campos obrigatórios</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Nome completo *</label>
            <input
              type="text"
              name="nomeCompleto"
              required
              placeholder="Digite o nome completo do beneficiário"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
            {fieldErrors.nomeCompleto && <span className="text-[11px] text-red-500">{fieldErrors.nomeCompleto}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 h-6.5 flex items-center">Data de nascimento *</label>
            <input
              type="date"
              name="dataNascimento"
              required
              value={dataNascimento}
              onChange={(e) => handleDataNascimentoChange(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
            {fieldErrors.dataNascimento && <span className="text-[11px] text-red-500">{fieldErrors.dataNascimento}</span>}
            {idade !== null && (
              <span className="text-[11px] font-medium text-sky-600">
                Beneficiário possui {idade} anos
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 h-6.5 flex items-center">Sexo *</label>
            <select
              name="sexo"
              required
              value={sexo}
              onChange={(e) => setSexo(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Não Informar">Não Informar</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 h-6.5 flex items-center">CPF do beneficiário</label>
            <input
              type="text"
              name="cpf"
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          {/* Documento Discreto Integrado (Prefix Select no Input) */}
          <div className="flex flex-col gap-1.5 sm:col-span-1">
            <label className="text-xs font-semibold text-zinc-700">Documento do beneficiário</label>
            <div className="relative flex items-center w-full rounded-xl border border-zinc-300 bg-white transition-all focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value as "RG" | "Certidao")}
                className="text-[10px] leading-tight font-bold text-sky-700 bg-transparent py-1 pl-2.5 pr-1 outline-none cursor-pointer border-r border-zinc-200 rounded-l-xl hover:bg-zinc-50 shrink-0 text-left"
              >
                <option value="RG">RG</option>
                <option value="Certidao">Certidão&#10;de Nasc.</option>
              </select>

              {tipoDocumento === "RG" ? (
                <div className="w-full">
                  <input
                    type="text"
                    name="rg"
                    placeholder="00.000.000-0"
                    maxLength={14}
                    className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              ) : certidaoNovoModelo ? (
                <div className="w-full">
                  <input
                    type="text"
                    name="matriculaCertidao"
                    placeholder="32 dígitos da certidão"
                    maxLength={40}
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-mono outline-none"
                  />
                </div>
              ) : (
                <div className="w-full p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      name="certidaoTermo"
                      placeholder="Termo"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      name="certidaoLivro"
                      placeholder="Livro"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      name="certidaoFolha"
                      placeholder="Folha"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>
            {tipoDocumento === "Certidao" && certidaoNovoModelo && (
              <p className="text-[11px] text-zinc-400">Matrícula unificada de 32 dígitos do CadÚnico/CNJ.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Raça / Etnia</label>
            <select
              name="raca"
              defaultValue=""
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              <option value="">Selecione</option>
              <option value="Parda">Parda</option>
              <option value="Preta">Preta</option>
              <option value="Branca">Branca</option>
              <option value="Amarela">Amarela</option>
              <option value="Indígena">Indígena</option>
              <option value="Outras">Outras</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Número do NIS</label>
            <input
              type="text"
              name="nis"
              placeholder="00000000000"
              maxLength={11}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
            <p className="text-[11px] text-zinc-400">Número do CadÚnico ou Bolsa Família (opcional).</p>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-2 rounded-xl bg-zinc-50 p-3.5 border border-zinc-200/80">
            <label className="text-xs font-semibold text-zinc-700">Pessoa com Deficiência (PCD)? *</label>
            <p className="text-[11px] text-zinc-400">Marcar Sim se possui deficiência física, visual, auditiva, intelectual ou autismo (TEA).</p>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700">
                <input
                  type="radio"
                  name="pcd"
                  value="Não"
                  checked={!pcd}
                  onChange={() => setPcd(false)}
                  className="h-4 w-4 text-sky-600"
                />
                Não
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700">
                <input
                  type="radio"
                  name="pcd"
                  value="Sim"
                  checked={pcd}
                  onChange={() => setPcd(true)}
                  className="h-4 w-4 text-sky-600"
                />
                Sim
              </label>
            </div>

            {pcd && (
              <div className="mt-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Tipo de Deficiência</label>
                <select
                  name="tipoPcd"
                  defaultValue=""
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                >
                  <option value="">Selecione o tipo de deficiência</option>
                  <option>Autismo (TEA - Leve)</option>
                  <option>Autismo (TEA - Moderado)</option>
                  <option>Autismo (TEA - Severo)</option>
                  <option>Deficiência Física</option>
                  <option>Deficiência Visual</option>
                  <option>Deficiência Auditiva</option>
                  <option>Deficiência Intelectual</option>
                  <option>Síndrome de Down</option>
                  <option>Deficiência Múltipla</option>
                  <option>Outros</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Dados do Responsável Legal (Condicional) */}
      {precisaResponsavel && (
        <section className="bg-amber-50/40 rounded-2xl border border-amber-200/80 p-6 shadow-xs flex flex-col gap-5 transition-all">
          <div className="border-b border-amber-200/60 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-amber-950 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-200 text-amber-900 text-xs font-bold">2</span>
                Dados do Responsável Legal
              </h2>
              <p className="text-xs text-amber-800/80 mt-1">
                Pai, mãe ou responsável legal exigido para beneficiários menores de 18 anos ou beneficiários PCD.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/60 px-2 py-0.5 text-[11px] font-semibold text-amber-800 shrink-0">
              {ehMenor ? `Obrigatório (${idade} anos)` : "Obrigatório (PCD)"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Nome completo do responsável *</label>
              <input
                type="text"
                name="nomeResponsavel"
                required
                placeholder="Digite o nome completo do responsável"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
              {fieldErrors.nomeResponsavel && <span className="text-[11px] text-red-500">{fieldErrors.nomeResponsavel}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Grau de parentesco *</label>
              <select
                name="parentescoResponsavel"
                required
                defaultValue="Mãe"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
              >
                <option value="Mãe">Mãe</option>
                <option value="Pai">Pai</option>
                <option value="Avó/Avô">Avó / Avô</option>
                <option value="Tia/Tio">Tia / Tio</option>
                <option value="Outro">Outro Responsável Legal</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">CPF do responsável *</label>
              <input
                type="text"
                name="cpfResponsavel"
                required
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Celular / WhatsApp do responsável *</label>
              <input
                type="text"
                name="whatsappResponsavel"
                required
                placeholder="(63) 90000-0000"
                maxLength={15}
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
              {fieldErrors.whatsappResponsavel && <span className="text-[11px] text-red-500">{fieldErrors.whatsappResponsavel}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">E-mail do responsável</label>
              <input
                type="email"
                name="emailResponsavel"
                placeholder="seuemail@exemplo.com"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
            </div>
          </div>
        </section>
      )}

      {/* 3. Endereço Residencial */}
      <section className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col gap-5">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700 text-xs font-bold">3</span>
            Endereço Residencial
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">CEP *</label>
            <div className="relative">
              <input
                type="text"
                name="cep"
                required
                placeholder="77000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={handleCepBlur}
                maxLength={9}
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
              {loadingCep && (
                <span className="absolute right-3 top-3 text-xs text-sky-600 font-medium animate-pulse">
                  Buscando...
                </span>
              )}
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Endereço / Logradouro *</label>
            <input
              type="text"
              name="logradouro"
              required
              placeholder="Rua, Avenida, Quadra"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Número *</label>
            <input
              type="text"
              name="numero"
              required
              placeholder="Ex: 104 ou S/N"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Complemento</label>
            <input
              type="text"
              name="complemento"
              placeholder="Apto, Bloco, Casa B"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Bairro *</label>
            <input
              type="text"
              name="bairro"
              required
              placeholder="Bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Cidade *</label>
            <input
              type="text"
              name="cidade"
              required
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">UF *</label>
            <input
              type="text"
              name="estado"
              required
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              maxLength={2}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm uppercase transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>
        </div>
      </section>

      {/* 4. Dados Escolares & Uniforme */}
      <section className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col gap-5">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700 text-xs font-bold">4</span>
            Dados Escolares & Uniforme
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Nome da Escola</label>
            <input
              type="text"
              name="nomeEscola"
              placeholder="Nome da escola onde estuda"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Rede de ensino</label>
            <select
              name="redeEnsino"
              defaultValue=""
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              <option value="">Selecione</option>
              <option value="Municipal">Municipal</option>
              <option value="Estadual">Estadual</option>
              <option value="Particular">Particular</option>
              <option value="Federal">Federal</option>
              <option value="Não estuda">Não estuda</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Turno escolar</label>
            <select
              name="turnoEscolar"
              defaultValue=""
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              <option value="">Selecione</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Integral">Integral</option>
              <option value="Noite">Noite</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Tamanho da Camisa *</label>
            <select
              name="tamanhoCamisa"
              required
              defaultValue=""
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              <option value="">Selecione o tamanho</option>
              <optgroup label="Infantil">
                <option value="8">Tamanho 8</option>
                <option value="10">Tamanho 10</option>
                <option value="12">Tamanho 12</option>
                <option value="14">Tamanho 14</option>
                <option value="16">Tamanho 16</option>
              </optgroup>
              <optgroup label="Adulto">
                <option value="P">Tamanho P</option>
                <option value="M">Tamanho M</option>
                <option value="G">Tamanho G</option>
                <option value="GG">Tamanho GG</option>
                <option value="XG">Tamanho XG</option>
              </optgroup>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Tamanho do Calção *</label>
            <select
              name="tamanhoCalcao"
              required
              defaultValue=""
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm bg-white transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              <option value="">Selecione o tamanho</option>
              <optgroup label="Infantil">
                <option value="8">Tamanho 8</option>
                <option value="10">Tamanho 10</option>
                <option value="12">Tamanho 12</option>
                <option value="14">Tamanho 14</option>
                <option value="16">Tamanho 16</option>
              </optgroup>
              <optgroup label="Adulto">
                <option value="P">Tamanho P</option>
                <option value="M">Tamanho M</option>
                <option value="G">Tamanho G</option>
                <option value="GG">Tamanho GG</option>
                <option value="XG">Tamanho XG</option>
              </optgroup>
            </select>
          </div>
        </div>
      </section>

      {/* 5. PAR-Q (Questionário de Prontidão para Atividade Física - Acordeão Colapsado por Padrão) */}
      <section className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setParqAberto(!parqAberto)}
          className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-zinc-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700 text-xs font-bold shrink-0">5</span>
            <div>
              <h2 className="text-base font-bold text-zinc-900">PAR-Q — Questionário de Prontidão para Atividade Física</h2>
              <p className="text-xs text-zinc-500">Todas as respostas estão selecionadas em <strong>NÃO</strong> por padrão. Clique para expandir apenas se desejar alterar.</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${parqAberto ? "rotate-180" : ""}`} />
        </button>

        {parqAberto && (
          <div className="border-t border-zinc-100 p-6 bg-zinc-50/40">
            <div className="flex flex-col divide-y divide-zinc-200/60">
              {parQ.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                  <p className="text-xs text-zinc-700 font-medium">
                    {index + 1}. {item.pergunta}
                  </p>
                  <div className="flex items-center gap-4 shrink-0">
                    <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                      <input
                        type="radio"
                        name={`parq_${index}`}
                        value="Sim"
                        checked={item.resposta === "Sim"}
                        onChange={() =>
                          setParQ((prev) =>
                            prev.map((p, i) => (i === index ? { ...p, resposta: "Sim" } : p))
                          )
                        }
                        className="h-4 w-4 text-sky-600"
                      />
                      Sim
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                      <input
                        type="radio"
                        name={`parq_${index}`}
                        value="Não"
                        checked={item.resposta === "Não"}
                        onChange={() =>
                          setParQ((prev) =>
                            prev.map((p, i) => (i === index ? { ...p, resposta: "Não" } : p))
                          )
                        }
                        className="h-4 w-4 text-sky-600"
                      />
                      Não
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 6. Autorizações e Termos (Acordeão Colapsado por Padrão) */}
      <section className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setTermosAberto(!termosAberto)}
          className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-zinc-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700 text-xs font-bold shrink-0">6</span>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Autorizações e Termos de Aceite</h2>
              <p className="text-xs text-zinc-500">Termos de participação, uso de imagem e LGPD pré-aceitos por padrão. Clique para visualizar detalhes.</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${termosAberto ? "rotate-180" : ""}`} />
        </button>

        {termosAberto && (
          <div className="border-t border-zinc-100 p-6 bg-zinc-50/40">
            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200/80 bg-white hover:bg-zinc-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={autParticipacao}
                  onChange={(e) => setAutParticipacao(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded text-sky-600"
                />
                <div className="text-xs text-zinc-700">
                  <strong className="font-semibold text-zinc-900 block">Autorização de Participação no Projeto</strong>
                  Autorizo a participação do(a) beneficiário(a) nas atividades do Projeto Escolinhas de Esporte, declarando ciência dos dias, horários e normas estabelecidas.
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200/80 bg-white hover:bg-zinc-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={autImagem}
                  onChange={(e) => setAutImagem(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-sky-600"
                />
                <div className="text-xs text-zinc-700">
                  <strong className="font-semibold text-zinc-900 block">Autorização de Uso de Imagem (SIM)</strong>
                  Autorizo o uso de fotos e vídeos exclusivamente para fins institucionais e de prestação de contas do projeto.
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200/80 bg-white hover:bg-zinc-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={aceiteLGPD}
                  onChange={(e) => setAceiteLGPD(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded text-sky-600"
                />
                <div className="text-xs text-zinc-700">
                  <strong className="font-semibold text-zinc-900 block">Ciência e Aceite de Tratamento de Dados (LGPD)</strong>
                  Declaro que as informações são verdadeiras e estou ciente do tratamento dos dados em atendimento ao melhor interesse da criança/adolescente (Lei 13.709/2018).
                </div>
              </label>
            </div>
          </div>
        )}
      </section>

      {/* Indicador de Geolocalização (se ativa) */}
      {geoConfig?.ativo && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 text-xs shadow-2xs transition-all ${
            geoValidacao?.valido === false
              ? "border-red-300 bg-red-50 text-red-900"
              : geoValidacao?.motivo === "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-sky-200 bg-sky-50/70 text-sky-900"
          }`}
        >
          <div className="mt-0.5">
            {geoValidacao?.valido === false ? (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            ) : geoValidacao?.motivo === "sucesso" ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
            )}
          </div>
          <div className="flex-1 space-y-0.5">
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              {geoValidacao?.valido === false
                ? "Restrição Territorial"
                : geoValidacao?.motivo === "sucesso"
                ? "Localização Validada"
                : "Validação Geográfica Ativa"}
            </span>
            <p className="leading-relaxed">
              {checandoGeo
                ? "Verificando proximidade do candidato com o polo..."
                : geoValidacao?.mensagem ||
                  `Inscrições restritas para candidatos do polo de ${cidade}.`}
            </p>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Escolha de Polo</span>
        </button>

        <button
          type="submit"
          disabled={loading || !aceiteLGPD || !autParticipacao}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>Processando Inscrição...</span>
          ) : (
            <>
              <span>Confirmar Inscrição do Beneficiário</span>
              <CheckCircle className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
