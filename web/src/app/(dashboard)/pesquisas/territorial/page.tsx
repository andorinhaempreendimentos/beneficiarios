"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { dbService, type Pergunta, type Pesquisa } from '@/services/pesquisasDb'
import { useAuth } from '@/components/providers/AuthProvider'
import { MapaBrasil } from '@/components/pesquisas/MapaBrasil'
import { Map, RefreshCw, Loader2, ArrowLeft } from 'lucide-react'

export default function TerritorialPage() {
  const { user } = useAuth()
  const isCoordenador = Boolean((user as any)?.isCoordenador)
  const coordId = user?.entidadeId || user?.refId || ''

  const [todasPesquisas, setTodasPesquisas] = useState<Pesquisa[]>([])
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [respostasBrutas, setRespostasBrutas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRespostas, setLoadingRespostas] = useState(false)
  const [escopoMapa, setEscopoMapa] = useState<'brasil' | string>('brasil')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const promises: any[] = [dbService.getPesquisas()]
        if (isCoordenador && coordId) {
          promises.push(dbService.getNucleosCoordenador(coordId))
        }

        const [pesqs, meusNucleosData] = await Promise.all(promises)
        const autorizadosIds: string[] = meusNucleosData || []

        const pesqsFiltradas = isCoordenador ? pesqs.filter((p: any) => {
          const temNucleoAutorizado = p.nucleo_id ? autorizadosIds.includes(p.nucleo_id) : false
          const souResponsavel = coordId ? (p.coordenador_id === coordId || p.lider_id === coordId) : false
          return temNucleoAutorizado || souResponsavel
        }) : pesqs

        setTodasPesquisas(pesqsFiltradas)

        const todasPergs: Pergunta[] = []
        await Promise.all(
          pesqsFiltradas.map(async (p: any) => {
            const pergs = await dbService.getPerguntas(p.id)
            todasPergs.push(...pergs)
          })
        )
        setPerguntas(todasPergs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [isCoordenador, coordId])

  const carregarRespostas = async () => {
    const ids = todasPesquisas.map(p => p.id)
    if (ids.length === 0) return
    setLoadingRespostas(true)
    try {
      const { respostas } = await dbService.getRelatoriosGlobais(ids)
      setRespostasBrutas(respostas)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRespostas(false)
    }
  }

  useEffect(() => {
    if (!loading && todasPesquisas.length > 0) carregarRespostas()
  }, [loading, todasPesquisas.length])

  const resumo = useMemo(() => {
    if (escopoMapa === 'brasil') {
      const perguntasEstado = perguntas.filter(p => p.tipo === 'estado')
      if (perguntasEstado.length === 0) return []

      const map: Record<string, number> = {}
      respostasBrutas.forEach(resp => {
        perguntasEstado.forEach(p => {
          const val = resp.valores?.[p.id]
          if (val) {
            const estadoNome = String(val).trim()
            map[estadoNome] = (map[estadoNome] || 0) + 1
          }
        })
      })

      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    } else {
      const perguntasCidade = perguntas.filter(p => p.tipo === 'cidade')
      const perguntasEstado = perguntas.filter(p => p.tipo === 'estado')
      if (perguntasCidade.length === 0) return []

      const map: Record<string, number> = {}
      respostasBrutas.forEach(resp => {
        let pertenceAoEstado = true
        if (perguntasEstado.length > 0) {
          pertenceAoEstado = perguntasEstado.some(p => {
            const valUF = resp.valores?.[p.id]
            if (!valUF) return false
            const sigla = valUF.trim().toUpperCase()
            return sigla === escopoMapa || (sigla.length > 2 && sigla.toLowerCase().includes(escopoMapa.toLowerCase()))
          })
        }

        if (pertenceAoEstado) {
          perguntasCidade.forEach(p => {
            const val = resp.valores?.[p.id]
            if (val) {
              const cidadeNome = String(val).trim()
              map[cidadeNome] = (map[cidadeNome] || 0) + 1
            }
          })
        }
      })

      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    }
  }, [respostasBrutas, perguntas, escopoMapa])

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/pesquisas"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Distribuição Territorial</h1>
            <p className="text-sm text-zinc-500">
              Visualize onde estão concentradas as respostas das pesquisas
            </p>
          </div>
        </div>
        <button
          onClick={carregarRespostas}
          disabled={loadingRespostas}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {loadingRespostas
            ? <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
            : <RefreshCw className="h-4 w-4 text-zinc-500" />}
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Mapa */}
          <div className="xl:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <MapaBrasil
              respostas={respostasBrutas}
              perguntas={perguntas}
              titulo="Respostas por Estado"
              onEscopoChange={setEscopoMapa}
            />
          </div>

          {/* Ranking lateral */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="text-base font-semibold">
              {escopoMapa === 'brasil' ? 'Top Estados' : `Top Cidades (${escopoMapa})`}
            </h3>
            {resumo.length === 0 ? (
              <p className="text-sm text-zinc-400">Sem dados territoriais para exibir.</p>
            ) : (
              <div className="space-y-3">
                {resumo.map(([estado, total], i) => {
                  const pct = Math.round((total / (resumo[0][1] || 1)) * 100)
                  return (
                    <div key={estado} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-400 w-5">
                            {i + 1}
                          </span>
                          <span className="font-medium">{estado}</span>
                        </div>
                        <span className="text-zinc-500 text-xs font-semibold">{total}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3 text-center border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xl font-bold">{respostasBrutas.length}</p>
                  <p className="text-xs text-zinc-500">Total respostas</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3 text-center border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xl font-bold">{resumo.length}</p>
                  <p className="text-xs text-zinc-500">Locais com dados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
