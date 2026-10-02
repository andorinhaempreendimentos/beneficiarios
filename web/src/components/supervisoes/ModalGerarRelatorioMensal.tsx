"use client";

import { useState, useEffect } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { X, FileText, Download, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { formatarData } from "@/lib/utils";
import type { SupervisaoApi, TurmaApi } from "@/lib/api/services";
import { exportarRelatorioMensalSupervisorDocx } from "@/lib/export/exportarRelatorioMensalSupervisorDocx";
import { useToast } from "@/components/providers/ToastProvider";

interface ModalGerarRelatorioMensalProps {
  isOpen: boolean;
  onClose: () => void;
  mes: number;
  ano: number;
  coordenadorNome: string;
  supervisoes: SupervisaoApi[];
  regioesSugeridas: string[];
  professoresMap?: Record<string, string>;
  turmasMap?: Record<string, TurmaApi[]>;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function ModalGerarRelatorioMensal({
  isOpen,
  onClose,
  mes,
  ano,
  coordenadorNome,
  supervisoes,
  regioesSugeridas,
  professoresMap,
  turmasMap,
}: ModalGerarRelatorioMensalProps) {
  const { toast } = useToast();
  const [gerando, setGerando] = useState(false);
  const [mostrarSintese, setMostrarSintese] = useState(false);

  // Campos preenchíveis
  const [regiao, setRegiao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [pontosPositivos, setPontosPositivos] = useState("");
  const [dificuldades, setDificuldades] = useState("");
  const [pendenciasMesSeguinte, setPendenciasMesSeguinte] = useState("");
  const [providenciasNecessarias, setProvidenciasNecessarias] = useState("");

  const nomeMes = MESES[mes - 1] || `Mês ${mes}`;

  useEffect(() => {
    if (isOpen) {
      const regiaoInicial = regioesSugeridas.filter(Boolean).join(" / ") || "Palmas - TO";
      setRegiao(regiaoInicial);
      setDataEntrega(formatarData(new Date().toISOString()));
      setPontosPositivos("");
      setDificuldades("");
      setPendenciasMesSeguinte("");
      setProvidenciasNecessarias("");
      setMostrarSintese(false);
    }
  }, [isOpen, regioesSugeridas]);

  if (!isOpen) return null;

  const totalNucleos = Array.from(new Set(supervisoes.map((s) => s.nucleoId))).length;
  const totalSupervisoes = supervisoes.length;

  async function handleGerarDocx() {
    if (totalSupervisoes === 0) {
      toast.error("Nenhuma supervisão finalizada para gerar relatório.");
      return;
    }

    setGerando(true);
    try {
      await exportarRelatorioMensalSupervisorDocx({
        mes,
        ano,
        coordenadorNome,
        regiao: regiao.trim() || "Palmas - TO",
        dataEntrega: dataEntrega.trim(),
        supervisoes,
        professoresMap,
        turmasMap,
        sinteseMes: {
          pontosPositivos: pontosPositivos.trim(),
          dificuldades: dificuldades.trim(),
          pendenciasMesSeguinte: pendenciasMesSeguinte.trim(),
          providenciasNecessarias: providenciasNecessarias.trim(),
        },
      });

      toast.success("Relatório gerado com sucesso!");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao gerar arquivo Word.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-hidden border border-zinc-200">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Gerar Relatório Mensal de Supervisão
              </h3>
              <p className="text-xs text-zinc-500">
                {nomeMes} de {ano} · Coordenador(a): <strong className="text-zinc-700">{coordenadorNome}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo do formulário com rolagem */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          
          {/* Box de dados consolidados automaticamente */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-900">
            <div>
              <p className="font-semibold text-sky-950 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                Dados automáticos consolidados
              </p>
              <p className="text-sky-700 mt-0.5">
                {totalSupervisoes} supervisão(ões) finalizada(s) em {totalNucleos} núcleo(s) no período.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 self-start sm:self-auto">
              {nomeMes}/{ano}
            </span>
          </div>

          {/* Dados de Identificação faltantes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Região / Coordenação" required>
              <Input
                value={regiao}
                onChange={(e) => setRegiao(e.target.value)}
                placeholder="Ex: Palmas - Região Sul"
              />
            </Field>

            <Field label="Data de entrega do relatório" required>
              <Input
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                placeholder="DD/MM/AAAA"
              />
            </Field>
          </div>

          {/* Seção Síntese do Mês (Opcional) */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setMostrarSintese((prev) => !prev)}
              className="w-full flex items-center justify-between p-4 bg-zinc-50/80 hover:bg-zinc-100/80 transition-colors text-left cursor-pointer"
            >
              <div>
                <span className="text-sm font-semibold text-zinc-800 block">
                  Síntese do Mês (Opcional)
                </span>
                <span className="text-xs text-zinc-500">
                  {mostrarSintese ? "Ocultar campos da síntese" : "Clique para preencher pontos positivos, dificuldades e pendências"}
                </span>
              </div>
              <div className="text-zinc-400">
                {mostrarSintese ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {mostrarSintese && (
              <div className="p-4 bg-white border-t border-zinc-200 flex flex-col gap-4 text-xs">
                <p className="text-zinc-500 italic">
                  * Campos livres e opcionais. Se deixados em branco, a seção não será exibida no documento final.
                </p>

                <Field label="Principais pontos positivos observados">
                  <Textarea
                    rows={2}
                    value={pontosPositivos}
                    onChange={(e) => setPontosPositivos(e.target.value)}
                    placeholder="Ex: Boa participação das crianças, pontualidade do professor..."
                  />
                </Field>

                <Field label="Principais dificuldades/ocorrências">
                  <Textarea
                    rows={2}
                    value={dificuldades}
                    onChange={(e) => setDificuldades(e.target.value)}
                    placeholder="Ex: Desgaste de algumas bolas de futsal, chuva forte no dia 12..."
                  />
                </Field>

                <Field label="Pendências que permanecem para o mês seguinte">
                  <Textarea
                    rows={2}
                    value={pendenciasMesSeguinte}
                    onChange={(e) => setPendenciasMesSeguinte(e.target.value)}
                    placeholder="Ex: Aguardando reposição de redes de trave..."
                  />
                </Field>

                <Field label="Providências e encaminhamentos necessários">
                  <Textarea
                    rows={2}
                    value={providenciasNecessarias}
                    onChange={(e) => setProvidenciasNecessarias(e.target.value)}
                    placeholder="Ex: Solicitação de novos coletes junto à coordenação geral..."
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/70 px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={gerando}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleGerarDocx}
            disabled={gerando || totalSupervisoes === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {gerando ? "Gerando Relatório…" : "Baixar Relatório (.docx)"}
          </Button>
        </div>

      </div>
    </div>
  );
}
