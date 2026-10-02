"use client";

import { Printer, Download, FileText, CheckSquare, Square } from "lucide-react";
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

  function handleImprimir() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Ações da Pré-visualização */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-100 p-3 rounded-xl border border-zinc-200">
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
      <div className="bg-white border border-zinc-300 rounded-xl shadow-md p-6 sm:p-10 font-sans text-zinc-800 text-xs leading-relaxed max-w-5xl mx-auto w-full print:border-none print:shadow-none print:p-0">
        
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
                        Nenhuma supervisão realizada no período selecionado até o momento. As visitas aparecerão aqui conforme forem registradas.
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

                    const pendencias = s.gradeCumprida === false ? "Grade horária pendente" : (s.estruturaObservacoes || s.materiaisObservacoes || "Nenhuma");
                    const providencias = s.observacoesGerais || "Rotina";

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

        {/* 3. REGISTRO DETALHADO POR SUPERVISÃO (QUANDO HOUVER) */}
        {supervisoes.length > 0 && (
          <div className="mb-6 flex flex-col gap-4">
            {supervisoes.map((s, idx) => {
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
                          <td colSpan={3} className="p-1.5">Treinamento e vivência esportiva em campo/quadra</td>
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
                      <p className="text-zinc-600 mt-0.5">Reforçado o controle e zelo da chamada de presença e materiais.</p>
                    </div>
                  </div>

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
            })}
          </div>
        )}

        {/* DECLARAÇÃO DO COORDENADOR */}
        <div className="pt-4 border-t border-zinc-200">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2">
            DECLARAÇÃO DO COORDENADOR
          </h4>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Declaro que as informações constantes neste relatório refletem com fidedignidade as visitas de supervisão realizadas aos núcleos sob minha responsabilidade no período indicado, bem como as condições verificadas in loco.
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
