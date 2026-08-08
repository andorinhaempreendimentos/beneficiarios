"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, User, ArrowUpRight } from "lucide-react";
import {
  Button,
  Field,
  FileUpload,
  FormSection,
  Input,
  LinkButton,
  RadioGroup,
  Select,
  Textarea,
} from "@/components/ui";
import type { Anexo, Beneficiario, PerguntaParQ, VinculoTurma } from "@/lib/types";
import { beneficiariosApi, turmasApi, type NucleoApi, type TurmaApi } from "@/lib/api/services";
import { validarCpf, validarCep, validarEmail } from "@/lib/mascaras";
import { normalizarStatusBeneficiario, STATUS_BENEFICIARIO_OPCOES } from "@/lib/status";

const PERGUNTAS_PARQ = [
  "Algum médico já disse que você possui um problema de coração e recomendou que você só praticasse atividade física supervisionado?",
  "Você sente dor no peito quando pratica atividade física?",
  "No último mês, você sentiu dor no peito quando não estava praticando atividade física?",
  "Você perde o equilíbrio devido a tontura ou já perdeu a consciência?",
  "Você tem algum problema ósseo ou articular que poderia ser piorado por uma mudança na atividade física?",
  "Você toma atualmente algum medicamento para pressão arterial ou problema de coração?",
  "Sabe de alguma outra razão pela qual você não deveria praticar atividade física?",
  "Você tem diabetes controlada com insulina?",
  "Você tem mais de 65 anos e não está acostumado a praticar atividade física?",
  "Está gestante ou suspeita estar gestante?",
];

interface BeneficiarioFormProps {
  beneficiario?: Beneficiario;
  nucleos?: NucleoApi[];
  turmas?: TurmaApi[];
  backHref: string;
}

