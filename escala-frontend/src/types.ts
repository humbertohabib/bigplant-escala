export type Turno = {
  id: number
  data: string
  horaInicio: string
  horaFim: string
  tipo: string
  local: string
  idProfissional?: number | null
}

export type Escala = {
  id: number
  dataInicio: string
  dataFim: string
  status: string
  turnos: Turno[]
}

export type RegrasConcretas = {
  maxNoitesMes: number | null
  minDescansoHoras: number | null
  maxPlantoesConsecutivos: number | null
}

export type Profissional = {
  id?: number
  nome: string
  crm: string
  idHospital: number
  cargaHorariaMensalMaxima?: number | null
  cargaHorariaMensalMinima?: number | null
  ativo?: boolean | null
  email?: string | null
  telefoneWhatsapp?: string | null
  perfil?: string | null
  senha?: string | null
}

export type Disponibilidade = {
  id?: number
  idHospital: number
  idProfissional: number
  data: string
  tipoTurno: string
  disponivel: boolean
}

export type TurnoCrud = {
  id?: number
  data: string
  horaInicio: string
  horaFim: string
  tipo: string
  local: string
  idHospital: number
  idProfissional?: number | null
  idLocalAtendimento?: number | null
}

export type LocalAtendimento = {
  id?: number
  nome: string
  idHospital: number
  ativo?: boolean | null
  logradouro?: string
  rua?: string
  cidade?: string
  estado?: string
  pais?: string
  complemento?: string
  telefoneContato?: string
}

export type TrocaPlantao = {
  id?: number
  idHospital: number
  idTurno: number
  idProfissionalOrigem: number
  idProfissionalDestino: number
  status: string
  dataSolicitacao: string
  dataResposta?: string | null
  motivo?: string | null
}

export type UsuarioAutenticado = {
  token: string
  nome: string
  email: string
  perfil: string
  id?: number
}

export type ResumoProfissionalPeriodo = {
  idProfissional: number
  nome: string
  crm: string
  totalPlantoes: number
  totalNoites: number
  horasTotais: number
  maxConsecutivos: number
  horasPeriodo: number
  horasProjecao30Dias: number
  cargaMensalMinima?: number | null
  cargaMensalMaxima?: number | null
}

export type ResumoTrocasProfissional = {
  idProfissional: number
  nome: string
  crm: string
  comoOrigem: number
  comoDestino: number
}

export type IndicadoresTrocaPeriodo = {
  totalTrocas: number
  totalSolicitadas: number
  totalAprovadas: number
  totalRejeitadas: number
  porProfissional: ResumoTrocasProfissional[]
}

export type Aba =
  | 'escala'
  | 'profissionais'
  | 'regras'
  | 'disponibilidade'
  | 'turnos'
  | 'locais'
  | 'trocas'
  | 'relatorios'
  | 'restricted'
