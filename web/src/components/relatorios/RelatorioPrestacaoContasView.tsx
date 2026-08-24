"use client";

import { useState } from "react";
import { formatarData } from "@/lib/utils";
import type { DadosRelatorioPrestacaoContas } from "@/lib/api/prestacaoContas";
import { Badge, Button } from "@/components/ui";
import { Printer, FileDown, Save, Edit3, CheckCircle2, AlertCircle } from "lucide-react";
import { exportarRelatorioPrestacaoContasDocx } from "@/lib/export/exportarPrestacaoContasDocx";

interface Props {
  dados: DadosRelatorioPrestacaoContas;
  onSalvar?: (pareceres: any, signatarios: any) => void;
  salvando?: boolean;
}

function getSituacaoMeta(realizado: number, previsto: number): { texto: string; tone: "green" | "amber" | "zinc" } {
  if (previsto <= 0) return { texto: "Cumprida", tone: "green" };
  const pct = (realizado / previsto) * 100;
  if (pct >= 100) return { texto: "Cumprida", tone: "green" };
  if (pct > 0) return { texto: "Em Execução", tone: "amber" };
  return { texto: "Não Iniciada", tone: "zinc" };
}

export function RelatorioPrestacaoContasView({ dados, onSalvar, salvando }: Props) {
  const { objeto, organizacao, periodo, resumoIndicadores, execucaoPorNucleo, beneficiarios, frequencia, atividadesRealizadas, supervisoes, recursosHumanos, materiais, cumprimentoMetas, registroFotografico, ocorrencias } = dados;

  // Estados editáveis para justificativas e pareceres
  const [justificativaMetas, setJustificativaMetas] = useState(
    "Todas as metas pactuadas no Plano de Trabalho foram integralmente executadas dentro dos padrões de excelência técnica e metodológica estabelecidos, com ampla adesão comunitária e frequência superior à meta mínima pactuada."
  );

  const [impactoSocialTexto, setImpactoSocialTexto] = useState(
    `Durante o período de ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}, a execução do projeto ${objeto.nome} gerou impacto direto na vida de ${beneficiarios.totalCadastrados} crianças e adolescentes, com foco prioritário em famílias em situação de vulnerabilidade social (${beneficiarios.percentualVulnerabilidade}% dos matriculados). Destacam-se o fortalecimento da convivência comunitária, a promoção da disciplina e cooperação por meio do futebol/futsal com metodologia Gol do Brasil da CBF, e a melhoria no rendimento escolar dos participantes.`
  );

  const [conclusaoTexto, setConclusaoTexto] = useState(
    `Diante do exposto, atesta-se que as atividades previstas no Plano de Trabalho foram rigorosamente executadas, atendendo aos objetivos da parceria celebrada sob o ${objeto.termoDeFomento || "Termo de Parceria"} com o ${objeto.concedente?.nome || "Órgão Concedente"}, demonstrando a boa e regular aplicação dos recursos e o cumprimento pleno da finalidade pública e social.`
  );

  // Signatários
  const [responsavelElaboracao, setResponsavelElaboracao] = useState({
    nome: "—",
    cargo: "Responsável pela elaboração do relatório",
  });
  const [coordenadorGeral, setCoordenadorGeral] = useState({
    nome: "—",
    cargo: "Coordenação do Projeto",
  });
  const [representanteLegal, setRepresentanteLegal] = useState({
    nome: organizacao?.nomeResponsavel || "—",
    cargo: `Representante legal${organizacao?.nome ? ` - ${organizacao.nome}` : ""}`,
  });

  const [modoEdicao, setModoEdicao] = useState(false);
  const [exportandoDocx, setExportandoDocx] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleExportarDocx() {
    setExportandoDocx(true);
    try {
      await exportarRelatorioPrestacaoContasDocx(
        dados,
        {
          justificativaMetas,
          impactoSocialTexto,
          conclusaoTexto,
        },
        {
          responsavelElaboracao,
          coordenadorGeral,
          representanteLegal,
        }
      );
    } catch (err: any) {
      alert("Erro ao exportar DOCX: " + (err.message || err));
    } finally {
      setExportandoDocx(false);
    }
  }

  function handleSalvar() {
    if (onSalvar) {
      onSalvar(
        {
          justificativaMetas,
          impactoSocialTexto,
          conclusaoTexto,
        },
        {
          responsavelElaboracao,
          coordenadorGeral,
          representanteLegal,
        }
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Ações do Relatório */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <Badge tone="sky">Formato Oficial MROSC / Lei 13.019/2014</Badge>
          <span className="text-xs text-zinc-500">
            Período: <strong>{formatarData(periodo.dataInicio)}</strong> até <strong>{formatarData(periodo.dataFim)}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModoEdicao((v) => !v)}
          >
            <Edit3 className="mr-1.5 h-3.5 w-3.5" />
            {modoEdicao ? "Concluir Edição de Textos" : "Editar Textos e Pareceres"}
          </Button>

          {onSalvar && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSalvar}
              disabled={salvando}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {salvando ? "Salvando..." : "Salvar no Histórico"}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportarDocx}
            disabled={exportandoDocx}
            className="border-sky-300 text-sky-800 hover:bg-sky-50"
          >
            <FileDown className="mr-1.5 h-3.5 w-3.5 text-sky-600" />
            {exportandoDocx ? "Gerando Word..." : "Baixar em Word (.DOCX)"}
          </Button>

          <Button type="button" size="sm" onClick={handlePrint}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Imprimir / Exportar PDF
          </Button>
        </div>
      </div>

      {/* DOCUMENTO OFICIAL FORMATADO (PRESTACÃO DE CONTAS) */}
      <div id="relatorio-prestacao-contas-folha" className="bg-white p-8 md:p-12 shadow-sm rounded-xl border border-zinc-200 print:border-none print:shadow-none print:p-0 text-zinc-900 leading-relaxed font-sans">
        
        {/* CABEÇALHO OFICIAL */}
        <div className="border-b-2 border-zinc-900 pb-6 mb-8 text-center">
          <h1 className="text-xl font-bold uppercase tracking-wide text-zinc-900">
            Relatório de Execução e Prestação de Contas do Objeto
          </h1>
          <p className="text-sm font-medium uppercase text-zinc-600 mt-1">
            {objeto.nome}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Período Avaliado: {formatarData(periodo.dataInicio)} a {formatarData(periodo.dataFim)} • Instrumento: {objeto.termoDeFomento || "—"}
          </p>
        </div>

        {/* 1. IDENTIFICAÇÃO DO PROJETO */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            1. Identificação do Projeto e Parceria
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
            <div><strong>Objeto da Parceria:</strong> {objeto.nome || "—"}</div>
            <div><strong>Órgão Concedente:</strong> {objeto.concedente?.nome || "—"}</div>
            <div><strong>Organização Executora (OSC):</strong> {organizacao?.nome || "—"}</div>
            <div><strong>CNPJ da OSC:</strong> {organizacao?.cnpj || "—"}</div>
            <div><strong>Instrumento / Termo nº:</strong> {objeto.termoDeFomento || "—"}</div>
            <div><strong>Processo Administrativo nº:</strong> {objeto.numeroProcessoAdm || "—"}</div>
            <div><strong>Edital de Chamamento nº:</strong> {objeto.editalNumero || "—"}</div>
            <div><strong>Vigência do Instrumento:</strong> {objeto.dataInicio && objeto.dataTermino ? `${formatarData(objeto.dataInicio)} até ${formatarData(objeto.dataTermino)}` : "—"}</div>
            <div><strong>Município / UF:</strong> {objeto.concedente?.cidade || organizacao?.cidade ? `${objeto.concedente?.cidade || organizacao?.cidade} / ${objeto.concedente?.estado || organizacao?.estado || ""}` : "—"}</div>
            <div>
              <strong>Conta Bancária Exclusiva:</strong> {objeto.contaBancariaBanco ? `Banco ${objeto.contaBancariaBanco} • Ag: ${objeto.contaBancariaAgencia || "—"} • CC: ${objeto.contaBancariaConta || "—"}` : "—"}
            </div>
          </div>
        </section>

        {/* 2. OBJETO DO PROJETO */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            2. Objeto e Finalidade do Projeto
          </h2>
          <div className="text-xs text-zinc-700 leading-relaxed text-justify border border-zinc-200 rounded-lg p-4 bg-zinc-50/30">
            <p>{objeto.descricao || "—"}</p>
          </div>
        </section>

        {/* 3. RESUMO DA EXECUÇÃO */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            3. Resumo da Execução
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            Durante o período de referência, foram desenvolvidas atividades regulares de futebol e futsal nos núcleos integrantes do projeto, conforme cronograma e planejamento estabelecidos. A execução foi acompanhada por meio do cadastro dos beneficiários, controle de frequência, registros das aulas, acompanhamento dos profissionais e visitas de supervisão realizadas pela coordenação.
          </p>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Indicador</th>
                  <th className="p-2.5 text-center w-36">Previsto</th>
                  <th className="p-2.5 text-center w-36">Realizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr>
                  <td className="p-2.5 font-medium">Núcleos</td>
                  <td className="p-2.5 text-center">{resumoIndicadores.nucleos.previsto}</td>
                  <td className="p-2.5 text-center font-bold text-zinc-900">{resumoIndicadores.nucleos.realizado}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Beneficiários</td>
                  <td className="p-2.5 text-center">{resumoIndicadores.beneficiarios.previsto}</td>
                  <td className="p-2.5 text-center font-bold text-zinc-900">{resumoIndicadores.beneficiarios.realizado}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Turmas</td>
                  <td className="p-2.5 text-center">{resumoIndicadores.turmas.previsto}</td>
                  <td className="p-2.5 text-center font-bold text-zinc-900">{resumoIndicadores.turmas.realizado}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Professores</td>
                  <td className="p-2.5 text-center">{resumoIndicadores.professores.previsto}</td>
                  <td className="p-2.5 text-center font-bold text-zinc-900">{resumoIndicadores.professores.realizado}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Aulas/atividades</td>
                  <td className="p-2.5 text-center">{resumoIndicadores.aulas.previsto}</td>
                  <td className="p-2.5 text-center font-bold text-zinc-900">{resumoIndicadores.aulas.realizado}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Visitas de supervisão</td>
                  <td className="p-2.5 text-center">{resumoIndicadores.supervisoes.previsto}</td>
                  <td className="p-2.5 text-center font-bold text-zinc-900">{resumoIndicadores.supervisoes.realizado}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. EXECUÇÃO POR NÚCLEO */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            4. Execução Detalhada por Núcleo Esportivo
          </h2>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Núcleo</th>
                  <th className="p-2.5">Região / Bairro</th>
                  <th className="p-2.5">Modalidade</th>
                  <th className="p-2.5">Professores Vinculados</th>
                  <th className="p-2.5 text-center">Turmas</th>
                  <th className="p-2.5 text-center">Alunos</th>
                  <th className="p-2.5 text-center">Aulas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {execucaoPorNucleo.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-semibold text-zinc-800">{item.identificacao}</td>
                    <td className="p-2.5 text-zinc-600">{item.bairro || item.regiao || "—"}</td>
                    <td className="p-2.5 text-zinc-600">{item.modalidades.join(", ")}</td>
                    <td className="p-2.5 text-zinc-600">{item.professores.join(", ")}</td>
                    <td className="p-2.5 text-center font-medium">{item.totalTurmas}</td>
                    <td className="p-2.5 text-center font-semibold text-sky-800">{item.beneficiariosAtendidos}</td>
                    <td className="p-2.5 text-center font-medium">{item.aulasRealizadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. BENEFICIÁRIOS ATENDIDOS (DEMONSTRATIVO SOCIODEMOGRÁFICO) */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            5. Demonstrativo de Beneficiários e Perfil Sociodemográfico
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
            <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
              <span className="text-zinc-500">Total Cadastrados</span>
              <p className="text-lg font-bold text-zinc-900 mt-0.5">{beneficiarios.totalCadastrados}</p>
            </div>
            <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
              <span className="text-zinc-500">Alunos Ativos</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">{beneficiarios.ativos}</p>
            </div>
            <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
              <span className="text-zinc-500">Gênero Feminino</span>
              <p className="text-lg font-bold text-pink-700 mt-0.5">{beneficiarios.feminino} ({beneficiarios.totalCadastrados > 0 ? Math.round((beneficiarios.feminino / beneficiarios.totalCadastrados) * 100) : 0}%)</p>
            </div>
            <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
              <span className="text-zinc-500">Vulnerabilidade / Rede Pública</span>
              <p className="text-lg font-bold text-sky-700 mt-0.5">{beneficiarios.percentualVulnerabilidade}% (Meta: {objeto.metaVulnerabilidadeMinima}%)</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Faixa Etária</th>
                  <th className="p-2.5 text-center">06 a 09 anos</th>
                  <th className="p-2.5 text-center">10 a 12 anos</th>
                  <th className="p-2.5 text-center">13 a 15 anos</th>
                  <th className="p-2.5 text-center">16 a 18 anos</th>
                  <th className="p-2.5 text-center">Total Atendido</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 font-medium">Quantidade de Alunos</td>
                  <td className="p-2.5 text-center">{beneficiarios.faixasEtarias.de06a09}</td>
                  <td className="p-2.5 text-center">{beneficiarios.faixasEtarias.de10a12}</td>
                  <td className="p-2.5 text-center">{beneficiarios.faixasEtarias.de13a15}</td>
                  <td className="p-2.5 text-center">{beneficiarios.faixasEtarias.de16a18}</td>
                  <td className="p-2.5 text-center font-bold text-zinc-900">{beneficiarios.totalCadastrados}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. FREQUÊNCIA DOS BENEFICIÁRIOS */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            6. Frequência dos Beneficiários
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            A frequência dos beneficiários deverá ser acompanhada durante todo o período de execução das atividades, permitindo verificar a participação efetiva no projeto.
          </p>

          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Núcleo</th>
                  <th className="p-2.5 text-center">Beneficiários Ativos</th>
                  <th className="p-2.5 text-center">Presenças Registradas</th>
                  <th className="p-2.5 text-center">Faltas</th>
                  <th className="p-2.5 text-center">Frequência Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {frequencia.porNucleo.map((fn, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-medium">{fn.nucleoNome}</td>
                    <td className="p-2.5 text-center">{fn.beneficiariosAtivos}</td>
                    <td className="p-2.5 text-center text-emerald-700 font-medium">{fn.presencasRegistradas}</td>
                    <td className="p-2.5 text-center text-zinc-500">{fn.faltasRegistradas}</td>
                    <td className="p-2.5 text-center font-bold text-zinc-900">{fn.frequenciaMedia}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 flex flex-col gap-1">
            <div>
              <strong>Frequência média geral do projeto:</strong> <span className="font-bold text-zinc-900">{frequencia.frequenciaMediaGeral}%</span>
            </div>
            <p className="text-zinc-500 italic text-[11px]">
              Os registros de frequência deverão permanecer arquivados como documentação comprobatória da execução.
            </p>
          </div>
        </section>

        {/* 7. DIÁRIO DE AULAS REALIZADAS */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            7. Diário de Aulas e Atividades Esportivas Realizadas (Amostragem do Período)
          </h2>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5 w-24">Data</th>
                  <th className="p-2.5">Núcleo</th>
                  <th className="p-2.5">Turma / Modalidade</th>
                  <th className="p-2.5">Professor Responsável</th>
                  <th className="p-2.5">Conteúdo / Fundamento Técnico Aplicado</th>
                  <th className="p-2.5 text-center w-20">Alunos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {atividadesRealizadas.slice(0, 15).map((a, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono text-zinc-600">{formatarData(a.data)}</td>
                    <td className="p-2.5 font-medium">{a.nucleoNome}</td>
                    <td className="p-2.5 text-zinc-600">{a.turmaNome} ({a.modalidade})</td>
                    <td className="p-2.5 text-zinc-600">{a.professorNome}</td>
                    <td className="p-2.5 text-zinc-700">{a.atividadeDescricao}</td>
                    <td className="p-2.5 text-center font-semibold text-sky-700">{a.participantesPresentes}</td>
                  </tr>
                ))}
                {atividadesRealizadas.length > 15 && (
                  <tr>
                    <td colSpan={6} className="p-2 text-center text-zinc-400 bg-zinc-50 text-[11px]">
                      Exibindo 15 de {atividadesRealizadas.length} registros de aulas concluídas no período. Relação integral disponível no Anexo I.
                    </td>
                  </tr>
                )}
                {atividadesRealizadas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-zinc-400">
                      Nenhuma aula registrada no período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 8. ACOMPANHAMENTO E SUPERVISÃO PEDAGÓGICA */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            8. Acompanhamento e Supervisão Pedagógica In Loco
          </h2>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5 w-24">Data</th>
                  <th className="p-2.5">Núcleo Visitado</th>
                  <th className="p-2.5">Supervisor / Coordenador</th>
                  <th className="p-2.5 text-center">Professor Presente</th>
                  <th className="p-2.5 text-center">Alunos Presentes</th>
                  <th className="p-2.5">Estrutura & Materiais</th>
                  <th className="p-2.5 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {supervisoes.map((s, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono text-zinc-600">{formatarData(s.data)}</td>
                    <td className="p-2.5 font-semibold">{s.nucleoNome || "—"}</td>
                    <td className="p-2.5 text-zinc-600">{s.coordenadorNome || "—"}</td>
                    <td className="p-2.5 text-center font-medium text-emerald-700">{s.professorPresente ? "Sim" : "Não"}</td>
                    <td className="p-2.5 text-center font-medium">{s.beneficiariosPresentes}</td>
                    <td className="p-2.5 text-zinc-600">Estrutura: {s.estruturaAvaliacao || "—"} • Materiais: {s.materiaisAvaliacao || "—"}</td>
                    <td className="p-2.5 text-center">
                      <Badge tone={s.situacao === "Regular" ? "green" : "amber"}>{s.situacao}</Badge>
                    </td>
                  </tr>
                ))}
                {supervisoes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-zinc-400">
                      Nenhuma visita de supervisão registrada no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 9. RECURSOS HUMANOS */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            9. Quadro de Recursos Humanos e Equipe Técnica
          </h2>
          <div className="mb-4 overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Cargo / Função Prevista no Plano de Trabalho</th>
                  <th className="p-2.5 text-center">Qtd. Prevista</th>
                  <th className="p-2.5 text-center">Qtd. Realizada / Ativa</th>
                  <th className="p-2.5 text-center">% Cumprimento</th>
                  <th className="p-2.5 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {recursosHumanos.cargosComparativo.map((c, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-medium">{c.cargoNome}</td>
                    <td className="p-2.5 text-center">{c.quantidadePrevista}</td>
                    <td className="p-2.5 text-center font-bold text-zinc-900">{c.quantidadeAtiva}</td>
                    <td className="p-2.5 text-center">{c.percentualExecucao}%</td>
                    <td className="p-2.5 text-center">
                      <Badge tone={c.percentualExecucao >= 100 ? "green" : "amber"}>
                        {c.percentualExecucao >= 100 ? "Integral" : "Parcial"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xs font-bold uppercase text-zinc-700 mb-2">Relação Nominal dos Profissionais Alocados</h3>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold uppercase">
                <tr>
                  <th className="p-2">Nome Completo</th>
                  <th className="p-2">Função</th>
                  <th className="p-2">Núcleo / Alocação</th>
                  <th className="p-2 text-center">Carga Horária</th>
                  <th className="p-2 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {recursosHumanos.profissionais.slice(0, 15).map((p, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2 font-medium">{p.nomeCompleto}</td>
                    <td className="p-2 text-zinc-600">{p.funcao || "—"}</td>
                    <td className="p-2 text-zinc-600">{p.nucleoOuAlocacao || "—"}</td>
                    <td className="p-2 text-center text-zinc-500">{p.cargaHorariaSemanal || "—"}</td>
                    <td className="p-2 text-center font-medium text-emerald-700">{p.situacao || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10. MATERIAIS E UNIFORMES */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            10. Materiais Esportivos, Equipamentos e Uniformes
          </h2>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Item / Descrição</th>
                  <th className="p-2.5 text-center">Unidade</th>
                  <th className="p-2.5 text-center">Qtd. Prevista</th>
                  <th className="p-2.5 text-center">Qtd. Adquirida</th>
                  <th className="p-2.5 text-center">Qtd. Distribuída aos Núcleos</th>
                  <th className="p-2.5">Destinação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {materiais.map((m, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-medium">{m.nome}</td>
                    <td className="p-2.5 text-center text-zinc-500">{m.unidadeMedida}</td>
                    <td className="p-2.5 text-center">{m.quantidadePrevista}</td>
                    <td className="p-2.5 text-center font-medium">{m.quantidadeAdquirida}</td>
                    <td className="p-2.5 text-center font-bold text-sky-800">{m.quantidadeDistribuida}</td>
                    <td className="p-2.5 text-zinc-600">{m.destinacao}</td>
                  </tr>
                ))}
                {materiais.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-zinc-400">
                      Nenhum material movimentado no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 11. CUMPRIMENTO DAS METAS PACTUADAS */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            11. Quadro Geral de Cumprimento das Metas Pactuadas
          </h2>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Meta / Indicador Pactuado</th>
                  <th className="p-2.5 text-center">Unidade</th>
                  <th className="p-2.5 text-center">Previsto</th>
                  <th className="p-2.5 text-center">Realizado</th>
                  <th className="p-2.5 text-center">% Execução</th>
                  <th className="p-2.5 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {cumprimentoMetas.map((m, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-medium">{m.meta}</td>
                    <td className="p-2.5 text-center text-zinc-500">{m.unidade}</td>
                    <td className="p-2.5 text-center">{m.previsto}</td>
                    <td className="p-2.5 text-center font-bold text-zinc-900">{m.realizado}</td>
                    <td className="p-2.5 text-center font-semibold text-emerald-700">{m.percentualExecucao}%</td>
                    <td className="p-2.5 text-center">
                      <Badge tone={m.situacao === "Cumprida" ? "green" : "amber"}>{m.situacao}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <label className="text-xs font-semibold text-zinc-700">Justificativa e Análise do Cumprimento de Metas:</label>
            {modoEdicao ? (
              <textarea
                value={justificativaMetas}
                onChange={(e) => setJustificativaMetas(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 text-xs text-zinc-800"
              />
            ) : (
              <p className="mt-1 text-xs text-zinc-700 text-justify bg-zinc-50/70 p-3 rounded-lg border border-zinc-200">
                {justificativaMetas}
              </p>
            )}
          </div>
        </section>

        {/* 12. REGISTRO FOTOGRÁFICO */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            12. Registro Fotográfico Comprobatório
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {registroFotografico.map((f, idx) => (
              <div key={idx} className="border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50">
                <img src={f.url} alt={f.descricao} className="w-full h-36 object-cover" />
                <div className="p-2 text-[11px] text-zinc-600">
                  <p className="font-semibold text-zinc-800">{f.nucleoNome ? `Núcleo: ${f.nucleoNome}` : f.atividade}</p>
                  <p className="text-zinc-500 mt-0.5">{f.descricao}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 font-mono">{formatarData(f.data)}</p>
                </div>
              </div>
            ))}
            {registroFotografico.length === 0 && (
              <div className="col-span-full border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-400 rounded-lg">
                Nenhuma foto cadastrada em supervisões ou eventos para o período selecionado.
              </div>
            )}
          </div>
        </section>

        {/* 13. OCORRÊNCIAS E PROVIDÊNCIAS */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            13. Principais Ocorrências e Providências Adotadas
          </h2>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Ocorrência / Desafio Registrado</th>
                  <th className="p-2.5">Gravidade</th>
                  <th className="p-2.5">Providência Adotada</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {ocorrencias.map((o, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-medium">{o.titulo}</td>
                    <td className="p-2.5 text-zinc-600">{o.gravidade}</td>
                    <td className="p-2.5 text-zinc-700">{o.providencias || "—"}</td>
                    <td className="p-2.5 text-center font-medium text-emerald-700">{o.status}</td>
                  </tr>
                ))}
                {ocorrencias.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-zinc-500 bg-zinc-50/50">
                      Operação sem intercorrências graves no período. Todas as rotinas foram mantidas com normalidade.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 14. RESULTADOS ALCANÇADOS */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            14. Resultados Alcançados e Impacto Social
          </h2>
          {modoEdicao ? (
            <textarea
              value={impactoSocialTexto}
              onChange={(e) => setImpactoSocialTexto(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-300 p-2.5 text-xs text-zinc-800"
            />
          ) : (
            <p className="text-xs text-zinc-700 text-justify leading-relaxed bg-zinc-50/50 p-4 rounded-lg border border-zinc-200">
              {impactoSocialTexto}
            </p>
          )}
        </section>

        {/* 15. CONCLUSÃO */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            15. Conclusão e Parecer Final
          </h2>
          {modoEdicao ? (
            <textarea
              value={conclusaoTexto}
              onChange={(e) => setConclusaoTexto(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-300 p-2.5 text-xs text-zinc-800"
            />
          ) : (
            <p className="text-xs text-zinc-700 text-justify leading-relaxed bg-zinc-50/50 p-4 rounded-lg border border-zinc-200">
              {conclusaoTexto}
            </p>
          )}
        </section>

        {/* 16. DOCUMENTOS COMPROBATÓRIOS (ANEXOS) */}
        <section className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            16. Relação de Documentos Comprobatórios (Anexos Oficiais)
          </h2>
          <ol className="list-decimal list-inside text-xs text-zinc-700 space-y-1 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200">
            <li><strong>Anexo I:</strong> Diários de classe e relatórios consolidados de frequência por turma e núcleo;</li>
            <li><strong>Anexo II:</strong> Relatórios individuais de supervisão pedagógica in loco com registros fotográficos;</li>
            <li><strong>Anexo III:</strong> Termos de entrega e cautela de materiais esportivos e uniformes assinados pelos responsáveis;</li>
            <li><strong>Anexo IV:</strong> Relatórios de registro de ponto eletrônico e frequência da equipe de profissionais;</li>
            <li><strong>Anexo V:</strong> Extratos bancários da conta corrente específica da parceria e comprovantes de pagamentos.</li>
          </ol>
        </section>

        {/* SIGNATÁRIOS E ASSINATURAS */}
        <section className="mt-16 pt-8 border-t border-zinc-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-xs">
            <div className="flex flex-col items-center">
              <div className="w-4/5 border-t border-zinc-900 pt-2 mb-1">
                {modoEdicao ? (
                  <input
                    value={responsavelElaboracao.nome}
                    onChange={(e) => setResponsavelElaboracao({ ...responsavelElaboracao, nome: e.target.value })}
                    className="w-full text-center border rounded px-1 text-xs font-bold"
                  />
                ) : (
                  <p className="font-bold text-zinc-900">{responsavelElaboracao.nome}</p>
                )}
                <p className="text-[11px] text-zinc-500">{responsavelElaboracao.cargo}</p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-4/5 border-t border-zinc-900 pt-2 mb-1">
                {modoEdicao ? (
                  <input
                    value={coordenadorGeral.nome}
                    onChange={(e) => setCoordenadorGeral({ ...coordenadorGeral, nome: e.target.value })}
                    className="w-full text-center border rounded px-1 text-xs font-bold"
                  />
                ) : (
                  <p className="font-bold text-zinc-900">{coordenadorGeral.nome}</p>
                )}
                <p className="text-[11px] text-zinc-500">{coordenadorGeral.cargo}</p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-4/5 border-t border-zinc-900 pt-2 mb-1">
                {modoEdicao ? (
                  <input
                    value={representanteLegal.nome}
                    onChange={(e) => setRepresentanteLegal({ ...representanteLegal, nome: e.target.value })}
                    className="w-full text-center border rounded px-1 text-xs font-bold"
                  />
                ) : (
                  <p className="font-bold text-zinc-900">{representanteLegal.nome}</p>
                )}
                <p className="text-[11px] text-zinc-500">{representanteLegal.cargo}</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
