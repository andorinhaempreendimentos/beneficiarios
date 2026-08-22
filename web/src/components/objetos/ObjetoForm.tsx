"use client";

import { useState, useEffect } from "react";
import { Button, Field, FormSection, Input, LinkButton, Select } from "@/components/ui";
import type { TipoDuracao } from "@/lib/types";
import { z } from "zod";
import {
  objetosApi,
  concedentesApi,
  type ObjetoApi,
  type ConcedenteApi,
  type ObjetoCargoPrevistoApi,
} from "@/lib/api/services";
import { Plus, Trash2, Building2, Edit2 } from "lucide-react";
import { ModalConcedenteForm } from "@/components/concedentes/ModalConcedenteForm";

const objetoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
});

type FieldErrors = Partial<Record<string, string>>;

interface ObjetoFormProps {
  objeto?: ObjetoApi;
  backHref: string;
}

export function ObjetoForm({ objeto: o, backHref }: ObjetoFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tipoDuracao, setTipoDuracao] = useState<TipoDuracao>((o?.tipoDuracao as TipoDuracao) ?? "periodo");
  const [concedentes, setConcedentes] = useState<ConcedenteApi[]>([]);
  const [concedenteId, setConcedenteId] = useState<string>(o?.concedenteId ?? "");
  const [modalidadeParceria, setModalidadeParceria] = useState<string>(o?.modalidadeParceria ?? "termo_colaboracao");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Modal de Concedente
  const [modalConcedenteAberto, setModalConcedenteAberto] = useState(false);
  const [concedenteParaEditar, setConcedenteParaEditar] = useState<ConcedenteApi | null>(null);

  // Quadro dinâmico de cargos previstos
  const [cargos, setCargos] = useState<Partial<ObjetoCargoPrevistoApi>[]>(
    o?.cargosPrevistos && o.cargosPrevistos.length > 0
      ? o.cargosPrevistos
      : [
          { cargoNome: "Coordenador Geral", quantidadePrevista: 1, remuneracaoMensal: 5000, cargaHorariaSemanal: "40h/sem" },
          { cargoNome: "Supervisor de Campo", quantidadePrevista: 2, remuneracaoMensal: 5000, cargaHorariaSemanal: "40h/sem" },
          { cargoNome: "Instrutor Esportivo", quantidadePrevista: 20, remuneracaoMensal: 3500, cargaHorariaSemanal: "20h/sem" },
        ]
  );

  useEffect(() => {
    concedentesApi.list({ limit: 100 }).then((res) => {
      setConcedentes(res.data);
      if (!concedenteId && res.data.length > 0 && !o?.id) {
        setConcedenteId(res.data[0].id);
      }
    });
  }, [concedenteId, o?.id]);

  function handleAbrirNovoConcedente() {
    setConcedenteParaEditar(null);
    setModalConcedenteAberto(true);
  }

  function handleAbrirEditarConcedente() {
    const encontrado = concedentes.find((c) => c.id === concedenteId);
    if (encontrado) {
      setConcedenteParaEditar(encontrado);
      setModalConcedenteAberto(true);
    }
  }

  function handleConcedenteSalvo(novoConcedente: ConcedenteApi) {
    concedentesApi.list({ limit: 100 }).then((res) => {
      setConcedentes(res.data);
      setConcedenteId(novoConcedente.id);
    });
  }

  function handleAddCargo() {
    setCargos((prev) => [
      ...prev,
      { cargoNome: "", quantidadePrevista: 1, remuneracaoMensal: 0, cargaHorariaSemanal: "20h/sem" },
    ]);
  }

  function handleRemoveCargo(index: number) {
    setCargos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCargoChange(index: number, field: keyof ObjetoCargoPrevistoApi, value: any) {
    setCargos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      termoDeFomento: (formData.get("termoDeFomento") as string) || null,
      codigoObjeto: (formData.get("codigoObjeto") as string) || null,
      codigoPrograma: (formData.get("codigoPrograma") as string) || null,
      nomePrograma: (formData.get("nomePrograma") as string) || null,
      descricao: (formData.get("descricao") as string) || null,
      concedenteId: concedenteId || null,
      modalidadeParceria,
      numeroProcessoAdm: (formData.get("numeroProcessoAdm") as string) || null,
      editalNumero: (formData.get("editalNumero") as string) || null,
      contaBancariaBanco: (formData.get("contaBancariaBanco") as string) || null,
      contaBancariaAgencia: (formData.get("contaBancariaAgencia") as string) || null,
      contaBancariaConta: (formData.get("contaBancariaConta") as string) || null,
      metaBeneficiarios: Number(formData.get("metaBeneficiarios") || 0),
      metaNucleos: Number(formData.get("metaNucleos") || 0),
      metaAulasAno: Number(formData.get("metaAulasAno") || 0),
      metaFrequenciaMinima: Number(formData.get("metaFrequenciaMinima") || 75),
      metaVulnerabilidadeMinima: Number(formData.get("metaVulnerabilidadeMinima") || 70),
      metaEventosAno: Number(formData.get("metaEventosAno") || 0),
      metaReunioesAno: Number(formData.get("metaReunioesAno") || 0),
      tipoDuracao,
      dataEvento: tipoDuracao === "pontual" ? ((formData.get("dataEvento") as string) || null) : null,
      dataInicio: tipoDuracao === "periodo" ? ((formData.get("dataInicio") as string) || null) : null,
      dataTermino: tipoDuracao === "periodo" ? ((formData.get("dataTermino") as string) || null) : null,
      status: (formData.get("status") as string) || "ativo",
      cargosPrevistos: cargos.filter((c) => c.cargoNome && c.cargoNome.trim() !== ""),
    };

    const parsed = objetoSchema.safeParse({
      nome: data.nome,
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      if (o?.id) {
        await objetosApi.update(o.id, data);
      } else {
        await objetosApi.create(data);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar objeto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* 1. Dados Básicos do Objeto */}
      <FormSection title="1. Identificação do Objeto / Parceria">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome do Projeto / Objeto" required error={fieldErrors.nome} className="sm:col-span-2">
            <Input name="nome" defaultValue={o?.nome} placeholder="Ex: Escolinhas de Futebol e Futsal de Palmas" />
          </Field>
          <Field label="Instrumento / Termo nº">
            <Input name="termoDeFomento" defaultValue={o?.termoDeFomento} placeholder="Ex: Termo de Colaboração nº 002/2026" />
          </Field>
          <Field label="Modalidade da Parceria">
            <Select
              name="modalidadeParceria"
              value={modalidadeParceria}
              onChange={(e) => setModalidadeParceria(e.target.value)}
            >
              <option value="termo_colaboracao">Termo de Colaboração (Iniciativa Pública)</option>
              <option value="termo_fomento">Termo de Fomento (Iniciativa da OSC)</option>
              <option value="acordo_cooperacao">Acordo de Cooperação (Sem repasse financeiro)</option>
            </Select>
          </Field>
          <Field label="Código do Objeto">
            <Input name="codigoObjeto" defaultValue={o?.codigoObjeto} placeholder="Ex: OBJ-2026-01" />
          </Field>
          <Field label="Nome do Programa">
            <Input name="nomePrograma" defaultValue={o?.nomePrograma} placeholder="Ex: Esporte e Lazer" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Objeto e Finalidade (Descrição Oficial)">
            <textarea
              name="descricao"
              defaultValue={o?.descricao}
              rows={3}
              placeholder="Ex: Promover o acesso à prática esportiva por meio da oferta de atividades regulares de futebol e futsal..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </Field>
        </div>
      </FormSection>

      {/* 2. Órgão Concedente e Processo Administrativo */}
      <FormSection title="2. Órgão Concedente e Processo Administrativo (MROSC)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Órgão Concedente (Poder Público)" className="sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                name="concedenteId"
                value={concedenteId}
                onChange={(e) => setConcedenteId(e.target.value)}
                className="flex-1"
              >
                <option value="">Nenhum / Selecione o Órgão Concedente</option>
                {concedentes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.esfera.toUpperCase()}{c.cidade ? ` - ${c.cidade}/${c.estado}` : c.estado ? ` - ${c.estado}` : ""})
                  </option>
                ))}
              </Select>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAbrirNovoConcedente}
                  title="Cadastrar Novo Órgão Concedente"
                >
                  <Plus className="h-4 w-4 mr-1 text-sky-600" /> Novo Concedente
                </Button>
                {concedenteId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAbrirEditarConcedente}
                    title="Editar Órgão Concedente Selecionado"
                  >
                    <Edit2 className="h-4 w-4 text-zinc-600 mr-1" /> Editar
                  </Button>
                )}
              </div>
            </div>
          </Field>
          <Field label="Nº do Processo Administrativo">
            <Input name="numeroProcessoAdm" defaultValue={o?.numeroProcessoAdm} placeholder="Ex: 00000.0.028571/2026" />
          </Field>
          <Field label="Nº do Edital de Chamamento Público">
            <Input name="editalNumero" defaultValue={o?.editalNumero} placeholder="Ex: 002/2026 – SEJUVES" />
          </Field>
          <Field label="Conta Bancária Exclusiva da Parceria" className="sm:col-span-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Input name="contaBancariaBanco" defaultValue={o?.contaBancariaBanco} placeholder="Banco (ex: Banco do Brasil)" />
              <Input name="contaBancariaAgencia" defaultValue={o?.contaBancariaAgencia} placeholder="Agência (ex: 1505-9)" />
              <Input name="contaBancariaConta" defaultValue={o?.contaBancariaConta} placeholder="Conta Corrente (ex: 102938-4)" />
            </div>
          </Field>
        </div>
      </FormSection>

      {/* 3. Metas Pactuadas no Plano de Trabalho */}
      <FormSection title="3. Metas Pactuadas no Plano de Trabalho">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Meta de Beneficiários Atendidos" required>
            <Input type="number" name="metaBeneficiarios" defaultValue={o?.metaBeneficiarios ?? 2000} placeholder="Ex: 2000" />
          </Field>
          <Field label="Meta de Núcleos em Funcionamento" required>
            <Input type="number" name="metaNucleos" defaultValue={o?.metaNucleos ?? 20} placeholder="Ex: 20" />
          </Field>
          <Field label="Meta de Aulas / Atividades Anuais" required>
            <Input type="number" name="metaAulasAno" defaultValue={o?.metaAulasAno ?? 1920} placeholder="Ex: 1920" />
          </Field>
          <Field label="Meta de Frequência Mínima (%)" required>
            <Input type="number" step="0.1" name="metaFrequenciaMinima" defaultValue={o?.metaFrequenciaMinima ?? 75} placeholder="Ex: 75" />
          </Field>
          <Field label="Meta de Vulnerabilidade / Rede Pública (%)" required>
            <Input type="number" step="0.1" name="metaVulnerabilidadeMinima" defaultValue={o?.metaVulnerabilidadeMinima ?? 70} placeholder="Ex: 70" />
          </Field>
          <Field label="Meta de Eventos Esportivos no Ano">
            <Input type="number" name="metaEventosAno" defaultValue={o?.metaEventosAno ?? 4} placeholder="Ex: 4" />
          </Field>
          <Field label="Meta de Reuniões com Famílias no Ano">
            <Input type="number" name="metaReunioesAno" defaultValue={o?.metaReunioesAno ?? 40} placeholder="Ex: 40" />
          </Field>
        </div>
      </FormSection>

      {/* 4. Quadro de Cargos e Equipe Prevista (Dinâmico) */}
      <FormSection title="4. Quadro de Equipe / Cargos Previstos no Plano de Trabalho">
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Função / Cargo</th>
                  <th className="px-3 py-2 w-24">Qtd. Vagas</th>
                  <th className="px-3 py-2 w-32">Remuneração (R$)</th>
                  <th className="px-3 py-2 w-32">C.H. Semanal</th>
                  <th className="px-3 py-2 w-12 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {cargos.map((cargo, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="p-2">
                      <Input
                        value={cargo.cargoNome ?? ""}
                        onChange={(e) => handleCargoChange(idx, "cargoNome", e.target.value)}
                        placeholder="Ex: Instrutor Esportivo"
                        className="text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="1"
                        value={cargo.quantidadePrevista ?? 1}
                        onChange={(e) => handleCargoChange(idx, "quantidadePrevista", Number(e.target.value))}
                        className="text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="100"
                        value={cargo.remuneracaoMensal ?? 0}
                        onChange={(e) => handleCargoChange(idx, "remuneracaoMensal", Number(e.target.value))}
                        className="text-sm"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={cargo.cargaHorariaSemanal ?? "20h/sem"}
                        onChange={(e) => handleCargoChange(idx, "cargaHorariaSemanal", e.target.value)}
                        placeholder="Ex: 20h/sem"
                        className="text-sm"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveCargo(idx)}
                        className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        title="Remover cargo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {cargos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-xs text-zinc-400">
                      Nenhum cargo previsto adicionado. Clique no botão abaixo para adicionar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddCargo}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar Cargo Previsto
            </Button>
          </div>
        </div>
      </FormSection>

      {/* 5. Vigência do Objeto */}
      <FormSection title="5. Vigência do Objeto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo de duração" required>
            <Select
              name="tipoDuracao"
              value={tipoDuracao}
              onChange={(e) => setTipoDuracao(e.target.value as TipoDuracao)}
            >
              <option value="periodo">Evento de Período (Contínuo)</option>
              <option value="pontual">Evento Pontual</option>
            </Select>
          </Field>
          <Field label="Status do Objeto">
            <Select name="status" defaultValue={o?.status ?? "ativo"}>
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
              <option value="suspenso">Suspenso</option>
            </Select>
          </Field>
        </div>

        {tipoDuracao === "pontual" && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data do Evento" required>
              <Input type="date" name="dataEvento" defaultValue={o?.dataEvento} />
            </Field>
          </div>
        )}

        {tipoDuracao === "periodo" && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data de Início da Vigência" required>
              <Input type="date" name="dataInicio" defaultValue={o?.dataInicio} />
            </Field>
            <Field label="Data de Término da Vigência" required>
              <Input type="date" name="dataTermino" defaultValue={o?.dataTermino} />
            </Field>
          </div>
        )}
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : o ? "Salvar Alterações" : "Cadastrar Objeto"}
        </Button>
      </div>

      <ModalConcedenteForm
        isOpen={modalConcedenteAberto}
        onClose={() => setModalConcedenteAberto(false)}
        onSuccess={handleConcedenteSalvo}
        concedenteParaEditar={concedenteParaEditar}
      />
    </form>
  );
}
