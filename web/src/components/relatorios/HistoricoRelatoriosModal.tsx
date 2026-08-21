"use client";

import { useEffect, useState } from "react";
import { formatarData } from "@/lib/utils";
import { prestacaoContasApi } from "@/lib/api/prestacaoContas";
import { Button, Badge } from "@/components/ui";
import { History, Eye, X, Calendar, FileText } from "lucide-react";

interface HistoricoRelatoriosModalProps {
  objetoId?: string;
  isOpen: boolean;
  onClose: () => void;
  onCarregarRelatorio: (relatorio: any) => void;
}

export function HistoricoRelatoriosModal({
  objetoId,
  isOpen,
  onClose,
  onCarregarRelatorio,
}: HistoricoRelatoriosModalProps) {
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      prestacaoContasApi
        .listarHistorico(objetoId)
        .then((res) => setRelatorios(res))
        .catch((err) => console.error("Erro ao carregar histórico:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, objetoId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-sky-600" />
            <h3 className="text-base font-bold text-zinc-900">
              Histórico de Relatórios de Prestação de Contas Salvos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading && (
            <div className="py-8 text-center text-xs text-zinc-400">
              Carregando histórico de relatórios...
            </div>
          )}

          {!loading && relatorios.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-400">
              Nenhum relatório de prestação de contas salvo para este objeto até o momento.
            </div>
          )}

          {!loading &&
            relatorios.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 hover:border-sky-300 hover:bg-sky-50/30 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">
                      Período: {formatarData(r.data_inicio)} a {formatarData(r.data_fim)}
                    </span>
                    <Badge tone="sky">{r.tipo_periodo}</Badge>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Emitido em {new Date(r.created_at).toLocaleString("pt-BR")} por {r.usuarios?.nome_completo || "Administrador"}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onCarregarRelatorio(r);
                    onClose();
                  }}
                >
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Visualizar Snapshot
                </Button>
              </div>
            ))}
        </div>

        <div className="border-t border-zinc-200 px-6 py-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
