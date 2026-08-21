"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Field, FormSection, Input, LinkButton, PageHeader, Select } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  atividadesComplementaresApi,
  objetosApi,
  nucleosApi,
  funcionariosApi,
  type TipoAtividadeComplementar,
} from "@/lib/api/services";
import { Upload, X } from "lucide-react";

export default function NovaAtividadeComplementarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoAtividadeComplementar>("evento_esportivo");
  const [nucleoId, setNucleoId] = useState<string>("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [fotosUrls, setFotosUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: objetosRes } = useQuery(() => objetosApi.list({ limit: 10 }), []);
  const objetos = objetosRes?.data ?? [];
  const [objetoId, setObjetoId] = useState<string>("");

  const { data: nucleosRes } = useQuery(() => nucleosApi.list({ limit: 100 }), []);
  const nucleos = nucleosRes?.data ?? [];

  const { data: funcRes } = useQuery(() => funcionariosApi.list({ limit: 100 }), []);
  const funcionarios = funcRes?.data ?? [];

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await atividadesComplementaresApi.uploadFoto(file);
      setFotosUrls((prev) => [...prev, url]);
    } catch (err: any) {
      alert("Erro ao fazer upload da imagem: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  }

  function handleRemoverFoto(index: number) {
    setFotosUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const objId = (formData.get("objetoId") as string) || objetoId || objetos[0]?.id;

    if (!objId) {
      setErro("Selecione um Objeto para vincular esta atividade.");
      setLoading(false);
      return;
    }

    const payload = {
      objetoId: objId,
      nucleoId: nucleoId || undefined,
      tipo,
      titulo: formData.get("titulo") as string,
      descricao: (formData.get("descricao") as string) || undefined,
      data: (formData.get("data") as string) || new Date().toISOString().split("T")[0],
      horarioInicio: (formData.get("horarioInicio") as string) || undefined,
      horarioFim: (formData.get("horarioFim") as string) || undefined,
      responsavelId: responsavelId || undefined,
      quantidadeParticipantes: Number(formData.get("quantidadeParticipantes") || 0),
      fotosUrls,
    };

    try {
      await atividadesComplementaresApi.create(payload);
      router.push("/atividades-complementares");
    } catch (err: any) {
      setErro(err.message || "Erro ao cadastrar atividade complementar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Cadastrar Atividade Especial / Evento"
        description="Registre eventos, reuniões com pais ou capacitações para comprovação no relatório de metas"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {erro && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </div>
        )}

        <FormSection title="1. Dados da Atividade">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Objeto / Projeto" required>
              <Select
                name="objetoId"
                value={objetoId || (objetos[0]?.id ?? "")}
                onChange={(e) => setObjetoId(e.target.value)}
              >
                {objetos.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tipo de Ação" required>
              <Select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAtividadeComplementar)}
              >
                <option value="evento_esportivo">Evento Esportivo / Festival Comunitário</option>
                <option value="reuniao_familia">Reunião com Famílias / Responsáveis</option>
                <option value="capacitacao">Capacitação da Equipe Técnica</option>
                <option value="oficina_socioeducativa">Oficina Socioeducativa / Roda de Conversa</option>
                <option value="outro">Outra Ação</option>
              </Select>
            </Field>

            <Field label="Título do Evento / Atividade" required className="sm:col-span-2">
              <Input
                name="titulo"
                required
                placeholder="Ex: I Festival Esportivo de Futsal Taquari, Reunião Trimestral de Pais..."
              />
            </Field>

            <Field label="Núcleo Envolvido">
              <Select value={nucleoId} onChange={(e) => setNucleoId(e.target.value)}>
                <option value="">Geral / Integrado (Todos os Núcleos)</option>
                {nucleos.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.identificacao}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Responsável / Coordenador da Ação">
              <Select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
                <option value="">Selecione o profissional</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nomeCompleto} ({f.funcao})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Data da Realização" required>
              <Input type="date" name="data" defaultValue={new Date().toISOString().split("T")[0]} required />
            </Field>

            <Field label="Qtd. Estimada de Participantes" required>
              <Input type="number" name="quantidadeParticipantes" min="0" defaultValue="50" required />
            </Field>

            <Field label="Horário de Início">
              <Input type="time" name="horarioInicio" defaultValue="08:00" />
            </Field>

            <Field label="Horário de Término">
              <Input type="time" name="horarioFim" defaultValue="12:00" />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Descrição / Resumo do que foi realizado">
              <textarea
                name="descricao"
                rows={4}
                placeholder="Descreva a pauta, metodologia Gol do Brasil aplicada, dinâmicas e impactos observados..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </Field>
          </div>
        </FormSection>

        {/* 2. Fotos Comprobatórias */}
        <FormSection title="2. Registro Fotográfico (Fotos Comprobatórias)">
          <p className="text-xs text-zinc-500 mb-3">
            Anexe fotos de boa qualidade que comprovem a realização do evento/reunião para constar na Seção 12 do Relatório de Prestação de Contas.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fotosUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-video rounded-lg border border-zinc-200 overflow-hidden bg-zinc-100 group">
                <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoverFoto(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100"
                  title="Remover foto"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100/80 transition-colors">
              <Upload className="h-5 w-5 text-zinc-400" />
              <span className="mt-1 text-xs font-medium text-zinc-600">
                {uploading ? "Enviando..." : "Adicionar Foto"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadFoto}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </FormSection>

        <div className="flex justify-end gap-2">
          <LinkButton href="/atividades-complementares" variant="outline">
            Cancelar
          </LinkButton>
          <Button type="submit" disabled={loading || uploading}>
            {loading ? "Cadastrando..." : "Cadastrar Atividade"}
          </Button>
        </div>
      </form>
    </div>
  );
}
