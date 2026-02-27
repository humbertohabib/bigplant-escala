import './App.css'
import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { CalendarioEscala } from './components/calendar/CalendarioEscala'
import { GerenciadorDisponibilidade } from './components/availability/GerenciadorDisponibilidade'
import { GerenciadorTrocas } from './components/exchange/GerenciadorTrocas'
import { GerenciadorProfissionais } from './components/professionals/GerenciadorProfissionais'
import { GerenciadorLocais } from './components/locations/GerenciadorLocais'
import { GerenciadorInstituicoes } from './components/institutions/GerenciadorInstituicoes'
import { RelatoriosIndicadores } from './components/reports/RelatoriosIndicadores'
import { AuditoriaLogs } from './components/audit/AuditoriaLogs'
import type {
  Turno,
  Escala,
  RegrasConcretas,
  Profissional,
  TurnoCrud,
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
  const [regras, setRegras] = useState<RegrasConcretas | null>(null)
  const [salvandoRegras, setSalvandoRegras] = useState(false)
  const [aba, setAba] = useState<Aba>('escala')
  const [profissionais, setProfissionais] = useState<Profissional[]>([])


  const [turnos, setTurnos] = useState<TurnoCrud[]>([])
  const [novoTurno, setNovoTurno] = useState<TurnoCrud>({
    data: '',
    horaInicio: '',
    horaFim: '',
    tipo: 'DIA',
    local: '',
    idHospital: 1,
    idProfissional: null,
    idLocalAtendimento: null,
  })
  const [locais, setLocais] = useState<LocalAtendimento[]>([])
  const [turnoEditandoId, setTurnoEditandoId] = useState<number | null>(null)
  // Estado para passar o turno selecionado na aba Escala para o Gerenciador de Trocas
  const [turnoTrocaInicialId, setTurnoTrocaInicialId] = useState<number | null>(null)

  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioAutenticado | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginSenha, setLoginSenha] = useState('')
  const [loginErro, setLoginErro] = useState<string | null>(null)

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
      headers.set('Authorization', `Bearer ${usuarioLogado.token}`)
    }
    return fetch(input, { ...init, headers })
  }, [usuarioLogado?.token])

  const gerarEscala = async () => {
    try {
      setCarregando(true)
      setErro(null)

      const resposta = await authFetch(`${API_BASE_URL}/api/escala/gerar/1`, {
        method: 'POST',
      })

      if (!resposta.ok) {
        throw new Error(`Erro ao gerar escala: ${resposta.status}`)
      }

      const dados: Escala = await resposta.json()
      setEscala(dados)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  const carregarRegras = async () => {
    try {
      const resposta = await authFetch(`${API_BASE_URL}/api/regras/concretas/1`)
      if (!resposta.ok) {
        throw new Error('Erro ao carregar regras')
      }
      const dados: RegrasConcretas = await resposta.json()
      setRegras(dados)
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  const salvarRegras = async () => {
    if (!regras) return
    try {
      setSalvandoRegras(true)
      const resposta = await authFetch(`${API_BASE_URL}/api/regras/concretas/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regras),
      })
      if (!resposta.ok) {
        throw new Error('Erro ao salvar regras')
      }
      const dados: RegrasConcretas = await resposta.json()
      setRegras(dados)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvandoRegras(false)
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
    setTurnoTrocaInicialId(turno.id)
    setAba('trocas')
  }

  return (
    <DashboardLayout
      usuario={usuarioLogado}
      abaAtual={aba}
      setAba={setAba}
      onLogout={realizarLogout}
      onUpdateUser={setUsuarioLogado}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="text-gray-600 mb-2">Geração automática de escala para os próximos 15 dias.</p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={gerarEscala}
                disabled={
                  carregando ||
                  (usuarioLogado &&
                    usuarioLogado.perfil !== 'ADMIN' &&
                    usuarioLogado.perfil !== 'COORDENADOR' &&
                    usuarioLogado.perfil !== 'SECRETARIO')
                }
              >
                {carregando ? 'Gerando...' : 'Gerar escala próximos 15 dias'}
              </button>
            </div>
            
            {(usuarioLogado?.perfil === 'ADMIN' || usuarioLogado?.perfil === 'COORDENADOR') && (
               <div className="flex gap-2">
                 {!regras && (
                   <button 
                     onClick={carregarRegras}
                     className="text-blue-600 hover:text-blue-800 underline"
                   >
                     Configurar regras
                   </button>
                 )}
               </div>
            )}
          </div>

          {regras && (
            <div className="bg-white p-4 rounded shadow mb-4 border border-gray-200">
              <h3 className="font-semibold mb-3">Regras de Escala</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex flex-col text-sm">
                  Máximo de noites por mês
                  <input
                    type="number"
                    className="border p-1 rounded mt-1"
                    value={regras.maxNoitesMes ?? ''}
                    onChange={(e) =>
                      setRegras({
                        ...regras,
                        maxNoitesMes: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label className="flex flex-col text-sm">
                  Descanso mínimo (horas)
                  <input
                    type="number"
                    className="border p-1 rounded mt-1"
                    value={regras.minDescansoHoras ?? ''}
                    onChange={(e) =>
                      setRegras({
                        ...regras,
                        minDescansoHoras: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label className="flex flex-col text-sm">
                  Máx. plantões consecutivos
                  <input
                    type="number"
                    className="border p-1 rounded mt-1"
                    value={regras.maxPlantoesConsecutivos ?? ''}
                    onChange={(e) =>
                      setRegras({
                        ...regras,
                        maxPlantoesConsecutivos: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={salvarRegras}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                  disabled={salvandoRegras}
                >
                  {salvandoRegras ? 'Salvando...' : 'Salvar Regras'}
                </button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, minHeight: 0 }}>
             <CalendarioEscala
               escala={escala}
               usuario={usuarioLogado!}
               profissionais={profissionais}
               onSolicitarTroca={handleSolicitarTroca}
             />
          </div>
        </div>
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

      {aba === 'turnos' && (
        <section>
          <h2>Turnos</h2>
          <button
            onClick={async () => {
              try {
                const resposta = await authFetch('http://localhost:8080/api/turnos')
                if (!resposta.ok) throw new Error('Erro ao carregar turnos')
                const dados: TurnoCrud[] = await resposta.json()
                setTurnos(dados)
              } catch (e) {
                setErro((e as Error).message)
              }
            }}
          >
            Carregar turnos
          </button>
          <div style={{ marginTop: '1rem', maxWidth: 400 }}>
            <h3>{turnoEditandoId ? 'Editar turno' : 'Novo turno'}</h3>
            <label>
              Data
              <input
                type="date"
                value={novoTurno.data}
                onChange={(e) =>
                  setNovoTurno({
                    ...novoTurno,
                    data: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Início
              <input
                type="time"
                value={novoTurno.horaInicio}
                onChange={(e) =>
                  setNovoTurno({
                    ...novoTurno,
                    horaInicio: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Fim
              <input
                type="time"
                value={novoTurno.horaFim}
                onChange={(e) =>
                  setNovoTurno({
                    ...novoTurno,
                    horaFim: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Tipo
              <select
                value={novoTurno.tipo}
                onChange={(e) =>
                  setNovoTurno({
                    ...novoTurno,
                    tipo: e.target.value,
                  })
                }
              >
                <option value="DIA">DIA</option>
                <option value="NOITE">NOITE</option>
              </select>
            </label>
            <label>
              Local (texto)
              <input
                value={novoTurno.local}
                onChange={(e) =>
                  setNovoTurno({
                    ...novoTurno,
                    local: e.target.value,
                  })
                }
              />
            </label>
            <label>
              ID Profissional (opcional)
              <input
                type="number"
                value={novoTurno.idProfissional ?? ''}
                onChange={(e) =>
                  setNovoTurno({
                    ...novoTurno,
                    idProfissional: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              ID Local atendimento (opcional)
              <input
                type="number"
                value={novoTurno.idLocalAtendimento ?? ''}
                onChange={(e) =>
                  setNovoTurno({
                    ...novoTurno,
                    idLocalAtendimento: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <button
              onClick={async () => {
                try {
                  const metodo = turnoEditandoId ? 'PUT' : 'POST'
                  const url = turnoEditandoId
                    ? `http://localhost:8080/api/turnos/${turnoEditandoId}`
                    : 'http://localhost:8080/api/turnos'
                  const resposta = await authFetch(url, {
                    method: metodo,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoTurno),
                  })
                  if (!resposta.ok) throw new Error('Erro ao salvar turno')
                  const salvo: TurnoCrud = await resposta.json()
                  if (turnoEditandoId) {
                    setTurnos((atual) =>
                      atual.map((t) => (t.id === salvo.id ? salvo : t)),
                    )
                  } else {
                    setTurnos((atual) => [...atual, salvo])
                  }
                  setNovoTurno({
                    data: '',
                    horaInicio: '',
                    horaFim: '',
                    tipo: 'DIA',
                    local: '',
                    idHospital: 1,
                    idProfissional: null,
                    idLocalAtendimento: null,
                  })
                  setTurnoEditandoId(null)
                } catch (e) {
                  setErro((e as Error).message)
                }
              }}
            >
              {turnoEditandoId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
          <table style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Tipo</th>
                <th>Local</th>
                <th>Profissional</th>
                <th>Local atendimento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {turnos.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.data}</td>
                  <td>{t.horaInicio}</td>
                  <td>{t.horaFim}</td>
                  <td>{t.tipo}</td>
                  <td>{t.local}</td>
                  <td>{t.idProfissional ?? '-'}</td>
                  <td>{t.idLocalAtendimento ?? '-'}</td>
                  <td>
                    <button
                      onClick={() => {
                        setTurnoEditandoId(t.id ?? null)
                        setNovoTurno({
                          id: t.id,
                          data: t.data,
                          horaInicio: t.horaInicio,
                          horaFim: t.horaFim,
                          tipo: t.tipo,
                          local: t.local,
                          idHospital: t.idHospital,
                          idProfissional: t.idProfissional ?? null,
                          idLocalAtendimento: t.idLocalAtendimento ?? null,
                        })
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        if (!t.id) return
                        const confirmar = window.confirm(
                          `Confirmar exclusão do turno ID ${t.id} (${t.data} ${t.horaInicio}-${t.horaFim}, tipo ${t.tipo}, local ${t.local})?`,
                        )
                        if (!confirmar) return
                        try {
                          const resposta = await authFetch(
                            `http://localhost:8080/api/turnos/${t.id}`,
                            { method: 'DELETE' },
                          )
                          if (!resposta.ok && resposta.status !== 204) {
                            throw new Error('Erro ao remover turno')
                          }
                          setTurnos((atual) => atual.filter((x) => x.id !== t.id))
                        } catch (e) {
                          setErro((e as Error).message)
                        }
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {aba === 'trocas' && (
        <GerenciadorTrocas
          usuario={usuarioLogado!}
          apiBaseUrl={API_BASE_URL}
          profissionais={profissionais}
          turnoInicialId={turnoTrocaInicialId}
          onLimparTurnoInicial={() => setTurnoTrocaInicialId(null)}
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