export function BeneficiarioForm({ beneficiario: b, nucleos = [], turmas = [], backHref }: BeneficiarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sexo, setSexo] = useState(b?.sexo || "Masculino");
  const [pcd, setPcd] = useState(b?.pcd ?? false);
  const [vinculos, setVinculos] = useState<VinculoTurma[]>(b?.turmas ?? []);
  const [anexos, setAnexos] = useState<Anexo[]>(b?.anexos ?? []);
  const [parQ, setParQ] = useState<PerguntaParQ[]>(
    b?.parQ?.length ? b.parQ : PERGUNTAS_PARQ.map((p) => ({ pergunta: p }))
  );
  const algumaRespostaSim = parQ.some((p) => p.resposta === "Sim");

  const [cep, setCep] = useState(b?.cep ?? "");
  const [logradouro, setLogradouro] = useState(b?.logradouro ?? "");
  const [bairro, setBairro] = useState(b?.bairro ?? "");
  const [cidade, setCidade] = useState(b?.cidade ?? "");
  const [estado, setEstado] = useState(b?.estado ?? "");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [nucleoId, setNucleoId] = useState(b?.nucleoId ?? "");

  const nucleoSelectRef = useRef<HTMLSelectElement>(null);
  const [alertaNucleoDestaque, setAlertaNucleoDestaque] = useState(false);

  function rolarESelecionarNucleo() {
    setAlertaNucleoDestaque(true);
    if (nucleoSelectRef.current) {
      nucleoSelectRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      nucleoSelectRef.current.focus();
    }
    setTimeout(() => {
      setAlertaNucleoDestaque(false);
    }, 4000);
  }

  // Se nenhum núcleo for selecionado no Passo 1, NENHUMA turma estará disponível
  const turmasFiltradas = nucleoId
    ? turmas.filter((t) => t.nucleoId === nucleoId)
    : [];

  async function handleCepBlur() {
    if (!cep) return;
    setBuscandoCep(true);
    const { buscarEnderecoPorCep } = await import("@/lib/cep");
    const res = await buscarEnderecoPorCep(cep);
    if (res) {
      if (res.logradouro) setLogradouro(res.logradouro);
      if (res.bairro) setBairro(res.bairro);
      if (res.localidade) setCidade(res.localidade);
      if (res.uf) setEstado(res.uf);
    }
    setBuscandoCep(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const cpf = String(formData.get("cpf") || "");
    const cep = String(formData.get("cep") || "");
    const email = String(formData.get("email") || "");

    if (cpf && !validarCpf(cpf)) {
      setErro("CPF inválido. Por favor, verifique o número digitado.");
      setLoading(false);
      return;
    }

    if (email && !validarEmail(email)) {
      setErro("Endereço de e-mail inválido. Utilize o formato termo1@termo2.termo3.");
      setLoading(false);
      return;
    }

    if (cep && !validarCep(cep)) {
      setErro("CEP inválido. Deve conter exatamente 8 dígitos.");
      setLoading(false);
      return;
    }

    const data: Record<string, unknown> = {
      nomeCompleto: formData.get("nomeCompleto"),
      nomeSocial: formData.get("nomeSocial"),
      dataNascimento: formData.get("dataNascimento"),
      sexo: formData.get("sexo"),
      cpf,
      rg: formData.get("rg"),
      orgaoEmissor: formData.get("orgaoEmissor"),
      celular: formData.get("celular"),
      telefoneRecado: formData.get("telefoneRecado"),
      cep,
      logradouro: formData.get("logradouro"),
      numero: formData.get("numero"),
      bairro: formData.get("bairro"),
      cidade: formData.get("cidade"),
      estado: formData.get("estado"),
      pcd,
      tipoPcd: formData.get("tipoPcd"),
      nucleoId: formData.get("nucleoId"),
      status: normalizarStatusBeneficiario(formData.get("status") as string | null),
    };

    try {
      let benSavedId = b?.id;
      if (benSavedId) {
        await beneficiariosApi.update(benSavedId, data);
      } else {
        // Cadastro pelo painel é sempre origem interna; a inscrição pública grava 'online'.
        const created = await beneficiariosApi.create({ ...data, tipoMatricula: "interna" });
        benSavedId = created.id;
      }

      // Sincroniza/Matricula nas turmas selecionadas
      if (benSavedId && vinculos.length > 0) {
        for (const v of vinculos) {
          if (v.turmaId) {
            await turmasApi.matricular(v.turmaId, benSavedId).catch((err) => {
              console.warn("Aviso ao matricular na turma:", err);
            });
          }
        }
      }

      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar beneficiário.");
    } finally {
      setLoading(false);
    }
  }

  function adicionarTurma() {
    setVinculos((v) => [...v, { turmaId: "", status: "Ativo", dataRegistro: "" }]);
  }

  function removerTurma(index: number) {
    setVinculos((v) => v.filter((_, i) => i !== index));
  }

  function adicionarAnexo() {
    setAnexos((a) => [...a, { id: `novo-${a.length}`, descricao: "", arquivoUrl: "" }]);
  }

  function removerAnexo(index: number) {
    setAnexos((a) => a.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}
      <FormSection title="1. Identificação do Beneficiário">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Foto" className="lg:col-span-3 sm:max-w-xs">
            {b?.fotoUrl ? (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100">
                <User className="h-10 w-10 text-zinc-400" />
              </div>
            ) : (
              <FileUpload label="Enviar foto de perfil" />
            )}
          </Field>
          <Field label="Nome completo" required>
            <Input name="nomeCompleto" defaultValue={b?.nomeCompleto} />
          </Field>
          <Field label="Nome social">
            <Input name="nomeSocial" defaultValue={b?.nomeSocial} />
          </Field>
          <Field label="Data de Nasc." required>
            <Input type="date" name="dataNascimento" defaultValue={b?.dataNascimento} />
          </Field>
          <Field label="Raça">
            <Select name="raca" defaultValue={b?.raca ?? ""}>
              <option value="">Selecione</option>
              <option>Preta</option>
              <option>Parda</option>
              <option>Branca</option>
              <option>Amarela</option>
              <option>Indígena</option>
              <option>Outras</option>
            </Select>
          </Field>
          <Field label="Sexo" required>
            <RadioGroup
              name="sexo"
              options={["Masculino", "Feminino", "Não Informar"]}
              defaultValue={b?.sexo || "Masculino"}
              value={sexo}
              onChange={(v) => setSexo(v as any)}
            />
          </Field>
          <Field label="Data de cadastro" required>
            <Input type="date" name="dataCadastro" defaultValue={b?.dataCadastro} />
          </Field>
          <Field label="PCD" required>
            <RadioGroup
              name="pcd"
              options={["Sim", "Não"]}
              value={pcd ? "Sim" : "Não"}
              onChange={(v) => setPcd(v === "Sim")}
            />
          </Field>
          {pcd && (
            <Field label="Tipo de PCD">
              <Select name="tipoPcd" defaultValue={b?.tipoPcd ?? ""}>
                <option value="">Selecione</option>
                <option>Deficiência Visual</option>
                <option>Deficiência Auditiva</option>
                <option>Deficiência Física</option>
                <option>Deficiência Mental/Intelectual</option>
                <option>Deficiência Múltipla</option>
                <option>Surdocegueira</option>
                <option>Autismo (Leve)</option>
                <option>Autismo (Moderado)</option>
                <option>Autismo (Severo)</option>
                <option>Síndrome de Down</option>
                <option>Outros</option>
              </Select>
            </Field>
          )}
          <Field label="Núcleo Esportivo (Polo)" required>
            <Select
              ref={nucleoSelectRef}
              name="nucleoId"
              value={nucleoId}
              onChange={(e) => setNucleoId(e.target.value)}
              className={alertaNucleoDestaque ? "ring-4 ring-amber-500 border-amber-600 bg-amber-50 animate-bounce" : ""}
            >
              <option value="">Selecione o Núcleo Esportivo</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={normalizarStatusBeneficiario(b?.status)}>
              {STATUS_BENEFICIARIO_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Perfil Socioeconômico" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Comorbidades">
            <Select name="comorbidades" defaultValue={b?.comorbidades ?? ""}>
              <option value="">Selecione</option>
              <option>Hipertensão</option>
              <option>Diabete</option>
              <option>Doença cardíaca</option>
              <option>Doença renal crônica</option>
              <option>Doença pulmonar crônica</option>
              <option>Obesidade mórbida</option>
              <option>Nenhuma das anteriores</option>
            </Select>
          </Field>
          <Field label="Nível de escolaridade">
            <Select name="nivelEscolaridade" defaultValue={b?.nivelEscolaridade ?? ""}>
              <option value="">Selecione</option>
              <option>Sem educação formal</option>
              <option>Pré-escola</option>
              <option>Ensino Fundamental</option>
              <option>Ensino Médio</option>
              <option>EJA</option>
              <option>Ensino Técnico</option>
              <option>Ensino Superior</option>
              <option>Pós-graduação</option>
            </Select>
          </Field>
          <Field label="Ocupação atual">
            <Select name="ocupacaoAtual" defaultValue={b?.ocupacaoAtual ?? ""}>
              <option value="">Selecione</option>
              <option>Aposentado/pensionista</option>
              <option>Autônomo</option>
              <option>Desempregado</option>
              <option>Empregado</option>
              <option>Estudante</option>
              <option>Trabalho doméstico não remunerado</option>
              <option>Outro</option>
            </Select>
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Situação da moradia">
            <Select name="situacaoMoradia" defaultValue={b?.situacaoMoradia ?? ""}>
              <option value="">Selecione</option>
              <option>Própria quitada</option>
              <option>Própria financiada</option>
              <option>Alugada</option>
              <option>Cedida por parentes/amigos</option>
              <option>Outra</option>
            </Select>
          </Field>
          <Field label="Benefício socioassistencial">
            <Select name="beneficioSocioassistencial" defaultValue={b?.beneficioSocioassistencial ?? ""}>
              <option value="">Não</option>
              <option>Bolsa Família</option>
              <option>Aluguel social</option>
              <option>Auxílio-reclusão</option>
              <option>BPC</option>
              <option>Minha casa minha vida</option>
              <option>Benefício incapacidade temporária</option>
              <option>Auxílio-acidente</option>
              <option>Salário-família</option>
              <option>Outro</option>
            </Select>
          </Field>
          <Field label="Nº de pessoas em casa">
            <Select name="pessoasEmCasa" defaultValue="">
              <option value="">Selecione</option>
              <option>2 pessoas</option>
              <option>3 pessoas</option>
              <option>4 pessoas</option>
              <option>4 pessoas ou mais</option>
              <option>Sozinho</option>
            </Select>
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Telefone residencial">
            <Input name="telefoneResidencial" mask="telefone" defaultValue={b?.telefoneResidencial} />
          </Field>
          <Field label="Celular" required>
            <Input name="celular" mask="telefone" defaultValue={b?.celular} />
          </Field>
          <Field label="Email">
            <Input type="email" name="email" defaultValue={b?.email} />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Razões para inscrição">
            <Textarea name="razoesInscricao" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Observações">
            <Textarea name="observacoes" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="2. Endereço do Beneficiário">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CEP" required>
            <Input
              name="cep"
              mask="cep"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={handleCepBlur}
              placeholder="00000-000"
            />
          </Field>
          <Field label="Logradouro" required className="lg:col-span-2">
            <Input
              name="logradouro"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
            />
          </Field>
          <Field label="Número" required>
            <Input name="numero" defaultValue={b?.numero} />
          </Field>
          <Field label="Complemento">
            <Input name="complemento" defaultValue={b?.complemento} />
          </Field>
          <Field label="Bairro" required>
            <Input
              name="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
          </Field>
          <Field label="Cidade" required>
            <Input
              name="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
          </Field>
          <Field label="Estado" required>
            <Input
              name="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="3. Documentação do Beneficiário" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="RG">
            <Input name="rg" defaultValue={b?.rg} />
          </Field>
          <Field label="Órgão Expedidor">
            <Select name="orgaoExpedidor" defaultValue="">
              <option value="">Selecione</option>
              {["DETRAN", "DIC", "IFP", "MM", "PMERJ", "MA", "ME", "CBM", "IPF", "MT", "CREA", "CRM", "SSP", "CRA", "OAB", "OUTROS"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <Field label="UF">
            <Input name="ufExpedidor" />
          </Field>
          <Field label="Nome do Pai">
            <Input name="nomePai" />
          </Field>
          <Field label="Nome da Mãe">
            <Input name="nomeMae" />
          </Field>
          <Field label="CPF">
            <Input name="cpf" mask="cpf" defaultValue={b?.cpf} placeholder="000.000.000-00" />
          </Field>
          <Field label="Número do NIS">
            <Input name="numeroNis" mask="numeros" defaultValue={b?.numeroNis} />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Mora com">
            <RadioGroup name="moraCom" options={["Pais", "Pai", "Mãe", "Avós", "Parentes", "Outros"]} />
          </Field>
          <Field label="Tamanho do uniforme">
            <RadioGroup name="tamanhoUniforme" options={["PP", "P", "M", "G", "GG", "XG"]} />
          </Field>
          <Field label="Uniforme Entregue?">
            <RadioGroup name="uniformeEntregue" options={["Sim", "Não"]} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="4. Documentação do Responsável" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome do responsável">
            <Input name="nomeResponsavel" defaultValue={b?.nomeResponsavel} />
          </Field>
          <Field label="Email do responsável">
            <Input type="email" name="emailResponsavel" defaultValue={b?.emailResponsavel} />
          </Field>
          <Field label="RG do responsável">
            <Input name="rgResponsavel" defaultValue={b?.rgResponsavel} />
          </Field>
          <Field label="CPF do responsável">
            <Input name="cpfResponsavel" mask="cpf" defaultValue={b?.cpfResponsavel} placeholder="000.000.000-00" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="5. Atividades e Turmas">
        {!nucleoId ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold text-xl shadow-xs">
                ⚠️
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  Seleção de Núcleo Obrigatória
                </h4>
                <p className="text-xs text-amber-800 font-medium mt-0.5">
                  Não é possível exibir ou vincular turmas sem selecionar um <strong>Núcleo Esportivo (Polo)</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={rolarESelecionarNucleo}
              className="flex items-center gap-2 shrink-0 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>Selecionar Núcleo Agora</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {vinculos.map((v, index) => {
              const turmaObjeto = turmas.find((t) => t.id === v.turmaId);
              const nucleoObjeto = nucleos.find((n) => n.id === (turmaObjeto?.nucleoId || nucleoId));

              return (
                <div key={index} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <Field label="Turma / Modalidade" required>
                      <Select
                        value={v.turmaId}
                        onChange={(e) => {
                          const novaTurmaId = e.target.value;
                          setVinculos((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, turmaId: novaTurmaId } : item))
                          );
                        }}
                      >
                        <option value="">Selecione a turma</option>
                        {turmasFiltradas.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Status da Matrícula">
                      <Select
                        value={v.status}
                        onChange={(e) => {
                          const novoStatus = e.target.value as "Ativo" | "Evadido";
                          setVinculos((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, status: novoStatus } : item))
                          );
                        }}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Evadido">Evadido</option>
                      </Select>
                    </Field>
                    <Field label="Data de Matrícula">
                      <Input
                        type="date"
                        value={v.dataRegistro}
                        onChange={(e) => {
                          const novaData = e.target.value;
                          setVinculos((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, dataRegistro: novaData } : item))
                          );
                        }}
                      />
                    </Field>
                    <div className="flex items-end">
                      <Button type="button" variant="danger" size="sm" onClick={() => removerTurma(index)}>
                        <Trash2 className="h-4 w-4" /> Remover turma
                      </Button>
                    </div>
                  </div>

                  {/* Informações detalhadas do Núcleo vinculadas à Turma Selecionada */}
                  {turmaObjeto && nucleoObjeto && (
                    <div className="mt-1 rounded-xl bg-sky-50/80 p-3.5 border border-sky-200/80 text-xs text-sky-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white font-bold text-xs">
                          📍
                        </span>
                        <div>
                          <span className="font-extrabold text-sky-950 block">
                            Polo: {nucleoObjeto.identificacao}
                          </span>
                          <span className="text-[11px] text-sky-700 font-medium">
                            {nucleoObjeto.cidade ? `${nucleoObjeto.cidade}` : "Polo Esportivo Ativo"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-semibold text-sky-800">
                        {turmaObjeto.vagasTotais > 0 && (
                          <span className="bg-sky-200/70 px-2.5 py-1 rounded-lg">
                            👥 Vagas Totais: {turmaObjeto.vagasTotais}
                          </span>
                        )}
                        {turmaObjeto.exclusiva && (
                          <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-bold">
                            ⭐ Turma Exclusiva
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <Button type="button" variant="outline" size="sm" className="self-start mt-1" onClick={adicionarTurma}>
              <Plus className="h-4 w-4" /> Vincular a uma Turma
            </Button>
          </div>
        )}
      </FormSection>

      <FormSection title="6. PAR-Q (Questionário de Prontidão para Atividade Física)" defaultOpen={false}>
        <div className="flex flex-col divide-y divide-zinc-100">
          {parQ.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-3">
              <p className="text-sm text-zinc-700">{index + 1}. {item.pergunta}</p>
              <RadioGroup
                name={`parq-${index}`}
                options={["Sim", "Não"]}
                value={item.resposta}
                onChange={(v) =>
                  setParQ((prev) =>
                    prev.map((p, i) => (i === index ? { ...p, resposta: v as "Sim" | "Não" } : p))
                  )
                }
              />
            </div>
          ))}
        </div>
        {algumaRespostaSim && (
          <div className="mt-4">
            <Field label="Atestado Médico" hint="Obrigatório devido a resposta 'Sim' no PAR-Q">
              <FileUpload label="Enviar atestado médico" />
            </Field>
          </div>
        )}
      </FormSection>

      <FormSection title="7. Rede de Ensino" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Rede de ensino">
            <Select name="redeEnsino" defaultValue={b?.redeEnsino ?? ""}>
              <option value="">Selecione</option>
              <option>Estadual</option>
              <option>Particular</option>
              <option>Municipal</option>
              <option>Filantrópica</option>
              <option>Federal</option>
              <option>Militar</option>
              <option>Não estuda</option>
            </Select>
          </Field>
          <Field label="Nome da escola">
            <Select name="nomeEscola" defaultValue="">
              <option value="">Selecione a escola</option>
            </Select>
          </Field>
          <Field label="Turno">
            <Select name="turno" defaultValue={b?.turno ?? ""}>
              <option value="">Selecione</option>
              <option>Manhã</option>
              <option>Tarde</option>
              <option>Noite</option>
              <option>Integral</option>
            </Select>
          </Field>
          <Field label="Segmento">
            <Select name="segmento" defaultValue="">
              <option value="">Selecione</option>
              <option>Educação Infantil</option>
              <option>Fundamental I/II</option>
              <option>Ensino Médio</option>
              <option>Ensino Superior</option>
              <option>Projeto Estratégico</option>
              <option>Autonomia</option>
              <option>Realfa</option>
              <option>NSN</option>
              <option>PCD</option>
            </Select>
          </Field>
          <Field label="Série">
            <Input name="serie" defaultValue={b?.serie} />
          </Field>
          <Field label="Turma">
            <Input name="turmaEscolar" defaultValue={b?.turmaEscolar} />
          </Field>
          <Field label="Código do Atleta">
            <Input name="codigoAtleta" defaultValue={b?.codigoAtleta} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="8. Gerenciar Anexos" defaultOpen={false}>
        <div className="flex flex-col gap-4">
          {anexos.map((anexo, index) => (
            <div key={anexo.id} className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-3">
              <Field label="Descrição do Anexo">
                <Input defaultValue={anexo.descricao} placeholder="Ex: Comprovante de residência" />
              </Field>
              <Field label="Documento" required>
                <FileUpload />
              </Field>
              <div className="flex items-end">
                <Button type="button" variant="danger" size="sm" onClick={() => removerAnexo(index)}>
                  <Trash2 className="h-4 w-4" /> Remover anexo
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={adicionarAnexo}>
            <Plus className="h-4 w-4" /> Novo anexo
          </Button>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit">{b ? "Salvar" : "Cadastrar Aluno"}</Button>
      </div>
    </form>
  );
}
