"use client";

import { useState } from "react";
import { z } from "zod";
import { HelpCircle, Plus, Trash2, Globe, Lock, AlertTriangle } from "lucide-react";
import { Button, Field, FormSection, Input, LinkButton, Switch } from "@/components/ui";
import type { PerguntaAtividade } from "@/lib/types";
import { atividadesApi, type AtividadeApi } from "@/lib/api/services";
import { useToast } from "@/components/providers/ToastProvider";

const atividadeSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
});

type FieldErrors = Partial<Record<string, string>>;

interface AtividadeFormProps {
  atividade?: AtividadeApi;
  backHref: string;
}

export function AtividadeForm({ atividade: a, backHref }: AtividadeFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [disponivelPreInscricao, setDisponivelPreInscricao] = useState(a?.disponivelPreInscricao ?? false);
  const [termoGrupo, setTermoGrupo] = useState(a?.termoGrupo ?? "Turma");
  const [termoSessao, setTermoSessao] = useState(a?.termoSessao ?? "Treino");
  const [termoResponsavel, setTermoResponsavel] = useState(a?.termoResponsavel ?? "Professor");
  const [termoParticipante, setTermoParticipante] = useState(a?.termoParticipante ?? "Aluno");
  const [perguntas, setPerguntas] = useState<PerguntaAtividade[]>(a?.perguntas ?? []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome") as string;

    const data = {
      nome: nome.trim(),
      disponivelPreInscricao,
      termoGrupo: termoGrupo.trim() || "Turma",
      termoSessao: termoSessao.trim() || "Treino",
      termoResponsavel: termoResponsavel.trim() || "Professor",
      termoParticipante: termoParticipante.trim() || "Aluno",
      perguntas,
    };

    const validation = atividadeSchema.safeParse(data);
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
      if (a?.id) {
        await atividadesApi.update(a.id, data);
        toast.success("Atividade atualizada com sucesso!");
      } else {
        await atividadesApi.create(data);
        toast.success("Atividade cadastrada com sucesso!");
      }
      window.location.href = backHref;
    } catch (err: any) {
      const msg = err.message || "Erro ao salvar atividade.";
      setErro(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function adicionarPergunta() {
    setPerguntas((prev) => [
      ...prev,
      { id: `nova-${prev.length}`, pergunta: "", disponivelInscricao: true },
    ]);
  }

  function removerPergunta(index: number) {
    setPerguntas((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarPergunta(index: number, campo: keyof PerguntaAtividade, valor: string | boolean) {
    setPerguntas((prev) => prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {erro}
        </div>
      )}

      <FormSection title="Dados da Atividade">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome da atividade" required error={fieldErrors.nome}>
            <Input name="nome" defaultValue={a?.nome} placeholder="Ex: Futebol, Planejamento Pedagógico, Karatê" required />
          </Field>
        </div>

        {/* SELETOR DE TIPO DE ATIVIDADE COM BOTOES DESTACADOS */}
        <div className="mt-6 flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Finalidade / Visibilidade da Atividade
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opção 1: Controle Interno */}
            <button
              type="button"
              onClick={() => setDisponivelPreInscricao(false)}
              className={`flex items-start gap-3 rounded-2xl p-4 border transition-all text-left ${
                !disponivelPreInscricao
                  ? "bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-500/20"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${!disponivelPreInscricao ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <span className={`text-sm font-bold block ${!disponivelPreInscricao ? "text-amber-900" : "text-zinc-700"}`}>
                  🔒 Controle Interno
                </span>
                <span className="text-xs text-zinc-500 mt-0.5 block">
                  Ex: Planejamento, Reuniões de Equipe, Manutenção. Disponível para montar a grade de turmas, mas oculta da inscrição pública.
                </span>
              </div>
            </button>

            {/* Opção 2: Inscrição Pública */}
            <button
              type="button"
              onClick={() => setDisponivelPreInscricao(true)}
              className={`flex items-start gap-3 rounded-2xl p-4 border transition-all text-left ${
                disponivelPreInscricao
                  ? "bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-500/20"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${disponivelPreInscricao ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <span className={`text-sm font-bold block ${disponivelPreInscricao ? "text-sky-900" : "text-zinc-700"}`}>
                  🌐 Inscrição Pública de Alunos
                </span>
                <span className="text-xs text-zinc-500 mt-0.5 block">
                  Disponível para os beneficiários realizarem pré-inscrição online pelo portal.
                </span>
              </div>
            </button>
          </div>
        </div>

      </FormSection>

      <FormSection title="Vocabulário da Atividade">
        <p className="text-xs text-zinc-500 mb-3 -mt-2">
          Defina como o sistema deve chamar cada elemento quando esta atividade estiver rodando nas telas e relatórios.
        </p>

        {/* Banner de Impacto da Edição do Vocabulário */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50/80 p-4 mb-5 text-xs text-amber-950">
          <div className="p-1.5 rounded-lg bg-amber-200/80 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-amber-900 text-sm">
              Atenção: Impacto Global do Vocabulário
            </span>
            <p className="leading-relaxed text-amber-800">
              Alterar estes 4 termos adaptará imediatamente a interface em todas as telas onde esta atividade for utilizada:
            </p>
            <ul className="list-disc list-inside space-y-0.5 mt-1 text-amber-900 font-medium">
              <li><strong>Agrupamento:</strong> Título dos grupos, crachás e listagens vinculadas.</li>
              <li><strong>Encontro/Sessão:</strong> Telas de chamada, agenda do professor e grade semanal.</li>
              <li><strong>Responsável:</strong> Rótulos do condutor na chamada, turmas e escalas.</li>
              <li><strong>Participante:</strong> Botões de presença/falta e contadores de frequência.</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Como chamar o agrupamento de pessoas? (Raiz: Grupo)">
            <Input
              name="termoGrupo"
              value={termoGrupo}
              onChange={(e) => setTermoGrupo(e.target.value)}
              placeholder="Ex: Turma, Time, Equipe, Classe"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">Ex: Turma, Time, Equipe, Classe, Elenco</span>
          </Field>

          <Field label="Como chamar o encontro ou momento? (Raiz: Sessão)">
            <Input
              name="termoSessao"
              value={termoSessao}
              onChange={(e) => setTermoSessao(e.target.value)}
              placeholder="Ex: Treino, Aula, Oficina, Encontro"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">Ex: Treino, Aula, Oficina, Encontro, Prática</span>
          </Field>

          <Field label="Como chamar quem conduz a atividade? (Raiz: Responsável)">
            <Input
              name="termoResponsavel"
              value={termoResponsavel}
              onChange={(e) => setTermoResponsavel(e.target.value)}
              placeholder="Ex: Professor, Instrutor, Treinador, Oficineiro"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">Ex: Professor, Instrutor, Treinador, Oficineiro, Tutor</span>
          </Field>

          <Field label="Como chamar quem frequenta ou pratica? (Raiz: Participante)">
            <Input
              name="termoParticipante"
              value={termoParticipante}
              onChange={(e) => setTermoParticipante(e.target.value)}
              placeholder="Ex: Aluno, Atleta, Corredor, Participante"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">Ex: Aluno, Atleta, Corredor, Participante, Estudante</span>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Perguntas Personalizadas">
        <div className="flex flex-col gap-4">
          {perguntas.map((p, index) => (
            <div key={p.id} className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-[1fr_auto_auto]">
              <Field label="Pergunta">
                <div className="relative">
                  <Input
                    value={p.pergunta}
                    onChange={(e) => atualizarPergunta(index, "pergunta", e.target.value)}
                    className="pr-9"
                  />
                  <HelpCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                </div>
              </Field>
              <div className="flex items-end">
                <Switch
                  checked={p.disponivelInscricao}
                  onChange={(v) => atualizarPergunta(index, "disponivelInscricao", v)}
                  label="Disponível na inscrição?"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="danger" size="sm" onClick={() => removerPergunta(index)}>
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={adicionarPergunta}>
            <Plus className="h-4 w-4" /> Adicionar pergunta
          </Button>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <LinkButton href={backHref} variant="outline">
          Voltar
        </LinkButton>
        <Button type="submit" loading={loading}>
          {loading ? "Salvando..." : "Salvar Atividade"}
        </Button>
      </div>
    </form>
  );
}
