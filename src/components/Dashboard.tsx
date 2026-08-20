import React, { useState, useEffect } from 'react';
import { Users, Calendar, AlertTriangle, ChevronRight, UserX, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { PacientesView } from './PacientesView';
import { PacientePerfilModal } from './PacientePerfilModal';
import type { DashboardMetrics, Paciente } from '../lib/neonData';
import { getDashboardMetrics, seedInitialDataIfEmpty } from '../lib/neonData';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pacientes'>('dashboard');
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPacientesAtivos: 0,
    consultasDaSemana: 0,
    pacientesSemRetorno: [],
  });
  const [allPacientes, setAllPacientes] = useState<Paciente[]>([]);

  // Selected patient for modal profile
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [selectedSemRetornoDays, setSelectedSemRetornoDays] = useState<number | undefined>(undefined);

  const loadData = async () => {
    if (!user) return;
    setLoadingMetrics(true);
    try {
      const data = await getDashboardMetrics(user.id);
      setMetrics(data);
      const { pacientes } = seedInitialDataIfEmpty(user.id);
      setAllPacientes(pacientes);
    } catch (err) {
      console.error('Erro ao carregar métricas do Neon:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenPacienteProfile = (paciente: Paciente, diasSemConsulta?: number) => {
    setSelectedPaciente(paciente);
    setSelectedSemRetornoDays(diasSemConsulta);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Fixo com Logo NuFey e Menu */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalPacientesCount={metrics.totalPacientesAtivos}
      />

      {/* Área Principal de Conteúdo */}
      <main className="dashboard-main-content">
        {activeTab === 'pacientes' ? (
          <PacientesView
            pacientes={allPacientes}
            pacientesSemRetorno={metrics.pacientesSemRetorno}
            onSelectPaciente={handleOpenPacienteProfile}
            onRefresh={loadData}
          />
        ) : (
          <div className="view-content-container">
            {/* Header de Boas-Vindas */}
            <div className="dashboard-welcome-banner">
              <div>
                <div className="neon-connected-pill">
                  <CheckCircle2 className="w-4 h-4" /> Dados sincronizados via Neon DB
                </div>
                <h1 className="welcome-title">
                  Olá, {user?.name?.split(' ')[0] || 'Nutricionista'}! ⚡
                </h1>
                <p className="welcome-subtitle">
                  Aqui está o resumo em tempo real do seu consultório de nutrição.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={loadData}
                  disabled={loadingMetrics}
                  title="Atualizar dados"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingMetrics ? 'spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* Grid dos 3 Cards Principais */}
            <div className="dashboard-cards-grid">
              {/* Card 1 — Total de pacientes ativos */}
              <div className="dashboard-metric-card" id="card-total-pacientes">
                <div className="metric-header">
                  <div className="stat-icon-box stat-green">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="metric-badge-tag badge-green">Ativos</span>
                </div>
                <div className="metric-body">
                  <div className="metric-number">
                    {loadingMetrics ? '...' : metrics.totalPacientesAtivos}
                  </div>
                  <div className="metric-title">Total de pacientes ativos</div>
                  <p className="metric-description">
                    Pacientes cadastrados pela nutricionista logada ({user?.email})
                  </p>
                </div>
              </div>

              {/* Card 2 — Consultas da semana */}
              <div className="dashboard-metric-card" id="card-consultas-semana">
                <div className="metric-header">
                  <div className="stat-icon-box stat-blue">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="metric-badge-tag badge-blue">Esta semana</span>
                </div>
                <div className="metric-body">
                  <div className="metric-number">
                    {loadingMetrics ? '...' : metrics.consultasDaSemana}
                  </div>
                  <div className="metric-title">Consultas da semana</div>
                  <p className="metric-description">
                    Consultas registradas de Segunda a Domingo da semana atual
                  </p>
                </div>
              </div>

              {/* Card 3 — Pacientes sem retorno */}
              <div className="dashboard-metric-card card-full-width" id="card-pacientes-sem-retorno">
                <div className="metric-header" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div className="stat-icon-box stat-cyan">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="card-heading-title">Pacientes sem retorno</h3>
                      <p className="card-heading-sub">
                        Última consulta há mais de 30 dias e sem próximo retorno agendado
                      </p>
                    </div>
                  </div>
                  {metrics.pacientesSemRetorno.length > 0 && (
                    <span className="metric-badge-tag badge-cyan">
                      {metrics.pacientesSemRetorno.length} Requer Atenção
                    </span>
                  )}
                </div>

                <div className="sem-retorno-container">
                  {loadingMetrics ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Carregando dados...</p>
                  ) : metrics.pacientesSemRetorno.length === 0 ? (
                    /* Se não houver pacientes sem retorno, exibir a mensagem "Nenhum paciente sem retorno no momento" */
                    <div className="empty-sem-retorno-box">
                      <UserX className="w-8 h-8" style={{ color: '#4ADE80', opacity: 0.8 }} />
                      <p className="empty-sem-retorno-text">
                        Nenhum paciente sem retorno no momento
                      </p>
                    </div>
                  ) : (
                    /* Lista com o nome dos pacientes cuja última consulta foi há mais de 30 dias */
                    <div className="sem-retorno-list">
                      {metrics.pacientesSemRetorno.map((item) => (
                        <div
                          key={item.paciente.id}
                          className="sem-retorno-item"
                          onClick={() => handleOpenPacienteProfile(item.paciente, item.diasSemConsulta)}
                          title="Clique para ver o perfil do paciente"
                          id={`paciente-sem-retorno-${item.paciente.id}`}
                        >
                          <div className="item-patient-info">
                            <div className="avatar-badge avatar-small">
                              {item.paciente.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="patient-name-link">
                                {item.paciente.nome}
                              </div>
                              <div className="patient-days-sub">
                                Última consulta há {item.diasSemConsulta} dias ({item.ultimaConsultaData})
                              </div>
                            </div>
                          </div>

                          <div className="item-action">
                            <span className="action-tag">Ver Perfil</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal do Perfil do Paciente quando clicado */}
      <PacientePerfilModal
        paciente={selectedPaciente}
        diasSemConsulta={selectedSemRetornoDays}
        onClose={() => {
          setSelectedPaciente(null);
          setSelectedSemRetornoDays(undefined);
        }}
      />
    </div>
  );
};
