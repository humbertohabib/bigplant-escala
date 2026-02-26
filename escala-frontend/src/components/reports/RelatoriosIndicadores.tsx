import { useState, useMemo } from 'react'
import { 
  BarChart3, 
  Calendar, 
  Download, 
  FileText, 
  Filter, 
  TrendingUp, 
  Users, 
  AlertCircle,
  Moon,
  ArrowRight
} from 'lucide-react'
import type { 
  IndicadoresTrocaPeriodo, 
  ResumoProfissionalPeriodo, 
  Profissional,
  Escala
} from '../../types'

interface Props {
  escala: Escala | null
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  apiBaseUrl: string
  profissionais: Profissional[]
}

export function RelatoriosIndicadores({ 
  escala, 
  authFetch, 
  apiBaseUrl,
  profissionais
}: Props) {
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState('')
  const [dataFimRelatorio, setDataFimRelatorio] = useState('')
  const [tipoTurnoRelatorio, setTipoTurnoRelatorio] = useState<'TODOS' | 'DIA' | 'NOITE'>('TODOS')
  
  const [resumoProfissionaisPeriodo, setResumoProfissionaisPeriodo] = useState<ResumoProfissionalPeriodo[]>([])
  const [indicadoresTrocasPeriodo, setIndicadoresTrocasPeriodo] = useState<IndicadoresTrocaPeriodo | null>(null)
  
  const [dataInicioComparativo, setDataInicioComparativo] = useState('')
  const [dataFimComparativo, setDataFimComparativo] = useState('')
  const [resumoProfissionaisComparativo, setResumoProfissionaisComparativo] = useState<ResumoProfissionalPeriodo[]>([])
  const [indicadoresTrocasComparativo, setIndicadoresTrocasComparativo] = useState<IndicadoresTrocaPeriodo | null>(null)
  
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [carregandoComparativo, setCarregandoComparativo] = useState(false)

  const resumoProfissionaisLista = useMemo(() => {
    if (!escala) return []

    const resumoProfissionais = escala.turnos
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

    return Object.values(resumoProfissionais).map((item) => {
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
      
      const profissional = profissionais.find(p => p.id === item.idProfissional)
      
      return {
        idProfissional: item.idProfissional,
        nome: profissional?.nome || 'Desconhecido',
        totalPlantoes: item.totalPlantoes,
        totalNoites: item.totalNoites,
        maxConsecutivos: maxSeq,
        horasPeriodo,
        horasProjecao30Dias,
        // Mantendo compatibilidade com uso no render
        plantoesNoturnos: item.totalNoites,
        datas: item.datas
      }
    })
  }, [escala, profissionais])

  const carregarRelatorios = async () => {
    if (!dataInicioRelatorio || !dataFimRelatorio) {
      setErro('Informe datas de início e fim para o relatório')
      return
    }
    
    setCarregando(true)
    try {
      setErro(null)
      const urlProfissionais = `${apiBaseUrl}/relatorios/profissionais?idHospital=1&inicio=${dataInicioRelatorio}&fim=${dataFimRelatorio}&tipoTurno=${tipoTurnoRelatorio}`
      const respostaProfissionais = await authFetch(urlProfissionais)
      if (!respostaProfissionais.ok) {
        throw new Error('Erro ao carregar relatório de profissionais')
      }
      const dadosProfissionais: ResumoProfissionalPeriodo[] = await respostaProfissionais.json()
      setResumoProfissionaisPeriodo(dadosProfissionais)

      const urlTrocas = `${apiBaseUrl}/relatorios/trocas?idHospital=1&inicio=${dataInicioRelatorio}&fim=${dataFimRelatorio}&tipoTurno=${tipoTurnoRelatorio}`
      const respostaTrocas = await authFetch(urlTrocas)
      if (!respostaTrocas.ok) {
        throw new Error('Erro ao carregar indicadores de trocas')
      }
      const dadosTrocas: IndicadoresTrocaPeriodo = await respostaTrocas.json()
      setIndicadoresTrocasPeriodo(dadosTrocas)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  const carregarComparativo = async () => {
    if (!dataInicioComparativo || !dataFimComparativo) {
      setErro('Informe datas de início e fim para o período comparativo')
      return
    }
    
    setCarregandoComparativo(true)
    try {
      setErro(null)
      const urlProfissionais = `${apiBaseUrl}/relatorios/profissionais?idHospital=1&inicio=${dataInicioComparativo}&fim=${dataFimComparativo}&tipoTurno=${tipoTurnoRelatorio}`
      const respostaProfissionais = await authFetch(urlProfissionais)
      if (!respostaProfissionais.ok) {
        throw new Error('Erro ao carregar relatório comparativo de profissionais')
      }
      const dadosProfissionais: ResumoProfissionalPeriodo[] = await respostaProfissionais.json()
      setResumoProfissionaisComparativo(dadosProfissionais)

      const urlTrocas = `${apiBaseUrl}/relatorios/trocas?idHospital=1&inicio=${dataInicioComparativo}&fim=${dataFimComparativo}&tipoTurno=${tipoTurnoRelatorio}`
      const respostaTrocas = await authFetch(urlTrocas)
      if (!respostaTrocas.ok) {
        throw new Error('Erro ao carregar indicadores comparativos de trocas')
      }
      const dadosTrocas: IndicadoresTrocaPeriodo = await respostaTrocas.json()
      setIndicadoresTrocasComparativo(dadosTrocas)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregandoComparativo(false)
    }
  }

  const baixarCsv = (nomeArquivo: string, conteudo: string) => {
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', nomeArquivo)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const exportarCsvProfissionais = () => {
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
      ].join(';')
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
        ].join(';')
      )
    })
    baixarCsv('relatorio_profissionais.csv', linhas.join('\n'))
  }

  const exportarCsvTrocas = () => {
    if (!indicadoresTrocasPeriodo) return
    const linhas: string[] = []
    linhas.push(['TotalTrocas', 'TotalSolicitadas', 'TotalAprovadas', 'TotalRejeitadas'].join(';'))
    linhas.push(
      [
        String(indicadoresTrocasPeriodo.totalTrocas),
        String(indicadoresTrocasPeriodo.totalSolicitadas),
        String(indicadoresTrocasPeriodo.totalAprovadas),
        String(indicadoresTrocasPeriodo.totalRejeitadas),
      ].join(';')
    )
    if (indicadoresTrocasPeriodo.porProfissional.length > 0) {
      linhas.push('')
      linhas.push(['Profissional', 'CRM', 'ComoOrigem', 'ComoDestino'].join(';'))
      indicadoresTrocasPeriodo.porProfissional.forEach((p) => {
        linhas.push(
          [
            p.nome,
            p.crm,
            String(p.comoOrigem),
            String(p.comoDestino),
          ].join(';')
        )
      })
    }
    baixarCsv('relatorio_trocas.csv', linhas.join('\n'))
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Relatórios e Indicadores
          </h2>
          <p className="text-gray-500 mt-1">Acompanhe o desempenho e métricas da escala</p>
        </div>
      </div>

      {/* Seção Escala Atual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Resumo da Escala Atual
            </h3>
            <p className="text-sm text-gray-500 mt-1">Visão geral da distribuição de carga horária na escala vigente</p>
          </div>
        </div>
        
        <div className="p-6">
          {resumoProfissionaisLista && resumoProfissionaisLista.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Profissional</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3 text-center">Total Plantões</th>
                    <th className="px-4 py-3 text-center">Noturnos</th>
                    <th className="px-4 py-3 text-center">Máx. Consecutivos</th>
                    <th className="px-4 py-3 text-center">Horas Período</th>
                    <th className="px-4 py-3 text-center">Projeção 30d</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumoProfissionaisLista.map((item) => {
                    const profissional = profissionais.find(p => p.id === item.idProfissional)
                    const excedeuCarga = profissional?.cargaHorariaMensalMaxima != null && item.horasProjecao30Dias > profissional.cargaHorariaMensalMaxima
                    const abaixoMinima = profissional?.cargaHorariaMensalMinima != null && item.horasProjecao30Dias < profissional.cargaHorariaMensalMinima
                    
                    let rowClass = "hover:bg-gray-50 transition-colors"
                    if (excedeuCarga) rowClass = "bg-red-50 hover:bg-red-100 transition-colors"
                    else if (abaixoMinima) rowClass = "bg-blue-50 hover:bg-blue-100 transition-colors"

                    return (
                      <tr key={item.idProfissional} className={rowClass}>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                        <td className="px-4 py-3 text-gray-500">#{item.idProfissional}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800 shadow-sm">
                            {item.datas.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.plantoesNoturnos > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                            {item.plantoesNoturnos}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">{item.maxConsecutivos}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{item.horasPeriodo}h</td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-800">
                          {item.horasProjecao30Dias}h
                          {excedeuCarga && <span className="ml-1 text-xs text-red-600">(Max: {profissional?.cargaHorariaMensalMaxima})</span>}
                          {abaixoMinima && <span className="ml-1 text-xs text-blue-600">(Min: {profissional?.cargaHorariaMensalMinima})</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
              <p>Nenhum dado de escala disponível para gerar relatório. Gere uma escala primeiro.</p>
            </div>
          )}
        </div>
      </div>

      {/* Seção Relatórios Históricos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Filtros e Controles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-blue-600" />
              Filtros do Relatório
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Início</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={dataInicioRelatorio}
                  onChange={(e) => setDataInicioRelatorio(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Fim</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={dataFimRelatorio}
                  onChange={(e) => setDataFimRelatorio(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Tipo de Turno</label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white transition-all"
                    value={tipoTurnoRelatorio}
                    onChange={(e) => setTipoTurnoRelatorio(e.target.value as 'TODOS' | 'DIA' | 'NOITE')}
                  >
                    <option value="TODOS">Todos os turnos</option>
                    <option value="DIA">Apenas dia</option>
                    <option value="NOITE">Apenas noite</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={carregarRelatorios}
              disabled={carregando}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {carregando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Carregando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Gerar Relatório
                </>
              )}
            </button>
            
            {erro && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{erro}</span>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              Período Comparativo (Opcional)
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={dataInicioComparativo}
                onChange={(e) => setDataInicioComparativo(e.target.value)}
              />
              <input
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={dataFimComparativo}
                onChange={(e) => setDataFimComparativo(e.target.value)}
              />
            </div>
            <button
              onClick={carregarComparativo}
              disabled={carregandoComparativo}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
            >
               {carregandoComparativo ? 'Carregando...' : 'Carregar Comparativo'}
            </button>
          </div>
        </div>

        {/* Resultados: Cards de Métricas */}
        <div className="space-y-6">
          {indicadoresTrocasPeriodo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-green-600" />
                  Indicadores de Trocas
                </h3>
                <button
                  onClick={exportarCsvTrocas}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium shadow-sm transition-all"
                >
                  <Download className="w-3 h-3" />
                  Exportar CSV
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <span className="text-sm text-blue-600 font-medium">Total de Trocas</span>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{indicadoresTrocasPeriodo.totalTrocas}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <span className="text-sm text-orange-600 font-medium">Solicitadas</span>
                  <p className="text-2xl font-bold text-orange-900 mt-1">{indicadoresTrocasPeriodo.totalSolicitadas}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <span className="text-sm text-green-600 font-medium">Aprovadas</span>
                  <p className="text-2xl font-bold text-green-900 mt-1">{indicadoresTrocasPeriodo.totalAprovadas}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <span className="text-sm text-red-600 font-medium">Rejeitadas</span>
                  <p className="text-2xl font-bold text-red-900 mt-1">{indicadoresTrocasPeriodo.totalRejeitadas}</p>
                </div>
              </div>
            </div>
          )}

          {indicadoresTrocasComparativo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 opacity-80">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                Comparativo de Trocas
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                 <div>
                    <span className="block text-gray-500 text-xs">Total</span>
                    <span className="font-bold text-gray-800">{indicadoresTrocasComparativo.totalTrocas}</span>
                 </div>
                 <div>
                    <span className="block text-gray-500 text-xs">Solic.</span>
                    <span className="font-bold text-gray-800">{indicadoresTrocasComparativo.totalSolicitadas}</span>
                 </div>
                 <div>
                    <span className="block text-gray-500 text-xs">Aprov.</span>
                    <span className="font-bold text-gray-800">{indicadoresTrocasComparativo.totalAprovadas}</span>
                 </div>
                 <div>
                    <span className="block text-gray-500 text-xs">Rej.</span>
                    <span className="font-bold text-gray-800">{indicadoresTrocasComparativo.totalRejeitadas}</span>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela Detalhada de Profissionais */}
      {resumoProfissionaisPeriodo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Detalhamento por Profissional
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(dataInicioRelatorio).toLocaleDateString()} a {new Date(dataFimRelatorio).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={exportarCsvProfissionais}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-3">Profissional</th>
                  <th className="px-6 py-3">CRM</th>
                  <th className="px-6 py-3 text-center">Total Plantões</th>
                  <th className="px-6 py-3 text-center">Noturnos</th>
                  <th className="px-6 py-3 text-center">Horas Totais</th>
                  <th className="px-6 py-3 text-center">Carga Min/Máx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resumoProfissionaisPeriodo.map((r) => (
                  <tr key={r.idProfissional} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{r.nome}</td>
                    <td className="px-6 py-3 text-gray-500">{r.crm}</td>
                    <td className="px-6 py-3 text-center font-medium">{r.totalPlantoes}</td>
                    <td className="px-6 py-3 text-center">
                      {r.totalNoites > 0 ? (
                        <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-xs font-medium">
                          <Moon className="w-3 h-3" /> {r.totalNoites}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center font-bold text-gray-800">{Math.round(r.horasTotais * 10) / 10}h</td>
                    <td className="px-6 py-3 text-center text-gray-500 text-xs">
                      {r.cargaMensalMinima ?? '-'} / {r.cargaMensalMaxima ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabela Comparativa */}
      {resumoProfissionaisComparativo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden opacity-90">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              Detalhamento Comparativo
            </h3>
             <p className="text-sm text-gray-500 mt-1">
                {new Date(dataInicioComparativo).toLocaleDateString()} a {new Date(dataFimComparativo).toLocaleDateString()}
              </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left opacity-80">
              <thead className="bg-gray-100 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-3">Profissional</th>
                  <th className="px-6 py-3 text-center">Total Plantões</th>
                  <th className="px-6 py-3 text-center">Horas Totais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resumoProfissionaisComparativo.map((r) => (
                  <tr key={r.idProfissional} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{r.nome}</td>
                    <td className="px-6 py-3 text-center">{r.totalPlantoes}</td>
                    <td className="px-6 py-3 text-center">{Math.round(r.horasTotais * 10) / 10}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
