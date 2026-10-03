"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Field, Input, Select, Textarea, LinkButton, Badge } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  supervisoesApi,
  nucleosApi,
  funcionariosApi,
  beneficiariosApi,
  type NucleoApi,
  type FuncionarioApi,
  type Paginated,
  type AvaliacaoNivel,
} from "@/lib/api/services";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import { useAuth } from "@/components/providers/AuthProvider";
import { AlertCircle, Check, X, Calendar, Clock, MapPin } from "lucide-react";
import { getDataHojeBrasil } from "@/lib/dateUtils";
import { formatarData, cn } from "@/lib/utils";

type Step = "identificacao" | "presenca" | "avaliacao" | "observacoes";

const STEPS: { key: Step; label: string }[] = [
  { key: "identificacao", label: "Identificação" },
  { key: "presenca", label: "Presenças" },
  { key: "avaliacao", label: "Avaliação" },
  { key: "observacoes", label: "Observações" },
];

const AVALIACAO_OPTS: { value: AvaliacaoNivel; label: string }[] = [
  { value: "otima", label: "Ótima" },
  { value: "boa", label: "Boa" },
  { value: "regular", label: "Regular" },
  { value: "ruim", label: "Ruim" },
  { value: "critica", label: "Crítica" },
];

export default function NovaSupervisaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nucleoIdParam = searchParams.get("nucleoId") || "";
  const { toast } = useToast();
  const { user } = useAuth();
  const isCoordenador = Boolean((user as any)?.isCoordenador);

  const [step, setStep] = useState<Step>("identificacao");
  const [salvando, setSalvando] = useState(false);
  const [mostrarDataManual, setMostrarDataManual] = useState(false);
  const [carregandoEsperados, setCarregandoEsperados] = useState(false);

  const [form, setForm] = useState({
    nucleoId: nucleoIdParam,
    coordenadorId: "",
    dataSupervisao: getDataHojeBrasil(),
    horaEntrada: new Date().toTimeString().slice(0, 5),
    horaSaida: "",
    beneficiariosPresentes: "",
    beneficiariosEsperados: "",
    professorPresente: "true",
    estruturaAvaliacao: "boa" as AvaliacaoNivel | "",
    estruturaObservacoes: "",
    materiaisAvaliacao: "boa" as AvaliacaoNivel | "",
    materiaisObservacoes: "",
    uniformesAvaliacao: "boa" as AvaliacaoNivel | "",
    uniformesObservacoes: "",
    gradeCumprida: "true",
    gradeObservacoes: "",
    atividadeDesenvolvida: "",
    orientacoesProfessor: "",
    providenciasNecessarias: "",
    observacoesGerais: "",
  });

  // Núcleos disponíveis: coordenador vê só os seus; admin vê todos
  const { data: meusNucleos } = useQuery<NucleoApi[]>(
    () => isCoordenador ? coordenadoresApi.getMeusNucleos() : Promise.resolve([] as NucleoApi[]),
    [isCoordenador],
  );
  const { data: nucleosData } = useQuery<Paginated<NucleoApi>>(
    () => isCoordenador
      ? Promise.resolve({ data: [] as NucleoApi[], total: 0, page: 1, limit: 200 })
      : nucleosApi.list({ limit: 200 }),
    [isCoordenador],
  );
  const { data: funcData } = useQuery<Paginated<FuncionarioApi>>(
    () => isCoordenador
      ? Promise.resolve({ data: [] as FuncionarioApi[], total: 0, page: 1, limit: 200 })
      : funcionariosApi.list({ limit: 200 }),
    [isCoordenador],
  );

  const nucleosDisponiveis: NucleoApi[] = isCoordenador ? (meusNucleos ?? []) : (nucleosData?.data ?? []);
  const funcionarios = funcData?.data ?? [];
  const semNucleos = isCoordenador && (meusNucleos?.length ?? 1) === 0;

  // Auto-seleciona se houver apenas 1 núcleo
  useEffect(() => {
    if (nucleosDisponiveis.length === 1 && !form.nucleoId) {
      setForm((f) => ({ ...f, nucleoId: nucleosDisponiveis[0].id }));
    }
  }, [nucleosDisponiveis, form.nucleoId]);

  // Pré-preenche coordenadorId com o funcionário logado
  useEffect(() => {
    if (isCoordenador && user?.entidadeId && !form.coordenadorId) {
      setForm((f) => ({ ...f, coordenadorId: user.entidadeId! }));
    }
  }, [isCoordenador, user?.entidadeId]);

  useEffect(() => {
    if (nucleoIdParam && !form.nucleoId) {
      setForm((f) => ({ ...f, nucleoId: nucleoIdParam }));
    }
  }, [nucleoIdParam, form.nucleoId]);

  // Busca contagem de beneficiários ativos do núcleo para preencher esperados
  useEffect(() => {
    if (!form.nucleoId) return;
    let cancel = false;
    async function carregarEsperados() {
      setCarregandoEsperados(true);
      try {
        const res = await beneficiariosApi.list({ nucleoId: form.nucleoId, status: "ativo", limit: 1 });
        if (!cancel && res.total > 0 && !form.beneficiariosEsperados) {
          setForm((f) => ({ ...f, beneficiariosEsperados: String(res.total) }));
        }
      } catch (err) {
        console.error("Erro ao carregar alunos esperados:", err);
      } finally {
        if (!cancel) setCarregandoEsperados(false);
      }
    }
    carregarEsperados();
    return () => { cancel = true; };
  }, [form.nucleoId]);

  function set(campo: string, valor: unknown) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function stepIndex() {
    return STEPS.findIndex((s) => s.key === step);
  }

  function validarPassoAtual(): boolean {
    if (step === "identificacao") {
      if (!form.nucleoId) {
        toast.error("Selecione o núcleo da supervisão.");
        return false;
      }
      if (!form.coordenadorId) {
        toast.error("Coordenador responsável obrigatório.");
        return false;
      }
      if (!form.dataSupervisao || !form.horaEntrada) {
        toast.error("Data e hora de entrada são obrigatórias.");
        return false;
      }
    }

    if (step === "presenca") {
      if (form.gradeCumprida === "false" && !form.gradeObservacoes.trim()) {
        toast.error("Por favor, justifique o motivo do não cumprimento da grade.");
        return false;
      }
    }

    if (step === "avaliacao") {
      if (!form.estruturaObservacoes.trim()) {
        toast.error("As observações da estrutura física são obrigatórias.");
        return false;
      }
    }

    return true;
  }

  function avancar() {
    if (!validarPassoAtual()) return;
    const idx = stepIndex();
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  }

  function voltar() {
    const idx = stepIndex();
    if (idx > 0) setStep(STEPS[idx - 1].key);
  }

  async function salvar(finalizar = false) {
    if (!form.nucleoId || !form.coordenadorId || !form.dataSupervisao || !form.horaEntrada) {
      toast.error("Núcleo, coordenador, data e hora de entrada são obrigatórios.");
      setStep("identificacao");
      return;
    }

    if (!form.estruturaObservacoes.trim()) {
      toast.error("Observações da estrutura física são obrigatórias.");
      setStep("avaliacao");
      return;
    }

    if (form.gradeCumprida === "false" && !form.gradeObservacoes.trim()) {
      toast.error("Por favor, justifique o motivo do não cumprimento da grade.");
      setStep("presenca");
      return;
    }

    setSalvando(true);
    try {
      // Hora de saída deduzida automaticamente na finalização caso não informada
      const horaSaidaFinal = finalizar && !form.horaSaida
        ? new Date().toTimeString().slice(0, 5)
        : form.horaSaida || null;

      const body = {
        nucleoId: form.nucleoId,
        coordenadorId: form.coordenadorId,
        dataSupervisao: form.dataSupervisao,
        horaEntrada: form.horaEntrada,
        horaSaida: horaSaidaFinal,
        beneficiariosPresentes: form.beneficiariosPresentes ? parseInt(form.beneficiariosPresentes) : null,
        beneficiariosEsperados: form.beneficiariosEsperados ? parseInt(form.beneficiariosEsperados) : null,
        professorPresente: form.professorPresente === "" ? null : form.professorPresente === "true",
        estruturaAvaliacao: form.estruturaAvaliacao || null,
        estruturaObservacoes: form.estruturaObservacoes || null,
        materiaisAvaliacao: form.materiaisAvaliacao || null,
        materiaisObservacoes: form.materiaisObservacoes || null,
        uniformesAvaliacao: form.uniformesAvaliacao || null,
        uniformesObservacoes: form.uniformesObservacoes || null,
        gradeCumprida: form.gradeCumprida === "" ? null : form.gradeCumprida === "true",
        gradeObservacoes: form.gradeObservacoes || null,
        atividadeDesenvolvida: form.atividadeDesenvolvida || null,
        orientacoesProfessor: form.orientacoesProfessor || null,
        providenciasNecessarias: form.providenciasNecessarias || null,
        observacoesGerais: form.observacoesGerais || null,
      };

      const criada = await supervisoesApi.create(body);
      if (finalizar) {
        await supervisoesApi.finalizar(criada.id);
        toast.success("Supervisão finalizada com sucesso.");
      } else {
        toast.success("Rascunho salvo.");
      }
      router.push(`/supervisoes/${criada.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const idx = stepIndex();
  const isLast = idx === STEPS.length - 1;

  if (semNucleos) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        <PageHeader
          title="Nova Supervisão"
          description="Registro de visita de supervisão ao núcleo"
          actions={<LinkButton href="/supervisoes" variant="secondary">Voltar</LinkButton>}
        />
        <Card>
          <div className="flex flex-col items-center gap-4 py-16 px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
              <AlertCircle className="h-7 w-7 text-zinc-400" />
            </div>
            <p className="font-medium text-zinc-700">Nenhum núcleo atribuído</p>
            <p className="text-sm text-zinc-400 max-w-sm">
              Você precisa ter ao menos um núcleo atribuído para registrar uma supervisão.
              Entre em contato com o administrador.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Nova Supervisão"
        description="Registro de visita de supervisão ao núcleo"
        actions={<LinkButton href="/supervisoes" variant="secondary">Voltar</LinkButton>}
      />

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => {
                if (i <= idx || validarPassoAtual()) setStep(s.key);
              }}
              className={`flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer ${
                s.key === step ? "text-sky-600" : i < idx ? "text-green-600" : "text-zinc-400"
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                s.key === step
                  ? "bg-sky-600 text-white"
                  : i < idx
                  ? "bg-green-500 text-white"
                  : "bg-zinc-200 text-zinc-500"
              }`}>
                {i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < idx ? "bg-green-300" : "bg-zinc-200"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <div className="p-5 flex flex-col gap-6">

          {/* Step 1: Identificação */}
          {step === "identificacao" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Núcleos */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Núcleo supervisionado <span className="text-red-500">*</span>
                  </label>
                  {nucleosDisponiveis.length === 1 ? (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800">
                      <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
                      <div className="text-xs">
                        <p className="font-semibold text-zinc-900">{nucleosDisponiveis[0].identificacao}</p>
                        {nucleosDisponiveis[0].regiao && (
                          <p className="text-zinc-500">{nucleosDisponiveis[0].regiao}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Select value={form.nucleoId} onChange={(e) => set("nucleoId", e.target.value)} required>
                      <option value="">Selecione o núcleo…</option>
                      {nucleosDisponiveis.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.identificacao} {n.regiao ? `(${n.regiao})` : ""}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>

                {!isCoordenador && (
                  <Field label="Coordenador" required>
                    <Select value={form.coordenadorId} onChange={(e) => set("coordenadorId", e.target.value)} required>
                      <option value="">Selecione…</option>
                      {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nomeCompleto}</option>)}
                    </Select>
                  </Field>
                )}

                {/* Data com pré-preenchimento automático e opção discreta de alteração */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Data da visita <span className="text-red-500">*</span>
                  </label>
                  {!mostrarDataManual ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                      <div className="flex items-center gap-2 text-zinc-700">
                        <Calendar className="h-4 w-4 text-sky-600 shrink-0" />
                        <span><strong>Hoje:</strong> {formatarData(form.dataSupervisao)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMostrarDataManual(true)}
                        className="text-xs text-sky-600 hover:text-sky-700 font-medium hover:underline cursor-pointer"
                      >
                        Alterar data
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={form.dataSupervisao}
                        onChange={(e) => set("dataSupervisao", e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          set("dataSupervisao", getDataHojeBrasil());
                          setMostrarDataManual(false);
                        }}
                        className="px-2.5 py-2 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600"
                        title="Voltar para hoje"
                      >
                        Hoje
                      </button>
                    </div>
                  )}
                </div>

                {/* Hora de entrada */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Hora de entrada <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={form.horaEntrada}
                      onChange={(e) => set("horaEntrada", e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Hora de saída será registrada automaticamente ao finalizar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Presenças */}
          {step === "presenca" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Beneficiários presentes (contagem em campo)">
                  <Input
                    type="number"
                    min={0}
                    value={form.beneficiariosPresentes}
                    onChange={(e) => set("beneficiariosPresentes", e.target.value)}
                    placeholder="0"
                  />
                </Field>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-700">
                      Beneficiários esperados (matriculados)
                    </label>
                    {carregandoEsperados && (
                      <span className="text-[10px] text-sky-600 animate-pulse">Consultando ativos…</span>
                    )}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={form.beneficiariosEsperados}
                    onChange={(e) => set("beneficiariosEsperados", e.target.value)}
                    placeholder="Total previsto"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Preenchido automaticamente com base nas matrículas ativas do núcleo.
                  </p>
                </div>

                {/* Professor presente: Radio Buttons */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Professor presente? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => set("professorPresente", "true")}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        form.professorPresente === "true"
                          ? "border-green-500 bg-green-50 text-green-700 shadow-xs"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                      Sim, presente
                    </button>
                    <button
                      type="button"
                      onClick={() => set("professorPresente", "false")}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        form.professorPresente === "false"
                          ? "border-red-500 bg-red-50 text-red-700 shadow-xs"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <X className="h-4 w-4 text-red-500" />
                      Não, ausente
                    </button>
                  </div>
                </div>

                {/* Grade cumprida: Radio Buttons */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Grade de horários cumprida? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => set("gradeCumprida", "true")}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        form.gradeCumprida === "true"
                          ? "border-green-500 bg-green-50 text-green-700 shadow-xs"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                      Sim, cumprida
                    </button>
                    <button
                      type="button"
                      onClick={() => set("gradeCumprida", "false")}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        form.gradeCumprida === "false"
                          ? "border-amber-500 bg-amber-50 text-amber-700 shadow-xs"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      <X className="h-4 w-4 text-amber-600" />
                      Não cumprida / Divergente
                    </button>
                  </div>
                </div>

                {/* Observações da grade (Obrigatório se grade cumprida for Não) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Observações da grade de horários {form.gradeCumprida === "false" && <span className="text-red-500">* (Obrigatório justificar)</span>}
                  </label>
                  <Textarea
                    value={form.gradeObservacoes}
                    onChange={(e) => set("gradeObservacoes", e.target.value)}
                    placeholder={
                      form.gradeCumprida === "false"
                        ? "Descreva o motivo do não cumprimento da grade (atraso, ausência, chuva, etc.)…"
                        : "Observações adicionais sobre o horário e cumprimento da grade (opcional)…"
                    }
                    rows={2}
                    className={form.gradeCumprida === "false" && !form.gradeObservacoes.trim() ? "border-amber-400 focus:ring-amber-500" : ""}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Avaliação */}
          {step === "avaliacao" && (
            <div className="flex flex-col gap-6">
              {/* Estrutura física - NÃO É OPCIONAL */}
              <div className="flex flex-col gap-3 border-b border-zinc-100 pb-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-800">
                    Estrutura física do local <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">Avaliação e descrição obrigatórias</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVALIACAO_OPTS.map((opt) => {
                    const selected = form.estruturaAvaliacao === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("estruturaAvaliacao", opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selected
                            ? "border-sky-500 bg-sky-50 text-sky-700"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <Textarea
                  value={form.estruturaObservacoes}
                  onChange={(e) => set("estruturaObservacoes", e.target.value)}
                  placeholder="Descreva as condições da estrutura (gramado, traves, alambrado, vestiário, iluminação)… *"
                  rows={2}
                  required
                />
              </div>

              {/* Materiais disponíveis */}
              <div className="flex flex-col gap-3 border-b border-zinc-100 pb-5">
                <span className="text-sm font-semibold text-zinc-800">Materiais esportivos disponíveis</span>
                <div className="flex flex-wrap gap-2">
                  {AVALIACAO_OPTS.map((opt) => {
                    const selected = form.materiaisAvaliacao === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("materiaisAvaliacao", opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selected
                            ? "border-sky-500 bg-sky-50 text-sky-700"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <Textarea
                  value={form.materiaisObservacoes}
                  onChange={(e) => set("materiaisObservacoes", e.target.value)}
                  placeholder="Observações sobre bolas, cones, coletes, etc. (opcional)"
                  rows={2}
                />
              </div>

              {/* Uniformes */}
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-zinc-800">Uso e estado dos uniformes</span>
                <div className="flex flex-wrap gap-2">
                  {AVALIACAO_OPTS.map((opt) => {
                    const selected = form.uniformesAvaliacao === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("uniformesAvaliacao", opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selected
                            ? "border-sky-500 bg-sky-50 text-sky-700"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <Textarea
                  value={form.uniformesObservacoes}
                  onChange={(e) => set("uniformesObservacoes", e.target.value)}
                  placeholder="Observações sobre o uso de uniforme pelos alunos (opcional)"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 4: Observações e Campos Oficiais do Relatório */}
          {step === "observacoes" && (
            <div className="flex flex-col gap-6">

              {/* 1. Atividade acompanhada */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                    Atividade acompanhada na aula
                  </label>
                  <span className="text-[11px] text-zinc-400">Sugestões rápidas:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Treinamento de fundamentos técnicos (passe, drible, condução)",
                    "Treinamento tático e posicionamento em campo",
                    "Jogo coletivo e dinâmica de jogo reduzido",
                    "Circuito de agilidade e coordenação motora",
                    "Aquecimento e finalizações a gol",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => set("atividadeDesenvolvida", chip)}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-sky-50 hover:border-sky-300 text-zinc-700 transition-colors cursor-pointer text-left"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={form.atividadeDesenvolvida}
                  onChange={(e) => set("atividadeDesenvolvida", e.target.value)}
                  placeholder="Descreva o conteúdo técnico ou atividade realizada nesta aula…"
                  rows={2}
                />
              </div>

              {/* 2. Orientações repassadas ao professor */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                    Orientações repassadas ao professor
                  </label>
                  <span className="text-[11px] text-zinc-400">Sugestões rápidas:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Reforçado o controle e zelo da chamada de presença e materiais.",
                    "Cobrado o uso do uniforme completo por todos os beneficiários.",
                    "Orientado sobre pontualidade e cumprimento rigoroso da grade de horários.",
                    "Atividades dentro do padrão pedagógico, sem ressalvas.",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => set("orientacoesProfessor", chip)}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-sky-50 hover:border-sky-300 text-zinc-700 transition-colors cursor-pointer text-left"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={form.orientacoesProfessor}
                  onChange={(e) => set("orientacoesProfessor", e.target.value)}
                  placeholder="Orientações e recomendações passadas ao instrutor durante a visita…"
                  rows={2}
                />
              </div>

              {/* 3. Providências necessárias */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                    Providências necessárias da visita
                  </label>
                  <span className="text-[11px] text-zinc-400">Sugestões rápidas:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Acompanhamento de rotina mantido. Nenhuma providência imediata.",
                    "Solicitado reforço na reposição de materiais esportivos (bolas/coletes).",
                    "Necessário reparo na infraestrutura (redes, traves ou iluminação).",
                    "Acionada a coordenação geral para intervenção administrativa.",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => set("providenciasNecessarias", chip)}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-sky-50 hover:border-sky-300 text-zinc-700 transition-colors cursor-pointer text-left"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={form.providenciasNecessarias}
                  onChange={(e) => set("providenciasNecessarias", e.target.value)}
                  placeholder="Encaminhamentos e providências geradas a partir desta supervisão…"
                  rows={2}
                />
              </div>

              {/* 4. Observações gerais da visita */}
              <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-4">
                <label className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                  Observações gerais da visita
                </label>
                <Textarea
                  value={form.observacoesGerais}
                  onChange={(e) => set("observacoesGerais", e.target.value)}
                  placeholder="Observações adicionais ou notas gerais da visita…"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 mt-2">
            <button
              type="button"
              onClick={voltar}
              disabled={idx === 0}
              className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 cursor-pointer transition-colors"
            >
              Voltar
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => salvar(false)}
                disabled={salvando}
                className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
              >
                Salvar rascunho
              </button>
              {isLast ? (
                <button
                  type="button"
                  onClick={() => salvar(true)}
                  disabled={salvando}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {salvando ? "Finalizando…" : "Finalizar supervisão"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={avancar}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 cursor-pointer transition-colors"
                >
                  Próximo
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
