"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { dbService, encodeMatricula, type Pesquisa } from '@/services/pesquisasDb'
import { useAuth } from '@/components/providers/AuthProvider'
import { QRCodeCanvas } from 'qrcode.react'
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  MessageSquare, 
  Info,
  Users,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface AlunoItem {
  id: string
  matricula: string
  nomeCompleto: string
  celular?: string
  celularResponsavel?: string
  status: 'respondido' | 'pendente'
  respondidoEm?: string
}

export default function DistribuirPage() {
  const params = useParams()
  const id = params?.id as string | undefined
  const router = useRouter()
  const qrRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()
  const isCoordenador = Boolean((user as any)?.isCoordenador)
  const coordId = user?.entidadeId || user?.refId || ''

  const [pesquisa, setPesquisa] = useState<Pesquisa | null>(null)
  const [alunos, setAlunos] = useState<AlunoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAlunos, setLoadingAlunos] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [whatsMsg, setWhatsMsg] = useState('')
  const [origin, setOrigin] = useState('')

  // Filtros de alunos
  const [buscaAluno, setBuscaAluno] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'respondido'>('todos')
  const [mostrarLinkGeral, setMostrarLinkGeral] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const linkPublico = pesquisa && origin 
    ? `${origin}/r/${pesquisa.token}`
    : ''

  useEffect(() => {
    if (id) {
      loadPesquisa(id)
    }
  }, [id])

  useEffect(() => {
    if (pesquisa && linkPublico) {
      setWhatsMsg(
        `Olá! Gostaria de convidar você para responder a nossa pesquisa rápida: "${pesquisa.titulo}".\n\nLeva apenas 2 minutos! Acesse o link abaixo:\n${linkPublico}`
      )
    }
  }, [pesquisa, linkPublico])

  const loadPesquisa = async (pesquisaId: string) => {
    setLoading(true)
    try {
      const pesq = await dbService.getPesquisaById(pesquisaId)
      if (!pesq) {
        router.push('/pesquisas')
        return
      }

      if (isCoordenador && coordId) {
        const meusNucleos = await dbService.getNucleosCoordenador(coordId)
        const temNucleoAutorizado = pesq.nucleo_id ? meusNucleos.includes(pesq.nucleo_id) : false
        const souResponsavel = pesq.coordenador_id === coordId || pesq.lider_id === coordId
        if (!temNucleoAutorizado && !souResponsavel) {
          router.push('/pesquisas')
          return
        }
      }

      setPesquisa(pesq)

      if (pesq.turma_id || pesq.nucleo_id) {
        setLoadingAlunos(true)
        const alunosData = await dbService.getAlunosTurmaComStatus(pesq.turma_id, pesq.id, pesq.nucleo_id)
        setAlunos(alunosData)
        setLoadingAlunos(false)
      } else {
        setMostrarLinkGeral(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream')

    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = `qrcode_${pesquisa?.token || 'pesquisa'}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const handleShareWhatsApp = (msg: string, fone?: string) => {
    const encodedText = encodeURIComponent(msg)
    const numeroLimpo = fone ? fone.replace(/\D/g, '') : ''
    const url = numeroLimpo 
      ? `https://api.whatsapp.com/send?phone=55${numeroLimpo}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`
    window.open(url, '_blank')
  }

  const alunosFiltrados = useMemo(() => {
    return alunos.filter(a => {
      const matchBusca = 
        a.nomeCompleto.toLowerCase().includes(buscaAluno.toLowerCase()) ||
        a.matricula.toLowerCase().includes(buscaAluno.toLowerCase())
      
      const matchStatus = 
        filtroStatus === 'todos' || a.status === filtroStatus

      return matchBusca && matchStatus
    })
  }, [alunos, buscaAluno, filtroStatus])

  const totalAlunos = alunos.length
  const respondidosCount = alunos.filter(a => a.status === 'respondido').length
  const pendentesCount = totalAlunos - respondidosCount
  const pctRespondido = totalAlunos > 0 ? Math.round((respondidosCount / totalAlunos) * 100) : 0

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/pesquisas"
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distribuição da Pesquisa</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
            {pesquisa?.titulo}
          </p>
        </div>
      </div>

      {!pesquisa?.publicada && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-300 flex gap-3">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">A pesquisa está salva como Rascunho</p>
            <p className="opacity-90 mt-1 leading-relaxed">
              Os links só funcionarão após você ativar o status "Publicada" na listagem de pesquisas.
            </p>
          </div>
        </div>
      )}

      {/* Seção de Alunos Vinculados (se houver turma ou núcleo) */}
      {(pesquisa?.turma_id || pesquisa?.nucleo_id) && (
        <div className="space-y-4">
          {/* Métricas de Participação */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">
                <Users className="h-4 w-4" /> Total Alunos
              </div>
              <div className="text-2xl font-black mt-2 text-zinc-900 dark:text-zinc-100">
                {totalAlunos}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase">
                <CheckCircle2 className="h-4 w-4" /> Respondidos
              </div>
              <div className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
                {respondidosCount}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase">
                <Clock className="h-4 w-4" /> Pendentes
              </div>
              <div className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">
                {pendentesCount}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">
                <span>Adesão</span>
                <span className="font-bold text-sky-600">{pctRespondido}%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 mt-3 overflow-hidden">
                <div 
                  className="bg-sky-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${pctRespondido}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tabela de Alunos com Links Nominais */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-100 dark:divide-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Links Individuais por Aluno
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Cada aluno possui um link exclusivo vinculado à sua matrícula.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Filtrar aluno ou matrícula..."
                    value={buscaAluno}
                    onChange={(e) => setBuscaAluno(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-950 text-xs">
                  <button
                    onClick={() => setFiltroStatus('todos')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filtroStatus === 'todos' ? 'bg-white dark:bg-zinc-800 shadow-xs text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    Todos ({totalAlunos})
                  </button>
                  <button
                    onClick={() => setFiltroStatus('pendente')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filtroStatus === 'pendente' ? 'bg-white dark:bg-zinc-800 shadow-xs text-amber-600 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    Pendentes ({pendentesCount})
                  </button>
                  <button
                    onClick={() => setFiltroStatus('respondido')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filtroStatus === 'respondido' ? 'bg-white dark:bg-zinc-800 shadow-xs text-emerald-600 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    Respondidos ({respondidosCount})
                  </button>
                </div>
              </div>
            </div>

            {loadingAlunos ? (
              <div className="flex h-36 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"></div>
              </div>
            ) : alunosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Nenhum aluno encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      <th className="p-3 pl-5">Aluno / Matrícula</th>
                      <th className="p-3">Contato</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {alunosFiltrados.map((aluno) => {
                      const linkAluno = `${origin}/r/${pesquisa.token}?m=${encodeMatricula(aluno.matricula)}`
                      const fone = aluno.celular || aluno.celularResponsavel
                      const primeiroNome = (aluno.nomeCompleto || '').trim().split(/\s+/)[0]
                      const msgAluno = `Olá, ${primeiroNome}! Gostaria de convidar você para responder a pesquisa: "${pesquisa.titulo}".\n\nAcesse seu link exclusivo:\n${linkAluno}`
                      const isCopied = copiedKey === aluno.id

                      return (
                        <tr key={aluno.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3 pl-5">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {aluno.nomeCompleto}
                            </p>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Matrícula: {aluno.matricula}
                            </span>
                          </td>

                          <td className="p-3 text-zinc-600 dark:text-zinc-300">
                            {fone ? (
                              <span className="font-mono text-[11px]">
                                {fone}
                                {aluno.celularResponsavel && !aluno.celular && (
                                  <span className="text-[10px] text-zinc-400 ml-1">(Resp.)</span>
                                )}
                              </span>
                            ) : (
                              <span className="italic text-zinc-400 text-[11px]">Sem telefone</span>
                            )}
                          </td>

                          <td className="p-3">
                            {aluno.status === 'respondido' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Respondido {aluno.respondidoEm ? `(${new Date(aluno.respondidoEm).toLocaleDateString('pt-BR')})` : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                                <Clock className="h-3 w-3" />
                                Pendente
                              </span>
                            )}
                          </td>

                          <td className="p-3 pr-5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleCopy(linkAluno, aluno.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                                isCopied
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                              }`}
                              title="Copiar link individual"
                            >
                              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{isCopied ? 'Copiado' : 'Copiar Link'}</span>
                            </button>

                            <button
                              onClick={() => handleShareWhatsApp(msgAluno, fone)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              title="Disparar link via WhatsApp"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Geral & QR Code (Acordeom ou Bloco Fixo se não houver turma) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        {(pesquisa?.turma_id || pesquisa?.nucleo_id) && (
          <button
            onClick={() => setMostrarLinkGeral(!mostrarLinkGeral)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-sky-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Link Geral da Pesquisa e QR Code
              </span>
            </div>
            {mostrarLinkGeral ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
          </button>
        )}

        {(mostrarLinkGeral || (!pesquisa?.turma_id && !pesquisa?.nucleo_id)) && (
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lado Esquerdo: Link e WhatsApp */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Link de Acesso Direto
                </h3>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={linkPublico}
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-xs font-mono focus:outline-hidden"
                  />
                  <button
                    onClick={() => handleCopy(linkPublico, 'geral')}
                    className={`px-4 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                      copiedKey === 'geral' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    {copiedKey === 'geral' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Link universal responsivo, otimizado para celulares e computadores.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                  Compartilhar Mensagem Padrão
                </h3>

                <textarea
                  value={whatsMsg}
                  onChange={(e) => setWhatsMsg(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-xs focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 resize-none leading-relaxed"
                />

                <button
                  onClick={() => handleShareWhatsApp(whatsMsg)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 text-xs shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  Enviar pelo WhatsApp
                </button>
              </div>
            </div>

            {/* Lado Direito: QR Code */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Acesso por QR Code
              </h3>

              <div 
                ref={qrRef}
                className="p-5 bg-white rounded-3xl border border-zinc-200 shadow-md relative"
              >
                {linkPublico && (
                  <QRCodeCanvas
                    value={linkPublico}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                )}
              </div>

              <div className="space-y-3 max-w-xs">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Ideal para impressão em cartazes no núcleo ou materiais de campo.
                </p>
                
                <button
                  onClick={downloadQRCode}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 text-xs font-bold py-2 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar Imagem PNG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
