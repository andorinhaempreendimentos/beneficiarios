"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, Field, Input, Select, Textarea, LinkButton } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi } from "@/lib/api/coordenadores";
import {
  pendenciasGeraisApi,
  turmasApi,
  type NucleoApi,
  type TurmaApi,
  type Paginated,
} from "@/lib/api/services";
import { ArrowLeft, Save, Building2, UserCheck, AlertCircle } from "lucide-react";

const sugestoesPorTipo: Record<string, { tituloPlaceholder: string; descPlaceholder: string }> = {
  estrutura: {
    tituloPlaceholder: "Ex: Alambrado rompido na quadra 1, iluminação queimada no vestiário",
    descPlaceholder: "Descreva o problema físico, localização exata e impacto nas atividades dos alunos...",
  },
  material: {
    tituloPlaceholder: "Ex: Bolas de futsal desgastadas, falta de coletes tamanho M",
    descPlaceholder: "Descreva os itens danificados ou em falta, quantidades necessárias e turmas afetadas...",
  },
  professor: {
    tituloPlaceholder: "Ex: Necessidade de substituição na terça-feira, ajuste de horário",
    descPlaceholder: "Descreva a ocorrência técnica, horários e alinhamentos necessários com a equipe docente...",
  },
  beneficiario: {
    tituloPlaceholder: "Ex: Solicitação de uniforme especial, divergência em frequência de aluno",
    descPlaceholder: "Descreva a situação do beneficiário e providências necessárias...",
  },
  outro: {
    tituloPlaceholder: "Ex: Reunião com parceiros locais, entrega de materiais",
    descPlaceholder: "Descreva detalhadamente a situação e as medidas necessárias...",
  },
};

export default function NovaPendenciaCoordenadorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [salvando, setSalvando] = useState(false);

  const initialNucleoId = searchParams.get("nucleoId") || "";

  const [form, setForm] = useState({
    nucleoId: initialNucleoId,
    tipo: "estrutura",
    titulo: "",
    descricao: "",
    gravidade: "media",
    responsavelId: "",
    prazo: "",
  });

  // Apenas os núcleos atribuídos ao coordenador logado
  const { data: meusNucleos, loading: loadingNucleos } = useQuery<NucleoApi[]>(
    () => coordenadoresApi.getMeusNucleos(),
    [],
  );

  const nucleos = meusNucleos ?? [];

  // Pré-selecionar se coordenador tiver apenas 1 núcleo
  useEffect(() => {
    if (!form.nucleoId && nucleos.length === 1) {
      setForm((f) => ({ ...f, nucleoId: nucleos[0].id }));
    }
  }, [nucleos, form.nucleoId]);

  // Carregar turmas do núcleo selecionado para extrair apenas os professores deste núcleo
  const { data: turmasData, loading: loadingTurmas } = useQuery<Paginated<TurmaApi>>(
    () =>
      form.nucleoId
        ? turmasApi.list({ nucleoId: form.nucleoId, limit: 100 })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 }),
    [form.nucleoId],
  );

  // Professores vinculados às turmas do núcleo escolhido
  const professoresDoNucleo = useMemo(() => {
    if (!turmasData?.data) return [];
    const map = new Map<string, string>();
    for (const t of turmasData.data) {
      if (t.responsaveis && t.responsaveisNomes) {
        t.responsaveis.forEach((id, idx) => {
          const nome = t.responsaveisNomes?.[idx];
          if (id && nome && !map.has(id)) {
            map.set(id, nome);
          }
        });
      }
    }
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [turmasData]);

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function handleNucleoChange(novoNucleoId: string) {
    setForm((f) => ({
      ...f,
      nucleoId: novoNucleoId,
      responsavelId: "",
    }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nucleoId || !form.tipo || !form.titulo.trim() || !form.descricao.trim()) {
      toast.error("Núcleo, tipo, título e descrição são obrigatórios.");
      return;
    }
    setSalvando(true);
    try {
      await pendenciasGeraisApi.create({
        nucleoId: form.nucleoId,
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        gravidade: form.gravidade,
        responsavelId: form.responsavelId || null,
        prazo: form.prazo || null,
        createdById: user?.refId || user?.id || "",
      });
      toast.success("Pendência registrada com sucesso!");
      router.push("/coordenador/pendencias-gerais");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao registrar pendência.");
    } finally {
      setSalvando(false);
    }
  }

  const sugestaoAtual = sugestoesPorTipo[form.tipo] || sugestoesPorTipo.outro;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/coordenador/pendencias-gerais"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar para Pendências
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Nova Pendência de Núcleo
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Registrar ocorrência técnica, estrutural ou de material nos núcleos sob sua supervisão
          </p>
        </div>

        <LinkButton href="/coordenador/pendencias-gerais" variant="secondary">
          Cancelar
        </LinkButton>
      </div>

      <Card>
        <form onSubmit={salvar} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Núcleo Responsável" required>
              <Select
                value={form.nucleoId}
                onChange={(e) => handleNucleoChange(e.target.value)}
                required
              >
                <option value="">Selecione o núcleo…</option>
                {nucleos.map((n) => (
                  <option key={n.id} value={n.id}>
                    📍 {n.identificacao} {n.regiao ? `(${n.regiao})` : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tipo da Ocorrência" required>
              <Select
                value={form.tipo}
                onChange={(e) => set("tipo", e.target.value)}
                required
              >
                <option value="estrutura">Estrutura (campo, trave, alambrado, vestiário)</option>
                <option value="material">Material (bolas, coletes, cones, uniformes)</option>
                <option value="professor">Professor / Equipe técnica</option>
                <option value="beneficiario">Beneficiários / Alunos</option>
                <option value="outro">Outro assunto</option>
              </Select>
            </Field>

            <Field label="Nível de Gravidade">
              <Select
                value={form.gravidade}
                onChange={(e) => set("gravidade", e.target.value)}
              >
                <option value="baixa">Baixa (acompanhamento rotineiro)</option>
                <option value="media">Média (atenção no prazo normal)</option>
                <option value="alta">Alta (afeta aulas diretamente)</option>
                <option value="critica">Crítica (risco à segurança ou paralisação)</option>
              </Select>
            </Field>

            <Field label="Prazo Desejado para Solução">
              <Input
                type="date"
                value={form.prazo}
                onChange={(e) => set("prazo", e.target.value)}
              />
            </Field>
          </div>

          {/* Campo Responsável contextualizado */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-sky-600" />
                Responsável pelo Tratamento
              </label>
              <span className="text-[11px] text-zinc-400">
                Padrão: subentendido para Coordenação / Professor do Núcleo
              </span>
            </div>
            <Select
              value={form.responsavelId}
              onChange={(e) => set("responsavelId", e.target.value)}
              className="bg-white"
            >
              <option value="">
                {form.nucleoId
                  ? "Coordenação / Professor do Núcleo (Automático)"
                  : "Selecione o núcleo primeiro…"}
              </option>
              {professoresDoNucleo.length > 0 && (
                <optgroup label="Professores com Turmas neste Núcleo">
                  {professoresDoNucleo.map((p) => (
                    <option key={p.id} value={p.id}>
                      👤 Prof. {p.nome}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Não é obrigatório escolher alguém. O acompanhamento fica subentendido sob sua coordenação, podendo ser direcionado a um professor específico deste núcleo se necessário.
            </p>
          </div>

          <Field label="Título / Resumo da Pendência" required>
            <Input
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              placeholder={sugestaoAtual.tituloPlaceholder}
              required
            />
          </Field>

          <Field label="Detalhamento da Ocorrência" required>
            <Textarea
              rows={4}
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              placeholder={sugestaoAtual.descPlaceholder}
              required
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <LinkButton href="/coordenador/pendencias-gerais" variant="secondary">
              Cancelar
            </LinkButton>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Save className="h-4 w-4" />
              {salvando ? "Salvando…" : "Registrar Pendência"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
