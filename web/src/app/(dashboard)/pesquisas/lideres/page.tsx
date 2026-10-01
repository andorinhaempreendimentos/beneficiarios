"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { dbService, type Lider } from '@/services/pesquisasDb'
import { Plus, Edit2, Trash2, X, Users, Phone, Mail, ArrowLeft } from 'lucide-react'

export default function LideresPesquisaPage() {
  const [lideres, setLideres] = useState<Lider[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [id, setId] = useState<string | undefined>(undefined)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    loadLideres()
  }, [])

  const loadLideres = async () => {
    setLoading(true)
    try {
      const data = await dbService.getLideres()
      setLideres(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    if (!value) return value
    const phoneNumber = value.replace(/[^\d]/g, '')
    const phoneNumberLength = phoneNumber.length
    if (phoneNumberLength < 3) return phoneNumber
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value)
    setTelefone(formattedValue)
  }

  const handleOpenAdd = () => {
    setId(undefined)
    setNome('')
    setTelefone('')
    setEmail('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (l: Lider) => {
    setId(l.id)
    setNome(l.nome)
    setTelefone(l.telefone || '')
    setEmail(l.email || '')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    try {
      await dbService.saveLider({ id, nome, telefone, email })
      setIsModalOpen(false)
      loadLideres()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (liderId: string) => {
    if (!confirm('Deseja realmente excluir este líder? As pesquisas associadas continuarão existindo, mas sem líder.')) return
    try {
      await dbService.deleteLider(liderId)
      loadLideres()
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
            <h1 className="text-2xl font-bold tracking-tight">Líderes de Pesquisa</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
              Coordenadores e líderes comunitários responsáveis pela aplicação das pesquisas.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Líder
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
        </div>
      ) : lideres.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <Users className="h-12 w-12 mx-auto text-zinc-400 mb-4 opacity-50" />
          <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-lg">Nenhum líder cadastrado</h3>
          <p className="text-zinc-500 text-sm mt-1 mb-6">Cadastre os líderes que aplicarão ou coordenarão as pesquisas de campo.</p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
          >
            Cadastrar Líder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lideres.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group shadow-xs"
            >
              <div className="space-y-4">
                <h3 className="font-bold text-base group-hover:text-sky-600 transition-colors">{l.nome}</h3>
                
                <div className="space-y-2 text-sm text-zinc-500">
                  {l.telefone && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{l.telefone}</span>
                    </div>
                  )}
                  {l.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="truncate">{l.email}</span>
                    </div>
                  )}
                  {!l.telefone && !l.email && (
                    <span className="text-xs text-zinc-400 italic">Sem contato cadastrado.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <button
                  onClick={() => handleOpenEdit(l)}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(l.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-5">
              <h3 className="text-lg font-bold">{id ? 'Editar Líder' : 'Cadastrar Novo Líder'}</h3>
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
                  Nome do Líder
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria das Graças"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lider@exemplo.com"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
                />
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
                  {id ? 'Salvar Alterações' : 'Cadastrar Líder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
