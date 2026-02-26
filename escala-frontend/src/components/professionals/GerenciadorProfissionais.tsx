import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Mail, 
  Phone, 
  User, 
  Shield, 
  Save,
  X,
  Loader2
} from 'lucide-react'
import type { Profissional, UsuarioAutenticado } from '../../types'

interface Props {
  profissionais: Profissional[]
  setProfissionais: React.Dispatch<React.SetStateAction<Profissional[]>>
  usuarioLogado: UsuarioAutenticado
  apiBaseUrl: string
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  setErro: (erro: string | null) => void
}

export function GerenciadorProfissionais({
  profissionais,
  setProfissionais,
  usuarioLogado,
  apiBaseUrl,
  authFetch,
  setErro
}: Props) {
  const [termoBusca, setTermoBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  
  const [profissionalEditando, setProfissionalEditando] = useState<Profissional | null>(null)
  
  const [novoProfissional, setNovoProfissional] = useState<Profissional>({
    nome: '',
    crm: '',
    idHospital: 1,
    cargaHorariaMensalMaxima: 0,
    cargaHorariaMensalMinima: 0,
    ativo: true,
    email: '',
    telefoneWhatsapp: '',
    perfil: 'MEDICO',
    senha: '',
    fotoPerfil: ''
  })

  // Carregar dados ao montar
  useEffect(() => {
    const carregarProfissionais = async () => {
      // Evitar recarregar se já tiver dados e não estiver explicitamente recarregando
      // Mas para garantir atualização, vamos carregar sempre que o componente montar
      // ou se a lista estiver vazia.
      // Se a lista estiver vazia, carrega. Se não, assume que App.tsx já tem.
      // Porém, como é uma aba de gestão, é bom ter dados frescos.
      setCarregando(true)
      try {
        const resposta = await authFetch(`${apiBaseUrl}/api/profissionais`)
        if (!resposta.ok) throw new Error('Erro ao carregar profissionais')
        const dados = await resposta.json()
        setProfissionais(dados)
      } catch (e) {
        setErro((e as Error).message)
      } finally {
        setCarregando(false)
      }
    }

    carregarProfissionais()
  }, [apiBaseUrl, authFetch, setProfissionais, setErro])

  // Filtrar profissionais
  const profissionaisFiltrados = profissionais.filter(p => 
    p.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    p.crm.toLowerCase().includes(termoBusca.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(termoBusca.toLowerCase()))
  )

  const handleEditar = (p: Profissional) => {
    setProfissionalEditando(p)
    setNovoProfissional({ ...p, senha: '' }) // Limpar senha ao editar para não sobrescrever acidentalmente
    setModalAberto(true)
    setErro(null)
  }

  const handleExcluir = async (p: Profissional) => {
    if (!p.id) return
    if (!window.confirm(`Tem certeza que deseja excluir o profissional ${p.nome}?`)) return
    
    // Não vamos usar setCarregando(true) aqui para não recarregar a lista toda
    // Mas seria bom ter um estado de "excluindoId" para mostrar loading no botão
    
    try {
      const resposta = await authFetch(`${apiBaseUrl}/api/profissionais/${p.id}`, {
        method: 'DELETE'
      })
      
      if (!resposta.ok && resposta.status !== 204) throw new Error('Erro ao excluir profissional')
      
      setProfissionais(prev => prev.filter(item => item.id !== p.id))
      setErro(null)
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  const handleNovo = () => {
    setProfissionalEditando(null)
    setNovoProfissional({
      nome: '',
      crm: '',
      idHospital: 1,
      cargaHorariaMensalMaxima: 0,
      cargaHorariaMensalMinima: 0,
      ativo: true,
      email: '',
      telefoneWhatsapp: '',
      perfil: 'MEDICO',
      senha: '',
      fotoPerfil: ''
    })
    setModalAberto(true)
    setErro(null)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      const url = profissionalEditando
        ? `${apiBaseUrl}/api/profissionais/${profissionalEditando.id}`
        : `${apiBaseUrl}/api/profissionais`
      
      const method = profissionalEditando ? 'PUT' : 'POST'
      
      // Preparar payload - remover senha se estiver vazia na edição
      const payload = { ...novoProfissional }
      if (profissionalEditando && !payload.senha) {
        delete payload.senha
      }

      const resposta = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!resposta.ok) {
        throw new Error('Erro ao salvar profissional')
      }

      const salvo: Profissional = await resposta.json()

      if (profissionalEditando) {
        setProfissionais(atual => atual.map(p => p.id === salvo.id ? salvo : p))
      } else {
        setProfissionais(atual => [...atual, salvo])
      }

      setModalAberto(false)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const getPerfilBadgeColor = (perfil: string | null | undefined) => {
    switch (perfil) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'COORDENADOR': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SECRETARIO': return 'bg-green-100 text-green-800 border-green-200'
      case 'USUARIO': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-orange-100 text-orange-800 border-orange-200' // MEDICO
    }
  }

  const getPerfilLabel = (perfil: string | null | undefined) => {
    switch (perfil) {
      case 'ADMIN': return 'Administrador'
      case 'COORDENADOR': return 'Coordenador'
      case 'SECRETARIO': return 'Secretário'
      case 'USUARIO': return 'Usuário Restrito'
      default: return 'Médico'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Profissionais</h2>
          <p className="text-gray-500 mt-1">Gerencie médicos e usuários do sistema</p>
        </div>
        
        {usuarioLogado.perfil !== 'SECRETARIO' && (
          <button
            onClick={handleNovo}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Novo Profissional</span>
          </button>
        )}
      </div>

      {/* Barra de Ferramentas */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, CRM ou email..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
          <User size={16} />
          <span>{profissionaisFiltrados.length} profissionais encontrados</span>
        </div>
      </div>

      {/* Grid de Cards */}
      {carregando ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profissionaisFiltrados.map((p) => (
            <div 
              key={p.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            {/* Indicador de Status */}
            <div className={`absolute top-0 left-0 w-1 h-full ${p.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
            
            <div className="pl-3">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {p.fotoPerfil ? (
                    <img 
                      src={p.fotoPerfil} 
                      alt={p.nome}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white ${p.ativo ? 'bg-blue-500' : 'bg-gray-400'}`}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{p.nome}</h3>
                    <p className="text-xs text-gray-500 font-mono">CRM: {p.crm}</p>
                  </div>
                </div>
                
                {usuarioLogado.perfil !== 'SECRETARIO' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditar(p)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleExcluir(p)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{p.email || 'Sem email'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span>{p.telefoneWhatsapp || 'Sem telefone'}</span>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPerfilBadgeColor(p.perfil)}`}>
                    {getPerfilLabel(p.perfil)}
                  </span>
                  
                  {!p.ativo && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                      Inativo
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {profissionaisFiltrados.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <User className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-lg font-medium">Nenhum profissional encontrado</p>
            <p className="text-sm">Tente buscar por outro termo ou adicione um novo profissional.</p>
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
                  {profissionalEditando ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                  {profissionalEditando ? 'Editar Profissional' : 'Novo Profissional'}
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
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <User size={14} /> Dados Pessoais
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Perfil (URL)</label>
                      <input
                        type="text"
                        value={novoProfissional.fotoPerfil || ''}
                        onChange={(e) => setNovoProfissional({ ...novoProfissional, fotoPerfil: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="https://exemplo.com/foto.jpg"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                      <input
                        required
                        type="text"
                        value={novoProfissional.nome}
                        onChange={(e) => setNovoProfissional({ ...novoProfissional, nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: Dr. João Silva"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CRM *</label>
                      <input
                        required
                        type="text"
                        value={novoProfissional.crm}
                        onChange={(e) => setNovoProfissional({ ...novoProfissional, crm: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: 12345-SP"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="flex items-center gap-4 h-[42px]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={novoProfissional.ativo === true}
                            onChange={() => setNovoProfissional({ ...novoProfissional, ativo: true })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Ativo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={novoProfissional.ativo === false}
                            onChange={() => setNovoProfissional({ ...novoProfissional, ativo: false })}
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
                    <Phone size={14} /> Contato
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={novoProfissional.email || ''}
                        onChange={(e) => setNovoProfissional({ ...novoProfissional, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                      <input
                        type="tel"
                        value={novoProfissional.telefoneWhatsapp || ''}
                        onChange={(e) => setNovoProfissional({ ...novoProfissional, telefoneWhatsapp: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Shield size={14} /> Acesso e Configurações
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                      <select
                        value={novoProfissional.perfil || 'MEDICO'}
                        onChange={(e) => setNovoProfissional({ ...novoProfissional, perfil: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                      >
                        <option value="MEDICO">Médico</option>
                        <option value="COORDENADOR">Coordenador</option>
                        <option value="SECRETARIO">Secretário</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="USUARIO">Usuário Restrito</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {profissionalEditando ? 'Nova Senha (opcional)' : 'Senha *'}
                      </label>
                      <input
                        type="password"
                        required={!profissionalEditando}
                        value={novoProfissional.senha || ''}
                        onChange={(e) => setNovoProfissional({ ...novoProfissional, senha: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder={profissionalEditando ? 'Deixe em branco para manter' : 'Senha de acesso'}
                      />
                    </div>
                  </div>

                  {novoProfissional.perfil === 'MEDICO' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded-lg">
                      <div className="col-span-2 text-sm font-medium text-gray-700 mb-2">Carga Horária Mensal (Horas)</div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Mínima</label>
                        <input
                          type="number"
                          value={novoProfissional.cargaHorariaMensalMinima || ''}
                          onChange={(e) => setNovoProfissional({ ...novoProfissional, cargaHorariaMensalMinima: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Opcional"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Máxima</label>
                        <input
                          type="number"
                          value={novoProfissional.cargaHorariaMensalMaxima || ''}
                          onChange={(e) => setNovoProfissional({ ...novoProfissional, cargaHorariaMensalMaxima: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Opcional"
                        />
                      </div>
                    </div>
                  )}
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
                      {profissionalEditando ? 'Salvar Alterações' : 'Criar Profissional'}
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
