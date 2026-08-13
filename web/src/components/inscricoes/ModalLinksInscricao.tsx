"use client";

import { useState } from "react";
import { X, Copy, Check, ExternalLink, Search, Link2, Building2, Activity, Users, User, FilterX } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import type { NucleoApi, AtividadeApi, TurmaApi, OrganizacaoApi, ObjetoApi } from "@/lib/api/services";

interface ModalLinksInscricaoProps {
  open: boolean;
  onClose: () => void;
  nucleos: NucleoApi[];
  atividades: AtividadeApi[];
  turmas: TurmaApi[];
  organizacoes?: OrganizacaoApi[];
  objetos?: ObjetoApi[];
}

export function ModalLinksInscricao({
  open,
  onClose,
  nucleos = [],
  atividades = [],
  turmas = [],
  organizacoes = [],
  objetos = [],
}: ModalLinksInscricaoProps) {
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtros dinâmicos por entidade
  const [selectedObjetoId, setSelectedObjetoId] = useState("");
  const [selectedOrganizacaoId, setSelectedOrganizacaoId] = useState("");
  const [selectedNucleoId, setSelectedNucleoId] = useState("");
  const [selectedAtividadeId, setSelectedAtividadeId] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState("");

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

  function limparFiltros() {
    setSelectedObjetoId("");
    setSelectedOrganizacaoId("");
    setSelectedNucleoId("");
    setSelectedAtividadeId("");
    setSelectedTurmaId("");
    setBusca("");
  }

  const temFiltroAtivo = selectedObjetoId || selectedOrganizacaoId || selectedNucleoId || selectedAtividadeId || selectedTurmaId || busca;

  // Mapa rápido de organizações e objetos por ID
  const orgMap = new Map(organizacoes.map((o) => [o.id, o]));
  const objMap = new Map(objetos.map((ob) => [ob.id, ob]));

  // Filtragem de Turmas
  const listTurmas = turmas.filter((t) => {
    if (selectedTurmaId && t.id !== selectedTurmaId) return false;
    if (selectedAtividadeId && t.atividadeId !== selectedAtividadeId && t.atividade?.id !== selectedAtividadeId) return false;
    if (selectedNucleoId && t.nucleoId !== selectedNucleoId && t.nucleo?.id !== selectedNucleoId) return false;

    const orgId = t.nucleo?.organizacaoId;
    if (selectedOrganizacaoId && orgId !== selectedOrganizacaoId) return false;

    const org = orgId ? orgMap.get(orgId) : undefined;
    if (selectedObjetoId && org?.objetoId !== selectedObjetoId) return false;

    const obj = org?.objetoId ? objMap.get(org.objetoId) : undefined;

    const turnosSlot = (t.slots || []).map((s: any) => `${s.dia || ''} ${s.inicio || ''}h ${s.fim || ''}h ${s.inicio < 12 ? 'manhã manha' : 'tarde'}`).join(" ");
    const profs = (t.responsaveisNomes || []).join(" ");

    const alvo = [
      t.nome,
      t.atividade?.nome,
      t.atividade?.descricao,
      t.nucleo?.identificacao,
      t.nucleo?.nomeLocal,
      t.nucleo?.cidade,
      t.nucleo?.bairro,
      t.nucleo?.endereco,
      t.nucleo?.nomeResponsavel,
      profs,
      turnosSlot,
      org?.nome,
      org?.cnpj,
      org?.cidade,
      org?.endereco,
      obj?.nome,
      obj?.descricao,
    ].filter(Boolean).join(" ");

    return contemTodosOsTermos(alvo, busca);
  });

  // Filtragem de Núcleos
  const listNucleos = nucleos.filter((n) => {
    if (selectedNucleoId && n.id !== selectedNucleoId) return false;
    if (selectedOrganizacaoId && n.organizacaoId !== selectedOrganizacaoId) return false;

    const org = n.organizacaoId ? orgMap.get(n.organizacaoId) : undefined;
    if (selectedObjetoId && org?.objetoId !== selectedObjetoId) return false;

    const obj = org?.objetoId ? objMap.get(org.objetoId) : undefined;

    const alvo = [
      n.identificacao,
      n.nomeLocal,
      n.endereco,
      n.bairro,
      n.cidade,
      n.regiao,
      n.nomeResponsavel,
      org?.nome,
      org?.cnpj,
      org?.cidade,
      org?.endereco,
      obj?.nome,
      obj?.descricao,
    ].filter(Boolean).join(" ");

    return contemTodosOsTermos(alvo, busca);
  });

  // Filtragem de Atividades
  const listAtividades = atividades.filter((a) => {
    if (selectedAtividadeId && a.id !== selectedAtividadeId) return false;
    if (selectedNucleoId && a.nucleoId !== selectedNucleoId) return false;

    const alvo = [
      a.nome,
      a.descricao,
      ...(a.turnos || []),
    ].filter(Boolean).join(" ");

    return contemTodosOsTermos(alvo, busca);
  });

  const totalEncontrados = listTurmas.length + listNucleos.length + listAtividades.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">Links de Inscrição Pública</h2>
              <p className="text-xs text-zinc-500">
                Filtre por objeto, organização, núcleo, atividade ou turma para obter os links públicos.
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

        {/* Modal Filters Section */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col gap-3">
          
          {/* Linha de Seletor de Entidades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            
            {/* Objeto */}
            {objetos.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Objeto</label>
                <select
                  value={selectedObjetoId}
                  onChange={(e) => setSelectedObjetoId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="">Todos os Objetos</option>
                  {objetos.map((ob) => (
                    <option key={ob.id} value={ob.id}>{ob.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Organização */}
            {organizacoes.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Organização</label>
                <select
                  value={selectedOrganizacaoId}
                  onChange={(e) => setSelectedOrganizacaoId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="">Todas as Organizações</option>
                  {organizacoes.map((org) => (
                    <option key={org.id} value={org.id}>{org.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Núcleo */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Núcleo</label>
              <select
                value={selectedNucleoId}
                onChange={(e) => setSelectedNucleoId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Todos os Núcleos</option>
                {nucleos.map((n) => (
                  <option key={n.id} value={n.id}>{n.identificacao}</option>
                ))}
              </select>
            </div>

            {/* Atividade */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Atividade</label>
              <select
                value={selectedAtividadeId}
                onChange={(e) => setSelectedAtividadeId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Todas as Atividades</option>
                {atividades.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>

            {/* Turma */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Turma</label>
              <select
                value={selectedTurmaId}
                onChange={(e) => setSelectedTurmaId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">Todas as Turmas</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Busca por Texto e Limpeza */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Busca por nome, professor, bairro, horários..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 font-medium"
              />
            </div>

            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-300 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors shrink-0 cursor-pointer"
              >
                <FilterX className="h-3.5 w-3.5 text-zinc-500" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30">
          {totalEncontrados === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Nenhum link de inscrição encontrado para os filtros aplicados.
            </div>
          ) : (
            <>
              {/* TURMAS SECTION */}
              {listTurmas.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 text-xs font-extrabold uppercase tracking-wider text-sky-700">
                    <Users className="h-4 w-4" />
                    <span>Turmas ({listTurmas.length})</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {listTurmas.map((t) => {
                      const url = `${baseUrl}/inscricao/turma/${t.id}`;
                      const isCopied = copiedId === t.id;
                      const profsText = (t.responsaveisNomes || []).join(", ");
                      const orgId = t.nucleo?.organizacaoId;
                      const org = orgId ? orgMap.get(orgId) : undefined;
                      const obj = org?.objetoId ? objMap.get(org.objetoId) : undefined;

                      return (
                        <div key={t.id} className="p-4 rounded-xl border border-zinc-200/90 bg-white hover:border-sky-300 hover:shadow-xs transition-all flex flex-col gap-3">
                          {/* Top Row: Title & Action Buttons */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1">
                              <h4 className="font-extrabold text-sm text-zinc-900 leading-snug">{t.nome}</h4>
                              {profsText && (
                                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                  <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                  <span>Professor: <strong className="text-zinc-800 font-semibold">{profsText}</strong></span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => copiarParaTransferencia(url, t.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isCopied
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                                }`}
                              >
                                {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{isCopied ? "Copiado!" : "Copiar Link"}</span>
                              </button>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-zinc-400 hover:text-sky-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                title="Abrir página em nova guia"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>

                          {/* Middle Row: Hierarchical Badges */}
                          <div className="flex items-center gap-2 flex-wrap text-[11px]">
                            {t.atividade?.nome && (
                              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 px-2.5 py-1 rounded-md font-semibold border border-sky-200">
                                ⚽ {t.atividade.nome}
                              </span>
                            )}
                            {t.nucleo?.identificacao && (
                              <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md font-medium border border-zinc-200">
                                📍 {t.nucleo.identificacao}
                              </span>
                            )}
                            {org?.nome && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-medium border border-emerald-200">
                                🏛️ {org.nome}
                              </span>
                            )}
                            {obj?.nome && (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-2.5 py-1 rounded-md font-medium border border-purple-200">
                                📄 {obj.nome}
                              </span>
                            )}
                          </div>

                          {/* Bottom Row: Link Box */}
                          <div className="flex items-center rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-1.5">
                            <span className="text-xs font-mono text-zinc-500 truncate">{url}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NÚCLEOS SECTION */}
              {listNucleos.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 text-xs font-extrabold uppercase tracking-wider text-sky-700">
                    <Building2 className="h-4 w-4" />
                    <span>Núcleos ({listNucleos.length})</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {listNucleos.map((n) => {
                      const url = `${baseUrl}/inscricao/nucleo/${n.id}`;
                      const isCopied = copiedId === n.id;
                      const org = n.organizacaoId ? orgMap.get(n.organizacaoId) : undefined;
                      const obj = org?.objetoId ? objMap.get(org.objetoId) : undefined;

                      return (
                        <div key={n.id} className="p-4 rounded-xl border border-zinc-200/90 bg-white hover:border-sky-300 hover:shadow-xs transition-all flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1">
                              <h4 className="font-extrabold text-sm text-zinc-900 leading-snug">{n.identificacao}</h4>
                              <span className="text-xs text-zinc-500">{[n.bairro, n.cidade].filter(Boolean).join(" · ")}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => copiarParaTransferencia(url, n.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isCopied
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                                }`}
                              >
                                {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{isCopied ? "Copiado!" : "Copiar Link"}</span>
                              </button>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-zinc-400 hover:text-sky-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                title="Abrir página em nova guia"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-[11px]">
                            {org?.nome && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-medium border border-emerald-200">
                                🏛️ {org.nome}
                              </span>
                            )}
                            {obj?.nome && (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-2.5 py-1 rounded-md font-medium border border-purple-200">
                                📄 {obj.nome}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-1.5">
                            <span className="text-xs font-mono text-zinc-500 truncate">{url}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ATIVIDADES SECTION */}
              {listAtividades.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 text-xs font-extrabold uppercase tracking-wider text-sky-700">
                    <Activity className="h-4 w-4" />
                    <span>Atividades ({listAtividades.length})</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {listAtividades.map((a) => {
                      const url = `${baseUrl}/inscricao/atividade/${a.id}`;
                      const isCopied = copiedId === a.id;
                      return (
                        <div key={a.id} className="p-4 rounded-xl border border-zinc-200/90 bg-white hover:border-sky-300 hover:shadow-xs transition-all flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-extrabold text-sm text-zinc-900 leading-snug">{a.nome}</h4>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => copiarParaTransferencia(url, a.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isCopied
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                                }`}
                              >
                                {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{isCopied ? "Copiado!" : "Copiar Link"}</span>
                              </button>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-zinc-400 hover:text-sky-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                title="Abrir página em nova guia"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-1.5">
                            <span className="text-xs font-mono text-zinc-500 truncate">{url}</span>
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
