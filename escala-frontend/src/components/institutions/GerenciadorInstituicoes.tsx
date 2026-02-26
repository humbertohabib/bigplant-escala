import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Building2, 
  Save,
  X,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { InstituicaoOrganizacional, UsuarioAutenticado } from '../../types'

interface Props {
  usuarioLogado: UsuarioAutenticado
  apiBaseUrl: string
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  setErro: (erro: string | null) => void
}

export function GerenciadorInstituicoes({
  usuarioLogado,
  apiBaseUrl,
  authFetch,
  setErro
}: Props) {
  const [instituicoes, setInstituicoes] = useState<InstituicaoOrganizacional[]>([])
  const [termoBusca, setTermoBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  
  const [instituicaoEditando, setInstituicaoEditando] = useState<InstituicaoOrganizacional | null>(null)
  
  const [novaInstituicao, setNovaInstituicao] = useState<InstituicaoOrganizacional>({
    nome: '',
    ativo: true,
  })

  // Carregar dados ao montar
  useEffect(() => {
    const carregarInstituicoes = async () => {
      setCarregando(true)
      try {
        const resposta = await authFetch(`${apiBaseUrl}/api/instituicoes`)
        if (!resposta.ok) throw new Error('Erro ao carregar instituições')
        const dados = await resposta.json()
        setInstituicoes(dados)
      } catch (e) {
        setErro((e as Error).message)
      } finally {
        setCarregando(false)
      }
    }

    carregarInstituicoes()
  }, [apiBaseUrl, authFetch, setErro])

  // Filtrar instituições
  const instituicoesFiltradas = instituicoes.filter(i => 
    i.nome.toLowerCase().includes(termoBusca.toLowerCase())
  )

  const handleEditar = (i: InstituicaoOrganizacional) => {
    setInstituicaoEditando(i)
    setNovaInstituicao({ ...i })
    setModalAberto(true)
    setErro(null)
  }

  const handleExcluir = async (i: InstituicaoOrganizacional) => {
    if (!i.id) return
    if (!window.confirm(`Tem certeza que deseja excluir a instituição ${i.nome}?`)) return
    
    try {
      const resposta = await authFetch(`${apiBaseUrl}/api/instituicoes/${i.id}`, {
        method: 'DELETE'
      })
      
      if (!resposta.ok && resposta.status !== 204) throw new Error('Erro ao excluir instituição')
      
      setInstituicoes(prev => prev.filter(item => item.id !== i.id))
      setErro(null)
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  const handleNovo = () => {
    setInstituicaoEditando(null)
    setNovaInstituicao({
      nome: '',
      ativo: true,
    })
    setModalAberto(true)
    setErro(null)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      const url = instituicaoEditando
        ? `${apiBaseUrl}/api/instituicoes/${instituicaoEditando.id}`
        : `${apiBaseUrl}/api/instituicoes`
      
      const method = instituicaoEditando ? 'PUT' : 'POST'
      
      const resposta = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaInstituicao),
      })

      if (!resposta.ok) {
        throw new Error('Erro ao salvar instituição')
      }

      const salvo: InstituicaoOrganizacional = await resposta.json()

      if (instituicaoEditando) {
        setInstituicoes(atual => atual.map(i => i.id === salvo.id ? salvo : i))
      } else {
        setInstituicoes(atual => [...atual, salvo])
      }

      setModalAberto(false)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const isAdmin = usuarioLogado.perfil === 'ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Instituições Organizacionais</h2>
          <p className="text-gray-500 mt-1">Gerencie as instituições do sistema</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={handleNovo}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Nova Instituição</span>
          </button>
        )}
      </div>

      {/* Barra de Ferramentas */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
          <Building2 size={16} />
          <span>{instituicoesFiltradas.length} instituições encontradas</span>
        </div>
      </div>

      {/* Grid de Cards */}
      {carregando ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {instituicoesFiltradas.map((i) => (
            <div 
              key={i.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${i.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
              
              <div className="pl-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white ${i.ativo ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{i.nome}</h3>
                      <p className="text-xs text-gray-500 font-mono">ID: {i.id}</p>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditar(i)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleExcluir(i)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {i.ativo ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                        <XCircle size={12} />
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {instituicoesFiltradas.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium">Nenhuma instituição encontrada</p>
              <p className="text-sm">Tente buscar por outro termo ou adicione uma nova instituição.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSalvar}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {instituicaoEditando ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                  {instituicaoEditando ? 'Editar Instituição' : 'Nova Instituição'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Instituição *
                  </label>
                  <input
                    type="text"
                    required
                    value={novaInstituicao.nome}
                    onChange={(e) => setNovaInstituicao(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ex: Hospital Santa Clara"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={novaInstituicao.ativo || false}
                    onChange={(e) => setNovaInstituicao(prev => ({ ...prev, ativo: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="ativo" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                    Instituição Ativa
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={salvando}
                >
                  {salvando ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
