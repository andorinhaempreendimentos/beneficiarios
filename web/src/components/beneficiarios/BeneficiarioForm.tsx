"use client";

import { useState } from "react";
import { Plus, Trash2, User } from "lucide-react";
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
import { nucleos } from "@/lib/mock/nucleos";
import { turmas } from "@/lib/mock/turmas";

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
  backHref: string;
}

export function BeneficiarioForm({ beneficiario: b, backHref }: BeneficiarioFormProps) {
  const [pcd, setPcd] = useState(b?.pcd ?? false);
  const [vinculos, setVinculos] = useState<VinculoTurma[]>(b?.turmas ?? []);
  const [anexos, setAnexos] = useState<Anexo[]>(b?.anexos ?? []);
  const [parQ, setParQ] = useState<PerguntaParQ[]>(
    b?.parQ.length ? b.parQ : PERGUNTAS_PARQ.map((p) => ({ pergunta: p }))
  );
  const algumaRespostaSim = parQ.some((p) => p.resposta === "Sim");

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
    <form className="flex flex-col gap-6">
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
            <RadioGroup name="sexo" options={["Masculino", "Feminino", "Não Informar"]} value={b?.sexo} />
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
          <Field label="Núcleo">
            <Select name="nucleoId" defaultValue={b?.nucleoId ?? ""}>
              <option value="">Sem núcleo definido</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>{n.identificacao}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={b?.status ?? ""}>
              <option value="">Selecione</option>
              <option>Novo cadastro</option>
              <option>Comparecer a sede</option>
              <option>Aguardando seletiva</option>
              <option>Fila de espera</option>
              <option>Desistente</option>
              <option>Aprovado</option>
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
            <Input name="telefoneResidencial" defaultValue={b?.telefoneResidencial} />
          </Field>
          <Field label="Celular" required>
            <Input name="celular" defaultValue={b?.celular} />
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
            <Input name="cep" defaultValue={b?.cep} placeholder="00000-000" />
          </Field>
          <Field label="Logradouro" required className="lg:col-span-2">
            <Input name="logradouro" defaultValue={b?.logradouro} />
          </Field>
          <Field label="Número" required>
            <Input name="numero" defaultValue={b?.numero} />
          </Field>
          <Field label="Complemento">
            <Input name="complemento" defaultValue={b?.complemento} />
          </Field>
          <Field label="Bairro" required>
            <Input name="bairro" defaultValue={b?.bairro} />
          </Field>
          <Field label="Cidade" required>
            <Input name="cidade" defaultValue={b?.cidade} />
          </Field>
          <Field label="Estado" required>
            <Input name="estado" defaultValue={b?.estado} />
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
            <Input name="cpf" defaultValue={b?.cpf} placeholder="000.000.000-00" />
          </Field>
          <Field label="Número do NIS">
            <Input name="numeroNis" defaultValue={b?.numeroNis} />
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
            <Input name="cpfResponsavel" defaultValue={b?.cpfResponsavel} placeholder="000.000.000-00" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="5. Atividades e Turmas">
        <div className="flex flex-col gap-4">
          {vinculos.map((v, index) => (
            <div key={index} className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-4">
              <Field label="Turma">
                <Select defaultValue={v.turmaId}>
                  <option value="">Selecione</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Status da Turma">
                <Select defaultValue={v.status}>
                  <option>Ativo</option>
                  <option>Evadido</option>
                </Select>
              </Field>
              <Field label="Data de registro">
                <Input type="date" defaultValue={v.dataRegistro} />
              </Field>
              <div className="flex items-end">
                <Button type="button" variant="danger" size="sm" onClick={() => removerTurma(index)}>
                  <Trash2 className="h-4 w-4" /> Remover da turma
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={adicionarTurma}>
            <Plus className="h-4 w-4" /> Adicionar turma
          </Button>
        </div>
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
