import './App.css'
import { Trash2 } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { CalendarioEscala } from './components/calendar/CalendarioEscala'
import { GerenciadorDisponibilidade } from './components/availability/GerenciadorDisponibilidade'
import { GerenciadorTrocas } from './components/exchange/GerenciadorTrocas'
import { GerenciadorProfissionais } from './components/professionals/GerenciadorProfissionais'
import { GerenciadorLocais } from './components/locations/GerenciadorLocais'
import { GerenciadorInstituicoes } from './components/institutions/GerenciadorInstituicoes'
import { GerenciadorRegras } from './components/rules/GerenciadorRegras'
import { RelatoriosIndicadores } from './components/reports/RelatoriosIndicadores'
import { AuditoriaLogs } from './components/audit/AuditoriaLogs'
import type {
  Turno,
  Escala,
  RegrasConcretas,
  RegraConfiguracao,
  Profissional,
  LocalAtendimento,
  UsuarioAutenticado,
  Aba
} from './types'

function App() {
  const API_URL_ENV = import.meta.env.VITE_API_URL
  const API_BASE_URL = API_URL_ENV
    ? API_URL_ENV.startsWith('http')
      ? API_URL_ENV
      : `https://${API_URL_ENV}`
    : 'http://localhost:8080'

  const [carregando, setCarregando] = useState(false)
  const [escala, setEscala] = useState<Escala | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<Aba>('escala')
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [configuracoesRegras, setConfiguracoesRegras] = useState<RegraConfiguracao[]>([])
  const [idRegraSelecionada, setIdRegraSelecionada] = useState<number | ''>('')
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState<string[]>([])
  const [profissionaisSelecionados, setProfissionaisSelecionados] = useState<string[]>([])

  const [locais, setLocais] = useState<LocalAtendimento[]>([])
  // Estado para passar o turno selecionado na aba Escala para o Gerenciador de Trocas
  const [turnoTrocaInicial, setTurnoTrocaInicial] = useState<Turno | null>(null)

  const [escalasDisponiveis, setEscalasDisponiveis] = useState<Escala[]>([])
  const [idEscalaSelecionada, setIdEscalaSelecionada] = useState<number | ''>('')
  const [carregandoEscala, setCarregandoEscala] = useState(false)

  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioAutenticado | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginSenha, setLoginSenha] = useState('')
  const [loginErro, setLoginErro] = useState<string | null>(null)
  
  const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            long: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Erro ao obter localização:', error)
        }
      )
    }
  }, [])

  useEffect(() => {
    if (usuarioLogado) {
      return
    }

    // Função para inicializar o botão do Google
    const initializeGoogleButton = () => {
      const google = (window as any).google
      if (!google) return

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      // console.log('Variáveis de ambiente disponíveis:', import.meta.env) // Debug
      if (!clientId) {
        console.warn(
          'VITE_GOOGLE_CLIENT_ID não configurado.\n' +
          '- Desenvolvimento local: Crie um arquivo .env.local na raiz do projeto com VITE_GOOGLE_CLIENT_ID=seu_client_id.\n' +
          '- Produção (Render): Configure a variável de ambiente no painel do serviço.'
        )
        return
      }

      const buttonContainer = document.getElementById('google-login-button')
      if (!buttonContainer) return

      // Limpa container antes de renderizar
      buttonContainer.innerHTML = ''

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            const credential = response && response.credential
            if (!credential) return
            
            setLoginErro(null)
            try {
              const resposta = await fetch(
                `${API_BASE_URL}/api/profissionais/login/google`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken: credential }),
                },
              )
              if (resposta.status === 401) {
                const erroTexto = await resposta.text()
                setLoginErro(`Não autorizado: ${erroTexto || 'Conta Google não autorizada ou falha na validação'}`)
                return
              }
              if (!resposta.ok) {
                const erroTexto = await resposta.text()
                throw new Error(`Erro ao autenticar com Google: ${erroTexto}`)
              }
              const dados: UsuarioAutenticado = await resposta.json()
              setUsuarioLogado(dados)
              setLoginSenha('')
            } catch (e) {
              setLoginErro((e as Error).message)
            }
          },
        })

        google.accounts.id.renderButton(buttonContainer, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: '280',
          text: 'signin_with',
          shape: 'pill',
        })
      } catch (error) {
        console.error('Erro ao inicializar Google Sign-In:', error)
      }
    }

    // Se já estiver carregado
    if ((window as any).google) {
      initializeGoogleButton()
      return
    }

    // Se o script já existe mas não carregou
    if (document.getElementById('google-signin-script')) {
      return
    }

    // Carrega o script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.id = 'google-signin-script'
    script.onload = initializeGoogleButton
    document.body.appendChild(script)
    
  }, [usuarioLogado, API_BASE_URL])

  useEffect(() => {
    if (usuarioLogado?.perfil === 'USUARIO') {
      setAba('restricted')
    }
  }, [usuarioLogado])

  const authFetch = useCallback((input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers || {})
    if (usuarioLogado?.token) {
      headers.append('Authorization', `Bearer ${usuarioLogado.token}`)
    }
    if (userLocation) {
      headers.append('X-Location-Lat', userLocation.lat.toString())
      headers.append('X-Location-Long', userLocation.long.toString())
    }
    return fetch(input, { ...init, headers })
  }, [usuarioLogado?.token, userLocation])

  // Carregar dados iniciais (profissionais, locais) ao logar
  useEffect(() => {
    if (usuarioLogado) {
      const carregarDadosIniciais = async () => {
        try {
          // Carregar profissionais
          const resProf = await authFetch(`${API_BASE_URL}/api/profissionais`)
          if (resProf.ok) {
            const dadosProf = await resProf.json()
            setProfissionais(dadosProf)
          }
          
          // Carregar locais (opcional, mas bom para garantir)
          const resLocais = await authFetch(`${API_BASE_URL}/api/locais`)
          if (resLocais.ok) {
            const dadosLocais = await resLocais.json()
            setLocais(dadosLocais)
          }

          // Carregar especialidades
          const resEsp = await authFetch(`${API_BASE_URL}/api/especialidades`)
          if (resEsp.ok) {
            const dadosEsp: Especialidade[] = await resEsp.json()
            setEspecialidades(dadosEsp)
          }

          // Carregar lista de escalas
          const resEscalas = await authFetch(`${API_BASE_URL}/api/escala/1/listar`)
          if (resEscalas.ok) {
            const dadosEscalas: Escala[] = await resEscalas.json()
            setEscalasDisponiveis(dadosEscalas)
            
            // Se houver escalas, seleciona a mais recente
            if (dadosEscalas.length > 0) {
              const maisRecente = dadosEscalas[0]
              setEscala(maisRecente)
              setIdEscalaSelecionada(maisRecente.id)
            }
          }

          // Carregar configurações de regras
          const resRegras = await authFetch(`${API_BASE_URL}/api/regras/configuracoes/hospital/1`)
          if (resRegras.ok) {
            const dadosRegras: RegraConfiguracao[] = await resRegras.json()
            setConfiguracoesRegras(dadosRegras)
            // Seleciona a primeira se houver
            if (dadosRegras.length > 0 && dadosRegras[0].id) {
              setIdRegraSelecionada(dadosRegras[0].id)
            }
          }

        } catch (error) {
          console.error('Erro ao carregar dados iniciais:', error)
        }
      }
      carregarDadosIniciais()
    }
  }, [usuarioLogado, API_BASE_URL, authFetch])

  // Efeito para carregar escala quando selecionada no dropdown
  useEffect(() => {
    if (!idEscalaSelecionada || !usuarioLogado) return

    const carregarEscalaSelecionada = async () => {
      try {
        setCarregandoEscala(true)
        const res = await authFetch(`${API_BASE_URL}/api/escala/${idEscalaSelecionada}`)
        if (res.ok) {
          const dados: Escala = await res.json()
          setEscala(dados)
        }
      } catch (error) {
        console.error('Erro ao carregar escala selecionada:', error)
      } finally {
        setCarregandoEscala(false)
      }
    }

    // Se já temos a escala carregada e o ID bate, não precisa buscar de novo
    if (escala?.id !== idEscalaSelecionada) {
      carregarEscalaSelecionada()
    }
  }, [idEscalaSelecionada, API_BASE_URL, authFetch])

  const excluirTurno = async (id: number) => {
    try {
      const resposta = await authFetch(`${API_BASE_URL}/api/turnos/${id}`, {
        method: 'DELETE'
      })
      if (!resposta.ok) {
        throw new Error('Erro ao excluir turno')
      }
      if (escala) {
        setEscala({
          ...escala,
          turnos: escala.turnos.filter(t => t.id !== id)
        })
      }
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  const excluirEscala = async () => {
    if (!escala || !window.confirm('Tem certeza que deseja excluir toda a escala atual? Esta ação não pode ser desfeita.')) {
      return
    }
    try {
      setCarregando(true)
      const resposta = await authFetch(`${API_BASE_URL}/api/escala/${escala.id}`, {
        method: 'DELETE'
      })
      if (!resposta.ok) {
        throw new Error('Erro ao excluir escala')
      }
      setEscala(null)
      // Atualiza lista de escalas
      const novasEscalas = escalasDisponiveis.filter(e => e.id !== escala.id)
      setEscalasDisponiveis(novasEscalas)
      if (novasEscalas.length > 0) {
        setIdEscalaSelecionada(novasEscalas[0].id)
      } else {
        setIdEscalaSelecionada('')
      }
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  const gerarEscala = async () => {
    try {
      setCarregando(true)
      setErro(null)

      const body = {
        idRegraConfiguracao: idRegraSelecionada || null,
        idsEspecialidades: especialidadesSelecionadas.length > 0 ? especialidadesSelecionadas.map(Number) : [],
        idsProfissionais: profissionaisSelecionados.length > 0 ? profissionaisSelecionados.map(Number) : []
      }

      const resposta = await authFetch(`${API_BASE_URL}/api/escala/gerar/1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!resposta.ok) {
        throw new Error(`Erro ao gerar escala: ${resposta.status}`)
      }

      const dados: Escala = await resposta.json()
      setEscala(dados)
      // Atualiza lista de escalas e seleciona a nova
      setEscalasDisponiveis([dados, ...escalasDisponiveis])
      setIdEscalaSelecionada(dados.id)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }



  const realizarLogin = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setLoginErro(null)
    const emailTrim = loginEmail.trim()
    const senhaTrim = loginSenha.trim()
    if (!emailTrim || !senhaTrim) {
      setLoginErro('Informe e-mail e senha para continuar')
      return
    }
    try {
      const resposta = await fetch(`${API_BASE_URL}/api/profissionais/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim, senha: senhaTrim }),
      })
      if (resposta.status === 401) {
        setLoginErro('Credenciais inválidas ou usuário inativo')
        return
      }
      if (!resposta.ok) {
        throw new Error('Erro ao autenticar. Tente novamente.')
      }
      const dados: UsuarioAutenticado = await resposta.json()
      setUsuarioLogado(dados)
      setLoginSenha('')
    } catch (e) {
      setLoginErro((e as Error).message)
    }
  }

  const realizarLogout = () => {
    setUsuarioLogado(null)
    setAba('escala')
  }

  if (!usuarioLogado) {
    return (
      <div className="login-container">
        <div className="login-content">
          <div className="login-brand-section">
            <div className="login-badge">BigPlant</div>
            <h1 className="login-title">Bem-vindo de volta</h1>
            <p className="login-subtitle">
              Faça login para gerenciar suas escalas e plantões.
            </p>
          </div>

          <form className="login-form" onSubmit={realizarLogin}>
            <div>
              <label className="login-label" htmlFor="login-email">
                E-mail institucional
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                className="login-input"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seu.nome@hospital.com"
              />
            </div>
            <div>
              <label className="login-label" htmlFor="login-senha">
                Senha
              </label>
              <input
                id="login-senha"
                type="password"
                autoComplete="current-password"
                className="login-input"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                placeholder="Digite sua senha"
              />
            </div>
            
            {loginErro && <div className="login-error">{loginErro}</div>}
            
            <button type="submit" className="login-button">
              Entrar no painel
            </button>
            
            <div className="login-divider">
              <span>ou entre com</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <div id="google-login-button" />
            </div>

            <div className="login-footer">
              <p>
                Não tem acesso?{' '}
                <a href="#" className="login-link">
                  Solicite ao administrador
                </a>
              </p>
            </div>
          </form>
        </div>
        
        <div className="login-hero">
          <div className="hero-content">
            <h2>Gestão Inteligente de Escalas</h2>
            <p>
              Otimize a organização de plantões, trocas e disponibilidades da sua equipe médica em um só lugar.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleSolicitarTroca = (turno: Turno) => {
    setTurnoTrocaInicial(turno)
    setAba('trocas')
  }

  return (
    <DashboardLayout
      usuario={usuarioLogado}
      abaAtual={aba}
      setAba={setAba}
      onLogout={realizarLogout}
      onUpdateUser={setUsuarioLogado}
      apiBaseUrl={API_BASE_URL}
      authFetch={authFetch}
    >

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {aba === 'restricted' && (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 rounded-lg border border-gray-200 m-4">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 max-w-md mb-6">
            Seu perfil de usuário foi criado com sucesso, mas você ainda não possui permissões para visualizar escalas ou realizar trocas.
          </p>
          <div className="bg-white p-4 rounded shadow-sm border border-gray-100 max-w-md w-full text-left">
            <h3 className="font-semibold text-gray-700 mb-2">O que fazer agora?</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
              <li>Aguarde a liberação do seu cadastro pela administração.</li>
              <li>Entre em contato com o coordenador da sua unidade.</li>
              <li>Verifique se seus dados cadastrais estão corretos.</li>
            </ul>
          </div>
        </div>
      )}

      {aba === 'escala' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
          
          {/* Barra de Seleção de Escala */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label htmlFor="escala-select" className="text-sm font-medium text-gray-700">
                Escala Visualizada:
              </label>
              <select
                id="escala-select"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 min-w-[300px]"
                value={idEscalaSelecionada}
                onChange={(e) => setIdEscalaSelecionada(e.target.value ? Number(e.target.value) : '')}
                disabled={carregandoEscala}
              >
                {escalasDisponiveis.length === 0 && <option value="">Nenhuma escala gerada</option>}
                {escalasDisponiveis.map(e => (
                  <option key={e.id} value={e.id}>
                    Escala #{e.id} - {new Date(e.dataInicio).toLocaleDateString()} até {new Date(e.dataFim).toLocaleDateString()} ({e.status})
                  </option>
                ))}
              </select>
              {carregandoEscala && <span className="text-sm text-gray-500 ml-2 animate-pulse">Carregando...</span>}
            </div>

            {escala && (usuarioLogado?.perfil === 'ADMIN' || usuarioLogado?.perfil === 'COORDENADOR') && (
              <button
                className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 disabled:opacity-50 font-medium transition-colors flex items-center shadow-sm border border-red-200"
                onClick={excluirEscala}
                disabled={carregando}
                title="Excluir esta escala"
              >
                <Trash2 size={18} className="mr-2" />
                Excluir Escala Atual
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex flex-col">
                <label htmlFor="regra-select" className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  Configuração de Regras
                </label>
                <select
                  id="regra-select"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 min-w-[250px]"
                  value={idRegraSelecionada}
                  onChange={(e) => setIdRegraSelecionada(e.target.value ? Number(e.target.value) : '')}
                  disabled={carregando}
                >
                  <option value="">Padrão (Regras do Hospital)</option>
                  {configuracoesRegras.map(config => (
                    <option key={config.id} value={config.id}>
                      {config.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="especialidade-select" className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  Especialidades (Ctrl+Click)
                </label>
                <select
                  id="especialidade-select"
                  multiple
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 min-w-[200px] h-[82px]"
                  value={especialidadesSelecionadas}
                  onChange={(e) => setEspecialidadesSelecionadas(Array.from(e.target.selectedOptions, o => o.value))}
                  disabled={carregando}
                >
                  {especialidades.map(esp => (
                    <option key={esp.id} value={esp.id}>
                      {esp.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="profissional-select" className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  Profissionais (Ctrl+Click)
                </label>
                <select
                  id="profissional-select"
                  multiple
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 min-w-[200px] h-[82px]"
                  value={profissionaisSelecionados}
                  onChange={(e) => setProfissionaisSelecionados(Array.from(e.target.selectedOptions, o => o.value))}
                  disabled={carregando}
                >
                  {profissionais
                    .filter(p => p.ativo && p.perfil === 'MEDICO')
                    .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col justify-end mt-auto pb-1">
                <button
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex items-center shadow-sm h-[42px]"
                  onClick={gerarEscala}
                  disabled={
                    carregando ||
                    (usuarioLogado &&
                      usuarioLogado.perfil !== 'ADMIN' &&
                      usuarioLogado.perfil !== 'COORDENADOR' &&
                      usuarioLogado.perfil !== 'SECRETARIO')
                  }
                >
                  {carregando ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Gerando...
                    </>
                  ) : 'Gerar Nova Escala'}
                </button>
              </div>
            </div>
            
            <div className="text-right text-sm text-gray-500 hidden md:block">
              Geração automática baseada<br/>nas regras selecionadas.
            </div>
          </div>



          <div style={{ flex: 1, minHeight: 0 }}>
             <CalendarioEscala
               escala={escala}
               usuario={usuarioLogado!}
               profissionais={profissionais}
               onSolicitarTroca={handleSolicitarTroca}
               onExcluirTurno={excluirTurno}
             />
          </div>
        </div>
      )}

      {aba === 'regras' && (
        <GerenciadorRegras
          usuarioLogado={usuarioLogado!}
          apiBaseUrl={API_BASE_URL}
          authFetch={authFetch}
          setErro={setErro}
        />
      )}

      {aba === 'relatorios' && (
        <RelatoriosIndicadores
          escala={escala}
          authFetch={authFetch}
          apiBaseUrl={API_BASE_URL}
          profissionais={profissionais}
        />
      )}

      {aba === 'auditoria' && usuarioLogado && (
        <AuditoriaLogs usuarioLogado={usuarioLogado} />
      )}


      {aba === 'profissionais' && (
        <GerenciadorProfissionais
          profissionais={profissionais}
          setProfissionais={setProfissionais}
          usuarioLogado={usuarioLogado!}
          apiBaseUrl={API_BASE_URL}
          authFetch={authFetch}
          setErro={setErro}
        />
      )}

      {aba === 'disponibilidade' && (
        <GerenciadorDisponibilidade 
          usuario={usuarioLogado!} 
          apiBaseUrl={API_BASE_URL} 
        />
      )}

      {aba === 'trocas' && (
        <GerenciadorTrocas 
          usuarioLogado={usuarioLogado!} 
          turnoInicial={turnoTrocaInicial}
          onTrocaSolicitada={() => setTurnoTrocaInicial(null)} // Limpa seleção após solicitar
          apiBaseUrl={API_BASE_URL}
          authFetch={authFetch}
          profissionais={profissionais}
        />
      )}

      {aba === 'locais' && (
        <GerenciadorLocais
          locais={locais}
          setLocais={setLocais}
          usuarioLogado={usuarioLogado!}
          apiBaseUrl={API_BASE_URL}
          authFetch={authFetch}
          setErro={setErro}
        />
      )}

      {aba === 'instituicoes' && (
        <GerenciadorInstituicoes
          usuarioLogado={usuarioLogado!}
          apiBaseUrl={API_BASE_URL}
          authFetch={authFetch}
          setErro={setErro}
        />
      )}


    </DashboardLayout>
  )
}

export default App
