import React, { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import type { View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Escala, Turno, UsuarioAutenticado, Profissional } from '../../types'
import { Filter } from 'lucide-react'

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
}

interface EventoTurno {
  id: number
  title: string
  start: Date
  end: Date
  resource: Turno
  isMyShift: boolean
}

export const CalendarioEscala: React.FC<CalendarioEscalaProps> = ({
  escala,
  usuario,
  profissionais,
  onSolicitarTroca
}) => {
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [filtroProfissionalId, setFiltroProfissionalId] = useState<number | null>(null)

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
        
        // Construir datas
        const [horaIni, minIni] = turno.horaInicio.split(':').map(Number)
        const [horaFim, minFim] = turno.horaFim.split(':').map(Number)
        
        const start = new Date(turno.data)
        start.setHours(horaIni, minIni, 0)
        
        const end = new Date(turno.data)
        // Se hora fim for menor que inicio, é dia seguinte
        if (horaFim < horaIni || (horaFim === horaIni && minFim < minIni)) {
          end.setDate(end.getDate() + 1)
        }
        end.setHours(horaFim, minFim, 0)

        const isMyShift = turno.idProfissional === usuario.id

        return {
          id: turno.id,
          title: `${nomeProfissional}${contato ? ` (${contato})` : ''} - ${turno.local}`,
          start,
          end,
          resource: turno,
          isMyShift
        }
      })
  }, [escala, profissionais, usuario.id, isMedico, filtroProfissionalId])

  const eventStyleGetter = (event: EventoTurno) => {
    let style = {
      backgroundColor: '#3b82f6', // blue-500 default
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    }

    if (event.isMyShift) {
      style.backgroundColor = '#10b981' // green-500
      style.opacity = 1
      style.border = '2px solid #047857' // green-700
    } else if (event.resource.idProfissional === null) {
      style.backgroundColor = '#ef4444' // red-500 (Vago)
    }

    return {
      style: style
    }
  }

  const handleSelectEvent = (event: EventoTurno) => {
    // Se for médico, só pode pedir troca do próprio plantão
    if (isMedico && !event.isMyShift) {
      alert('Você só pode solicitar alteração nos seus próprios plantões.')
      return
    }
    
    // Abre modal de troca
    if (window.confirm(`Deseja solicitar alteração para o plantão de ${format(event.start, 'dd/MM/yyyy')}?`)) {
      onSolicitarTroca(event.resource)
    }
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
    </div>
  )
}
