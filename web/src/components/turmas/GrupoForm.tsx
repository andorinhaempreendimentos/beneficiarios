"use client";

import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { Button, Field, FormSection, Input, LinkButton, Select, Switch } from "@/components/ui";
import { GradeSemanal } from "./GradeSemanal";
import {
  turmasApi,
  funcionariosApi,
  FUNCAO_PROFESSOR_ID,
  type TurmaApi,
  type NucleoApi,
  type AtividadeApi,
  type FuncionarioApi,
} from "@/lib/api/services";
import { useToast } from "@/components/providers/ToastProvider";

const OPCOES_IDADE = Array.from({ length: 27 }, (_, i) => i + 4); // 4 a 30 anos

const OPCOES_IDENTIFICADOR = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z",
];

function extrairIdentificador(nome?: string): string | null {
  if (!nome) return null;
  const mGrupo = nome.match(/(?:Grupo|Turma)\s+([A-Z0-9]{1,2})\b/i);
  if (mGrupo) return mGrupo[1].toUpperCase();
  const mFinal = nome.trim().match(/\b([A-Z]{1,2}|\d{1,2})$/i);
  if (mFinal) return mFinal[1].toUpperCase();
  return null;
}

const grupoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  nucleoId: z.string().min(1, "Selecione um núcleo."),
  atividadeId: z.string().optional().nullable(),
  vagasTotais: z.number().min(0, "Vagas inválidas."),
  idadeMinima: z.number().nullable().optional(),
  idadeMaxima: z.number().nullable().optional(),
}).refine(
  (d) => {
    if (d.idadeMinima != null && d.idadeMaxima != null) {
      return d.idadeMinima <= d.idadeMaxima;
    }
    return true;
  },
  {
    message: "Idade mínima não pode ser maior que idade máxima.",
    path: ["idadeMinima"],
  }
);

type FieldErrors = Partial<Record<string, string>>;

export interface GrupoFormProps {
  turma?: TurmaApi;
  nucleos?: NucleoApi[];
  atividades?: AtividadeApi[];
  funcionarios?: FuncionarioApi[];
  backHref: string;
}

