"use client";

import { useState, useEffect } from "react";
import { Button, Field, FormSection, Input, LinkButton, Select, Switch } from "@/components/ui";
import { GradeSemanal } from "./GradeSemanal";
import {
  turmasApi,
  funcionariosApi,
  type TurmaApi,
  type NucleoApi,
  type AtividadeApi,
  type FuncionarioApi,
} from "@/lib/api/services";

interface TurmaFormProps {
  turma?: TurmaApi;
  nucleos?: NucleoApi[];
  atividades?: AtividadeApi[];
  funcionarios?: FuncionarioApi[];
  backHref: string;
}

import { useToast } from "@/components/providers/ToastProvider";

export function TurmaForm({ turma: t, nucleos = [], atividades = [], funcionarios: initialFuncionarios = [], backHref }: TurmaFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [exclusiva, setExclusiva] = useState(t?.exclusiva ?? false);
  const [nucleoId, setNucleoId] = useState(t?.nucleoId ?? "");
  const [atividadeId, setAtividadeId] = useState(t?.atividadeId ?? "");
  const [slots, setSlots] = useState<any[]>(t?.slots ?? []);
  const [permitirFilaEspera, setPermitirFilaEspera] = useState(t?.permitirFilaEspera ?? true);
  const [responsaveisIds, setResponsaveisIds] = useState<string[]>(t?.responsaveis ?? []);
  const [listaFuncionarios, setListaFuncionarios] = useState<FuncionarioApi[]>(initialFuncionarios);
  const [todasTurmas, setTodasTurmas] = useState<TurmaApi[]>([]);

  useEffect(() => {
    if (initialFuncionarios.length === 0) {
      funcionariosApi.list({ limit: 500 }).then((res) => {
        setListaFuncionarios(res.data);
      }).catch(() => {});
    } else {
      setListaFuncionarios(initialFuncionarios);
    }
    turmasApi.list({ limit: 500 }).then((res) => {
      setTodasTurmas(res.data);
    }).catch(() => {});
  }, [initialFuncionarios]);

  // IDs de funcionários que já são responsáveis em OUTRAS turmas
  const idsResponsaveisEmOutrasTurmas = new Set<string>();
  todasTurmas.forEach((item) => {
    if (item.id !== t?.id) {
      (item.responsaveis ?? []).forEach((fId) => idsResponsaveisEmOutrasTurmas.add(fId));
    }
  });

  // Filtra apenas professores/instrutores não vinculados a outras turmas
  const professoresDisponiveis = listaFuncionarios.filter((f) => {
    const isProf =
      f.professorResponsavel ||
      f.funcao?.toLowerCase().includes("profess") ||
      f.funcao?.toLowerCase().includes("instrut") ||
      f.funcao?.toLowerCase().includes("treinad") ||
      !f.funcao;

    if (!isProf) return false;
    return !idsResponsaveisEmOutrasTurmas.has(f.id);
  });

  const nucleoSelecionado = nucleos.find((n) => n.id === nucleoId);

  // Para o seletor da Turma: atividades que pertencem ao núcleo ou são de Controle Interno
  const atividadesParaTurma = nucleoSelecionado
    ? atividades.filter(
        (a) =>
          !a.disponivelPreInscricao || // Controle interno SEMPRE disponível
          !nucleoSelecionado.atividadeIds ||
          nucleoSelecionado.atividadeIds.includes(a.id)
      )
    : atividades;

  function handleNucleoChange(novoNucleoId: string) {
    setNucleoId(novoNucleoId);
    const novoNucleo = nucleos.find((n) => n.id === novoNucleoId);
    if (novoNucleo && novoNucleo.atividadeIds) {
      if (atividadeId && !novoNucleo.atividadeIds.includes(atividadeId)) {
        setAtividadeId("");
      }
    }
  }

  const atividadeSelecionada = atividades.find((a) => a.id === atividadeId);
  const atividadeNome = atividadeSelecionada?.nome;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(event.currentTarget);
    const nId = (formData.get("nucleoId") as string) || nucleoId;
    const aId = (formData.get("atividadeId") as string) || atividadeId;

    if (!nId) {
      const msg = "Por favor, selecione um núcleo.";
      setErro(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }
    if (!aId) {
      const msg = "Por favor, selecione uma atividade.";
      setErro(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    const data = {
      nome: formData.get("nome") as string,
      nucleoId: nId,
      atividadeId: aId,
      vagasTotais: Number(formData.get("vagasTotais") || 30),
      idadeMinima: Number(formData.get("idadeMinima") || 6),
      idadeMaxima: Number(formData.get("idadeMaxima") || 17),
      permitirFilaEspera,
      exclusiva,
      statusInicial: (formData.get("statusInicial") as any) || "aprovada",
      dataInicio: (formData.get("dataInicio") as string) || null,
      dataFim: (formData.get("dataFim") as string) || null,
    };

    try {
      let savedTurma: TurmaApi;
      if (t?.id) {
        savedTurma = await turmasApi.update(t.id, data);
        toast.success("Turma atualizada com sucesso!");
      } else {
        savedTurma = await turmasApi.create(data);
        toast.success("Turma cadastrada com sucesso!");
      }
      await turmasApi.setResponsaveis(savedTurma.id, responsaveisIds);
      await turmasApi.setHorarios(savedTurma.id, slots);
      window.location.href = backHref;
    } catch (err: any) {
      const msg = err.message || "Erro ao salvar turma.";
      setErro(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    toast.info("Ação cancelada.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}
      <FormSection title="Dados da Turma">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" required>
            <Input name="nome" defaultValue={t?.nome} placeholder="Ex: Futebol Manhã A" />
          </Field>
          <Field label="Núcleo" required>
            <Select name="nucleoId" value={nucleoId} onChange={(e) => handleNucleoChange(e.target.value)}>
              <option value="" disabled>Selecione</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>
          <Field label="Atividade" required>
            <Select name="atividadeId" value={atividadeId} onChange={(e) => setAtividadeId(e.target.value)} disabled={!nucleoId}>
              <option value="" disabled>{!nucleoId ? "Selecione primeiro o núcleo" : "Selecione a atividade"}</option>
              {atividadesParaTurma.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} {!a.disponivelPreInscricao ? "(🔒 Controle Interno)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Responsável(is)">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border border-zinc-200 rounded-xl bg-white">
                {responsaveisIds.length === 0 ? (
                  <span className="text-xs text-zinc-400 py-1 px-1">Nenhum responsável selecionado</span>
                ) : (
                  responsaveisIds.map((fId) => {
                    const func = listaFuncionarios.find((f) => f.id === fId);
                    const nomeExibicao = func ? func.nomeCompleto : fId;
                    return (
                      <span key={fId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 text-xs font-semibold">
                        {nomeExibicao}
                        <button
                          type="button"
                          onClick={() => setResponsaveisIds(responsaveisIds.filter((id) => id !== fId))}
                          className="hover:text-red-600 focus:outline-none ml-1 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !responsaveisIds.includes(val)) {
                    setResponsaveisIds([...responsaveisIds, val]);
                  }
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-sky-500 focus:outline-none"
              >
                <option value="">+ Selecionar professor responsável</option>
                {professoresDisponiveis
                  .filter((f) => !responsaveisIds.includes(f.id))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nomeCompleto} {f.funcao ? `(${f.funcao})` : ""}
                    </option>
                  ))}
              </select>
            </div>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Horários e Vagas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Vagas totais" required>
            <Input name="vagasTotais" type="number" defaultValue={t?.vagasTotais?.toString() || "30"} placeholder="30" />
          </Field>
          <Field label="Idade Mínima (anos)" required hint="Ex: 6 anos">
            <Input name="idadeMinima" type="number" defaultValue={t?.idadeMinima?.toString() || "6"} placeholder="6" />
          </Field>
          <Field label="Idade Máxima (anos)" required hint="Ex: 17 anos">
            <Input name="idadeMaxima" type="number" defaultValue={t?.idadeMaxima?.toString() || "17"} placeholder="17" />
          </Field>
          <Field label="Status inicial da inscrição" required hint="Status que o beneficiário recebe ao se inscrever">
            <Select name="statusInicial" defaultValue={t?.statusInicial || "aprovada"}>
              <option value="aprovada">Aprovado automaticamente</option>
              <option value="pendente">Pendente de aprovação</option>
              <option value="reservada">Fila de espera</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <Field label="Data de início">
            <Input name="dataInicio" type="date" defaultValue={t?.dataInicio} />
          </Field>
          <Field label="Data de término">
            <Input name="dataFim" type="date" defaultValue={t?.dataFim} />
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
          <div>
            <span className="text-sm font-semibold text-zinc-900 block">Permitir Fila de Espera ao esgotar vagas</span>
            <span className="text-xs text-zinc-500 block mt-0.5">Se ativado, quando as 30 vagas forem preenchidas, novos inscritos entram automaticamente na fila (`reservada`). Se desativado, bloqueia novas inscrições.</span>
          </div>
          <Switch checked={permitirFilaEspera} onChange={setPermitirFilaEspera} />
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-zinc-700">Grade semanal</p>
          {atividadeSelecionada ? (
            <GradeSemanal
              atividade={atividadeSelecionada}
              atividadeNome={atividadeNome}
              atividadesLocais={atividades}
              slots={slots}
              onChange={setSlots}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-400">
              Selecione uma atividade para montar a grade
            </div>
          )}
        </div>

        <div className="mt-4">
          <Switch checked={exclusiva} onChange={setExclusiva} label="Turma exclusiva (beneficiário não pode acumular outras turmas)" />
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline" onClick={handleCancel}>
          Voltar / Cancelar
        </LinkButton>
        <Button type="submit" loading={loading}>
          {loading ? "Salvando..." : t ? "Salvar" : "Cadastrar Turma"}
        </Button>
      </div>
    </form>
  );
}

