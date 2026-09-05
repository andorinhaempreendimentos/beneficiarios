"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, Shield, Key, Lock, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, Field, Input, Select, Switch, Textarea } from "@/components/ui";
import { funcoesApi, perfisApi, type FuncaoApi, type PerfilApi, type TipoAlocacaoFuncao } from "@/lib/api/services";
import { useToast } from "@/components/providers/ToastProvider";
import { useQuery } from "@/lib/hooks/useQuery";

interface FuncoesManagerProps {
  inicialFuncoes: FuncaoApi[];
}

export const TIPO_ALOCACAO_CONFIG: Record<TipoAlocacaoFuncao, { label: string; tone: "sky" | "green" | "amber" | "violet"; desc: string }> = {
  admin_geral: { label: "Admin Geral (Sede)", tone: "sky", desc: "Gestão central sem vínculo a núcleo esportivo" },
  admin_nucleo: { label: "Admin no Núcleo", tone: "green", desc: "Gestão administrativa local no polo esportivo" },
  operacional_geral: { label: "Operacional Geral", tone: "violet", desc: "Equipe técnica/saúde volante que atende múltiplos locais" },
  operacional_nucleo: { label: "Operacional no Núcleo", tone: "amber", desc: "Professores, instrutores e staff de campo vinculados ao núcleo" },
};

