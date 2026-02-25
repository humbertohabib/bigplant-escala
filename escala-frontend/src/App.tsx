import './App.css'
import { useEffect, useState } from 'react'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { CalendarioEscala } from './components/calendar/CalendarioEscala'
import { GerenciadorDisponibilidade } from './components/availability/GerenciadorDisponibilidade'
import { GerenciadorTrocas } from './components/exchange/GerenciadorTrocas'
import type {
  Turno,
  Escala,
  RegrasConcretas,
  Profissional,
  Disponibilidade,
  TurnoCrud,
  LocalAtendimento,
  UsuarioAutenticado,
  ResumoProfissionalPeriodo,
  IndicadoresTrocaPeriodo,
  Aba
} from './types'

// Removendo tipos duplicados pois foram movidos para types.ts

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
  const [novoProfissional, setNovoProfissional] = useState<Profissional>({
    nome: '',
    crm: '',
    idHospital: 1,
    cargaHorariaMensalMaxima: null,
    cargaHorariaMensalMinima: null,
    ativo: true,
    email: '',
    telefoneWhatsapp: '',
  })

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
  const [profissionalEditandoId, setProfissionalEditandoId] = useState<number | null>(null)

  const [turnoEditandoId, setTurnoEditandoId] = useState<number | null>(null)
  const [localEditandoId, setLocalEditandoId] = useState<number | null>(null)
  // Estado para passar o turno selecionado na aba Escala para o Gerenciador de Trocas
  const [turnoTrocaInicialId, setTurnoTrocaInicialId] = useState<number | null>(null)
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState('')
  const [dataFimRelatorio, setDataFimRelatorio] = useState('')
  const [resumoProfissionaisPeriodo, setResumoProfissionaisPeriodo] = useState<
    ResumoProfissionalPeriodo[]
  >([])
  const [indicadoresTrocasPeriodo, setIndicadoresTrocasPeriodo] =
    useState<IndicadoresTrocaPeriodo | null>(null)
  const [dataInicioComparativo, setDataInicioComparativo] = useState('')
  const [dataFimComparativo, setDataFimComparativo] = useState('')
  const [resumoProfissionaisComparativo, setResumoProfissionaisComparativo] = useState<
    ResumoProfissionalPeriodo[]
  >([])
  const [indicadoresTrocasComparativo, setIndicadoresTrocasComparativo] =
    useState<IndicadoresTrocaPeriodo | null>(null)
  const [tipoTurnoRelatorio, setTipoTurnoRelatorio] = useState<'TODOS' | 'DIA' | 'NOITE'>(
    'TODOS',
  )
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

  const authFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers || {})
    if (usuarioLogado?.token) {
      headers.set('Authorization', `Bearer ${usuarioLogado.token}`)
    }
    return fetch(input, { ...init, headers })
  }

  const baixarCsv = (nomeArquivo: string, conteudo: string) => {
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', nomeArquivo)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const nomePorProfissional: Record<number, string> = {}
  profissionais.forEach((p) => {
    if (p.id != null) {
      nomePorProfissional[p.id] = p.nome
    }
  })

  const resumoProfissionais =
    escala &&
    escala.turnos
      .filter((t) => t.idProfissional != null)
      .reduce<
        Record<
          number,
          {
            idProfissional: number
            totalPlantoes: number
            totalNoites: number
            datas: string[]
            minutosTotal: number
          }
        >
      >((acc, turno) => {
        const id = turno.idProfissional as number
        if (!acc[id]) {
          acc[id] = {
            idProfissional: id,
            totalPlantoes: 0,
            totalNoites: 0,
            datas: [],
            minutosTotal: 0,
          }
        }
        acc[id].totalPlantoes += 1
        if (turno.tipo === 'NOITE') {
          acc[id].totalNoites += 1
        }
        if (!acc[id].datas.includes(turno.data)) {
          acc[id].datas.push(turno.data)
        }
         const [inicioHora, inicioMin] = turno.horaInicio.split(':').map(Number)
         const [fimHora, fimMin] = turno.horaFim.split(':').map(Number)
         const inicioMinutos = inicioHora * 60 + inicioMin
         let fimMinutos = fimHora * 60 + fimMin
         if (fimMinutos <= inicioMinutos) {
           fimMinutos += 24 * 60
         }
         acc[id].minutosTotal += fimMinutos - inicioMinutos
        return acc
      }, {})

  const resumoProfissionaisLista =
    resumoProfissionais &&
    Object.values(resumoProfissionais).map((item) => {
      const datasOrdenadas = item.datas
        .map((d) => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime())
      let maxSeq = 0
      let seqAtual = 0
      let ultimaData: Date | null = null
      datasOrdenadas.forEach((data) => {
        if (!ultimaData) {
          seqAtual = 1
        } else {
          const diffDias = Math.round(
            (data.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24),
          )
          if (diffDias === 1) {
            seqAtual += 1
          } else if (diffDias > 1) {
            seqAtual = 1
          }
        }
        if (seqAtual > maxSeq) {
          maxSeq = seqAtual
        }
        ultimaData = data
      })
      let horasPeriodo = 0
      let horasProjecao30Dias = 0
      if (escala) {
        horasPeriodo = Math.round((item.minutosTotal / 60) * 10) / 10
        const inicioEscala = new Date(escala.dataInicio)
        const fimEscala = new Date(escala.dataFim)
        const diffDias =
          Math.round(
            (fimEscala.getTime() - inicioEscala.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1
        if (diffDias > 0) {
          const horasDia = item.minutosTotal / 60 / diffDias
          horasProjecao30Dias = Math.round(horasDia * 30 * 10) / 10
        }
      }
      return {
        idProfissional: item.idProfissional,
        nome: nomePorProfissional[item.idProfissional],
        totalPlantoes: item.totalPlantoes,
        totalNoites: item.totalNoites,
        maxConsecutivos: maxSeq,
        horasPeriodo,
        horasProjecao30Dias,
      }
    })

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
        <section>
          <h2>Relatórios e Indicadores</h2>
          
          {resumoProfissionaisLista && resumoProfissionaisLista.length > 0 ? (
            <div style={{ marginTop: '1rem' }}>
              <h3>Resumo por profissional na escala atual</h3>
              <table className="w-full border-collapse mt-4">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">Profissional</th>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Total de plantões</th>
                    <th className="p-2 border">Plantões noturnos</th>
                    <th className="p-2 border">Máx. dias consecutivos</th>
                    <th className="p-2 border">Horas no período</th>
                    <th className="p-2 border">Projeção 30 dias</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoProfissionaisLista.map((r) => {
                    const profissional = profissionais.find(
                      (p) => p.id === r.idProfissional,
                    )
                    const excedeuCarga =
                      profissional?.cargaHorariaMensalMaxima != null &&
                      r.horasProjecao30Dias >
                        profissional.cargaHorariaMensalMaxima
                    const abaixoMinima =
                      profissional?.cargaHorariaMensalMinima != null &&
                      r.horasProjecao30Dias <
                        profissional.cargaHorariaMensalMinima
                    let estilo: React.CSSProperties | undefined
                    if (excedeuCarga) {
                      estilo = { backgroundColor: '#ffe5e5' }
                    } else if (abaixoMinima) {
                      estilo = { backgroundColor: '#e5f3ff' }
                    }
                    return (
                      <tr key={r.idProfissional} style={estilo} className="border-b">
                        <td className="p-2">{r.nome ?? '-'}</td>
                        <td className="p-2">{r.idProfissional}</td>
                        <td className="p-2">{r.totalPlantoes}</td>
                        <td className="p-2">{r.totalNoites}</td>
                        <td className="p-2">{r.maxConsecutivos}</td>
                        <td className="p-2">{r.horasPeriodo}</td>
                        <td className="p-2">{r.horasProjecao30Dias}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-gray-500">Nenhum dado de escala disponível para gerar relatório. Gere uma escala primeiro.</p>
          )}
        </section>
      )}

      {aba === 'profissionais' && (
        <section>
          <h2>Profissionais</h2>
          <button
            onClick={async () => {
              try {
                const resposta = await authFetch('http://localhost:8080/api/profissionais')
                if (!resposta.ok) throw new Error('Erro ao carregar profissionais')
                const dados: Profissional[] = await resposta.json()
                setProfissionais(dados)
              } catch (e) {
                setErro((e as Error).message)
              }
            }}
          >
            Carregar profissionais
          </button>
          <div style={{ marginTop: '1rem', maxWidth: 400 }}>
            <h3>{profissionalEditandoId ? 'Editar profissional' : 'Novo profissional'}</h3>
            <label>
              Nome
              <input
                value={novoProfissional.nome}
                onChange={(e) => setNovoProfissional({ ...novoProfissional, nome: e.target.value })}
              />
            </label>
            <label>
              CRM
              <input
                value={novoProfissional.crm}
                onChange={(e) => setNovoProfissional({ ...novoProfissional, crm: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={novoProfissional.email ?? ''}
                onChange={(e) =>
                  setNovoProfissional({
                    ...novoProfissional,
                    email: e.target.value,
                  })
                }
              />
            </label>
            <label>
              WhatsApp
              <input
                value={novoProfissional.telefoneWhatsapp ?? ''}
                onChange={(e) =>
                  setNovoProfissional({
                    ...novoProfissional,
                    telefoneWhatsapp: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Perfil de acesso
              <select
                value={novoProfissional.perfil ?? 'MEDICO'}
                onChange={(e) =>
                  setNovoProfissional({
                    ...novoProfissional,
                    perfil: e.target.value,
                  })
                }
              >
                <option value="MEDICO">Médico</option>
                <option value="USUARIO">Usuário</option>
                <option value="SECRETARIO">Secretário</option>
                <option value="COORDENADOR">Coordenador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            <label>
              Senha de acesso
              <input
                type="password"
                value={novoProfissional.senha ?? ''}
                onChange={(e) =>
                  setNovoProfissional({
                    ...novoProfissional,
                    senha: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Carga horária máxima
              <input
                type="number"
                value={novoProfissional.cargaHorariaMensalMaxima ?? ''}
                onChange={(e) =>
                  setNovoProfissional({
                    ...novoProfissional,
                    cargaHorariaMensalMaxima: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            {usuarioLogado?.perfil !== 'SECRETARIO' && (
            <label>
              Carga horária mínima
              <input
                type="number"
                value={novoProfissional.cargaHorariaMensalMinima ?? ''}
                onChange={(e) =>
                  setNovoProfissional({
                    ...novoProfissional,
                    cargaHorariaMensalMinima: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            )}
            {usuarioLogado?.perfil !== 'SECRETARIO' && (
            <button
              onClick={async () => {
                try {
                  const metodo = profissionalEditandoId ? 'PUT' : 'POST'
                  const url = profissionalEditandoId
                    ? `http://localhost:8080/api/profissionais/${profissionalEditandoId}`
                    : 'http://localhost:8080/api/profissionais'
                  const resposta = await authFetch(url, {
                    method: metodo,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoProfissional),
                  })
                  if (!resposta.ok) throw new Error('Erro ao salvar profissional')
                  const salvo: Profissional = await resposta.json()
                  if (profissionalEditandoId) {
                    setProfissionais((atual) =>
                      atual.map((p) => (p.id === salvo.id ? salvo : p)),
                    )
                  } else {
                    setProfissionais((atual) => [...atual, salvo])
                  }
                  setNovoProfissional({
                    nome: '',
                    crm: '',
                    idHospital: 1,
                    cargaHorariaMensalMaxima: null,
                    cargaHorariaMensalMinima: null,
                    ativo: true,
                    email: '',
                    telefoneWhatsapp: '',
                    perfil: 'MEDICO',
                    senha: '',
                  })
                  setProfissionalEditandoId(null)
                } catch (e) {
                  setErro((e as Error).message)
                }
              }}
            >
              {profissionalEditandoId ? 'Atualizar' : 'Salvar'}
            </button>
            )}
          </div>
          <table style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>CRM</th>
                <th>Perfil</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {profissionais.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.nome}</td>
                  <td>{p.crm}</td>
                  <td>{p.perfil ?? '-'}</td>
                  <td>{p.email ?? '-'}</td>
                  <td>{p.telefoneWhatsapp ?? '-'}</td>
                  <td>
                    {usuarioLogado?.perfil !== 'SECRETARIO' && (
                      <>
                        <button
                          onClick={() => {
                            setProfissionalEditandoId(p.id ?? null)
                            setNovoProfissional({
                              nome: p.nome,
                              crm: p.crm,
                              idHospital: p.idHospital,
                              cargaHorariaMensalMaxima: p.cargaHorariaMensalMaxima ?? null,
                              cargaHorariaMensalMinima: p.cargaHorariaMensalMinima ?? null,
                              ativo: p.ativo ?? true,
                              email: p.email ?? '',
                              telefoneWhatsapp: p.telefoneWhatsapp ?? '',
                              perfil: p.perfil ?? 'MEDICO',
                              senha: '',
                            })
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={async () => {
                            if (!p.id) return
                            const confirmar = window.confirm(
                              `Confirmar exclusão do profissional ${p.nome} (CRM ${p.crm}, ID ${p.id})?`,
                            )
                            if (!confirmar) return
                            try {
                              const resposta = await authFetch(
                                `http://localhost:8080/api/profissionais/${p.id}`,
                                { method: 'DELETE' },
                              )
                              if (!resposta.ok && resposta.status !== 204) {
                                throw new Error('Erro ao remover profissional')
                              }
                              setProfissionais((atual) => atual.filter((x) => x.id !== p.id))
                            } catch (e) {
                              setErro((e as Error).message)
                            }
                          }}
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
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
        <section>
          <h2>Locais de atendimento</h2>
          <button
            onClick={async () => {
              try {
                const resposta = await authFetch('http://localhost:8080/api/locais')
                if (!resposta.ok) throw new Error('Erro ao carregar locais')
                const dados: LocalAtendimento[] = await resposta.json()
                setLocais(dados)
              } catch (e) {
                setErro((e as Error).message)
              }
            }}
          >
            Carregar locais
          </button>
          <div style={{ marginTop: '1rem', maxWidth: 400 }}>
            <h3>{localEditandoId ? 'Editar local' : 'Novo local'}</h3>
            <label>
              Nome
              <input
                value={novoLocal.nome}
                onChange={(e) =>
                  setNovoLocal({
                    ...novoLocal,
                    nome: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Logradouro
              <input
                value={novoLocal.logradouro ?? ''}
                onChange={(e) =>
                  setNovoLocal({
                    ...novoLocal,
                    logradouro: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Rua
              <input
                value={novoLocal.rua ?? ''}
                onChange={(e) =>
                  setNovoLocal({
                    ...novoLocal,
                    rua: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Cidade
              <input
                value={novoLocal.cidade ?? ''}
                onChange={(e) =>
                  setNovoLocal({
                    ...novoLocal,
                    cidade: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Estado
              <input
                value={novoLocal.estado ?? ''}
                onChange={(e) =>
                  setNovoLocal({
                    ...novoLocal,
                    estado: e.target.value,
                  })
                }
              />
            </label>
            <label>
              País
              <input
                value={novoLocal.pais ?? ''}
                onChange={(e) =>
                  setNovoLocal({
                    ...novoLocal,
                    pais: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Complemento
              <input
                value={novoLocal.complemento ?? ''}
                onChange={(e) =>
                  setNovoLocal({
                    ...novoLocal,
                    complemento: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Telefone de contato
              <input
                value={novoLocal.telefoneContato ?? ''}
                onChange={(e) =>
                  setNovoLocal({
                    ...novoLocal,
                    telefoneContato: e.target.value,
                  })
                }
              />
            </label>
            <button
              onClick={async () => {
                try {
                  const metodo = localEditandoId ? 'PUT' : 'POST'
                  const url = localEditandoId
                    ? `http://localhost:8080/api/locais/${localEditandoId}`
                    : 'http://localhost:8080/api/locais'
                  const resposta = await authFetch(url, {
                    method: metodo,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoLocal),
                  })
                  if (!resposta.ok) throw new Error('Erro ao salvar local')
                  const salvo: LocalAtendimento = await resposta.json()
                  if (localEditandoId) {
                    setLocais((atual) =>
                      atual.map((l) => (l.id === salvo.id ? salvo : l)),
                    )
                  } else {
                    setLocais((atual) => [...atual, salvo])
                  }
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
                  setLocalEditandoId(null)
                } catch (e) {
                  setErro((e as Error).message)
                }
              }}
            >
              {localEditandoId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
          <table style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Telefone</th>
                <th>Hospital</th>
                <th>Ativo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {locais.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.nome}</td>
                  <td>
                    {[l.logradouro, l.rua, l.cidade, l.estado, l.pais]
                      .filter((x) => x && x.trim().length > 0)
                      .join(', ')}
                    {l.complemento ? ` (${l.complemento})` : ''}
                  </td>
                  <td>{l.telefoneContato ?? '-'}</td>
                  <td>{l.idHospital}</td>
                  <td>{l.ativo ? 'Sim' : 'Não'}</td>
                  <td>
                    <button
                      onClick={() => {
                        setLocalEditandoId(l.id ?? null)
                        setNovoLocal({
                          id: l.id,
                          nome: l.nome,
                          idHospital: l.idHospital,
                          ativo: l.ativo ?? true,
                          logradouro: l.logradouro ?? '',
                          rua: l.rua ?? '',
                          cidade: l.cidade ?? '',
                          estado: l.estado ?? '',
                          pais: l.pais ?? '',
                          complemento: l.complemento ?? '',
                          telefoneContato: l.telefoneContato ?? '',
                        })
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        if (!l.id) return
                        const confirmar = window.confirm(
                          `Confirmar exclusão do local ${l.nome} (ID ${l.id}, hospital ${l.idHospital})?`,
                        )
                        if (!confirmar) return
                        try {
                          const resposta = await authFetch(
                            `http://localhost:8080/api/locais/${l.id}`,
                            { method: 'DELETE' },
                          )
                          if (!resposta.ok && resposta.status !== 204) {
                            throw new Error('Erro ao remover local')
                          }
                          setLocais((atual) => atual.filter((x) => x.id !== l.id))
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

      {aba === 'relatorios' && (
        <section>
          <h2>Relatórios e indicadores históricos</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <label>
              Início
              <input
                type="date"
                value={dataInicioRelatorio}
                onChange={(e) => setDataInicioRelatorio(e.target.value)}
              />
            </label>
            <label>
              Fim
              <input
                type="date"
                value={dataFimRelatorio}
                onChange={(e) => setDataFimRelatorio(e.target.value)}
              />
            </label>
            <label>
              Tipo de turno
              <select
                value={tipoTurnoRelatorio}
                onChange={(e) =>
                  setTipoTurnoRelatorio(e.target.value as 'TODOS' | 'DIA' | 'NOITE')
                }
              >
                <option value="TODOS">Todos</option>
                <option value="DIA">Apenas dia</option>
                <option value="NOITE">Apenas noite</option>
              </select>
            </label>
          </div>
          <button
            onClick={async () => {
              if (!dataInicioRelatorio || !dataFimRelatorio) {
                setErro('Informe datas de início e fim para o relatório')
                return
              }
              try {
                setErro(null)
                const urlProfissionais = `http://localhost:8080/api/relatorios/profissionais?idHospital=1&inicio=${dataInicioRelatorio}&fim=${dataFimRelatorio}&tipoTurno=${tipoTurnoRelatorio}`
                const respostaProfissionais = await authFetch(urlProfissionais)
                if (!respostaProfissionais.ok) {
                  throw new Error('Erro ao carregar relatório de profissionais')
                }
                const dadosProfissionais: ResumoProfissionalPeriodo[] =
                  await respostaProfissionais.json()
                setResumoProfissionaisPeriodo(dadosProfissionais)

                const urlTrocas = `http://localhost:8080/api/relatorios/trocas?idHospital=1&inicio=${dataInicioRelatorio}&fim=${dataFimRelatorio}&tipoTurno=${tipoTurnoRelatorio}`
                const respostaTrocas = await authFetch(urlTrocas)
                if (!respostaTrocas.ok) {
                  throw new Error('Erro ao carregar indicadores de trocas')
                }
                const dadosTrocas: IndicadoresTrocaPeriodo =
                  await respostaTrocas.json()
                setIndicadoresTrocasPeriodo(dadosTrocas)
              } catch (e) {
                setErro((e as Error).message)
              }
            }}
          >
            Carregar relatórios
          </button>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3>Período comparativo (opcional)</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
              <label>
                Início
                <input
                  type="date"
                  value={dataInicioComparativo}
                  onChange={(e) => setDataInicioComparativo(e.target.value)}
                />
              </label>
              <label>
                Fim
                <input
                  type="date"
                  value={dataFimComparativo}
                  onChange={(e) => setDataFimComparativo(e.target.value)}
                />
              </label>
            </div>
            <button
              onClick={async () => {
                if (!dataInicioComparativo || !dataFimComparativo) {
                  setErro('Informe datas de início e fim para o período comparativo')
                  return
                }
                try {
                  setErro(null)
                  const urlProfissionais = `http://localhost:8080/api/relatorios/profissionais?idHospital=1&inicio=${dataInicioComparativo}&fim=${dataFimComparativo}&tipoTurno=${tipoTurnoRelatorio}`
                  const respostaProfissionais = await authFetch(urlProfissionais)
                  if (!respostaProfissionais.ok) {
                    throw new Error('Erro ao carregar relatório comparativo de profissionais')
                  }
                  const dadosProfissionais: ResumoProfissionalPeriodo[] =
                    await respostaProfissionais.json()
                  setResumoProfissionaisComparativo(dadosProfissionais)

                  const urlTrocas = `http://localhost:8080/api/relatorios/trocas?idHospital=1&inicio=${dataInicioComparativo}&fim=${dataFimComparativo}&tipoTurno=${tipoTurnoRelatorio}`
                  const respostaTrocas = await authFetch(urlTrocas)
                  if (!respostaTrocas.ok) {
                    throw new Error('Erro ao carregar indicadores comparativos de trocas')
                  }
                  const dadosTrocas: IndicadoresTrocaPeriodo =
                    await respostaTrocas.json()
                  setIndicadoresTrocasComparativo(dadosTrocas)
                } catch (e) {
                  setErro((e as Error).message)
                }
              }}
            >
              Carregar comparativo
            </button>
          </div>

          {resumoProfissionaisPeriodo.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Resumo de carga por profissional no período</h3>
              <p>
                Período: {dataInicioRelatorio} a {dataFimRelatorio} | Tipo de turno:{' '}
                {tipoTurnoRelatorio === 'TODOS'
                  ? 'Todos'
                  : tipoTurnoRelatorio === 'DIA'
                  ? 'Apenas dia'
                  : 'Apenas noite'}
              </p>
              <button
                onClick={() => {
                  const linhas: string[] = []
                  linhas.push(
                    [
                      'Profissional',
                      'CRM',
                      'TotalPlantoes',
                      'TotalNoites',
                      'HorasTotais',
                      'CargaMinima',
                      'CargaMaxima',
                    ].join(';'),
                  )
                  resumoProfissionaisPeriodo.forEach((r) => {
                    linhas.push(
                      [
                        r.nome,
                        r.crm,
                        String(r.totalPlantoes),
                        String(r.totalNoites),
                        String(Math.round(r.horasTotais * 10) / 10),
                        r.cargaMensalMinima != null ? String(r.cargaMensalMinima) : '',
                        r.cargaMensalMaxima != null ? String(r.cargaMensalMaxima) : '',
                      ].join(';'),
                    )
                  })
                  baixarCsv('relatorio_profissionais.csv', linhas.join('\n'))
                }}
              >
                Exportar CSV (profissionais)
              </button>
              <table>
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th>CRM</th>
                    <th>Total de plantões</th>
                    <th>Plantões noturnos</th>
                    <th>Horas totais</th>
                    <th>Carga mínima</th>
                    <th>Carga máxima</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoProfissionaisPeriodo.map((r) => (
                    <tr key={r.idProfissional}>
                      <td>{r.nome}</td>
                      <td>{r.crm}</td>
                      <td>{r.totalPlantoes}</td>
                      <td>{r.totalNoites}</td>
                      <td>{Math.round(r.horasTotais * 10) / 10}</td>
                      <td>{r.cargaMensalMinima ?? '-'}</td>
                      <td>{r.cargaMensalMaxima ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {resumoProfissionaisComparativo.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Resumo de carga por profissional no período comparativo</h3>
              <p>
                Período: {dataInicioComparativo} a {dataFimComparativo} | Tipo de turno:{' '}
                {tipoTurnoRelatorio === 'TODOS'
                  ? 'Todos'
                  : tipoTurnoRelatorio === 'DIA'
                  ? 'Apenas dia'
                  : 'Apenas noite'}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th>CRM</th>
                    <th>Total de plantões</th>
                    <th>Plantões noturnos</th>
                    <th>Horas totais</th>
                    <th>Carga mínima</th>
                    <th>Carga máxima</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoProfissionaisComparativo.map((r) => (
                    <tr key={r.idProfissional}>
                      <td>{r.nome}</td>
                      <td>{r.crm}</td>
                      <td>{r.totalPlantoes}</td>
                      <td>{r.totalNoites}</td>
                      <td>{Math.round(r.horasTotais * 10) / 10}</td>
                      <td>{r.cargaMensalMinima ?? '-'}</td>
                      <td>{r.cargaMensalMaxima ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {indicadoresTrocasPeriodo && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Indicadores de trocas de plantão no período</h3>
              <p>
                Total de trocas: {indicadoresTrocasPeriodo.totalTrocas} | Solicitadas:{' '}
                {indicadoresTrocasPeriodo.totalSolicitadas} | Aprovadas:{' '}
                {indicadoresTrocasPeriodo.totalAprovadas} | Rejeitadas:{' '}
                {indicadoresTrocasPeriodo.totalRejeitadas}
              </p>
              <button
                onClick={() => {
                  const linhas: string[] = []
                  linhas.push(
                    ['TotalTrocas', 'TotalSolicitadas', 'TotalAprovadas', 'TotalRejeitadas'].join(
                      ';',
                    ),
                  )
                  linhas.push(
                    [
                      String(indicadoresTrocasPeriodo.totalTrocas),
                      String(indicadoresTrocasPeriodo.totalSolicitadas),
                      String(indicadoresTrocasPeriodo.totalAprovadas),
                      String(indicadoresTrocasPeriodo.totalRejeitadas),
                    ].join(';'),
                  )
                  if (indicadoresTrocasPeriodo.porProfissional.length > 0) {
                    linhas.push('')
                    linhas.push(
                      ['Profissional', 'CRM', 'ComoOrigem', 'ComoDestino'].join(';'),
                    )
                    indicadoresTrocasPeriodo.porProfissional.forEach((p) => {
                      linhas.push(
                        [
                          p.nome,
                          p.crm,
                          String(p.comoOrigem),
                          String(p.comoDestino),
                        ].join(';'),
                      )
                    })
                  }
                  baixarCsv('relatorio_trocas.csv', linhas.join('\n'))
                }}
              >
                Exportar CSV (trocas)
              </button>
              {indicadoresTrocasPeriodo.porProfissional.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Profissional</th>
                      <th>CRM</th>
                      <th>Como origem</th>
                      <th>Como destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicadoresTrocasPeriodo.porProfissional.map((p) => (
                      <tr key={p.idProfissional}>
                        <td>{p.nome}</td>
                        <td>{p.crm}</td>
                        <td>{p.comoOrigem}</td>
                        <td>{p.comoDestino}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {indicadoresTrocasComparativo && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Indicadores de trocas de plantão no período comparativo</h3>
              <p>
                Total de trocas: {indicadoresTrocasComparativo.totalTrocas} | Solicitadas{' '}
                {indicadoresTrocasComparativo.totalSolicitadas} | Aprovadas{' '}
                {indicadoresTrocasComparativo.totalAprovadas} | Rejeitadas{' '}
                {indicadoresTrocasComparativo.totalRejeitadas}
              </p>
              {indicadoresTrocasComparativo.porProfissional.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Profissional</th>
                      <th>CRM</th>
                      <th>Como origem</th>
                      <th>Como destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicadoresTrocasComparativo.porProfissional.map((p) => (
                      <tr key={p.idProfissional}>
                        <td>{p.nome}</td>
                        <td>{p.crm}</td>
                        <td>{p.comoOrigem}</td>
                        <td>{p.comoDestino}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      )}
    </DashboardLayout>
  )
}

export default App
