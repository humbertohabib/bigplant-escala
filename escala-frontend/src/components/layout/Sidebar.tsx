import React from 'react'
import type { UsuarioAutenticado, Aba } from '../../types'
import {
  Calendar,
  Users,
  Settings,
  Clock,
  RefreshCw,
  MapPin,
  FileText,
  LogOut,
  LayoutDashboard,
  Building2
} from 'lucide-react'

interface SidebarProps {
  usuario: UsuarioAutenticado
  abaAtual: Aba
  setAba: (aba: Aba) => void
  onLogout: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  usuario,
  abaAtual,
  setAba,
  onLogout
}) => {
  const isAdmin = usuario.perfil === 'ADMIN'
  const isCoord = usuario.perfil === 'COORDENADOR'
  const isRestricted = usuario.perfil === 'USUARIO'
  // const isMedico = usuario.perfil === 'MEDICO' // Não usado explicitamente, mas implícito

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        {usuario.fotoPerfil ? (
          <img 
            src={usuario.fotoPerfil} 
            alt="Logo" 
            className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
          />
        ) : (
          <LayoutDashboard size={24} />
        )}
        <div className="flex flex-col">
          <span className="font-bold leading-tight">BigPlant Escala</span>
          <span className="text-xs opacity-75 font-normal truncate max-w-[140px]" title={usuario.nome}>
            {usuario.nome}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {!isRestricted && (
          <button
            className={`nav-item ${abaAtual === 'escala' ? 'active' : ''}`}
            onClick={() => setAba('escala')}
          >
            <Calendar size={20} />
            <span>Escala</span>
          </button>
        )}

        {(isAdmin || isCoord) && (
          <button
            className={`nav-item ${abaAtual === 'profissionais' ? 'active' : ''}`}
            onClick={() => setAba('profissionais')}
          >
            <Users size={20} />
            <span>Profissionais</span>
          </button>
        )}

        {(isAdmin || isCoord) && (
          <button
            className={`nav-item ${abaAtual === 'regras' ? 'active' : ''}`}
            onClick={() => setAba('regras')}
          >
            <Settings size={20} />
            <span>Regras</span>
          </button>
        )}

        {!isRestricted && (
          <button
            className={`nav-item ${abaAtual === 'disponibilidade' ? 'active' : ''}`}
            onClick={() => setAba('disponibilidade')}
          >
            <Clock size={20} />
            <span>Disponibilidade</span>
          </button>
        )}

        {!isRestricted && (
          <button
            className={`nav-item ${abaAtual === 'trocas' ? 'active' : ''}`}
            onClick={() => setAba('trocas')}
          >
            <RefreshCw size={20} />
            <span>Trocas</span>
          </button>
        )}

        {(isAdmin || isCoord) && (
          <button
            className={`nav-item ${abaAtual === 'locais' ? 'active' : ''}`}
            onClick={() => setAba('locais')}
          >
            <MapPin size={20} />
            <span>Locais</span>
          </button>
        )}

        {isAdmin && (
          <button
            className={`nav-item ${abaAtual === 'instituicoes' ? 'active' : ''}`}
            onClick={() => setAba('instituicoes')}
          >
            <Building2 size={20} />
            <span>Instituições</span>
          </button>
        )}

        {(isAdmin || isCoord) && (
          <button
            className={`nav-item ${abaAtual === 'relatorios' ? 'active' : ''}`}
            onClick={() => setAba('relatorios')}
          >
            <FileText size={20} />
            <span>Relatórios</span>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
