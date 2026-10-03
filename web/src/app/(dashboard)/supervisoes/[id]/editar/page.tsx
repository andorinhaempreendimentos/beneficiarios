"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Field, Input, Select, Textarea, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { supervisoesApi, type SupervisaoApi, type AvaliacaoNivel } from "@/lib/api/services";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const AVALIACAO_OPTS: { value: AvaliacaoNivel; label: string }[] = [
  { value: "otima", label: "Ótima" },
  { value: "boa", label: "Boa" },
  { value: "regular", label: "Regular" },
  { value: "ruim", label: "Ruim" },
  { value: "critica", label: "Crítica" },
];

function precisaObs(val: AvaliacaoNivel | "") {
  return val === "regular" || val === "ruim" || val === "critica";
}

export default function EditarSupervisaoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);

  const { data: sup, loading } = useQuery<SupervisaoApi>(() => supervisoesApi.get(id), [id]);

  const [form, setForm] = useState({
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
    atividadeDesenvolvida: "",
    orientacoesProfessor: "",
    providenciasNecessarias: "",
    observacoesGerais: "",
  });

  useEffect(() => {
    if (!sup) return;
    setForm({
      horaSaida: sup.horaSaida ?? "",
      beneficiariosPresentes: sup.beneficiariosPresentes?.toString() ?? "",
      beneficiariosEsperados: sup.beneficiariosEsperados?.toString() ?? "",
      professorPresente: sup.professorPresente == null ? "" : String(sup.professorPresente),
      estruturaAvaliacao: sup.estruturaAvaliacao ?? "",
      estruturaObservacoes: sup.estruturaObservacoes ?? "",
      materiaisAvaliacao: sup.materiaisAvaliacao ?? "",
      materiaisObservacoes: sup.materiaisObservacoes ?? "",
      uniformesAvaliacao: sup.uniformesAvaliacao ?? "",
      uniformesObservacoes: sup.uniformesObservacoes ?? "",
      gradeCumprida: sup.gradeCumprida == null ? "" : String(sup.gradeCumprida),
      gradeObservacoes: sup.gradeObservacoes ?? "",
      atividadeDesenvolvida: (sup as any).atividadeDesenvolvida ?? "",
      orientacoesProfessor: (sup as any).orientacoesProfessor ?? "",
      providenciasNecessarias: (sup as any).providenciasNecessarias ?? "",
      observacoesGerais: sup.observacoesGerais ?? "",
    });
  }, [sup]);

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    if (precisaObs(form.estruturaAvaliacao) && !form.estruturaObservacoes.trim()) {
      toast.error("Observações da estrutura física são obrigatórias para condição regular ou inferior.");
      return;
    }

    if (precisaObs(form.materiaisAvaliacao) && !form.materiaisObservacoes.trim()) {
      toast.error("Observações dos materiais são obrigatórias para condição regular ou inferior.");
      return;
    }

    if (precisaObs(form.uniformesAvaliacao) && !form.uniformesObservacoes.trim()) {
      toast.error("Observações dos uniformes são obrigatórias para condição regular ou inferior.");
      return;
    }

    if (form.gradeCumprida === "false" && !form.gradeObservacoes.trim()) {
      toast.error("Por favor, justifique o motivo do não cumprimento da grade.");
      return;
    }

    setSalvando(true);
    try {
      await supervisoesApi.update(id, {
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
        atividadeDesenvolvida: form.atividadeDesenvolvida || null,
        orientacoesProfessor: form.orientacoesProfessor || null,
        providenciasNecessarias: form.providenciasNecessarias || null,
        observacoesGerais: form.observacoesGerais || null,
      });
      toast.success("Supervisão atualizada.");
      router.push(`/supervisoes/${id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-sm text-zinc-400">Carregando…</div>;
  if (!sup) return <div className="py-16 text-center text-sm text-zinc-400">Supervisão não encontrada.</div>;
  if (sup.status === "finalizada") {
    router.push(`/supervisoes/${id}`);
    return null;
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Editar Supervisão"
        description={`${sup.nucleo?.identificacao ?? ""} · ${sup.dataSupervisao}`}
        actions={<LinkButton href={`/supervisoes/${id}`} variant="secondary">Voltar</LinkButton>}
      />
      <Card>
        <form onSubmit={salvar} className="p-5 flex flex-col gap-6">
          {/* Presenças */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 mb-4 pb-2 border-b border-zinc-100">
              Presenças e Horários
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Hora de saída">
                <Input type="time" value={form.horaSaida} onChange={(e) => set("horaSaida", e.target.value)} />
              </Field>
              <Field label="Beneficiários presentes (em campo)">
                <Input type="number" min={0} value={form.beneficiariosPresentes} onChange={(e) => set("beneficiariosPresentes", e.target.value)} />
              </Field>
              <Field label="Beneficiários esperados (matriculados)">
                <Input type="number" min={0} value={form.beneficiariosEsperados} onChange={(e) => set("beneficiariosEsperados", e.target.value)} />
              </Field>

              {/* Professor presente */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Professor presente? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => set("professorPresente", "true")}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
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
                      "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
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

              {/* Grade cumprida */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Grade cumprida? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => set("gradeCumprida", "true")}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
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
                      "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                      form.gradeCumprida === "false"
                        ? "border-amber-500 bg-amber-50 text-amber-700 shadow-xs"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    <X className="h-4 w-4 text-amber-600" />
                    Não cumprida
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Observações da grade {form.gradeCumprida === "false" && <span className="text-red-500">* (Obrigatório justificar)</span>}
                </label>
                <Textarea
                  value={form.gradeObservacoes}
                  onChange={(e) => set("gradeObservacoes", e.target.value)}
                  placeholder={
                    form.gradeCumprida === "false"
                      ? "Descreva o motivo do não cumprimento da grade…"
                      : "Observações da grade (opcional)…"
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Avaliações */}
          <div className="border-t border-zinc-100 pt-5">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4 pb-2 border-b border-zinc-100">
              Avaliações da Visita
            </h3>
            <div className="flex flex-col gap-5">
              {/* Estrutura física */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-800">
                    Estrutura física {precisaObs(form.estruturaAvaliacao) && <span className="text-red-500">* (Obrigatório justificar)</span>}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    {precisaObs(form.estruturaAvaliacao) ? "Justificativa obrigatória" : "Opcional"}
                  </span>
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
                          selected ? "border-sky-500 bg-sky-50 text-sky-700" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
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
                  placeholder={
                    precisaObs(form.estruturaAvaliacao)
                      ? "Descreva os problemas na estrutura física… *"
                      : "Observações sobre a estrutura física (opcional)…"
                  }
                  rows={2}
                  className={precisaObs(form.estruturaAvaliacao) && !form.estruturaObservacoes.trim() ? "border-amber-400 focus:ring-amber-500" : ""}
                />
              </div>

              {/* Materiais */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">
                    Materiais esportivos {precisaObs(form.materiaisAvaliacao) && <span className="text-red-500">* (Obrigatório justificar)</span>}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    {precisaObs(form.materiaisAvaliacao) ? "Justificativa obrigatória" : "Opcional"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVALIACAO_OPTS.map((opt) => {
                    const selected = form.materiaisAvaliacao === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("materiaisAvaliacao", opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selected ? "border-sky-500 bg-sky-50 text-sky-700" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
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
                  placeholder={
                    precisaObs(form.materiaisAvaliacao)
                      ? "Descreva as faltas ou avarias nos materiais esportivos… *"
                      : "Observações sobre materiais (opcional)…"
                  }
                  rows={2}
                  className={precisaObs(form.materiaisAvaliacao) && !form.materiaisObservacoes.trim() ? "border-amber-400 focus:ring-amber-500" : ""}
                />
              </div>

              {/* Uniformes */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">
                    Uniformes {precisaObs(form.uniformesAvaliacao) && <span className="text-red-500">* (Obrigatório justificar)</span>}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    {precisaObs(form.uniformesAvaliacao) ? "Justificativa obrigatória" : "Opcional"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVALIACAO_OPTS.map((opt) => {
                    const selected = form.uniformesAvaliacao === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("uniformesAvaliacao", opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selected ? "border-sky-500 bg-sky-50 text-sky-700" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
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
                  placeholder={
                    precisaObs(form.uniformesAvaliacao)
                      ? "Descreva os problemas observados no uso ou estado dos uniformes… *"
                      : "Observações sobre uniformes (opcional)…"
                  }
                  rows={2}
                  className={precisaObs(form.uniformesAvaliacao) && !form.uniformesObservacoes.trim() ? "border-amber-400 focus:ring-amber-500" : ""}
                />
              </div>
            </div>
          </div>

          {/* Novos Campos: Atividade, Orientações, Providências */}
          <div className="border-t border-zinc-100 pt-5 flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-zinc-800 pb-2 border-b border-zinc-100">
              Registros Oficiais do Relatório
            </h3>

            {/* Atividade desenvolvida */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-800 uppercase">
                Atividade acompanhada na aula
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Treinamento de fundamentos técnicos (passe, drible, condução)",
                  "Treinamento tático e posicionamento em campo",
                  "Jogo coletivo e dinâmica de jogo reduzido",
                  "Circuito de agilidade e coordenação motora",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => set("atividadeDesenvolvida", chip)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-sky-50 text-zinc-700 cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <Textarea
                value={form.atividadeDesenvolvida}
                onChange={(e) => set("atividadeDesenvolvida", e.target.value)}
                placeholder="Conteúdo técnico acompanhado…"
                rows={2}
              />
            </div>

            {/* Orientações ao professor */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-800 uppercase">
                Orientações repassadas ao professor
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Reforçado o controle e zelo da chamada de presença e materiais.",
                  "Cobrado o uso do uniforme completo por todos os beneficiários.",
                  "Orientado sobre pontualidade e cumprimento da grade.",
                  "Atividades dentro do padrão pedagógico, sem ressalvas.",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => set("orientacoesProfessor", chip)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-sky-50 text-zinc-700 cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <Textarea
                value={form.orientacoesProfessor}
                onChange={(e) => set("orientacoesProfessor", e.target.value)}
                placeholder="Orientações e encaminhamentos ao instrutor…"
                rows={2}
              />
            </div>

            {/* Providências necessárias */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-800 uppercase">
                Providências necessárias da visita
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Acompanhamento de rotina mantido. Nenhuma providência imediata.",
                  "Solicitado reforço na reposição de materiais esportivos.",
                  "Necessário reparo na infraestrutura do campo/quadra.",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => set("providenciasNecessarias", chip)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-sky-50 text-zinc-700 cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <Textarea
                value={form.providenciasNecessarias}
                onChange={(e) => set("providenciasNecessarias", e.target.value)}
                placeholder="Providências necessárias…"
                rows={2}
              />
            </div>

            {/* Observações gerais */}
            <Field label="Observações gerais da visita">
              <Textarea
                value={form.observacoesGerais}
                onChange={(e) => set("observacoesGerais", e.target.value)}
                rows={3}
                placeholder="Notas adicionais…"
              />
            </Field>
          </div>

          <div className="flex gap-3 pt-2 border-t border-zinc-100">
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {salvando ? "Salvando…" : "Salvar alterações"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/supervisoes/${id}`)}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
