import React, { useState } from 'react';
import { Search, Plus, User, ChevronRight, AlertTriangle, Calendar } from 'lucide-react';
import type { Paciente, PacienteSemRetorno } from '../lib/neonData';
import { PacienteCadastroView } from './PacienteCadastroView';

interface PacientesViewProps {
  pacientes: Paciente[];
  pacientesSemRetorno: PacienteSemRetorno[];
  onSelectPaciente: (paciente: Paciente, diasSemConsulta?: number) => void;
  onRefresh: () => void;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  pacientes,
  pacientesSemRetorno,
  onSelectPaciente,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'cadastro'>('list');

  const filtered = pacientes.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSemRetornoDays = (pacienteId: string) => {
    const found = pacientesSemRetorno.find((item) => item.paciente.id === pacienteId);
    return found ? found.diasSemConsulta : undefined;
  };

  const getUltimaConsultaStr = (paciente: Paciente) => {
    const semRetorno = pacientesSemRetorno.find((item) => item.paciente.id === paciente.id);
    if (semRetorno) {
      const parts = semRetorno.ultimaConsultaData.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return semRetorno.ultimaConsultaData;
    }
    const parts = paciente.created_at.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return 'Sem registro';
  };

  const getObjetivoStr = (paciente: Paciente) => {
    if (paciente.objetivos && paciente.objetivos.length > 0) {
      return paciente.objetivos.slice(0, 2).join(', ');
    }
    if (paciente.objetivo_texto) {
      return paciente.objetivo_texto;
    }
    return 'Não informado';
  };

  if (viewMode === 'cadastro') {
    return (
      <PacienteCadastroView
        onBack={() => setViewMode('list')}
        onSuccess={(pacienteRecemCriado) => {
          onRefresh();
          setViewMode('list');
          onSelectPaciente(pacienteRecemCriado);
        }}
      />
    );
  }

  return (
    <div className="view-content-container">
      {/* Header da Listagem */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Listagem de Pacientes
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Visualização de todos os pacientes vinculados ao consultório.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: 'auto', padding: '0.75rem 1.25rem' }}
          onClick={() => setViewMode('cadastro')}
          id="btn-novo-paciente"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Campo de busca no topo */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <div className="input-wrapper">
          <Search className="input-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nome do paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="input-busca-pacientes"
          />
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="auth-card" style={{ maxWidth: '100%', textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <User className="w-12 h-12" style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.6 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', fontWeight: 600 }}>
              {searchTerm ? 'Nenhum paciente encontrado para a busca.' : 'Nenhum paciente cadastrado ainda'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', margin: '1.25rem auto 0' }}
                onClick={() => setViewMode('cadastro')}
              >
                Cadastrar Primeiro Paciente
              </button>
            )}
          </div>
        ) : (
          filtered.map((paciente) => {
            const semRetornoDays = getSemRetornoDays(paciente.id);
            return (
              <div
                key={paciente.id}
                className="stat-card"
                style={{
                  cursor: 'pointer',
                  justifyContent: 'space-between',
                  borderColor: semRetornoDays ? 'rgba(245, 158, 11, 0.4)' : undefined,
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
                onClick={() => onSelectPaciente(paciente, semRetornoDays)}
                id={`paciente-card-${paciente.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar-badge" style={{ width: 48, height: 48, fontSize: '1.1rem' }}>
                    {paciente.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {paciente.nome}
                      </h3>
                      {semRetornoDays ? (
                        <span
                          style={{
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#FBBF24',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.6rem',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Sem retorno ({semRetornoDays}d)
                        </span>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        <strong>Objetivo:</strong> {getObjetivoStr(paciente)}
                      </p>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar className="w-3.5 h-3.5" /> <strong>Última consulta:</strong> {getUltimaConsultaStr(paciente)}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