export function GrupoForm({
  turma: t,
  nucleos = [],
  atividades = [],
  funcionarios: initialFuncionarios = [],
  backHref,
}: GrupoFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [tipo, setTipo] = useState<"regular" | "operacional">(t?.tipo ?? "regular");
  const [nome, setNome] = useState(t?.nome ?? "");
  const [identificador, setIdentificador] = useState<string>(
    t?.identificador || extrairIdentificador(t?.nome) || "A"
  );
  const [exclusiva, setExclusiva] = useState(t?.exclusiva ?? false);
  const [nucleoId, setNucleoId] = useState(t?.nucleoId ?? "");
  const [atividadeId, setAtividadeId] = useState(t?.atividadeId ?? "");
  const [idadeMinima, setIdadeMinima] = useState<number>(t?.idadeMinima ?? 6);
  const [idadeMaxima, setIdadeMaxima] = useState<number>(t?.idadeMaxima ?? 17);
  const [slots, setSlots] = useState<any[]>(t?.slots ?? []);
  const [permitirFilaEspera, setPermitirFilaEspera] = useState(t?.permitirFilaEspera ?? true);
  const [responsaveisIds, setResponsaveisIds] = useState<string[]>(t?.responsaveis ?? []);
  const [listaFuncionarios, setListaFuncionarios] = useState<FuncionarioApi[]>(initialFuncionarios);
  const [todasTurmas, setTodasTurmas] = useState<TurmaApi[]>([]);

  useEffect(() => {
    if (initialFuncionarios.length === 0) {
      funcionariosApi
        .list({ limit: 500 })
        .then((res) => setListaFuncionarios(res.data))
        .catch(() => {});
    } else {
      setListaFuncionarios(initialFuncionarios);
    }
    turmasApi
      .list({ limit: 500 })
      .then((res) => setTodasTurmas(res.data))
      .catch(() => {});
  }, [initialFuncionarios]);

  const nucleoSelecionado = nucleos.find((n) => n.id === nucleoId);

  // Atividades autorizadas no núcleo selecionado
  const atividadesParaTurma = useMemo(() => {
    if (!nucleoSelecionado) return atividades;
    if (!nucleoSelecionado.atividadeIds || nucleoSelecionado.atividadeIds.length === 0) {
      return atividades;
    }
    return atividades.filter(
      (a) =>
        !a.disponivelPreInscricao || // Controle interno sempre visível
        nucleoSelecionado.atividadeIds?.includes(a.id)
    );
  }, [nucleoSelecionado, atividades]);

  const atividadeSelecionada = atividades.find((a) => a.id === atividadeId);
  const termoGrupo = atividadeSelecionada?.termoGrupo || "Grupo";
  const termoSessao = atividadeSelecionada?.termoSessao || "Sessão";
  const termoResponsavel = atividadeSelecionada?.termoResponsavel || "Responsável";
  const termoParticipante = atividadeSelecionada?.termoParticipante || "Aluno";

  // Identificadores (A, B, C...) já ocupados por grupos dentro do mesmo núcleo
  const identificadoresOcupados = useMemo(() => {
    if (!nucleoId) return new Set<string>();
    const ocupados = new Set<string>();
    todasTurmas.forEach((turma) => {
      if (turma.id === t?.id) return;
      if (turma.nucleoId === nucleoId) {
        const idt = extrairIdentificador(turma.nome);
        if (idt) ocupados.add(idt);
      }
    });
    return ocupados;
  }, [nucleoId, todasTurmas, t?.id]);

  // Se o identificador atual estiver ocupado neste núcleo, seleciona a primeira letra livre
  useEffect(() => {
    if (tipo !== "regular") return;
    if (identificadoresOcupados.has(identificador)) {
      const primeiraLivre = OPCOES_IDENTIFICADOR.find((letra) => !identificadoresOcupados.has(letra));
      if (primeiraLivre) {
        setIdentificador(primeiraLivre);
      }
    }
  }, [identificadoresOcupados, identificador, tipo]);

  // Gerador estável do nome oficial: [Núcleo] - Grupo [Letra]
  const nomeOficial = useMemo(() => {
    const nNome = nucleoSelecionado?.identificacao || "Núcleo";
    if (tipo === "operacional") {
      return `${nNome} - Planejamento`;
    }
    return `${nNome} - Grupo ${identificador || "A"}`;
  }, [nucleoSelecionado, tipo, identificador]);

  // Detecção de nome legado fora do padrão oficial
  const isNomeLegado = useMemo(() => {
    if (!t?.id || !t?.nome) return false;
    return t.nome !== nomeOficial;
  }, [t?.id, t?.nome, nomeOficial]);

  const [padronizadoManualmente, setPadronizadoManualmente] = useState(false);

  // Nome efetivo (mantém legado apenas se o usuário ainda não tiver optado por padronizar)
  const nomeEfetivo = useMemo(() => {
    if (isNomeLegado && !padronizadoManualmente) {
      return t?.nome || nomeOficial;
    }
    return nomeOficial;
  }, [isNomeLegado, padronizadoManualmente, t?.nome, nomeOficial]);

  // Prévia visual adaptada pelo termo da atividade
  const nomeAdaptadoPreview = useMemo(() => {
    const nNome = nucleoSelecionado?.identificacao || "Núcleo";
    if (tipo === "operacional") return null;
    if (termoGrupo && termoGrupo !== "Grupo") {
      return `${nNome} - ${termoGrupo} ${identificador || "A"}`;
    }
    return null;
  }, [nucleoSelecionado, tipo, termoGrupo, identificador]);

  // Atualiza estado interno de nome
  useEffect(() => {
    setNome(nomeEfetivo);
  }, [nomeEfetivo]);

  function handleNucleoChange(novoNucleoId: string) {
    setNucleoId(novoNucleoId);
    const novoNucleo = nucleos.find((n) => n.id === novoNucleoId);
    if (novoNucleo && novoNucleo.atividadeIds && atividadeId) {
      if (!novoNucleo.atividadeIds.includes(atividadeId)) {
        setAtividadeId("");
      }
    }
  }

  // Professores/instrutores cadastrados
  const professoresDisponiveis = listaFuncionarios.filter((f) => {
    return f.professorResponsavel || f.funcaoId === FUNCAO_PROFESSOR_ID;
  });

  // Conflitos de horário
  const conflitosAgenda = useMemo(() => {
    if (responsaveisIds.length === 0 || slots.length === 0) return [];
    const conflitos: {
      professorNome: string;
      turmaConflitoNome: string;
      dia: string;
      inicio: number;
      fim: number;
      outroInicio: number;
      outroFim: number;
    }[] = [];

    const outrasTurmas = todasTurmas.filter((item) => item.id !== t?.id);

    responsaveisIds.forEach((fId) => {
      const func = listaFuncionarios.find((f) => f.id === fId);
      const profNome = func?.nomeCompleto || "Professor";

      const turmasDoProfessor = outrasTurmas.filter((outra) =>
        (outra.responsaveis ?? []).includes(fId)
      );

      turmasDoProfessor.forEach((outra) => {
        (outra.slots ?? []).forEach((outroSlot) => {
          slots.forEach((meuSlot) => {
            if (meuSlot.dia === outroSlot.dia) {
              const sobreposicao =
                Math.max(meuSlot.inicio, outroSlot.inicio) <
                Math.min(meuSlot.fim, outroSlot.fim);

              if (sobreposicao) {
                conflitos.push({
                  professorNome: profNome,
                  turmaConflitoNome: outra.nome,
                  dia: meuSlot.dia,
                  inicio: meuSlot.inicio,
                  fim: meuSlot.fim,
                  outroInicio: outroSlot.inicio,
                  outroFim: outroSlot.fim,
                });
              }
            }
          });
        });
      });
    });

    return conflitos;
  }, [responsaveisIds, slots, todasTurmas, listaFuncionarios, t?.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);

    if (tipo === "regular" && identificadoresOcupados.has(identificador)) {
      const msg = `O Grupo ${identificador} já está cadastrado neste núcleo. Escolha outro identificador.`;
      setErro(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    if (conflitosAgenda.length > 0) {
      const c = conflitosAgenda[0];
      const msg = `Conflito de agenda: o profissional ${c.professorNome} já possui sessão na "${c.turmaConflitoNome}" (${c.dia} das ${c.outroInicio}h às ${c.outroFim}h).`;
      setErro(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const nId = (formData.get("nucleoId") as string) || nucleoId;
    const aId = (formData.get("atividadeId") as string) || atividadeId || null;

    const data = {
      nome: ((formData.get("nome") as string) || nome || "").trim(),
      tipo,
      identificador: tipo === "regular" ? identificador : null,
      nucleoId: nId,
      atividadeId: aId || null,
      idadeMinima: tipo === "regular" ? idadeMinima : null,
      idadeMaxima: tipo === "regular" ? idadeMaxima : null,
      faixaEtariaId: null,
      categoriaId: null,
      vagasTotais: tipo === "operacional" ? 0 : Number(formData.get("vagasTotais") || 30),
      permitirFilaEspera: tipo === "operacional" ? false : permitirFilaEspera,
      exclusiva,
      statusInicial: (formData.get("statusInicial") as any) || "aprovada",
      dataInicio: (formData.get("dataInicio") as string) || null,
      dataFim: (formData.get("dataFim") as string) || null,
    };

    const validation = grupoSchema.safeParse(data);
    if (!validation.success) {
      const errs: FieldErrors = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      setLoading(false);
      return;
    }
    setFieldErrors({});

    try {
      let savedTurma: TurmaApi;
      if (t?.id) {
        savedTurma = await turmasApi.update(t.id, data);
        toast.success(`${termoGrupo} atualizado(a) com sucesso!`);
      } else {
        savedTurma = await turmasApi.create(data);
        toast.success(`${termoGrupo} cadastrado(a) com sucesso!`);
      }
      await turmasApi.setResponsaveis(savedTurma.id, responsaveisIds);
      await turmasApi.setHorarios(savedTurma.id, slots);
      window.location.href = backHref;
    } catch (err: any) {
      const msg = err.message || `Erro ao salvar ${termoGrupo.toLowerCase()}.`;
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
      <FormSection title={`Dados do ${termoGrupo}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={`Tipo do ${termoGrupo}`} required>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as "regular" | "operacional")}>
              <option value="regular">Regular (com {termoParticipante.toLowerCase()}s)</option>
              <option value="operacional">Operacional (Planejamento / Reunião interna)</option>
            </Select>
          </Field>

          <Field label="Núcleo" required error={fieldErrors.nucleoId}>
            <Select name="nucleoId" value={nucleoId} onChange={(e) => handleNucleoChange(e.target.value)}>
              <option value="" disabled>Selecione o núcleo</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>

          <Field
            label="Atividade Principal (Opcional)"
            hint="A grade semanal de sessões poderá incluir múltiplas atividades"
            error={fieldErrors.atividadeId}
          >
            <Select
              name="atividadeId"
              value={atividadeId}
              onChange={(e) => setAtividadeId(e.target.value)}
              disabled={!nucleoId}
            >
              <option value="">{nucleoId ? "Nenhuma / Múltiplas atividades na grade" : "Selecione primeiro o núcleo"}</option>
              {atividadesParaTurma.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.termoGrupo || "Grupo"} • {a.termoSessao || "Treino"}) {!a.disponivelPreInscricao ? "[Interno]" : ""}
                </option>
              ))}
            </Select>
          </Field>

          {tipo === "regular" && (
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Idade Mínima" required hint="Idade mínima permitida" error={fieldErrors.idadeMinima}>
                <Select
                  value={idadeMinima}
                  onChange={(e) => {
                    const novaMin = Number(e.target.value);
                    setIdadeMinima(novaMin);
                    if (idadeMaxima < novaMin) {
                      setIdadeMaxima(novaMin);
                    }
                  }}
                >
                  {OPCOES_IDADE.map((idade) => (
                    <option key={idade} value={idade}>
                      {idade} anos
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Idade Máxima" required hint="Idade máxima permitida" error={fieldErrors.idadeMaxima}>
                <Select
                  value={idadeMaxima}
                  onChange={(e) => setIdadeMaxima(Number(e.target.value))}
                >
                  {OPCOES_IDADE.filter((idade) => idade >= idadeMinima).map((idade) => (
                    <option key={idade} value={idade}>
                      {idade} anos
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {tipo === "regular" && (
            <div className="sm:col-span-2">
              <Field
                label={`Identificador do ${termoGrupo}`}
                required
                hint={
                  !nucleoId
                    ? "Selecione primeiro o núcleo para verificar as letras disponíveis"
                    : identificadoresOcupados.size > 0
                    ? `Letras já em uso neste núcleo: ${Array.from(identificadoresOcupados).sort().join(", ")}`
                    : "Identificador estável do grupo (Grupo A, B, C...)"
                }
              >
                <Select
                  value={identificador}
                  onChange={(e) => {
                    setIdentificador(e.target.value);
                  }}
                  disabled={!nucleoId}
                >
                  {OPCOES_IDENTIFICADOR.map((letra) => {
                    const ocupado = identificadoresOcupados.has(letra);
                    return (
                      <option key={letra} value={letra} disabled={ocupado}>
                        Grupo {letra} {termoGrupo !== "Grupo" ? `(${termoGrupo} ${letra})` : ""} {ocupado ? "— (Já cadastrado)" : ""}
                      </option>
                    );
                  })}
                </Select>
              </Field>
            </div>
          )}

          <div className="sm:col-span-2">
            <Field
              label={`Nome do ${termoGrupo}`}
              required
              error={fieldErrors.nome}
              hint="Nome estruturado e imutável gerado automaticamente pelo Núcleo e Identificador"
            >
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Input
                    name="nome"
                    value={nomeEfetivo}
                    readOnly
                    className="bg-zinc-50 border-zinc-300 text-zinc-800 font-semibold cursor-not-allowed select-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs">
                    <span className="rounded bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      Imutável
                    </span>
                  </div>
                </div>

                {nomeAdaptadoPreview && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
                    <span className="font-semibold">Exibição adaptada na interface ({termoGrupo}):</span>
                    <span className="font-bold underline">{nomeAdaptadoPreview}</span>
                  </div>
                )}

                {isNomeLegado && !padronizadoManualmente && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                    <div>
                      <span className="font-bold">Nome legado fora do padrão:</span>{" "}
                      <span className="italic font-medium">"{t?.nome}"</span>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        O padrão arquitetural atual não utiliza turno, esporte ou idade no nome do grupo.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPadronizadoManualmente(true);
                        toast.success(`Nome padronizado para: ${nomeOficial}`);
                      }}
                      className="border-amber-300 bg-white hover:bg-amber-100 text-amber-900 shrink-0 font-semibold"
                    >
                      Padronizar para {nomeOficial}
                    </Button>
                  </div>
                )}

                {isNomeLegado && padronizadoManualmente && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800">
                    <span>✓ Nome atualizado para o padrão oficial: <strong>{nomeOficial}</strong></span>
                  </div>
                )}
              </div>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label={`${termoResponsavel}(is)`}>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border border-zinc-200 rounded-xl bg-white">
                  {responsaveisIds.length === 0 ? (
                    <span className="text-xs text-zinc-400 py-1 px-1">Nenhum {termoResponsavel.toLowerCase()} selecionado</span>
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
                  <option value="">+ Selecionar {termoResponsavel.toLowerCase()} responsável</option>
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
        </div>
      </FormSection>

      <FormSection title={`Horários, Vagas e ${termoSessao}s`}>
        {tipo === "regular" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Vagas totais" required error={fieldErrors.vagasTotais}>
              <Input name="vagasTotais" type="number" defaultValue={t?.vagasTotais?.toString() || "30"} placeholder="30" />
            </Field>
            <Field label="Status inicial da inscrição" required hint={`Status que o ${termoParticipante.toLowerCase()} recebe ao se inscrever`}>
              <Select name="statusInicial" defaultValue={t?.statusInicial || "aprovada"}>
                <option value="aprovada">Aprovado automaticamente</option>
                <option value="pendente">Pendente de aprovação</option>
                <option value="reservada">Fila de espera</option>
              </Select>
            </Field>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-500 mb-2">
            Grupo do tipo <strong>Operacional</strong> não possui {termoParticipante.toLowerCase()}s nem controle de vagas.
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <Field label="Data de início">
            <Input name="dataInicio" type="date" defaultValue={t?.dataInicio} />
          </Field>
          <Field label="Data de término">
            <Input name="dataFim" type="date" defaultValue={t?.dataFim} />
          </Field>
        </div>

        {tipo === "regular" && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
            <div>
              <span className="text-sm font-semibold text-zinc-900 block">Permitir Fila de Espera ao esgotar vagas</span>
              <span className="text-xs text-zinc-500 block mt-0.5">Se ativado, quando as vagas forem preenchidas, novos inscritos entram automaticamente na fila (`reservada`).</span>
            </div>
            <Switch checked={permitirFilaEspera} onChange={setPermitirFilaEspera} />
          </div>
        )}

        {conflitosAgenda.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex flex-col gap-1.5">
            <span className="font-bold flex items-center gap-1.5 text-sm text-red-900">
              ⚠️ Choque de horário detectado para o mesmo profissional
            </span>
            {conflitosAgenda.map((c, idx) => (
              <p key={idx}>
                O profissional <strong>{c.professorNome}</strong> já possui compromisso no grupo{" "}
                <strong>{c.turmaConflitoNome}</strong> em <strong>{c.dia}</strong> das{" "}
                <strong>{c.outroInicio}h às {c.outroFim}h</strong>.
              </p>
            ))}
          </div>
        )}

        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-zinc-700">Grade semanal ({termoSessao.toLowerCase()}s)</p>
          <GradeSemanal
            atividade={atividadeSelecionada}
            atividadeNome={atividadeSelecionada?.nome}
            atividadesLocais={atividadesParaTurma}
            funcionarios={professoresDisponiveis.length > 0 ? professoresDisponiveis : listaFuncionarios}
            nucleos={nucleos}
            nucleoPadraoId={nucleoId}
            nucleoPadraoNome={nucleoSelecionado?.identificacao}
            slots={slots}
            onChange={setSlots}
          />
        </div>

        <div className="mt-4">
          <Switch
            checked={exclusiva}
            onChange={setExclusiva}
            label={`${termoGrupo} exclusivo (${termoParticipante.toLowerCase()} não pode acumular outros ${termoGrupo.toLowerCase()}s)`}
          />
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline" onClick={handleCancel}>
          Voltar / Cancelar
        </LinkButton>
        <Button type="submit" loading={loading}>
          {loading ? "Salvando..." : t ? `Salvar ${termoGrupo}` : `Cadastrar ${termoGrupo}`}
        </Button>
      </div>
    </form>
  );
}
