"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Field,
  FileUpload,
  FormSection,
  Input,
  RadioGroup,
  Select,
  Textarea,
} from "@/components/ui";
import type { PerguntaParQ } from "@/lib/types";
import { validarCpf, validarCep, validarEmail } from "@/lib/mascaras";

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

interface InscricaoPublicaFormProps {
  turmaId: string;
  onSubmit?: (data: FormData) => void;
}

export function InscricaoPublicaForm({ turmaId, onSubmit }: InscricaoPublicaFormProps) {
  const [sexo, setSexo] = useState("Masculino");
  const [pcd, setPcd] = useState(false);
  const [parQ, setParQ] = useState<PerguntaParQ[]>(
    PERGUNTAS_PARQ.map((p) => ({ pergunta: p }))
  );
  const [termoAceito, setTermoAceito] = useState(false);
  const algumaRespostaSim = parQ.some((p) => p.resposta === "Sim");

  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  async function handleCepBlur() {
    if (!cep) return;
    const { buscarEnderecoPorCep } = await import("@/lib/cep");
    const res = await buscarEnderecoPorCep(cep);
    if (res) {
      if (res.logradouro) setLogradouro(res.logradouro);
      if (res.bairro) setBairro(res.bairro);
      if (res.localidade) setCidade(res.localidade);
      if (res.uf) setEstado(res.uf);
    }
  }

  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const cpf = String(formData.get("cpf") || "");
    const email = String(formData.get("email") || "");
    const cepVal = String(formData.get("cep") || "");

    if (cpf && !validarCpf(cpf)) {
      setErro("CPF do aluno inválido. Por favor, confira os números digitados.");
      return;
    }

    if (email && !validarEmail(email)) {
      setErro("Endereço de e-mail inválido. Utilize o formato nome@dominio.com.");
      return;
    }

    if (cepVal && !validarCep(cepVal)) {
      setErro("CEP inválido. Deve conter exatamente 8 dígitos.");
      return;
    }

    if (!termoAceito) return;
    if (onSubmit) onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="turmaId" value={turmaId} />

      {/* 1. Identificação */}
      <FormSection title="1. Identificação do Beneficiário">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome completo" required className="sm:col-span-2">
            <Input name="nomeCompleto" required />
          </Field>
          <Field label="Nome social">
            <Input name="nomeSocial" />
          </Field>
          <Field label="Data de nascimento" required>
            <Input type="date" name="dataNascimento" required />
          </Field>
          <Field label="Raça">
            <Select name="raca" defaultValue="">
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
              value={sexo}
              onChange={setSexo}
            />
          </Field>
          <Field label="Pessoa com deficiência (PCD)?" required>
            <RadioGroup
              name="pcd"
              options={["Sim", "Não"]}
              value={pcd ? "Sim" : "Não"}
              onChange={(v) => setPcd(v === "Sim")}
            />
          </Field>
          {pcd && (
            <Field label="Tipo de deficiência">
              <Select name="tipoPcd" defaultValue="">
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
        </div>
      </FormSection>

      {/* 2. Contato */}
      <FormSection title="2. Contato">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Celular" required>
            <Input name="celular" mask="telefone" placeholder="(00) 00000-0000" required />
          </Field>
          <Field label="Telefone residencial">
            <Input name="telefoneResidencial" mask="telefone" placeholder="(00) 0000-0000" />
          </Field>
          <Field label="E-mail">
            <Input type="email" name="email" placeholder="seu@email.com" />
          </Field>
          <Field label="WhatsApp?">
            <Select name="celularWhatsapp" defaultValue="">
              <option value="">Selecione</option>
              <option>Sim</option>
              <option>Não</option>
              <option value="Não informado">Não informado</option>
            </Select>
          </Field>
        </div>
      </FormSection>

      {/* 3. Endereço */}
      <FormSection title="3. Endereço" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CEP" required>
            <Input
              name="cep"
              mask="cep"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={handleCepBlur}
              placeholder="00000-000"
              required
            />
          </Field>
          <Field label="Logradouro" required className="lg:col-span-2">
            <Input
              name="logradouro"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              required
            />
          </Field>
          <Field label="Número" required>
            <Input name="numero" required />
          </Field>
          <Field label="Complemento">
            <Input name="complemento" />
          </Field>
          <Field label="Bairro" required>
            <Input
              name="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              required
            />
          </Field>
          <Field label="Cidade" required>
            <Input
              name="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              required
            />
          </Field>
          <Field label="Estado" required>
            <Input
              name="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              required
            />
          </Field>
        </div>
      </FormSection>

      {/* 4. Documentação */}
      <FormSection title="4. Documentação" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CPF">
            <Input name="cpf" mask="cpf" placeholder="000.000.000-00" />
          </Field>
          <Field label="RG">
            <Input name="rg" />
          </Field>
          <Field label="Número do NIS">
            <Input name="numeroNis" mask="numeros" />
          </Field>
          <Field label="Nome do pai">
            <Input name="nomePai" />
          </Field>
          <Field label="Nome da mãe">
            <Input name="nomeMae" />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mora com">
            <RadioGroup name="moraCom" options={["Pais", "Pai", "Mãe", "Avós", "Parentes", "Outros"]} />
          </Field>
          <Field label="Tamanho do uniforme">
            <RadioGroup name="tamanhoUniforme" options={["PP", "P", "M", "G", "GG", "XG"]} />
          </Field>
        </div>
      </FormSection>

      {/* 5. Responsável */}
      <FormSection title="5. Dados do Responsável" defaultOpen={false}>
        <p className="mb-4 text-sm text-zinc-500">Preencher para menores de 18 anos ou quando aplicável.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome do responsável">
            <Input name="nomeResponsavel" />
          </Field>
          <Field label="E-mail do responsável">
            <Input type="email" name="emailResponsavel" />
          </Field>
          <Field label="RG do responsável">
            <Input name="rgResponsavel" />
          </Field>
          <Field label="CPF do responsável">
            <Input name="cpfResponsavel" mask="cpf" placeholder="000.000.000-00" />
          </Field>
        </div>
      </FormSection>

      {/* 6. Perfil socioeconômico */}
      <FormSection title="6. Perfil Socioeconômico" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nível de escolaridade">
            <Select name="nivelEscolaridade" defaultValue="">
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
            <Select name="ocupacaoAtual" defaultValue="">
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
          <Field label="Situação da moradia">
            <Select name="situacaoMoradia" defaultValue="">
              <option value="">Selecione</option>
              <option>Própria quitada</option>
              <option>Própria financiada</option>
              <option>Alugada</option>
              <option>Cedida por parentes/amigos</option>
              <option>Outra</option>
            </Select>
          </Field>
          <Field label="Benefício socioassistencial">
            <Select name="beneficioSocioassistencial" defaultValue="">
              <option value="">Não</option>
              <option>Bolsa Família</option>
              <option>Aluguel social</option>
              <option>Auxílio-reclusão</option>
              <option>BPC</option>
              <option>Minha casa minha vida</option>
              <option>Outro</option>
            </Select>
          </Field>
          <Field label="Comorbidades">
            <Select name="comorbidades" defaultValue="">
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
        </div>
        <div className="mt-4">
          <Field label="Razões para inscrição">
            <Textarea name="razoesInscricao" />
          </Field>
        </div>
      </FormSection>

      {/* 7. Rede de Ensino */}
      <FormSection title="7. Rede de Ensino" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Rede de ensino">
            <Select name="redeEnsino" defaultValue="">
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
            <Input name="nomeEscola" />
          </Field>
          <Field label="Turno">
            <Select name="turno" defaultValue="">
              <option value="">Selecione</option>
              <option>Manhã</option>
              <option>Tarde</option>
              <option>Noite</option>
              <option>Integral</option>
            </Select>
          </Field>
          <Field label="Série">
            <Input name="serie" />
          </Field>
          <Field label="Turma escolar">
            <Input name="turmaEscolar" />
          </Field>
        </div>
      </FormSection>

      {/* 8. PAR-Q */}
      <FormSection title="8. PAR-Q — Questionário de Prontidão para Atividade Física" defaultOpen={false}>
        <p className="mb-4 text-sm text-zinc-500">
          Responda com honestidade. Respostas &ldquo;Sim&rdquo; podem exigir atestado médico.
        </p>
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

      {/* Termo de aceite */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Termo de Aceite</h3>
        <p className="mb-4 text-sm text-zinc-600 leading-relaxed">
          Declaro que as informações fornecidas são verdadeiras e estou ciente de que minha
          inscrição está sujeita a aprovação. Autorizo o uso dos dados para os fins relacionados
          ao programa, conforme a Lei Geral de Proteção de Dados (LGPD).
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="termoAceito"
            checked={termoAceito}
            onChange={(e) => setTermoAceito(e.target.checked)}
            className="mt-0.5 rounded border-zinc-300"
            required
          />
          <span className="text-sm text-zinc-700">
            Li e concordo com os termos acima.
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!termoAceito}>
          Confirmar Inscrição
        </Button>
      </div>
    </form>
  );
}
