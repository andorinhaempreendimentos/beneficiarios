"use client";

import { Printer, Download, FileText, CheckSquare, Square, Camera } from "lucide-react";
import { formatarData } from "@/lib/utils";
import type { SupervisaoApi, TurmaApi } from "@/lib/api/services";

interface PreviaRelatorioMensalProps {
  mes: number;
  ano: number;
  coordenadorNome: string;
  regiao: string;
  supervisoes: SupervisaoApi[];
  professoresMap?: Record<string, string>;
  turmasMap?: Record<string, TurmaApi[]>;
  onGerarRelatorio?: () => void;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function PreviaRelatorioMensal({
  mes,
  ano,
  coordenadorNome,
  regiao,
  supervisoes,
  professoresMap,
  turmasMap,
  onGerarRelatorio,
}: PreviaRelatorioMensalProps) {
  const nomeMes = MESES[mes - 1] || `Mês ${mes}`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const periodoStr = `01/${String(mes).padStart(2, "0")}/${ano} a ${ultimoDia}/${String(mes).padStart(2, "0")}/${ano}`;

  const nucleosIdsUnicos = Array.from(new Set(supervisoes.map((s) => s.nucleoId)));
  const totalNucleos = nucleosIdsUnicos.length;
  const totalSupervisoes = supervisoes.length;
  const dataHoje = formatarData(new Date().toISOString());
  const todasFotos = supervisoes.flatMap((s) => (s.fotos || []).map((f) => ({ ...f, nucleoNome: s.nucleo?.identificacao || "Núcleo", data: s.dataSupervisao })));

  function handleImprimir() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Estilos dedicados para impressão isolada da folha oficial */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #folha-relatorio-oficial,
          #folha-relatorio-oficial * {
            visibility: visible !important;
          }
          #folha-relatorio-oficial {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.2cm;
          }
        }
      `}</style>

      {/* Barra de Ações da Pré-visualização */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-100 p-3 rounded-xl border border-zinc-200 print:hidden">
        <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
          <FileText className="h-4 w-4 text-sky-600" />
          <span>Pré-visualização do Relatório Mensal ({nomeMes}/{ano})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleImprimir}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </button>
          {onGerarRelatorio && (
            <button
              type="button"
              onClick={onGerarRelatorio}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Gerar Relatório (.docx)
            </button>
          )}
        </div>
      </div>

      {/* Folha do Documento Oficial A4 */}
      <div
        id="folha-relatorio-oficial"
        className="bg-white border border-zinc-300 rounded-xl shadow-md p-6 sm:p-10 font-sans text-zinc-800 text-xs leading-relaxed max-w-5xl mx-auto w-full print:border-none print:shadow-none print:p-0 print:m-0"
      >
        
        {/* Cabeçalho Institucional */}
        <div className="text-center pb-4 mb-5 border-b border-zinc-200">
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 uppercase">
            INSTITUTO ATLETA PARA SEMPRE – IAPS
          </h1>
          <h2 className="text-xs sm:text-sm font-bold text-zinc-700 uppercase mt-0.5">
            PROJETO ESCOLINHAS DE FUTEBOL E FUTSAL DE PALMAS
          </h2>
          <h3 className="text-xs font-semibold text-zinc-600 uppercase">
            NÚCLEOS DE INCLUSÃO E CIDADANIA
          </h3>
          <div className="mt-3 inline-block bg-sky-50 border border-sky-200 px-4 py-1 rounded-md text-sky-800 font-bold text-xs sm:text-sm uppercase tracking-wide">
            RELATÓRIO MENSAL DE SUPERVISÃO DOS NÚCLEOS
          </div>
        </div>

        {/* Tabela de Identificação */}
        <div className="mb-6 border border-zinc-300 rounded-xs overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                <td className="w-1/4 p-2 bg-zinc-50 font-bold text-zinc-700">Mês/Ano:</td>
                <td className="w-1/4 p-2 font-medium text-zinc-900">{nomeMes}/{ano}</td>
                <td className="w-1/4 p-2 bg-zinc-50 font-bold text-zinc-700">Coordenador(a):</td>
                <td className="w-1/4 p-2 font-medium text-zinc-900">{coordenadorNome || "—"}</td>
              </tr>
              <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                <td className="p-2 bg-zinc-50 font-bold text-zinc-700">Região/Coordenação:</td>
                <td className="p-2 font-medium text-zinc-900">{regiao || "Palmas - TO"}</td>
                <td className="p-2 bg-zinc-50 font-bold text-zinc-700">Período do relatório:</td>
                <td className="p-2 font-medium text-zinc-900">{periodoStr}</td>
              </tr>
              <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                <td className="p-2 bg-zinc-50 font-bold text-zinc-700">Nº de núcleos acompanhados:</td>
                <td className="p-2 font-medium text-zinc-900">{totalNucleos}</td>
                <td className="p-2 bg-zinc-50 font-bold text-zinc-700">Nº de supervisões realizadas:</td>
                <td className="p-2 font-medium text-zinc-900">{totalSupervisoes}</td>
              </tr>
              <tr className="divide-x divide-zinc-300">
                <td className="p-2 bg-zinc-50 font-bold text-zinc-700">Data de entrega:</td>
                <td colSpan={3} className="p-2 font-medium text-zinc-900">{dataHoje}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 1. RESUMO DAS SUPERVISÕES REALIZADAS NO MÊS */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            1. RESUMO DAS SUPERVISÕES REALIZADAS NO MÊS
          </h4>
          <div className="border border-zinc-300 overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-300 divide-x divide-zinc-300 text-left font-bold text-zinc-700">
                  <th className="p-1.5">Data</th>
                  <th className="p-1.5">Núcleo</th>
                  <th className="p-1.5">Professor(a)</th>
                  <th className="p-1.5">Horário</th>
                  <th className="p-1.5">Beneficiários</th>
                  <th className="p-1.5">Situação</th>
                  <th className="p-1.5">Pendências</th>
                  <th className="p-1.5">Providências</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-300">
                {supervisoes.length === 0 ? (
                  <>
                    <tr className="divide-x divide-zinc-300 text-zinc-400 italic">
                      <td className="p-2 text-center" colSpan={8}>
                        Nenhuma supervisão realizada no período selecionado até o momento. As supervisões aparecerão aqui conforme forem registradas.
                      </td>
                    </tr>
                    {/* Linhas vazias ilustrativas para pré-visualização fiel ao impresso */}
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="divide-x divide-zinc-200 h-7 text-zinc-300">
                        <td className="p-1.5">&nbsp;</td>
                        <td className="p-1.5">&nbsp;</td>
                        <td className="p-1.5">&nbsp;</td>
                        <td className="p-1.5">&nbsp;</td>
                        <td className="p-1.5">&nbsp;</td>
                        <td className="p-1.5">&nbsp;</td>
                        <td className="p-1.5">&nbsp;</td>
                        <td className="p-1.5">&nbsp;</td>
                      </tr>
                    ))}
                  </>
                ) : (
                  supervisoes.map((s) => {
                    const nomeNucleo = s.nucleo?.identificacao || "—";
                    const horario = s.horaSaida ? `${s.horaEntrada} às ${s.horaSaida}` : s.horaEntrada;

                    let profNome = "—";
                    if (s.professoresIds && s.professoresIds.length > 0 && professoresMap) {
                      profNome = s.professoresIds.map((id) => professoresMap[id] || id).join(", ");
                    } else if (turmasMap && turmasMap[s.nucleoId]) {
                      const profsTurma = Array.from(new Set(turmasMap[s.nucleoId].flatMap((t) => t.responsaveisNomes || []).filter(Boolean)));
                      if (profsTurma.length > 0) profNome = profsTurma.join(", ");
                    }

                    const benTxt = s.beneficiariosPresentes != null
                      ? `${s.beneficiariosPresentes}${s.beneficiariosEsperados != null ? ` / ${s.beneficiariosEsperados}` : ""}`
                      : "—";

                    const regular = s.estruturaAvaliacao === "regular" || s.materiaisAvaliacao === "regular";
                    const critica = s.estruturaAvaliacao === "ruim" || s.estruturaAvaliacao === "critica" || s.materiaisAvaliacao === "ruim" || s.materiaisAvaliacao === "critica";
                    const situacao = critica ? "Requer atenção" : regular ? "Regular" : "Conforme";

                    const pendencias = s.gradeCumprida === false
                      ? (s.gradeObservacoes || "Grade horária não cumprida")
                      : (s.estruturaObservacoes || s.materiaisObservacoes || "Nenhuma");
                    const providencias = s.providenciasNecessarias || s.observacoesGerais || "Rotina mantida";

                    return (
                      <tr key={s.id} className="divide-x divide-zinc-300 hover:bg-zinc-50">
                        <td className="p-1.5 font-medium whitespace-nowrap">{formatarData(s.dataSupervisao)}</td>
                        <td className="p-1.5 font-semibold text-zinc-900">{nomeNucleo}</td>
                        <td className="p-1.5">{profNome}</td>
                        <td className="p-1.5 whitespace-nowrap">{horario}</td>
                        <td className="p-1.5">{benTxt}</td>
                        <td className="p-1.5">
                          <span className={`px-1.5 py-0.5 rounded-xs font-semibold ${
                            situacao === "Conforme"
                              ? "bg-emerald-50 text-emerald-700"
                              : situacao === "Regular"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {situacao}
                          </span>
                        </td>
                        <td className="p-1.5">{pendencias}</td>
                        <td className="p-1.5">{providencias}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-zinc-400 italic mt-1">
            * Acrescentar linhas, se necessário, conforme a quantidade de supervisões realizadas.
          </p>
        </div>

        {/* 2. SÍNTESE DO MÊS */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2">
            2. SÍNTESE DO MÊS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="border border-zinc-200 rounded-sm p-2.5 bg-zinc-50/50">
              <span className="font-bold text-zinc-700 block mb-1">Principais pontos positivos observados:</span>
              <p className="text-zinc-500 italic">Preenchido pelo coordenador ao gerar o relatório final.</p>
            </div>
            <div className="border border-zinc-200 rounded-sm p-2.5 bg-zinc-50/50">
              <span className="font-bold text-zinc-700 block mb-1">Principais dificuldades/ocorrências:</span>
              <p className="text-zinc-500 italic">Preenchido pelo coordenador ao gerar o relatório final.</p>
            </div>
            <div className="border border-zinc-200 rounded-sm p-2.5 bg-zinc-50/50">
              <span className="font-bold text-zinc-700 block mb-1">Pendências que permanecem para o mês seguinte:</span>
              <p className="text-zinc-500 italic">Preenchido pelo coordenador ao gerar o relatório final.</p>
            </div>
            <div className="border border-zinc-200 rounded-sm p-2.5 bg-zinc-50/50">
              <span className="font-bold text-zinc-700 block mb-1">Providências e encaminhamentos necessários:</span>
              <p className="text-zinc-500 italic">Preenchido pelo coordenador ao gerar o relatório final.</p>
            </div>
          </div>
        </div>

        {/* 3. REGISTRO DETALHADO POR SUPERVISÃO */}
        <div className="mb-6 flex flex-col gap-4">
          {supervisoes.length === 0 ? (
            <div className="border border-zinc-300 rounded-sm p-4 bg-white">
              <h5 className="font-bold text-zinc-900 uppercase text-xs mb-3 pb-1 border-b border-zinc-200">
                3. REGISTRO DETALHADO – SUPERVISÃO Nº 1 (MODELO)
              </h5>

              <div className="border border-zinc-300 mb-3 overflow-hidden">
                <table className="w-full text-[11px] border-collapse">
                  <tbody>
                    <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                      <td className="w-1/4 p-1.5 bg-zinc-50 font-bold">Data:</td>
                      <td className="w-1/4 p-1.5 text-zinc-400">___/___/______</td>
                      <td className="w-1/4 p-1.5 bg-zinc-50 font-bold">Núcleo:</td>
                      <td className="w-1/4 p-1.5 text-zinc-400">________________________</td>
                    </tr>
                    <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                      <td className="p-1.5 bg-zinc-50 font-bold">Entrada:</td>
                      <td className="p-1.5 text-zinc-400">___:___</td>
                      <td className="p-1.5 bg-zinc-50 font-bold">Saída:</td>
                      <td className="p-1.5 text-zinc-400">___:___</td>
                    </tr>
                    <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                      <td className="p-1.5 bg-zinc-50 font-bold">Professor(a):</td>
                      <td className="p-1.5 text-zinc-400">________________________</td>
                      <td className="p-1.5 bg-zinc-50 font-bold">Presença:</td>
                      <td className="p-1.5 text-zinc-600">☐ Presente &nbsp; ☐ Ausente</td>
                    </tr>
                    <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                      <td className="p-1.5 bg-zinc-50 font-bold">Turma(s)/faixa etária:</td>
                      <td className="p-1.5 text-zinc-400">________________________</td>
                      <td className="p-1.5 bg-zinc-50 font-bold">Beneficiários presentes:</td>
                      <td className="p-1.5 text-zinc-400">____ presentes</td>
                    </tr>
                    <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                      <td className="p-1.5 bg-zinc-50 font-bold">Grade de horários:</td>
                      <td className="p-1.5 text-zinc-600">☐ Conforme &nbsp; ☐ Não conforme</td>
                      <td className="p-1.5 bg-zinc-50 font-bold">Frequência/chamada:</td>
                      <td className="p-1.5 text-zinc-600">☐ Conferida &nbsp; ☐ Pendente</td>
                    </tr>
                    <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                      <td className="p-1.5 bg-zinc-50 font-bold">Espaço físico:</td>
                      <td className="p-1.5 text-zinc-600">☐ Adequado &nbsp; ☐ Requer atenção</td>
                      <td className="p-1.5 bg-zinc-50 font-bold">Materiais esportivos:</td>
                      <td className="p-1.5 text-zinc-600">☐ Adequados &nbsp; ☐ Pendentes</td>
                    </tr>
                    <tr className="divide-x divide-zinc-300">
                      <td className="p-1.5 bg-zinc-50 font-bold">Atividade acompanhada:</td>
                      <td colSpan={3} className="p-1.5 text-zinc-400">____________________________________________________</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 text-[11px] mb-2 text-zinc-600">
                <div>
                  <span className="font-bold text-zinc-700">Observações da supervisão:</span>
                  <div className="h-6 border-b border-zinc-200 border-dashed" />
                </div>
                <div>
                  <span className="font-bold text-zinc-700">Ocorrências/dificuldades identificadas:</span>
                  <div className="h-6 border-b border-zinc-200 border-dashed" />
                </div>
                <div>
                  <span className="font-bold text-zinc-700">Orientações repassadas ao professor:</span>
                  <div className="h-6 border-b border-zinc-200 border-dashed" />
                </div>
                <div>
                  <span className="font-bold text-zinc-700">Pendências e providências adotadas:</span>
                  <div className="h-6 border-b border-zinc-200 border-dashed" />
                </div>
                <div>
                  <span className="font-bold text-zinc-700">Prazo para regularização/acompanhamento:</span>
                  <div className="h-6 border-b border-zinc-200 border-dashed" />
                </div>
              </div>

              <div className="text-[11px] pt-1 border-t border-zinc-100 flex items-center justify-between text-zinc-500">
                <span>Registro fotográfico: ☐ Anexado &nbsp; ☐ Não se aplica</span>
              </div>
            </div>
          ) : (
            supervisoes.map((s, idx) => {
              const numSup = idx + 1;
              const nomeNucleo = s.nucleo?.identificacao || "—";
              const profPresente = s.professorPresente === true;
              const profAusente = s.professorPresente === false;
              const gradeOk = s.gradeCumprida === true;
              const gradeNao = s.gradeCumprida === false;
              const espacoOk = s.estruturaAvaliacao === "otima" || s.estruturaAvaliacao === "boa" || s.estruturaAvaliacao === null;
              const matOk = s.materiaisAvaliacao === "otima" || s.materiaisAvaliacao === "boa" || s.materiaisAvaliacao === null;

              let profNome = "—";
              if (s.professoresIds && s.professoresIds.length > 0 && professoresMap) {
                profNome = s.professoresIds.map((id) => professoresMap[id] || id).join(", ");
              } else if (turmasMap && turmasMap[s.nucleoId]) {
                const profsTurma = Array.from(new Set(turmasMap[s.nucleoId].flatMap((t) => t.responsaveisNomes || []).filter(Boolean)));
                if (profsTurma.length > 0) profNome = profsTurma.join(", ");
              }

              let turmasFaixas = "Turmas regulares de futebol/futsal";
              if (turmasMap && turmasMap[s.nucleoId]) {
                const faixas = turmasMap[s.nucleoId]
                  .map((t) => t.faixaEtaria?.nome || t.categoria?.nome || t.nome)
                  .filter(Boolean);
                if (faixas.length > 0) turmasFaixas = Array.from(new Set(faixas)).join(", ");
              }

              const presentesTxt = s.beneficiariosPresentes != null
                ? `${s.beneficiariosPresentes}${s.beneficiariosEsperados != null ? ` (esperados: ${s.beneficiariosEsperados})` : ""}`
                : "—";

              return (
                <div key={s.id} className="border border-zinc-300 rounded-sm p-4 bg-white">
                  <h5 className="font-bold text-zinc-900 uppercase text-xs mb-3 pb-1 border-b border-zinc-200">
                    3. REGISTRO DETALHADO – SUPERVISÃO Nº {numSup}
                  </h5>

                  <div className="border border-zinc-300 mb-3 overflow-hidden">
                    <table className="w-full text-[11px] border-collapse">
                      <tbody>
                        <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                          <td className="w-1/4 p-1.5 bg-zinc-50 font-bold">Data:</td>
                          <td className="w-1/4 p-1.5">{formatarData(s.dataSupervisao)}</td>
                          <td className="w-1/4 p-1.5 bg-zinc-50 font-bold">Núcleo:</td>
                          <td className="w-1/4 p-1.5 font-semibold">{nomeNucleo}</td>
                        </tr>
                        <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                          <td className="p-1.5 bg-zinc-50 font-bold">Entrada:</td>
                          <td className="p-1.5">{s.horaEntrada}</td>
                          <td className="p-1.5 bg-zinc-50 font-bold">Saída:</td>
                          <td className="p-1.5">{s.horaSaida || "—"}</td>
                        </tr>
                        <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                          <td className="p-1.5 bg-zinc-50 font-bold">Professor(a):</td>
                          <td className="p-1.5">{profNome}</td>
                          <td className="p-1.5 bg-zinc-50 font-bold">Presença:</td>
                          <td className="p-1.5">
                            {profPresente ? "☒ Presente" : "☐ Presente"} &nbsp; {profAusente ? "☒ Ausente" : "☐ Ausente"}
                          </td>
                        </tr>
                        <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                          <td className="p-1.5 bg-zinc-50 font-bold">Turma(s)/faixa etária:</td>
                          <td className="p-1.5">{turmasFaixas}</td>
                          <td className="p-1.5 bg-zinc-50 font-bold">Beneficiários presentes:</td>
                          <td className="p-1.5">{presentesTxt}</td>
                        </tr>
                        <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                          <td className="p-1.5 bg-zinc-50 font-bold">Grade de horários:</td>
                          <td className="p-1.5">
                            {gradeOk ? "☒ Conforme" : "☐ Conforme"} &nbsp; {gradeNao ? "☒ Não conforme" : "☐ Não conforme"}
                          </td>
                          <td className="p-1.5 bg-zinc-50 font-bold">Frequência/chamada:</td>
                          <td className="p-1.5">☒ Conferida &nbsp; ☐ Pendente</td>
                        </tr>
                        <tr className="border-b border-zinc-300 divide-x divide-zinc-300">
                          <td className="p-1.5 bg-zinc-50 font-bold">Espaço físico:</td>
                          <td className="p-1.5">
                            {espacoOk ? "☒ Adequado" : "☐ Adequado"} &nbsp; {!espacoOk ? "☒ Requer atenção" : "☐ Requer atenção"}
                          </td>
                          <td className="p-1.5 bg-zinc-50 font-bold">Materiais esportivos:</td>
                          <td className="p-1.5">
                            {matOk ? "☒ Adequados" : "☐ Adequados"} &nbsp; {!matOk ? "☒ Pendentes" : "☐ Pendentes"}
                          </td>
                        </tr>
                        <tr className="divide-x divide-zinc-300">
                          <td className="p-1.5 bg-zinc-50 font-bold">Atividade acompanhada:</td>
                          <td colSpan={3} className="p-1.5">
                            {s.atividadeDesenvolvida || "Treinamento e vivência esportiva em campo/quadra"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] mb-2">
                    <div>
                      <span className="font-bold text-zinc-700">Observações da supervisão:</span>
                      <p className="text-zinc-600 mt-0.5">{s.observacoesGerais || "Atividades desenvolvidas dentro da normalidade operacional."}</p>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-700">Orientações repassadas ao professor:</span>
                      <p className="text-zinc-600 mt-0.5">{s.orientacoesProfessor || "Reforçado o controle e zelo da chamada de presença e materiais."}</p>
                    </div>
                  </div>

                  {s.providenciasNecessarias && (
                    <div className="text-[11px] mb-2 p-1.5 bg-zinc-50 rounded-xs border border-zinc-200">
                      <span className="font-bold text-zinc-700">Providências necessárias: </span>
                      <span className="text-zinc-600">{s.providenciasNecessarias}</span>
                    </div>
                  )}

                  <div className="text-[11px] pt-1 border-t border-zinc-100 flex items-center justify-between text-zinc-500">
                    <span>
                      Registro fotográfico: {s.fotos && s.fotos.length > 0 ? "☒ Anexado" : "☐ Anexado"} &nbsp; {(!s.fotos || s.fotos.length === 0) ? "☒ Não se aplica" : "☐ Não se aplica"}
                    </span>
                    {s.fotos && s.fotos.length > 0 && (
                      <span className="text-sky-600 font-medium">{s.fotos.length} foto(s) anexada(s)</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. REGISTRO FOTOGRÁFICO */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2 flex items-center justify-between">
            <span>4. REGISTRO FOTOGRÁFICO</span>
            {todasFotos.length > 0 && (
              <span className="text-[11px] text-zinc-500 font-normal lowercase">
                {todasFotos.length} foto(s) comprobatória(s)
              </span>
            )}
          </h4>

          {todasFotos.length === 0 ? (
            <div className="border border-dashed border-zinc-300 rounded-sm p-6 text-center text-zinc-400 bg-zinc-50/50">
              <Camera className="h-6 w-6 mx-auto mb-1 text-zinc-300" />
              <p className="text-xs font-medium text-zinc-600">Nenhum registro fotográfico anexado até o momento</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Fotos anexadas às supervisões aparecerão automaticamente aqui e serão exportadas no documento Word.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {todasFotos.map((foto, idx) => (
                <div key={idx} className="border border-zinc-200 rounded-sm p-2 bg-zinc-50/50 flex flex-col gap-1.5">
                  <div className="relative aspect-4/3 w-full bg-zinc-100 rounded-xs overflow-hidden border border-zinc-200">
                    <img
                      src={foto.url}
                      alt={foto.legenda || `Foto da supervisão no núcleo ${foto.nucleoNome}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[10px] text-zinc-600 leading-tight">
                    <p className="font-semibold text-zinc-800">{foto.nucleoNome} · {formatarData(foto.data)}</p>
                    {foto.legenda && <p className="text-zinc-500 mt-0.5 line-clamp-2">{foto.legenda}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DECLARAÇÃO DO COORDENADOR */}
        <div className="pt-4 border-t border-zinc-200">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2">
            DECLARAÇÃO DO COORDENADOR
          </h4>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Declaro que as informações constantes neste relatório refletem com fidedignidade as supervisões realizadas nos núcleos sob minha responsabilidade no período indicado, bem como as condições verificadas in loco.
          </p>

          <p className="text-zinc-700 mb-8">
            Palmas - TO, {dataHoje}
          </p>

          <div className="text-center w-72 mx-auto pt-6 border-t border-zinc-400">
            <p className="font-bold text-zinc-900">{coordenadorNome || "Coordenador(a) Responsável"}</p>
            <p className="text-[11px] text-zinc-500">Coordenador(a) de Núcleo</p>
          </div>
        </div>

      </div>
    </div>
  );
}
