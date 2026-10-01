"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { dbService, type Pesquisa } from '@/services/pesquisasDb'
import { QRCodeCanvas } from 'qrcode.react'
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  MessageSquare, 
  Info 
} from 'lucide-react'

export default function DistribuirPage() {
  const params = useParams()
  const id = params?.id as string | undefined
  const router = useRouter()
  const qrRef = useRef<HTMLDivElement>(null)

  const [pesquisa, setPesquisa] = useState<Pesquisa | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [whatsMsg, setWhatsMsg] = useState('')
  const [origin, setOrigin] = useState('')

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
      setPesquisa(pesq)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!linkPublico) return
    navigator.clipboard.writeText(linkPublico)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(whatsMsg)
    const url = `https://api.whatsapp.com/send?text=${encodedText}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto text-zinc-900 dark:text-zinc-100">
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
            Opções de compartilhamento, link direto e QR Code para resposta pública.
          </p>
        </div>
      </div>

      {!pesquisa?.publicada && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-300 flex gap-3">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">A pesquisa está salva como Rascunho</p>
            <p className="opacity-90 mt-1 leading-relaxed">
              O link público só funcionará corretamente após você ativar o status "Publicada" na listagem de pesquisas.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Lado Esquerdo: Link e WhatsApp */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Link de Acesso Direto
            </h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={linkPublico}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:outline-hidden"
              />
              <button
                onClick={handleCopy}
                className={`px-4 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                  copied 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                }`}
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed">
              O link é responsivo e otimizado para celulares e computadores.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              Compartilhar no WhatsApp
            </h3>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Mensagem Padrão
              </label>
              <textarea
                value={whatsMsg}
                onChange={(e) => setWhatsMsg(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleShareWhatsApp}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-xs shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              Enviar pelo WhatsApp
            </button>
          </div>
        </div>

        {/* Lado Direito: QR Code */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col items-center justify-center text-center space-y-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Acesso por QR Code
          </h3>

          <div 
            ref={qrRef}
            className="p-6 bg-white rounded-3xl border border-zinc-200 shadow-md relative"
          >
            {linkPublico && (
              <QRCodeCanvas
                value={linkPublico}
                size={200}
                level="H"
                includeMargin={false}
              />
            )}
          </div>

          <div className="space-y-4 max-w-xs">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Ideal para impressão em cartazes de campo, eventos ou materiais de divulgação.
            </p>
            
            <button
              onClick={downloadQRCode}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 text-xs font-bold py-2.5 transition-all cursor-pointer shadow-xs"
            >
              <Download className="h-4 w-4" />
              Baixar Imagem PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