export function FuncoesManager({ inicialFuncoes }: FuncoesManagerProps) {
  const { toast } = useToast();
  const { data: perfisRes } = useQuery(() => perfisApi.list({ limit: 100 }), []);
  const perfis = perfisRes?.data ?? [];

  const [funcoes, setFuncoes] = useState<FuncaoApi[]>(inicialFuncoes);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [tipoAlocacao, setTipoAlocacao] = useState<TipoAlocacaoFuncao>("operacional_nucleo");
  const [permiteLogin, setPermiteLogin] = useState(true);
  const [exigeConselho, setExigeConselho] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Por favor, informe o nome da função.");
      return;
    }
    if (!perfilId) {
      toast.error("Por favor, selecione o perfil de acesso vinculado.");
      return;
    }

    setLoading(true);
    try {
      if (editandoId) {
        const atualizada = await funcoesApi.update(editandoId, {
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          permiteLogin,
          exigeConselho,
          perfilId,
          tipoAlocacao,
        });
        setFuncoes((prev) => prev.map((f) => (f.id === editandoId ? { ...f, ...atualizada, permiteLogin, exigeConselho, perfilId, tipoAlocacao } : f)));
        toast.success("Função atualizada com sucesso!");
      } else {
        const nova = await funcoesApi.create({
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          permiteLogin,
          exigeConselho,
          perfilId,
          tipoAlocacao,
        });
        setFuncoes((prev) => [...prev, { ...nova, permiteLogin, exigeConselho, perfilId, tipoAlocacao }]);
        toast.success("Nova função cadastrada!");
      }
      limparForm();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar função.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(f: FuncaoApi) {
    setEditandoId(f.id);
    setNome(f.nome);
    setDescricao(f.descricao || "");
    setPerfilId(f.perfilId || "");
    setTipoAlocacao(f.tipoAlocacao || "operacional_nucleo");
    setPermiteLogin(f.permiteLogin ?? true);
    setExigeConselho(f.exigeConselho ?? false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover esta função?")) return;
    try {
      await funcoesApi.delete(id);
      setFuncoes((prev) => prev.filter((f) => f.id !== id));
      toast.success("Função removida.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover função.");
    }
  }

  function limparForm() {
    setEditandoId(null);
    setNome("");
    setDescricao("");
    setPerfilId("");
    setTipoAlocacao("operacional_nucleo");
    setPermiteLogin(true);
    setExigeConselho(false);
  }


  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Formulário de Cadastro / Edição */}
      <Card className="p-5 lg:col-span-1 h-fit">
        <h3 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3 mb-4">
          {editandoId ? "Editar Função" : "Cadastrar Nova Função"}
        </h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Field label="Nome da Função" required>
            <Input
              placeholder="Ex: Coordenador Pedagógico"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>
          <Field label="Descrição">
            <Textarea
              placeholder="Descreva as responsabilidades desta função..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </Field>

          <Field label="Perfil de Acesso Vinculado (RBAC)" required>
            <Select
              value={perfilId}
              onChange={(e) => setPerfilId(e.target.value)}
            >
              <option value="">Selecione o perfil de acesso...</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </Field>

          <Field label="Tipo de Alocação / Lotação" required>
            <Select
              value={tipoAlocacao}
              onChange={(e) => setTipoAlocacao(e.target.value as TipoAlocacaoFuncao)}
            >
              <option value="admin_geral">Administração Geral (Sede / Sem polo fixo)</option>
              <option value="admin_nucleo">Administração no Núcleo (Gestão de Polo)</option>
              <option value="operacional_geral">Não-Administrativa Geral (Volante / Itinerante)</option>
              <option value="operacional_nucleo">Não-Administrativa no Núcleo (Professores / Staff de Polo)</option>
            </Select>
            <p className="text-[11px] text-zinc-500 mt-1">
              {TIPO_ALOCACAO_CONFIG[tipoAlocacao]?.desc}
            </p>
          </Field>

          {/* Toggle de Direito a Login */}
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${permiteLogin ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"}`}>
                {permiteLogin ? <Key className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800">Direito a Login no Sistema</p>
                <p className="text-[11px] text-zinc-500">Permitir conta para colaboradores nesta função</p>
              </div>
            </div>
            <Switch
              checked={permiteLogin}
              onChange={setPermiteLogin}
            />
          </div>

          {/* Toggle de Exige Conselho de Classe */}
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${exigeConselho ? "bg-purple-100 text-purple-700" : "bg-zinc-200 text-zinc-600"}`}>
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800">Exige Conselho de Classe</p>
                <p className="text-[11px] text-zinc-500">Ex: CREFITO, COREN, CREF</p>
              </div>
            </div>
            <Switch
              checked={exigeConselho}
              onChange={setExigeConselho}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            {editandoId && (
              <Button type="button" variant="outline" onClick={limparForm}>
                Cancelar
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {editandoId ? "Salvar Alterações" : "Adicionar Função"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista de Funções */}
      <Card className="p-5 lg:col-span-2">
        <h3 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3 mb-4 flex items-center justify-between">
          <span>Funções Cadastradas</span>
          <span className="text-xs text-zinc-500 font-normal">{funcoes.length} funções</span>
        </h3>
        {funcoes.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">
            Nenhuma função cadastrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {funcoes.map((f) => {
              const temLogin = f.permiteLogin ?? (f.nome !== "Staff");
              const perfilVinculado = perfis.find((p) => p.id === f.perfilId);
              const alocCfg = TIPO_ALOCACAO_CONFIG[f.tipoAlocacao || "operacional_nucleo"];
              return (
                <div key={f.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-50/60 p-2 rounded-xl transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-semibold text-zinc-900 text-sm">{f.nome}</h4>
                        {alocCfg && (
                          <Badge tone={alocCfg.tone}>
                            {alocCfg.label}
                          </Badge>
                        )}
                        {perfilVinculado && (
                          <Badge tone="sky">
                            <ShieldCheck className="h-3 w-3 mr-1 inline" /> {perfilVinculado.nome}
                          </Badge>
                        )}
                        {temLogin ? (
                          <Badge tone="green">
                            <Key className="h-3 w-3 mr-1 inline" /> Login
                          </Badge>
                        ) : (
                          <Badge tone="zinc">
                            <Lock className="h-3 w-3 mr-1 inline" /> Sem Login
                          </Badge>
                        )}
                        {f.exigeConselho && (
                          <Badge tone="violet">
                            <Shield className="h-3 w-3 mr-1 inline" /> Conselho Obrigatório
                          </Badge>
                        )}
                      </div>
                      {f.descricao ? (
                        <p className="text-xs text-zinc-500 mt-0.5">{f.descricao}</p>
                      ) : (
                        <p className="text-xs text-zinc-400 italic mt-0.5">Sem descrição</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(f)}
                      className="p-1.5 text-zinc-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
