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
  type ObjetoMetaApi,
} from "@/lib/api/services";
import Link from "next/link";
import { Plus, Trash2, ExternalLink } from "lucide-react";

export const METAS_CATALOGO_ENTIDADES = [
  { id: "participantes", nome: "Beneficiários / Alunos", defaultTitulo: "Beneficiários Atendidos / Matriculados", defaultUnidade: "Pessoas / Atendidos", defaultValor: 2000 },
  { id: "locais", nome: "Locais / Núcleos / Polos", defaultTitulo: "Locais / Núcleos em Funcionamento", defaultUnidade: "Quantidade (Unidades)", defaultValor: 20 },
  { id: "sessoes", nome: "Sessões / Aulas / Treinos", defaultTitulo: "Sessões / Aulas e Atividades Realizadas", defaultUnidade: "Quantidade (Unidades)", defaultValor: 1920 },
  { id: "turmas", nome: "Turmas / Grupos Formados", defaultTitulo: "Turmas / Grupos Formados e Ativos", defaultUnidade: "Quantidade (Unidades)", defaultValor: 40 },
  { id: "frequencia", nome: "Frequência e Assiduidade", defaultTitulo: "Frequência Média de Participação", defaultUnidade: "Porcentagem (%)", defaultValor: 75 },
  { id: "vulnerabilidade", nome: "Perfil Social / Vulnerabilidade", defaultTitulo: "Inclusão Social e Vulnerabilidade", defaultUnidade: "Porcentagem (%)", defaultValor: 70 },
  { id: "eventos", nome: "Eventos / Ações Coletivas", defaultTitulo: "Eventos Esportivos e Festivais Comunitários", defaultUnidade: "Quantidade (Unidades)", defaultValor: 4 },
  { id: "reunioes", nome: "Reuniões com Famílias", defaultTitulo: "Reuniões com Famílias e Responsáveis", defaultUnidade: "Encontros / Reuniões", defaultValor: 40 },
  { id: "outros", nome: "Personalizada / Outra Métrica", defaultTitulo: "", defaultUnidade: "Quantidade (Unidades)", defaultValor: 0 },
];

