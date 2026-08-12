"use client";

import { useState } from "react";
import {
  CalendarCheck,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  UserCheck,
  UserX,
  Users,
  Upload,
  Sparkles,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import { turmasApi, professoresApi, type FuncionarioApi, type TurmaApi, type NucleoApi, type BeneficiarioApi } from "@/lib/api/services";
import { useEffect } from "react";

interface PortalProfessorProps {
  professor: FuncionarioApi;
  turmas: TurmaApi[];
  nucleos: NucleoApi[];
}

export function PortalProfessor({ professor, turmas, nucleos }: PortalProfessorProps) {
  const { toast } = useToast();
  const [abaAtiva, setAbaAtiva] = useState<"ponto" | "chamada" | "confirmacao">("ponto");

  // Estado do Ponto
  const [pontoEntrada, setPontoEntrada] = useState<string | null>(null);
  const [pontoSaida, setPontoSaida] = useState<string | null>(null);

  // Estado da Chamada
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(turmas[0]?.id || "");
  const [alunos, setAlunos] = useState<BeneficiarioApi[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [presencas, setPresencas] = useState<Record<string, "presente" | "falta">>({});

  // Estado da Confirmação de Serviço
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [observacoesAula, setObservacoesAula] = useState("");
  const [atividadeExecutada, setAtividadeExecutada] = useState("");
  const [enviadoConfirmacao, setEnviadoConfirmacao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const turmaAtual = turmas.find((t) => t.id === turmaSelecionadaId);
  const nucleoAtual = nucleos.find((n) => n.id === professor.nucleoId) || nucleos[0];

  // Carregar beneficiários da turma selecionada
  useEffect(() => {
    if (!turmaSelecionadaId) return;
    setCarregandoAlunos(true);
    turmasApi.listarBeneficiarios(turmaSelecionadaId)
      .then((res) => {
        setAlunos(res);
        const presencasIniciais: Record<string, "presente" | "falta"> = {};
        res.forEach((b) => { presencasIniciais[b.id] = "presente"; });
        setPresencas(presencasIniciais);
      })
      .catch((err) => {
        console.error("Erro ao carregar alunos da turma:", err);
      })
      .finally(() => setCarregandoAlunos(false));
  }, [turmaSelecionadaId]);

  async function handlePonto(tipo: "entrada" | "saida") {
    const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    try {
      await professoresApi.salvarBatidaPonto({
        funcionarioId: professor.id,
        tipo,
        hora: `${hora}:00`,
      });
      if (tipo === "entrada") {
        setPontoEntrada(hora);
        toast.success(`Entrada registrada com sucesso às ${hora}!`);
      } else {
        setPontoSaida(hora);
        toast.success(`Saída registrada com sucesso às ${hora}!`);
      }
    } catch (err: any) {
      toast.error("Erro ao registrar ponto: " + (err?.message || "Tente novamente."));
    }
  }

  function togglePresenca(alunoId: string, status: "presente" | "falta") {
    setPresencas((prev) => ({ ...prev, [alunoId]: status }));
  }

  async function handleSalvarChamada() {
    if (!turmaSelecionadaId) return;
    setSalvando(true);
    const dataHoje = new Date().toISOString().slice(0, 10);
    const payloadPresencas = Object.entries(presencas).map(([beneficiarioId, status]) => ({
      beneficiarioId,
      presente: status === "presente",
    }));

    try {
      await professoresApi.salvarPresencas({
        turmaId: turmaSelecionadaId,
        dataAula: dataHoje,
        presencas: payloadPresencas,
      });
      toast.success("Chamada diária registrada com sucesso no banco de dados!");
    } catch (err: any) {
      toast.error("Erro ao salvar chamada: " + (err?.message || "Tente novamente."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleEnviarConfirmacao(e: React.FormEvent) {
    e.preventDefault();
    if (!atividadeExecutada) {
      toast.error("Por favor, descreva a atividade executada.");
      return;
    }
    setSalvando(true);
    try {
      let fotoUrl = "";
      if (fotoFile) {
        fotoUrl = await professoresApi.uploadComprovacao(fotoFile, fotoFile.name);
      }
      const dataHoje = new Date().toISOString().slice(0, 10);
      const horaAgora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      await professoresApi.salvarAplicacaoAtividade({
        turmaId: turmaSelecionadaId || turmas[0]?.id || "",
        funcionarioId: professor.id,
        dataAula: dataHoje,
        horaInicio: horaAgora,
        descricao: `${atividadeExecutada}. ${observacoesAula}`.trim(),
        fotoUrl,
      });

      setEnviadoConfirmacao(true);
      toast.success("Confirmação de serviço e relatório fotográfico enviados!");
    } catch (err: any) {
      toast.error("Erro ao enviar relatório: " + (err?.message || "Tente novamente."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho do Professor */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold backdrop-blur-md">
              👔
            </div>
            <div>
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-sky-100 backdrop-blur-md">
                Portal Exclusivo do Professor
              </span>
              <h1 className="text-xl font-bold mt-0.5">{professor.nomeCompleto}</h1>
              <p className="text-xs text-sky-100 flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {nucleoAtual ? nucleoAtual.identificacao : "Polo Palmas/TO"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md text-right">
              <span className="block text-[10px] text-sky-200 uppercase font-semibold">Matrícula</span>
              <span className="text-sm font-bold font-mono">{professor.matricula}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre as 3 Ferramentas Essenciais */}
      <div className="flex rounded-2xl bg-zinc-200/70 p-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => setAbaAtiva("ponto")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            abaAtiva === "ponto"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>1. Registrador de Ponto</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("chamada")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            abaAtiva === "chamada"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>2. Chamada Diária</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("confirmacao")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            abaAtiva === "confirmacao"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>3. Confirmação de Serviço</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: PONTO */}
      {abaAtiva === "ponto" && (
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-600" />
              <span>Registro Diário de Ponto de Trabalho</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cartão de Entrada */}
              <div className="rounded-2xl border border-zinc-200 p-5 bg-zinc-50/50 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase text-zinc-400">Ponto de Entrada</span>
                  <div className="mt-2 text-2xl font-extrabold text-zinc-900">
                    {pontoEntrada ? pontoEntrada : "--:--"}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Horário previsto: 08:00</p>
                </div>
                <Button
                  onClick={() => handlePonto("entrada")}
                  disabled={!!pontoEntrada}
                  className="w-full justify-center"
                >
                  {pontoEntrada ? "Entrada Registrada ✓" : "Bater Ponto de Entrada"}
                </Button>
              </div>

              {/* Cartão de Saída */}
              <div className="rounded-2xl border border-zinc-200 p-5 bg-zinc-50/50 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase text-zinc-400">Ponto de Saída</span>
                  <div className="mt-2 text-2xl font-extrabold text-zinc-900">
                    {pontoSaida ? pontoSaida : "--:--"}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Horário previsto: 17:00</p>
                </div>
                <Button
                  onClick={() => handlePonto("saida")}
                  disabled={!pontoEntrada || !!pontoSaida}
                  variant="outline"
                  className="w-full justify-center"
                >
                  {pontoSaida ? "Saída Registrada ✓" : "Bater Ponto de Saída"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Histórico Mensal de Ponto */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-4 flex items-center justify-between">
              <span>Espelho de Ponto do Mês (Agosto/2026)</span>
              <Badge tone="sky">160h Cumpridas</Badge>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600">
                <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Dia</th>
                    <th className="px-4 py-3">Entrada</th>
                    <th className="px-4 py-3">Saída</th>
                    <th className="px-4 py-3">Total Horas</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr className="bg-sky-50/40">
                    <td className="px-4 py-3 font-semibold text-zinc-900">07/08/2026</td>
                    <td className="px-4 py-3 font-medium">Hoje</td>
                    <td className="px-4 py-3 text-zinc-900 font-mono">{pontoEntrada || "--:--"}</td>
                    <td className="px-4 py-3 text-zinc-900 font-mono">{pontoSaida || "--:--"}</td>
                    <td className="px-4 py-3 font-semibold">{pontoEntrada && pontoSaida ? "8h00" : "Em andamento"}</td>
                    <td className="px-4 py-3"><Badge tone="sky">Trabalhando</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">06/08/2026</td>
                    <td className="px-4 py-3">Quinta</td>
                    <td className="px-4 py-3 font-mono">08:00</td>
                    <td className="px-4 py-3 font-mono">17:00</td>
                    <td className="px-4 py-3">8h00</td>
                    <td className="px-4 py-3"><Badge tone="green">Presente</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">05/08/2026</td>
                    <td className="px-4 py-3">Quarta</td>
                    <td className="px-4 py-3 font-mono">08:05</td>
                    <td className="px-4 py-3 font-mono">17:02</td>
                    <td className="px-4 py-3">8h00</td>
                    <td className="px-4 py-3"><Badge tone="green">Presente</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">04/08/2026</td>
                    <td className="px-4 py-3">Terça</td>
                    <td className="px-4 py-3 font-mono">07:58</td>
                    <td className="px-4 py-3 font-mono">17:00</td>
                    <td className="px-4 py-3">8h00</td>
                    <td className="px-4 py-3"><Badge tone="green">Presente</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: CHAMADA DIÁRIA */}
      {abaAtiva === "chamada" && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 mb-6 gap-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-600" />
                <span>Chamada de Frequência dos Alunos</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Marque a presença dos beneficiários inscritos na aula de hoje</p>
            </div>

            <div className="w-full sm:w-64">
              <Select
                value={turmaSelecionadaId}
                onChange={(e) => setTurmaSelecionadaId(e.target.value)}
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {carregandoAlunos ? (
              <div className="py-8 text-center text-sm text-zinc-500">Carregando lista de alunos da turma...</div>
            ) : alunos.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">Nenhum aluno matriculado nesta turma.</div>
            ) : (
              alunos.map((aluno) => {
                const status = presencas[aluno.id] || "presente";
                return (
                  <div key={aluno.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-zinc-900 text-sm">{aluno.nomeCompleto}</h4>
                      <span className="text-xs text-zinc-400 font-mono">{aluno.matricula}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePresenca(aluno.id, "presente")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          status === "presente"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Presente
                      </button>

                      <button
                        type="button"
                        onClick={() => togglePresenca(aluno.id, "falta")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          status === "falta"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Falta
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 flex justify-end pt-4 border-t border-zinc-100">
            <Button onClick={handleSalvarChamada} disabled={salvando || carregandoAlunos || alunos.length === 0}>
              {salvando ? "Salvar..." : "Salvar Chamada de Hoje"}
            </Button>
          </div>
        </Card>
      )}

      {/* CONTEÚDO DA ABA 3: CONFIRMAÇÃO DE SERVIÇO */}
      {abaAtiva === "confirmacao" && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-6 flex items-center gap-2">
            <Camera className="h-5 w-5 text-sky-600" />
            <span>Relatório de Confirmação de Atividade Ministrada</span>
          </h3>

          <form onSubmit={handleEnviarConfirmacao} className="flex flex-col gap-4">
            <Field label="Descrição da Aula / Treino Executado" required>
              <Input
                placeholder="Ex: Treino de fundamentos de passe e condução de bola"
                value={atividadeExecutada}
                onChange={(e) => setAtividadeExecutada(e.target.value)}
              />
            </Field>

            <Field label="Foto de Comprovação da Aula (Upload ou Câmera)">
              <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 p-6 text-center hover:bg-zinc-50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setFotoFile(e.target.files[0]);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Camera className="h-8 w-8 text-zinc-400 mb-2" />
                <span className="text-sm font-semibold text-zinc-700">
                  {fotoFile ? fotoFile.name : "Anexar Foto da Aula"}
                </span>
                <span className="text-xs text-zinc-400 mt-0.5">
                  {fotoFile ? "Arquivo selecionado. Clique para alterar." : "Selecione uma imagem ou tire uma foto com a câmera do celular"}
                </span>
              </div>
            </Field>

            <Field label="Observações de Campo / Ocorrências">
              <Textarea
                placeholder="Informe se houve alguma intercorrência, material danificado ou observação sobre os alunos..."
                value={observacoesAula}
                onChange={(e) => setObservacoesAula(e.target.value)}
                rows={3}
              />
            </Field>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Enviando..." : enviadoConfirmacao ? "Confirmação Enviada ✓" : "Enviar Relatório de Serviço"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
