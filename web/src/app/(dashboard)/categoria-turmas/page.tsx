"use client";

import { useState, useCallback } from "react";
import { Trash2, Pencil, Plus, X, Check } from "lucide-react";
import {
  Card,
  PageHeader,
  Input,
  Badge,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  categoriaTurmasApi,
  type Paginated,
  type CategoriaTurmaApi,
} from "@/lib/api/services";

type FormData = {
  nome: string;
  sigla: string;
  idadeMinima: string;
  idadeMaxima: string;
};

const EMPTY_FORM: FormData = { nome: "", sigla: "", idadeMinima: "", idadeMaxima: "" };

export default function CategoriaTurmasPage() {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const { data: pageData, loading, refetch } = useQuery<Paginated<CategoriaTurmaApi>>(
    () => categoriaTurmasApi.list({ limit: 50 }),
    [],
  );

  const categorias = pageData?.data ?? [];

  const iniciarCriacao = useCallback(() => {
    setCriando(true);
    setEditandoId(null);
    setForm(EMPTY_FORM);
  }, []);

  const iniciarEdicao = useCallback((cat: CategoriaTurmaApi) => {
    setEditandoId(cat.id);
    setCriando(false);
    setForm({
      nome: cat.nome,
      sigla: cat.sigla,
      idadeMinima: String(cat.idadeMinima),
      idadeMaxima: String(cat.idadeMaxima),
    });
  }, []);

  const cancelar = useCallback(() => {
    setCriando(false);
    setEditandoId(null);
    setForm(EMPTY_FORM);
  }, []);

  const salvar = async () => {
    const body = {
      nome: form.nome.trim(),
      sigla: form.sigla.trim(),
      idadeMinima: Number(form.idadeMinima),
      idadeMaxima: Number(form.idadeMaxima),
    };
    if (!body.nome || !body.sigla || isNaN(body.idadeMinima) || isNaN(body.idadeMaxima)) {
      alert("Preencha todos os campos corretamente.");
      return;
    }
    if (body.idadeMinima > body.idadeMaxima) {
      alert("Idade mínima não pode ser maior que a máxima.");
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) {
        await categoriaTurmasApi.update(editandoId, body);
      } else {
        await categoriaTurmasApi.create(body);
      }
      cancelar();
      refetch();
    } catch (err: any) {
      alert("Erro ao salvar: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    setExcluindoId(id);
    try {
      await categoriaTurmasApi.remove(id);
      refetch();
    } catch (err: any) {
      alert("Erro ao excluir: " + (err?.message || "Ocorreu um erro."));
    } finally {
      setExcluindoId(null);
    }
  };

  const formRow = (
    <tr className="border-b border-zinc-100 bg-sky-50/30">
      <td className="px-5 py-2">
        <Input
          placeholder="Ex: Sub-6"
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          className="text-sm"
        />
      </td>
      <td className="px-5 py-2">
        <Input
          placeholder="Ex: S6"
          value={form.sigla}
          onChange={(e) => setForm((f) => ({ ...f, sigla: e.target.value }))}
          className="text-sm"
        />
      </td>
      <td className="px-5 py-2">
        <Input
          type="number"
          placeholder="5"
          value={form.idadeMinima}
          onChange={(e) => setForm((f) => ({ ...f, idadeMinima: e.target.value }))}
          className="text-sm w-20"
        />
      </td>
      <td className="px-5 py-2">
        <Input
          type="number"
          placeholder="6"
          value={form.idadeMaxima}
          onChange={(e) => setForm((f) => ({ ...f, idadeMaxima: e.target.value }))}
          className="text-sm w-20"
        />
      </td>
      <td className="px-5 py-2 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={cancelar}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Categorias de Turma"
        description="Faixas etárias padrão utilizadas nas turmas do projeto"
        actions={
          <button
            type="button"
            onClick={iniciarCriacao}
            disabled={criando}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nova categoria
          </button>
        }
      />

      <Card>
        {loading && (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando…</div>
        )}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Sigla</th>
                  <th className="px-5 py-3">Idade Mín.</th>
                  <th className="px-5 py-3">Idade Máx.</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {criando && formRow}
                {categorias.length === 0 && !criando ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-400">
                      Nenhuma categoria cadastrada.
                    </td>
                  </tr>
                ) : (
                  categorias.map((cat) =>
                    editandoId === cat.id ? (
                      <tr key={cat.id}>{formRow.props.children}</tr>
                    ) : (
                      <tr
                        key={cat.id}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                      >
                        <td className="px-5 py-3 font-medium text-zinc-900">{cat.nome}</td>
                        <td className="px-5 py-3">
                          <Badge tone="sky">{cat.sigla}</Badge>
                        </td>
                        <td className="px-5 py-3 text-zinc-600">{cat.idadeMinima} anos</td>
                        <td className="px-5 py-3 text-zinc-600">{cat.idadeMaxima} anos</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicao(cat)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <span className="text-zinc-300">|</span>
                            <button
                              type="button"
                              onClick={() => excluir(cat.id)}
                              disabled={excluindoId === cat.id}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {excluindoId === cat.id ? "Excluindo..." : "Excluir"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
