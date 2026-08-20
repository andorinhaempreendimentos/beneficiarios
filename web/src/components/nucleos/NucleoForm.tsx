"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { z } from "zod";
import { Button, Field, FormSection, Input, LinkButton, Select, Switch } from "@/components/ui";
import { nucleosApi, type NucleoApi, type OrganizacaoApi, type AtividadeApi } from "@/lib/api/services";
import { obterCoordenadasEndereco } from "@/lib/geocoding";

const UFS_BRASIL = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

const nucleoSchema = z.object({
  identificacao: z.string().min(3, "Identificação deve ter pelo menos 3 caracteres."),
  organizacaoId: z.string().min(1, "Selecione uma organização."),
  dataInicio: z.string().min(1, "Data de início é obrigatória."),
  telefoneContato: z.string().optional().nullable(),
  toleranciaInicioMinutos: z.number().min(0, "Tolerância não pode ser negativa.").nullable().optional(),
  toleranciaFimMinutos: z.number().min(0, "Tolerância não pode ser negativa.").nullable().optional(),
  diasLimiteRetroativo: z.number().min(1, "Mínimo 1 dia.").nullable().optional(),
});

type FieldErrors = Partial<Record<string, string>>;

interface NucleoFormProps {
  nucleo?: NucleoApi;
  organizacoes?: OrganizacaoApi[];
  atividades?: AtividadeApi[];
  backHref: string;
}

