import React, { useState, useEffect } from 'react'
import { 
  format, 
  parseISO, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDate,
  isToday
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit2, 
  Plus, 
  Loader2,
  AlertCircle,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react'
import type { Disponibilidade, UsuarioAutenticado } from '../../types'

interface Props {
  usuario: UsuarioAutenticado
  apiBaseUrl: string
}

export function GerenciadorDisponibilidade({ usuario, apiBaseUrl }: Props) {
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [visualizacao, setVisualizacao] = useState<'lista' | 'calendario'>('lista')
  const [mesReferencia, setMesReferencia] = useState(new Date())
  
  // Form state
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [modoIntervalo, setModoIntervalo] = useState(false)
  const [dataFim, setDataFim] = useState('')
  const [novaDisponibilidade, setNovaDisponibilidade] = useState<Disponibilidade>({
    idHospital: 1,
    idProfissional: usuario.id ?? 0,
    data: '',
    tipoTurno: 'DIA',
    disponivel: true,
  })

  const authFetch = async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {})
    if (usuario.token) {
      headers.set('Authorization', `Bearer ${usuario.token}`)
    }
    return fetch(`${apiBaseUrl}${endpoint}`, { ...options, headers })
  }

  const carregarDisponibilidades = async () => {
    try {
      setCarregando(true)
      const resposta = await authFetch('/api/disponibilidades')
      if (!resposta.ok) throw new Error('Erro ao carregar disponibilidades')
      const dados: Disponibilidade[] = await resposta.json()
      // Filter for current user if needed, though backend usually handles this or returns all
      // For now, filtering client-side if the API returns all
      const minhas = usuario.perfil === 'MEDICO' 
        ? dados.filter(d => d.idProfissional === usuario.id)
        : dados
      
      // Sort by date descending
      setDisponibilidades(minhas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDisponibilidades()
  }, [usuario.id])

  const salvar = async () => {
    if (!novaDisponibilidade.data) {
      setErro('Selecione uma data')
      return
    }

    if (modoIntervalo && !dataFim) {
      setErro('Selecione a data final do intervalo')
      return
    }

    if (modoIntervalo && new Date(dataFim) < new Date(novaDisponibilidade.data)) {
      setErro('A data final deve ser maior ou igual à data inicial')
      return
    }

    try {
      setCarregando(true)
      setErro(null)

      if (modoIntervalo) {
        // Modo intervalo: cria múltiplas disponibilidades
        const inicio = parseISO(novaDisponibilidade.data)
        const fim = parseISO(dataFim)
        const dias = eachDayOfInterval({ start: inicio, end: fim })

        // Limita a 60 dias para evitar sobrecarga
        if (dias.length > 60) {
          throw new Error('O intervalo não pode ser superior a 60 dias')
        }

        const promessas = dias.map(dia => {
          const disp = {
            ...novaDisponibilidade,
            data: format(dia, 'yyyy-MM-dd')
          }
          return authFetch('/api/disponibilidades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(disp),
          })
        })

        await Promise.all(promessas)
      } else {
        // Modo simples (existente)
        const metodo = editandoId ? 'PUT' : 'POST'
        const url = editandoId
          ? `/api/disponibilidades/${editandoId}`
          : '/api/disponibilidades'
          
        const resposta = await authFetch(url, {
          method: metodo,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novaDisponibilidade),
        })

        if (!resposta.ok) throw new Error('Erro ao salvar disponibilidade')
      }
      
      await carregarDisponibilidades()
      
      // Reset form
      setNovaDisponibilidade({
        idHospital: 1,
        idProfissional: usuario.id ?? 0,
        data: '',
        tipoTurno: 'DIA',
        disponivel: true,
      })
      setDataFim('')
      setModoIntervalo(false)
      setEditandoId(null)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  const excluir = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta disponibilidade?')) return

    try {
      setCarregando(true)
      const resposta = await authFetch(`/api/disponibilidades/${id}`, {
        method: 'DELETE',
      })
      
      if (!resposta.ok && resposta.status !== 204) throw new Error('Erro ao remover')
      
      setDisponibilidades(prev => prev.filter(d => d.id !== id))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  const iniciarEdicao = (d: Disponibilidade) => {
    setEditandoId(d.id ?? null)
    setNovaDisponibilidade({ ...d })
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setModoIntervalo(false)
    setDataFim('')
    setNovaDisponibilidade({
      idHospital: 1,
      idProfissional: usuario.id ?? 0,
      data: '',
      tipoTurno: 'DIA',
      disponivel: true,
    })
    setErro(null)
  }

  // Calendar Helpers
  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const inicioMes = startOfMonth(mesReferencia)
  const fimMes = endOfMonth(mesReferencia)
  const inicioCalendario = startOfWeek(inicioMes)
  const fimCalendario = endOfWeek(fimMes)
  const diasCalendario = eachDayOfInterval({ start: inicioCalendario, end: fimCalendario })

  const getDisponibilidadeNoDia = (data: Date) => {
    const dataStr = format(data, 'yyyy-MM-dd')
    return disponibilidades.filter(d => d.data === dataStr)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Minha Disponibilidade
          </h2>
          <p className="text-gray-500 mt-1">Gerencie seus horários disponíveis para plantão.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setVisualizacao('lista')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                visualizacao === 'lista' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setVisualizacao('calendario')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                visualizacao === 'calendario' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Calendário
            </button>
          </div>

          {usuario.perfil !== 'MEDICO' && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm hidden md:block">
              Modo Administrativo
            </div>
          )}
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-3">
          <AlertCircle className="text-red-500 w-5 h-5" />
          <p className="text-red-700">{erro}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {editandoId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editandoId ? 'Editar Disponibilidade' : 'Nova Disponibilidade'}
            </h3>
            
            <div className="space-y-4">
              {!editandoId && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="modoIntervalo"
                    checked={modoIntervalo}
                    onChange={(e) => setModoIntervalo(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="modoIntervalo" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                    Selecionar intervalo de datas
                  </label>
                </div>
              )}

              {usuario.perfil !== 'MEDICO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Profissional</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={novaDisponibilidade.idProfissional}
                    onChange={e => setNovaDisponibilidade({ ...novaDisponibilidade, idProfissional: Number(e.target.value) })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modoIntervalo ? 'Data Inicial' : 'Data'}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pl-10"
                    value={novaDisponibilidade.data}
                    onChange={e => setNovaDisponibilidade({ ...novaDisponibilidade, data: e.target.value })}
                  />
                  <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {modoIntervalo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pl-10"
                      value={dataFim}
                      onChange={e => setDataFim(e.target.value)}
                    />
                    <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Turno</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNovaDisponibilidade({ ...novaDisponibilidade, tipoTurno: 'DIA' })}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      novaDisponibilidade.tipoTurno === 'DIA'
                        ? 'bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-300'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    ☀️ Dia
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovaDisponibilidade({ ...novaDisponibilidade, tipoTurno: 'NOITE' })}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      novaDisponibilidade.tipoTurno === 'NOITE'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-300'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🌙 Noite
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNovaDisponibilidade({ ...novaDisponibilidade, disponivel: true })}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      novaDisponibilidade.disponivel
                        ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-300'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Disponível
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovaDisponibilidade({ ...novaDisponibilidade, disponivel: false })}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      !novaDisponibilidade.disponivel
                        ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-300'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Indisponível
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={salvar}
                  disabled={carregando}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : (editandoId ? 'Atualizar' : 'Adicionar')}
                </button>
                {editandoId && (
                  <button
                    onClick={cancelarEdicao}
                    disabled={carregando}
                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-100 transition-all font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* List/Calendar Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
            {visualizacao === 'lista' ? (
              <>
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">Registros ({disponibilidades.length})</h3>
                  <button 
                    onClick={carregarDisponibilidades} 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Atualizar lista
                  </button>
                </div>
                
                {disponibilidades.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma disponibilidade registrada.</p>
                    <p className="text-sm mt-1">Use o formulário ao lado para adicionar.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                    {disponibilidades.map((d) => (
                      <div key={d.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            d.disponivel ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {d.disponivel ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {d.data ? format(parseISO(d.data), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Data inválida'}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                d.tipoTurno === 'DIA' 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {d.tipoTurno === 'DIA' ? '☀️ Dia' : '🌙 Noite'}
                              </span>
                              {usuario.perfil !== 'MEDICO' && (
                                <span className="text-gray-400">• ID Prof: {d.idProfissional}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => iniciarEdicao(d)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => d.id && excluir(d.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">
                    {format(mesReferencia, 'MMMM yyyy', { locale: ptBR })}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMesReferencia(subMonths(mesReferencia, 1))}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setMesReferencia(new Date())}
                      className="px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setMesReferencia(addMonths(mesReferencia, 1))}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-2">
                  {diasDaSemana.map(dia => (
                    <div key={dia} className="text-center text-sm font-medium text-gray-500 py-2">
                      {dia}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {diasCalendario.map((dia, i) => {
                    const isCurrentMonth = isSameMonth(dia, mesReferencia)
                    const isTodayDate = isToday(dia)
                    const disponibilidadesDia = getDisponibilidadeNoDia(dia)
                    
                    return (
                      <div 
                        key={i} 
                        className={`min-h-[100px] p-2 bg-white ${
                          !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                        } ${isTodayDate ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-sm font-medium ${
                            isTodayDate ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            {getDate(dia)}
                          </span>
                        </div>
                        
                        <div className="mt-1 space-y-1">
                          {disponibilidadesDia.map((d, idx) => (
                            <div 
                              key={idx}
                              onClick={() => iniciarEdicao(d)}
                              className={`text-xs p-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                                d.disponivel 
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100' 
                                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                              <span className="truncate">
                                {d.tipoTurno === 'DIA' ? 'Dia' : 'Noite'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Disponível</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Indisponível</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
