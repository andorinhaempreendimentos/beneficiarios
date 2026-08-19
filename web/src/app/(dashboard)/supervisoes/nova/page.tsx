"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Field, Input, Select, Textarea, LinkButton, Badge } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  supervisoesApi,
  nucleosApi,
  funcionariosApi,
  type NucleoApi,
  type FuncionarioApi,
  type Paginated,
  type AvaliacaoNivel,
} from "@/lib/api/services";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import { useAuth } from "@/components/providers/AuthProvider";
import { AlertCircle } from "lucide-react";

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

const avaliacaoTone: Record<AvaliacaoNivel, string> = {
  otima: "text-green-600",
  boa: "text-sky-600",
  regular: "text-amber-600",
  ruim: "text-orange-600",
  critica: "text-red-600",
};

export default function NovaSupervisaoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isCoordenador = Boolean((user as any)?.isCoordenador);

  const [step, setStep] = useState<Step>("identificacao");
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nucleoId: "",
    coordenadorId: "",
    dataSupervisao: new Date().toISOString().slice(0, 10),
    horaEntrada: new Date().toTimeString().slice(0, 5),
    horaSaida: "",
    beneficiariosPresentes: "",
    beneficiariosEsperados: "",
    professorPresente: "",
    estruturaAvaliacao: "" as AvaliacaoNivel | "",
    estruturaObservacoes: "",
    materiaisAvaliacao: "" as AvaliacaoNivel | "",
    materiaisObservacoes: "",
    uniformesAvaliacao: "" as AvaliacaoNivel | "",
    uniformesObservacoes: "",
    gradeCumprida: "",
    gradeObservacoes: "",
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


  // Pré-preenche coordenadorId com o funcionário logado
  useEffect(() => {
    if (isCoordenador && user?.entidadeId && !form.coordenadorId) {
      setForm((f) => ({ ...f, coordenadorId: user.entidadeId! }));
    }
  }, [isCoordenador, user?.entidadeId]);

  function set(campo: string, valor: unknown) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function stepIndex() {
    return STEPS.findIndex((s) => s.key === step);
  }

  function avancar() {
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
    setSalvando(true);
    try {
      const body = {
        nucleoId: form.nucleoId,
        coordenadorId: form.coordenadorId,
        dataSupervisao: form.dataSupervisao,
        horaEntrada: form.horaEntrada,
        horaSaida: form.horaSaida || null,
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
        observacoesGerais: form.observacoesGerais || null,
      };
      const criada = await supervisoesApi.create(body);
      if (finalizar) {
        await supervisoesApi.finalizar(criada.id);
        toast.success("Supervisão finalizada.");
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

  // Coordenador sem núcleos: bloqueia acesso ao formulário
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
              onClick={() => setStep(s.key)}
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
        <div className="p-5 flex flex-col gap-5">

          {/* Step 1: Identificação */}
          {step === "identificacao" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Núcleo" required>
                  <Select value={form.nucleoId} onChange={(e) => set("nucleoId", e.target.value)} required>
                    <option value="">Selecione…</option>
                    {nucleosDisponiveis.map((n) => <option key={n.id} value={n.id}>{n.identificacao}</option>)}
                  </Select>
                </Field>
                {!isCoordenador && (
                  <Field label="Coordenador" required>
                    <Select value={form.coordenadorId} onChange={(e) => set("coordenadorId", e.target.value)} required>
                      <option value="">Selecione…</option>
                      {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nomeCompleto}</option>)}
                    </Select>
                  </Field>
                )}

                <Field label="Data" required>
                  <Input type="date" value={form.dataSupervisao} onChange={(e) => set("dataSupervisao", e.target.value)} required />
                </Field>
                <Field label="Hora de entrada" required>
                  <Input type="time" value={form.horaEntrada} onChange={(e) => set("horaEntrada", e.target.value)} required />
                </Field>
                <Field label="Hora de saída">
                  <Input type="time" value={form.horaSaida} onChange={(e) => set("horaSaida", e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {/* Step 2: Presenças */}
          {step === "presenca" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Beneficiários presentes">
                <Input type="number" min={0} value={form.beneficiariosPresentes}
                  onChange={(e) => set("beneficiariosPresentes", e.target.value)} placeholder="0" />
              </Field>
              <Field label="Beneficiários esperados">
                <Input type="number" min={0} value={form.beneficiariosEsperados}
                  onChange={(e) => set("beneficiariosEsperados", e.target.value)} placeholder="0" />
              </Field>
              <Field label="Professor presente?">
                <Select value={form.professorPresente} onChange={(e) => set("professorPresente", e.target.value)}>
                  <option value="">Não informado</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </Select>
              </Field>
              <Field label="Grade cumprida?">
                <Select value={form.gradeCumprida} onChange={(e) => set("gradeCumprida", e.target.value)}>
                  <option value="">Não informado</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </Select>
              </Field>
              <Field label="Observações da grade" className="md:col-span-2">
                <Textarea value={form.gradeObservacoes} onChange={(e) => set("gradeObservacoes", e.target.value)} rows={2} />
              </Field>
            </div>
          )}

          {/* Step 3: Avaliação */}
          {step === "avaliacao" && (
            <div className="flex flex-col gap-6">
              {[
                { campo: "estrutura", label: "Estrutura física" },
                { campo: "materiais", label: "Materiais disponíveis" },
                { campo: "uniformes", label: "Uniformes" },
              ].map(({ campo, label }) => (
                <div key={campo} className="flex flex-col gap-3 border-b border-zinc-100 pb-5 last:border-0">
                  <span className="text-sm font-semibold text-zinc-700">{label}</span>
                  <div className="flex flex-wrap gap-2">
                    {AVALIACAO_OPTS.map((opt) => {
                      const selected = (form as any)[`${campo}Avaliacao`] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set(`${campo}Avaliacao`, opt.value)}
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
                    value={(form as any)[`${campo}Observacoes`]}
                    onChange={(e) => set(`${campo}Observacoes`, e.target.value)}
                    placeholder="Observações (opcional)"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Observações finais */}
          {step === "observacoes" && (
            <Field label="Observações gerais">
              <Textarea
                value={form.observacoesGerais}
                onChange={(e) => set("observacoesGerais", e.target.value)}
                placeholder="Observações gerais da visita…"
                rows={6}
              />
            </Field>
          )}

          {/* Navegação */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-2">
            <button
              type="button"
              onClick={voltar}
              disabled={idx === 0}
              className="px-4 py-2 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 cursor-pointer transition-colors"
            >
              Voltar
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => salvar(false)}
                disabled={salvando}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
              >
                Salvar rascunho
              </button>
              {isLast ? (
                <button
                  type="button"
                  onClick={() => salvar(true)}
                  disabled={salvando}
                  className="px-5 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {salvando ? "Salvando…" : "Finalizar supervisão"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={avancar}
                  className="px-5 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 cursor-pointer transition-colors"
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
