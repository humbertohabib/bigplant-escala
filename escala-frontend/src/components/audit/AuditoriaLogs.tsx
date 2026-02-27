import React, { useState, useEffect } from 'react'
import { Search, Filter, Eye } from 'lucide-react'
import type { UsuarioAutenticado, AuditLog } from '../../types'

interface AuditoriaLogsProps {
  usuarioLogado: UsuarioAutenticado
}

export function AuditoriaLogs({ usuarioLogado }: AuditoriaLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [logSelecionado, setLogSelecionado] = useState<AuditLog | null>(null)

  const API_URL_ENV = import.meta.env.VITE_API_URL
  const API_BASE_URL = API_URL_ENV
    ? API_URL_ENV.startsWith('http')
      ? API_URL_ENV
      : `https://${API_URL_ENV}`
    : 'http://localhost:8080'

  useEffect(() => {
    fetchLogs()
  }, [usuarioLogado])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const token = usuarioLogado.token
      
      if (!token) {
        console.error('Token não encontrado no usuário logado')
        return
      }

      let url = `${API_BASE_URL}/api/auditoria`
      
      // Se tiver filtro de usuário e for ADMIN, adiciona na query (backend já suporta)
      if (filtroUsuario && usuarioLogado.perfil === 'ADMIN') {
        url += `?usuarioIdFiltro=${filtroUsuario}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      } else {
        console.error('Erro ao buscar logs:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVisualizar = (log: AuditLog) => {
    setLogSelecionado(log)
    setModalOpen(true)
  }

  const logsFiltrados = logs.filter(log => {
    if (filtroTipo && log.actionType !== filtroTipo) return false
    if (filtroUsuario && !log.actorEmail.toLowerCase().includes(filtroUsuario.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Logs de Auditoria</h2>
          <p className="text-gray-500 mt-1">Histórico de ações do sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Filtrar por email do usuário..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todas as Ações</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE">Criação</option>
              <option value="UPDATE">Atualização</option>
              <option value="DELETE">Exclusão</option>
              <option value="VIEW">Visualização</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="p-4 font-semibold">Data/Hora</th>
                <th className="p-4 font-semibold">Usuário</th>
                <th className="p-4 font-semibold">Ação</th>
                <th className="p-4 font-semibold">Recurso</th>
                <th className="p-4 font-semibold">IP</th>
                <th className="p-4 font-semibold text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Carregando logs...
                  </td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="p-4 text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {log.actorEmail}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${log.actionType === 'DELETE' ? 'bg-red-100 text-red-700' :
                          log.actionType === 'CREATE' ? 'bg-green-100 text-green-700' :
                          log.actionType === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {log.resourceName} #{log.resourceId}
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-xs">
                      {log.ipAddress}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleVisualizar(log)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes (Snapshot) */}
      {modalOpen && logSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Detalhes da Auditoria</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <Filter size={20} className="hidden" /> {/* Placeholder icon to keep layout */}
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Snapshot Antigo */}
              <div className="border border-red-200 rounded-lg bg-red-50 p-4">
                <h4 className="font-semibold text-red-800 mb-2 border-b border-red-200 pb-2">
                  Valor Anterior (Snapshot)
                </h4>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                  {logSelecionado.oldValue 
                    ? JSON.stringify(JSON.parse(logSelecionado.oldValue), null, 2) 
                    : <span className="text-gray-400 italic">Nenhum valor anterior (Criação)</span>}
                </pre>
              </div>

              {/* Snapshot Novo */}
              <div className="border border-green-200 rounded-lg bg-green-50 p-4">
                <h4 className="font-semibold text-green-800 mb-2 border-b border-green-200 pb-2">
                  Valor Novo (Snapshot)
                </h4>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                  {logSelecionado.newValue 
                    ? JSON.stringify(JSON.parse(logSelecionado.newValue), null, 2) 
                    : <span className="text-gray-400 italic">Nenhum valor novo (Exclusão)</span>}
                </pre>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 text-right">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
