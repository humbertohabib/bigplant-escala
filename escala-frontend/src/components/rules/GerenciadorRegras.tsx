import React, { useState, useEffect } from 'react'
import { Save, AlertCircle, CheckCircle2, Loader2, Plus, Trash2, Settings, LayoutList, Pencil, X } from 'lucide-react'
import type { RegrasConcretas, UsuarioAutenticado, RegraConfiguracao } from '../../types'

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
  const [configuracoes, setConfiguracoes] = useState<RegraConfiguracao[]>([])
  const [configSelecionada, setConfigSelecionada] = useState<RegraConfiguracao | null>(null)
  const [regras, setRegras] = useState<RegrasConcretas | null>(null)
  
  const [carregandoConfigs, setCarregandoConfigs] = useState(false)
  const [carregandoRegras, setCarregandoRegras] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  
  const [criandoNova, setCriandoNova] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoDescricao, setNovoDescricao] = useState('')

  // Carregar configurações ao montar
  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  // Carregar regras quando uma configuração é selecionada
  useEffect(() => {
    if (configSelecionada && configSelecionada.id) {
      carregarRegras(configSelecionada.id)
    } else {
      setRegras(null)
    }
  }, [configSelecionada])

  const carregarConfiguracoes = async () => {
    setCarregandoConfigs(true)
    try {
      const idHospital = 1 // TODO: Pegar do usuário logado
      const res = await authFetch(`${apiBaseUrl}/api/regras/configuracoes/hospital/${idHospital}`)
      
      if (!res.ok) throw new Error('Erro ao carregar configurações de regras')
      
      const dados: RegraConfiguracao[] = await res.json()
      setConfiguracoes(dados)
      
      // Se não tiver nenhuma selecionada e houver configs, seleciona a primeira
      if (!configSelecionada && dados.length > 0) {
        // Tenta encontrar a Padrão, senão pega a primeira
        const padrao = dados.find(c => c.nome.includes("Padrão"))
        setConfigSelecionada(padrao || dados[0])
      }
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregandoConfigs(false)
    }
  }

  const carregarRegras = async (idConfig: number) => {
    setCarregandoRegras(true)
    try {
      const url = `${apiBaseUrl}/api/regras/configuracao/${idConfig}/parametros`
      const res = await authFetch(url)
      
      if (!res.ok) throw new Error('Erro ao carregar parâmetros da configuração')
      
      const dados = await res.json()
      setRegras(dados)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregandoRegras(false)
    }
  }

  const criarConfiguracao = async () => {
    if (!novoNome.trim()) return

    setSalvando(true)
    try {
      const idHospital = 1
      const novaConfig: RegraConfiguracao = {
        nome: novoNome,
        descricao: novoDescricao,
        idHospital,
        ativo: true
      }

      const res = await authFetch(`${apiBaseUrl}/api/regras/configuracoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaConfig)
      })

      if (!res.ok) throw new Error('Erro ao criar configuração')

      const criada: RegraConfiguracao = await res.json()
      setConfiguracoes([...configuracoes, criada])
      setConfigSelecionada(criada)
      setCriandoNova(false)
      setNovoNome('')
      setNovoDescricao('')
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const validarRegras = (regras: RegrasConcretas): string | null => {
    if (regras.maxNoitesMes !== null && regras.maxNoitesMes < 0) return "O máximo de noites por mês não pode ser negativo."
    if (regras.minDescansoHoras !== null && regras.minDescansoHoras < 0) return "O descanso mínimo não pode ser negativo."
    if (regras.maxPlantoesConsecutivos !== null && regras.maxPlantoesConsecutivos < 0) return "O máximo de plantões consecutivos não pode ser negativo."
    return null
  }

  const salvarRegras = async () => {
    if (!regras || !configSelecionada || !configSelecionada.id) return
    
    const erroValidacao = validarRegras(regras)
    if (erroValidacao) {
      setErro(erroValidacao)
      return
    }

    setSalvando(true)
    setSucesso(false)
    setErro(null)
    
    try {
      // 1. Atualizar a Configuração (Nome/Descrição) se for o caso
      // Para simplificar, estamos permitindo editar a descrição aqui no mesmo fluxo
      const resConfig = await authFetch(`${apiBaseUrl}/api/regras/configuracoes/${configSelecionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configSelecionada)
      })

      if (!resConfig.ok) throw new Error('Erro ao salvar informações da configuração')
      const configSalva: RegraConfiguracao = await resConfig.json()

      // 2. Atualizar os Parâmetros
      const urlParams = `${apiBaseUrl}/api/regras/configuracao/${configSelecionada.id}/parametros`
      const resParams = await authFetch(urlParams, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regras)
      })

      if (!resParams.ok) throw new Error('Erro ao salvar parâmetros das regras')
      
      const dadosParams = await resParams.json()
      setRegras(dadosParams)
      
      // Atualizar lista lateral
      setConfiguracoes(prev => prev.map(c => c.id === configSalva.id ? configSalva : c))
      setConfigSelecionada(configSalva)

      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
      
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const excluirConfiguracao = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta configuração?')) return

    try {
      const res = await authFetch(`${apiBaseUrl}/api/regras/configuracoes/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erro ao excluir configuração')

      const novasConfigs = configuracoes.filter(c => c.id !== id)
      setConfiguracoes(novasConfigs)
      
      if (configSelecionada?.id === id) {
        setConfigSelecionada(novasConfigs.length > 0 ? novasConfigs[0] : null)
      }
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  // Renderização do formulário unificado
  const renderFormularioRegras = () => {
    if (!configSelecionada || !regras) return null

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-blue-900">
            {configSelecionada.nome}
            {configSelecionada.nome.includes('Padrão') && (
              <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Sistema
              </span>
            )}
          </h3>
          {/* Botão de excluir removido da Padrão se desejado, ou mantido se for apenas uma config comum */}
        </div>

        {/* Campo Descrição Unificado */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição da Configuração
          </label>
          <textarea
            value={configSelecionada.descricao || ''}
            onChange={(e) => setConfigSelecionada({ ...configSelecionada, descricao: e.target.value })}
            className="w-full text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 min-h-[60px] p-2 resize-none"
            placeholder="Descreva o propósito desta configuração de regras..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardRegra
            titulo="Máximo de Noites/Mês"
            descricao="Limite máximo de plantões noturnos por profissional no mês."
            valor={regras.maxNoitesMes}
            onChange={(v) => setRegras({ ...regras, maxNoitesMes: v })}
            min={1}
            max={31}
            unidade="plantões"
          />
          
          <CardRegra
            titulo="Descanso Mínimo"
            descricao="Intervalo mínimo de horas entre o fim de um plantão e início do próximo."
            valor={regras.minDescansoHoras}
            onChange={(v) => setRegras({ ...regras, minDescansoHoras: v })}
            min={1}
            max={72}
            unidade="horas"
          />

          <CardRegra
            titulo="Máximo Consecutivos"
            descricao="Número máximo de plantões consecutivos permitidos."
            valor={regras.maxPlantoesConsecutivos}
            onChange={(v) => setRegras({ ...regras, maxPlantoesConsecutivos: v })}
            min={1}
            max={10}
            unidade="plantões"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={salvarRegras}
            disabled={salvando}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
          >
            {salvando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (carregandoConfigs && configuracoes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-2 text-gray-600">Carregando configurações...</span>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-6 p-6 max-w-7xl mx-auto">
      {/* Sidebar - Lista de Configurações */}
      <div className="w-1/3 min-w-[300px] flex flex-col gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <LayoutList size={20} />
              Configurações
            </h3>
            <button
              onClick={() => setCriandoNova(true)}
              className="p-1 hover:bg-gray-100 rounded-full text-blue-600"
              title="Nova Configuração"
            >
              <Plus size={24} />
            </button>
          </div>

          {criandoNova && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100 space-y-2">
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">Nome da Nova Configuração</label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  className="w-full text-sm border-blue-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  placeholder="Ex: Escala Verão"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">Descrição (Opcional)</label>
                <input
                  type="text"
                  value={novoDescricao}
                  onChange={e => setNovoDescricao(e.target.value)}
                  className="w-full text-sm border-blue-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  placeholder="Ex: Regras específicas para período de férias"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => {
                    setCriandoNova(false)
                    setNovoNome('')
                    setNovoDescricao('')
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={criarConfiguracao}
                  disabled={!novoNome.trim() || salvando}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {configuracoes.length === 0 && !criandoNova && (
              <p className="text-sm text-gray-500 text-center py-8">
                Nenhuma configuração encontrada.
                <br />
                Crie uma para começar.
              </p>
            )}
            
            {configuracoes.map(config => (
              <div
                key={config.id}
                onClick={() => setConfigSelecionada(config)}
                className={`
                  group flex items-center justify-between p-3 rounded-md cursor-pointer border transition-all
                  ${configSelecionada?.id === config.id
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200'
                  }
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Settings size={18} className={configSelecionada?.id === config.id ? 'text-blue-600' : 'text-gray-400'} />
                  <span className={`text-sm font-medium truncate ${configSelecionada?.id === config.id ? 'text-blue-800' : 'text-gray-700'}`}>
                    {config.nome}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (config.id) excluirConfiguracao(config.id)
                  }}
                  className={`p-1.5 rounded transition-all ${
                    !config.id 
                      ? 'opacity-0 cursor-default' 
                      : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={config.id ? "Excluir" : ""}
                  disabled={!config.id}
                >
                  {config.id && <Trash2 size={16} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Detalhes da Regra */}
      <div className="flex-1">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 h-full">
          {!configSelecionada ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Settings size={48} className="mb-4 opacity-20" />
              <p>Selecione uma configuração para editar as regras.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {configSelecionada.nome}
                    {configSelecionada.nome.includes('Padrão') && (
                      <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        Sistema
                      </span>
                    )}
                  </h2>
                  
                  {sucesso && (
                    <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 size={16} className="mr-1.5" />
                      Salvo!
                    </div>
                  )}
                </div>

                <div className="group flex items-center gap-2">
                  <p className="text-sm text-gray-500 italic">
                    {configSelecionada.descricao || 'Sem descrição definida.'}
                  </p>
                </div>
              </div>

              {carregandoRegras ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
              ) : regras ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
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

                  <div className="mt-8 flex justify-end pt-4 border-t">
                    <button
                      onClick={salvarRegras}
                      disabled={salvando}
                      className={`flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors ${
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
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>Não foi possível carregar os parâmetros desta configuração.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
