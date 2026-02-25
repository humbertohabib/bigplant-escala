import React from 'react'
import { Sidebar } from './Sidebar'
import type { UsuarioAutenticado, Aba } from '../../types'
import './layout.css'

interface DashboardLayoutProps {
  children: React.ReactNode
  usuario: UsuarioAutenticado
  abaAtual: Aba
  setAba: (aba: Aba) => void
  onLogout: () => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  usuario,
  abaAtual,
  setAba,
  onLogout
}) => {
  const getHeaderTitle = (aba: Aba) => {
    switch(aba) {
      case 'escala': return 'Escala de Plantões'
      case 'profissionais': return 'Gestão de Profissionais'
      case 'regras': return 'Regras da Escala'
      case 'disponibilidade': return 'Minha Disponibilidade'
      case 'turnos': return 'Gestão de Turnos'
      case 'trocas': return 'Trocas de Plantão'
      case 'locais': return 'Locais de Atendimento'
      case 'relatorios': return 'Relatórios e Indicadores'
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
