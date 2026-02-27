import React, { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import type { View, EventProps } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Escala, Turno, UsuarioAutenticado, Profissional } from '../../types'
import { Filter, User } from 'lucide-react'
import { DetalhesTurnoDialog } from './DetalhesTurnoDialog'

const locales = {
  'pt-BR': ptBR,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarioEscalaProps {
  escala: Escala | null
  usuario: UsuarioAutenticado
  profissionais: Profissional[]
  onSolicitarTroca: (turno: Turno) => void
  onExcluirTurno: (id: number) => void
}

interface EventoTurno {
  id: number
  title: string
  start: Date
  end: Date
  resource: Turno
  isMyShift: boolean
  photoUrl?: string | null
  viewMode: View
  specialty?: string
  professionalName: string
}

const CustomEvent = ({ event }: EventProps<EventoTurno>) => {
  const isCompact = event.viewMode === Views.MONTH
  const hasSpecialty = !isCompact && typeof event.specialty === 'string' && event.specialty.trim().length > 0

  return (
    <div className={`flex ${isCompact ? 'items-center gap-2' : 'flex-col gap-1 p-0.5'} h-full overflow-hidden`}>
      <div className="flex items-center gap-2">
        {event.photoUrl ? (
          <img 
            src={event.photoUrl} 
            alt="Foto" 
            className="w-6 h-6 rounded-full border border-white flex-shrink-0 object-cover"
          />
        ) : (
           <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
             <User size={14} className="text-white" />
           </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs truncate leading-tight">
            {isCompact ? event.title : event.professionalName}
          </span>
          {hasSpecialty && (
             <span className="text-[0.65rem] italic truncate opacity-90">{event.specialty}</span>
          )}
        </div>
      </div>
      
      {!isCompact && (
        <div className="flex flex-col text-[0.7rem] leading-tight opacity-95 pl-1">
           <span>{event.resource.horaInicio.slice(0,5)} - {event.resource.horaFim.slice(0,5)}</span>
           <span className="truncate font-medium">{event.resource.local}</span>
           <span className="opacity-80 uppercase text-[0.65rem]">{event.resource.tipo}</span>
        </div>
      )}
    </div>
  )
}

export const CalendarioEscala: React.FC<CalendarioEscalaProps> = ({
  escala,
  usuario,
  profissionais,
  onSolicitarTroca,
  onExcluirTurno
}) => {
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [filtroProfissionalId, setFiltroProfissionalId] = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventoTurno | null>(null)

  const isMedico = usuario.perfil === 'MEDICO'

  const eventos: EventoTurno[] = useMemo(() => {
    if (!escala || !escala.turnos) return []

    return escala.turnos
      .filter(t => {
        if (isMedico) return true // Médicos veem tudo, mas com destaque
        if (filtroProfissionalId) return t.idProfissional === filtroProfissionalId
        return true
      })
      .map(turno => {
        const profissional = profissionais.find(p => p.id === turno.idProfissional)
        const nomeProfissional = profissional ? profissional.nome : 'Vago'
        
        // Verificar preferência de privacidade
        const divulgarDados = profissional?.divulgarDados !== false // Default é true
        const contato = divulgarDados ? profissional?.telefoneWhatsapp : null
        const photoUrl = divulgarDados ? profissional?.fotoPerfil : null
        const specialty = profissional?.especialidade?.nome
        
        // Construir datas
        const [horaIni, minIni] = turno.horaInicio.split(':').map(Number)
        const [horaFim, minFim] = turno.horaFim.split(':').map(Number)
        
        // Corrige timezone criando data com componentes locais
        const [ano, mes, dia] = turno.data.toString().split('-').map(Number)
        const start = new Date(ano, mes - 1, dia, horaIni, minIni, 0)
        
        const end = new Date(ano, mes - 1, dia, horaFim, minFim, 0)
        
        // Se hora fim for menor que inicio, é dia seguinte
        if (horaFim < horaIni || (horaFim === horaIni && minFim < minIni)) {
          end.setDate(end.getDate() + 1)
        }
        
        // Ajuste visual para view Mês: trunca evento no final do dia para manter ordem visual correta
        if (view === Views.MONTH && end.getDate() !== start.getDate()) {
          end.setFullYear(start.getFullYear(), start.getMonth(), start.getDate())
          end.setHours(23, 59, 59)
        }

        const isMyShift = turno.idProfissional === usuario.id

        // Formata horário para exibição (HH:mm)
        const formatTime = (h: string) => h.split(':').slice(0, 2).join(':')
        const timeLabel = `${formatTime(turno.horaInicio)} - ${formatTime(turno.horaFim)}`

        // Título simplificado para CustomEvent lidar com detalhes, mas mantido para Month view padrão
        const title = view === Views.MONTH 
          ? `[${timeLabel}] ${nomeProfissional}` 
          : `${nomeProfissional} - ${turno.local}`

        return {
          id: turno.id,
          title,
          start,
          end,
          resource: turno,
          isMyShift,
          photoUrl,
          allDay: false,
          viewMode: view,
          specialty,
          professionalName: nomeProfissional
        }
      })
  }, [escala, profissionais, usuario.id, isMedico, filtroProfissionalId, view])

  const eventStyleGetter = (event: EventoTurno) => {
    // Melhores Práticas: Cores semânticas com alto contraste de luminância entre Dia e Noite para facilitar a leitura rápida
    
    const isDia = event.resource.tipo === 'DIA'
    const isVago = event.resource.idProfissional === null
    const isMeuTurno = event.isMyShift

    let backgroundColor = ''
    let borderColor = ''
    let color = 'white'

    if (isVago) {
        // Vago: Vermelho/Rose para alerta (prioridade alta visual)
        backgroundColor = '#be123c' // rose-700
        borderColor = '#881337' // rose-900
    } else if (isMeuTurno) {
        // Meu Turno: Verde/Emerald para destaque positivo (prioridade média)
        backgroundColor = '#059669' // emerald-600
        borderColor = '#064e3b' // emerald-900
    } else if (isDia) {
        // Dia: Laranja/Amber - Tom quente para máximo contraste com a noite (Sol vs Lua)
        // Isso resolve o problema de "tudo azul" e melhora a escaneabilidade
        backgroundColor = '#d97706' // amber-600
        borderColor = '#78350f' // amber-900
    } else {
        // Noite: Indigo Profundo/Midnight - Tom escuro e "noturno"
        backgroundColor = '#312e81' // indigo-900
        borderColor = '#1e1b4b' // indigo-950
    }

    const style = {
      backgroundColor,
      borderRadius: '6px',
      opacity: 1,
      color,
      border: `0px`,
      borderLeft: `5px solid ${borderColor}`,
      display: 'block',
      fontWeight: 500 as const,
      fontSize: '0.85rem',
      padding: '2px 5px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }

    return {
      style: style
    }
  }

  const handleSelectEvent = (event: EventoTurno) => {
    setSelectedEvent(event)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Barra de Filtros para Admin/Coord */}
      {!isMedico && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <Filter size={20} className="text-gray-500" />
          <span style={{ fontWeight: 500 }}>Filtrar por Profissional:</span>
          <select 
            value={filtroProfissionalId ?? ''}
            onChange={(e) => setFiltroProfissionalId(e.target.value ? Number(e.target.value) : null)}
            style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
          >
            <option value="">Todos os Profissionais</option>
            {profissionais.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          culture='pt-BR'
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          showMultiDayTimes={true}
          components={{
            event: CustomEvent
          }}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há plantões neste período."
          }}
        />
      </div>

      {selectedEvent && (
        <DetalhesTurnoDialog 
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          turno={selectedEvent.resource}
          profissional={selectedEvent.resource.idProfissional ? profissionais.find(p => p.id === selectedEvent.resource.idProfissional) : undefined}
          isMyShift={selectedEvent.isMyShift}
          usuario={usuario}
          onSolicitarTroca={() => onSolicitarTroca(selectedEvent.resource)}
          onExcluirTurno={onExcluirTurno}
        />
      )}
    </div>
  )
}
