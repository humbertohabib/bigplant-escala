import React, { useState, useEffect } from 'react'
import { Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import type { RegrasConcretas, UsuarioAutenticado } from '../../types'

interface Props {
  usuarioLogado: UsuarioAutenticado
  apiBaseUrl: string
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  setErro: (erro: string | null) => void
}

export function GerenciadorRegras({
  usuarioLogado,
  apiBaseUrl,
  authFetch,
  setErro
}: Props) {
  const [regras, setRegras] = useState<RegrasConcretas | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  // Carregar regras ao montar
  useEffect(() => {
    const carregarRegras = async () => {
      setCarregando(true)
      try {
        // Assumindo ID Hospital 1 por enquanto, ou pegando do usuario se tiver
        const idHospital = 1
        const res = await authFetch(`${apiBaseUrl}/api/regras/concretas/${idHospital}`)
        
        if (!res.ok) throw new Error('Erro ao carregar regras')
        
        const dados = await res.json()
        setRegras(dados)
      } catch (e) {
        setErro((e as Error).message)
      } finally {
        setCarregando(false)
      }
    }

    carregarRegras()
  }, [apiBaseUrl, authFetch, setErro])

  const salvarRegras = async () => {
    if (!regras) return
    
    setSalvando(true)
    setSucesso(false)
    setErro(null)
    
    try {
      const idHospital = 1
      const res = await authFetch(`${apiBaseUrl}/api/regras/concretas/${idHospital}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(regras)
      })

      if (!res.ok) throw new Error('Erro ao salvar regras')
      
      const dados = await res.json()
      setRegras(dados)
      setSucesso(true)
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSucesso(false), 3000)
      
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-2 text-gray-600">Carregando regras...</span>
      </div>
    )
  }

  if (!regras) return null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Regras da Escala</h2>
          <div className="text-sm text-gray-500">
            Configure os parâmetros globais para a geração e validação da escala.
          </div>
        </div>

        {sucesso && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center border border-green-200">
            <CheckCircle2 size={20} className="mr-2" />
            Regras atualizadas com sucesso!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de plantões noturnos por mês
            </label>
            <input
              type="number"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              value={regras.maxNoitesMes ?? ''}
              onChange={(e) =>
                setRegras({
                  ...regras,
                  maxNoitesMes: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              placeholder="Ex: 4"
            />
            <p className="mt-1 text-xs text-gray-500">
              Limite máximo de plantões noturnos que um profissional pode assumir no mês.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descanso mínimo entre plantões (horas)
            </label>
            <input
              type="number"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              value={regras.minDescansoHoras ?? ''}
              onChange={(e) =>
                setRegras({
                  ...regras,
                  minDescansoHoras: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              placeholder="Ex: 11"
            />
            <p className="mt-1 text-xs text-gray-500">
              Intervalo mínimo de descanso obrigatório após o término de um plantão.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de plantões consecutivos
            </label>
            <input
              type="number"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              value={regras.maxPlantoesConsecutivos ?? ''}
              onChange={(e) =>
                setRegras({
                  ...regras,
                  maxPlantoesConsecutivos: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              placeholder="Ex: 2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Número máximo de dias seguidos que um profissional pode trabalhar.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={salvarRegras}
            disabled={salvando}
            className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              salvando ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {salvando ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2" size={18} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
