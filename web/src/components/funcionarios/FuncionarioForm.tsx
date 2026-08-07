"use client";

import { useState } from "react";
import { User } from "lucide-react";
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
import type { DiaJornada, FuncaoFuncionario } from "@/lib/types";
import { statusFuncionarioLabel } from "@/lib/status";
import { funcionariosApi, type FuncionarioApi, type NucleoApi } from "@/lib/api/services";

const FUNCOES: FuncaoFuncionario[] = [
  "Agente comunitário",
  "Articulador social",
  "Coordenador de núcleo",
  "Coordenador de projeto",
  "Coordenador de setor",
  "Instrutor",
  "Monitor",
  "Fisioterapeuta",
  "Técnico de Enfermagem",
];

const DIAS_SEMANA: DiaJornada["dia"][] = [
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo",
];

interface FuncionarioFormProps {
  funcionario?: FuncionarioApi;
  nucleos?: NucleoApi[];
  funcoes?: { id: string; nome: string }[];
  backHref: string;
}

export function FuncionarioForm({ funcionario: f, nucleos = [], funcoes = [], backHref }: FuncionarioFormProps) {
  const listaFuncoes = funcoes.length > 0 ? funcoes.map((fn) => fn.nome) : FUNCOES;
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [funcao, setFuncao] = useState<string>((f?.funcao as string) ?? "");
  const [professorResponsavel, setProfessorResponsavel] = useState(f?.professorResponsavel ?? false);
  const [jornada, setJornada] = useState<DiaJornada[]>(
    DIAS_SEMANA.map((dia) => ({ dia, trabalha: false }))
  );
  const [entradaPadrao, setEntradaPadrao] = useState("08:00");
  const [saidaPadrao, setSaidaPadrao] = useState("17:00");

  const exigeConselho = funcao === "Fisioterapeuta" || funcao === "Técnico de Enfermagem";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      nomeCompleto: formData.get("nomeCompleto") as string,
      cpf: formData.get("cpf") as string,
      rg: formData.get("rg") as string,
      dataNascimento: formData.get("dataNascimento") as string,
      celular: formData.get("celular") as string,
      email: formData.get("email") as string,
      funcao: formData.get("funcao") as string,
      status: (formData.get("status") as string) || "contratado",
      nucleoId: (formData.get("nucleoId") as string) || null,
      professorResponsavel,
    };

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
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}
      <FormSection title="Dados Pessoais">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Foto" className="lg:col-span-3 sm:max-w-xs">
            {f?.fotoUrl ? (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100">
                <User className="h-10 w-10 text-zinc-400" />
              </div>
            ) : (
              <FileUpload label="Enviar foto de perfil" />
            )}
          </Field>
          <Field label="Nome completo" required>
            <Input name="nomeCompleto" defaultValue={f?.nomeCompleto} />
          </Field>
          <Field label="Documento CPF/CNPJ">
            <Input name="cpfCnpj" mask="cpfCnpj" defaultValue={f?.cpfCnpj} placeholder="000.000.000-00 ou 00.000.000/0000-00" />
          </Field>
          <Field label="Data de Nascimento">
            <Input type="date" name="dataNascimento" defaultValue={f?.dataNascimento} />
          </Field>
        </div>
        <div className="mt-4">
          <Switch
            checked={professorResponsavel}
            onChange={setProfessorResponsavel}
            label="Professor responsável de turma"
          />
        </div>
      </FormSection>

      <FormSection title="Vínculo e Função">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Status" required>
            <Select name="status" defaultValue={f?.status ?? ""}>
              <option value="">Selecione</option>
              {Object.entries(statusFuncionarioLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Data de admissão" required>
            <Input type="date" name="dataAdmissao" defaultValue={f?.dataAdmissao} />
          </Field>
          <Field label="Data de demissão">
            <Input type="date" name="dataDemissao" defaultValue={f?.dataDemissao} />
          </Field>
          <Field label="Função" required>
            <Select
              name="funcao"
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
            >
              <option value="">Selecione</option>
              {listaFuncoes.map((fn) => (
                <option key={fn} value={fn}>{fn}</option>
              ))}
            </Select>
          </Field>
          <Field label="Remuneração">
            <Input name="remuneracao" defaultValue={f?.remuneracao} placeholder="R$ 0,00" />
          </Field>
          <Field label="Núcleo">
            <Select name="nucleoId" defaultValue={f?.nucleoId ?? ""}>
              <option value="">Sem núcleo definido</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>
          <Field label="Alocado em" required>
            <Select name="alocadoEm" defaultValue={f?.alocadoEm ?? ""}>
              <option value="">Selecione</option>
              <option>Administração</option>
              <option>Múlti. núcleos</option>
              <option>Nenhum</option>
              <option>Serviços gerais</option>
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

        <div className="mt-4">
          <Field label="Conta de acesso">
            <Select name="contaAcesso" defaultValue="">
              <option value="">Nenhuma conta vinculada</option>
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Observação">
            <Textarea name="observacao" defaultValue={f?.observacao} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Jornada de Trabalho">
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded-lg bg-zinc-50 p-4">
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
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="py-2">Dia</th>
                <th className="py-2">Trabalha</th>
                <th className="py-2">Entrada</th>
                <th className="py-2">Saída</th>
              </tr>
            </thead>
            <tbody>
              {jornada.map((d) => (
                <tr key={d.dia} className="border-b border-zinc-100 last:border-0">
                  <td className="py-2 font-medium text-zinc-700">{d.dia}</td>
                  <td className="py-2">
                    <Switch checked={d.trabalha} onChange={(v) => toggleDia(d.dia, v)} />
                  </td>
                  <td className="py-2">
                    <Input
                      type="time"
                      disabled={!d.trabalha}
                      value={d.entrada ?? ""}
                      onChange={(e) => atualizarHorario(d.dia, "entrada", e.target.value)}
                      className="w-32"
                    />
                  </td>
                  <td className="py-2">
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

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
