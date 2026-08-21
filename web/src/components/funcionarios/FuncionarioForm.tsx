"use client";

import { useState } from "react";
import { z } from "zod";
import { User, KeyRound, ShieldCheck, Eye, EyeOff, AlertCircle, Lock } from "lucide-react";
import {
  Button,
  Field,
  FileUpload,
  FormSection,
  Input,
  LinkButton,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";
import type { DiaJornada } from "@/lib/types";
import { statusFuncionarioLabel } from "@/lib/status";
import { funcionariosApi, type FuncionarioApi, type NucleoApi, type FuncaoApi } from "@/lib/api/services";

const DIAS_SEMANA: DiaJornada["dia"][] = [
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo",
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

export function FuncionarioForm({ funcionario: f, nucleos = [], funcoes = [], backHref }: FuncionarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  // Dados do Funcionário
  const [funcaoId, setFuncaoId] = useState<string>(
    f?.funcaoId || funcoes.find((fn) => fn.nome === f?.funcao)?.id || (funcoes[0]?.id ?? "")
  );

  const funcaoObj = funcoes.find((fn) => fn.id === funcaoId) || funcoes.find((fn) => fn.nome === f?.funcao);
  const funcaoNome = funcaoObj?.nome || f?.funcao || "";

  const [emailVal, setEmailVal] = useState<string>(f?.email || "");
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [checandoEmail, setChecandoEmail] = useState(false);
  const [professorResponsavel, setProfessorResponsavel] = useState(f?.professorResponsavel ?? false);
  
  // Credenciais de Acesso (Geridas dinamicamente pela Categoria do Cargo)
  const categoriaPermiteLogin = funcaoObj ? funcaoObj.permiteLogin : (funcaoNome !== "Staff");
  const [senhaNova, setSenhaNova] = useState<string>("");
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);

  // Jornada de trabalho
  const [jornada, setJornada] = useState<DiaJornada[]>(
    DIAS_SEMANA.map((dia) => ({ dia, trabalha: false }))
  );
  const [entradaPadrao, setEntradaPadrao] = useState("08:00");
  const [saidaPadrao, setSaidaPadrao] = useState("17:00");

  const exigeConselho = funcaoObj ? Boolean(funcaoObj.exigeConselho) : false;


  // Checagem de unicidade de e-mail em tempo real (onBlur)
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
    const data = {
      matricula: f?.matricula || `PROF-${Math.floor(100 + Math.random() * 900)}`,
      nomeCompleto: formData.get("nomeCompleto") as string,
      cpf: formData.get("cpf") as string,
      rg: formData.get("rg") as string,
      dataNascimento: formData.get("dataNascimento") as string,
      celular: formData.get("celular") as string,
      email: emailVal.trim(),
      funcaoId: funcaoObj?.id || f?.funcaoId || "",
      status: (formData.get("status") as string) || "ativo",
      nucleoId: (formData.get("nucleoId") as string) || null,
      alocadoEm: (formData.get("alocadoEm") as string) || "Administração",
      professorResponsavel,
      permitirLogin: categoriaPermiteLogin,
      senhaLogin: senhaNova.trim() || undefined,
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

  function aplicarAosDiasAtivos() {
    setJornada((prev) =>
      prev.map((d) => (d.trabalha ? { ...d, entrada: entradaPadrao, saida: saidaPadrao } : d))
    );
  }

  function toggleDia(dia: DiaJornada["dia"], trabalha: boolean) {
    setJornada((prev) => prev.map((d) => (d.dia === dia ? { ...d, trabalha } : d)));
  }

  function atualizarHorario(dia: DiaJornada["dia"], campo: "entrada" | "saida", valor: string) {
    setJornada((prev) => prev.map((d) => (d.dia === dia ? { ...d, [campo]: valor } : d)));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Dados Pessoais */}
      <FormSection title="Dados Pessoais do Colaborador">
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

          <Field label="Nome completo" required error={fieldErrors.nomeCompleto}>
            <Input name="nomeCompleto" defaultValue={f?.nomeCompleto} required placeholder="Ex: Aleksandro Soares de Sousa" />
          </Field>

          <Field label="CPF" error={fieldErrors.cpf}>
            <Input name="cpf" mask="cpf" defaultValue={f?.cpf} placeholder="000.000.000-00" />
          </Field>

          <Field label="Data de Nascimento">
            <Input type="date" name="dataNascimento" defaultValue={f?.dataNascimento} />
          </Field>

          <Field label="Celular / WhatsApp">
            <Input name="celular" mask="telefone" defaultValue={f?.celular} placeholder="(63) 99999-0000" />
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
                className={erroEmail ? "border-red-500 ring-2 ring-red-500/20" : ""}
              />
              {checandoEmail && (
                <span className="absolute right-3 top-2.5 text-xs text-zinc-400">Verificando...</span>
              )}
            </div>
            {erroEmail && (
              <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{erroEmail}</span>
              </p>
            )}
          </Field>
        </div>

        <div className="mt-4">
          <Switch
            checked={professorResponsavel}
            onChange={setProfessorResponsavel}
            label="Professor responsável por turmas esportivas"
          />
        </div>
      </FormSection>

      {/* Vínculo e Função */}
      <FormSection title="Vínculo Institucional & Cargo">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Cargo / Função (RH)" required error={fieldErrors.funcaoId}>
            <Select
              name="funcaoId"
              value={funcaoId}
              onChange={(e) => setFuncaoId(e.target.value)}
            >

              {funcoes.map((fn) => (
                <option key={fn.id} value={fn.id}>{fn.nome}</option>
              ))}
            </Select>
          </Field>


          <Field label="Status do Vínculo" required>
            <Select name="status" defaultValue={f?.status ?? "ativo"}>
              {Object.entries(statusFuncionarioLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Núcleo de Atuação">
            <Select name="nucleoId" defaultValue={f?.nucleoId ?? ""}>
              <option value="">Sem núcleo definido</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>

          <Field label="Data de admissão" required>
            <Input type="date" name="dataAdmissao" defaultValue={f?.dataAdmissao ?? new Date().toISOString().split('T')[0]} />
          </Field>

          <Field label="Data de demissão">
            <Input type="date" name="dataDemissao" defaultValue={f?.dataDemissao} />
          </Field>

          <Field label="Alocado em" required>
            <Select name="alocadoEm" defaultValue={f?.alocadoEm ?? "Administração"}>
              <option value="Administração">Administração</option>
              <option value="Múlti. núcleos">Múltiplos Núcleos</option>
              <option value="Serviços gerais">Serviços Gerais</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.identificacao}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>
        </div>

        {exigeConselho && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Conselho">
              <Select name="conselho" defaultValue={f?.conselho ?? ""}>
                <option value="">Selecione</option>
                <option value="CREFITO">CREFITO</option>
                <option value="COREN">COREN</option>
              </Select>
            </Field>
            <Field label="Registro">
              <Input name="registroConselho" defaultValue={f?.registroConselho} />
            </Field>
          </div>
        )}
      </FormSection>

      {/* REGRA DA CATEGORIA DO PERFIL: CREDENCIAIS E ACESSO AO SISTEMA */}
      <FormSection title="Acesso ao Sistema (Regra da Categoria)">
        <div className={`rounded-xl border p-5 flex flex-col gap-4 ${
          categoriaPermiteLogin ? "border-sky-200 bg-sky-50/50" : "border-zinc-200 bg-zinc-50"
        }`}>
          <div className="flex items-center justify-between border-b border-sky-100/60 pb-3">
            <div className="flex items-center gap-2">
              {categoriaPermiteLogin ? (
                <ShieldCheck className="h-5 w-5 text-sky-600" />
              ) : (
                <Lock className="h-5 w-5 text-zinc-400" />
              )}
              <div>
                <h4 className="text-sm font-bold text-zinc-900">
                  {categoriaPermiteLogin ? "Acesso ao Painel Permitido" : "Acesso ao Painel Bloqueado para esta Categoria"}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Regra herdada do perfil de acesso: <span className="font-bold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded">{funcaoNome}</span>
                </p>

              </div>
            </div>

            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              categoriaPermiteLogin ? "bg-sky-600 text-white" : "bg-zinc-200 text-zinc-600"
            }`}>
              {categoriaPermiteLogin ? "Categoria com Login" : "Sem Login"}
            </span>
          </div>

          {categoriaPermiteLogin ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
              <Field label="E-mail de Login no Sistema" required>
                <Input
                  type="email"
                  value={emailVal}
                  readOnly
                  className="bg-white font-mono text-xs font-semibold text-zinc-700 cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-zinc-500">Sincronizado automaticamente com o e-mail oficial do colaborador.</p>
              </Field>

              <Field label="Definir / Redefinir Senha do Colaborador">
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
                    {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1">
                  <KeyRound className="h-3 w-3 text-sky-600 shrink-0" />
                  <span>Deixe em branco para manter a senha atual ou a senha padrão da categoria.</span>
                </p>
              </Field>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 font-medium bg-white p-3 rounded-lg border border-zinc-200">
              🔒 Os colaboradores cadastrados na categoria <strong>{funcaoNome}</strong> não possuem permissão de login no painel. Para habilitar acesso, altere o cargo ou a regra do perfil em <em>Configurações &gt; Permissões RBAC</em>.
            </p>

          )}
        </div>
      </FormSection>

      {/* Jornada de Trabalho */}
      <FormSection title="Jornada de Trabalho">
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded-lg bg-zinc-50 p-4 border border-zinc-200">
          <Field label="Entrada Padrão">
            <Input type="time" value={entradaPadrao} onChange={(e) => setEntradaPadrao(e.target.value)} />
          </Field>
          <Field label="Saída Padrão">
            <Input type="time" value={saidaPadrao} onChange={(e) => setSaidaPadrao(e.target.value)} />
          </Field>
          <Button type="button" variant="outline" size="sm" onClick={aplicarAosDiasAtivos}>
            Aplicar aos dias ativos
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="py-2.5 px-3">Dia da Semana</th>
                <th className="py-2.5 px-3">Trabalha</th>
                <th className="py-2.5 px-3">Entrada</th>
                <th className="py-2.5 px-3">Saída</th>
              </tr>
            </thead>
            <tbody>
              {jornada.map((d) => (
                <tr key={d.dia} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                  <td className="py-2.5 px-3 font-semibold text-zinc-800">{d.dia}</td>
                  <td className="py-2.5 px-3">
                    <Switch checked={d.trabalha} onChange={(v) => toggleDia(d.dia, v)} />
                  </td>
                  <td className="py-2.5 px-3">
                    <Input
                      type="time"
                      disabled={!d.trabalha}
                      value={d.entrada ?? ""}
                      onChange={(e) => atualizarHorario(d.dia, "entrada", e.target.value)}
                      className="w-32"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <Input
                      type="time"
                      disabled={!d.trabalha}
                      value={d.saida ?? ""}
                      onChange={(e) => atualizarHorario(d.dia, "saida", e.target.value)}
                      className="w-32"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
        <LinkButton href={backHref} variant="outline" className="cursor-pointer">
          Voltar
        </LinkButton>
        <Button type="submit" loading={loading} disabled={!!erroEmail} className="cursor-pointer">
          {f ? "Salvar Alterações" : "Cadastrar Colaborador"}
        </Button>
      </div>
    </form>
  );
}
