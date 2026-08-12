"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, Clock, LogIn, LogOut, RotateCcw, User, X } from "lucide-react";
import { funcionariosApi, professoresApi, type FuncionarioApi } from "@/lib/api/services";
import type { RegistroPonto } from "@/lib/types";

function isoHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function horaAgora(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

type Etapa = "matricula" | "confirmar" | "atividade" | "sucesso";

const isInstrutor = (f: FuncionarioApi) =>
  f.funcao === "Instrutor" || f.funcao === "Monitor";

// Modal de confirmação de atividade com foto
interface ModalAtividadeProps {
  onConfirmar: (obs: string, fotoFile: File | null) => void;
  salvando: boolean;
}

function ModalAtividade({ onConfirmar, salvando }: ModalAtividadeProps) {
  const [obs, setObs] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">
          Foto da aula <span className="text-red-500">*</span>
        </p>
        {fotoPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoPreview} alt="Foto da aula" className="h-52 w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => { setFotoPreview(null); setFotoFile(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="absolute right-2 top-2 rounded-full bg-white p-1 shadow"
            >
              <X className="h-3.5 w-3.5 text-zinc-600" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-4 py-10 text-sm text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50 active:bg-zinc-100"
          >
            <Camera className="h-10 w-10 text-zinc-400" />
            <span className="font-medium">Tirar foto ou escolher da galeria</span>
            <span className="text-xs text-zinc-400">JPG, PNG</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleArquivo}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Observação</label>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          rows={3}
          placeholder="Descreva brevemente a atividade aplicada…"
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="button"
        disabled={salvando}
        onClick={() => {
          if (!fotoFile) { alert("Foto obrigatória."); return; }
          onConfirmar(obs, fotoFile);
        }}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
      >
        {salvando ? "Enviando..." : "Confirmar atividade"}
      </button>
    </div>
  );
}

