"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  History,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { Button, Card, CardBody, PageHeader, Select, Input } from "@/components/ui";
import { FiltrosRelatorio, type FiltrosState } from "@/components/relatorios/FiltrosRelatorio";
import { TabelaParticipacao } from "@/components/relatorios/TabelaParticipacao";
import { TabelaPresenca } from "@/components/relatorios/TabelaPresenca";
import { TabelaRH } from "@/components/relatorios/TabelaRH";
import { TabelaCidade } from "@/components/relatorios/TabelaCidade";
import { TabelaMinisterio } from "@/components/relatorios/TabelaMinisterio";
import { PainelProntidao } from "@/components/relatorios/PainelProntidao";
import { RelatorioPrestacaoContasView } from "@/components/relatorios/RelatorioPrestacaoContasView";
import { HistoricoRelatoriosModal } from "@/components/relatorios/HistoricoRelatoriosModal";
import { cn } from "@/lib/utils";
import {
  objetosApi,
  prestacaoContasApi,
  type ObjetoApi,
  type AlertaProntidao,
  type DadosRelatorioPrestacaoContas,
} from "@/lib/api/services";

type TipoRelatorio = "prestacao_contas" | "participacao" | "presenca" | "rh" | "cidade" | "ministerio";

const TIPOS: { id: TipoRelatorio; label: string; desc: string; destaque?: boolean }[] = [
  {
    id: "prestacao_contas",
    label: "Prestação de Contas",
    desc: "Relatório de Execução Oficial (16 Seções)",
    destaque: true,
  },
  { id: "participacao", label: "Participação", desc: "Beneficiários por turma e status" },
  { id: "presenca", label: "Presença", desc: "Frequência por beneficiário e turma" },
  { id: "rh", label: "Recursos Humanos", desc: "Pessoal por função e carga horária" },
  { id: "cidade", label: "Por cidade", desc: "Distribuição geográfica de beneficiários" },
  { id: "ministerio", label: "Ministério do Esporte", desc: "Formato oficial para prestação de contas" },
];

