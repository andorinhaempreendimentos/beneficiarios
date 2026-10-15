"use client";

import { useState, useEffect, useMemo } from "react";
import { Button, Field, Input, Select, Badge } from "@/components/ui";
import {
  regioesApi,
  nucleosApi,
  type RegiaoApi,
  type ObjetoApi,
  type NucleoApi,
} from "@/lib/api/services";
import { X, MapPin, Building2, AlertTriangle, Check, Layers } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface ModalRegiaoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  regiaoParaEditar?: RegiaoApi | null;
  objetos: ObjetoApi[];
}

export function ModalRegiaoForm({
  isOpen,
  onClose,
  onSuccess,
  regiaoParaEditar,
  objetos,
}: ModalRegiaoFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [carregandoNucleos, setCarregandoNucleos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [objetoId, setObjetoId] = useState("");
  const [nucleosDoObjeto, setNucleosDoObjeto] = useState<NucleoApi[]>([]);
  const [nucleosSelecionados, setNucleosSelecionados] = useState<Set<string>>(new Set());
  const [buscaNucleo, setBuscaNucleo] = useState("");

  // Inicializa os dados ao abrir ou trocar a região de edição
  useEffect(() => {
    if (regiaoParaEditar) {
      setNome(regiaoParaEditar.nome || "");
      setDescricao(regiaoParaEditar.descricao || "");
      setObjetoId(regiaoParaEditar.objetoId || (objetos[0]?.id ?? ""));
      const iniciais = new Set<string>((regiaoParaEditar.nucleos ?? []).map((n) => n.id));
      setNucleosSelecionados(iniciais);
    } else {
      setNome("");
      setDescricao("");
      setObjetoId(objetos[0]?.id ?? "");
      setNucleosSelecionados(new Set());
    }
    setBuscaNucleo("");
    setErro(null);
  }, [regiaoParaEditar, isOpen, objetos]);

  // Carrega os núcleos pertencentes ao Objeto selecionado
  useEffect(() => {
    if (!isOpen || !objetoId) {
      setNucleosDoObjeto([]);
      return;
    }

    let ativo = true;
    setCarregandoNucleos(true);

    nucleosApi
      .list({ objetoId, limit: 100 })
      .then((res) => {
        if (!ativo) return;
        const lista = res.data ?? [];
        setNucleosDoObjeto(lista);

        // Se estiver editando, garante que os núcleos que já tinham regiao_id desta região venham marcados
        if (regiaoParaEditar && regiaoParaEditar.id) {
          const vinculadosDesta = lista
            .filter((n) => n.regiaoId === regiaoParaEditar.id)
            .map((n) => n.id);
          setNucleosSelecionados(new Set(vinculadosDesta));
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar núcleos do objeto:", err);
      })
      .finally(() => {
        if (ativo) setCarregandoNucleos(false);
      });

    return () => {
      ativo = false;
    };
  }, [objetoId, isOpen, regiaoParaEditar]);

  function handleToggleNucleo(id: string) {
    setNucleosSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Filtragem local na lista de núcleos para facilitar quando houver muitos
  const nucleosFiltrados = useMemo(() => {
    if (!buscaNucleo.trim()) return nucleosDoObjeto;
    const termo = buscaNucleo.toLowerCase();
    return nucleosDoObjeto.filter(
      (n) =>
        n.identificacao.toLowerCase().includes(termo) ||
        (n.cidade && n.cidade.toLowerCase().includes(termo)) ||
        (n.bairro && n.bairro.toLowerCase().includes(termo))
    );
  }, [nucleosDoObjeto, buscaNucleo]);

  // Identifica se há núcleos sendo transferidos de outra região
  const nucleosTransferidos = useMemo(() => {
    return nucleosDoObjeto.filter((n) => {
      const estaMarcado = nucleosSelecionados.has(n.id);
      const pertenceOutra = n.regiaoId && (!regiaoParaEditar || n.regiaoId !== regiaoParaEditar.id);
      return estaMarcado && pertenceOutra;
    });
  }, [nucleosDoObjeto, nucleosSelecionados, regiaoParaEditar]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("O nome da região é obrigatório.");
      return;
    }
    if (!objetoId) {
      setErro("Selecione um objeto de fomento para a região.");
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        objetoId,
        nucleoIds: Array.from(nucleosSelecionados),
      };

      if (regiaoParaEditar) {
        await regioesApi.update(regiaoParaEditar.id, payload);
        toast.success("Região atualizada e núcleos associados com sucesso!");
      } else {
        await regioesApi.create(payload);
        toast.success("Região criada e núcleos vinculados com sucesso!");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar região:", err);
      setErro(err?.message || "Erro ao salvar região. Verifique suas permissões.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {regiaoParaEditar ? "Editar Região & Alocação de Núcleos" : "Nova Região"}
              </h2>
              <p className="text-xs text-zinc-500">
                Agrupe os núcleos territoriais vinculados ao projeto de fomento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {erro && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Projeto / Objeto" required>
              <Select
                value={objetoId}
                onChange={(e) => setObjetoId(e.target.value)}
                disabled={loading || Boolean(regiaoParaEditar)}
              >
                {objetos.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.nome}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Nome da Região" required>
              <Input
                placeholder="Ex: Região Norte, Polo Litoral..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={loading}
              />
            </Field>
          </div>

          <Field label="Descrição (opcional)">
            <Input
              placeholder="Breve descrição da abrangência ou características territoriais..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={loading}
            />
          </Field>

          {/* Seção de Alocação de Núcleos em Lote com Conferência */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-sky-600" />
                  Núcleos Pertencentes à Região ({nucleosSelecionados.size} selecionados)
                </h3>
                <p className="text-xs text-zinc-500">
                  Marque os núcleos que devem fazer parte desta região. Cardinalidade 1:N garantida.
                </p>
              </div>

              {nucleosDoObjeto.length > 5 && (
                <div className="w-full sm:w-48">
                  <Input
                    placeholder="Filtrar núcleos..."
                    value={buscaNucleo}
                    onChange={(e) => setBuscaNucleo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Aviso de transferência de cardinalidade */}
            {nucleosTransferidos.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Aviso de Transferência de Região:</span>
                  <p className="mt-0.5">
                    {nucleosTransferidos.length === 1
                      ? `O núcleo "${nucleosTransferidos[0].identificacao}" já pertence a outra região (${nucleosTransferidos[0].regiaoNome || nucleosTransferidos[0].regiao}) e será transferido para esta ao salvar.`
                      : `${nucleosTransferidos.length} núcleos selecionados já pertencem a outras regiões e serão transferidos para esta ao salvar.`}
                  </p>
                </div>
              </div>
            )}

            {/* Lista de seleção */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 bg-white dark:bg-zinc-900">
              {carregandoNucleos ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Carregando núcleos do projeto...
                </div>
              ) : nucleosFiltrados.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  {buscaNucleo ? "Nenhum núcleo encontrado para o filtro." : "Nenhum núcleo cadastrado neste projeto."}
                </div>
              ) : (
                nucleosFiltrados.map((nucleo) => {
                  const isChecked = nucleosSelecionados.has(nucleo.id);
                  const pertenceAtual = nucleo.regiaoId === regiaoParaEditar?.id;
                  const pertenceOutra = nucleo.regiaoId && (!regiaoParaEditar || nucleo.regiaoId !== regiaoParaEditar.id);
                  const semRegiao = !nucleo.regiaoId;

                  return (
                    <label
                      key={nucleo.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-sky-50/70 border-sky-300 dark:bg-sky-950/40 dark:border-sky-800"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleNucleo(nucleo.id)}
                          className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                        />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {nucleo.identificacao}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {[nucleo.bairro, nucleo.cidade, nucleo.estado].filter(Boolean).join(" • ")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {pertenceAtual && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Atual
                          </span>
                        )}
                        {pertenceOutra && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Em: {nucleo.regiaoNome || nucleo.regiao || "Outra"}
                          </span>
                        )}
                        {semRegiao && (
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            Sem região
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : regiaoParaEditar ? "Salvar Alterações" : "Criar Região"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
