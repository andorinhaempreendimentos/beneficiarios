"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { dbService, decodeMatricula, type Pesquisa, type Pergunta, type Objeto, type Lider, type Fluxo } from '@/services/pesquisasDb'
import { 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  AlertTriangle
} from 'lucide-react'

function ResponderContent() {
  const params = useParams()
  const token = params?.token as string | undefined
  const searchParams = useSearchParams()

  const [pesquisa, setPesquisa] = useState<(Pesquisa & { fluxo?: Fluxo }) | null>(null)
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [flowData, setFlowData] = useState<any>(null)
  
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [respondeu, setRespondeu] = useState(false)
  const [deviceFp, setDeviceFp] = useState('')
  const [todasPerguntasSession, setTodasPerguntasSession] = useState<Pergunta[]>([])

  // CPF antes do fluxo
  const [etapaCpf, setEtapaCpf] = useState(false)
  const [cpfDigitado, setCpfDigitado] = useState('')
  const [cpfErro, setCpfErro] = useState('')
  const [cpfCheckando, setCpfCheckando] = useState(false)
  const [cpfConfirmado, setCpfConfirmado] = useState('')

  // Autenticação de Aluno (Desafio KYC por Matrícula)
  const [etapaDesafio, setEtapaDesafio] = useState(false)
  const [dadosDesafio, setDadosDesafio] = useState<{
    beneficiarioId: string
    matricula: string
    nomeCompleto: string
    nucleoId: string | null
    turmaId?: string | null
    desafio: { id: string; pergunta: string; opcoes: string[]; correto: string }[]
  } | null>(null)
  const [respostasDesafio, setRespostasDesafio] = useState<Record<string, string>>({})
  const [desafioErro, setDesafioErro] = useState('')
  const [jaRespondeuMatricula, setJaRespondeuMatricula] = useState(false)
  const [alunoAutenticado, setAlunoAutenticado] = useState<{
    beneficiarioId: string
    matricula: string
    nucleoId: string | null
    turmaId: string | null
  } | null>(null)

  useEffect(() => {
    if (perguntas.length > 0) {
      setTodasPerguntasSession(prev => {
        const map = new Map(prev.map(p => [p.id, p]))
        perguntas.forEach(p => map.set(p.id, p))
        return Array.from(map.values())
      })
    }
  }, [perguntas])

  // Estado do fluxo de respostas
  const [currentNodeId, setCurrentNodeId] = useState<string>('start')
  const [respostasAcumuladas, setRespostasAcumuladas] = useState<Record<string, any>>({})
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({})
  
  // Resposta da tela atual
  const [valorAtual, setValorAtual] = useState<any>('')
  const [validacaoErro, setValidacaoErro] = useState('')
  const [blockPerguntas, setBlockPerguntas] = useState<Pergunta[]>([])

  // Objeto e Líder Relacionados
  const [objetoRelacionado, setObjetoRelacionado] = useState<Objeto | null>(null)
  const [liderRelacionado, setLiderRelacionado] = useState<Lider | null>(null)

  // Estados para carregamento dinâmico de cidades
  const [cidadesPorEstado, setCidadesPorEstado] = useState<Record<string, string[]>>({})
  const [loadingCidades, setLoadingCidades] = useState<Record<string, boolean>>({})
  const [lastEstado, setLastEstado] = useState('')

  interface SubflowState {
    pesquisa: Pesquisa & { fluxo?: Fluxo }
    flowData: any
    perguntas: Pergunta[]
    respostasAcumuladas: Record<string, any>
    currentNodeId: string
    objetoRelacionado: Objeto | null
    liderRelacionado: Lider | null
  }

  const [subflowStack, setSubflowStack] = useState<SubflowState[]>([])

  const getDeviceFingerprint = () => {
    let fp = localStorage.getItem('andorinha_device_fp')
    if (!fp) {
      const userAgent = navigator.userAgent
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const random = Math.random().toString(36).substring(2, 15)
      fp = btoa(`${userAgent}-${screenWidth}x${screenHeight}-${random}`).substring(0, 32)
      localStorage.setItem('andorinha_device_fp', fp)
    }
    return fp
  }

  useEffect(() => {
    if (token) {
      const fp = getDeviceFingerprint()
      setDeviceFp(fp)
      loadFlow(token)
    }
  }, [token, searchParams])

  const loadFlow = async (tk: string) => {
    setLoading(true)
    try {
      let pesq: Pesquisa | null = null
      let obj: Objeto | null = null
      let lid: Lider | null = null
      let pergs: Pergunta[] = []
      let flowDataObj: any = null

      if (tk === 'preview') {
        const fluxoId = searchParams.get('fluxo')
        if (!fluxoId) {
          setErrorMsg('ID do fluxo não especificado para visualização.')
          setLoading(false)
          return
        }
        const fluxoObj = await dbService.getFluxoById(fluxoId)
        if (!fluxoObj) {
          setErrorMsg('Fluxo de visualização não encontrado.')
          setLoading(false)
          return
        }
        pesq = {
          id: 'preview',
          titulo: fluxoObj.nome || 'Visualização do Fluxo',
          descricao: '',
          token: 'preview',
          publicada: true,
          exigir_cpf: false,
          fluxo_id: fluxoObj.id,
          created_at: new Date().toISOString(),
          objeto_id: null,
          lider_id: null
        }
        flowDataObj = fluxoObj.flow_data
        pergs = await dbService.getPerguntas(fluxoObj.id)
      } else {
        const realPesq = await dbService.getPesquisaByToken(tk)
        if (!realPesq) {
          setErrorMsg('Pesquisa não encontrada ou indisponível.')
          setLoading(false)
          return
        }
        pesq = realPesq
        flowDataObj = realPesq.fluxo?.flow_data

        if (realPesq.objeto_id) {
          try {
            obj = await dbService.getObjetoById(realPesq.objeto_id)
            setObjetoRelacionado(obj)
          } catch (e) {
            console.error(e)
          }
        }
        if (realPesq.lider_id) {
          try {
            lid = await dbService.getLiderById(realPesq.lider_id)
            setLiderRelacionado(lid)
          } catch (e) {
            console.error(e)
          }
        }

        if (!realPesq.fluxo_id) {
          setErrorMsg('Esta pesquisa não possui um fluxo associado.')
          setLoading(false)
          return
        }
        pergs = await dbService.getPerguntas(realPesq.fluxo_id)

        const rawM = searchParams.get('m')
        const matriculaParam = rawM ? decodeMatricula(rawM) : null
        if (matriculaParam) {
          const jaRespondeu = await dbService.hasMatriculaResponded(realPesq.id, matriculaParam)
          if (jaRespondeu) {
            setJaRespondeuMatricula(true)
            setLoading(false)
            return
          }

          const desafioObj = await dbService.getDesafioBeneficiario(matriculaParam)
          if (!desafioObj) {
            setErrorMsg('Matrícula de aluno não localizada no cadastro.')
            setLoading(false)
            return
          }

          setDadosDesafio(desafioObj)
          setEtapaDesafio(true)
        } else if (pesq && pesq.exigir_cpf) {
          setEtapaCpf(true)
        }
      }

      setPesquisa(pesq)
      setFlowData(flowDataObj)
      setPerguntas(pergs)

      const edges = flowDataObj?.edges || []
      const startEdge = edges.find((e: any) => e.source === 'start')
      if (startEdge) {
        const firstNodeId = startEdge.target
        const firstNode = flowDataObj?.nodes?.find((n: any) => n.id === firstNodeId)

        if (firstNode && firstNode.type === 'subflow') {
          const subflowId = firstNode.data?.subflowId
          if (!subflowId) {
            setErrorMsg('Subfluxo não configurado.')
            setLoading(false)
            return
          }
          const subflowEdge = edges.find((e: any) => e.source === firstNode.id)
          const returnNodeId = subflowEdge ? subflowEdge.target : 'end'

          const parentState: SubflowState = {
            pesquisa: pesq!,
            flowData: flowDataObj,
            perguntas: pergs,
            respostasAcumuladas: {},
            currentNodeId: returnNodeId,
            objetoRelacionado: obj,
            liderRelacionado: lid
          }

          await enterSubflow(subflowId, parentState)
        } else {
          setCurrentNodeId(firstNodeId)
        }
      } else {
        setErrorMsg('Esta pesquisa ainda não possui um fluxo estruturado.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Erro ao iniciar formulário de respostas.')
    } finally {
      setLoading(false)
    }
  }

  const getPerguntaAtual = (): Pergunta | undefined => {
    return perguntas.find(p => p.id === currentNodeId)
  }

  const perguntaAtual = getPerguntaAtual()
  const currentNode = flowData?.nodes?.find((n: any) => n.id === currentNodeId)
  const isBlock = currentNode?.type === 'block'

  useEffect(() => {
    if (isBlock && currentNode?.data?.subflowId) {
      dbService.getPerguntas(currentNode.data.subflowId)
        .then(setBlockPerguntas)
        .catch(console.error)
    } else if (!isBlock) {
      setBlockPerguntas([])
    }
  }, [currentNodeId, isBlock, currentNode?.data?.subflowId])

  useEffect(() => {
    if (isBlock) {
      const blockVals: Record<string, any> = {}
      blockPerguntas.forEach(sub => {
        const anterior = respostasAcumuladas[sub.id]
        blockVals[sub.id] = anterior !== undefined ? anterior : (sub.tipo === 'multipla' ? [] : '')
      })
      setValorAtual(blockVals)
      setErrosCampos({})
    } else if (perguntaAtual) {
      const anterior = respostasAcumuladas[perguntaAtual.id]
      setValorAtual(anterior !== undefined ? anterior : (perguntaAtual.tipo === 'multipla' ? [] : ''))
      setValidacaoErro('')
    }
  }, [currentNodeId, perguntaAtual, isBlock, flowData, blockPerguntas])

  const getEstadoSelecionado = () => {
    if (isBlock) {
      const estadoPerg = blockPerguntas.find(p => p.tipo === 'estado')
      if (estadoPerg && valorAtual?.[estadoPerg.id]) {
        return valorAtual[estadoPerg.id]
      }
    }
    const todasPerguntas = todasPerguntasSession.length > 0 ? todasPerguntasSession : perguntas
    const estadoPerg = todasPerguntas.find(p => p.tipo === 'estado')
    if (estadoPerg && respostasAcumuladas?.[estadoPerg.id]) {
      return respostasAcumuladas[estadoPerg.id]
    }
    return ''
  }

  const estadoSelecionado = getEstadoSelecionado()

  useEffect(() => {
    if (estadoSelecionado && lastEstado && estadoSelecionado !== lastEstado) {
      if (isBlock) {
        setValorAtual((prev: any) => {
          const updated = { ...prev }
          const cidadePerg = blockPerguntas.find(p => p.tipo === 'cidade')
          if (cidadePerg) {
            updated[cidadePerg.id] = ''
          }
          return updated
        })
      } else {
        const cidadePerg = perguntas.find(p => p.id === currentNodeId && p.tipo === 'cidade')
        if (cidadePerg) {
          setValorAtual('')
        }
      }
    }
    if (estadoSelecionado) {
      setLastEstado(estadoSelecionado)
    }
  }, [estadoSelecionado, isBlock, blockPerguntas, perguntas, currentNodeId, lastEstado])

  useEffect(() => {
    if (estadoSelecionado && !cidadesPorEstado[estadoSelecionado] && !loadingCidades[estadoSelecionado]) {
      setLoadingCidades(prev => ({ ...prev, [estadoSelecionado]: true }))
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const list = data.map((c: any) => c.nome).sort()
            setCidadesPorEstado(prev => ({ ...prev, [estadoSelecionado]: list }))
          }
        })
        .catch(console.error)
        .finally(() => {
          setLoadingCidades(prev => ({ ...prev, [estadoSelecionado]: false }))
        })
    }
  }, [estadoSelecionado, cidadesPorEstado, loadingCidades])

  const validarUmaResposta = (perg: any, valor: any): string => {
    const isObrig = perg.obrigatoria
    
    if (perg.tipo === 'avaliacao') {
      if (isObrig && (valor === '' || valor === null || valor === undefined)) {
        return 'Por favor, selecione uma nota.'
      }
    } else if (perg.tipo !== 'multipla') {
      const txt = (valor as string || '').trim()
      if (isObrig) {
        if (perg.tipo === 'logradouro') {
          const valStr = (valor as string || '').trim()
          const tiposLogradouro = ['Rua', 'Avenida', 'Praça', 'Travessa', 'Alameda', 'Rodovia', 'Outro']
          const match = tiposLogradouro.find(t => valStr.startsWith(t + ' '))
          const nome = match ? valStr.slice(match.length + 1).trim() : valStr.trim()
          if (!nome) {
            return 'Esta resposta é obrigatória.'
          }
        } else if (!txt) {
          return 'Esta resposta é obrigatória.'
        }
      }

      if (txt) {
        if (perg.tipo === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(txt)) {
            return 'Por favor, informe um endereço de e-mail válido.'
          }
        }

        if (perg.tipo === 'whatsapp') {
          const digits = txt.replace(/\D/g, '')
          if (digits.length < 10 || digits.length > 11) {
            return 'Por favor, insira o número de celular completo com DDD.'
          }
        }

        if (perg.tipo === 'cpf') {
          const digits = txt.replace(/\D/g, '')
          if (digits.length !== 11) {
            return 'CPF inválido. Informe os 11 dígitos.'
          }
        }

        if (perg.tipo === 'cep') {
          const digits = txt.replace(/\D/g, '')
          if (digits.length !== 8) {
            return 'CEP inválido. Informe os 8 dígitos.'
          }
        }

        if (perg.tipo === 'numero') {
          if (!/^-?\d+([.,]\d+)?$/.test(txt)) {
            return 'Por favor, informe apenas números.'
          }
        }
      }
    } else {
      const selecionadas = valor as string[]
      if (isObrig && (!selecionadas || selecionadas.length === 0)) {
        return 'Por favor, selecione pelo menos uma opção.'
      }
      const maxRespostas = perg.config?.max_respostas
      if (maxRespostas && selecionadas.length > maxRespostas) {
        return `Por favor, selecione no máximo ${maxRespostas} opções.`
      }
    }

    return ''
  }

  const validarResposta = (): boolean => {
    if (!perguntaAtual) return true
    const erro = validarUmaResposta(perguntaAtual, valorAtual)
    setValidacaoErro(erro)
    return !erro
  }

  const validarRespostaBloco = (): boolean => {
    const novosErros: Record<string, string> = {}
    let temErro = false

    blockPerguntas.forEach(sub => {
      const val = valorAtual[sub.id]
      const erro = validarUmaResposta(sub, val)
      if (erro) {
        novosErros[sub.id] = erro
        temErro = true
      }
    })

    setErrosCampos(novosErros)
    return !temErro
  }

  const handleInputKeyDown = (e: React.KeyboardEvent, index: number, total: number) => {
    if (e.key === 'Enter') {
      if (index < total - 1) {
        e.preventDefault()
        const form = e.currentTarget.closest('form')
        if (form) {
          const elements = Array.from(form.querySelectorAll('input, select, textarea, button[type="button"]'))
          const currentIdx = elements.indexOf(e.currentTarget)
          if (currentIdx !== -1 && currentIdx + 1 < elements.length) {
            (elements[currentIdx + 1] as HTMLElement).focus()
          }
        }
      }
    }
  }

  const renderCampoInput = (
    perg: any,
    val: any,
    setVal: (v: any) => void,
    erro: string | undefined,
    onKeyDown?: (e: React.KeyboardEvent<any>) => void
  ) => {
    const applyWhatsappMask = (v: string) => {
      const numbers = v.replace(/\D/g, '')
      if (numbers.length <= 2) return numbers
      if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }

    const applyCpfMask = (v: string) => {
      const n = v.replace(/\D/g, '').slice(0, 11)
      if (n.length <= 3) return n
      if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
      if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
      return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
    }

    const applyCepMask = (v: string) => {
      const n = v.replace(/\D/g, '').slice(0, 8)
      if (n.length <= 5) return n
      return `${n.slice(0, 5)}-${n.slice(5)}`
    }

    const handleToggleOpcao = (opcaoId: string) => {
      const selecionadas = Array.isArray(val) ? [...val] : []
      const maxRespostas = perg.config?.max_respostas

      if (selecionadas.includes(opcaoId)) {
        setVal(selecionadas.filter(idVal => idVal !== opcaoId))
      } else {
        if (maxRespostas === 1) {
          setVal([opcaoId])
        } else if (maxRespostas && selecionadas.length >= maxRespostas) {
          // sem acao
        } else {
          setVal([...selecionadas, opcaoId])
        }
      }
    }

    return (
      <div className="space-y-1.5 w-full">
        {perg.tipo === 'texto_curto' && (
          <input
            type="text"
            value={val || ''}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escreva sua resposta..."
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base shadow-xs"
          />
        )}

        {perg.tipo === 'textarea' && (
          <textarea
            value={val || ''}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (onKeyDown) {
                  onKeyDown(e)
                } else {
                  e.preventDefault()
                  handleAvancar()
                }
              }
            }}
            placeholder="Escreva sua resposta com detalhes..."
            rows={4}
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base resize-none leading-relaxed shadow-xs"
          />
        )}

        {perg.tipo === 'email' && (
          <input
            type="email"
            value={val || ''}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="nome@provedor.com"
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base shadow-xs"
          />
        )}

        {perg.tipo === 'whatsapp' && (
          <input
            type="text"
            value={val || ''}
            onChange={(e) => setVal(applyWhatsappMask(e.target.value))}
            onKeyDown={onKeyDown}
            placeholder="(00) 00000-0000"
            maxLength={15}
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base shadow-xs"
          />
        )}

        {perg.tipo === 'cpf' && (
          <input
            type="text"
            value={val || ''}
            onChange={(e) => setVal(applyCpfMask(e.target.value))}
            onKeyDown={onKeyDown}
            placeholder="000.000.000-00"
            maxLength={14}
            inputMode="numeric"
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base shadow-xs"
          />
        )}

        {perg.tipo === 'cep' && (
          <input
            type="text"
            value={val || ''}
            onChange={(e) => setVal(applyCepMask(e.target.value))}
            onKeyDown={onKeyDown}
            placeholder="00000-000"
            maxLength={9}
            inputMode="numeric"
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base shadow-xs"
          />
        )}

        {perg.tipo === 'estado' && (
          <select
            value={val || ''}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base shadow-xs"
          >
            <option value="">Selecione o Estado (UF)...</option>
            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        )}

        {perg.tipo === 'cidade' && (
          estadoSelecionado ? (
            <div className="relative">
              <select
                value={val || ''}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base shadow-xs"
              >
                <option value="">Selecione a Cidade...</option>
                {loadingCidades[estadoSelecionado] ? (
                  <option disabled>Carregando cidades...</option>
                ) : (
                  (cidadesPorEstado[estadoSelecionado] || []).map(cid => (
                    <option key={cid} value={cid}>{cid}</option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <input
              type="text"
              value={val || ''}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Informe a cidade (selecione o Estado primeiro)..."
              disabled
              className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-5 py-4 text-zinc-400 cursor-not-allowed text-base shadow-xs opacity-60"
            />
          )
        )}

        {perg.tipo === 'bairro' && (
          <input
            type="text"
            value={val || ''}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Informe o bairro..."
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base shadow-xs"
          />
        )}

        {perg.tipo === 'logradouro' && (() => {
          const parseLogradouro = (vStr: string) => {
            const tiposLogradouro = ['Rua', 'Avenida', 'Praça', 'Travessa', 'Alameda', 'Rodovia', 'Outro']
            const match = tiposLogradouro.find(t => vStr.startsWith(t + ' '))
            if (match) {
              return { tipo: match, nome: vStr.slice(match.length + 1) }
            }
            return { tipo: 'Rua', nome: vStr }
          }
          const info = parseLogradouro(val as string || '')
          return (
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <select
                value={info.tipo}
                onChange={(e) => setVal(e.target.value + ' ' + info.nome)}
                onKeyDown={onKeyDown}
                className="w-full sm:w-1/3 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 focus:border-sky-500 focus:outline-hidden transition-all text-base shadow-xs"
              >
                {['Rua', 'Avenida', 'Praça', 'Travessa', 'Alameda', 'Rodovia', 'Outro'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="text"
                value={info.nome}
                onChange={(e) => setVal(info.tipo + ' ' + e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Nome do logradouro..."
                className="w-full sm:w-2/3 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden transition-all text-base shadow-xs"
              />
            </div>
          )
        })()}

        {perg.tipo === 'numero' && (
          <input
            type="number"
            value={val || ''}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Digite um número..."
            inputMode="numeric"
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden transition-all text-base shadow-xs"
          />
        )}

        {perg.tipo === 'avaliacao' && (
          <div className="space-y-4">
            <div className="grid grid-cols-11 gap-1.5">
              {Array.from({ length: 11 }, (_, i) => i).map((nota) => {
                const selecionada = val === nota || val === String(nota)
                const cor =
                  nota <= 6
                    ? selecionada
                      ? 'bg-red-500 border-red-500 text-white shadow-md'
                      : 'border-red-200 text-red-500 hover:bg-red-50'
                    : nota <= 8
                    ? selecionada
                      ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                      : 'border-amber-200 text-amber-500 hover:bg-amber-50'
                    : selecionada
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                return (
                  <button
                    key={nota}
                    type="button"
                    onClick={() => setVal(nota)}
                    onKeyDown={onKeyDown}
                    className={`aspect-square rounded-xl border-2 font-bold text-sm transition-all duration-150 active:scale-90 cursor-pointer ${cor}`}
                  >
                    {nota}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {perg.tipo === 'multipla' && (
          <div className="space-y-2.5">
            {(perg.config?.opcoes || []).map((opcao: any) => {
              const isSelected = Array.isArray(val) && val.includes(opcao.id)
              return (
                <button
                  key={opcao.id}
                  type="button"
                  onClick={() => handleToggleOpcao(opcao.id)}
                  onKeyDown={onKeyDown}
                  className={`w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-600 text-sky-950 dark:text-sky-100 font-semibold'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                  }`}
                >
                  <span className="font-semibold text-base">{opcao.texto}</span>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? 'border-sky-600 bg-sky-600' : 'border-zinc-300'
                  }`}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {erro && (
          <p className="text-red-500 text-sm font-semibold flex items-center gap-1.5 animate-pulse mt-1">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {erro}
          </p>
        )}
      </div>
    )
  }

  const enterSubflow = async (subflowId: string, parentState: SubflowState) => {
    setLoading(true)
    try {
      const subq = await dbService.getFluxoById(subflowId)
      if (!subq) {
        throw new Error('Subfluxo não encontrado ou indisponível.')
      }

      const subPergs = await dbService.getPerguntas(subq.id)
      const subEdges = subq.flow_data?.edges || []
      const subStartEdge = subEdges.find((e: any) => e.source === 'start')
      if (!subStartEdge) {
        throw new Error('Subfluxo não possui um fluxo estruturado.')
      }

      const firstNodeId = subStartEdge.target
      const firstNode = subq.flow_data?.nodes?.find((n: any) => n.id === firstNodeId)

      if (firstNode && firstNode.type === 'subflow') {
        const nestedSubflowId = firstNode.data?.subflowId
        if (!nestedSubflowId) {
          throw new Error('Subfluxo aninhado não configurado.')
        }
        const subflowEdge = subEdges.find((e: any) => e.source === firstNode.id)
        const returnNodeId = subflowEdge ? subflowEdge.target : 'end'

        const middleState: SubflowState = {
          pesquisa: parentState.pesquisa,
          flowData: subq.flow_data,
          perguntas: subPergs,
          respostasAcumuladas: {},
          currentNodeId: returnNodeId,
          objetoRelacionado: parentState.objetoRelacionado,
          liderRelacionado: parentState.liderRelacionado
        }

        setSubflowStack(prev => [...prev, parentState])
        await enterSubflow(nestedSubflowId, middleState)
      } else {
        setSubflowStack(prev => [...prev, parentState])
        setFlowData(subq.flow_data)
        setPerguntas(subPergs)
        setRespostasAcumuladas({})
        setValorAtual('')
        setValidacaoErro('')
        setCurrentNodeId(firstNodeId)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Erro ao carregar subfluxo.')
    } finally {
      setLoading(false)
    }
  }

  const finalizarFluxoOuSubfluxo = async (
    pesqId: string,
    respostasAtuais: Record<string, any>,
    pilha: SubflowState[]
  ) => {
    setLoading(true)
    try {
      if (pilha.length > 0) {
        const parent = pilha[pilha.length - 1]
        const novaPilha = pilha.slice(0, -1)
        setSubflowStack(novaPilha)

        setPesquisa(parent.pesquisa)
        setFlowData(parent.flowData)
        setPerguntas(parent.perguntas)
        
        const novasRespostas = {
          ...parent.respostasAcumuladas,
          ...respostasAtuais
        }
        setRespostasAcumuladas(novasRespostas)
        setObjetoRelacionado(parent.objetoRelacionado)
        setLiderRelacionado(parent.liderRelacionado)

        if (parent.currentNodeId === 'end') {
          await finalizarFluxoOuSubfluxo(parent.pesquisa.id, novasRespostas, novaPilha)
        } else {
          setCurrentNodeId(parent.currentNodeId)
          setLoading(false)
        }
      } else {
        if (token !== 'preview') {
          const itens = Object.keys(respostasAtuais).map(pergId => ({
            pergunta_id: pergId,
            valor: respostasAtuais[pergId]
          }))

          const meta = alunoAutenticado ? {
            beneficiarioId: alunoAutenticado.beneficiarioId,
            matricula: alunoAutenticado.matricula,
            nucleoId: alunoAutenticado.nucleoId || pesquisa?.nucleo_id || undefined,
            turmaId: alunoAutenticado.turmaId || pesquisa?.turma_id || undefined
          } : {
            nucleoId: pesquisa?.nucleo_id || undefined,
            turmaId: pesquisa?.turma_id || undefined
          }

          await dbService.saveRespostaCompleta(
            pesqId, 
            deviceFp, 
            itens, 
            cpfConfirmado || undefined,
            meta
          )
        }
        setRespondeu(true)
        setLoading(false)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Ocorreu um erro ao gravar suas respostas. Tente novamente.')
      setLoading(false)
    }
  }

  const handleAvancar = async () => {
    if (isBlock) {
      if (!validarRespostaBloco() || !pesquisa || !flowData) return
    } else {
      if (!validarResposta() || !pesquisa || !flowData) return
    }

    const novasRespostas = {
      ...respostasAcumuladas,
      ...(isBlock ? valorAtual : { [currentNodeId]: valorAtual })
    }
    setRespostasAcumuladas(novasRespostas)

    const edges = flowData.edges || []
    let proximoNoId = 'end'

    if (!isBlock && perguntaAtual?.tipo === 'multipla') {
      const selecionadas = valorAtual as string[]
      const arestasSaindo = edges.filter((e: any) => e.source === currentNodeId)
      
      const arestaPorHandle = arestasSaindo.find((e: any) => 
        e.sourceHandle && e.sourceHandle !== 'output' && selecionadas.includes(e.sourceHandle)
      )

      if (arestaPorHandle) {
        proximoNoId = arestaPorHandle.target
      } else {
        const arestaCondicionalCorrespondente = arestasSaindo.find((e: any) => 
          e.data && e.data.opcaoId && selecionadas.includes(e.data.opcaoId)
        )

        if (arestaCondicionalCorrespondente) {
          proximoNoId = arestaCondicionalCorrespondente.target
        } else {
          const arestaIncondicional = arestasSaindo.find((e: any) => 
            (!e.sourceHandle || e.sourceHandle === 'output') && (!e.data || !e.data.opcaoId)
          )
          if (arestaIncondicional) {
            proximoNoId = arestaIncondicional.target
          }
        }
      }
    } else {
      const arestaPadrao = edges.find((e: any) => e.source === currentNodeId)
      if (arestaPadrao) {
        proximoNoId = arestaPadrao.target
      }
    }

    const proximoNo = flowData.nodes?.find((n: any) => n.id === proximoNoId)

    if (proximoNo && proximoNo.type === 'subflow') {
      const subflowId = proximoNo.data?.subflowId
      if (!subflowId) {
        setErrorMsg('Subfluxo não configurado.')
        return
      }

      const subflowEdge = edges.find((e: any) => e.source === proximoNo.id)
      const returnNodeId = subflowEdge ? subflowEdge.target : 'end'

      const parentState: SubflowState = {
        pesquisa,
        flowData,
        perguntas,
        respostasAcumuladas: novasRespostas,
        currentNodeId: returnNodeId,
        objetoRelacionado,
        liderRelacionado
      }

      await enterSubflow(subflowId, parentState)
    } else if (proximoNoId === 'end') {
      await finalizarFluxoOuSubfluxo(pesquisa.id, novasRespostas, subflowStack)
    } else {
      setCurrentNodeId(proximoNoId)
    }
  }

  const getProgresso = () => {
    if (perguntas.length === 0 || currentNodeId === 'start') return 0
    if (respondeu) return 100
    const respondidasCount = Object.keys(respostasAcumuladas).length
    const totalAproximado = perguntas.length
    return Math.min(Math.round((respondidasCount / totalAproximado) * 100), 95)
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 space-y-4 shadow-xl">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold">Pesquisa Indisponível</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    )
  }

  if (jaRespondeuMatricula) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="bg-sky-500/10 p-4 rounded-full text-sky-600 border border-sky-500/20 w-fit mx-auto">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold">Pesquisa Já Respondida</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Você já enviou sua resposta para esta pesquisa. Muito obrigado pela sua participação!
            </p>
          </div>
          <div className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest pt-4 border-t border-zinc-100 dark:border-zinc-800">
            Andorinha Pesquisas
          </div>
        </div>
      </div>
    )
  }

  if (etapaDesafio && dadosDesafio && pesquisa) {
    const handleConfirmarDesafio = () => {
      setDesafioErro('')

      for (const q of dadosDesafio.desafio) {
        if (!respostasDesafio[q.id]) {
          setDesafioErro('Por favor, responda a todas as opções para confirmar sua identidade.')
          return
        }
      }

      const erros = dadosDesafio.desafio.filter(q => {
        const resp = respostasDesafio[q.id]
        return resp.trim().toLowerCase() !== q.correto.trim().toLowerCase()
      })

      if (erros.length > 0) {
        setDesafioErro('Alguma informação não confere com o seu cadastro. Verifique e tente novamente.')
        return
      }

      setAlunoAutenticado({
        beneficiarioId: dadosDesafio.beneficiarioId,
        matricula: dadosDesafio.matricula,
        nucleoId: dadosDesafio.nucleoId,
        turmaId: dadosDesafio.turmaId || pesquisa.turma_id || null
      })
      setEtapaDesafio(false)
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <img src="/logo.png" alt="Logo" className="h-10 mx-auto mb-2 object-contain" />
            <h2 className="text-xl font-extrabold">{pesquisa.titulo}</h2>
            <p className="text-xs text-zinc-500">
              Para começar, confirme seus dados:
            </p>
          </div>

          <div className="space-y-4">
            {dadosDesafio.desafio.map((item, idx) => (
              <div key={item.id} className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {idx + 1}. {item.pergunta}
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {item.opcoes.map((opcao) => {
                    const isSelected = respostasDesafio[item.id] === opcao
                    return (
                      <button
                        key={opcao}
                        type="button"
                        onClick={() => {
                          setDesafioErro('')
                          setRespostasDesafio(prev => ({ ...prev, [item.id]: opcao }))
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                        }`}
                      >
                        {opcao}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {desafioErro && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{desafioErro}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmarDesafio}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-3 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer mt-2"
            >
              <span>Confirmar e Continuar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest text-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
            Identificação Segura Andorinha
          </div>
        </div>
      </div>
    )
  }

  if (etapaCpf && pesquisa) {
    const CPF_TESTE = '1111111111x'

    const aplicarMascaraCpf = (v: string) => {
      const nums = v.replace(/\D/g, '').substring(0, 11)
      return nums
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }

    const validarCpf = (cpf: string) => {
      if (cpf.toLowerCase() === CPF_TESTE) return true
      const nums = cpf.replace(/\D/g, '')
      if (nums.length !== 11 || /^(\d)\1+$/.test(nums)) return false
      let soma = 0
      for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i)
      let r = 11 - (soma % 11)
      if (r >= 10) r = 0
      if (r !== parseInt(nums[9])) return false
      soma = 0
      for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i)
      r = 11 - (soma % 11)
      if (r >= 10) r = 0
      return r === parseInt(nums[10])
    }

    const handleConfirmarCpf = async () => {
      const cpfRaw = cpfDigitado.toLowerCase() === CPF_TESTE ? CPF_TESTE : cpfDigitado.replace(/\D/g, '')
      if (!validarCpf(cpfDigitado)) {
        setCpfErro('CPF inválido. Verifique e tente novamente.')
        return
      }
      setCpfErro('')
      setCpfCheckando(true)
      try {
        const jaRespondeu = await dbService.hasCpfResponded(pesquisa.id, cpfRaw)
        if (jaRespondeu) {
          setCpfErro('Este CPF já respondeu esta pesquisa.')
          setCpfCheckando(false)
          return
        }
        setCpfConfirmado(cpfRaw)
        setEtapaCpf(false)
      } catch (e) {
        setCpfErro('Erro ao verificar CPF. Tente novamente.')
      } finally {
        setCpfCheckando(false)
      }
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <img src="/logo.png" alt="Logo" className="h-10 mx-auto mb-4 object-contain" />
            <h2 className="text-xl font-extrabold">{pesquisa.titulo}</h2>
            <p className="text-sm text-zinc-500">Para continuar, informe seu CPF.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">CPF</label>
            <input
              type="text"
              inputMode="numeric"
              value={cpfDigitado}
              onChange={e => {
                setCpfErro('')
                setCpfDigitado(aplicarMascaraCpf(e.target.value))
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirmarCpf() }}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-base tracking-widest"
              autoFocus
            />
            {cpfErro && (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {cpfErro}
              </p>
            )}
          </div>

          <button
            onClick={handleConfirmarCpf}
            disabled={cpfCheckando || cpfDigitado.length < 11}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {cpfCheckando ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {cpfCheckando ? 'Verificando...' : 'Continuar'}
          </button>
        </div>
      </div>
    )
  }

  if (respondeu) {
    const handleReiniciarPreview = () => {
      setRespondeu(false)
      setRespostasAcumuladas({})
      setValorAtual('')
      setValidacaoErro('')
      setSubflowStack([])
      setTodasPerguntasSession([])
      setCurrentNodeId('start')
      loadFlow(token!)
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="bg-emerald-500/10 p-4 rounded-full text-emerald-600 border border-emerald-500/20 w-fit mx-auto">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold">Obrigado!</h3>
            {token === 'preview' ? (
              <div className="space-y-4">
                <p className="text-sm text-amber-500 font-semibold leading-relaxed">
                  Modo de visualização. Respostas não foram salvas.
                </p>
                <div className="text-left bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl space-y-3 max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-800">
                  {Object.entries(respostasAcumuladas).map(([pergId, valor]) => {
                    const perg = todasPerguntasSession.find(p => p.id === pergId)
                    let displayValor = ''
                    if (perg && perg.tipo === 'multipla' && perg.config?.opcoes) {
                      const ids = Array.isArray(valor) ? valor : [valor]
                      const textos = ids.map(idVal => perg.config.opcoes?.find(o => o.id === idVal)?.texto || idVal)
                      displayValor = textos.join(', ')
                    } else {
                      displayValor = Array.isArray(valor) ? valor.join(', ') : String(valor)
                    }
                    return (
                      <div key={pergId} className="text-xs space-y-1 border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-b-0 last:pb-0">
                        <div className="font-bold">{perg?.titulo || pergId}:</div>
                        <div className="text-zinc-500 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 break-words font-mono">
                          {displayValor}
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(respostasAcumuladas).length === 0 && (
                    <div className="text-zinc-400 text-center py-2">Nenhuma resposta acumulada.</div>
                  )}
                </div>
                <button
                  onClick={handleReiniciarPreview}
                  className="w-full rounded-2xl border border-sky-500/40 bg-sky-500/10 text-sky-600 font-bold py-3 text-sm hover:bg-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  ↺ Reiniciar Simulação
                </button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 leading-relaxed">
                Suas respostas foram registradas com sucesso no sistema.
              </p>
            )}
          </div>
          <div className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest pt-4 border-t border-zinc-100 dark:border-zinc-800">
            Andorinha Pesquisas
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative overflow-hidden font-sans">
      {/* Progress Bar */}
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 sticky top-0 z-50">
        <div 
          className="bg-sky-600 h-full transition-all duration-300 rounded-r-full"
          style={{ width: `${getProgresso()}%` }}
        ></div>
      </div>

      {/* Header */}
      <header className="py-6 px-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs">
        <div className="flex items-start md:items-center gap-4">
          <img src="/logo.png" alt="Andorinha Logo" className="h-12 w-auto object-contain shrink-0" />
          <div className="h-8 w-[1px] bg-zinc-200 dark:border-zinc-800 hidden md:block"></div>
          <div className="space-y-1">
            {objetoRelacionado && (
              <div className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sky-600 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
                  {objetoRelacionado.tipo === 'projeto' ? '📁' : '📅'} {objetoRelacionado.tipo}
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{objetoRelacionado.nome}</span>
              </div>
            )}
            {liderRelacionado && (
              <div className="text-[10px] font-semibold text-zinc-400">
                Líder Responsável: <span className="text-zinc-700 dark:text-zinc-300">{liderRelacionado.nome}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full font-bold border border-zinc-200 dark:border-zinc-700 w-fit shrink-0">
          {getProgresso()}% Concluído
        </div>
      </header>

      {/* Pergunta Container */}
      <main className="flex-1 flex items-center justify-center p-6 max-w-md mx-auto w-full">
        {(perguntaAtual || isBlock) && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAvancar()
            }}
            className="w-full space-y-8 animate-slide-in"
          >
            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold tracking-tight leading-tight">
                {isBlock ? (currentNode.data.subflowTitulo || currentNode.data.titulo || 'Bloco') : perguntaAtual?.titulo}
              </h2>
              {(!isBlock && perguntaAtual?.obrigatoria) && (
                <span className="inline-block text-[9px] bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-bold">
                  Obrigatório
                </span>
              )}
            </div>

            <div className="space-y-5">
              {isBlock ? (
                blockPerguntas.map((sub, idx) => (
                  <div key={sub.id} className="space-y-2">
                    <label className="block text-sm font-bold">
                      {sub.titulo}
                      {sub.obrigatoria && <span className="text-red-500 ml-1 font-extrabold">*</span>}
                    </label>
                    {renderCampoInput(
                      sub,
                      valorAtual[sub.id],
                      (newVal) => {
                        setValorAtual((prev: any) => ({ ...prev, [sub.id]: newVal }))
                        setErrosCampos((prev: any) => ({ ...prev, [sub.id]: '' }))
                      },
                      errosCampos[sub.id],
                      (e) => handleInputKeyDown(e, idx, blockPerguntas.length)
                    )}
                  </div>
                ))
              ) : (
                renderCampoInput(
                  perguntaAtual,
                  valorAtual,
                  (newVal) => {
                    setValorAtual(newVal)
                    setValidacaoErro('')
                  },
                  validacaoErro
                )
              )}
            </div>

            {validacaoErro && (
              <p className="text-red-500 text-sm font-semibold flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {validacaoErro}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-sky-600 py-4 font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              <span>Avançar</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-[10px] text-zinc-400 font-semibold tracking-wider shrink-0 uppercase flex justify-center items-center gap-1.5 bg-white/40 dark:bg-zinc-900/40">
        <Lock className="h-3 w-3" />
        <span>Ambiente Criptografado e Seguro</span>
      </footer>
    </div>
  )
}

export default function ResponderPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
      </div>
    }>
      <ResponderContent />
    </Suspense>
  )
}
