"use client";

import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import {
  User,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Briefcase,
  Clock,
  CalendarCheck,
  UserCheck,
  CheckCircle2,
  GraduationCap,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Field,
  FileUpload,
  Input,
  LinkButton,
  Select,
  Switch,
} from "@/components/ui";
import type { DiaJornada } from "@/lib/types";
import { statusFuncionarioLabel } from "@/lib/status";
import {
  funcionariosApi,
  turmasApi,
  PERFIL_PROFESSOR_ID,
  FUNCAO_PROFESSOR_ID,
  type FuncionarioApi,
  type NucleoApi,
  type FuncaoApi,
  type TurmaApi,
} from "@/lib/api/services";

const DIAS_SEMANA: DiaJornada["dia"][] = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const funcionarioSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
  cpf: z.string().min(11, "CPF inválido."),
  funcaoId: z.string().min(1, "Função é obrigatória."),
});

type FieldErrors = Partial<Record<string, string>>;

interface FuncionarioFormProps {
  funcionario?: FuncionarioApi;
  nucleos?: NucleoApi[];
  funcoes?: FuncaoApi[];
  backHref: string;
}

function calcularHorasDia(entrada?: string, saida?: string): number {
  if (!entrada || !saida) return 0;
  const [hE, mE] = entrada.split(":").map(Number);
  const [hS, mS] = saida.split(":").map(Number);
  if (isNaN(hE) || isNaN(mE) || isNaN(hS) || isNaN(mS)) return 0;
  const totalMinutos = hS * 60 + mS - (hE * 60 + mE);
  if (totalMinutos <= 0) return 0;
  const horasBrutas = totalMinutos / 60;
  // Intervalo CLT: desconta 1h de almoço se jornada bruta for maior que 6h
  const horasLiquidas =
    horasBrutas > 6
      ? horasBrutas - 1
      : horasBrutas > 4
      ? horasBrutas - 0.25
      : horasBrutas;
  return Math.max(0, horasLiquidas);
}