export default function PontoPublicoPage() {
  const [etapa, setEtapa] = useState<Etapa>("matricula");
  const [matricula, setMatricula] = useState("");
  const [erro, setErro] = useState("");
  const [funcionario, setFuncionario] = useState<FuncionarioApi | null>(null);
  const [tipoBatida, setTipoBatida] = useState<"entrada" | "saida">("entrada");
  const [horaBatida, setHoraBatida] = useState("");
  const [atividadeConfirmada, setAtividadeConfirmada] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function buscarFuncionario() {
    setErro("");
    const mat = matricula.trim().toUpperCase();
    try {
      const res = await funcionariosApi.list({ busca: mat, limit: 10 });
      const f = res.data.find((fn) => fn.matricula?.toUpperCase() === mat) ?? res.data[0];
      if (!f) {
        setErro("Matrícula não encontrada.");
        return;
      }
      setFuncionario(f);
      setTipoBatida("entrada");
      setHoraBatida(horaAgora());
      setEtapa("confirmar");
    } catch {
      setErro("Erro ao buscar funcionário.");
    }
  }

  async function confirmarPonto() {
    if (!funcionario) return;
    setSalvando(true);
    try {
      await professoresApi.salvarBatidaPonto({
        funcionarioId: funcionario.id,
        tipo: tipoBatida,
        hora: `${horaBatida}:00`,
      });

      if (isInstrutor(funcionario) && tipoBatida === "saida") {
        setEtapa("atividade");
      } else {
        setEtapa("sucesso");
      }
    } catch (err: any) {
      alert("Erro ao registrar ponto: " + (err?.message || "Tente novamente"));
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarAtividade(obs: string, fotoFile: File | null) {
    if (!funcionario) return;
    setSalvando(true);
    try {
      let fotoUrl = "";
      if (fotoFile) {
        fotoUrl = await professoresApi.uploadComprovacao(fotoFile, fotoFile.name);
      }
      await professoresApi.salvarAplicacaoAtividade({
        turmaId: (funcionario as any).turmasIds?.[0] || funcionario.nucleoId || "",
        funcionarioId: funcionario.id,
        dataAula: isoHoje(),
        horaInicio: horaBatida,
        descricao: obs || "Atividade de aula registrada via Kiosk público",
        fotoUrl,
      });
      setAtividadeConfirmada(true);
      setEtapa("sucesso");
    } catch (err: any) {
      alert("Erro ao salvar atividade: " + (err?.message || "Tente novamente"));
    } finally {
      setSalvando(false);
    }
  }

  function reiniciar() {
    setEtapa("matricula");
    setMatricula("");
    setErro("");
    setFuncionario(null);
    setAtividadeConfirmada(false);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center gap-6">

      {/* ── Etapa 1: digitar matrícula ── */}
      {etapa === "matricula" && (
        <div className="flex flex-col gap-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Clock className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Registro de ponto</h1>
            <p className="mt-1 text-sm text-zinc-500">Digite sua matrícula para continuar</p>
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={matricula}
              onChange={(e) => { setMatricula(e.target.value); setErro(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") buscarFuncionario(); }}
              placeholder="Ex: FN-0001"
              autoFocus
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-center text-lg font-mono tracking-widest focus:border-blue-500 focus:outline-none uppercase"
            />
            {erro && <p className="text-center text-sm text-red-500">{erro}</p>}
            <button
              type="button"
              onClick={buscarFuncionario}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* ── Etapa 2: confirmar identidade e bater ponto ── */}
      {etapa === "confirmar" && funcionario && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <User className="h-8 w-8 text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-zinc-900 text-lg">{funcionario.nomeCompleto}</p>
              <p className="text-sm text-zinc-500">{funcionario.funcao} · {funcionario.matricula}</p>
            </div>
          </div>

          <div className={`flex flex-col items-center gap-2 rounded-2xl px-6 py-5 ${
            tipoBatida === "entrada" ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
          }`}>
            {tipoBatida === "entrada"
              ? <LogIn className="h-8 w-8 text-green-600" />
              : <LogOut className="h-8 w-8 text-amber-600" />
            }
            <p className={`font-semibold text-lg ${tipoBatida === "entrada" ? "text-green-700" : "text-amber-700"}`}>
              {tipoBatida === "entrada" ? "Entrada" : "Saída"}
            </p>
            <p className="font-mono text-3xl font-bold text-zinc-800 tabular-nums">{horaBatida}</p>
            <p className="text-xs text-zinc-500">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={confirmarPonto}
              className={`w-full rounded-xl py-3 text-sm font-semibold text-white ${
                tipoBatida === "entrada"
                  ? "bg-green-600 hover:bg-green-700 active:bg-green-800"
                  : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700"
              }`}
            >
              Confirmar {tipoBatida === "entrada" ? "entrada" : "saída"}
            </button>
            <button
              type="button"
              onClick={reiniciar}
              className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-500 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Etapa 3: confirmação de atividade (instrutores na saída) ── */}
      {etapa === "atividade" && funcionario && (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-zinc-900">Confirmar atividade aplicada</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Registre a aula de hoje com uma foto antes de sair
            </p>
          </div>
          <ModalAtividade onConfirmar={confirmarAtividade} salvando={salvando} />
          <button
            type="button"
            onClick={() => setEtapa("sucesso")}
            className="text-center text-xs text-zinc-400 hover:underline"
          >
            Pular por agora
          </button>
        </div>
      )}

      {/* ── Etapa 4: sucesso ── */}
      {etapa === "sucesso" && funcionario && (
        <div className="flex flex-col items-center gap-5 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Ponto registrado!</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {tipoBatida === "entrada" ? "Entrada" : "Saída"} registrada às{" "}
              <span className="font-mono font-semibold">{horaBatida}</span>
            </p>
            {atividadeConfirmada && (
              <p className="mt-1 text-sm text-green-600">Atividade confirmada.</p>
            )}
          </div>
          <button
            type="button"
            onClick={reiniciar}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            <RotateCcw className="h-4 w-4" />
            Novo registro
          </button>
        </div>
      )}
    </div>
  );
}
