import React, { useRef } from 'react'
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
  Building2,
  Camera,
  Shield
} from 'lucide-react'

interface SidebarProps {
  usuario: UsuarioAutenticado
  abaAtual: Aba
  setAba: (aba: Aba) => void
  onLogout: () => void
  onUpdateUser: (usuario: UsuarioAutenticado) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  usuario,
  abaAtual,
  setAba,
  onLogout,
  onUpdateUser
}) => {
  const isAdmin = usuario.perfil === 'ADMIN'
  const isCoord = usuario.perfil === 'COORDENADOR'
  const isRestricted = usuario.perfil === 'USUARIO'
  // const isMedico = usuario.perfil === 'MEDICO' // Não usado explicitamente, mas implícito

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tamanho (ex: 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result as string
      
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
        const response = await fetch(`${API_URL}/api/profissionais/${usuario.id}/foto`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`
          },
          body: JSON.stringify({ fotoPerfil: base64String })
        })

        if (response.ok) {
          onUpdateUser({ ...usuario, fotoPerfil: base64String })
        } else {
          alert('Erro ao atualizar foto de perfil')
        }
      } catch (error) {
        console.error('Erro ao enviar foto:', error)
        alert('Erro ao enviar foto')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div 
          className="relative group cursor-pointer" 
          onClick={handleFotoClick}
          title="Clique para alterar a foto"
        >
          {usuario.fotoPerfil ? (
            <img 
              src={usuario.fotoPerfil} 
              alt="Foto de Perfil" 
              className="w-10 h-10 rounded-full object-cover border-2 border-white/20 group-hover:opacity-70 transition-opacity"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-white/20 group-hover:bg-slate-600 transition-colors">
              <LayoutDashboard size={20} className="text-slate-300" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Camera size={16} className="text-white drop-shadow-md" />
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        
        <div className="flex flex-col ml-3 overflow-hidden">
          <span className="font-bold leading-tight truncate">BigPlant Escala</span>
          <span className="text-xs opacity-75 font-normal truncate" title={usuario.nome}>
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

        {isAdmin && (
          <button
            className={`nav-item ${abaAtual === 'auditoria' ? 'active' : ''}`}
            onClick={() => setAba('auditoria')}
          >
            <Shield size={20} />
            <span>Auditoria</span>
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
