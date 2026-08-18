import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Activity,
  Calendar,
  Plus,
  Save,
  Check,
  TrendingDown,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import type { Paciente, Consulta, PlanoAlimentar } from '../lib/neonData';
import {
  updatePaciente,
  getConsultasByPaciente,
  addConsulta,
  getPlanosAlimentaresByPaciente,
} from '../lib/neonData';
import { useAuth } from '../context/AuthContext';

interface PacientePerfilModalProps {
  paciente: Paciente | null;
  diasSemConsulta?: number;
  onClose: () => void;
  onRefresh?: () => void;
}

export const PacientePerfilModal: React.FC<PacientePerfilModalProps> = ({
  paciente,
  diasSemConsulta,
  onClose,
  onRefresh,
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'dados' | 'consultas' | 'planos'>('dados');
  const [dadosTab, setDadosTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');

  // Paciente edit state
  const [formData, setFormData] = useState<Partial<Paciente>>({});
  const [savingPaciente, setSavingPaciente] = useState(false);
  const [pacienteSuccessMsg, setPacienteSuccessMsg] = useState('');

  // Consultas state
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [showNovaConsultaModal, setShowNovaConsultaModal] = useState(false);

  // Nova Consulta Form state
  const [novaDataConsulta, setNovaDataConsulta] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [novoPeso, setNovoPeso] = useState('');
  const [novaCintura, setNovaCintura] = useState('');
  const [novoQuadril, setNovoQuadril] = useState('');
  const [novoPercentualGordura, setNovoPercentualGordura] = useState('');
  const [novasObservacoes, setNovasObservacoes] = useState('');
  const [novoProximoRetorno, setNovoProximoRetorno] = useState('');
  const [savingConsulta, setSavingConsulta] = useState(false);

  // Planos Alimentares state
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null);

  // Load datos and consultas on mount or patient change
  useEffect(() => {
    if (paciente) {
      setFormData({ ...paciente });
      loadConsultasAndPlanos();
    }
  }, [paciente]);

  const loadConsultasAndPlanos = async () => {
    if (!paciente || !user) return;
    try {
      const cList = await getConsultasByPaciente(user.id, paciente.id);
      setConsultas(cList);

      const pList = await getPlanosAlimentaresByPaciente(user.id, paciente.id);
      setPlanos(pList);
    } catch (e) {
      console.error('Erro ao carregar dados do paciente:', e);
    }
  };

  if (!paciente) return null;

  // Format helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informada';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Age calc
  const calcularIdade = (dataNascStr?: string): number | null => {
    if (!dataNascStr) return null;
    const nasc = new Date(dataNascStr);
    if (isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade >= 0 ? idade : null;
  };

  // IMC Calc
  const calcularIMC = (): { imc: string; classificacao: string } | null => {
    const p = formData.peso_inicial;
    const aM = formData.altura;
    if (!p || !aM || p <= 0 || aM <= 0) return null;
    const val = p / (aM * aM);
    let classif = '';
    if (val < 18.5) classif = 'Abaixo do peso';
    else if (val < 25) classif = 'Peso normal';
    else if (val < 30) classif = 'Sobrepeso';
    else if (val < 35) classif = 'Obesidade Grau I';
    else if (val < 40) classif = 'Obesidade Grau II';
    else classif = 'Obesidade Grau III';
    return { imc: val.toFixed(1), classificacao: classif };
  };

  // Handlers for Paciente Edit
  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingPaciente(true);
    setPacienteSuccessMsg('');
    try {
      await updatePaciente(user.id, paciente.id, formData);
      setPacienteSuccessMsg('Dados do paciente atualizados com sucesso!');
      if (onRefresh) onRefresh();
      setTimeout(() => setPacienteSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPaciente(false);
    }
  };

  // Handler for Nova Consulta
  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !paciente) return;

    setSavingConsulta(true);
    try {
      await addConsulta(user.id, paciente.id, {
        data_consulta: novaDataConsulta,
        peso: novoPeso ? parseFloat(novoPeso) : undefined,
        cintura: novaCintura ? parseFloat(novaCintura) : undefined,
        quadril: novoQuadril ? parseFloat(novoQuadril) : undefined,
        percentual_gordura: novoPercentualGordura ? parseFloat(novoPercentualGordura) : undefined,
        observacoes: novasObservacoes.trim() || undefined,
        proximo_retorno: novoProximoRetorno || null,
      });

      // Reset form
      setNovoPeso('');
      setNovaCintura('');
      setNovoQuadril('');
      setNovoPercentualGordura('');
      setNovasObservacoes('');
      setNovoProximoRetorno('');
      setShowNovaConsultaModal(false);

      // Reload
      await loadConsultasAndPlanos();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Erro ao salvar consulta:', e);
    } finally {
      setSavingConsulta(false);
    }
  };

  // Preparar dados do gráfico de evolução de peso
  // Ordenado por data crescente para o gráfico (da mais antiga para a mais recente)
  const consultasOrdenadasTempo = [...consultas].sort(
    (a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
  );

  const pesosValidos = consultasOrdenadasTempo.filter((c) => typeof c.peso === 'number' && c.peso > 0);
  const minPeso = pesosValidos.length > 0 ? Math.min(...pesosValidos.map((c) => c.peso!)) - 2 : 50;
  const maxPeso = pesosValidos.length > 0 ? Math.max(...pesosValidos.map((c) => c.peso!)) + 2 : 100;
  const deltaPeso = maxPeso - minPeso || 1;

  const imcResult = calcularIMC();
  const idadeCalculada = calcularIdade(formData.data_nascimento);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content auth-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
        }}
      >
        {/* Header Superior */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              className="avatar-badge"
              style={{ width: 50, height: 50, fontSize: '1.2rem', fontWeight: 800 }}
            >
              {paciente.nome.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                  }}
                >
                  {paciente.nome}
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Cadastrado em {formatDate(paciente.created_at)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning se sem retorno */}
        {diasSemConsulta && diasSemConsulta > 30 ? (
          <div
            className="alert-error"
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              color: '#FBBF24',
              marginBottom: '1.25rem',
            }}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <strong>Atenção: Paciente sem retorno!</strong>
              <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                A última consulta foi realizada há {diasSemConsulta} dias e não há agendamento próximo.
              </p>
            </div>
          </div>
        ) : null}

        {/* NAVEGAÇÃO PRINCIPAL EM 3 SEÇÕES (Prompt 5) */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.4rem',
            borderRadius: '12px',
          }}
        >
          <button
            type="button"
            className={`sidebar-link ${activeTab === 'dados' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: '8px' }}
            onClick={() => setActiveTab('dados')}
          >
            <User className="w-4 h-4" />
            <span>1. Dados do Paciente</span>
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === 'consultas' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: '8px' }}
            onClick={() => setActiveTab('consultas')}
          >
            <Activity className="w-4 h-4" />
            <span>2. Consultas ({consultas.length})</span>
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === 'planos' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: '8px' }}
            onClick={() => setActiveTab('planos')}
          >
            <FileText className="w-4 h-4" />
            <span>3. Planos Alimentares</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* SEÇÃO 1 — DADOS DO PACIENTE */}
        {/* ========================================================= */}
        {activeTab === 'dados' && (
          <div>
            {/* Abas Secundárias: Pessoal, Clínico, Hábitos */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '0.5rem',
              }}
            >
              <button
                type="button"
                className={`btn-secondary ${dadosTab === 'pessoal' ? 'btn-primary' : ''}`}
                style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                onClick={() => setDadosTab('pessoal')}
              >
                Pessoal
              </button>
              <button
                type="button"
                className={`btn-secondary ${dadosTab === 'clinico' ? 'btn-primary' : ''}`}
                style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                onClick={() => setDadosTab('clinico')}
              >
                Clínico
              </button>
              <button
                type="button"
                className={`btn-secondary ${dadosTab === 'habitos' ? 'btn-primary' : ''}`}
                style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                onClick={() => setDadosTab('habitos')}
              >
                Hábitos
              </button>
            </div>

            {pacienteSuccessMsg && (
              <div className="alert-success" style={{ marginBottom: '1.25rem' }}>
                <Check className="w-4 h-4" /> {pacienteSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSavePaciente}>
              {/* Sub-aba Pessoal */}
              {dadosTab === 'pessoal' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Nome Completo</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.nome || ''}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                       
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Nascimento</label>
                    <input
                      type="date"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.data_nascimento || ''}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                       
                    />
                    {idadeCalculada !== null && (
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--color-accent-yellow)',
                          marginTop: '0.25rem',
                        }}
                      >
                        {idadeCalculada} anos
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <select
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.sexo || 'Feminino'}
                      onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                       
                    >
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.whatsapp || ''}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                       
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                       
                    />
                  </div>
                </div>
              )}

              {/* Sub-aba Clínico */}
              {dadosTab === 'clinico' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Peso Atual (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.peso_inicial || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          peso_inicial: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                       
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Altura (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.altura || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          altura: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                       
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">IMC (Calculado)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{
                        paddingLeft: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--color-accent-yellow)',
                        fontWeight: 700,
                      }}
                      readOnly
                      value={
                        imcResult
                          ? `${imcResult.imc} kg/m² (${imcResult.classificacao})`
                          : 'Pendente'
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nível de Atividade Física</label>
                    <select
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.nivel_atividade || 'Moderadamente ativo'}
                      onChange={(e) => setFormData({ ...formData, nivel_atividade: e.target.value })}
                       
                    >
                      <option value="Sedentário">Sedentário</option>
                      <option value="Levemente ativo">Levemente ativo</option>
                      <option value="Moderadamente ativo">Moderadamente ativo</option>
                      <option value="Muito ativo">Muito ativo</option>
                      <option value="Extremamente ativo">Extremamente ativo</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Objetivos Nutricionais</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={
                        formData.objetivos?.join(', ') || formData.objetivo_texto || ''
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          objetivos: e.target.value.split(',').map((s) => s.trim()),
                        })
                      }
                       
                      placeholder="Ex: Emagrecimento, Ganho de massa"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Patologias / Condições</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.patologias?.join(', ') || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          patologias: e.target.value.split(',').map((s) => s.trim()),
                        })
                      }
                       
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Medicamentos Contínuos</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ padding: '0.5rem 1rem' }}
                      value={formData.medicamentos || ''}
                      onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                       
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Suplementos</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ padding: '0.5rem 1rem' }}
                      value={formData.suplementos || ''}
                      onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                       
                    />
                  </div>
                </div>
              )}

              {/* Sub-aba Hábitos */}
              {dadosTab === 'habitos' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Refeições por dia</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.refeicoes_por_dia || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          refeicoes_por_dia: e.target.value
                            ? parseInt(e.target.value, 10)
                            : undefined,
                        })
                      }
                       
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horário de acordar</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.horario_acorda || ''}
                      onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                       
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horário de dormir</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.horario_dorme || ''}
                      onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                       
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Consumo de água (Litros)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.litros_agua || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          litros_agua: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                       
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Observações Gerais</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      style={{ padding: '0.75rem 1rem' }}
                      value={formData.observacoes || ''}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                       
                    />
                  </div>
                </div>
              )}

              {/* Botão de Salvar Alterações */}
              <div
                style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: 'auto' }}
                  disabled={savingPaciente}
                >
                  <Save className="w-4 h-4" />
                  <span>{savingPaciente ? 'Salvando...' : 'Salvar alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* SEÇÃO 2 — CONSULTAS & EVOLUÇÃO DE PESO */}
        {/* ========================================================= */}
        {activeTab === 'consultas' && (
          <div>
            {/* Top Bar: Botão Nova Consulta */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Evolução e Registro de Consultas
              </h3>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                onClick={() => setShowNovaConsultaModal(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Nova Consulta</span>
              </button>
            </div>

            {/* GRÁFICO DE EVOLUÇÃO DE PESO */}
            <div
              className="stat-card"
              style={{
                flexDirection: 'column',
                alignItems: 'stretch',
                marginBottom: '1.5rem',
                padding: '1.25rem',
                background: 'rgba(15, 23, 42, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity className="w-5 h-5" style={{ color: 'var(--color-primary-red)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    Gráfico de Evolução de Peso (kg)
                  </span>
                </div>
                {pesosValidos.length >= 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                    {pesosValidos[pesosValidos.length - 1].peso! <= pesosValidos[0].peso! ? (
                      <span style={{ color: '#4ADE80', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <TrendingDown className="w-4 h-4" /> {(pesosValidos[0].peso! - pesosValidos[pesosValidos.length - 1].peso!).toFixed(1)} kg reduzidos
                      </span>
                    ) : (
                      <span style={{ color: '#F43F5E', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <TrendingUp className="w-4 h-4" /> +{(pesosValidos[pesosValidos.length - 1].peso! - pesosValidos[0].peso!).toFixed(1)} kg
                      </span>
                    )}
                  </div>
                )}
              </div>

              {pesosValidos.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Activity
                    className="w-8 h-8"
                    style={{ margin: '0 auto 0.5rem', opacity: 0.4 }}
                  />
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                    Nenhuma consulta registrada ainda
                  </p>
                  <span style={{ fontSize: '0.8125rem' }}>
                    Clique em "Nova Consulta" acima para adicionar o primeiro registro de peso.
                  </span>
                </div>
              ) : (
                /* Gráfico SVG de Linha Customizado & Elegante */
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <div style={{ minWidth: '400px', height: '180px', position: 'relative' }}>
                    <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%' }}>
                      {/* Linhas de grade do fundo */}
                      <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
                      <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
                      <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />

                      {/* Desenho dos Pontos e Linha */}
                      {(() => {
                        const count = pesosValidos.length;
                        const points = pesosValidos.map((item, index) => {
                          const x = count === 1 ? 260 : 50 + (index / (count - 1)) * 410;
                          const ratio = (item.peso! - minPeso) / deltaPeso;
                          const y = 120 - ratio * 100;
                          return { x, y, item };
                        });

                        const pathD = points.reduce(
                          (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                          ''
                        );

                        return (
                          <>
                            {count > 1 && (
                              <path
                                d={pathD}
                                fill="none"
                                stroke="var(--color-primary-red)"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            )}
                            {points.map((p, idx) => (
                              <g key={idx}>
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r="5"
                                  fill="var(--color-accent-yellow)"
                                  stroke="#0F172A"
                                  strokeWidth="2"
                                />
                                <text
                                  x={p.x}
                                  y={p.y - 10}
                                  fill="var(--text-main)"
                                  fontSize="10"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {p.item.peso} kg
                                </text>
                                <text
                                  x={p.x}
                                  y="142"
                                  fill="var(--text-muted)"
                                  fontSize="9"
                                  textAnchor="middle"
                                >
                                  {formatDate(p.item.data_consulta)}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* LISTA DE CONSULTAS EM ORDEM CRONOLÓGICA DECRESCENTE */}
            <div>
              <h4
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Histórico de Consultas ({consultas.length})
              </h4>

              {consultas.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                  }}
                >
                  Nenhum registro no histórico.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {consultas.map((c) => (
                    <div
                      key={c.id}
                      className="stat-card"
                      style={{
                        padding: '1rem',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        background: 'rgba(15, 23, 42, 0.4)',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar className="w-4 h-4" style={{ color: 'var(--color-accent-yellow)' }} />
                          <strong style={{ fontSize: '0.95rem' }}>
                            Consulta em {formatDate(c.data_consulta)}
                          </strong>
                        </div>
                        {c.proximo_retorno && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#38BDF8',
                              background: 'rgba(56, 189, 248, 0.15)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              fontWeight: 600,
                            }}
                          >
                            Retorno: {formatDate(c.proximo_retorno)}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1.25rem',
                          fontSize: '0.84rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.25rem',
                        }}
                      >
                        <span>
                          <strong>Peso:</strong> {c.peso ? `${c.peso} kg` : '-'}
                        </span>
                        <span>
                          <strong>Cintura:</strong> {c.cintura ? `${c.cintura} cm` : '-'}
                        </span>
                        <span>
                          <strong>Quadril:</strong> {c.quadril ? `${c.quadril} cm` : '-'}
                        </span>
                        <span>
                          <strong>% Gordura:</strong>{' '}
                          {c.percentual_gordura ? `${c.percentual_gordura}%` : '-'}
                        </span>
                      </div>

                      {c.observacoes && (
                        <p
                          style={{
                            fontSize: '0.8125rem',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                            marginTop: '0.25rem',
                          }}
                        >
                          "{c.observacoes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MODAL NOVA CONSULTA */}
            {showNovaConsultaModal && (
              <div
                className="modal-backdrop"
                style={{ background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}
                onClick={() => setShowNovaConsultaModal(false)}
              >
                <div
                  className="modal-content auth-card"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '500px', width: '90%' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Registrar Nova Consulta</h3>
                    <button
                      type="button"
                      onClick={() => setShowNovaConsultaModal(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveConsulta}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Data da Consulta</label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ paddingLeft: '1rem' }}
                          value={novaDataConsulta}
                          onChange={(e) => setNovaDataConsulta(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Peso Atual (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-input"
                          style={{ paddingLeft: '1rem' }}
                          placeholder="Ex: 75.2"
                          value={novoPeso}
                          onChange={(e) => setNovoPeso(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Cintura (cm)</label>
                        <input
                          type="number"
                          step="0.5"
                          className="form-input"
                          style={{ paddingLeft: '1rem' }}
                          placeholder="Ex: 80"
                          value={novaCintura}
                          onChange={(e) => setNovaCintura(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Quadril (cm)</label>
                        <input
                          type="number"
                          step="0.5"
                          className="form-input"
                          style={{ paddingLeft: '1rem' }}
                          placeholder="Ex: 95"
                          value={novoQuadril}
                          onChange={(e) => setNovoQuadril(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">% Gordura</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-input"
                          style={{ paddingLeft: '1rem' }}
                          placeholder="Ex: 22.5"
                          value={novoPercentualGordura}
                          onChange={(e) => setNovoPercentualGordura(e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Próximo Retorno (opcional)</label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ paddingLeft: '1rem' }}
                          value={novoProximoRetorno}
                          onChange={(e) => setNovoProximoRetorno(e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Observações</label>
                        <textarea
                          className="form-input"
                          rows={3}
                          style={{ padding: '0.5rem 1rem' }}
                          placeholder="Anotações da consulta..."
                          value={novasObservacoes}
                          onChange={(e) => setNovasObservacoes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowNovaConsultaModal(false)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={savingConsulta}>
                        {savingConsulta ? 'Salvando...' : 'Salvar consulta'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SEÇÃO 3 — PLANOS ALIMENTARES */}
        {/* ========================================================= */}
        {activeTab === 'planos' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Planos Alimentares do Paciente
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Gere novos planos ou consulte o histórico salvo.
                </p>
              </div>

              {/* Botão visível conforme regra do Prompt 5 */}
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
                onClick={() =>
                  alert('A funcionalidade de IA para gerar planos alimentares será conectada no próximo prompt!')
                }
              >
                <FileText className="w-4 h-4" />
                <span>Gerar Plano Alimentar</span>
              </button>
            </div>

            {planos.length === 0 ? (
              <div
                className="auth-card"
                style={{
                  maxWidth: '100%',
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  background: 'rgba(15, 23, 42, 0.4)',
                }}
              >
                <FileText
                  className="w-12 h-12"
                  style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }}
                />
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
                  Nenhum plano alimentar gerado ainda
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {planos.map((plano) => {
                  const isExpanded = selectedPlano?.id === plano.id;
                  return (
                    <div
                      key={plano.id}
                      className="stat-card"
                      style={{
                        padding: '1.25rem',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        cursor: 'pointer',
                        borderColor: isExpanded ? 'var(--color-primary-red)' : undefined,
                      }}
                      onClick={() => setSelectedPlano(isExpanded ? null : plano)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FileText
                            className="w-5 h-5"
                            style={{ color: 'var(--color-accent-yellow)' }}
                          />
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{plano.titulo}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Gerado em {formatDate(plano.created_at)}
                            </span>
                          </div>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        ) : (
                          <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>

                      {/* Exibir conteúdo completo se expandido */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.9rem',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6,
                            color: 'var(--text-main)',
                          }}
                        >
                          {plano.conteudo}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer Fechar */}
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '1rem',
          }}
        >
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