export function NucleoForm({ nucleo: n, organizacoes = [], atividades = [], backHref }: NucleoFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [emFuncionamento, setEmFuncionamento] = useState(n?.emFuncionamento ?? true);
  const [disponivelPreInscricao, setDisponivelPreInscricao] = useState(n?.disponivelPreInscricao ?? true);
  const [tipoRestricaoChamada, setTipoRestricaoChamada] = useState<'data' | 'horario'>(n?.tipoRestricaoChamada ?? 'data');
  const [permitirChamadaRetroativa, setPermitirChamadaRetroativa] = useState(n?.permitirChamadaRetroativa ?? false);
  const [organizacaoId, setOrganizacaoId] = useState(n?.organizacaoId ?? (organizacoes[0]?.id || ""));
  const [atividadeIds, setAtividadeIds] = useState<string[]>(
    n?.atividadeIds ?? atividades.filter(a => !a.usoInterno).map((a) => a.id)
  );

  const atividadesVisiveis = atividades.filter(a => !a.usoInterno);

  const [cep, setCep] = useState(n?.cep ?? "");
  const [endereco, setEndereco] = useState(n?.endereco ?? "");
  const [bairro, setBairro] = useState(n?.bairro ?? "");
  const [cidade, setCidade] = useState(n?.cidade ?? "");
  const [estado, setEstado] = useState(n?.estado ?? "");

  async function handleCepBlur() {
    if (!cep) return;
    const { buscarEnderecoPorCep } = await import("@/lib/cep");
    const res = await buscarEnderecoPorCep(cep);
    if (res) {
      if (res.logradouro) setEndereco(res.logradouro);
      if (res.bairro) setBairro(res.bairro);
      if (res.localidade) setCidade(res.localidade);
      if (res.uf) setEstado(res.uf);
    }
  }

  function toggleAtividade(id: string) {
    setAtividadeIds((prev) =>
      prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(event.currentTarget);
    const orgId = (formData.get("organizacaoId") as string) || organizacaoId;

    if (!orgId) {
      setErro("Por favor, selecione uma organização responsável.");
      setLoading(false);
      return;
    }

    const data = {
      identificacao: formData.get("identificacao") as string,
      nomeLocal: (formData.get("nomeLocal") as string) || null,
      regiao: (formData.get("regiao") as string) || null,
      nomeResponsavel: (formData.get("nomeResponsavel") as string) || null,
      telefoneContato: (formData.get("telefoneContato") as string) || null,
      cep: (formData.get("cep") as string) || null,
      endereco: (formData.get("endereco") as string) || null,
      numero: (formData.get("numero") as string) || null,
      bairro: (formData.get("bairro") as string) || null,
      cidade: (formData.get("cidade") as string) || null,
      estado: (formData.get("estado") as string) || estado || null,
      complemento: (formData.get("complemento") as string) || null,
      dataInicio: (formData.get("dataInicio") as string) || "",
      organizacaoId: orgId,
      emFuncionamento,
      disponivelPreInscricao,
      tipoRestricaoChamada,
      permitirChamadaRetroativa,
      toleranciaInicioMinutos: formData.get("toleranciaInicioMinutos") ? Number(formData.get("toleranciaInicioMinutos")) : null,
      toleranciaFimMinutos: formData.get("toleranciaFimMinutos") ? Number(formData.get("toleranciaFimMinutos")) : null,
      diasLimiteRetroativo: formData.get("diasLimiteRetroativo") ? Number(formData.get("diasLimiteRetroativo")) : null,
      atividadeIds,
    };

    // Validação Zod
    const validation = nucleoSchema.safeParse(data);
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
      // Obter latitude e longitude automaticamente sem exigir digitação do usuário
      const coords = await obterCoordenadasEndereco({
        cep: data.cep,
        endereco: data.endereco,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
      });

      const payload = {
        ...data,
        latitude: coords?.latitude ?? n?.latitude ?? null,
        longitude: coords?.longitude ?? n?.longitude ?? null,
      };

      if (n?.id) {
        await nucleosApi.update(n.id, payload);
      } else {
        await nucleosApi.create(payload);
      }
      window.location.href = backHref;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar núcleo.");
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
      <FormSection title="Identificação">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Identificação" required error={fieldErrors.identificacao}>
            <Input name="identificacao" defaultValue={n?.identificacao} placeholder="Ex: Núcleo Vila Esperança" />
          </Field>
          <Field label="Organização Responsável" required error={fieldErrors.organizacaoId}>
            <select
              name="organizacaoId"
              value={organizacaoId}
              onChange={(e) => setOrganizacaoId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-9 text-sm text-zinc-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            >
              <option value="" disabled>Selecione uma organização</option>
              {organizacoes.map((org) => (
                <option key={org.id} value={org.id}>{org.nome}</option>
              ))}
            </select>
          </Field>
          <Field label="Nome do local">
            <Input name="nomeLocal" defaultValue={n?.nomeLocal} placeholder="Ex: Escola Municipal..." />
          </Field>
          <Field label="Região">
            <Input name="regiao" defaultValue={n?.regiao} />
          </Field>
          <Field label="Nome do responsável">
            <Input name="nomeResponsavel" defaultValue={n?.nomeResponsavel} />
          </Field>
          <Field label="Telefone de contato">
            <Input name="telefoneContato" defaultValue={n?.telefoneContato} placeholder="(00) 00000-0000" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Atividades Disponíveis">
        <p className="mb-3 text-xs text-zinc-500">
          Selecione quais atividades este núcleo tem estrutura para disponibilizar aos beneficiários:
        </p>
        {atividades.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhuma atividade cadastrada no sistema.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {atividadesVisiveis.map((a) => {
              const checked = atividadeIds.includes(a.id);
              return (
                <label
                  key={a.id}
                  className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                    checked
                      ? "border-sky-500 bg-sky-50/50 text-sky-900"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-sm font-medium">{a.nome}</span>
                  <Switch checked={checked} onChange={() => toggleAtividade(a.id)} />
                </label>
              );
            })}
          </div>
        )}
      </FormSection>

      <FormSection title="Endereço">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CEP">
            <Input
              name="cep"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={handleCepBlur}
              placeholder="00000-000"
            />
          </Field>
          <Field label="Endereço" className="lg:col-span-2">
            <Input
              name="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
          </Field>
          <Field label="Número">
            <Input name="numero" defaultValue={n?.numero} />
          </Field>
          <Field label="Bairro">
            <Input
              name="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
          </Field>
          <Field label="Cidade">
            <Input
              name="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
          </Field>
          <Field label="Estado (UF)">
            <Select
              name="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="">Selecione o estado</option>
              {UFS_BRASIL.map((uf) => (
                <option key={uf.sigla} value={uf.sigla}>
                  {uf.sigla} - {uf.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Complemento" className="lg:col-span-2">
            <Input name="complemento" defaultValue={n?.complemento} />
          </Field>
        </div>


      </FormSection>

      <FormSection title="Funcionamento">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data de início" required error={fieldErrors.dataInicio}>
            <Input type="date" name="dataInicio" defaultValue={n?.dataInicio} />
          </Field>
          <Field label="Data de fechamento">
            <Input type="date" name="dataFechamento" defaultValue={n?.dataFechamento} />
          </Field>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <Switch checked={emFuncionamento} onChange={setEmFuncionamento} label="Em funcionamento?" />
          <Switch
            checked={disponivelPreInscricao}
            onChange={setDisponivelPreInscricao}
            label="Disponível na pré inscrição"
          />
        </div>
      </FormSection>

      {/* CONFIGURAÇÕES DE FREQUÊNCIA E PONTO */}
      <FormSection title="Configurações de Frequência e Ponto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-semibold text-zinc-900 block mb-2">Nível de Restrição de Atraso</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className={`flex-1 p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${tipoRestricaoChamada === 'data' ? 'bg-sky-50 border-sky-300 shadow-sm' : 'bg-white border-zinc-200 hover:bg-zinc-50'}`}>
                <input type="radio" name="tipoRestricaoChamada" value="data" checked={tipoRestricaoChamada === 'data'} onChange={() => setTipoRestricaoChamada('data')} className="mt-1" />
                <div>
                  <div className="font-bold text-sky-900 text-sm">Por Data (Flexível)</div>
                  <div className="text-xs text-sky-700 mt-0.5">Permite iniciar a qualquer momento do mesmo dia da aula. Bloqueia se a data virar.</div>
                </div>
              </label>
              <label className={`flex-1 p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${tipoRestricaoChamada === 'horario' ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-white border-zinc-200 hover:bg-zinc-50'}`}>
                <input type="radio" name="tipoRestricaoChamada" value="horario" checked={tipoRestricaoChamada === 'horario'} onChange={() => setTipoRestricaoChamada('horario')} className="mt-1" />
                <div>
                  <div className="font-bold text-amber-900 text-sm">Por Horário (Rigoroso)</div>
                  <div className="text-xs text-amber-700 mt-0.5">Bloqueia se tentar iniciar fora do período exato (+ tolerância) da aula.</div>
                </div>
              </label>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
            <Switch
              label="Permitir Aprovação Retroativa pelo Coordenador?"
              checked={permitirChamadaRetroativa}
              onChange={setPermitirChamadaRetroativa}
            />
            <p className="text-xs text-zinc-500 ml-12">
              Se ativado, quando o professor estourar a restrição acima, ele não será bloqueado. A aula ficará com status "Pendente de Aprovação" para análise.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4 mt-6">
          <Field label="Tolerância Início (minutos)">
            <Input type="number" name="toleranciaInicioMinutos" defaultValue={n?.toleranciaInicioMinutos ?? 15} min={0} />
          </Field>
          <Field label="Tolerância Fim (minutos)">
            <Input type="number" name="toleranciaFimMinutos" defaultValue={n?.toleranciaFimMinutos ?? 15} min={0} />
          </Field>
        </div>
          {permitirChamadaRetroativa && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2 border-l-2 border-sky-500 pl-4">
              <Field label="Dias limite para retroativo">
                 <Input type="number" name="diasLimiteRetroativo" defaultValue={n?.diasLimiteRetroativo ?? 7} min={1} />
              </Field>
            </div>
          )}
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
