"use client";

import { useState } from "react";
import { X, Copy, Check, ExternalLink, Search, Link2, Building2, Activity, Users, User, Clock } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import type { NucleoApi, AtividadeApi, TurmaApi } from "@/lib/api/services";

interface ModalLinksInscricaoProps {
  open: boolean;
  onClose: () => void;
  nucleos: NucleoApi[];
  atividades: AtividadeApi[];
  turmas: TurmaApi[];
}

type TabType = "todos" | "nucleos" | "atividades" | "turmas";

export function ModalLinksInscricao({
  open,
  onClose,
  nucleos = [],
  atividades = [],
  turmas = [],
}: ModalLinksInscricaoProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabType>("todos");
  const [busca, setBusca] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!open) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://beneficiarios-andorinha.vercel.app";

  function copiarParaTransferencia(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function normalizar(txt?: string | null): string {
    if (!txt) return "";
    return txt
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function contemTodosOsTermos(textoAlvo: string, buscaStr: string): boolean {
    const tokens = normalizar(buscaStr).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return true;
    const alvoNorm = normalizar(textoAlvo);
    return tokens.every((token) => alvoNorm.includes(token));
  }

  const listNucleos = nucleos.filter((n) => {
    const alvo = [
      n.identificacao,
      n.nomeLocal,
      n.endereco,
      n.bairro,
      n.cidade,
      n.regiao,
      n.nomeResponsavel,
    ].filter(Boolean).join(" ");
    return contemTodosOsTermos(alvo, busca);
  });

  const listAtividades = atividades.filter((a) => {
    const alvo = [
      a.nome,
      a.descricao,
      ...(a.turnos || []),
    ].filter(Boolean).join(" ");
    return contemTodosOsTermos(alvo, busca);
  });

  const listTurmas = turmas.filter((t) => {
    const turnosSlot = (t.slots || []).map((s: any) => `${s.dia || ''} ${s.inicio || ''}h ${s.fim || ''}h ${s.inicio < 12 ? 'manhã manha' : 'tarde'}`).join(" ");
    const profs = (t.responsaveisNomes || []).join(" ");
    const alvo = [
      t.nome,
      t.atividade?.nome,
      t.nucleo?.identificacao,
      t.nucleo?.nomeLocal,
      t.nucleo?.cidade,
      t.nucleo?.bairro,
      profs,
      turnosSlot,
      t.nome.toLowerCase().includes("manhã") || t.nome.toLowerCase().includes("manha") ? "manhã manha" : "",
      t.nome.toLowerCase().includes("tarde") ? "tarde" : "",
    ].filter(Boolean).join(" ");
    return contemTodosOsTermos(alvo, busca);
  });

  const temBusca = busca.trim().length > 0;
  const totalEncontrados = listTurmas.length + listNucleos.length + listAtividades.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">Links de Inscrição Pública</h2>
              <p className="text-xs text-zinc-500">
                Pesquise por nome, turno (ex: manhã), professor ou local para copiar o link.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs & Search */}
        <div className="p-4 border-b border-zinc-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center p-1 bg-zinc-100/80 rounded-xl gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setTab("todos")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === "todos" ? "bg-white text-sky-700 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <span>Todos ({totalEncontrados})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("turmas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === "turmas" ? "bg-white text-sky-700 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Turmas ({listTurmas.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("nucleos")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === "nucleos" ? "bg-white text-sky-700 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Núcleos ({listNucleos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("atividades")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === "atividades" ? "bg-white text-sky-700 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Atividades ({listAtividades.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Ex: manhã felipe, futsal, centro..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 font-medium"
            />
          </div>
        </div>

        {/* Modal List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {totalEncontrados === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Nenhum resultado encontrado para &quot;{busca}&quot;.
            </div>
          ) : (
            <>
              {/* TURMAS SECTION */}
              {(tab === "todos" || tab === "turmas") && listTurmas.length > 0 && (
                <div>
                  {tab === "todos" && (
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-zinc-100 text-xs font-extrabold uppercase tracking-wider text-sky-700">
                      <Users className="h-4 w-4" />
                      <span>Turmas Encontradas ({listTurmas.length})</span>
                    </div>
                  )}
                  <div className="divide-y divide-zinc-100">
                    {listTurmas.map((t) => {
                      const url = `${baseUrl}/inscricao/turma/${t.id}`;
                      const isCopied = copiedId === t.id;
                      const profsText = (t.responsaveisNomes || []).join(", ");
                      return (
                        <div key={t.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-zinc-900">{t.nome}</span>
                              {t.atividade?.nome && (
                                <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold">
                                  {t.atividade.nome}
                                </span>
                              )}
                              {t.nucleo?.identificacao && (
                                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
                                  {t.nucleo.identificacao}
                                </span>
                              )}
                            </div>
                            {profsText && (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                                <User className="h-3 w-3 text-zinc-400 shrink-0" />
                                <span>Prof: <strong className="text-zinc-700">{profsText}</strong></span>
                              </div>
                            )}
                            <span className="text-[11px] font-mono text-zinc-400 block truncate max-w-md mt-0.5">{url}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => copiarParaTransferencia(url, t.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isCopied
                                  ? "bg-green-600 text-white"
                                  : "bg-sky-50 text-sky-700 hover:bg-sky-100"
                              }`}
                            >
                              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{isCopied ? "Copiado!" : "Copiar Link"}</span>
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-zinc-400 hover:text-sky-600 transition-colors"
                              title="Abrir página em nova guia"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NÚCLEOS SECTION */}
              {(tab === "todos" || tab === "nucleos") && listNucleos.length > 0 && (
                <div>
                  {tab === "todos" && (
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-zinc-100 text-xs font-extrabold uppercase tracking-wider text-sky-700">
                      <Building2 className="h-4 w-4" />
                      <span>Núcleos Encontrados ({listNucleos.length})</span>
                    </div>
                  )}
                  <div className="divide-y divide-zinc-100">
                    {listNucleos.map((n) => {
                      const url = `${baseUrl}/inscricao/nucleo/${n.id}`;
                      const isCopied = copiedId === n.id;
                      return (
                        <div key={n.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div>
                            <span className="font-bold text-sm text-zinc-900 block">{n.identificacao}</span>
                            <span className="text-xs text-zinc-500 block">{[n.bairro, n.cidade].filter(Boolean).join(" · ")}</span>
                            <span className="text-[11px] font-mono text-zinc-400 block truncate max-w-md mt-0.5">{url}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => copiarParaTransferencia(url, n.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isCopied
                                  ? "bg-green-600 text-white"
                                  : "bg-sky-50 text-sky-700 hover:bg-sky-100"
                              }`}
                            >
                              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{isCopied ? "Copiado!" : "Copiar Link"}</span>
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-zinc-400 hover:text-sky-600 transition-colors"
                              title="Abrir página em nova guia"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ATIVIDADES SECTION */}
              {(tab === "todos" || tab === "atividades") && listAtividades.length > 0 && (
                <div>
                  {tab === "todos" && (
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-zinc-100 text-xs font-extrabold uppercase tracking-wider text-sky-700">
                      <Activity className="h-4 w-4" />
                      <span>Atividades Encontradas ({listAtividades.length})</span>
                    </div>
                  )}
                  <div className="divide-y divide-zinc-100">
                    {listAtividades.map((a) => {
                      const url = `${baseUrl}/inscricao/atividade/${a.id}`;
                      const isCopied = copiedId === a.id;
                      return (
                        <div key={a.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div>
                            <span className="font-bold text-sm text-zinc-900 block">{a.nome}</span>
                            <span className="text-[11px] font-mono text-zinc-400 block truncate max-w-md mt-0.5">{url}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => copiarParaTransferencia(url, a.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isCopied
                                  ? "bg-green-600 text-white"
                                  : "bg-sky-50 text-sky-700 hover:bg-sky-100"
                              }`}
                            >
                              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{isCopied ? "Copiado!" : "Copiar Link"}</span>
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-zinc-400 hover:text-sky-600 transition-colors"
                              title="Abrir página em nova guia"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
