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
  Sparkles,
  RefreshCw,
  Trash2,
  Edit3,
  Coffee,
  Sun,
  Utensils,
  Moon,
  Apple,
  Copy,
  AlertCircle,
} from 'lucide-react';
import type {
  Paciente,
  Consulta,
  PlanoAlimentar,
  PlanoSemanalEstrutura,
  RefeicoesDia,
} from '../lib/neonData';
import {
  updatePaciente,
  getConsultasByPaciente,
  addConsulta,
  getPlanosAlimentaresByPaciente,
  addPlanoAlimentar,
  deletePlanoAlimentar,
  createDefaultPlanoSemanal,
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

  // Editor de Plano com IA / Manual
  const [planoEmEdicao, setPlanoEmEdicao] = useState<PlanoSemanalEstrutura | null>(null);
  const [tituloPlanoEmEdicao, setTituloPlanoEmEdicao] = useState('');
  const [diaAtivoEdicao, setDiaAtivoEdicao] = useState(0);
  const [diaAtivoVisualizacao, setDiaAtivoVisualizacao] = useState(0);
  const [gerandoPlanoIA, setGerandoPlanoIA] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [salvandoPlano, setSalvandoPlano] = useState(false);
  const [planoSuccessMsg, setPlanoSuccessMsg] = useState('');
  const [planoErrorMsg, setPlanoErrorMsg] = useState('');

  // Dynamic loading messages cycling
  const LOADING_MESSAGES = [
    '🔍 Buscando histórico, metas e restrições do paciente...',
    '🧠 IA calculando distribuição calórica e macro-nutrientes...',
    '🥗 Selecionando opções diversificadas da culinária brasileira...',
    '✨ Adaptando cardápio às alergias e preferências alimentares...',
    '📋 Estruturando o plano semanal completo de 7 dias...',
    '🎉 Quase pronto! Finalizando os detalhes das 5 refeições diárias...',
  ];

  useEffect(() => {
    let interval: any;
    if (gerandoPlanoIA) {
      setLoadingMessageIndex(0);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [gerandoPlanoIA]);

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

  // Helpers e Handlers para Planos Alimentares
  const getRefeicaoInfo = (key: keyof RefeicoesDia) => {
    switch (key) {
      case 'cafe_da_manha':
        return { label: 'Café da Manhã', icon: Coffee, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'lanche_manha':
        return { label: 'Lanche da Manhã', icon: Sun, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' };
      case 'almoco':
        return { label: 'Almoço', icon: Utensils, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'lanche_tarde':
        return { label: 'Lanche da Tarde', icon: Apple, color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' };
      case 'jantar':
        return { label: 'Jantar', icon: Moon, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
      default:
        return { label: key, icon: Utensils, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
    }
  };

  const formatarPlanoParaTexto = (plano: PlanoSemanalEstrutura): string => {
    let txt = `====================================================\n`;
    txt += `PLANO ALIMENTAR SEMANAL PERSONALIZADO\n`;
    txt += `Paciente: ${paciente.nome}\n`;
    txt += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    txt += `====================================================\n\n`;

    const refeicaoKeys: (keyof RefeicoesDia)[] = [
      'cafe_da_manha',
      'lanche_manha',
      'almoco',
      'lanche_tarde',
      'jantar',
    ];

    plano.plano_semanal.forEach((dia) => {
      txt += `📌 ${dia.dia.toUpperCase()}\n`;
      txt += `----------------------------------------------------\n`;
      refeicaoKeys.forEach((refKey) => {
        const info = getRefeicaoInfo(refKey);
        txt += `• ${info.label}:\n`;
        dia.refeicoes[refKey]?.forEach((opc, idx) => {
          txt += `   [Opção ${idx + 1}] ${opc}\n`;
        });
        txt += `\n`;
      });
      txt += `\n`;
    });

    return txt;
  };

  const handleGerarPlanoIA = async () => {
    if (!paciente || gerandoPlanoIA) return;

    setGerandoPlanoIA(true);
    setPlanoErrorMsg('');
    setPlanoSuccessMsg('');

    try {
      const dadosPacienteFormatados = `
Nome: ${paciente.nome}
Idade: ${calcularIdade(formData.data_nascimento) ?? 'Não informada'}
Sexo: ${formData.sexo || 'Não informado'}
Peso Inicial / Atual: ${formData.peso_inicial ? `${formData.peso_inicial} kg` : 'Não informado'}
Altura: ${formData.altura ? `${formData.altura} m` : 'Não informado'}
Objetivos: ${formData.objetivos?.length ? formData.objetivos.join(', ') : formData.objetivo_texto || 'Melhora da saúde e alimentação balanceada'}
Nível de Atividade: ${formData.nivel_atividade || 'Moderado'}
Alergias Alimentares: ${formData.alergias?.length ? formData.alergias.join(', ') : 'Nenhuma alergia relatada'}
Restrições Alimentares: ${formData.restricoes_alimentares?.length ? formData.restricoes_alimentares.join(', ') : 'Nenhuma restrição relatada'}
Patologias / Condições Clínicas: ${formData.patologias?.length ? formData.patologias.join(', ') : 'Nenhuma relatada'}
Medicamentos em uso: ${formData.medicamentos || 'Nenhum'}
Suplementos: ${formData.suplementos || 'Nenhum'}
Refeições por dia habituais: ${formData.refeicoes_por_dia || 5}
Horário que acorda / dorme: ${formData.horario_acorda || '07:00'} / ${formData.horario_dorme || '23:00'}
Consumo de água: ${formData.litros_agua ? `${formData.litros_agua}L` : '2L'} por dia
Atividade física: ${formData.atividade_fisica ? `Sim (${formData.atividade_fisica_descricao || 'Regular'})` : 'Não'}
Observações complementares: ${formData.observacoes || 'Nenhuma'}
`.trim();

      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dadosPaciente: dadosPacienteFormatados }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.plano_semanal) || data.plano_semanal.length === 0) {
        throw new Error('Formato de plano alimentar inválido retornado pela IA.');
      }

      setPlanoEmEdicao(data);
      setTituloPlanoEmEdicao(`Plano Alimentar IA — ${paciente.nome} (${new Date().toLocaleDateString('pt-BR')})`);
      setDiaAtivoEdicao(0);
      setPlanoSuccessMsg('✨ Plano alimentar gerado com sucesso pela IA! Revise e personalize as opções abaixo.');
    } catch (err: any) {
      console.error('Erro ao gerar plano com IA:', err);
      setPlanoErrorMsg('Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?');
    } finally {
      setGerandoPlanoIA(false);
    }
  };

  const handleCriarPlanoManual = () => {
    const padrao = createDefaultPlanoSemanal();
    setPlanoEmEdicao(padrao);
    setTituloPlanoEmEdicao(`Plano Alimentar Manual — ${paciente.nome} (${new Date().toLocaleDateString('pt-BR')})`);
    setDiaAtivoEdicao(0);
    setPlanoErrorMsg('');
    setPlanoSuccessMsg('Modelo semanal carregado. Preencha ou modifique as opções conforme desejar.');
  };

  const handleAlterarOpcao = (
    diaIndex: number,
    refeicaoKey: keyof RefeicoesDia,
    opcaoIndex: number,
    novoTexto: string
  ) => {
    if (!planoEmEdicao) return;
    const novoPlano = JSON.parse(JSON.stringify(planoEmEdicao)) as PlanoSemanalEstrutura;
    novoPlano.plano_semanal[diaIndex].refeicoes[refeicaoKey][opcaoIndex] = novoTexto;
    setPlanoEmEdicao(novoPlano);
  };

  const handleAdicionarOpcao = (diaIndex: number, refeicaoKey: keyof RefeicoesDia) => {
    if (!planoEmEdicao) return;
    const novoPlano = JSON.parse(JSON.stringify(planoEmEdicao)) as PlanoSemanalEstrutura;
    const opcoes = novoPlano.plano_semanal[diaIndex].refeicoes[refeicaoKey];
    opcoes.push(`Opção ${opcoes.length + 1}`);
    setPlanoEmEdicao(novoPlano);
  };

  const handleRemoverOpcao = (diaIndex: number, refeicaoKey: keyof RefeicoesDia, opcaoIndex: number) => {
    if (!planoEmEdicao) return;
    const novoPlano = JSON.parse(JSON.stringify(planoEmEdicao)) as PlanoSemanalEstrutura;
    const opcoes = novoPlano.plano_semanal[diaIndex].refeicoes[refeicaoKey];
    if (opcoes.length <= 1) return;
    opcoes.splice(opcaoIndex, 1);
    setPlanoEmEdicao(novoPlano);
  };

  const handleCopiarDiaParaOutros = (diaOrigemIndex: number) => {
    if (!planoEmEdicao) return;
    const novoPlano = JSON.parse(JSON.stringify(planoEmEdicao)) as PlanoSemanalEstrutura;
    const refeicoesOrigem = novoPlano.plano_semanal[diaOrigemIndex].refeicoes;
    novoPlano.plano_semanal.forEach((dia, idx) => {
      if (idx !== diaOrigemIndex) {
        dia.refeicoes = JSON.parse(JSON.stringify(refeicoesOrigem));
      }
    });
    setPlanoEmEdicao(novoPlano);
    setPlanoSuccessMsg(`Refeições de ${planoEmEdicao.plano_semanal[diaOrigemIndex].dia} copiadas para todos os outros dias da semana!`);
    setTimeout(() => setPlanoSuccessMsg(''), 4000);
  };

  const handleSalvarPlano = async () => {
    if (!planoEmEdicao || !user || !paciente) return;

    setSalvandoPlano(true);
    setPlanoErrorMsg('');
    try {
      const textoFormatado = formatarPlanoParaTexto(planoEmEdicao);
      const novoPlano = await addPlanoAlimentar(user.id, paciente.id, {
        titulo: tituloPlanoEmEdicao || `Plano Semanal — ${new Date().toLocaleDateString('pt-BR')}`,
        conteudo: textoFormatado,
        plano_estruturado: planoEmEdicao,
      });

      await loadConsultasAndPlanos();
      setSelectedPlano(novoPlano);
      setPlanoEmEdicao(null);
      setPlanoSuccessMsg('Plano alimentar salvo com sucesso no histórico!');
      if (onRefresh) onRefresh();
      setTimeout(() => setPlanoSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Erro ao salvar plano alimentar:', err);
      setPlanoErrorMsg('Erro ao salvar o plano alimentar no histórico.');
    } finally {
      setSalvandoPlano(false);
    }
  };

  const handleExcluirPlano = async (planoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !confirm('Tem certeza que deseja excluir este plano alimentar do histórico?')) return;
    try {
      await deletePlanoAlimentar(user.id, planoId);
      if (selectedPlano?.id === planoId) setSelectedPlano(null);
      await loadConsultasAndPlanos();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erro ao excluir plano:', err);
    }
  };

  const handleCarregarPlanoParaEdicao = (plano: PlanoAlimentar, e: React.MouseEvent) => {
    e.stopPropagation();
    if (plano.plano_estruturado) {
      setPlanoEmEdicao(JSON.parse(JSON.stringify(plano.plano_estruturado)));
    } else {
      setPlanoEmEdicao(createDefaultPlanoSemanal());
    }
    setTituloPlanoEmEdicao(`${plano.titulo} (Editado)`);
    setDiaAtivoEdicao(0);
    setSelectedPlano(null);
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
            {/* Header e Ações Principais */}
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Planos Alimentares Semanais
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Gere cardápios personalizados com Inteligência Artificial ou crie manualmente.
                </p>
              </div>

              {!planoEmEdicao && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '0.65rem 1.1rem', fontSize: '0.875rem' }}
                    onClick={handleCriarPlanoManual}
                    disabled={gerandoPlanoIA}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Plano Manual</span>
                  </button>

                  <button
                    type="button"
                    className="btn-ai-generate"
                    onClick={handleGerarPlanoIA}
                    disabled={gerandoPlanoIA}
                  >
                    <Sparkles className={`w-4 h-4 ${gerandoPlanoIA ? 'animate-spin' : ''}`} />
                    <span>{gerandoPlanoIA ? 'Gerando Plano com IA...' : '✨ Gerar Plano com IA'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mensagem de Sucesso */}
            {planoSuccessMsg && (
              <div className="alert-success" style={{ marginBottom: '1.25rem' }}>
                <Check className="w-5 h-5 flex-shrink-0" />
                <span>{planoSuccessMsg}</span>
              </div>
            )}

            {/* Mensagem de Erro com Opções de Resiliência */}
            {planoErrorMsg && (
              <div
                className="alert-error"
                style={{
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span style={{ fontWeight: 600 }}>{planoErrorMsg}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: 'auto', padding: '0.4rem 0.9rem', fontSize: '0.8125rem' }}
                    onClick={handleGerarPlanoIA}
                    disabled={gerandoPlanoIA}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tentar Novamente (IA)
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '0.4rem 0.9rem', fontSize: '0.8125rem' }}
                    onClick={handleCriarPlanoManual}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar Plano Manual
                  </button>
                </div>
              </div>
            )}

            {/* Loading Visual com Mensagens Dinâmicas da IA */}
            {gerandoPlanoIA && (
              <div className="ai-loading-container">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Sparkles
                    className="w-7 h-7"
                    style={{ color: 'var(--color-primary-green)', animation: 'spin 3s linear infinite' }}
                  />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Inteligência Artificial NuFey
                </h4>
                <p
                  style={{
                    fontSize: '1rem',
                    color: '#38BDF8',
                    fontWeight: 600,
                    minHeight: '1.8rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Processando perfil de {paciente.nome} (Metas, alergias e preferências alimentares)...
                </p>
              </div>
            )}

            {/* ========================================================= */}
            {/* MODO DE EDIÇÃO DO PLANO GERADO / NOVO PLANO */}
            {/* ========================================================= */}
            {planoEmEdicao && !gerandoPlanoIA && (
              <div
                style={{
                  background: 'rgba(11, 20, 38, 0.9)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(16, 185, 129, 0.15)',
                }}
              >
                {/* Header do Editor */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '1.25rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label className="form-label" style={{ marginBottom: '0.35rem' }}>
                      Título do Plano Alimentar
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem', fontWeight: 700 }}
                      value={tituloPlanoEmEdicao}
                      onChange={(e) => setTituloPlanoEmEdicao(e.target.value)}
                      placeholder="Ex: Plano Semanal — Gabriel Santos"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ width: 'auto', padding: '0.65rem 1rem' }}
                      onClick={() => setPlanoEmEdicao(null)}
                      disabled={salvandoPlano}
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ width: 'auto', padding: '0.65rem 1.4rem' }}
                      onClick={handleSalvarPlano}
                      disabled={salvandoPlano}
                    >
                      <Save className="w-4 h-4" />
                      <span>{salvandoPlano ? 'Salvando...' : 'Salvar Plano Alimentar'}</span>
                    </button>
                  </div>
                </div>

                {/* Dica e Atalho de Cópia */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    background: 'rgba(15, 27, 49, 0.6)',
                    padding: '0.6rem 0.9rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    💡 <strong>Edição Ativa:</strong> Você pode ajustar qualquer opção de refeição diretamente nos campos abaixo.
                  </span>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      width: 'auto',
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.75rem',
                      background: 'rgba(255,255,255,0.06)',
                    }}
                    onClick={() => handleCopiarDiaParaOutros(diaAtivoEdicao)}
                    title="Copiar todas as refeições deste dia para os outros dias da semana"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Replicar {planoEmEdicao.plano_semanal[diaAtivoEdicao]?.dia} para a semana toda</span>
                  </button>
                </div>

                {/* Abas dos Dias da Semana */}
                <div className="day-tabs-nav">
                  {planoEmEdicao.plano_semanal.map((diaItem, idx) => (
                    <button
                      key={diaItem.dia || idx}
                      type="button"
                      className={`day-tab-btn ${diaAtivoEdicao === idx ? 'active' : ''}`}
                      onClick={() => setDiaAtivoEdicao(idx)}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{diaItem.dia}</span>
                    </button>
                  ))}
                </div>

                {/* Refeições do Dia Ativo */}
                {planoEmEdicao.plano_semanal[diaAtivoEdicao] && (
                  <div>
                    {(
                      [
                        'cafe_da_manha',
                        'lanche_manha',
                        'almoco',
                        'lanche_tarde',
                        'jantar',
                      ] as (keyof RefeicoesDia)[]
                    ).map((refeicaoKey) => {
                      const info = getRefeicaoInfo(refeicaoKey);
                      const IconComp = info.icon;
                      const opcoes =
                        planoEmEdicao.plano_semanal[diaAtivoEdicao].refeicoes[refeicaoKey] || [];

                      return (
                        <div key={refeicaoKey} className="meal-block-card">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <div className="meal-header-badge" style={{ margin: 0 }}>
                              <div
                                style={{
                                  background: info.bg,
                                  color: info.color,
                                  padding: '0.35rem',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <span style={{ color: info.color }}>{info.label}</span>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  fontWeight: 500,
                                }}
                              >
                                ({opcoes.length} opções)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAdicionarOpcao(diaAtivoEdicao, refeicaoKey)}
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-muted)',
                                borderRadius: '6px',
                                padding: '0.25rem 0.6rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar opção</span>
                            </button>
                          </div>

                          {/* Lista de Opções da Refeição */}
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {opcoes.map((opcaoTexto, opcIdx) => (
                              <div key={opcIdx} className="option-input-row">
                                <span className="option-index-badge">#{opcIdx + 1}</span>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ paddingLeft: '0.85rem', fontSize: '0.875rem' }}
                                  value={opcaoTexto}
                                  onChange={(e) =>
                                    handleAlterarOpcao(
                                      diaAtivoEdicao,
                                      refeicaoKey,
                                      opcIdx,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Opção ${opcIdx + 1} de ${info.label.toLowerCase()}`}
                                />
                                {opcoes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoverOpcao(diaAtivoEdicao, refeicaoKey, opcIdx)
                                    }
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--text-dim)',
                                      cursor: 'pointer',
                                      padding: '0.3rem',
                                      borderRadius: '4px',
                                    }}
                                    title="Remover opção"
                                  >
                                    <Trash2 className="w-4 h-4 hover:text-red-400" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer do Editor */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '1.25rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: 'auto' }}
                    onClick={() => setPlanoEmEdicao(null)}
                    disabled={salvandoPlano}
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: 'auto', padding: '0.65rem 1.75rem' }}
                    onClick={handleSalvarPlano}
                    disabled={salvandoPlano}
                  >
                    <Save className="w-4 h-4" />
                    <span>{salvandoPlano ? 'Salvando...' : 'Salvar Plano Alimentar'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LISTA DE HISTÓRICO DE PLANOS ALIMENTARES */}
            {/* ========================================================= */}
            <div style={{ marginTop: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Histórico de Planos Salvos ({planos.length})
                </h4>
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
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                    Clique no botão "✨ Gerar Plano com IA" acima para criar um cardápio semanal completo.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {planos.map((plano) => {
                    const isExpanded = selectedPlano?.id === plano.id;
                    const temEstrutura = !!plano.plano_estruturado;

                    return (
                      <div
                        key={plano.id}
                        className="stat-card"
                        style={{
                          padding: '1.25rem',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          cursor: 'pointer',
                          borderColor: isExpanded ? 'var(--color-primary-green)' : undefined,
                          background: isExpanded ? 'rgba(15, 27, 49, 0.85)' : undefined,
                        }}
                        onClick={() => setSelectedPlano(isExpanded ? null : plano)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: 'var(--color-primary-green)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {plano.titulo}
                              </h4>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Salvo em {formatDate(plano.created_at)}
                              </span>
                            </div>
                          </div>

                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{
                                width: 'auto',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.8rem',
                              }}
                              onClick={(e) => handleCarregarPlanoParaEdicao(plano, e)}
                              title="Editar este plano"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#EF4444',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              onClick={(e) => handleExcluirPlano(plano.id, e)}
                              title="Excluir do histórico"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              onClick={() => setSelectedPlano(isExpanded ? null : plano)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Exibir Conteúdo Completo Quando Expandido */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: '1.25rem',
                              paddingTop: '1.25rem',
                              borderTop: '1px solid rgba(255,255,255,0.1)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {temEstrutura && plano.plano_estruturado ? (
                              <div>
                                {/* Abas dos Dias da Semana para Visualização */}
                                <div className="day-tabs-nav" style={{ marginBottom: '1rem' }}>
                                  {plano.plano_estruturado.plano_semanal.map((diaItem, dIdx) => (
                                    <button
                                      key={diaItem.dia || dIdx}
                                      type="button"
                                      className={`day-tab-btn ${diaAtivoVisualizacao === dIdx ? 'active' : ''}`}
                                      onClick={() => setDiaAtivoVisualizacao(dIdx)}
                                    >
                                      <span>{diaItem.dia}</span>
                                    </button>
                                  ))}
                                </div>

                                {plano.plano_estruturado.plano_semanal[diaAtivoVisualizacao] && (
                                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {(
                                      [
                                        'cafe_da_manha',
                                        'lanche_manha',
                                        'almoco',
                                        'lanche_tarde',
                                        'jantar',
                                      ] as (keyof RefeicoesDia)[]
                                    ).map((refKey) => {
                                      const info = getRefeicaoInfo(refKey);
                                      const IconComp = info.icon;
                                      const opcoes =
                                        plano.plano_estruturado!.plano_semanal[diaAtivoVisualizacao]
                                          .refeicoes[refKey] || [];

                                      return (
                                        <div
                                          key={refKey}
                                          style={{
                                            background: 'rgba(15, 27, 49, 0.6)',
                                            borderRadius: '8px',
                                            padding: '0.85rem 1rem',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.5rem',
                                              marginBottom: '0.5rem',
                                            }}
                                          >
                                            <IconComp
                                              className="w-4 h-4"
                                              style={{ color: info.color }}
                                            />
                                            <strong
                                              style={{
                                                fontSize: '0.9rem',
                                                color: info.color,
                                              }}
                                            >
                                              {info.label}
                                            </strong>
                                          </div>

                                          <div
                                            style={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '0.35rem',
                                              paddingLeft: '1.5rem',
                                            }}
                                          >
                                            {opcoes.map((opc, oIdx) => (
                                              <div
                                                key={oIdx}
                                                style={{
                                                  fontSize: '0.875rem',
                                                  color: 'var(--text-main)',
                                                  display: 'flex',
                                                  alignItems: 'baseline',
                                                  gap: '0.4rem',
                                                }}
                                              >
                                                <span
                                                  style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-dim)',
                                                    fontWeight: 700,
                                                  }}
                                                >
                                                  {oIdx + 1}.
                                                </span>
                                                <span>{opc}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                style={{
                                  fontSize: '0.875rem',
                                  whiteSpace: 'pre-wrap',
                                  lineHeight: 1.6,
                                  color: 'var(--text-main)',
                                  background: 'rgba(15, 27, 49, 0.5)',
                                  padding: '1rem',
                                  borderRadius: '8px',
                                }}
                              >
                                {plano.conteudo}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
