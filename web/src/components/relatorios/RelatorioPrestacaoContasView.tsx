"use client";

import { useState } from "react";
import { formatarData } from "@/lib/utils";
import type { DadosRelatorioPrestacaoContas } from "@/lib/api/prestacaoContas";
import { Badge, Button } from "@/components/ui";
import { Printer, FileDown, Save, Edit3, CheckCircle2, AlertCircle } from "lucide-react";
import { exportarRelatorioPrestacaoContasDocx } from "@/lib/export/exportarPrestacaoContasDocx";
import { exportarRelatorioPrestacaoContasPdf } from "@/lib/export/exportarPrestacaoContasPdf";

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
  const { objeto, organizacao, periodo, resumoIndicadores, execucaoPorNucleo, beneficiarios, beneficiariosLista, frequencia, atividadesRealizadas, supervisoes, recursosHumanos, materiais, cumprimentoMetas, registroFotografico, ocorrencias } = dados;

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

  // Estados individuais de edição
  const [editandoMetas, setEditandoMetas] = useState(false);
  const [editandoResultados, setEditandoResultados] = useState(false);
  const [editandoConclusao, setEditandoConclusao] = useState(false);
  const [editandoSignatarios, setEditandoSignatarios] = useState(false);
  
  const [exportandoDocx, setExportandoDocx] = useState(false);
  const [exportandoPdf, setExportandoPdf] = useState(false);

  // Seleção dinâmica dos anexos a gerar no dossiê
  const [anexosSelecionados, setAnexosSelecionados] = useState({
    anexo1_nucleos: true,
    anexo2_beneficiarios: true,
    anexo3_frequencias: true,
    anexo4_atividades: true,
    anexo5_supervisoes: true,
    anexo6_rh: true,
    anexo7_materiais: true,
    anexo8_metas: true,
  });

  function toggleTodosAnexos(valor: boolean) {
    setAnexosSelecionados({
      anexo1_nucleos: valor,
      anexo2_beneficiarios: valor,
      anexo3_frequencias: valor,
      anexo4_atividades: valor,
      anexo5_supervisoes: valor,
      anexo6_rh: valor,
      anexo7_materiais: valor,
      anexo8_metas: valor,
    });
  }

  async function handleExportarPdf() {
    setExportandoPdf(true);
    try {
      await exportarRelatorioPrestacaoContasPdf(
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
        },
        anexosSelecionados
      );
    } catch (err: any) {
      alert("Erro ao gerar PDF oficial: " + (err.message || err));
    } finally {
      setExportandoPdf(false);
    }
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
        },
        anexosSelecionados
      );
    } catch (err: any) {
      alert("Erro ao exportar DOCX: " + (err.message || err));
    } finally {
      setExportandoDocx(false);
    }
  }

  function handlePrint() {
    window.print();
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
          {onSalvar && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSalvar}
              disabled={salvando}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              <Save className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              {salvando ? "Salvando..." : "Salvar no Histórico"}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleExportarPdf}
            disabled={exportandoPdf}
            className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
          >
            <FileDown className="mr-1.5 h-3.5 w-3.5" />
            {exportandoPdf ? "Gerando PDF Oficial..." : "Baixar Relatório em PDF (.PDF)"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportarDocx}
            disabled={exportandoDocx}
            className="border-zinc-300 text-zinc-800 hover:bg-zinc-50"
          >
            <FileDown className="mr-1.5 h-3.5 w-3.5 text-zinc-600" />
            {exportandoDocx ? "Gerando Word..." : "Baixar em Word (.DOCX)"}
          </Button>

          <Button type="button" size="sm" onClick={handlePrint}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Imprimir
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
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            4. Execução por Núcleo
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            Apresentar a execução individualizada de cada núcleo.
          </p>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Núcleo</th>
                  <th className="p-2.5">Região/Bairro</th>
                  <th className="p-2.5">Modalidade</th>
                  <th className="p-2.5">Professor</th>
                  <th className="p-2.5 text-center">Nº de Turmas</th>
                  <th className="p-2.5 text-center">Beneficiários Atendidos</th>
                  <th className="p-2.5 text-center">Aulas Realizadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {execucaoPorNucleo.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-semibold text-zinc-800">{item.identificacao}</td>
                    <td className="p-2.5 text-zinc-600">{item.bairro || item.regiao || "—"}</td>
                    <td className="p-2.5 text-zinc-600">{item.modalidades.join(", ") || "—"}</td>
                    <td className="p-2.5 text-zinc-600">{item.professores.join(", ") || "—"}</td>
                    <td className="p-2.5 text-center font-medium">{item.totalTurmas}</td>
                    <td className="p-2.5 text-center font-semibold text-sky-800">{item.beneficiariosAtendidos}</td>
                    <td className="p-2.5 text-center font-medium">{item.aulasRealizadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. BENEFICIÁRIOS ATENDIDOS */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            5. Beneficiários Atendidos
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            No período analisado, o projeto registrou o atendimento de <strong>{beneficiarios.totalCadastrados}</strong> beneficiários, distribuídos entre os diferentes núcleos e turmas.
          </p>

          {/* 5.1 Demonstrativo de beneficiários */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase text-zinc-700 mb-2">5.1 Demonstrativo de beneficiários</h3>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg max-w-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2.5">Indicador</th>
                    <th className="p-2.5 text-center w-36">Quantidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  <tr>
                    <td className="p-2.5 font-medium">Beneficiários cadastrados</td>
                    <td className="p-2.5 text-center font-bold text-zinc-900">{beneficiarios.totalCadastrados}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Beneficiários ativos</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">{beneficiarios.ativos}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Novos beneficiários no período</td>
                    <td className="p-2.5 text-center font-medium">{beneficiarios.novosNoPeriodo}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Beneficiários desligados/desistentes</td>
                    <td className="p-2.5 text-center font-medium text-zinc-500">{beneficiarios.desligadosDesistentes}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Beneficiários do sexo feminino</td>
                    <td className="p-2.5 text-center font-medium">{beneficiarios.feminino}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Beneficiários do sexo masculino</td>
                    <td className="p-2.5 text-center font-medium">{beneficiarios.masculino}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-zinc-600 mb-2 italic">
            Quando necessário, deverão ser apresentados demonstrativos por núcleo, turma, modalidade, faixa etária e período de atendimento.
          </p>

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

        {/* 7. ATIVIDADES REALIZADAS */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            7. Atividades Realizadas
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            As atividades desenvolvidas no período compreenderam aulas e treinamentos de futebol e futsal, além de outras ações previstas no planejamento do projeto.
          </p>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5 w-24">Data</th>
                  <th className="p-2.5">Núcleo</th>
                  <th className="p-2.5">Modalidade</th>
                  <th className="p-2.5">Atividade</th>
                  <th className="p-2.5">Professor</th>
                  <th className="p-2.5 text-center w-24">Participantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {atividadesRealizadas.slice(0, 15).map((a, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono text-zinc-600">{formatarData(a.data)}</td>
                    <td className="p-2.5 font-medium">{a.nucleoNome}</td>
                    <td className="p-2.5 text-zinc-600">{a.modalidade || "—"}</td>
                    <td className="p-2.5 text-zinc-700">{a.atividadeDescricao || a.turmaNome}</td>
                    <td className="p-2.5 text-zinc-600">{a.professorNome || "—"}</td>
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
                      Nenhuma atividade registrada no período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 8. ACOMPANHAMENTO E SUPERVISÃO DOS NÚCLEOS */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            8. Acompanhamento e Supervisão dos Núcleos
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            Durante a execução do projeto, deverão ser realizadas visitas periódicas aos núcleos pela coordenação, com o objetivo de acompanhar o funcionamento das atividades e verificar as condições de execução.
          </p>

          <h3 className="text-xs font-bold uppercase text-zinc-700 mb-2">Demonstrativo das visitas</h3>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5 w-24">Data</th>
                  <th className="p-2.5">Núcleo</th>
                  <th className="p-2.5">Coordenador</th>
                  <th className="p-2.5">Professor</th>
                  <th className="p-2.5 text-center">Beneficiários Presentes</th>
                  <th className="p-2.5 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {supervisoes.map((s, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono text-zinc-600">{formatarData(s.data)}</td>
                    <td className="p-2.5 font-semibold">{s.nucleoNome || "—"}</td>
                    <td className="p-2.5 text-zinc-600">{s.coordenadorNome || "—"}</td>
                    <td className="p-2.5 text-zinc-600">{s.professorPresente ? "Presente" : "Ausente"}</td>
                    <td className="p-2.5 text-center font-medium">{s.beneficiariosPresentes}</td>
                    <td className="p-2.5 text-center">
                      <Badge tone={s.situacao === "Regular" ? "green" : "amber"}>{s.situacao}</Badge>
                    </td>
                  </tr>
                ))}
                {supervisoes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-zinc-400">
                      Nenhuma visita de supervisão registrada no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 9. RECURSOS HUMANOS */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            9. Recursos Humanos
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            Apresentar os profissionais que efetivamente atuaram durante o período.
          </p>

          <div className="overflow-x-auto border border-zinc-200 rounded-lg mb-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Profissional</th>
                  <th className="p-2.5">Função</th>
                  <th className="p-2.5">Núcleo/Área</th>
                  <th className="p-2.5 text-center">Período de Atuação</th>
                  <th className="p-2.5 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {recursosHumanos.profissionais.map((p, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-medium">{p.nomeCompleto}</td>
                    <td className="p-2.5 text-zinc-600">{p.funcao || "—"}</td>
                    <td className="p-2.5 text-zinc-600">{p.nucleoOuAlocacao || "—"}</td>
                    <td className="p-2.5 text-center text-zinc-500 font-mono text-[11px]">{formatarData(periodo.dataInicio)} a {formatarData(periodo.dataFim)}</td>
                    <td className="p-2.5 text-center font-medium text-emerald-700">{p.situacao || "Ativo"}</td>
                  </tr>
                ))}
                {recursosHumanos.profissionais.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-zinc-400">
                      Nenhum profissional vinculado no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-zinc-500 italic">
            Deverão ser mantidos os documentos comprobatórios referentes à contratação e atuação dos profissionais, conforme as exigências do instrumento e do Plano de Trabalho.
          </p>
        </section>

        {/* 10. MATERIAIS E UNIFORMES */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            10. Materiais e Uniformes
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            Apresentar os materiais adquiridos, recebidos, distribuídos ou utilizados durante a execução do projeto.
          </p>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg mb-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5 text-center">Quantidade Prevista</th>
                  <th className="p-2.5 text-center">Quantidade Adquirida/Recebida</th>
                  <th className="p-2.5 text-center">Quantidade Distribuída</th>
                  <th className="p-2.5">Destinação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {materiais.map((m, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-medium">{m.nome}</td>
                    <td className="p-2.5 text-center">{m.quantidadePrevista} {m.unidadeMedida}</td>
                    <td className="p-2.5 text-center font-medium">{m.quantidadeAdquirida} {m.unidadeMedida}</td>
                    <td className="p-2.5 text-center font-bold text-sky-800">{m.quantidadeDistribuida} {m.unidadeMedida}</td>
                    <td className="p-2.5 text-zinc-600">{m.destinacao || "—"}</td>
                  </tr>
                ))}
                {materiais.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-zinc-400">
                      Nenhum material movimentado no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-zinc-500 italic">
            Quando houver entrega individual de materiais ou uniformes aos beneficiários ou profissionais, recomenda-se manter termo/lista de entrega e recebimento, contendo identificação, quantidade, data e assinatura do destinatário.
          </p>
        </section>

        {/* 11. CUMPRIMENTO DAS METAS */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            11. Cumprimento das Metas
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            A análise deverá comparar diretamente aquilo que foi previsto no Plano de Trabalho com o resultado efetivamente alcançado.
          </p>
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Meta/Indicador</th>
                  <th className="p-2.5 text-center">Previsto</th>
                  <th className="p-2.5 text-center">Executado</th>
                  <th className="p-2.5 text-center">Percentual de Execução</th>
                  <th className="p-2.5 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {cumprimentoMetas.map((m, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-medium">{m.meta}</td>
                    <td className="p-2.5 text-center">{m.previsto} {m.unidade}</td>
                    <td className="p-2.5 text-center font-bold text-zinc-900">{m.realizado} {m.unidade}</td>
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
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-xs font-semibold text-zinc-700">Análise do cumprimento das metas: Caso alguma meta não tenha sido integralmente alcançada, deverão ser apresentadas as justificativas e as providências adotadas.</label>
              <button
                type="button"
                onClick={() => setEditandoMetas((v) => !v)}
                className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:text-sky-900 border border-sky-200 bg-sky-50 px-2 py-0.5 rounded print:hidden"
              >
                {editandoMetas ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Edit3 className="w-3 h-3" />}
                {editandoMetas ? "Concluir" : "Editar"}
              </button>
            </div>
            {editandoMetas ? (
              <textarea
                value={justificativaMetas}
                onChange={(e) => setJustificativaMetas(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 text-xs text-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            ) : (
              <p className="mt-1 text-xs text-zinc-700 text-justify bg-zinc-50/70 p-3 rounded-lg border border-zinc-200">
                {justificativaMetas}
              </p>
            )}
          </div>
        </section>

        {/* 12. REGISTRO FOTOGRÁFICO */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            12. Registro Fotográfico
          </h2>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            Inserir registros fotográficos que demonstrem a efetiva realização das atividades.
          </p>
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

        {/* 13. PRINCIPAIS OCORRÊNCIAS E PROVIDÊNCIAS */}
        <section className="mb-8 print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-zinc-100 px-3 py-1.5 text-zinc-800 border-l-4 border-sky-600 mb-3">
            13. Principais Ocorrências e Providências
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
        <section className="mb-8 print-section">
          <div className="flex items-center justify-between bg-zinc-100 px-3 py-1.5 border-l-4 border-sky-600 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800">
              14. Resultados Alcançados
            </h2>
            <button
              type="button"
              onClick={() => setEditandoResultados((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:text-sky-900 border border-sky-200 bg-white px-2 py-0.5 rounded print:hidden"
            >
              {editandoResultados ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Edit3 className="w-3 h-3" />}
              {editandoResultados ? "Concluir" : "Editar"}
            </button>
          </div>
          {editandoResultados ? (
            <textarea
              value={impactoSocialTexto}
              onChange={(e) => setImpactoSocialTexto(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-300 p-2.5 text-xs text-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          ) : (
            <p className="text-xs text-zinc-700 text-justify leading-relaxed bg-zinc-50/50 p-4 rounded-lg border border-zinc-200">
              {impactoSocialTexto}
            </p>
          )}
        </section>

        {/* 15. CONCLUSÃO */}
        <section className="mb-8 print-section">
          <div className="flex items-center justify-between bg-zinc-100 px-3 py-1.5 border-l-4 border-sky-600 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800">
              15. Conclusão
            </h2>
            <button
              type="button"
              onClick={() => setEditandoConclusao((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:text-sky-900 border border-sky-200 bg-white px-2 py-0.5 rounded print:hidden"
            >
              {editandoConclusao ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Edit3 className="w-3 h-3" />}
              {editandoConclusao ? "Concluir" : "Editar"}
            </button>
          </div>
          {editandoConclusao ? (
            <textarea
              value={conclusaoTexto}
              onChange={(e) => setConclusaoTexto(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-300 p-2.5 text-xs text-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          ) : (
            <p className="text-xs text-zinc-700 text-justify leading-relaxed bg-zinc-50/50 p-4 rounded-lg border border-zinc-200">
              {conclusaoTexto}
            </p>
          )}
        </section>

        {/* 16. DOCUMENTOS COMPROBATÓRIOS / ANEXOS */}
        <section className="mb-12 print-section">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-100 px-3 py-1.5 border-l-4 border-sky-600 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800">
              16. Documentos Comprobatórios / Anexos Oficiais
            </h2>
            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => toggleTodosAnexos(true)}
                className="text-[11px] font-medium text-sky-700 hover:text-sky-900 bg-white border border-sky-200 px-2 py-0.5 rounded shadow-sm"
              >
                Marcar Todos
              </button>
              <button
                type="button"
                onClick={() => toggleTodosAnexos(false)}
                className="text-[11px] font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5 rounded shadow-sm"
              >
                Desmarcar Todos
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-600 mb-3 print:hidden">
            Selecione quais relatórios detalhados devem ser compilados como anexos no dossiê final (impressão/PDF e Word .DOCX):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-zinc-50/70 p-3.5 rounded-lg border border-zinc-200 text-xs">
            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-zinc-200">
              <input
                type="checkbox"
                checked={anexosSelecionados.anexo1_nucleos}
                onChange={(e) => setAnexosSelecionados({ ...anexosSelecionados, anexo1_nucleos: e.target.checked })}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-zinc-900">Anexo I: Relação dos Núcleos em Funcionamento</span>
                <span className="ml-1 text-[11px] text-zinc-500">({execucaoPorNucleo.length} núcleos)</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Detalhamento dos locais, endereços, turmas e professores.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-zinc-200">
              <input
                type="checkbox"
                checked={anexosSelecionados.anexo2_beneficiarios}
                onChange={(e) => setAnexosSelecionados({ ...anexosSelecionados, anexo2_beneficiarios: e.target.checked })}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-zinc-900">Anexo II: Relação Nominal de Beneficiários</span>
                <span className="ml-1 text-[11px] text-zinc-500">({beneficiariosLista?.length || beneficiarios.totalCadastrados} alunos)</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Listagem nominal de matrículas, idade, gênero e vulnerabilidade.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-zinc-200">
              <input
                type="checkbox"
                checked={anexosSelecionados.anexo3_frequencias}
                onChange={(e) => setAnexosSelecionados({ ...anexosSelecionados, anexo3_frequencias: e.target.checked })}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-zinc-900">Anexo III: Relatórios e Listas de Frequência</span>
                <span className="ml-1 text-[11px] text-zinc-500">({frequencia.porNucleo.length} núcleos)</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Consolidação de presenças, faltas e percentual médio por núcleo.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-zinc-200">
              <input
                type="checkbox"
                checked={anexosSelecionados.anexo4_atividades}
                onChange={(e) => setAnexosSelecionados({ ...anexosSelecionados, anexo4_atividades: e.target.checked })}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-zinc-900">Anexo IV: Relatório de Atividades e Aulas</span>
                <span className="ml-1 text-[11px] text-zinc-500">({atividadesRealizadas.length} aulas)</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Diário cronológico de aulas, temas pedagógicos e participantes.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-zinc-200">
              <input
                type="checkbox"
                checked={anexosSelecionados.anexo5_supervisoes}
                onChange={(e) => setAnexosSelecionados({ ...anexosSelecionados, anexo5_supervisoes: e.target.checked })}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-zinc-900">Anexo V: Relatórios de Supervisão com Fotos</span>
                <span className="ml-1 text-[11px] text-zinc-500">({supervisoes.length} visitas)</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Fichas de visitas in loco da coordenação e registros fotográficos.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-zinc-200">
              <input
                type="checkbox"
                checked={anexosSelecionados.anexo6_rh}
                onChange={(e) => setAnexosSelecionados({ ...anexosSelecionados, anexo6_rh: e.target.checked })}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-zinc-900">Anexo VI: Relação dos Profissionais (RH)</span>
                <span className="ml-1 text-[11px] text-zinc-500">({recursosHumanos.profissionais.length} profissionais)</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Quadro funcional, funções contratadas e períodos de atuação.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-zinc-200">
              <input
                type="checkbox"
                checked={anexosSelecionados.anexo7_materiais}
                onChange={(e) => setAnexosSelecionados({ ...anexosSelecionados, anexo7_materiais: e.target.checked })}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-zinc-900">Anexo VII: Termos de Materiais e Uniformes</span>
                <span className="ml-1 text-[11px] text-zinc-500">({materiais.length} itens)</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Controle de materiais esportivos, aquisições e distribuição.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-zinc-200">
              <input
                type="checkbox"
                checked={anexosSelecionados.anexo8_metas}
                onChange={(e) => setAnexosSelecionados({ ...anexosSelecionados, anexo8_metas: e.target.checked })}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="font-semibold text-zinc-900">Anexo VIII: Demonstrativo Analítico de Metas</span>
                <span className="ml-1 text-[11px] text-zinc-500">({cumprimentoMetas.length} indicadores)</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Quadro comparativo analítico das metas pactuadas no Plano.</p>
              </div>
            </label>
          </div>
        </section>

        {/* SIGNATÁRIOS E ASSINATURAS */}
        <section className="mt-8 pt-6 border-t border-zinc-300 print-signatures print:mt-4 print:pt-3">
          <div className="flex items-center justify-end mb-4 print:hidden">
            <button
              type="button"
              onClick={() => setEditandoSignatarios((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:text-sky-900 border border-sky-200 bg-sky-50 px-2 py-0.5 rounded"
            >
              {editandoSignatarios ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Edit3 className="w-3 h-3" />}
              {editandoSignatarios ? "Concluir Edição de Signatários" : "Editar Signatários"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-xs print:gap-4">
            <div className="flex flex-col items-center">
              <div className="w-4/5 border-t border-zinc-900 pt-2 mb-1">
                {editandoSignatarios ? (
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
                {editandoSignatarios ? (
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
                {editandoSignatarios ? (
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

        {/* ── APÊNDICES: ANEXOS OFICIAIS DETALHADOS DO DOSSIÊ ──────────────── */}

        {/* Quebra de página antes do bloco de apêndices */}
        <div className="print-page-break" />

        {/* ANEXO I - NÚCLEOS */}
        {anexosSelecionados.anexo1_nucleos && (
          <section className="mt-8 pt-4 border-t-2 border-zinc-300 print-section print:mt-3 print:pt-2">
            <div className="bg-zinc-800 text-white px-3 py-1.5 rounded-t-lg mb-2 print:py-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                ANEXO I — RELAÇÃO DOS NÚCLEOS ESPORTIVOS EM FUNCIONAMENTO
              </h3>
              <p className="text-[10px] text-zinc-300">
                Objeto: {objeto.nome} • Termo: {objeto.termoDeFomento || "—"}
              </p>
            </div>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2">Núcleo Esportivo</th>
                    <th className="p-2">Região / Bairro</th>
                    <th className="p-2">Modalidades</th>
                    <th className="p-2">Professores Vinculados</th>
                    <th className="p-2 text-center">Nº Turmas</th>
                    <th className="p-2 text-center">Beneficiários</th>
                    <th className="p-2 text-center">Aulas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {execucaoPorNucleo.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 font-medium">{item.identificacao}</td>
                      <td className="p-2 text-zinc-600">{item.bairro || item.regiao || "—"}</td>
                      <td className="p-2 text-zinc-600">{item.modalidades.join(", ") || "—"}</td>
                      <td className="p-2 text-zinc-600">{item.professores.join(", ") || "—"}</td>
                      <td className="p-2 text-center">{item.totalTurmas}</td>
                      <td className="p-2 text-center font-bold">{item.beneficiariosAtendidos}</td>
                      <td className="p-2 text-center">{item.aulasRealizadas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ANEXO II - BENEFICIÁRIOS */}
        {anexosSelecionados.anexo2_beneficiarios && (
          <section className="mt-8 pt-4 border-t-2 border-zinc-300 print-section print:mt-3 print:pt-2">
            <div className="bg-zinc-800 text-white px-3 py-1.5 rounded-t-lg mb-2 print:py-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                ANEXO II — RELAÇÃO NOMINAL DE BENEFICIÁRIOS ATENDIDOS
              </h3>
              <p className="text-[10px] text-zinc-300">
                Total de Cadastrados: {beneficiarios.totalCadastrados} • Ativos: {beneficiarios.ativos}
              </p>
            </div>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2">Nome do Beneficiário</th>
                    <th className="p-2">Núcleo</th>
                    <th className="p-2 text-center">Idade</th>
                    <th className="p-2 text-center">Sexo</th>
                    <th className="p-2 text-center">Vulnerabilidade</th>
                    <th className="p-2 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {(beneficiariosLista ?? []).map((b, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 font-medium">{b.nomeCompleto}</td>
                      <td className="p-2 text-zinc-600">{b.nucleoNome}</td>
                      <td className="p-2 text-center">{b.idade > 0 ? `${b.idade} anos` : "—"}</td>
                      <td className="p-2 text-center">{b.sexo}</td>
                      <td className="p-2 text-center">
                        <Badge tone={b.vulneravel ? "sky" : "zinc"}>{b.vulneravel ? "Sim" : "Não"}</Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Badge tone={b.status === "Ativo" ? "green" : "amber"}>{b.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {(beneficiariosLista ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-2 text-center text-zinc-500 bg-zinc-50/50">
                        Nenhum beneficiário cadastrado no período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ANEXO III - FREQUÊNCIAS */}
        {anexosSelecionados.anexo3_frequencias && (
          <section className="mt-8 pt-4 border-t-2 border-zinc-300 print-section print:mt-3 print:pt-2">
            <div className="bg-zinc-800 text-white px-3 py-1.5 rounded-t-lg mb-2 print:py-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                ANEXO III — RELATÓRIOS CONSOLIDADOS DE FREQUÊNCIA POR NÚCLEO
              </h3>
              <p className="text-[10px] text-zinc-300">
                Frequência Média Global: {frequencia.frequenciaMediaGeral}% (Meta Mínima: {frequencia.metaMinima}%)
              </p>
            </div>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2">Núcleo Esportivo</th>
                    <th className="p-2 text-center">Beneficiários Ativos</th>
                    <th className="p-2 text-center">Presenças Registradas</th>
                    <th className="p-2 text-center">Faltas Registradas</th>
                    <th className="p-2 text-center">Frequência Média</th>
                    <th className="p-2 text-center">Status Meta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {frequencia.porNucleo.map((fn, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 font-medium">{fn.nucleoNome}</td>
                      <td className="p-2 text-center">{fn.beneficiariosAtivos}</td>
                      <td className="p-2 text-center font-bold text-emerald-700">{fn.presencasRegistradas}</td>
                      <td className="p-2 text-center font-bold text-rose-700">{fn.faltasRegistradas}</td>
                      <td className="p-2 text-center font-bold">{fn.frequenciaMedia}%</td>
                      <td className="p-2 text-center">
                        <Badge tone={fn.frequenciaMedia >= frequencia.metaMinima ? "green" : fn.frequenciaMedia > 0 ? "amber" : "zinc"}>
                          {fn.frequenciaMedia >= frequencia.metaMinima ? "Atingida" : fn.frequenciaMedia > 0 ? "Abaixo" : "Sem Registro"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ANEXO IV - ATIVIDADES / AULAS */}
        {anexosSelecionados.anexo4_atividades && (
          <section className="mt-8 pt-4 border-t-2 border-zinc-300 print-section print:mt-3 print:pt-2">
            <div className="bg-zinc-800 text-white px-3 py-1.5 rounded-t-lg mb-2 print:py-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                ANEXO IV — RELATÓRIO DE ATIVIDADES E AULAS REALIZADAS
              </h3>
              <p className="text-[10px] text-zinc-300">
                Total de Aulas Executadas no Período: {atividadesRealizadas.length}
              </p>
            </div>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2">Data</th>
                    <th className="p-2">Núcleo</th>
                    <th className="p-2">Modalidade</th>
                    <th className="p-2">Conteúdo / Atividade</th>
                    <th className="p-2">Professor</th>
                    <th className="p-2 text-center">Participantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {atividadesRealizadas.map((a, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 font-mono">{formatarData(a.data)}</td>
                      <td className="p-2 font-medium">{a.nucleoNome}</td>
                      <td className="p-2 text-zinc-600">{a.modalidade || "—"}</td>
                      <td className="p-2 text-zinc-800">{a.atividadeDescricao || a.turmaNome}</td>
                      <td className="p-2 text-zinc-600">{a.professorNome || "—"}</td>
                      <td className="p-2 text-center font-bold">{a.participantesPresentes}</td>
                    </tr>
                  ))}
                  {atividadesRealizadas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-2 text-center text-zinc-500 bg-zinc-50/50">
                        Nenhuma atividade registrada no período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ANEXO V - SUPERVISÕES */}
        {anexosSelecionados.anexo5_supervisoes && (
          <section className="mt-8 pt-4 border-t-2 border-zinc-300 print-section print:mt-3 print:pt-2">
            <div className="bg-zinc-800 text-white px-3 py-1.5 rounded-t-lg mb-2 print:py-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                ANEXO V — RELATÓRIOS INDIVIDUAIS DE SUPERVISÃO PEDAGÓGICA COM FOTOS
              </h3>
              <p className="text-[10px] text-zinc-300">
                Total de Visitas Realizadas: {supervisoes.length}
              </p>
            </div>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2">Data</th>
                    <th className="p-2">Núcleo</th>
                    <th className="p-2">Coordenador</th>
                    <th className="p-2">Professor Presente</th>
                    <th className="p-2 text-center">Beneficiários</th>
                    <th className="p-2 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {supervisoes.map((s, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 font-mono">{formatarData(s.data)}</td>
                      <td className="p-2 font-medium">{s.nucleoNome || "—"}</td>
                      <td className="p-2 text-zinc-600">{s.coordenadorNome || "—"}</td>
                      <td className="p-2 text-zinc-600">{s.professorPresente ? "Presente" : "Ausente"}</td>
                      <td className="p-2 text-center font-bold">{s.beneficiariosPresentes}</td>
                      <td className="p-2 text-center">
                        <Badge tone={s.situacao === "Regular" ? "green" : "amber"}>{s.situacao}</Badge>
                      </td>
                    </tr>
                  ))}
                  {supervisoes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-2 text-center text-zinc-500 bg-zinc-50/50">
                        Nenhuma visita de supervisão registrada no período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ANEXO VI - RECURSOS HUMANOS */}
        {anexosSelecionados.anexo6_rh && (
          <section className="mt-8 pt-4 border-t-2 border-zinc-300 print-section print:mt-3 print:pt-2">
            <div className="bg-zinc-800 text-white px-3 py-1.5 rounded-t-lg mb-2 print:py-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                ANEXO VI — RELAÇÃO DOS PROFISSIONAIS E EQUIPE TÉCNICA
              </h3>
              <p className="text-[10px] text-zinc-300">
                Total de Profissionais Atuantes: {recursosHumanos.profissionais.length}
              </p>
            </div>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2">Profissional</th>
                    <th className="p-2">Função</th>
                    <th className="p-2">Núcleo / Alocação</th>
                    <th className="p-2 text-center">Período de Atuação</th>
                    <th className="p-2 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {recursosHumanos.profissionais.map((p, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 font-medium">{p.nomeCompleto}</td>
                      <td className="p-2 text-zinc-600">{p.funcao || "—"}</td>
                      <td className="p-2 text-zinc-600">{p.nucleoOuAlocacao || "—"}</td>
                      <td className="p-2 text-center font-mono text-zinc-500">
                        {formatarData(periodo.dataInicio)} a {formatarData(periodo.dataFim)}
                      </td>
                      <td className="p-2 text-center">
                        <Badge tone={p.situacao === "Ativo" ? "green" : "zinc"}>{p.situacao || "Ativo"}</Badge>
                      </td>
                    </tr>
                  ))}
                  {recursosHumanos.profissionais.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-2 text-center text-zinc-500 bg-zinc-50/50">
                        Nenhum profissional vinculado no período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ANEXO VII - MATERIAIS E UNIFORMES */}
        {anexosSelecionados.anexo7_materiais && (
          <section className="mt-8 pt-4 border-t-2 border-zinc-300 print-section print:mt-3 print:pt-2">
            <div className="bg-zinc-800 text-white px-3 py-1.5 rounded-t-lg mb-2 print:py-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                ANEXO VII — DEMONSTRATIVO DE MATERIAIS E UNIFORMES DISTRIBUÍDOS
              </h3>
              <p className="text-[10px] text-zinc-300">
                Itens Gerenciados no Estoque do Projeto: {materiais.length}
              </p>
            </div>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2">Item / Equipamento</th>
                    <th className="p-2 text-center">Qtd. Prevista</th>
                    <th className="p-2 text-center">Qtd. Adquirida/Recebida</th>
                    <th className="p-2 text-center">Qtd. Distribuída</th>
                    <th className="p-2">Destinação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {materiais.map((m, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 font-medium">{m.nome}</td>
                      <td className="p-2 text-center">{m.quantidadePrevista} {m.unidadeMedida}</td>
                      <td className="p-2 text-center">{m.quantidadeAdquirida} {m.unidadeMedida}</td>
                      <td className="p-2 text-center font-bold text-emerald-700">{m.quantidadeDistribuida} {m.unidadeMedida}</td>
                      <td className="p-2 text-zinc-600">{m.destinacao || "—"}</td>
                    </tr>
                  ))}
                  {materiais.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-2 text-center text-zinc-500 bg-zinc-50/50">
                        Nenhum material movimentado no período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ANEXO VIII - METAS */}
        {anexosSelecionados.anexo8_metas && (
          <section className="mt-8 pt-4 border-t-2 border-zinc-300 print-section print:mt-3 print:pt-2">
            <div className="bg-zinc-800 text-white px-3 py-1.5 rounded-t-lg mb-2 print:py-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                ANEXO VIII — DEMONSTRATIVO ANALÍTICO DE CUMPRIMENTO DAS METAS
              </h3>
              <p className="text-[10px] text-zinc-300">
                Comparativo Geral do Plano de Trabalho
              </p>
            </div>
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2">Meta / Indicador Pactuado</th>
                    <th className="p-2 text-center">Previsto</th>
                    <th className="p-2 text-center">Executado</th>
                    <th className="p-2 text-center">Percentual de Execução</th>
                    <th className="p-2 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {cumprimentoMetas.map((m, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-2 font-medium">{m.meta}</td>
                      <td className="p-2 text-center">{m.previsto} {m.unidade}</td>
                      <td className="p-2 text-center font-bold text-zinc-900">{m.realizado} {m.unidade}</td>
                      <td className="p-2 text-center font-semibold text-emerald-700">{m.percentualExecucao}%</td>
                      <td className="p-2 text-center">
                        <Badge tone={m.situacao === "Cumprida" ? "green" : "amber"}>{m.situacao}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