const FILTROS_INICIAL: FiltrosState = {
  objetoId: "",
  nucleoId: "",
  atividadeId: "",
  turmaId: "",
  status: "",
  dataInicio: "2026-01-01",
  dataFim: "2026-03-31",
};

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState<TipoRelatorio>("prestacao_contas");
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_INICIAL);

  // Parâmetros do Relatório de Prestação de Contas
  const [objetos, setObjetos] = useState<ObjetoApi[]>([]);
  const [objetoSelecionadoId, setObjetoSelecionadoId] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("2026-01-01");
  const [dataFim, setDataFim] = useState<string>("2026-03-31");
  const [tipoPeriodo, setTipoPeriodo] = useState<string>("trimestral");

  // Dados do Relatório
  const [dadosRelatorio, setDadosRelatorio] = useState<DadosRelatorioPrestacaoContas | null>(null);
  const [alertasProntidao, setAlertasProntidao] = useState<AlertaProntidao[]>([]);
  const [loadingDados, setLoadingDados] = useState<boolean>(false);
  const [salvandoRelatorio, setSalvandoRelatorio] = useState<boolean>(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState<boolean>(false);

  // Carregar lista de objetos
  useEffect(() => {
    objetosApi.list({ limit: 50 }).then((res) => {
      setObjetos(res.data);
      if (res.data.length > 0) {
        if (!objetoSelecionadoId) setObjetoSelecionadoId(res.data[0].id);
        setFiltros((prev) => ({ ...prev, objetoId: prev.objetoId || res.data[0].id }));
      }
    });
  }, [objetoSelecionadoId]);

  // Carregar dados e prontidão sempre que o objeto ou período mudar
  useEffect(() => {
    if (!objetoSelecionadoId || tipo !== "prestacao_contas") return;

    let cancelado = false;
    setLoadingDados(true);

    Promise.all([
      prestacaoContasApi.obterDadosRelatorio(objetoSelecionadoId, dataInicio, dataFim, tipoPeriodo),
      prestacaoContasApi.verificarProntidao(objetoSelecionadoId, dataInicio, dataFim),
    ])
      .then(([dados, alertas]) => {
        if (!cancelado) {
          setDadosRelatorio(dados);
          setAlertasProntidao(alertas);
        }
      })
      .catch((err) => {
        console.error("Erro ao compilar prestação de contas:", err);
      })
      .finally(() => {
        if (!cancelado) setLoadingDados(false);
      });

    return () => {
      cancelado = true;
    };
  }, [objetoSelecionadoId, dataInicio, dataFim, tipoPeriodo, tipo]);

  async function handleSalvarRelatorio(pareceres: any, signatarios: any) {
    if (!dadosRelatorio || !objetoSelecionadoId) return;
    setSalvandoRelatorio(true);
    try {
      await prestacaoContasApi.salvarRelatorioEmitido({
        objetoId: objetoSelecionadoId,
        dataInicio,
        dataFim,
        tipoPeriodo,
        dadosSnapshot: dadosRelatorio,
        pareceres,
        signatarios,
      });
      alert("Relatório de Prestação de Contas arquivado com sucesso no histórico!");
    } catch (err: any) {
      alert("Erro ao salvar relatório: " + (err.message || err));
    } finally {
      setSalvandoRelatorio(false);
    }
  }

  function handleCarregarRelatorioSalvo(relatorio: any) {
    if (relatorio.dados_snapshot) {
      setDadosRelatorio(relatorio.dados_snapshot);
      setDataInicio(relatorio.data_inicio);
      setDataFim(relatorio.data_fim);
      setTipoPeriodo(relatorio.tipo_periodo);
      setObjetoSelecionadoId(relatorio.objeto_id);
    }
  }

  return (
    <div className="flex flex-col gap-6 print:gap-0">
      <div className="print:hidden">
        <PageHeader
          title="Relatórios & Prestação de Contas"
          description="Gere o Relatório Oficial de Execução do Objeto e relatórios operacionais consolidados"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalHistoricoAberto(true)}
              >
                <History className="mr-1.5 h-3.5 w-3.5" />
                Histórico de Emissões
              </Button>
            </div>
          }
        />
      </div>

      {/* Seletor de Tipo de Relatório */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 print:hidden">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTipo(t.id)}
            className={cn(
              "flex flex-col gap-0.5 rounded-xl border p-3 text-left text-sm transition-colors",
              tipo === t.id
                ? "border-sky-500 bg-sky-50 text-sky-900 shadow-sm"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
              t.destaque && tipo !== t.id && "border-sky-200 bg-sky-50/30"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs">{t.label}</span>
              {t.destaque && (
                <span className="rounded bg-sky-100 px-1 py-0.2 text-[9px] font-bold text-sky-700">
                  OFICIAL
                </span>
              )}
            </div>
            <span className={cn("text-[11px]", tipo === t.id ? "text-sky-700" : "text-zinc-400")}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      {/* SEÇÃO 1: PRESTAÇÃO DE CONTAS OFICIAL */}
      {tipo === "prestacao_contas" && (
        <div className="flex flex-col gap-6">
          {/* Barra de Filtros e Parâmetros da Prestação de Contas */}
          <Card className="print:hidden">
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">Objeto / Parceria</label>
                <Select
                  value={objetoSelecionadoId}
                  onChange={(e) => setObjetoSelecionadoId(e.target.value)}
                  className="mt-1"
                >
                  {objetos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome} ({o.termoDeFomento || "Termo de Colaboração"})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700">Período de Execução</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700">Periodicidade</label>
                <Select
                  value={tipoPeriodo}
                  onChange={(e) => setTipoPeriodo(e.target.value)}
                  className="mt-1 text-xs"
                >
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral (Padrão)</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual (Consolidado)</option>
                </Select>
              </div>
            </CardBody>
          </Card>

          {/* Painel de Prontidão Operacional */}
          <div className="print:hidden">
            <PainelProntidao alertas={alertasProntidao} loading={loadingDados} />
          </div>

          {/* Documento do Relatório Oficial */}
          {loadingDados && (
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-zinc-500 animate-pulse">
              Compilando dados das 16 seções do Relatório de Prestação de Contas...
            </div>
          )}

          {!loadingDados && dadosRelatorio && (
            <RelatorioPrestacaoContasView
              dados={dadosRelatorio}
              onSalvar={handleSalvarRelatorio}
              salvando={salvandoRelatorio}
            />
          )}
        </div>
      )}

      {/* SEÇÃO 2: RELATÓRIOS OPERACIONAIS AUXILIARES */}
      {tipo !== "prestacao_contas" && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="w-full shrink-0 lg:w-64">
            <FiltrosRelatorio filtros={filtros} onChange={setFiltros} />
          </div>

          <div className="min-w-0 flex-1">
            {tipo === "participacao" && <TabelaParticipacao filtros={filtros} />}
            {tipo === "presenca" && <TabelaPresenca filtros={filtros} />}
            {tipo === "rh" && <TabelaRH filtros={filtros} />}
            {tipo === "cidade" && <TabelaCidade filtros={filtros} />}
            {tipo === "ministerio" && <TabelaMinisterio filtros={filtros} />}
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      <HistoricoRelatoriosModal
        objetoId={objetoSelecionadoId}
        isOpen={modalHistoricoAberto}
        onClose={() => setModalHistoricoAberto(false)}
        onCarregarRelatorio={handleCarregarRelatorioSalvo}
      />
    </div>
  );
}
