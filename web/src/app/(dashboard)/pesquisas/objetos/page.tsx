"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { dbService, type Objeto } from '@/services/pesquisasDb'
import { Plus, Edit2, Trash2, X, FolderGit2, Calendar, FileText, Code, Tag, Info, ArrowLeft } from 'lucide-react'

export default function ObjetosPesquisaPage() {
  const [objetos, setObjetos] = useState<Objeto[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [id, setId] = useState<string | undefined>(undefined)
  const [tipo, setTipo] = useState<'projeto' | 'evento'>('projeto')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [termoFomento, setTermoFomento] = useState('')
  const [codigoObjeto, setCodigoObjeto] = useState('')
  const [codigoPrograma, setCodigoPrograma] = useState('')
  const [nomePrograma, setNomePrograma] = useState('')

  useEffect(() => {
    loadObjetos()
  }, [])

  const loadObjetos = async () => {
    setLoading(true)
    try {
      const data = await dbService.getObjetos()
      setObjetos(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setId(undefined)
    setTipo('projeto')
    setNome('')
    setDescricao('')
    setTermoFomento('')
    setCodigoObjeto('')
    setCodigoPrograma('')
    setNomePrograma('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (obj: Objeto) => {
    setId(obj.id)
    setTipo(obj.tipo)
    setNome(obj.nome)
    setDescricao(obj.descricao || '')
    setTermoFomento(obj.termo_fomento || '')
    setCodigoObjeto(obj.codigo_objeto || '')
    setCodigoPrograma(obj.codigo_programa || '')
    setNomePrograma(obj.nome_programa || '')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    try {
      await dbService.saveObjeto({
        id,
        tipo,
        nome,
        descricao: descricao || null,
        termo_fomento: termoFomento || null,
        codigo_objeto: codigoObjeto || null,
        codigo_programa: codigoPrograma || null,
        nome_programa: nomePrograma || null
      })
      setIsModalOpen(false)
      loadObjetos()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (objId: string) => {
    if (!confirm('Deseja realmente excluir este objeto e todas as pesquisas associadas?')) return
    try {
      await dbService.deleteObjeto(objId)
      loadObjetos()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/pesquisas"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Objetos das Pesquisas</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
              Projetos e eventos aos quais as pesquisas de campo estão vinculadas.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Objeto
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
        </div>
      ) : objetos.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <FolderGit2 className="h-12 w-12 mx-auto text-zinc-400 mb-4 opacity-50" />
          <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-lg">Nenhum objeto encontrado</h3>
          <p className="text-zinc-500 text-sm mt-1 mb-6">Cadastre seu primeiro projeto ou evento para organizar as pesquisas.</p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
          >
            Cadastrar Objeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {objetos.map((obj) => (
            <div
              key={obj.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group shadow-xs relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    obj.tipo === 'projeto' 
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                  }`}>
                    {obj.tipo === 'projeto' ? <FolderGit2 className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                    {obj.tipo}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base group-hover:text-sky-600 transition-colors line-clamp-1">{obj.nome}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                    {obj.descricao || 'Sem descrição cadastrada.'}
                  </p>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2 text-xs text-zinc-500">
                  {obj.termo_fomento && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>Fomento: <strong className="text-zinc-800 dark:text-zinc-200">{obj.termo_fomento}</strong></span>
                    </div>
                  )}
                  {obj.codigo_objeto && (
                    <div className="flex items-center gap-2">
                      <Code className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>Cód. Objeto: <strong className="text-zinc-800 dark:text-zinc-200">{obj.codigo_objeto}</strong></span>
                    </div>
                  )}
                  {(obj.codigo_programa || obj.nome_programa) && (
                    <div className="flex gap-2 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 mt-1">
                      <Tag className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-zinc-400">Programa</div>
                        {obj.codigo_programa && <div className="font-semibold text-zinc-800 dark:text-zinc-200">{obj.codigo_programa}</div>}
                        {obj.nome_programa && <div className="text-[11px] line-clamp-2 leading-tight text-zinc-500">{obj.nome_programa}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <button
                  onClick={() => handleOpenEdit(obj)}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(obj.id)}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-500/10 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md my-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-5">
              <h3 className="text-lg font-bold">{id ? 'Editar Objeto' : 'Criar Novo Objeto'}</h3>
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
                  Tipo de Objeto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('projeto')}
                    className={`py-2 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      tipo === 'projeto' 
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' 
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    Projeto
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('evento')}
                    className={`py-2 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      tipo === 'evento' 
                        ? 'bg-purple-500/10 text-purple-600 border-purple-500/30' 
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    Evento
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Nome do {tipo === 'projeto' ? 'Projeto' : 'Evento'}
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={`Ex: ${tipo === 'projeto' ? 'Projeto Esporte Amador 2026' : 'Semana da Inclusão'}`}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Escreva detalhes sobre o objeto..."
                  rows={2}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Termo de Fomento
                  </label>
                  <input
                    type="text"
                    value={termoFomento}
                    onChange={(e) => setTermoFomento(e.target.value)}
                    placeholder="Ex: 979754"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Código do Objeto
                  </label>
                  <input
                    type="text"
                    value={codigoObjeto}
                    onChange={(e) => setCodigoObjeto(e.target.value)}
                    placeholder="Ex: 10245"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <Info className="h-3.5 w-3.5" />
                  Programa Associado
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Código do Programa
                    </label>
                    <input
                      type="text"
                      value={codigoPrograma}
                      onChange={(e) => setCodigoPrograma(e.target.value)}
                      placeholder="Ex: 5100020250028"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Nome do Programa
                    </label>
                    <textarea
                      value={nomePrograma}
                      onChange={(e) => setNomePrograma(e.target.value)}
                      placeholder="Ex: Apoio ao Desenvolvimento..."
                      rows={2}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {id ? 'Salvar Alterações' : 'Criar Objeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
