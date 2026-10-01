"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { dbService, type Pesquisa, type Pergunta } from '@/services/pesquisasDb'
import * as XLSX from 'xlsx'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Users, 
  ClipboardCheck, 
  Clock, 
  Sparkles,
  BarChart2,
  Filter,
  X
} from 'lucide-react'

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1']

export default function RelatoriosPesquisaPage() {
  const params = useParams()
  const id = params?.id as string | undefined
  const router = useRouter()

  const [pesquisa, setPesquisa] = useState<Pesquisa | null>(null)
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [relatorioData, setRelatorioData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Filtro de Tags Dinâmico
  const [tagsFiltro, setTagsFiltro] = useState<string[]>([])
  const [logicaFiltro, setLogicaFiltro] = useState<'AND' | 'OR'>('AND')

  // Autocomplete UI
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [mostrarGraficos, setMostrarGraficos] = useState(false)

  useEffect(() => {
    if (id) {
      loadData(id)
    }
  }, [id])

  const loadData = async (pesquisaId: string) => {
    setLoading(true)
    try {
      const pesq = await dbService.getPesquisaById(pesquisaId)
      if (!pesq) {
        router.push('/pesquisas')
        return
      }
      setPesquisa(pesq)

      const allFluxos = await dbService.getFluxos()
      
      const getRecursiveFluxoIds = (initialIds: string[]): string[] => {
        const visited = new Set<string>()
        const queue = [...initialIds]

        while (queue.length > 0) {
          const currentId = queue.shift()
          if (!currentId || visited.has(currentId)) continue
          visited.add(currentId)

          const fluxo = allFluxos.find(f => f.id === currentId)
          if (fluxo && fluxo.flow_data && Array.isArray(fluxo.flow_data.nodes)) {
            fluxo.flow_data.nodes.forEach((node: any) => {
              if ((node.type === 'subflow' || node.type === 'block') && node.data?.subflowId) {
                const subId = node.data.subflowId
                if (!visited.has(subId)) {
                  queue.push(subId)
                }
              }
            })
          }
        }

        return Array.from(visited)
      }

      const mainFluxoIds = pesq.fluxo_id ? [pesq.fluxo_id] : []
      const fluxoIds = getRecursiveFluxoIds(mainFluxoIds)

      const pergs = fluxoIds.length > 0 ? await dbService.getPerguntasByFluxos(fluxoIds) : []
      setPerguntas(pergs)

      const data = await dbService.getRelatorios(pesquisaId)
      setRelatorioData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const sugestoesDisponiveis = useMemo(() => {
    const termos = new Set<string>()
    const respostas = relatorioData?.respostas || []

    perguntas.forEach(p => {
      if (p.tipo === 'multipla' && p.config?.opcoes) {
        p.config.opcoes.forEach(o => {
          if (o.texto?.trim()) {
            termos.add(`${p.titulo}: ${o.texto.trim()}`)
          }
        })
      }
    })

    respostas.forEach((r: any) => {
      perguntas.forEach(p => {
        const val = r.valores[p.id]
        if (!val) return
        if (p.tipo === 'multipla') {
          const opcoes = p.config?.opcoes || []
          const arr = Array.isArray(val) ? val : [val]
          arr.forEach((v: string) => {
            const texto = opcoes.find(o => o.id === v)?.texto || v
            if (typeof texto === 'string' && texto.trim()) {
              termos.add(`${p.titulo}: ${texto.trim()}`)
            }
          })
        } else if (typeof val === 'string' && val.trim()) {
          termos.add(`${p.titulo}: ${val.trim()}`)
        }
      })
    })

    return Array.from(termos).sort((a, b) => a.localeCompare(b))
  }, [perguntas, relatorioData])

  const resultadoFiltrado = useMemo(() => {
    const respostas = relatorioData?.respostas || []
    let filtradas = respostas

    if (tagsFiltro.length > 0) {
      filtradas = filtradas.filter((resp: any) => {
        const valoresAmigaveis = new Set<string>()
        perguntas.forEach(p => {
          const val = resp.valores[p.id]
          if (!val) return
          if (p.tipo === 'multipla') {
            const opcoes = p.config?.opcoes || []
            const arr = Array.isArray(val) ? val : [val]
            arr.forEach((v: string) => {
              const texto = opcoes.find(o => o.id === v)?.texto || v
              if (typeof texto === 'string') {
                valoresAmigaveis.add(texto.trim().toLowerCase())
                valoresAmigaveis.add(`${p.titulo.trim().toLowerCase()}: ${texto.trim().toLowerCase()}`)
              }
            })
          } else if (typeof val === 'string') {
            valoresAmigaveis.add(val.trim().toLowerCase())
            valoresAmigaveis.add(`${p.titulo.trim().toLowerCase()}: ${val.trim().toLowerCase()}`)
          }
        })

        if (logicaFiltro === 'AND') {
          return tagsFiltro.every(tag => valoresAmigaveis.has(tag.trim().toLowerCase()))
        } else {
          return tagsFiltro.some(tag => valoresAmigaveis.has(tag.trim().toLowerCase()))
        }
      })
    }

    return filtradas
  }, [relatorioData, tagsFiltro, logicaFiltro, perguntas])

  const valueToArr = (val: any): string[] => {
    if (!val) return []
    return Array.isArray(val) ? val : [val]
  }

  const getGraficoDados = (pergunta: Pergunta) => {
    if (pergunta.tipo !== 'multipla' || !relatorioData) return []
    const opcoes = pergunta.config?.opcoes || []
    
    const contagem: Record<string, { nome: string; quantidade: number }> = {}
    opcoes.forEach(o => {
      contagem[o.id] = { nome: o.texto, quantidade: 0 }
    })

    resultadoFiltrado.forEach((resp: any) => {
      const valor = resp.valores[pergunta.id]
      if (Array.isArray(valueToArr(valor))) {
        valueToArr(valor).forEach((opcaoId: string) => {
          if (contagem[opcaoId]) {
            contagem[opcaoId].quantidade += 1
          }
        })
      }
    })

    return Object.values(contagem)
  }

  const handleExportExcel = () => {
    if (!relatorioData || !pesquisa) return

    const rows = resultadoFiltrado.map((r: any) => {
      const rowData: Record<string, any> = {
        'ID da Resposta': r.id,
        'Data/Hora da Resposta': new Date(r.created_at).toLocaleString('pt-BR'),
      }

      perguntas.forEach(p => {
        const val = r.valores[p.id]
        if (val === undefined) {
          rowData[p.titulo] = '-'
        } else if (p.tipo === 'multipla') {
          const opcoes = p.config?.opcoes || []
          const selecionadas = Array.isArray(val) ? val : [val]
          const textos = selecionadas.map(id => opcoes.find(o => o.id === id)?.texto || id)
          rowData[p.titulo] = textos.join(', ')
        } else {
          rowData[p.titulo] = val
        }
      })

      return rowData
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Respostas')
    XLSX.writeFile(workbook, `respostas_${pesquisa.token}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
      </div>
    )
  }

  const totalRespostas = relatorioData?.totalRespostas || 0
  const perguntasMultipla = perguntas.filter(p => p.tipo === 'multipla')

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/pesquisas"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Métricas & Relatórios</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">{pesquisa?.titulo}</p>
          </div>
        </div>

        {totalRespostas > 0 && (
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer self-start sm:self-auto"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel (.xlsx)
          </button>
        )}
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total de Respostas</p>
            <p className="text-3xl font-extrabold">
              {tagsFiltro.length > 0 ? `${resultadoFiltrado.length} / ${totalRespostas}` : totalRespostas}
            </p>
          </div>
          <div className="rounded-xl p-3 bg-sky-500/10 text-sky-600 border border-sky-500/20">
            <ClipboardCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Status da Pesquisa</p>
            <p className="text-lg font-bold mt-1">
              {pesquisa?.publicada ? (
                <span className="text-emerald-600">Ativa e Pública</span>
              ) : (
                <span className="text-zinc-400">Rascunho / Inativa</span>
              )}
            </p>
          </div>
          <div className="rounded-xl p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Tempo Médio</p>
            <p className="text-lg font-bold mt-1">
              {totalRespostas > 0 ? (
                <span className="text-sky-600 font-semibold">~2 min / média</span>
              ) : (
                <span className="text-zinc-400">Sem histórico</span>
              )}
            </p>
          </div>
          <div className="rounded-xl p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {totalRespostas === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <BarChart2 className="h-12 w-12 mx-auto text-zinc-400 mb-4 opacity-50" />
          <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-lg">Sem dados de resposta</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">
            Esta pesquisa ainda não possui respostas registradas no banco de dados. Compartilhe o link para começar a gerar métricas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Autocomplete de Tags */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-sky-600" />
                <h3 className="font-bold text-sm">Filtro por Tags / Termos</h3>
              </div>
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 self-start sm:self-auto">
                <span className="text-[10px] font-bold text-zinc-500 uppercase px-2">Lógica:</span>
                <button
                  type="button"
                  onClick={() => setLogicaFiltro('AND')}
                  className={`text-xs font-bold px-2 py-1 rounded transition-colors ${logicaFiltro === 'AND' ? 'bg-sky-600 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  E (AND)
                </button>
                <button
                  type="button"
                  onClick={() => setLogicaFiltro('OR')}
                  className={`text-xs font-bold px-2 py-1 rounded transition-colors ${logicaFiltro === 'OR' ? 'bg-sky-600 text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                >
                  OU (OR)
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="w-full flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 min-h-[46px]">
                {tagsFiltro.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-600 border border-sky-500/20 text-xs font-bold pl-2.5 pr-1.5 py-1 rounded-lg"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTagsFiltro(prev => prev.filter(t => t !== tag))}
                      className="hover:bg-sky-500/20 rounded-md p-0.5 text-sky-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value)
                    setShowSuggestions(true)
                    setFocusedIndex(-1)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                  onKeyDown={e => {
                    const filteredSugs = sugestoesDisponiveis.filter(
                      s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tagsFiltro.includes(s)
                    )

                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setFocusedIndex(prev => Math.min(prev + 1, filteredSugs.length - 1))
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setFocusedIndex(prev => Math.max(prev - 1, -1))
                    } else if (e.key === 'Enter') {
                      e.preventDefault()
                      if (focusedIndex >= 0 && focusedIndex < filteredSugs.length) {
                        const selected = filteredSugs[focusedIndex]
                        if (!tagsFiltro.includes(selected)) {
                          setTagsFiltro(prev => [...prev, selected])
                        }
                        setInputValue('')
                        setFocusedIndex(-1)
                      } else if (inputValue.trim()) {
                        const val = inputValue.trim()
                        if (!tagsFiltro.includes(val)) {
                          setTagsFiltro(prev => [...prev, val])
                        }
                        setInputValue('')
                      }
                    } else if (e.key === 'Backspace' && !inputValue && tagsFiltro.length > 0) {
                      setTagsFiltro(prev => prev.slice(0, -1))
                    }
                  }}
                  placeholder={tagsFiltro.length === 0 ? "Digite termos ou escolha sugestões..." : "Adicionar tag..."}
                  className="flex-1 bg-transparent border-0 outline-hidden text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 min-w-[150px] py-1"
                />
              </div>

              {showSuggestions && (
                (() => {
                  const filteredSugs = sugestoesDisponiveis.filter(
                    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tagsFiltro.includes(s)
                  )

                  if (filteredSugs.length === 0) return null

                  return (
                    <div className="absolute z-50 w-full mt-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                      {filteredSugs.map((sug, idx) => (
                        <button
                          key={sug}
                          type="button"
                          onMouseDown={() => {
                            if (!tagsFiltro.includes(sug)) {
                              setTagsFiltro(prev => [...prev, sug])
                            }
                            setInputValue('')
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${idx === focusedIndex ? 'bg-sky-500/10 text-sky-600 font-semibold' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                        >
                          <span>{sug}</span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">Click / Enter</span>
                        </button>
                      ))}
                    </div>
                  )
                })()
              )}
            </div>
          </div>

          {resultadoFiltrado.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
              <BarChart2 className="h-10 w-10 mx-auto text-zinc-400 mb-3 opacity-50" />
              <p className="font-semibold text-zinc-500">Nenhuma resposta encontrada para os filtros aplicados.</p>
            </div>
          ) : (
            <>
              {perguntasMultipla.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setMostrarGraficos(prev => !prev)}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-xs cursor-pointer"
                  >
                    <BarChart2 className="h-4 w-4 text-sky-600" />
                    {mostrarGraficos ? 'Ocultar Gráficos' : 'Ver Análise Gráfica'}
                  </button>
                </div>
              )}

              {mostrarGraficos && perguntasMultipla.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                  {perguntasMultipla.map((perg) => {
                    const dados = getGraficoDados(perg)
                    return (
                      <div key={perg.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-xs">
                        <div className="flex gap-2 items-center text-xs font-bold text-sky-600 uppercase tracking-wider">
                          <Sparkles className="h-4 w-4" />
                          <span>Distribuição</span>
                        </div>
                        <h3 className="font-bold text-sm line-clamp-2">{perg.titulo}</h3>
                        
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dados} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                              <XAxis dataKey="nome" stroke="#71717a" fontSize={10} />
                              <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '0.75rem', color: '#f4f4f5' }} 
                                labelStyle={{ fontWeight: 'bold' }}
                              />
                              <Bar dataKey="quantidade" fill="#0284c7" radius={[4, 4, 0, 0]}>
                                {dados.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Tabela de Respostas */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-xs">
                <h3 className="font-bold text-lg">Respostas Individuais</h3>
                
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50/70 dark:bg-zinc-950/40">
                        <th className="p-3 pl-4">Data / Hora</th>
                        {perguntas.map(p => (
                          <th key={p.id} className="p-3 truncate max-w-[200px]" title={p.titulo}>{p.titulo}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {resultadoFiltrado.map((r: any) => (
                        <tr key={r.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3 pl-4 text-xs text-zinc-500 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleString('pt-BR')}
                          </td>
                          {perguntas.map(p => {
                            const val = r.valores[p.id]
                            if (val === undefined) {
                              return <td key={p.id} className="p-3 text-zinc-400">-</td>
                            }
                            if (p.tipo === 'multipla') {
                              const opcoes = p.config?.opcoes || []
                              const selecionadas = Array.isArray(val) ? val : [val]
                              const textos = selecionadas.map(id => opcoes.find(o => o.id === id)?.texto || id)
                              return (
                                <td key={p.id} className="p-3">
                                  <div className="flex flex-wrap gap-1">
                                    {textos.map((txt, idx) => (
                                      <span key={idx} className="bg-sky-500/10 text-sky-600 border border-sky-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {txt}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              )
                            }
                            return (
                              <td key={p.id} className="p-3 truncate max-w-[250px]" title={val}>
                                {val}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