export function FuncionarioForm({
  funcionario: f,
  nucleos = [],
  funcoes = [],
  backHref,
}: FuncionarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // 1. Cargo / Função (RH) - Começa sem pré-seleção em novos cadastros
  const [funcaoId, setFuncaoId] = useState<string>(
    f?.funcaoId ||
      funcoes.find((fn) => fn.nome === f?.funcao)?.id ||
      ""
  );

  const funcaoObj = useMemo(
    () =>
      funcoes.find((fn) => fn.id === funcaoId) ||
      funcoes.find((fn) => fn.nome === f?.funcao),
    [funcoes, funcaoId, f?.funcao]
  );
  const funcaoNome = funcaoObj?.nome || f?.funcao || "";

  // 2. Lotação e Vínculo
  const [selectedNucleoId, setSelectedNucleoId] = useState<string>(
    f?.nucleoId || (nucleos[0]?.id ?? "")
  );
  const ehEmNucleo = funcaoObj
    ? funcaoObj.tipoAlocacao === "admin_nucleo" ||
      funcaoObj.tipoAlocacao === "operacional_nucleo"
    : true;

  const exigeConselho = funcaoObj ? Boolean(funcaoObj.exigeConselho) : false;

  // Validação estrita por ID do perfil e da função
  const isProfessorCargo = Boolean(
    funcaoObj?.perfilId === PERFIL_PROFESSOR_ID ||
      funcaoObj?.id === FUNCAO_PROFESSOR_ID
  );

  const [professorResponsavel, setProfessorResponsavel] = useState<boolean>(() => {
    if (f?.professorResponsavel !== undefined) return f.professorResponsavel;
    return isProfessorCargo;
  });

  const isProfessor = Boolean(professorResponsavel || isProfessorCargo);

  // Lista de Turmas vinculadas (para Professor)
  const [todasTurmas, setTodasTurmas] = useState<TurmaApi[]>([]);
  useEffect(() => {
    turmasApi
      .list({ limit: 500 })
      .then((res) => setTodasTurmas(res.data))
      .catch(() => {});
  }, []);

  const turmasDoProfessor = useMemo(() => {
    if (!f?.id) return [];
    return todasTurmas.filter((t) => (t.responsaveis ?? []).includes(f.id));
  }, [todasTurmas, f?.id]);

  const totalHorasAulasSemanais = useMemo(() => {
    let total = 0;
    for (const t of turmasDoProfessor) {
      for (const s of t.slots || []) {
        const duracao = (s.fim ?? 0) - (s.inicio ?? 0);
        if (duracao > 0) total += duracao;
      }
    }
    return total;
  }, [turmasDoProfessor]);

  // Handler para troca de cargo com auto-toggle de professor estrito por ID
  function handleFuncaoChange(newId: string) {
    setFuncaoId(newId);
    const obj = funcoes.find((fn) => fn.id === newId);
    const ehProf =
      obj?.perfilId === PERFIL_PROFESSOR_ID ||
      obj?.id === FUNCAO_PROFESSOR_ID;
    setProfessorResponsavel(Boolean(ehProf));
  }

  // 3. Credenciais de Acesso ao Painel
  const categoriaPermiteLogin = funcaoObj ? funcaoObj.permiteLogin : false;
  const [senhaNova, setSenhaNova] = useState<string>("");
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);

  // 4. Jornada de Trabalho Contratual (Para Administrativos / Staff / Coordenação)
  const [jornada, setJornada] = useState<DiaJornada[]>(() => {
    if (f?.jornada && f.jornada.length > 0) {
      return DIAS_SEMANA.map((dia) => {
        const found = f.jornada?.find((j) => j.dia === dia);
        if (found) {
          return {
            dia,
            trabalha: true,
            entrada: found.entrada || "08:00",
            saida: found.saida || "17:00",
          };
        }
        return { dia, trabalha: false, entrada: "08:00", saida: "17:00" };
      });
    }
    // Padrão automático inicial: Seg a Sex marcados (40h)
    return DIAS_SEMANA.map((dia) => ({
      dia,
      trabalha: dia !== "Sábado" && dia !== "Domingo",
      entrada: "08:00",
      saida: "17:00",
    }));
  });

  const [entradaPadrao, setEntradaPadrao] = useState("08:00");
  const [saidaPadrao, setSaidaPadrao] = useState("17:00");

  function aplicarPreset(horas: 40 | 30 | 20) {
    if (horas === 40) {
      setEntradaPadrao("08:00");
      setSaidaPadrao("17:00");
      setJornada(
        DIAS_SEMANA.map((dia) => ({
          dia,
          trabalha: dia !== "Sábado" && dia !== "Domingo",
          entrada: "08:00",
          saida: "17:00",
        }))
      );
    } else if (horas === 30) {
      setEntradaPadrao("08:00");
      setSaidaPadrao("14:00");
      setJornada(
        DIAS_SEMANA.map((dia) => ({
          dia,
          trabalha: dia !== "Sábado" && dia !== "Domingo",
          entrada: "08:00",
          saida: "14:00",
        }))
      );
    } else if (horas === 20) {
      setEntradaPadrao("08:00");
      setSaidaPadrao("12:00");
      setJornada(
        DIAS_SEMANA.map((dia) => ({
          dia,
          trabalha: dia !== "Sábado" && dia !== "Domingo",
          entrada: "08:00",
          saida: "12:00",
        }))
      );
    }
  }

  function aplicarAosDiasAtivos() {
    setJornada((prev) =>
      prev.map((d) =>
        d.trabalha ? { ...d, entrada: entradaPadrao, saida: saidaPadrao } : d
      )
    );
  }

  function toggleDia(dia: DiaJornada["dia"], trabalha: boolean) {
    setJornada((prev) =>
      prev.map((d) => (d.dia === dia ? { ...d, trabalha } : d))
    );
  }

  function atualizarHorario(
    dia: DiaJornada["dia"],
    campo: "entrada" | "saida",
    valor: string
  ) {
    setJornada((prev) =>
      prev.map((d) => (d.dia === dia ? { ...d, [campo]: valor } : d))
    );
  }

  // Cálculos de horas semanais e média diária
  const totalHorasSemanais = useMemo(() => {
    return jornada.reduce((acc, d) => {
      if (!d.trabalha) return acc;
      return acc + calcularHorasDia(d.entrada, d.saida);
    }, 0);
  }, [jornada]);

  const diasAtivosQtd = useMemo(() => {
    return jornada.filter((d) => d.trabalha).length;
  }, [jornada]);

  const mediaDiaria = useMemo(() => {
    return diasAtivosQtd > 0 ? (totalHorasSemanais / diasAtivosQtd).toFixed(1) : "0";
  }, [totalHorasSemanais, diasAtivosQtd]);

  // 5. Dados Pessoais do Colaborador
  const [emailVal, setEmailVal] = useState<string>(f?.email || "");
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [checandoEmail, setChecandoEmail] = useState(false);

  async function handleBlurEmail() {
    if (!emailVal.trim()) {
      setErroEmail(null);
      return;
    }
    setChecandoEmail(true);
    try {
      const res = await funcionariosApi.verificarEmailUnico(emailVal, f?.id);
      if (!res.unico) {
        setErroEmail(res.mensagem || "Este e-mail já está em uso por outro cadastro.");
      } else {
        setErroEmail(null);
      }
    } catch {
      setErroEmail(null);
    } finally {
      setChecandoEmail(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (erroEmail) return;

    setLoading(true);
    setErro(null);

    const formData = new FormData(event.currentTarget);
    const nucleoObj = ehEmNucleo
      ? nucleos.find((n) => n.id === selectedNucleoId)
      : null;
    const nucleoIdFinal = ehEmNucleo ? selectedNucleoId || null : null;
    const alocadoEmFinal = nucleoObj
      ? nucleoObj.identificacao
      : "Administração";

    const data = {
      matricula:
        f?.matricula || `PROF-${Math.floor(100 + Math.random() * 900)}`,
      nomeCompleto: formData.get("nomeCompleto") as string,
      cpf: formData.get("cpf") as string,
      dataNascimento: formData.get("dataNascimento") as string,
      celular: formData.get("celular") as string,
      email: emailVal.trim(),
      funcaoId: funcaoObj?.id || f?.funcaoId || "",
      status: (formData.get("status") as string) || "ativo",
      dataAdmissao: (formData.get("dataAdmissao") as string) || null,
      dataDemissao: (formData.get("dataDemissao") as string) || null,
      conselho: (formData.get("conselho") as string) || null,
      registroConselho: (formData.get("registroConselho") as string) || null,
      nucleoId: nucleoIdFinal,
      alocadoEm: alocadoEmFinal,
      professorResponsavel,
      permitirLogin: categoriaPermiteLogin,
      senhaLogin: senhaNova.trim() || undefined,
      jornada: isProfessor ? [] : jornada,
    };

    const validation = funcionarioSchema.safeParse(data);
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
      if (f?.id) {
        await funcionariosApi.update(f.id, data);
      } else {
        await funcionariosApi.create(data);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar funcionário.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* BLOCO ÚNICO E CONTÍNUO DO FORMULÁRIO */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm flex flex-col gap-8">
        {/* 1. CARGO / FUNÇÃO (RH) */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
            <Briefcase className="h-5 w-5 text-sky-600 shrink-0" />
            <h3 className="text-base font-bold text-zinc-900">
              Cargo / Função (RH)
            </h3>
          </div>

          <div className="max-w-xl">
            <Field
              label="Selecione o Cargo / Função do Colaborador"
              required
              error={fieldErrors.funcaoId}
            >
              <Select
                name="funcaoId"
                value={funcaoId}
                onChange={(e) => handleFuncaoChange(e.target.value)}
                className="font-medium"
              >
                <option value="">-- Selecione um cargo --</option>
                {funcoes.map((fn) => (
                  <option key={fn.id} value={fn.id}>
                    {fn.nome}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {!funcaoId && (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-6 text-center">
              <p className="text-sm font-medium text-zinc-600">
                👆 Selecione o cargo acima para carregar as opções de lotação, jornada de trabalho e dados do colaborador.
              </p>
            </div>
          )}
        </div>

        {/* RESTANTE DO FORMULÁRIO CONDICIONAL AO CARGO SELECIONADO */}
        {funcaoId && (
          <>
            {/* 2. LOTAÇÃO & VÍNCULO INSTITUCIONAL */}
            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100">
                <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0" />
                <h3 className="text-base font-bold text-zinc-900">
                  Lotação & Vínculo Institucional
                </h3>
              </div>

              <div className="max-w-xl">
                {ehEmNucleo ? (
                  <Field
                    label="Núcleo de Atuação (Obrigatório para esta Função)"
                    required
                  >
                    <Select
                      value={selectedNucleoId}
                      onChange={(e) => setSelectedNucleoId(e.target.value)}
                    >
                      {nucleos.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.identificacao}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <Field label="Lotação / Alocação">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-700 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0"></span>
                      <span>Administração Geral (Sede / Sem polo fixo)</span>
                    </div>
                  </Field>
                )}
              </div>

              {exigeConselho && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Conselho" required>
                    <Select name="conselho" defaultValue={f?.conselho ?? ""}>
                      <option value="">Selecione o Conselho...</option>
                      <option value="CREFITO">CREFITO (Fisioterapia/T.O.)</option>
                      <option value="COREN">COREN (Enfermagem)</option>
                      <option value="CREF">CREF (Educação Física)</option>
                    </Select>
                  </Field>
                  <Field label="Número do Registro no Conselho" required>
                    <Input
                      name="registroConselho"
                      defaultValue={f?.registroConselho}
                      placeholder="Ex: 123456-G/TO"
                    />
                  </Field>
                </div>
              )}

              {isProfessorCargo && (
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <Switch
                    checked={professorResponsavel}
                    onChange={setProfessorResponsavel}
                    label="Professor responsável por ministrar turmas esportivas"
                  />
                </div>
              )}
            </div>

            {/* 3. ACESSO AO PAINEL (MOSTRAR APENAS SE TIVER LOGIN) */}
            {categoriaPermiteLogin && (
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-sky-600 shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-zinc-900">
                        Acesso ao Painel Permitido
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Regra vinculada ao perfil de acesso:{" "}
                        <span className="font-bold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded">
                          {funcaoNome}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-600 text-white">
                    Login Habilitado
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                  <Field label="E-mail de Login no Sistema" required>
                    <Input
                      type="email"
                      value={emailVal}
                      readOnly
                      placeholder="Preencha o e-mail nos dados pessoais abaixo"
                      className="bg-white font-mono text-xs font-semibold text-zinc-700 cursor-not-allowed"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Sincronizado automaticamente com o e-mail informado nos Dados Pessoais.
                    </p>
                  </Field>

                  <Field label="Definir Senha de Acesso">
                    <div className="relative">
                      <Input
                        type={mostrarSenha ? "text" : "password"}
                        value={senhaNova}
                        onChange={(e) => setSenhaNova(e.target.value)}
                        placeholder="••••••••"
                        className="bg-white font-mono pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                        title={mostrarSenha ? "Ocultar Senha" : "Exibir Senha"}
                      >
                        {mostrarSenha ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1">
                      <KeyRound className="h-3 w-3 text-sky-600 shrink-0" />
                      <span>
                        Deixe em branco para manter a senha padrão do perfil.
                      </span>
                    </p>
                  </Field>
                </div>
              </div>
            )}

            {/* 4. JORNADA DE TRABALHO OU GRADE DE AULAS */}
            <div className="pt-2 border-t border-zinc-100">
              {isProfessor ? (
                /* CARGA HORÁRIA E GRADE AUTOMÁTICA DE AULAS DO PROFESSOR */
                <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shrink-0">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-900">
                          Grade de Aulas & Carga Horária Semanal
                        </h3>
                        <p className="text-xs text-zinc-600">
                          Carga horária e horários gerados automaticamente a partir dos slots de turmas atribuídos a este professor.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{totalHorasAulasSemanais}h semanais de aula</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-sky-800 border border-sky-200">
                        <Layers className="h-3 w-3" />
                        <span>{turmasDoProfessor.length} turmas vinculadas</span>
                      </span>
                    </div>
                  </div>

                  {turmasDoProfessor.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-sky-200/80 bg-white">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            <th className="py-2.5 px-3">Turma</th>
                            <th className="py-2.5 px-3">Núcleo</th>
                            <th className="py-2.5 px-3">Atividade / Modalidade</th>
                            <th className="py-2.5 px-3">Slots / Horários da Grade</th>
                            <th className="py-2.5 px-3">Carga Semanal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {turmasDoProfessor.map((t) => {
                            const horasTurma = (t.slots || []).reduce(
                              (acc, s) => acc + Math.max(0, (s.fim ?? 0) - (s.inicio ?? 0)),
                              0
                            );
                            return (
                              <tr
                                key={t.id}
                                className="border-b border-zinc-100 last:border-0 hover:bg-sky-50/30 transition-colors"
                              >
                                <td className="py-2.5 px-3 font-semibold text-zinc-900">
                                  {t.nome}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-600 text-xs">
                                  {nucleos.find((n) => n.id === t.nucleoId)?.identificacao ||
                                    t.nucleo?.identificacao ||
                                    "Não informado"}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                                    {t.atividade?.nome || "Geral"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-xs text-zinc-700 font-mono">
                                  {(t.slots || []).length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {t.slots?.map((s, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold"
                                        >
                                          {s.dia} {String(s.inicio).padStart(2, "0")}:00–{String(s.fim).padStart(2, "0")}:00
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-zinc-400 italic">Sem slots cadastrados</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-sky-800 text-xs font-mono">
                                  {horasTurma}h / sem
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-sky-300 bg-white/80 p-4 text-center">
                      <p className="text-xs font-medium text-zinc-600">
                        📌 Nenhuma turma vinculada a este professor no momento.
                        Ao cadastrar ou editar turmas no módulo <strong>Turmas &gt; Grade Semanal</strong>, selecione este professor como responsável para que os horários e a carga horária sejam calculados aqui automaticamente.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* JORNADA CLT CONTRATUAL FIXA PARA CARGOS ADMINISTRATIVOS E STAFF */
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-sky-600 shrink-0" />
                      <div>
                        <h3 className="text-base font-bold text-zinc-900">
                          Jornada de Trabalho & Horários de Ponto
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Regime CLT com 4 batidas diárias (Entrada, Saída Almoço, Retorno Almoço, Saída Final).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200">
                        <CalendarCheck className="h-3.5 w-3.5" />
                        <span>{totalHorasSemanais}h semanais</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                        Média {mediaDiaria}h / dia
                      </span>
                    </div>
                  </div>

                  {/* Seleção de Presets de Carga Horária e Ferramenta em Lote */}
                  <div className="mb-4 flex flex-col gap-3 rounded-xl bg-zinc-50 p-4 border border-zinc-200">
                    <div>
                      <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-2">
                        Predefinições de Carga Semanal:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => aplicarPreset(40)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white hover:bg-sky-50 hover:border-sky-300 text-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                          <span>40h Semanais (08:00 às 17:00 • 8h/dia)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => aplicarPreset(30)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white hover:bg-sky-50 hover:border-sky-300 text-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                          <span>30h Semanais (08:00 às 14:00 • 6h/dia)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => aplicarPreset(20)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white hover:bg-sky-50 hover:border-sky-300 text-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                          <span>20h Semanais (08:00 às 12:00 • 4h/dia)</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-zinc-200/80">
                      <Field label="Entrada Padrão" className="w-32">
                        <Input
                          type="time"
                          value={entradaPadrao}
                          onChange={(e) => setEntradaPadrao(e.target.value)}
                        />
                      </Field>
                      <Field label="Saída Padrão" className="w-32">
                        <Input
                          type="time"
                          value={saidaPadrao}
                          onChange={(e) => setSaidaPadrao(e.target.value)}
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={aplicarAosDiasAtivos}
                        className="cursor-pointer text-xs"
                      >
                        Aplicar aos dias ativos
                      </Button>
                    </div>
                  </div>

                  {/* Tabela de Dias da Semana */}
                  <div className="overflow-x-auto rounded-xl border border-zinc-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          <th className="py-2.5 px-3">Dia da Semana</th>
                          <th className="py-2.5 px-3">Trabalha</th>
                          <th className="py-2.5 px-3">Entrada</th>
                          <th className="py-2.5 px-3">Saída</th>
                          <th className="py-2.5 px-3">Carga Líquida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jornada.map((d) => {
                          const horasDia = d.trabalha
                            ? calcularHorasDia(d.entrada, d.saida)
                            : 0;
                          return (
                            <tr
                              key={d.dia}
                              className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 ${
                                d.trabalha ? "bg-white" : "bg-zinc-50/40 text-zinc-400"
                              }`}
                            >
                              <td className="py-2.5 px-3 font-semibold text-zinc-800">
                                {d.dia}
                              </td>
                              <td className="py-2.5 px-3">
                                <Switch
                                  checked={d.trabalha}
                                  onChange={(v) => toggleDia(d.dia, v)}
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <Input
                                  type="time"
                                  disabled={!d.trabalha}
                                  value={d.entrada ?? ""}
                                  onChange={(e) =>
                                    atualizarHorario(d.dia, "entrada", e.target.value)
                                  }
                                  className="w-32"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <Input
                                  type="time"
                                  disabled={!d.trabalha}
                                  value={d.saida ?? ""}
                                  onChange={(e) =>
                                    atualizarHorario(d.dia, "saida", e.target.value)
                                  }
                                  className="w-32"
                                />
                              </td>
                              <td className="py-2.5 px-3 font-mono text-xs">
                                {d.trabalha ? (
                                  <span className="font-bold text-zinc-700">
                                    {horasDia}h{" "}
                                    {horasDia >= 6 && (
                                      <span className="text-[11px] font-normal text-zinc-400">
                                        (1h almoço)
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400">Folga</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* 5. DADOS PESSOAIS DO COLABORADOR */}
            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100">
                <UserCheck className="h-5 w-5 text-sky-600 shrink-0" />
                <h3 className="text-base font-bold text-zinc-900">
                  Dados Pessoais do Colaborador
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Foto" className="lg:col-span-3 sm:max-w-xs">
                  {f?.fotoUrl ? (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200">
                      <User className="h-10 w-10 text-zinc-400" />
                    </div>
                  ) : (
                    <FileUpload label="Enviar foto de perfil" />
                  )}
                </Field>

                <Field
                  label="Nome completo"
                  required
                  error={fieldErrors.nomeCompleto}
                >
                  <Input
                    name="nomeCompleto"
                    defaultValue={f?.nomeCompleto}
                    required
                    placeholder="Ex: Carlos Eduardo da Silva"
                  />
                </Field>

                <Field label="CPF" required error={fieldErrors.cpf}>
                  <Input
                    name="cpf"
                    mask="cpf"
                    defaultValue={f?.cpf}
                    placeholder="000.000.000-00"
                    required
                  />
                </Field>

                <Field label="Data de Nascimento">
                  <Input
                    type="date"
                    name="dataNascimento"
                    defaultValue={f?.dataNascimento}
                  />
                </Field>

                <Field label="Celular / WhatsApp">
                  <Input
                    name="celular"
                    mask="telefone"
                    defaultValue={f?.celular}
                    placeholder="(63) 99999-0000"
                  />
                </Field>

                <Field label="E-mail Pessoal / Oficial" required>
                  <div className="relative">
                    <Input
                      type="email"
                      name="email"
                      value={emailVal}
                      onChange={(e) => {
                        setEmailVal(e.target.value);
                        if (erroEmail) setErroEmail(null);
                      }}
                      onBlur={handleBlurEmail}
                      required
                      placeholder="nome@exemplo.com"
                      className={
                        erroEmail ? "border-red-500 ring-2 ring-red-500/20" : ""
                      }
                    />
                    {checandoEmail && (
                      <span className="absolute right-3 top-2.5 text-xs text-zinc-400">
                        Verificando...
                      </span>
                    )}
                  </div>
                  {erroEmail && (
                    <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{erroEmail}</span>
                    </p>
                  )}
                </Field>

                <Field label="Status do Vínculo" required>
                  <Select name="status" defaultValue={f?.status ?? "ativo"}>
                    {Object.entries(statusFuncionarioLabel).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </Select>
                </Field>

                <Field label="Data de admissão" required>
                  <Input
                    type="date"
                    name="dataAdmissao"
                    defaultValue={
                      f?.dataAdmissao ??
                      new Date().toISOString().split("T")[0]
                    }
                  />
                </Field>

                <Field label="Data de demissão">
                  <Input
                    type="date"
                    name="dataDemissao"
                    defaultValue={f?.dataDemissao}
                  />
                </Field>
              </div>
            </div>
          </>
        )}
      </div>

      {funcaoId && (
        <div className="flex justify-end gap-3 pt-2">
          <LinkButton
            href={backHref}
            variant="outline"
            className="cursor-pointer"
          >
            Voltar
          </LinkButton>
          <Button
            type="submit"
            loading={loading}
            disabled={!!erroEmail}
            className="cursor-pointer"
          >
            {f ? "Salvar Alterações" : "Cadastrar Colaborador"}
          </Button>
        </div>
      )}
    </form>
  );
}
