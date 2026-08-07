"use client";

import { useState } from "react";
import Link from "next/link";
import { UserMinus, ArrowRightLeft, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Select } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import { turmasApi, beneficiariosApi, type TurmaApi, type BeneficiarioApi } from "@/lib/api/services";

interface GestaoMatriculasRosterProps {
  turmaAtual: TurmaApi;
  matriculadosIniciais: BeneficiarioApi[];
  outrasTurmas: TurmaApi[];
  todosBeneficiarios: BeneficiarioApi[];
}

export function GestaoMatriculasRoster({
  turmaAtual,
  matriculadosIniciais,
  outrasTurmas,
  todosBeneficiarios,
}: GestaoMatriculasRosterProps) {
  const { toast } = useToast();
  const [matriculados, setMatriculados] = useState<BeneficiarioApi[]>(matriculadosIniciais);

  // Estados de Modais
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [beneficiarioParaAdicionar, setBeneficiarioParaAdicionar] = useState("");

  const [modalMigrar, setModalMigrar] = useState<BeneficiarioApi | null>(null);
  const [turmaDestinoId, setTurmaDestinoId] = useState("");

  const [loading, setLoading] = useState(false);

  // Alunos disponíveis para adicionar (não matriculados na turma atual)
  const disponiveisParaAdicionar = todosBeneficiarios.filter(
    (b) => !matriculados.some((m) => m.id === b.id)
  );

  async function handleAdicionar() {
    if (!beneficiarioParaAdicionar) return;
    setLoading(true);
    try {
      await turmasApi.matricular(turmaAtual.id, beneficiarioParaAdicionar);
      const aluno = todosBeneficiarios.find((b) => b.id === beneficiarioParaAdicionar);
      if (aluno) setMatriculados((prev) => [...prev, aluno]);
      toast.success("Beneficiário matriculado com sucesso na turma!");
      setModalAdicionar(false);
      setBeneficiarioParaAdicionar("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao matricular aluno.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemover(beneficiarioId: string) {
    if (!confirm("Tem certeza que deseja remover este aluno da turma?")) return;
    setLoading(true);
    try {
      await turmasApi.desmatricular(turmaAtual.id, beneficiarioId);
      setMatriculados((prev) => prev.filter((b) => b.id !== beneficiarioId));
      toast.success("Aluno removido da turma com sucesso.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover aluno.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMigrar() {
    if (!modalMigrar || !turmaDestinoId) return;
    setLoading(true);
    try {
      await turmasApi.migrar(modalMigrar.id, turmaAtual.id, turmaDestinoId);
      setMatriculados((prev) => prev.filter((b) => b.id !== modalMigrar.id));
      toast.success("Aluno transferido para a nova turma com sucesso!");
      setModalMigrar(null);
      setTurmaDestinoId("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao transferir aluno.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Alunos Matriculados ({matriculados.length})</h3>
          <p className="text-xs text-zinc-500">Gestão ativa de roster da turma (Adicionar, Remover e Transferir)</p>
        </div>

        <Button onClick={() => setModalAdicionar(true)} size="sm">
          <UserPlus className="h-4 w-4" />
          Adicionar Aluno
        </Button>
      </CardHeader>

      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3">Nome Completo</th>
                <th className="px-4 py-3">Celular / Contato</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {matriculados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">
                    Nenhum aluno matriculado nesta turma até o momento.
                  </td>
                </tr>
              ) : (
                matriculados.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-600">{aluno.matricula}</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      <Link href={`/beneficiarios/${aluno.id}`} className="hover:text-sky-600 hover:underline">
                        {aluno.nomeCompleto}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{aluno.celular || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone="green">Matriculado</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalMigrar(aluno)}
                          title="Transferir / Migrar para outra turma"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          <span>Migrar</span>
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
      </CardBody>

      {/* Modal Adicionar Aluno */}
      {modalAdicionar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-zinc-200">
            <h3 className="text-base font-bold text-zinc-900 mb-1">Matricular Aluno na Turma</h3>
            <p className="text-xs text-zinc-500 mb-4">Selecione um beneficiário já cadastrado para vincular a esta turma.</p>

            <div className="flex flex-col gap-4">
              <Select
                value={beneficiarioParaAdicionar}
                onChange={(e) => setBeneficiarioParaAdicionar(e.target.value)}
              >
                <option value="">Selecione o beneficiário...</option>
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

      {/* Modal Migrar Aluno */}
      {modalMigrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
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
    </Card>
  );
}
