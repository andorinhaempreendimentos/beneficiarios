"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Card, PageHeader, Field, Input, Select, Textarea, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { supervisoesApi, type SupervisaoApi, type AvaliacaoNivel } from "@/lib/api/services";

const AVALIACAO_OPTS: { value: AvaliacaoNivel; label: string }[] = [
  { value: "otima", label: "Ótima" },
  { value: "boa", label: "Boa" },
  { value: "regular", label: "Regular" },
  { value: "ruim", label: "Ruim" },
  { value: "critica", label: "Crítica" },
];

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
      observacoesGerais: sup.observacoesGerais ?? "",
    });
  }, [sup]);

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
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
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">Presenças</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Hora de saída">
                <Input type="time" value={form.horaSaida} onChange={(e) => set("horaSaida", e.target.value)} />
              </Field>
              <Field label="Beneficiários presentes">
                <Input type="number" min={0} value={form.beneficiariosPresentes} onChange={(e) => set("beneficiariosPresentes", e.target.value)} />
              </Field>
              <Field label="Beneficiários esperados">
                <Input type="number" min={0} value={form.beneficiariosEsperados} onChange={(e) => set("beneficiariosEsperados", e.target.value)} />
              </Field>
              <Field label="Professor presente">
                <Select value={form.professorPresente} onChange={(e) => set("professorPresente", e.target.value)}>
                  <option value="">Não informado</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </Select>
              </Field>
              <Field label="Grade cumprida">
                <Select value={form.gradeCumprida} onChange={(e) => set("gradeCumprida", e.target.value)}>
                  <option value="">Não informado</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </Select>
              </Field>
              <Field label="Obs. da grade" className="md:col-span-2">
                <Textarea value={form.gradeObservacoes} onChange={(e) => set("gradeObservacoes", e.target.value)} rows={2} />
              </Field>
            </div>
          </div>

          {/* Avaliações */}
          <div className="border-t border-zinc-100 pt-5">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">Avaliações</h3>
            <div className="flex flex-col gap-5">
              {[
                { campo: "estrutura", label: "Estrutura física" },
                { campo: "materiais", label: "Materiais" },
                { campo: "uniformes", label: "Uniformes" },
              ].map(({ campo, label }) => (
                <div key={campo} className="flex flex-col gap-3">
                  <span className="text-sm font-medium text-zinc-600">{label}</span>
                  <div className="flex flex-wrap gap-2">
                    {AVALIACAO_OPTS.map((opt) => {
                      const selected = (form as any)[`${campo}Avaliacao`] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set(`${campo}Avaliacao`, opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            selected ? "border-sky-500 bg-sky-50 text-sky-700" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <Textarea value={(form as any)[`${campo}Observacoes`]} onChange={(e) => set(`${campo}Observacoes`, e.target.value)} placeholder="Observações…" rows={2} />
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="border-t border-zinc-100 pt-5">
            <Field label="Observações gerais">
              <Textarea value={form.observacoesGerais} onChange={(e) => set("observacoesGerais", e.target.value)} rows={4} />
            </Field>
          </div>

          <div className="flex gap-3 pt-2 border-t border-zinc-100">
            <button type="submit" disabled={salvando}
              className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer">
              {salvando ? "Salvando…" : "Salvar alterações"}
            </button>
            <button type="button" onClick={() => router.push(`/supervisoes/${id}`)}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-sm font-semibold hover:bg-zinc-50 cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
