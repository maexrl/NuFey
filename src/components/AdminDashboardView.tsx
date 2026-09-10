import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  FileText,
  Search,
  RefreshCw,
  Lock,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
} from 'lucide-react';
import {
  getAdminUsersList,
  getSystemAuditLogs,
  updateUserRoleInDb,
  toggleUser2FAInDb,
  logSystemAudit,
  type AdminUserItem,
  type SystemAuditLogItem,
} from '../lib/neonData';
import { generate2FACode } from '../lib/neonAuth';
import { useAuth } from '../context/AuthContext';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'security' | 'audit'>('users');
  const [loading, setLoading] = useState(true);

  // Data states
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ROLE_ADMIN' | 'ROLE_CLIENT'>('ALL');

  // Security 2FA settings states
  const [enforceGlobal2FA, setEnforceGlobal2FA] = useState(true);
  const [default2FAMethod, setDefault2FAMethod] = useState<'email' | 'sms'>('email');
  
  // Test gateway state
  const [testTarget, setTestTarget] = useState('');
  const [testMethod, setTestMethod] = useState<'email' | 'sms'>('email');
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [uList, logs] = await Promise.all([getAdminUsersList(), getSystemAuditLogs()]);
      setUsersList(uList);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleUserRole = async (targetUser: AdminUserItem) => {
    const newRole = targetUser.role === 'ROLE_ADMIN' ? 'ROLE_CLIENT' : 'ROLE_ADMIN';
    setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
    await updateUserRoleInDb(targetUser.id, newRole);
    await logSystemAudit(
      user?.email || 'admin@nufey.com.br',
      'USER_ROLE_CHANGED',
      `Função do usuário ${targetUser.email} alterada para ${newRole}`
    );
  };

  const handleToggleUser2FA = async (targetUser: AdminUserItem) => {
    const nextStatus = !targetUser.two_factor_enabled;
    setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, two_factor_enabled: nextStatus } : u)));
    await toggleUser2FAInDb(targetUser.id, nextStatus, targetUser.two_factor_method);
  };

  const handleTestGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    if (!testTarget) return;

    const res = await generate2FACode(testTarget, testMethod, 'login');
    if (res.success) {
      setTestResult(`✅ Teste bem-sucedido! Código 2FA enviado via ${testMethod.toUpperCase()}: ${res.code}`);
    } else {
      setTestResult(`❌ Erro no teste do gateway: ${res.error}`);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="view-content-container" style={{ padding: '1.5rem 0' }}>
      {/* Top Banner */}
      <div className="dashboard-welcome-banner" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
        <div>
          <div className="neon-connected-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <ShieldCheck className="w-4 h-4" /> Painel de Controle de Segurança & Administração
          </div>
          <h1 className="welcome-title">Área de Administrador NuFey ⚡</h1>
          <p className="welcome-subtitle">
            Gerencie contas de usuários, autenticação padrão e 2FA (E-mail e SMS), auditorias e estado do banco de dados Neon.
          </p>
        </div>

        <button type="button" className="btn-secondary" onClick={loadAdminData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'spin' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Admin KPI Stat Cards */}
      <div className="dashboard-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="dashboard-metric-card">
          <div className="metric-header">
            <div className="stat-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>
              <Users className="w-6 h-6" />
            </div>
            <span className="metric-badge-tag" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#A5B4FC' }}>Cadastros</span>
          </div>
          <div className="metric-body">
            <div className="metric-number">{usersList.length}</div>
            <div className="metric-title">Total de Usuários</div>
            <p className="metric-description">Contas ativas no sistema</p>
          </div>
        </div>

        <div className="dashboard-metric-card">
          <div className="metric-header">
            <div className="stat-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="metric-badge-tag badge-green">Protegido</span>
          </div>
          <div className="metric-body">
            <div className="metric-number">{usersList.filter((u) => u.two_factor_enabled).length}</div>
            <div className="metric-title">Usuários com 2FA Ativo</div>
            <p className="metric-description">Verificação E-mail/SMS ativa</p>
          </div>
        </div>

        <div className="dashboard-metric-card">
          <div className="metric-header">
            <div className="stat-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
              <Database className="w-6 h-6" />
            </div>
            <span className="metric-badge-tag badge-blue">Neon DB</span>
          </div>
          <div className="metric-body">
            <div className="metric-number" style={{ fontSize: '1.25rem' }}>Conectado 🟢</div>
            <div className="metric-title">Status Neon PostgreSQL</div>
            <p className="metric-description">Sincronização em tempo real</p>
          </div>
        </div>

        <div className="dashboard-metric-card">
          <div className="metric-header">
            <div className="stat-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              <Cpu className="w-6 h-6" />
            </div>
            <span className="metric-badge-tag badge-amber">PWA & Vercel</span>
          </div>
          <div className="metric-body">
            <div className="metric-number" style={{ fontSize: '1.25rem' }}>Ativo ⚡</div>
            <div className="metric-title">Service Worker & Cache</div>
            <p className="metric-description">App instalado e atualizado</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '12px',
            border: activeSubTab === 'users' ? '1px solid #6366F1' : '1px solid transparent',
            background: activeSubTab === 'users' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            color: activeSubTab === 'users' ? '#A5B4FC' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Usuários</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '12px',
            border: activeSubTab === 'security' ? '1px solid #10B981' : '1px solid transparent',
            background: activeSubTab === 'security' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: activeSubTab === 'security' ? '#34D399' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <Lock className="w-4 h-4" />
          <span>Configurações 2FA & SMS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '12px',
            border: activeSubTab === 'audit' ? '1px solid #38BDF8' : '1px solid transparent',
            background: activeSubTab === 'audit' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: activeSubTab === 'audit' ? '#38BDF8' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <FileText className="w-4 h-4" />
          <span>Logs de Auditoria</span>
        </button>
      </div>

      {/* Tab 1: Gestão de Usuários */}
      {activeSubTab === 'users' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.5rem' }}>
          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div className="input-wrapper" style={{ maxWidth: '360px', width: '100%' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar usuário por nome, e-mail ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="input-icon w-4 h-4" />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn-secondary ${roleFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setRoleFilter('ALL')}
                style={{ fontSize: '0.8125rem' }}
              >
                Todos
              </button>
              <button
                type="button"
                className={`btn-secondary ${roleFilter === 'ROLE_ADMIN' ? 'active' : ''}`}
                onClick={() => setRoleFilter('ROLE_ADMIN')}
                style={{ fontSize: '0.8125rem' }}
              >
                Admins
              </button>
              <button
                type="button"
                className={`btn-secondary ${roleFilter === 'ROLE_CLIENT' ? 'active' : ''}`}
                onClick={() => setRoleFilter('ROLE_CLIENT')}
                style={{ fontSize: '0.8125rem' }}
              >
                Clientes
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Usuário</th>
                  <th style={{ padding: '0.75rem 1rem' }}>E-mail</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Telefone</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Papel (Role)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status 2FA</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#F8FAFC' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar-badge avatar-small">{u.name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {u.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#CBD5E1' }}>{u.email}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#94A3B8' }}>{u.phone || '(11) 99999-8888'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: u.role === 'ROLE_ADMIN' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                          color: u.role === 'ROLE_ADMIN' ? '#A5B4FC' : '#38BDF8',
                          border: u.role === 'ROLE_ADMIN' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
                        }}
                      >
                        {u.role === 'ROLE_ADMIN' ? '👑 Nutricionista (Admin)' : '👤 Cliente / Paciente'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: u.two_factor_enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: u.two_factor_enabled ? '#34D399' : '#F87171',
                        }}
                      >
                        {u.two_factor_enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {u.two_factor_enabled ? `Ativo (${u.two_factor_method.toUpperCase()})` : 'Desativado'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleToggleUserRole(u)}
                          style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                          title="Alternar entre Admin e Cliente"
                        >
                          {u.role === 'ROLE_ADMIN' ? 'Tornar Cliente' : 'Tornar Admin'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleToggleUser2FA(u)}
                          style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                          title="Alternar 2FA"
                        >
                          {u.two_factor_enabled ? 'Desativar 2FA' : 'Ativar 2FA'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Configurações de Segurança e 2FA */}
      {activeSubTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Card Config Globais */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock className="w-5 h-5" style={{ color: '#10B981' }} /> Regras de Autenticação 2FA
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#F8FAFC' }}>Exigir 2FA obrigatoriamente no login</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Solicita código de 6 dígitos no acesso</div>
                </div>
                <input
                  type="checkbox"
                  checked={enforceGlobal2FA}
                  onChange={(e) => setEnforceGlobal2FA(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#10B981', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#F8FAFC' }}>Canal de Envio Padrão do Sistema</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Define se o código padrão vai via E-mail ou SMS</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn-secondary ${default2FAMethod === 'email' ? 'active' : ''}`}
                    onClick={() => setDefault2FAMethod('email')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    E-mail
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${default2FAMethod === 'sms' ? 'active' : ''}`}
                    onClick={() => setDefault2FAMethod('sms')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    SMS Celular
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card Teste Gateway */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone className="w-5 h-5" style={{ color: '#38BDF8' }} /> Testador do Gateway de 2FA
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Dispare um código de teste por E-mail ou SMS para verificar a integridade da entrega.
            </p>

            <form onSubmit={handleTestGateway}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Destinatário (E-mail ou Celular)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="usuario@teste.com ou (11) 99999-8888"
                  value={testTarget}
                  onChange={(e) => setTestTarget(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setTestMethod('email')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '10px',
                    border: testMethod === 'email' ? '1px solid #38BDF8' : '1px solid transparent',
                    background: testMethod === 'email' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)',
                    color: testMethod === 'email' ? '#38BDF8' : 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  <Mail className="w-4 h-4 inline mr-1" /> E-mail
                </button>
                <button
                  type="button"
                  onClick={() => setTestMethod('sms')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '10px',
                    border: testMethod === 'sms' ? '1px solid #10B981' : '1px solid transparent',
                    background: testMethod === 'sms' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.03)',
                    color: testMethod === 'sms' ? '#10B981' : 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  <Smartphone className="w-4 h-4 inline mr-1" /> SMS
                </button>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                Testar Envio 🚀
              </button>
            </form>

            {testResult && (
              <div style={{ marginTop: '1.25rem', padding: '0.875rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', fontSize: '0.8125rem', color: '#E2E8F0' }}>
                {testResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Logs de Auditoria */}
      {activeSubTab === 'audit' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText className="w-5 h-5" style={{ color: '#38BDF8' }} /> Histórico de Eventos & Registro de Auditoria
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Data / Hora</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Usuário / E-mail</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ação Executada</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#F8FAFC' }}>{log.user_email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38BDF8',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#CBD5E1' }}>{log.details || 'Sem detalhes adicionais'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
