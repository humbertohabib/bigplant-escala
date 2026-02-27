import { type FC } from 'react'
import { X, User, Clock, MapPin, Phone, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Turno, Profissional, UsuarioAutenticado } from '../../types'

interface DetalhesTurnoDialogProps {
  isOpen: boolean
  onClose: () => void
  turno: Turno
  profissional: Profissional | undefined
  isMyShift: boolean
  usuario: UsuarioAutenticado
  onSolicitarTroca: () => void
}

export const DetalhesTurnoDialog: FC<DetalhesTurnoDialogProps> = ({
  isOpen,
  onClose,
  turno,
  profissional,
  isMyShift,
  usuario,
  onSolicitarTroca
}) => {
  if (!isOpen) return null

  const divulgacaoPermitida = profissional?.divulgarDados !== false
  const contato = divulgacaoPermitida ? profissional?.telefoneWhatsapp : null
  const foto = divulgacaoPermitida ? profissional?.fotoPerfil : null

  // Formata data e hora
  const [ano, mes, dia] = turno.data.toString().split('-').map(Number)
  const dataTurno = new Date(ano, mes - 1, dia)
  
  const canRequestSwap = isMyShift || usuario.perfil === 'ADMIN' || usuario.perfil === 'COORDENADOR'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Detalhes do Plantão</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Profissional Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {foto ? (
                <img 
                  src={foto} 
                  alt={profissional?.nome || 'Profissional'} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                  <User size={32} className="text-gray-400" />
                </div>
              )}
              {isMyShift && (
                <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full border border-white shadow-sm">
                  Eu
                </span>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-lg text-gray-900">
                {profissional?.nome || 'Plantão Vago'}
              </h4>
              <p className="text-sm text-gray-500">{profissional?.crm ? `CRM: ${profissional.crm}` : 'Profissional'}</p>
              {profissional?.especialidade && (
                <p className="text-sm font-medium text-indigo-600 mt-0.5">
                  {profissional.especialidade.nome}
                </p>
              )}
              {contato && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-blue-600">
                  <Phone size={14} />
                  <span>{contato}</span>
                </div>
              )}
            </div>
          </div>

          {/* Turno Info */}
          <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md text-blue-600">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Data e Horário</p>
                <p className="text-gray-900 font-medium">
                  {format(dataTurno, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-gray-700">
                  {turno.horaInicio.slice(0, 5)} - {turno.horaFim.slice(0, 5)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-md text-amber-600">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Local</p>
                <p className="text-gray-900">{turno.local}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Fechar
          </button>
          
          {canRequestSwap && profissional && (
             <button 
               onClick={() => {
                 onSolicitarTroca()
                 onClose()
               }}
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
             >
               <RefreshCw size={16} />
               Solicitar Troca
             </button>
          )}
        </div>
      </div>
    </div>
  )
}
