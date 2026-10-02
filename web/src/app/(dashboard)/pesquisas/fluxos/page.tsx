"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { dbService, type Fluxo } from '@/services/pesquisasDb'
import { CategoriasCampo } from '@/components/pesquisas/CategoriasCampo'
import { Plus, Edit2, Trash2, X, GitFork, ArrowRight, Tag, LayoutGrid, ArrowLeft } from 'lucide-react'

export default function FluxosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isCoordenador = Boolean((user as any)?.isCoordenador)

  const [fluxos, setFluxos] = useState<Fluxo[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'fluxos' | 'blocos' | 'categorias'>('fluxos')
  const [tipoModal, setTipoModal] = useState<'fluxo' | 'bloco'>('fluxo')

  // Form states
  const [id, setId] = useState<string | undefined>(undefined)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')

  useEffect(() => {
    if (isCoordenador) {
      router.replace('/pesquisas')
      return
    }
    loadFluxos()
  }, [isCoordenador, router])

  const loadFluxos = async () => {
    setLoading(true)
    try {
      const data = await dbService.getFluxos()
      setFluxos(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = (tipo: 'fluxo' | 'bloco' = 'fluxo') => {
    setId(undefined)
    setNome('')
    setDescricao('')
    setTipoModal(tipo)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (f: Fluxo) => {
    setId(f.id)
    setNome(f.nome)
    setDescricao(f.descricao || '')
    setTipoModal(f.tipo === 'bloco' ? 'bloco' : 'fluxo')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    try {
      const defaultFlowData = {
        nodes: [
          { id: 'start', type: 'start', position: { x: 250, y: 150 }, data: { label: 'Início' } },
          { id: 'end', type: 'end', position: { x: 250, y: 550 }, data: { label: 'Fim' } }
        ],
        edges: []
      }

      const existingFlow = id ? fluxos.find(f => f.id === id) : null
      const flowData = existingFlow ? existingFlow.flow_data : defaultFlowData

      await dbService.saveFluxo({ 
        id, 
        nome, 
        descricao,
        flow_data: flowData,
        tipo: tipoModal
      })
      setIsModalOpen(false)
      loadFluxos()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (flowId: string, tipo: 'fluxo' | 'bloco') => {
    const msg = tipo === 'bloco'
      ? 'Deseja realmente excluir este bloco? Fluxos que o utilizam podem parar de funcionar.'
      : 'Deseja realmente excluir este fluxo? Pesquisas associadas podem parar de funcionar.'
    if (!confirm(msg)) return
    try {
      await dbService.deleteFluxo(flowId)
      loadFluxos()
    } catch (err) {
      console.error(err)
    }
  }

  if (isCoordenador) return null

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/pesquisas"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {activeTab === 'blocos' ? 'Blocos Reutilizáveis' : 'Fluxos de Pesquisa'}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
              {activeTab === 'blocos'
                ? 'Agrupe campos em blocos reutilizáveis para usar dentro dos fluxos.'
                : 'Crie e gerencie as estruturas lógicas de perguntas reutilizáveis para suas pesquisas.'}
            </p>
          </div>
        </div>
        {activeTab === 'fluxos' && (
          <button
            onClick={() => handleOpenAdd('fluxo')}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo Fluxo
          </button>
        )}
        {activeTab === 'blocos' && (
          <button
            onClick={() => handleOpenAdd('bloco')}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo Bloco
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('fluxos')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'fluxos'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <GitFork className="h-4 w-4" />
          Fluxos
        </button>
        <button
          onClick={() => setActiveTab('blocos')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'blocos'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Blocos Reutilizáveis
        </button>
        <button
          onClick={() => setActiveTab('categorias')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'categorias'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Tag className="h-4 w-4" />
          Categorias de Campos
        </button>
      </div>

      {/* Conteúdo da tab ativa */}
      {activeTab === 'categorias' ? (
        <CategoriasCampo />
      ) : (() => {
        const tipoFiltro: 'fluxo' | 'bloco' = activeTab === 'blocos' ? 'bloco' : 'fluxo'
        const listaFiltrada = fluxos.filter(f => (f.tipo ?? 'fluxo') === tipoFiltro)
        const isBloco = activeTab === 'blocos'

        if (listaFiltrada.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/40 dark:bg-zinc-900/40">
              {isBloco
                ? <LayoutGrid className="h-12 w-12 text-sky-500 mb-4 opacity-50" />
                : <GitFork className="h-12 w-12 text-zinc-400 mb-4 opacity-50" />}
              <h3 className="text-lg font-bold">
                {isBloco ? 'Nenhum bloco criado' : 'Nenhum fluxo encontrado'}
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm mt-1">
                {isBloco
                  ? 'Crie blocos reutilizáveis clicando em "Novo Bloco" acima.'
                  : 'Comece criando um fluxo clicando em "Novo Fluxo" acima.'}
              </p>
            </div>
          )
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listaFiltrada.map((f) => (
              <div
                key={f.id}
                className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all p-6 flex flex-col justify-between shadow-xs overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="p-2.5 rounded-xl border bg-sky-500/10 text-sky-600 border-sky-500/15">
                      {isBloco ? <LayoutGrid className="h-5 w-5" /> : <GitFork className="h-5 w-5" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(f)}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
                        title="Editar Detalhes"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id, f.tipo === 'bloco' ? 'bloco' : 'fluxo')}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-600 transition-all cursor-pointer"
                        title={isBloco ? 'Excluir Bloco' : 'Excluir Fluxo'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold leading-snug group-hover:text-sky-600 transition-colors">
                      {f.nome}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                      {f.descricao || 'Sem descrição cadastrada.'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-5 flex justify-between items-center gap-4">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                    {f.created_at ? new Date(f.created_at).toLocaleDateString() : '--'}
                  </span>
                  <Link
                    href={`/pesquisas/fluxos/${f.id}/builder`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition-all"
                  >
                    <span>{isBloco ? 'Editar Bloco' : 'Desenhar Fluxo'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-5">
              <h3 className="text-lg font-bold">
                {id
                  ? (tipoModal === 'bloco' ? 'Editar Bloco' : 'Editar Fluxo')
                  : (tipoModal === 'bloco' ? 'Novo Bloco Reutilizável' : 'Novo Fluxo de Perguntas')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  {tipoModal === 'bloco' ? 'Nome do Bloco' : 'Nome do Fluxo'}
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={tipoModal === 'bloco' ? 'Ex: Endereço, Dados Pessoais...' : 'Ex: Censo Demográfico Comunitário'}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o propósito ou as regras gerais deste fluxo."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-xs transition-all"
                >
                  {id ? 'Salvar Detalhes' : (tipoModal === 'bloco' ? 'Criar Bloco' : 'Criar e Prosseguir')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
