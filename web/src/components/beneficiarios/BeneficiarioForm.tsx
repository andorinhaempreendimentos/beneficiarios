"use client";

import { useState } from "react";
import { z } from "zod";
import { Plus, Trash2, User, AlertCircle, HeartPulse, ShieldCheck, Shirt, School, Home, Users } from "lucide-react";
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
import { useDicionario } from "@/components/providers/DictionaryProvider";

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

const OPCOES_TAMANHO_UNIFORME = [
  "8", "10", "12", "14", "16", "PP", "P", "M", "G", "GG", "EGG"
];

const beneficiarioSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória."),
  sexo: z.string().min(1, "Sexo é obrigatório."),
});

type FieldErrors = Partial<Record<string, string>>;

interface BeneficiarioFormProps {
  beneficiario?: Beneficiario;
  nucleos?: NucleoApi[];
  turmas?: TurmaApi[];
  backHref: string;
}

export function BeneficiarioForm({ beneficiario: b, nucleos = [], turmas = [], backHref }: BeneficiarioFormProps) {
  const { t } = useDicionario();
  const termoBeneficiario = t("termoBeneficiario", "Beneficiário");
  const termoTurma = t("termoTurma", "Turma");
  const termoTurmas = t("termoTurmas", "Turmas");
  const termoLocal = t("termoLocal", "Núcleo");
  const termoResponsavel = t("termoResponsavel", "Responsável");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // 1. Atleta & Uniforme
  const [sexo, setSexo] = useState(b?.sexo || "Masculino");
  const [pcd, setPcd] = useState(b?.pcd ?? false);
  const [tamanhoUniforme, setTamanhoUniforme] = useState(b?.tamanhoUniforme || "12");
  const [uniformeEntregue, setUniformeEntregue] = useState(b?.uniformeEntregue ?? false);

  // 2. Endereço
  const [cep, setCep] = useState(b?.cep ?? "");
  const [logradouro, setLogradouro] = useState(b?.logradouro ?? "");
  const [bairro, setBairro] = useState(b?.bairro ?? "");
  const [cidade, setCidade] = useState(b?.cidade ?? "Palmas");
  const [estado, setEstado] = useState(b?.estado ?? "TO");
  const [buscandoCep, setBuscandoCep] = useState(false);

  // 3. Família & Responsável
  const [moraCom, setMoraCom] = useState(b?.moraCom || "Pais");

  // 4. Saúde & PAR-Q
  const [peso, setPeso] = useState<string>(
    b?.anamneseDados?.peso != null ? String(b.anamneseDados.peso) : ""
  );
  const [altura, setAltura] = useState<string>(
    b?.anamneseDados?.altura != null ? String(b.anamneseDados.altura) : ""
  );
  const [tipoSanguineo, setTipoSanguineo] = useState<string>(
    (b?.anamneseDados?.tipoSanguineo as string) || ""
  );
  const [acompanhamentoUbs, setAcompanhamentoUbs] = useState(
    b?.anamneseDados?.acompanhamentoUbs === true ? "Sim" : "Não"
  );
  const [autorizacaoImagem, setAutorizacaoImagem] = useState(
    b?.anamneseDados?.autorizacaoImagem === false ? "Não" : "Sim"
  );

  const [parQ, setParQ] = useState<PerguntaParQ[]>(() => {
    if (b?.parQ?.length) return b.parQ;
    if (b?.anamneseDados?.parq?.length) return b.anamneseDados.parq;
    return PERGUNTAS_PARQ.map((p) => ({ pergunta: p, resposta: "Não" }));
  });
  const algumaRespostaSim = parQ.some((p) => p.resposta === "Sim");

  // Cálculo de IMC dinâmico
  const pNum = parseFloat(peso);
  const aNum = parseFloat(altura);
  const imcCalculado = pNum > 0 && aNum > 0 ? (pNum / (aNum * aNum)).toFixed(1) : null;

  // 5. Vínculos e Turmas
  const [vinculos, setVinculos] = useState<VinculoTurma[]>(() => {
    if (b?.turmas && b.turmas.length > 0) return b.turmas;
    if ((b as any)?.gruposInfo && (b as any).gruposInfo.length > 0) {
      return (b as any).gruposInfo.map((ti: any) => ({
        turmaId: ti.grupoId || ti.turmaId || "",
        status: "Ativo",
        dataRegistro: "",
      }));
    }
    if ((b as any)?.turmasInfo && (b as any).turmasInfo.length > 0) {
      return (b as any).turmasInfo.map((ti: any) => ({
        turmaId: ti.grupoId || ti.turmaId || "",
        status: "Ativo",
        dataRegistro: "",
      }));
    }
    return [];
  });
  const [anexos, setAnexos] = useState<Anexo[]>(b?.anexos ?? []);

  const initialNucleoId = b?.nucleoId ||
    (b as any)?.gruposInfo?.[0]?.nucleoId ||
    (b as any)?.turmasInfo?.[0]?.nucleoId ||
    (b as any)?.turmas?.[0]?.nucleoId ||
    "";
  const [nucleoId, setNucleoId] = useState(initialNucleoId);

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
    const cpf = String(formData.get("cpf") || "").trim();
    const cepVal = String(formData.get("cep") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const cpfResp = String(formData.get("cpfResponsavel") || "").trim();

    if (cpf && !validarCpf(cpf)) {
      setErro("CPF do aluno inválido. Por favor, verifique os 11 dígitos.");
      setLoading(false);
      return;
    }

    if (cpfResp && !validarCpf(cpfResp)) {
      setErro("CPF do responsável inválido. Por favor, verifique os 11 dígitos.");
      setLoading(false);
      return;
    }

    if (email && !validarEmail(email)) {
      setErro("Endereço de e-mail inválido. Utilize o formato nome@dominio.com.");
      setLoading(false);
      return;
    }

    if (cepVal && !validarCep(cepVal)) {
      setErro("CEP inválido. Deve conter exatamente 8 dígitos.");
      setLoading(false);
      return;
    }

    // Estrutura flexível da Anamnese (Modelo 1 + Modelo 2)
    const anamneseDados = {
      peso: pNum > 0 ? pNum : null,
      altura: aNum > 0 ? aNum : null,
      imc: imcCalculado ? parseFloat(imcCalculado) : null,
      tipoSanguineo: tipoSanguineo || null,
      acompanhamentoUbs: acompanhamentoUbs === "Sim",
      nomeCamisa: String(formData.get("nomeCamisa") || "").trim() || null,
      numeroCamisa: formData.get("numeroCamisa") ? Number(formData.get("numeroCamisa")) : null,
      autorizacaoImagem: autorizacaoImagem === "Sim",
      parentescoResponsavel: String(formData.get("parentescoResponsavel") || "").trim() || null,
      contatoEmergencia: {
        nome: String(formData.get("emergenciaNome") || "").trim() || null,
        parentesco: String(formData.get("emergenciaParentesco") || "").trim() || null,
        telefone: String(formData.get("emergenciaTelefone") || "").trim() || null,
      },
      parq: parQ,
    };

    // Payload completo mapeado para as 58 colunas do Supabase + JSONB
    const data: Record<string, unknown> = {
      // 1. Dados Básicos do Aluno
      nomeCompleto: String(formData.get("nomeCompleto") || "").trim(),
      nomeSocial: String(formData.get("nomeSocial") || "").trim() || null,
      dataNascimento: String(formData.get("dataNascimento") || "").trim(),
      sexo,
      raca: String(formData.get("raca") || "").trim() || null,
      cpf: cpf || null,
      rg: String(formData.get("rg") || "").trim() || null,
      orgaoExpedidor: String(formData.get("orgaoExpedidor") || "").trim() || null,
      ufExpedidor: String(formData.get("ufExpedidor") || "").trim() || null,
      numeroNis: String(formData.get("numeroNis") || "").trim() || null,
      pcd,
      tipoPcd: pcd ? String(formData.get("tipoPcd") || "").trim() || null : null,

      // Uniforme
      tamanhoUniforme,
      uniformeEntregue,

      // 2. Endereço e Contatos
      cep: cepVal || null,
      logradouro: logradouro || null,
      numero: String(formData.get("numero") || "").trim() || null,
      complemento: String(formData.get("complemento") || "").trim() || null,
      bairro: bairro || null,
      cidade: cidade || "Palmas",
      estado: estado || "TO",
      celular: String(formData.get("celular") || "").trim() || null,
      telefoneResidencial: String(formData.get("telefoneResidencial") || "").trim() || null,
      email: email || null,

      // 3. Família e Responsável
      nomeResponsavel: String(formData.get("nomeResponsavel") || "").trim() || null,
      cpfResponsavel: cpfResp || null,
      rgResponsavel: String(formData.get("rgResponsavel") || "").trim() || null,
      celularResponsavel: String(formData.get("celularResponsavel") || "").trim() || null,
      emailResponsavel: String(formData.get("emailResponsavel") || "").trim() || null,
      nomeMae: String(formData.get("nomeMae") || "").trim() || null,
      nomePai: String(formData.get("nomePai") || "").trim() || null,
      moraCom,
      pessoasEmCasa: String(formData.get("pessoasEmCasa") || "").trim() || null,
      situacaoMoradia: String(formData.get("situacaoMoradia") || "").trim() || null,
      beneficioSocioassistencial: String(formData.get("beneficioSocioassistencial") || "").trim() || null,
      ocupacaoAtual: String(formData.get("ocupacaoAtual") || "").trim() || null,

      // 4. Vida Escolar
      redeEnsino: String(formData.get("redeEnsino") || "").trim() || null,
      nomeEscola: String(formData.get("nomeEscola") || "").trim() || null,
      turnoEscolar: String(formData.get("turnoEscolar") || "").trim() || null,
      segmentoEscolar: String(formData.get("segmentoEscolar") || "").trim() || null,
      serie: String(formData.get("serie") || "").trim() || null,
      turmaEscolar: String(formData.get("turmaEscolar") || "").trim() || null,
      codigoAtleta: String(formData.get("codigoAtleta") || "").trim() || null,
      nivelEscolaridade: String(formData.get("nivelEscolaridade") || "").trim() || null,

      // 5. Saúde e Observações
      comorbidades: String(formData.get("comorbidades") || "").trim() || null,
      razoesInscricao: String(formData.get("razoesInscricao") || "").trim() || null,
      observacoes: String(formData.get("observacoes") || "").trim() || null,

      // 6. Núcleo, Status e Anamnese JSONB
      nucleoId: String(formData.get("nucleoId") || "").trim() || null,
      status: normalizarStatusBeneficiario(formData.get("status") as string | null),
      anamneseDados,
    };

    const validation = beneficiarioSchema.safeParse(data);
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
      let benSavedId = b?.id;
      if (benSavedId) {
        await beneficiariosApi.update(benSavedId, data);
      } else {
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
      setErro(err.message || `Erro ao salvar ${termoBeneficiario.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }

  function adicionarTurma() {
    setVinculos((v) => [...v, { grupoId: "", turmaId: "", status: "Ativo", dataRegistro: "" }]);
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <span>{erro}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SEÇÃO 1: IDENTIFICAÇÃO DO ALUNO & UNIFORME
      ───────────────────────────────────────────────────────────── */}
      <FormSection title={`1. Identificação do(a) ${termoBeneficiario} & Uniforme`} defaultOpen={true}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Foto do Perfil" className="lg:col-span-3 sm:max-w-xs">
            {b?.fotoUrl ? (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <User className="h-10 w-10 text-zinc-400" />
              </div>
            ) : (
              <FileUpload label="Enviar foto do beneficiário (3x4)" />
            )}
          </Field>

          <Field label="Nome Completo *" required error={fieldErrors.nomeCompleto}>
            <Input name="nomeCompleto" defaultValue={b?.nomeCompleto} placeholder="Nome civil completo" />
          </Field>

          <Field label="Nome Social / Apelido">
            <Input name="nomeSocial" defaultValue={b?.nomeSocial} placeholder="Como prefere ser chamado" />
          </Field>

          <Field label="Data de Nascimento *" required error={fieldErrors.dataNascimento}>
            <Input type="date" name="dataNascimento" defaultValue={b?.dataNascimento} />
          </Field>

          <Field label="Sexo *" required error={fieldErrors.sexo}>
            <RadioGroup
              name="sexo"
              options={["Masculino", "Feminino", "Outro", "Não Informar"]}
              defaultValue={b?.sexo || "Masculino"}
              value={sexo}
              onChange={(v) => setSexo(v as any)}
            />
          </Field>

          <Field label="Raça / Cor">
            <Select name="raca" defaultValue={b?.raca ?? ""}>
              <option value="">Selecione...</option>
              <option value="Branca">Branca</option>
              <option value="Preta">Preta</option>
              <option value="Parda">Parda</option>
              <option value="Indígena">Indígena</option>
              <option value="Amarela">Amarela</option>
              <option value="Outras">Outras</option>
            </Select>
          </Field>

          <Field label="CPF do Aluno">
            <Input name="cpf" mask="cpf" defaultValue={b?.cpf} placeholder="000.000.000-00" />
          </Field>

          <Field label="RG ou Certidão de Nascimento">
            <Input name="rg" defaultValue={b?.rg} placeholder="Número do documento" />
          </Field>

          <Field label="Órgão Expedidor">
            <Select name="orgaoExpedidor" defaultValue={b?.orgaoExpedidor ?? "SSP"}>
              <option value="">Selecione</option>
              {["SSP", "DETRAN", "DIC", "IFP", "CBM", "PC", "PM", "OUTROS"].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          </Field>

          <Field label="UF Expedidor">
            <Input name="ufExpedidor" defaultValue={b?.ufExpedidor ?? "TO"} maxLength={2} placeholder="TO" />
          </Field>

          <Field label="Número do NIS (CadÚnico)">
            <Input name="numeroNis" mask="numeros" defaultValue={b?.numeroNis} placeholder="Número NIS" />
          </Field>

          <Field label="PCD (Pessoa com Deficiência) *" required>
            <RadioGroup
              name="pcd"
              options={["Sim", "Não"]}
              value={pcd ? "Sim" : "Não"}
              onChange={(v) => setPcd(v === "Sim")}
            />
          </Field>

          {pcd && (
            <Field label="Tipo de PCD / Laudo">
              <Select name="tipoPcd" defaultValue={b?.tipoPcd ?? ""}>
                <option value="">Selecione</option>
                <option>Deficiência Física</option>
                <option>Deficiência Visual</option>
                <option>Deficiência Auditiva</option>
                <option>Deficiência Intelectual</option>
                <option>Autismo (TEA)</option>
                <option>Síndrome de Down</option>
                <option>Deficiência Múltipla</option>
                <option>Outros</option>
              </Select>
            </Field>
          )}
        </div>

        {/* Grade de Uniforme (Consolidação Modelo 2) */}
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              <Shirt className="h-4 w-4 text-blue-600" />
              <span>Especificações do Uniforme / Kit Esportivo</span>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={uniformeEntregue}
                onChange={(e) => setUniformeEntregue(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              Uniforme já entregue
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Tamanho da Camisa">
              <Select
                value={tamanhoUniforme}
                onChange={(e) => setTamanhoUniforme(e.target.value)}
              >
                {OPCOES_TAMANHO_UNIFORME.map((t) => (
                  <option key={t} value={t}>{t} {["8","10","12","14","16"].includes(t) ? "(Infantojuvenil)" : "(Adulto)"}</option>
                ))}
              </Select>
            </Field>

            <Field label="Nome Estampado na Camisa">
              <Input
                name="nomeCamisa"
                defaultValue={(b?.anamneseDados?.nomeCamisa as string) || ""}
                placeholder="Ex: PIETRO"
              />
            </Field>

            <Field label="Número Preferencial da Camisa">
              <Input
                name="numeroCamisa"
                type="number"
                defaultValue={(b?.anamneseDados?.numeroCamisa as number) || ""}
                placeholder="Ex: 10"
              />
            </Field>
          </div>
        </div>
      </FormSection>

      {/* ─────────────────────────────────────────────────────────────
          SEÇÃO 2: ENDEREÇO & CONTATOS
      ───────────────────────────────────────────────────────────── */}
      <FormSection title={`2. Endereço Residencial & Contatos`} defaultOpen={false}>
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
            {buscandoCep && <span className="text-xs text-blue-600">Buscando endereço...</span>}
          </Field>

          <Field label="Logradouro (Rua, Av., Alameda) *" required className="lg:col-span-2">
            <Input
              name="logradouro"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              placeholder="Ex: Rua 12, Qd 19"
            />
          </Field>

          <Field label="Número *" required>
            <Input name="numero" defaultValue={b?.numero} placeholder="Ex: Lt 22 / SN" />
          </Field>

          <Field label="Complemento">
            <Input name="complemento" defaultValue={b?.complemento} placeholder="Casa, Apto, Bloco" />
          </Field>

          <Field label="Bairro *" required>
            <Input
              name="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex: Sol Nascente"
            />
          </Field>

          <Field label="Cidade *" required>
            <Input
              name="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
          </Field>

          <Field label="Estado (UF) *" required>
            <Input
              name="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            />
          </Field>

          <Field label="WhatsApp / Celular Principal *" required>
            <Input name="celular" mask="telefone" defaultValue={b?.celular} placeholder="(63) 99999-9999" />
          </Field>

          <Field label="Telefone Fixo / Residencial">
            <Input name="telefoneResidencial" mask="telefone" defaultValue={b?.telefoneResidencial} placeholder="(63) 3215-0000" />
          </Field>

          <Field label="E-mail de Contato">
            <Input type="email" name="email" defaultValue={b?.email} placeholder="contato@exemplo.com" />
          </Field>
        </div>
      </FormSection>

      {/* ─────────────────────────────────────────────────────────────
          SEÇÃO 3: FAMÍLIA, RESPONSÁVEL & DADOS SOCIAIS
      ───────────────────────────────────────────────────────────── */}
      <FormSection title={`3. Família, ${termoResponsavel} Legal & Perfil Social`} defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={`Nome do(a) ${termoResponsavel} Legal`} className="sm:col-span-2">
            <Input name="nomeResponsavel" defaultValue={b?.nomeResponsavel} placeholder="Nome do pai, mãe ou tutor legal" />
          </Field>

          <Field label="Parentesco do Responsável">
            <Select
              name="parentescoResponsavel"
              defaultValue={(b?.anamneseDados?.parentescoResponsavel as string) || "Mãe"}
            >
              <option value="Mãe">Mãe</option>
              <option value="Pai">Pai</option>
              <option value="Avó/Avô">Avó / Avô</option>
              <option value="Tio/Tia">Tio / Tia</option>
              <option value="Outro">Outro Tutor Legal</option>
            </Select>
          </Field>

          <Field label={`CPF do ${termoResponsavel}`}>
            <Input name="cpfResponsavel" mask="cpf" defaultValue={b?.cpfResponsavel} placeholder="000.000.000-00" />
          </Field>

          <Field label={`RG do ${termoResponsavel}`}>
            <Input name="rgResponsavel" defaultValue={b?.rgResponsavel} placeholder="Número do RG" />
          </Field>

          <Field label={`WhatsApp / Celular do ${termoResponsavel}`}>
            <Input
              name="celularResponsavel"
              mask="telefone"
              defaultValue={b?.celularResponsavel}
              placeholder="(63) 99999-9999"
            />
          </Field>

          <Field label={`E-mail do ${termoResponsavel}`}>
            <Input type="email" name="emailResponsavel" defaultValue={b?.emailResponsavel} placeholder="responsavel@email.com" />
          </Field>

          <Field label="Nome da Mãe">
            <Input name="nomeMae" defaultValue={b?.nomeMae} placeholder="Nome completo da mãe" />
          </Field>

          <Field label="Nome do Pai">
            <Input name="nomePai" defaultValue={b?.nomePai} placeholder="Nome completo do pai" />
          </Field>

          <Field label="Com quem o aluno mora?">
            <RadioGroup
              name="moraCom"
              options={["Pais", "Pai", "Mãe", "Avós", "Outros"]}
              value={moraCom}
              onChange={(v) => setMoraCom(v)}
            />
          </Field>

          <Field label="Nº de Pessoas no Domicílio">
            <Select name="pessoasEmCasa" defaultValue={b?.pessoasEmCasa ?? ""}>
              <option value="">Selecione...</option>
              <option value="1">1 pessoa (apenas o aluno)</option>
              <option value="2">2 pessoas</option>
              <option value="3">3 pessoas</option>
              <option value="4">4 pessoas</option>
              <option value="5 ou mais">5 pessoas ou mais</option>
            </Select>
          </Field>

          <Field label="Situação da Moradia">
            <Select name="situacaoMoradia" defaultValue={b?.situacaoMoradia ?? ""}>
              <option value="">Selecione...</option>
              <option value="Própria quitada">Própria quitada</option>
              <option value="Própria financiada">Própria financiada</option>
              <option value="Alugada">Alugada</option>
              <option value="Cedida por parentes">Cedida por parentes</option>
              <option value="Outra">Outra</option>
            </Select>
          </Field>

          <Field label="Benefício Socioassistencial">
            <Select name="beneficioSocioassistencial" defaultValue={b?.beneficioSocioassistencial ?? ""}>
              <option value="">Nenhum</option>
              <option value="Bolsa Família">Bolsa Família</option>
              <option value="BPC">BPC (Benefício de Prestação Continuada)</option>
              <option value="Aluguel social">Aluguel Social</option>
              <option value="Outro">Outro Benefício</option>
            </Select>
          </Field>

          <Field label="Ocupação / Trabalho do Responsável">
            <Input name="ocupacaoAtual" defaultValue={b?.ocupacaoAtual} placeholder="Ex: Autônomo, Comércio, etc." />
          </Field>
        </div>

        {/* Contato Secundário de Emergência (Modelo 1 + Modelo 2) */}
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mb-3 text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            <span>Contato de Emergência Secundário (além do responsável)</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Nome do Contato">
              <Input
                name="emergenciaNome"
                defaultValue={(b?.anamneseDados?.contatoEmergencia?.nome as string) || ""}
                placeholder="Ex: Maria (Tia / Vizinha)"
              />
            </Field>
            <Field label="Grau de Parentesco">
              <Input
                name="emergenciaParentesco"
                defaultValue={(b?.anamneseDados?.contatoEmergencia?.parentesco as string) || ""}
                placeholder="Ex: Avó, Tia, Padrinho"
              />
            </Field>
            <Field label="Telefone de Emergência">
              <Input
                name="emergenciaTelefone"
                mask="telefone"
                defaultValue={(b?.anamneseDados?.contatoEmergencia?.telefone as string) || ""}
                placeholder="(63) 99999-9999"
              />
            </Field>
          </div>
        </div>
      </FormSection>

      {/* ─────────────────────────────────────────────────────────────
          SEÇÃO 4: VIDA ESCOLAR
      ───────────────────────────────────────────────────────────── */}
      <FormSection title="4. Vida Escolar do Aluno" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Rede de Ensino">
            <Select name="redeEnsino" defaultValue={b?.redeEnsino ?? "Municipal"}>
              <option value="Municipal">Municipal</option>
              <option value="Estadual">Estadual</option>
              <option value="Particular">Particular</option>
              <option value="Federal">Federal</option>
              <option value="Não estuda">Não estuda</option>
            </Select>
          </Field>

          <Field label="Nome da Escola" className="sm:col-span-2">
            <Input name="nomeEscola" defaultValue={b?.nomeEscola} placeholder="Ex: Escola Municipal Jorge Amado" />
          </Field>

          <Field label="Turno Escolar">
            <Select name="turnoEscolar" defaultValue={b?.turno ?? "Vespertino"}>
              <option value="Matutino">Matutino (Manhã)</option>
              <option value="Vespertino">Vespertino (Tarde)</option>
              <option value="Integral">Integral</option>
              <option value="Noturno">Noturno</option>
            </Select>
          </Field>

          <Field label="Nível / Segmento de Escolaridade">
            <Select name="segmentoEscolar" defaultValue={b?.segmentoEscolar ?? "Fundamental I/II"}>
              <option value="Educação Infantil">Educação Infantil</option>
              <option value="Fundamental I/II">Ensino Fundamental (1º ao 9º)</option>
              <option value="Ensino Médio">Ensino Médio</option>
              <option value="EJA">EJA</option>
            </Select>
          </Field>

          <Field label="Série / Ano">
            <Input name="serie" defaultValue={b?.serie} placeholder="Ex: 7º ano" />
          </Field>

          <Field label="Turma Escolar">
            <Input name="turmaEscolar" defaultValue={b?.turmaEscolar} placeholder="Ex: Turma B" />
          </Field>

          <Field label={`Código / Inscrição do ${termoBeneficiario}`}>
            <Input name="codigoAtleta" defaultValue={b?.codigoAtleta} placeholder="Registro interno do atleta" />
          </Field>
        </div>
      </FormSection>

      {/* ─────────────────────────────────────────────────────────────
          SEÇÃO 5: SAÚDE, ANAMNESE MÉDICA & PAR-Q
      ───────────────────────────────────────────────────────────── */}
      <FormSection title="5. Saúde, Anamnese Médica & PAR-Q (Prontidão Física)" defaultOpen={false}>
        {/* Biometria */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 mb-4">
          <div className="mb-3 text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-1.5">
            <HeartPulse className="h-4 w-4" />
            <span>Dados Biométricos & Triagem Médica</span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Peso (kg)">
              <Input
                name="peso"
                type="number"
                step="0.1"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ex: 48"
              />
            </Field>

            <Field label="Altura (m)">
              <Input
                name="altura"
                type="number"
                step="0.01"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                placeholder="Ex: 1.52"
              />
            </Field>

            <Field label="Tipo Sanguíneo">
              <Select
                name="tipoSanguineo"
                value={tipoSanguineo}
                onChange={(e) => setTipoSanguineo(e.target.value)}
              >
                <option value="">Não sei informar</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>
            </Field>

            <Field label="IMC Calculado">
              <div className="flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-blue-600 dark:border-zinc-800 dark:bg-zinc-900">
                {imcCalculado ? `${imcCalculado} kg/m²` : "—"}
              </div>
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Acompanhado por Posto de Saúde / UBS?">
              <RadioGroup
                name="acompanhamentoUbs"
                options={["Sim", "Não"]}
                value={acompanhamentoUbs}
                onChange={(v) => setAcompanhamentoUbs(v)}
              />
            </Field>

            <Field label="Comorbidades / Alergias Conhecidas">
              <Input
                name="comorbidades"
                defaultValue={b?.comorbidades}
                placeholder="Ex: Rinite, Bronquite, Alergia a picada de abelha"
              />
            </Field>
          </div>
        </div>

        {/* Questionário PAR-Q */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>📋</span> Questionário Oficial de Prontidão para Atividade Física (PAR-Q)
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                algumaRespostaSim
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              }`}
            >
              {algumaRespostaSim ? "Atenção: Requer Avaliação Médica" : "Apto sem restrições"}
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {parQ.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
                <p className="text-xs text-zinc-700 dark:text-zinc-300 flex-1">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-1">{index + 1}.</span>
                  {item.pergunta}
                </p>
                <div className="flex-shrink-0">
                  <RadioGroup
                    name={`parq-${index}`}
                    options={["Não", "Sim"]}
                    value={item.resposta || "Não"}
                    onChange={(v) =>
                      setParQ((prev) =>
                        prev.map((p, i) => (i === index ? { ...p, resposta: v as "Sim" | "Não" } : p))
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {algumaRespostaSim && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <Field
                label="Atestado Médico / Liberação para Treinos"
                hint="Obrigatório devido à marcação de resposta 'Sim' em um ou mais itens do PAR-Q"
              >
                <FileUpload label="Enviar atestado médico escaneado ou foto legível" />
              </Field>
            </div>
          )}
        </div>
      </FormSection>

      {/* ─────────────────────────────────────────────────────────────
          SEÇÃO 6: TERMOS, USO DE IMAGEM & ATRIBUIÇÃO DE TURMAS
      ───────────────────────────────────────────────────────────── */}
      <FormSection title={`6. Termos, Uso de Imagem & Atribuição de ${termoTurmas}`} defaultOpen={true}>
        {/* Autorização de Imagem (Destaque Modelo 2) */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 mb-4">
          <div className="mb-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Autorização de Uso de Imagem e Voz (ECA / Lei 8.069)</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
            Autorização do responsável legal para captação e veiculação de fotografias e vídeos em treinos, jogos e eventos para fins exclusivos de divulgação institucional do projeto.
          </p>
          <RadioGroup
            name="autorizacaoImagem"
            options={["Sim", "Não"]}
            value={autorizacaoImagem}
            onChange={(v) => setAutorizacaoImagem(v)}
          />
        </div>

        {/* Núcleo e Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
          <Field label={`${termoLocal} (Polo de Treinamento) *`} required>
            <Select
              name="nucleoId"
              value={nucleoId}
              onChange={(e) => setNucleoId(e.target.value)}
            >
              <option value="">Selecione o {termoLocal}</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>

          <Field label="Status da Matrícula no Sistema">
            <Select name="status" defaultValue={normalizarStatusBeneficiario(b?.status)}>
              {STATUS_BENEFICIARIO_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Atribuição de Turmas */}
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              Matrícula em {termoTurmas}
            </h4>
            <Button type="button" variant="outline" size="sm" onClick={adicionarTurma} className="cursor-pointer">
              <Plus className="h-4 w-4" /> Adicionar {termoTurma}
            </Button>
          </div>

          {vinculos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500 dark:border-zinc-700">
              Nenhuma {termoTurma.toLowerCase()} atribuída a este {termoBeneficiario.toLowerCase()}.
            </div>
          ) : (
            vinculos.map((v, index) => {
              const turmasFiltradas = nucleoId
                ? turmas.filter((tItem) => tItem.nucleoId === nucleoId)
                : turmas;

              return (
                <div key={index} className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-zinc-50/70 p-4 sm:grid-cols-3 items-end dark:border-zinc-800 dark:bg-zinc-900/40">
                  <Field label={termoTurma} required>
                    <Select
                      value={v.turmaId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setVinculos((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, turmaId: newId } : item))
                        );
                        const selectedT = turmas.find((tItem) => tItem.id === newId);
                        if (selectedT?.nucleoId) {
                          setNucleoId(selectedT.nucleoId);
                        }
                      }}
                    >
                      <option value="">Selecione a {termoTurma}</option>
                      {turmasFiltradas.map((tItem) => {
                        const n = nucleos.find((nItem) => nItem.id === tItem.nucleoId);
                        return (
                          <option key={tItem.id} value={tItem.id}>
                            {tItem.nome} {n ? `(${n.identificacao})` : ""} — {tItem.vagasTotais || 0} vagas
                          </option>
                        );
                      })}
                    </Select>
                  </Field>

                  <Field label="Status da Matrícula">
                    <Select
                      value={v.status || "Ativo"}
                      onChange={(e) => {
                        const newStatus = (e.target.value === "Evadido" ? "Evadido" : "Ativo") as "Ativo" | "Evadido";
                        setVinculos((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, status: newStatus } : item))
                        );
                      }}
                    >
                      <option value="Ativo">Ativo (Matriculado)</option>
                      <option value="Evadido">Inativo / Evadido</option>
                    </Select>
                  </Field>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="danger" size="sm" onClick={() => removerTurma(index)} className="w-full sm:w-auto cursor-pointer">
                      <Trash2 className="h-4 w-4" /> Remover
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Observações Gerais */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Razões para Inscrição no Projeto">
            <Textarea name="razoesInscricao" defaultValue={b?.razoesInscricao} placeholder="Ex: Iniciação esportiva, recomendação escolar" />
          </Field>
          <Field label="Observações Administrativas Gerais">
            <Textarea name="observacoes" defaultValue={b?.observacoes} placeholder="Anotações internas sobre o aluno ou a família" />
          </Field>
        </div>

        {/* Anexos de Documentos */}
        <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              Documentos & Comprovantes Físicos Escaneados
            </span>
            <Button type="button" variant="outline" size="sm" onClick={adicionarAnexo}>
              <Plus className="h-4 w-4" /> Novo anexo
            </Button>
          </div>

          {anexos.map((anexo, index) => (
            <div key={anexo.id} className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 p-3 sm:grid-cols-3 items-end dark:border-zinc-800">
              <Field label="Descrição do Documento">
                <Input defaultValue={anexo.descricao} placeholder="Ex: Certidão de Nascimento / Comprovante" />
              </Field>
              <Field label="Arquivo" required>
                <FileUpload />
              </Field>
              <div>
                <Button type="button" variant="danger" size="sm" onClick={() => removerAnexo(index)}>
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit" disabled={loading} className="px-6 font-semibold">
          {loading ? "Salvando..." : b ? "Salvar Alterações" : `Cadastrar ${termoBeneficiario}`}
        </Button>
      </div>
    </form>
  );
}
