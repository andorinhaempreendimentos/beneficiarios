"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { dbService, type Pesquisa, type Objeto, type Lider, type Fluxo } from '@/services/pesquisasDb'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  ClipboardList, 
  GitFork, 
  Share2, 
  BarChart3, 
  Globe, 
  EyeOff,
  Check,
  FolderGit2,
  Users,
  Map
} from 'lucide-react'

export default function PesquisasPage() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([])
  const [objetos, setObjetos] = useState<Objeto[]>([])
  const [lideres, setLideres] = useState<Lider[]>([])
  const [respostasCounts, setRespostasCounts] = useState<Record<string, number>>({})
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  // Form states
  const [id, setId] = useState<string | undefined>(undefined)
  const [tokenAtual, setTokenAtual] = useState<string>('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [objetoId, setObjetoId] = useState<string>('')
  const [liderId, setLiderId] = useState<string>('')
  const [publicada, setPublicada] = useState(false)
  const [exigirCpf, setExigirCpf] = useState(false)
  const [fluxoId, setFluxoId] = useState<string>('')
  const [fluxos, setFluxos] = useState<Fluxo[]>([])

  // Quick Add States
  const [isAddingObjeto, setIsAddingObjeto] = useState<'projeto' | 'evento' | null>(null)
  const [novoObjetoNome, setNovoObjetoNome] = useState('')
  const [isAddingLider, setIsAddingLider] = useState(false)
  const [novoLiderNome, setNovoLiderNome] = useState('')

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [pesqData, objData, lidData, fluxData, countsData] = await Promise.all([
        dbService.getPesquisas(),
        dbService.getObjetos(),
        dbService.getLideres(),
        dbService.getFluxos(),
        dbService.getRespostasCounts()
      ])
      setPesquisas(pesqData)
      setObjetos(objData)
      setLideres(lidData)
      setFluxos(fluxData)
      setRespostasCounts(countsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateToken = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let token = ''
    for (let i = 0; i < 10; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  const handleOpenAdd = () => {
    setId(undefined)
    setTokenAtual('')
    setTitulo('')
    setDescricao('')
    setObjetoId(objetos[0]?.id || '')
    setLiderId('')
    setPublicada(false)
    setExigirCpf(false)
    setFluxoId(fluxos[0]?.id || '')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (p: Pesquisa) => {
    setId(p.id)
    setTokenAtual(p.token)
    setTitulo(p.titulo)
    setDescricao(p.descricao || '')
    setObjetoId(p.objeto_id || '')
    setLiderId(p.lider_id || '')
    setPublicada(p.publicada)
    setExigirCpf(p.exigir_cpf || false)
    setFluxoId(p.fluxo_id || '')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return

    setSaving(true)
    try {
      const token = id ? (tokenAtual || generateToken()) : generateToken()
      await dbService.savePesquisa({
        id,
        titulo,
        descricao,
        token,
        publicada,
        exigir_cpf: exigirCpf,
        objeto_id: objetoId || null,
        lider_id: liderId || null,
        fluxo_id: fluxoId || null
      })
      setIsModalOpen(false)
      showToast('success', id ? 'Pesquisa atualizada com sucesso!' : 'Pesquisa criada com sucesso!')
      loadAllData()
    } catch (err) {
      console.error(err)
      showToast('error', 'Erro ao salvar a pesquisa. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta pesquisa e todo o histórico de respostas?')) return
    try {
      await dbService.deletePesquisa(id)
      loadAllData()
    } catch (err) {
      console.error(err)
    }
  }

  const togglePublicada = async (p: Pesquisa) => {
    try {
      await dbService.savePesquisa({
        ...p,
        publicada: !p.publicada
      })
      showToast('success', p.publicada ? 'Pesquisa despublicada.' : 'Pesquisa publicada!')
      loadAllData()
    } catch (err) {
      console.error(err)
      showToast('error', 'Erro ao alterar status da pesquisa.')
    }
  }

  const handleSaveQuickObjeto = async () => {
    if (!novoObjetoNome.trim() || !isAddingObjeto) return
    try {
      const novoObj = await dbService.saveObjeto({
        nome: novoObjetoNome,
        tipo: isAddingObjeto,
        descricao: '',
        termo_fomento: null,
        codigo_objeto: null,
        codigo_programa: null,
        nome_programa: null
      })
      setObjetos(prev => [novoObj, ...prev])
      setObjetoId(novoObj.id)
      setNovoObjetoNome('')
      setIsAddingObjeto(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveQuickLider = async () => {
    if (!novoLiderNome.trim()) return
    try {
      const novoLid = await dbService.saveLider({
        nome: novoLiderNome,
        telefone: null,
        email: null
      })
      setLideres(prev => [novoLid, ...prev])
      setLiderId(novoLid.id)
      setNovoLiderNome('')
      setIsAddingLider(false)
    } catch (err) {
      console.error(err)
    }
  }

  const pesquisasFiltradas = pesquisas.filter(p => {
    const obj = objetos.find(ob => ob.id === p.objeto_id)
    const lid = lideres.find(l => l.id === p.lider_id)
    const termo = busca.toLowerCase()
    return (
      p.titulo.toLowerCase().includes(termo) ||
      (obj?.nome || '').toLowerCase().includes(termo) ||
      (lid?.nome || '').toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Header com Atalhos */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesquisas & Questionários</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
            Gerencie formulários, fluxos condicionais de perguntas e relatórios de campo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/pesquisas/fluxos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-xs"
          >
            <GitFork className="h-3.5 w-3.5 text-sky-500" />
            <span>Fluxos</span>
          </Link>
          <Link
            href="/pesquisas/relatorios"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-xs"
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Relatórios</span>
          </Link>
          <Link
            href="/pesquisas/territorial"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-xs"
          >
            <Map className="h-3.5 w-3.5 text-purple-500" />
            <span>Mapa</span>
          </Link>
          <Link
            href="/pesquisas/objetos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-xs"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-amber-500" />
            <span>Objetos</span>
          </Link>
          <Link
            href="/pesquisas/lideres"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-xs"
          >
            <Users className="h-3.5 w-3.5 text-indigo-500" />
            <span>Líderes</span>
          </Link>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nova Pesquisa
          </button>
        </div>
      </div>

      {!loading && pesquisas.length > 0 && (
        <div className="flex max-w-md">
          <input
            type="text"
            placeholder="Buscar por título, objeto ou líder..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all text-sm shadow-xs"
          />
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
        </div>
      ) : pesquisas.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
          <ClipboardList className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
          <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-lg">Nenhuma pesquisa encontrada</h3>
          <p className="text-zinc-500 text-sm mt-1 mb-6">Crie sua primeira pesquisa para começar a desenhar fluxos de perguntas.</p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition-all cursor-pointer shadow-xs"
          >
            Cadastrar Pesquisa
          </button>
        </div>
      ) : pesquisasFiltradas.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
          <p className="text-zinc-500 text-sm font-medium">Nenhuma pesquisa encontrada para a busca.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Pesquisa / Objeto</th>
                  <th className="p-4">Líder</th>
                  <th className="p-4 text-center">Respostas</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pesquisasFiltradas.map((p) => {
                  const obj = objetos.find(ob => ob.id === p.objeto_id)
                  const lid = lideres.find(l => l.id === p.lider_id)

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group">
                      <td className="p-4 pl-6">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 transition-colors">{p.titulo}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-zinc-500 font-medium">
                              Objeto: {obj ? `${obj.tipo === 'projeto' ? '📁' : '📅'} ${obj.nome}` : <span className="italic text-zinc-400">Sem objeto</span>}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-300 text-sm">
                        {lid?.nome || <span className="italic text-zinc-400 text-xs">Sem líder</span>}
                      </td>
                      <td className="p-4 text-center font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {respostasCounts[p.id] || 0}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => togglePublicada(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer select-none transition-colors ${
                            p.publicada
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {p.publicada ? (
                            <>
                              <Globe className="h-3 w-3" /> Publicada
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" /> Rascunho
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-1 whitespace-nowrap">
                        <Link
                          href={p.fluxo_id ? `/pesquisas/fluxos/${p.fluxo_id}/builder` : '#'}
                          className={`inline-flex items-center gap-1.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold shadow-xs transition-colors ${
                            p.fluxo_id 
                              ? 'hover:bg-sky-600 hover:text-white hover:border-sky-600 cursor-pointer' 
                              : 'opacity-40 cursor-not-allowed'
                          }`}
                          title="Desenhar Fluxo"
                          onClick={(e) => { if (!p.fluxo_id) e.preventDefault(); }}
                        >
                          <GitFork className="h-3.5 w-3.5" />
                          <span>Fluxo</span>
                        </Link>

                        <Link
                          href={`/pesquisas/${p.id}/distribuir`}
                          className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors text-xs font-semibold cursor-pointer shadow-xs"
                          title="Compartilhar"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Enviar</span>
                        </Link>

                        <Link
                          href={`/pesquisas/${p.id}/relatorios`}
                          className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors text-xs font-semibold cursor-pointer shadow-xs"
                          title="Relatórios"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span>Relatórios</span>
                        </Link>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                          title="Editar Info"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-500/10 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-red-600 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl text-zinc-900 dark:text-zinc-100">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-5">
              <h3 className="text-lg font-bold">{id ? 'Editar Pesquisa' : 'Criar Nova Pesquisa'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Título da Pesquisa
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Pesquisa de Satisfação dos Moradores"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Descrição / Objetivo
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva sobre qual tema é esta pesquisa..."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Fluxo de Perguntas
                </label>
                <select
                  required
                  value={fluxoId}
                  onChange={(e) => setFluxoId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                >
                  <option value="" disabled>Selecione um fluxo...</option>
                  {fluxos.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {isAddingObjeto ? (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Novo {isAddingObjeto === 'projeto' ? 'Projeto' : 'Evento'}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Nome..."
                          value={novoObjetoNome}
                          onChange={(e) => setNovoObjetoNome(e.target.value)}
                          className="flex-1 min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveQuickObjeto}
                          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl cursor-pointer transition-colors"
                          title="Salvar"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingObjeto(null)
                            setNovoObjetoNome('')
                          }}
                          className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl cursor-pointer transition-colors"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Objeto
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsAddingObjeto('projeto')}
                            className="text-[10px] text-sky-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus className="h-2 w-2" /> Proj
                          </button>
                          <span className="text-[10px] text-zinc-300">|</span>
                          <button
                            type="button"
                            onClick={() => setIsAddingObjeto('evento')}
                            className="text-[10px] text-purple-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus className="h-2 w-2" /> Evento
                          </button>
                        </div>
                      </div>
                      <select
                        value={objetoId}
                        onChange={(e) => setObjetoId(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                      >
                        <option value="">Sem objeto</option>
                        {objetos.map(obj => (
                          <option key={obj.id} value={obj.id}>
                            {obj.tipo === 'projeto' ? '📁' : '📅'} {obj.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  {isAddingLider ? (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Novo Líder
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Nome..."
                          value={novoLiderNome}
                          onChange={(e) => setNovoLiderNome(e.target.value)}
                          className="flex-1 min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveQuickLider}
                          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl cursor-pointer transition-colors"
                          title="Salvar"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingLider(false)
                            setNovoLiderNome('')
                          }}
                          className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl cursor-pointer transition-colors"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Líder
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsAddingLider(true)}
                          className="text-[10px] text-sky-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <Plus className="h-2.5 w-2.5" /> Novo
                        </button>
                      </div>
                      <select
                        value={liderId}
                        onChange={(e) => setLiderId(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                      >
                        <option value="">Nenhum líder</option>
                        {lideres.map(lid => (
                          <option key={lid.id} value={lid.id}>{lid.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="publicada"
                  checked={publicada}
                  onChange={(e) => setPublicada(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="publicada" className="text-xs font-semibold select-none cursor-pointer">
                  Publicar Pesquisa de imediato
                </label>
              </div>

              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="exigir_cpf"
                  checked={exigirCpf}
                  onChange={(e) => setExigirCpf(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="exigir_cpf" className="text-xs font-semibold select-none cursor-pointer">
                  Exigir CPF antes de responder
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {saving && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  {saving ? 'Salvando...' : (id ? 'Salvar Alterações' : 'Criar Pesquisa')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast de feedback */}
      {toast && typeof document !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}
          className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
              : 'bg-red-950 border-red-700 text-red-300'
          }`}
        >
          {toast.msg}
        </div>,
        document.body
      )}
    </div>
  )
}