export const METAS_UNIDADES_MEDIDA = [
  "Quantidade (Unidades)",
  "Porcentagem (%)",
  "Horas (h)",
  "Pessoas / Atendidos",
  "Atendimentos",
  "Kits / Conjuntos",
  "Encontros / Reuniões",
  "Dias",
  "Meses",
];

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

  // Quadro dinâmico de metas pactuadas
  const [metas, setMetas] = useState<Partial<ObjetoMetaApi>[]>(() => {
    if (o?.metas && o.metas.length > 0) {
      return o.metas;
    }
    if (o) {
      const arr: Partial<ObjetoMetaApi>[] = [];
      if (o.metaBeneficiarios) arr.push({ entidadeId: "participantes", titulo: "Beneficiários Atendidos / Matriculados", unidade: "Pessoas / Atendidos", valorEsperado: o.metaBeneficiarios });
      if (o.metaNucleos) arr.push({ entidadeId: "locais", titulo: "Locais / Núcleos em Funcionamento", unidade: "Quantidade (Unidades)", valorEsperado: o.metaNucleos });
      if (o.metaAulasAno) arr.push({ entidadeId: "sessoes", titulo: "Sessões / Aulas e Atividades Realizadas", unidade: "Quantidade (Unidades)", valorEsperado: o.metaAulasAno });
      if (o.metaFrequenciaMinima) arr.push({ entidadeId: "frequencia", titulo: "Frequência Média de Participação", unidade: "Porcentagem (%)", valorEsperado: o.metaFrequenciaMinima });
      if (o.metaVulnerabilidadeMinima) arr.push({ entidadeId: "vulnerabilidade", titulo: "Inclusão Social e Vulnerabilidade", unidade: "Porcentagem (%)", valorEsperado: o.metaVulnerabilidadeMinima });
      if (o.metaEventosAno) arr.push({ entidadeId: "eventos", titulo: "Eventos Esportivos e Festivais Comunitários", unidade: "Quantidade (Unidades)", valorEsperado: o.metaEventosAno });
      if (o.metaReunioesAno) arr.push({ entidadeId: "reunioes", titulo: "Reuniões com Famílias e Responsáveis", unidade: "Encontros / Reuniões", valorEsperado: o.metaReunioesAno });
      if (arr.length > 0) return arr;
    }
    return [
      { entidadeId: "participantes", titulo: "Beneficiários Atendidos / Matriculados", unidade: "Pessoas / Atendidos", valorEsperado: 2000 },
      { entidadeId: "locais", titulo: "Locais / Núcleos em Funcionamento", unidade: "Quantidade (Unidades)", valorEsperado: 20 },
      { entidadeId: "sessoes", titulo: "Sessões / Aulas e Atividades Realizadas", unidade: "Quantidade (Unidades)", valorEsperado: 1920 },
      { entidadeId: "frequencia", titulo: "Frequência Média de Participação", unidade: "Porcentagem (%)", valorEsperado: 75 },
      { entidadeId: "vulnerabilidade", titulo: "Inclusão Social e Vulnerabilidade", unidade: "Porcentagem (%)", valorEsperado: 70 },
      { entidadeId: "eventos", titulo: "Eventos Esportivos e Festivais Comunitários", unidade: "Quantidade (Unidades)", valorEsperado: 4 },
      { entidadeId: "reunioes", titulo: "Reuniões com Famílias e Responsáveis", unidade: "Encontros / Reuniões", valorEsperado: 40 },
    ];
  });

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
  }, [o?.id]);

  function handleAddMeta() {
    setMetas((prev) => [
      ...prev,
      {
        entidadeId: "participantes",
        titulo: "Beneficiários Atendidos / Matriculados",
        unidade: "Pessoas / Atendidos",
        valorEsperado: 0,
      },
    ]);
  }

  function handleRemoveMeta(index: number) {
    setMetas((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMetaChange(index: number, field: keyof ObjetoMetaApi, value: any) {
    setMetas((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === "entidadeId") {
        const catalogo = METAS_CATALOGO_ENTIDADES.find((c) => c.id === value);
        if (catalogo) {
          copy[index].titulo = catalogo.defaultTitulo;
          copy[index].unidade = catalogo.defaultUnidade;
          if (copy[index].valorEsperado === 0 || copy[index].valorEsperado === undefined) {
            copy[index].valorEsperado = catalogo.defaultValor;
          }
        }
      }
      return copy;
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
      metas: metas.filter((m) => (m.titulo && m.titulo.trim() !== "") || (m.valorEsperado !== undefined && m.valorEsperado > 0)),
      metaBeneficiarios: Number(metas.find((m) => m.entidadeId === "participantes")?.valorEsperado ?? 0),
      metaNucleos: Number(metas.find((m) => m.entidadeId === "locais")?.valorEsperado ?? 0),
      metaAulasAno: Number(metas.find((m) => m.entidadeId === "sessoes")?.valorEsperado ?? 0),
      metaFrequenciaMinima: Number(metas.find((m) => m.entidadeId === "frequencia")?.valorEsperado ?? 75),
      metaVulnerabilidadeMinima: Number(metas.find((m) => m.entidadeId === "vulnerabilidade")?.valorEsperado ?? 70),
      metaEventosAno: Number(metas.find((m) => m.entidadeId === "eventos")?.valorEsperado ?? 0),
      metaReunioesAno: Number(metas.find((m) => m.entidadeId === "reunioes")?.valorEsperado ?? 0),
      tipoDuracao,
      dataEvento: tipoDuracao === "pontual" ? ((formData.get("dataEvento") as string) || null) : null,
      dataInicio: tipoDuracao === "periodo" ? ((formData.get("dataInicio") as string) || null) : null,
      dataTermino: tipoDuracao === "periodo" ? ((formData.get("dataTermino") as string) || null) : null,
      status: (formData.get("status") as string) || "ativo",
      cargosPrevistos: cargos.filter((c) => c.cargoNome && c.cargoNome.trim() !== ""),
      termoGrupo: (formData.get("termoGrupo") as string)?.trim() || "Grupo",
      termoSessao: (formData.get("termoSessao") as string)?.trim() || "Sessão",
      termoResponsavel: (formData.get("termoResponsavel") as string)?.trim() || "Professor",
      termoParticipante: (formData.get("termoParticipante") as string)?.trim() || "Beneficiário",
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
              <Link
                href="/concedentes"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shrink-0 shadow-2xs"
                title="Abrir área de Órgãos Concedentes em nova aba"
              >
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                Ver Concedentes
              </Link>
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

      {/* 3. Metas Pactuadas no Plano de Trabalho (Dinâmico) */}
      <FormSection title="3. Metas Pactuadas no Plano de Trabalho">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500">
            Defina as metas quantitativas pactuadas no Plano de Trabalho vinculadas às entidades do sistema.
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2 w-56">Entidade / Dimensão</th>
                  <th className="px-3 py-2">Descrição / Indicador da Meta</th>
                  <th className="px-3 py-2 w-48">Unidade de Medida</th>
                  <th className="px-3 py-2 w-36">Meta Esperada</th>
                  <th className="px-3 py-2 w-12 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {metas.map((meta, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="p-2">
                      <select
                        value={meta.entidadeId ?? "participantes"}
                        onChange={(e) => handleMetaChange(idx, "entidadeId", e.target.value)}
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      >
                        {METAS_CATALOGO_ENTIDADES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <Input
                        value={meta.titulo ?? ""}
                        onChange={(e) => handleMetaChange(idx, "titulo", e.target.value)}
                        placeholder="Ex: Beneficiários Atendidos / Matriculados"
                        className="text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={meta.unidade ?? "Quantidade (Unidades)"}
                        onChange={(e) => handleMetaChange(idx, "unidade", e.target.value)}
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      >
                        {METAS_UNIDADES_MEDIDA.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="any"
                        value={meta.valorEsperado ?? 0}
                        onChange={(e) => handleMetaChange(idx, "valorEsperado", Number(e.target.value))}
                        className="text-xs font-semibold text-zinc-900"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveMeta(idx)}
                        className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Remover meta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {metas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-zinc-500">
                      Nenhuma meta configurada. Clique no botão abaixo para adicionar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-zinc-500">
              Total de metas pactuadas: <strong className="text-zinc-700">{metas.length}</strong>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMeta}
              className="gap-1.5 text-xs text-zinc-700 hover:text-zinc-900 border-zinc-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Meta
            </Button>
          </div>
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

      {/* 6. Vocabulário e Terminologia do Projeto */}
      <FormSection title="6. Vocabulário e Terminologia do Projeto">
        <p className="text-xs text-zinc-500 mb-4">
          Defina como as entidades serão chamadas na interface do sistema (menus, tabelas, cabeçalhos e relatórios) quando este projeto estiver ativo.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Termo para Turma / Grupo" required>
            <Input
              name="termoGrupo"
              defaultValue={o?.termoGrupo ?? "Grupo"}
              placeholder="Ex: Turma, Grupo, Equipe, Pelotão"
            />
          </Field>
          <Field label="Termo para Aula / Treino / Sessão" required>
            <Input
              name="termoSessao"
              defaultValue={o?.termoSessao ?? "Sessão"}
              placeholder="Ex: Treino, Aula, Oficina, Encontro, Sessão"
            />
          </Field>
          <Field label="Termo para Professor / Instrutor" required>
            <Input
              name="termoResponsavel"
              defaultValue={o?.termoResponsavel ?? "Professor"}
              placeholder="Ex: Professor, Instrutor, Educador, Treinador"
            />
          </Field>
          <Field label="Termo para Aluno / Beneficiário" required>
            <Input
              name="termoParticipante"
              defaultValue={o?.termoParticipante ?? "Beneficiário"}
              placeholder="Ex: Aluno, Atleta, Beneficiário, Educando, Participante"
            />
          </Field>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : o ? "Salvar Alterações" : "Cadastrar Objeto"}
        </Button>
      </div>
    </form>
  );
}
