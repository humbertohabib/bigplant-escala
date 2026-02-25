import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Phone, 
  Building2, 
  Save,
  X,
  Loader2,
  Navigation
} from 'lucide-react'
import type { LocalAtendimento, UsuarioAutenticado } from '../../types'

interface Props {
  locais: LocalAtendimento[]
  setLocais: React.Dispatch<React.SetStateAction<LocalAtendimento[]>>
  usuarioLogado: UsuarioAutenticado
  apiBaseUrl: string
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  setErro: (erro: string | null) => void
}

export function GerenciadorLocais({
  locais,
  setLocais,
  usuarioLogado,
  apiBaseUrl,
  authFetch,
  setErro
}: Props) {
  const [termoBusca, setTermoBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  
  const [localEditando, setLocalEditando] = useState<LocalAtendimento | null>(null)
  
  const [novoLocal, setNovoLocal] = useState<LocalAtendimento>({
    nome: '',
    idHospital: 1,
    ativo: true,
    logradouro: '',
    rua: '',
    cidade: '',
    estado: '',
    pais: '',
    complemento: '',
    telefoneContato: '',
  })

  // Carregar dados ao montar
  useEffect(() => {
    const carregarLocais = async () => {
      setCarregando(true)
      try {
        const resposta = await authFetch(`${apiBaseUrl}/api/locais`)
        if (!resposta.ok) throw new Error('Erro ao carregar locais')
        const dados = await resposta.json()
        setLocais(dados)
      } catch (e) {
        setErro((e as Error).message)
      } finally {
        setCarregando(false)
      }
    }

    carregarLocais()
  }, [apiBaseUrl, authFetch, setLocais, setErro])

  // Filtrar locais
  const locaisFiltrados = locais.filter(l => 
    l.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    (l.cidade && l.cidade.toLowerCase().includes(termoBusca.toLowerCase())) ||
    (l.rua && l.rua.toLowerCase().includes(termoBusca.toLowerCase()))
  )

  const handleEditar = (l: LocalAtendimento) => {
    setLocalEditando(l)
    setNovoLocal({ ...l })
    setModalAberto(true)
    setErro(null)
  }

  const handleExcluir = async (l: LocalAtendimento) => {
    if (!l.id) return
    if (!window.confirm(`Tem certeza que deseja excluir o local ${l.nome}?`)) return
    
    try {
      const resposta = await authFetch(`${apiBaseUrl}/api/locais/${l.id}`, {
        method: 'DELETE'
      })
      
      if (!resposta.ok && resposta.status !== 204) throw new Error('Erro ao excluir local')
      
      setLocais(prev => prev.filter(item => item.id !== l.id))
      setErro(null)
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  const handleNovo = () => {
    setLocalEditando(null)
    setNovoLocal({
      nome: '',
      idHospital: 1,
      ativo: true,
      logradouro: '',
      rua: '',
      cidade: '',
      estado: '',
      pais: '',
      complemento: '',
      telefoneContato: '',
    })
    setModalAberto(true)
    setErro(null)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      const url = localEditando
        ? `${apiBaseUrl}/api/locais/${localEditando.id}`
        : `${apiBaseUrl}/api/locais`
      
      const method = localEditando ? 'PUT' : 'POST'
      
      const resposta = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoLocal),
      })

      if (!resposta.ok) {
        throw new Error('Erro ao salvar local')
      }

      const salvo: LocalAtendimento = await resposta.json()

      if (localEditando) {
        setLocais(atual => atual.map(l => l.id === salvo.id ? salvo : l))
      } else {
        setLocais(atual => [...atual, salvo])
      }

      setModalAberto(false)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Locais de Atendimento</h2>
          <p className="text-gray-500 mt-1">Gerencie os locais onde os plantões são realizados</p>
        </div>
        
        {usuarioLogado.perfil !== 'SECRETARIO' && (
          <button
            onClick={handleNovo}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Novo Local</span>
          </button>
        )}
      </div>

      {/* Barra de Ferramentas */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, cidade ou rua..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
          <Building2 size={16} />
          <span>{locaisFiltrados.length} locais encontrados</span>
        </div>
      </div>

      {/* Grid de Cards */}
      {carregando ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {locaisFiltrados.map((l) => (
            <div 
              key={l.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              {/* Indicador de Status */}
              <div className={`absolute top-0 left-0 w-1 h-full ${l.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
              
              <div className="pl-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white ${l.ativo ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{l.nome}</h3>
                      <p className="text-xs text-gray-500 font-mono">ID: {l.id}</p>
                    </div>
                  </div>
                  
                  {usuarioLogado.perfil !== 'SECRETARIO' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditar(l)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleExcluir(l)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="block">{l.rua || l.logradouro || 'Endereço não informado'}</span>
                      <span className="text-xs text-gray-500">
                        {l.cidade ? `${l.cidade}${l.estado ? ` - ${l.estado}` : ''}` : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span>{l.telefoneContato || 'Sem telefone'}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {l.ativo ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {locaisFiltrados.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium">Nenhum local encontrado</p>
              <p className="text-sm">Tente buscar por outro termo ou adicione um novo local.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSalvar}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {localEditando ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                  {localEditando ? 'Editar Local' : 'Novo Local'}
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
                {/* Dados Básicos */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={14} /> Dados Básicos
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Local *</label>
                      <input
                        required
                        type="text"
                        value={novoLocal.nome}
                        onChange={(e) => setNovoLocal({ ...novoLocal, nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: Hospital Central"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="flex items-center gap-4 h-[42px]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={novoLocal.ativo === true}
                            onChange={() => setNovoLocal({ ...novoLocal, ativo: true })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Ativo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={novoLocal.ativo === false}
                            onChange={() => setNovoLocal({ ...novoLocal, ativo: false })}
                            className="w-4 h-4 text-red-600"
                          />
                          <span className="text-sm text-gray-700">Inativo</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Navigation size={14} /> Endereço
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro / Rua</label>
                      <input
                        type="text"
                        value={novoLocal.rua || novoLocal.logradouro || ''}
                        onChange={(e) => setNovoLocal({ ...novoLocal, rua: e.target.value, logradouro: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: Av. Paulista, 1000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                      <input
                        type="text"
                        value={novoLocal.complemento || ''}
                        onChange={(e) => setNovoLocal({ ...novoLocal, complemento: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: Bloco B, 3º Andar"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={novoLocal.cidade || ''}
                        onChange={(e) => setNovoLocal({ ...novoLocal, cidade: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: São Paulo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <input
                        type="text"
                        value={novoLocal.estado || ''}
                        onChange={(e) => setNovoLocal({ ...novoLocal, estado: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: SP"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                      <input
                        type="text"
                        value={novoLocal.pais || ''}
                        onChange={(e) => setNovoLocal({ ...novoLocal, pais: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: Brasil"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Phone size={14} /> Contato
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      value={novoLocal.telefoneContato || ''}
                      onChange={(e) => setNovoLocal({ ...novoLocal, telefoneContato: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="(11) 3333-4444"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {localEditando ? 'Salvar Alterações' : 'Criar Local'}
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
