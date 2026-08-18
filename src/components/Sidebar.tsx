import React from 'react';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

interface SidebarProps {
  activeTab: 'dashboard' | 'pacientes';
  onSelectTab: (tab: 'dashboard' | 'pacientes') => void;
  totalPacientesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  totalPacientesCount = 0,
}) => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'N';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <aside className="sidebar-container">
      {/* Top Logo */}
      <div className="sidebar-logo-area">
        <Logo />
      </div>

      {/* Navigation Options */}
      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectTab('dashboard')}
          id="nav-dashboard"
        >
          <LayoutDashboard className="sidebar-link-icon" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === 'pacientes' ? 'active' : ''}`}
          onClick={() => onSelectTab('pacientes')}
          id="nav-pacientes"
        >
          <Users className="sidebar-link-icon" />
          <span>Pacientes</span>
          {totalPacientesCount > 0 && (
            <span className="sidebar-badge">{totalPacientesCount}</span>
          )}
        </button>
      </nav>

      {/* Neon Live Status Indicator */}
      <div className="sidebar-status-box">
        <div className="status-dot"></div>
        <div>
          <div className="status-title">Neon Sync Ativo</div>
          <div className="status-sub">Tempo real — {user?.name?.split(' ')[0]}</div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <div className="avatar-badge">{getInitials(user?.name)}</div>
          <div className="user-details">
            <h4 className="user-name">{user?.name || 'Nutricionista'}</h4>
            <p className="user-email">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={logout}
          title="Sair da conta"
          id="btn-sidebar-logout"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
