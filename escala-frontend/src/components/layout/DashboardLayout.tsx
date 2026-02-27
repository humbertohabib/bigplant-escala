import { type FC, type ReactNode } from 'react'
import { 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User, 
  RefreshCw, 
  Clock, 
  MapPin, 
  Building2, 
  FileText,
  Shield
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import type { UsuarioAutenticado, Aba } from '../../types'
import './layout.css'

interface DashboardLayoutProps {
  children: ReactNode
  usuario: UsuarioAutenticado
  abaAtual: Aba
  setAba: (aba: Aba) => void
  onLogout: () => void
  onUpdateUser: (usuario: UsuarioAutenticado) => void
  apiBaseUrl: string
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({
  children,
  usuario,
  abaAtual,
  setAba,
  onLogout,
  onUpdateUser,
  apiBaseUrl,
  authFetch
}) => {
  const getHeaderTitle = (aba: Aba) => {
    switch(aba) {
      case 'escala': return 'Escala de Plantões'
      case 'profissionais': return 'Gestão de Profissionais'
      case 'regras': return 'Regras da Escala'
      case 'disponibilidade': return 'Minha Disponibilidade'
      case 'trocas': return 'Trocas de Plantão'
      case 'locais': return 'Locais de Atendimento'
      case 'instituicoes': return 'Instituições Organizacionais'
      case 'relatorios': return 'Relatórios e Indicadores'
      case 'restricted': return 'Acesso Restrito'
      default: return 'Dashboard'
    }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        usuario={usuario}
        abaAtual={abaAtual}
        setAba={setAba}
        onLogout={onLogout}
        onUpdateUser={onUpdateUser}
        apiBaseUrl={apiBaseUrl}
        authFetch={authFetch}
      />
      <div className="main-content">
        <header className="top-bar">
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {getHeaderTitle(abaAtual)}
          </h1>
          <div className="user-info">
            <span>Olá, {usuario.nome}</span>
            <div className="user-avatar">
              {usuario.nome.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
