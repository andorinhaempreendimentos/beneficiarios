"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  Search,
  BookOpen,
  Link2,
  Copy,
  X,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Select } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  turmasApi,
  beneficiariosApi,
  type TurmaApi,
  type BeneficiarioApi,
} from "@/lib/api/services";

interface GestaoMatriculasProfessorProps {
  turmas: TurmaApi[];
  todosBeneficiarios: BeneficiarioApi[];
  isOpen: boolean;
  onClose: () => void;
}

export function GestaoMatriculasProfessor({
  turmas,
  todosBeneficiarios,
  isOpen,
  onClose,
}: GestaoMatriculasProfessorProps) {
  const { toast } = useToast();
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(turmas[0]?.id || "");
  const [busca, setBusca] = useState("");

  // Modais internos
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [beneficiarioParaAdicionar, setBeneficiarioParaAdicionar] = useState("");

  const [modalMigrar, setModalMigrar] = useState<BeneficiarioApi | null>(null);
  const [turmaDestinoId, setTurmaDestinoId] = useState("");

  const [loading, setLoading] = useState(false);

  // Busca beneficiários da turma selecionada
  const { data: beneficiariosRes, refetch } = useQuery(
    () =>
      turmaSelecionadaId
        ? beneficiariosApi.list({ turmaId: turmaSelecionadaId, limit: 200 })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 200 }),
    [turmaSelecionadaId]
  );

  const matriculados = beneficiariosRes?.data ?? [];
  const turmaAtual = turmas.find((t) => t.id === turmaSelecionadaId);

  const matriculadosFiltrados = matriculados.filter(
    (b) =>
      b.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
      b.matricula.toLowerCase().includes(busca.toLowerCase())
  );

  // Apenas beneficiários que NÃO possuem NENHUMA turma vinculada (não alocados)
  const disponiveisParaAdicionar = todosBeneficiarios.filter((b) => {
    const temAlgumaTurma = Boolean(b.turmasInfo && b.turmasInfo.length > 0);
    return !temAlgumaTurma;
  });

  const outrasTurmas = turmas.filter((t) => t.id !== turmaSelecionadaId);

  async function handleAdicionar() {
    if (!beneficiarioParaAdicionar || !turmaSelecionadaId) return;
    setLoading(true);
    try {
      await turmasApi.matricular(turmaSelecionadaId, beneficiarioParaAdicionar);
      toast.success("Aluno matriculado na turma com sucesso!");
      setModalAdicionar(false);
      setBeneficiarioParaAdicionar("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao matricular aluno.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemover(beneficiarioId: string) {
    if (!confirm("Deseja realmente desmatricular (evadir) este aluno da turma?")) return;
    setLoading(true);
    try {
      await turmasApi.desmatricular(turmaSelecionadaId, beneficiarioId);
      toast.success("Aluno removido da turma com sucesso.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover aluno.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMigrar() {
    if (!modalMigrar || !turmaDestinoId || !turmaSelecionadaId) return;
    setLoading(true);
    try {
      await turmasApi.migrar(modalMigrar.id, turmaSelecionadaId, turmaDestinoId);
      toast.success("Aluno transferido para a nova turma!");
      setModalMigrar(null);
      setTurmaDestinoId("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao transferir aluno.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopiarLinkInscricao() {
    if (!turmaSelecionadaId) {
      toast.error("Selecione uma turma para copiar o link de inscrição.");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const linkInscricao = `${origin}/inscricao?turmaId=${turmaSelecionadaId}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(linkInscricao);
      toast.success(`Link de inscrição público da turma "${turmaAtual?.nome || 'selecionada'}" copiado com sucesso!`);
    } else {
      toast.info(`Link de inscrição: ${linkInscricao}`);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50/50">
          <div>
            <h2 className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-sky-600" />
              <span>Gestão de Matrículas do Professor</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Adicionar, remover, transferir ou compartilhar link de inscrição das turmas
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-sky-50/60 p-4 rounded-2xl border border-sky-100">
            {/* Seletor de Turma */}
            <div className="w-full sm:w-72">
              <label className="text-[11px] font-bold text-sky-900 uppercase block mb-1">Selecionar Turma</label>
              <Select
                value={turmaSelecionadaId}
                onChange={(e) => setTurmaSelecionadaId(e.target.value)}
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({t.vagasTotais} vagas)
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto self-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopiarLinkInscricao}
                className="w-full sm:w-auto bg-white hover:bg-sky-50 text-sky-700 border-sky-300 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Link2 className="h-4 w-4 text-sky-600" />
                <span>Copiar Link de Inscrição</span>
              </Button>

              <Button onClick={() => setModalAdicionar(true)} size="sm" className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4" />
                <span>Matricular Novo Aluno</span>
              </Button>
            </div>
          </div>

          {/* Barra de Busca de Aluno na Turma */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar aluno na turma por nome ou matrícula…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 pl-9 pr-4 py-2.5 text-xs focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Tabela de Alunos */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3">Matrícula</th>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Contato / Celular</th>
                  <th className="px-4 py-3 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {matriculadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-400 text-xs">
                      Nenhum aluno encontrado para esta turma.
                    </td>
                  </tr>
                ) : (
                  matriculadosFiltrados.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-600">{aluno.matricula}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900">{aluno.nomeCompleto}</td>
                      <td className="px-4 py-3 text-zinc-600 text-xs">{aluno.celular || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalMigrar(aluno)}
                            title="Transferir aluno de turma"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            <span>Transferir</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemover(aluno.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            title="Remover aluno da turma"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            <span>Remover</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Matricular Aluno (Secundário) */}
        {modalAdicionar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-zinc-200">
              <h3 className="text-base font-bold text-zinc-900 mb-1">Matricular Aluno na Turma</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Selecione o aluno para matricular na turma <strong className="text-zinc-800">{turmaAtual?.nome}</strong>.
              </p>

              <div className="flex flex-col gap-4">
                <Select
                  value={beneficiarioParaAdicionar}
                  onChange={(e) => setBeneficiarioParaAdicionar(e.target.value)}
                >
                  <option value="">Selecione o aluno...</option>
                  {disponiveisParaAdicionar.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nomeCompleto} ({b.matricula})
                    </option>
                  ))}
                </Select>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setModalAdicionar(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAdicionar} disabled={loading || !beneficiarioParaAdicionar}>
                    Confirmar Matrícula
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Transferir Aluno (Secundário) */}
        {modalMigrar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-zinc-200">
              <h3 className="text-base font-bold text-zinc-900 mb-1">Transferir Aluno de Turma</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Transfira <strong className="text-zinc-800">{modalMigrar.nomeCompleto}</strong> para outra turma.
              </p>

              <div className="flex flex-col gap-4">
                <Select
                  value={turmaDestinoId}
                  onChange={(e) => setTurmaDestinoId(e.target.value)}
                >
                  <option value="">Selecione a turma de destino...</option>
                  {outrasTurmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.vagasTotais} vagas)
                    </option>
                  ))}
                </Select>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setModalMigrar(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleMigrar} disabled={loading || !turmaDestinoId}>
                    Confirmar Transferência
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
