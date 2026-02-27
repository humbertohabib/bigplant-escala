import React, { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Calendar as CalendarIcon,
  MessageSquare,
  Plus,
  Filter,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import type { TrocaPlantao, Turno, Profissional, UsuarioAutenticado } from '../../types'

interface Props {
  usuarioLogado: UsuarioAutenticado
  apiBaseUrl: string
  profissionais: Profissional[]
  turnoInicial?: Turno | null
  onTrocaSolicitada?: () => void
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

export function GerenciadorTrocas({ 
  usuarioLogado, 
  apiBaseUrl, 
  profissionais, 
  turnoInicial,
  onTrocaSolicitada,
  authFetch
}: Props) {
  const [trocas, setTrocas] = useState<TrocaPlantao[]>([])
  const [todosTurnos, setTodosTurnos] = useState<Turno[]>([])
  const [turnosDisponiveis, setTurnosDisponiveis] = useState<Turno[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'TODAS' | 'SOLICITADA' | 'APROVADA' | 'REJEITADA'>('TODAS')
  
  // Form state
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [solicitanteId, setSolicitanteId] = useState<number>(usuarioLogado.id)
  const [novaTroca, setNovaTroca] = useState({
    idTurno: 0,
    idProfissionalDestino: 0,
    motivo: ''
  })
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false)

  const isAdminOrCoord = usuarioLogado.perfil === 'ADMIN' || usuarioLogado.perfil === 'COORDENADOR'

  // Map for quick access
  const profissionaisMap = new Map(profissionais.map(p => [p.id, p]))

  const carregarDados = async () => {
    try {
      setCarregando(true)
      setErro(null)

      // Carregar trocas
      const resTrocas = await authFetch(`${apiBaseUrl}/api/trocas`)
      if (!resTrocas.ok) throw new Error('Erro ao carregar trocas')
      const dadosTrocas: TrocaPlantao[] = await resTrocas.json()
      
      // Ordenar por data de solicitação (mais recente primeiro)
      dadosTrocas.sort((a, b) => new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime())
      setTrocas(dadosTrocas)

      // Carregar turnos para o formulário
      const resTurnos = await authFetch(`${apiBaseUrl}/api/turnos`)
      if (!resTurnos.ok) throw new Error('Erro ao carregar turnos')
      const listaTurnos: Turno[] = await resTurnos.json()
      
      setTodosTurnos(listaTurnos)

    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const filtrados = todosTurnos.filter(t => {
      const dataTurno = parseISO(t.data)
      // Filtra por profissional solicitante (usuário logado ou selecionado pelo admin)
      return t.idProfissional === solicitanteId && dataTurno >= hoje
    }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    
    setTurnosDisponiveis(filtrados)
  }, [todosTurnos, solicitanteId])

  useEffect(() => {
    if (turnoInicial) {
      // Define o profissional solicitante como o profissional do turno (ou o usuário logado se não houver)
      if (turnoInicial.idProfissional) {
        setSolicitanteId(turnoInicial.idProfissional)
      }
      setNovaTroca(prev => ({ ...prev, idTurno: turnoInicial.id }))
      setMostrandoFormulario(true)
    }
  }, [turnoInicial])

  const handleSolicitarTroca = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaTroca.idTurno || !novaTroca.idProfissionalDestino) {
      setErro('Selecione um turno e um profissional de destino')
      return
    }

    try {
      setEnviandoSolicitacao(true)
      setErro(null)

      const resposta = await authFetch(`${apiBaseUrl}/api/trocas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaTroca),
      })

      if (!resposta.ok) throw new Error('Erro ao solicitar troca')
      
      const nova: TrocaPlantao = await resposta.json()
      setTrocas(prev => [nova, ...prev])
      
      // Reset form
      setNovaTroca({
        idTurno: 0,
        idProfissionalDestino: 0,
        motivo: ''
      })
      setMostrandoFormulario(false)
      if (onTrocaSolicitada) onTrocaSolicitada()

    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviandoSolicitacao(false)
    }
  }

  const handleAcaoTroca = async (id: number, acao: 'aprovar' | 'rejeitar') => {
    try {
      const resposta = await authFetch(`${apiBaseUrl}/api/trocas/${id}/${acao}`, {
        method: 'PUT'
      })

      if (!resposta.ok) throw new Error(`Erro ao ${acao} troca`)
      
      const atualizada: TrocaPlantao = await resposta.json()
      setTrocas(prev => prev.map(t => t.id === atualizada.id ? atualizada : t))
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA': return 'bg-green-100 text-green-700 border-green-200'
      case 'REJEITADA': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADA': return <CheckCircle2 className="w-4 h-4" />
      case 'REJEITADA': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const trocasFiltradas = trocas.filter(t => 
    filtroStatus === 'TODAS' ? true : t.status === filtroStatus
  )

  const getTurnoDetalhes = (idTurno: number) => {
    // Tenta encontrar nos turnos disponíveis primeiro, senão busca na lista completa
    const turno = todosTurnos.find(t => t.id === idTurno)
    if (turno) {
      return `${format(parseISO(turno.data), 'dd/MM/yyyy')} - ${turno.tipo} (${turno.horaInicio}-${turno.horaFim})`
    }
    return `Turno #${idTurno}`
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            Trocas de Plantão
          </h2>
          <p className="text-gray-500 mt-1">Gerencie suas solicitações de troca de turno</p>
        </div>
        
        <button
          onClick={() => setMostrandoFormulario(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Solicitação
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-5 h-5" />
          {erro}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar / Form Area (Conditional or Sticky) */}
        {mostrandoFormulario && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Nova Solicitação</h3>
                <button 
                  onClick={() => {
                    setMostrandoFormulario(false)
                    if (onTrocaSolicitada) onTrocaSolicitada()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSolicitarTroca} className="space-y-4">
                {isAdminOrCoord && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profissional Solicitante
                    </label>
                    <select
                      value={solicitanteId}
                      onChange={e => {
                        setSolicitanteId(Number(e.target.value))
                        setNovaTroca(prev => ({ ...prev, idTurno: 0 })) // Reset turno selecionado ao mudar profissional
                      }}
                      className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      {[...profissionais]
                        .sort((a, b) => a.nome.localeCompare(b.nome))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nome} ({p.crm})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Turno para Troca
                  </label>
                  <select
                    required
                    value={novaTroca.idTurno}
                    onChange={e => setNovaTroca({ ...novaTroca, idTurno: Number(e.target.value) })}
                    className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value={0}>Selecione um turno...</option>
                    {turnosDisponiveis.map(turno => (
                      <option key={turno.id} value={turno.id}>
                        {format(parseISO(turno.data), "dd/MM 'às' HH:mm")} - {turno.local} ({turno.tipo})
                      </option>
                    ))}
                  </select>
                  {turnosDisponiveis.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Este profissional não possui turnos futuros para trocar.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profissional de Destino
                  </label>
                  <select
                    required
                    value={novaTroca.idProfissionalDestino}
                    onChange={e => setNovaTroca({ ...novaTroca, idProfissionalDestino: Number(e.target.value) })}
                    className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value={0}>Selecione o profissional...</option>
                    {profissionais
                      .filter(p => p.id !== solicitanteId) // Não mostrar a si mesmo (ou ao solicitante selecionado)
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p.crm})
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Motivo (Opcional)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNovaTroca(prev => ({ ...prev, motivo: 'Motivo de saúde' }))}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Motivo de saúde"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setNovaTroca(prev => ({ ...prev, motivo: 'Compromisso pessoal' }))}
                        className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                        title="Compromisso pessoal"
                      >
                        <User className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setNovaTroca(prev => ({ ...prev, motivo: 'Conflito de agenda' }))}
                        className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                        title="Conflito de agenda"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={novaTroca.motivo}
                    onChange={e => setNovaTroca({ ...novaTroca, motivo: e.target.value })}
                    className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Ex: Conflito de agenda..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviandoSolicitacao}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {enviandoSolicitacao ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Solicitação
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* List Area */}
        <div className={mostrandoFormulario ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="border-b border-gray-200 p-4 flex flex-wrap gap-2 items-center bg-gray-50">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              {(['TODAS', 'SOLICITADA', 'APROVADA', 'REJEITADA'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFiltroStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filtroStatus === status
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  {status === 'TODAS' ? 'Todas' : 
                   status === 'SOLICITADA' ? 'Pendentes' : 
                   status.charAt(0) + status.slice(1).toLowerCase() + 's'}
                </button>
              ))}
            </div>

            {/* Content */}
            {carregando ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
                <p>Carregando trocas...</p>
              </div>
            ) : trocasFiltradas.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <ArrowRightLeft className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-lg font-medium text-gray-600">Nenhuma solicitação encontrada</p>
                <p className="text-sm">Utilize o botão "Nova Solicitação" para iniciar uma troca.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {trocasFiltradas.map(troca => {
                  const origem = profissionaisMap.get(troca.idProfissionalOrigem)
                  const destino = profissionaisMap.get(troca.idProfissionalDestino)
                  const ehOrigem = usuarioLogado.id === troca.idProfissionalOrigem
                  const ehDestino = usuarioLogado.id === troca.idProfissionalDestino
                  
                  return (
                    <div key={troca.id} className="p-5 hover:bg-gray-50 transition-colors group">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        
                        {/* Info Section */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(troca.status)}`}>
                              {getStatusIcon(troca.status)}
                              {troca.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              Solicitado em {format(parseISO(troca.dataSolicitacao), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className={ehOrigem ? 'text-blue-600 font-bold' : ''}>
                                  {origem?.nome || `ID ${troca.idProfissionalOrigem}`}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                                <span className={ehDestino ? 'text-blue-600 font-bold' : ''}>
                                  {destino?.nome || `ID ${troca.idProfissionalDestino}`}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md inline-flex">
                                <CalendarIcon className="w-4 h-4 text-gray-500" />
                                {getTurnoDetalhes(troca.idTurno)}
                              </div>
                            </div>
                          </div>

                          {troca.motivo && (
                            <div className="flex items-start gap-2 text-sm text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-100">
                              <MessageSquare className="w-4 h-4 mt-0.5 text-yellow-500" />
                              <p>"{troca.motivo}"</p>
                            </div>
                          )}
                        </div>

                        {/* Actions Section */}
                        <div className="flex items-center justify-end gap-2 min-w-[140px]">
                          {troca.status === 'SOLICITADA' && (ehDestino || usuarioLogado.perfil === 'ADMIN' || usuarioLogado.perfil === 'COORDENADOR') && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => troca.id && handleAcaoTroca(troca.id, 'aprovar')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 shadow-sm transition-all"
                                title="Aprovar troca"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Aprovar
                              </button>
                              <button
                                onClick={() => troca.id && handleAcaoTroca(troca.id, 'rejeitar')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm hover:bg-red-100 transition-all"
                                title="Rejeitar troca"
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeitar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
