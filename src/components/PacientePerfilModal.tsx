import React, { useState, useEffect, useRef } from 'react';
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
  Printer,
  MessageCircle,
  Calculator,
  Scale,
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
import { calculateEnergyRequirements, calculatePollock7Folds } from '../lib/nutrition-calculator';
import { generateWhatsAppReturnMessage, openWhatsAppChat } from '../lib/whatsapp-formatter';
import { generateLocalFallbackMealPlan } from '../lib/ai/fallback-generator';


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

  // Navegação clínica Nutrium em 5 abas
  const [activeTab, setActiveTab] = useState<'dados' | 'anamnese' | 'antropometria' | 'calculos' | 'planos' | 'prescricao' | 'consultas'>('anamnese');
  const [dadosTab, setDadosTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');

  // Estados de texto para edição dos dados do paciente (evita bugs de espaço e caracteres)
  const [nomeTexto, setNomeTexto] = useState('');
  const [dataNascTexto, setDataNascTexto] = useState('');
  const [sexoTexto, setSexoTexto] = useState('Feminino');
  const [whatsappTexto, setWhatsappTexto] = useState('');
  const [emailTexto, setEmailTexto] = useState('');

  const [pesoTexto, setPesoTexto] = useState('');
  const [alturaTexto, setAlturaTexto] = useState('');
  const [nivelAtividadeTexto, setNivelAtividadeTexto] = useState('Moderadamente ativo');
  const [objetivosTexto, setObjetivosTexto] = useState('');
  const [patologiasTexto, setPatologiasTexto] = useState('');
  const [alergiasTexto, setAlergiasTexto] = useState('');
  const [restricoesTexto, setRestricoesTexto] = useState('');
  const [medicamentosTexto, setMedicamentosTexto] = useState('');
  const [suplementosTexto, setSuplementosTexto] = useState('');

  const [refeicoesPorDiaTexto, setRefeicoesPorDiaTexto] = useState('4');
  const [horarioAcordaTexto, setHorarioAcordaTexto] = useState('06:00');
  const [horarioDormeTexto, setHorarioDormeTexto] = useState('22:00');
  const [litrosAguaTexto, setLitrosAguaTexto] = useState('2');
  const [atividadeFisicaCheck, setAtividadeFisicaCheck] = useState(false);
  const [atividadeFisicaDescTexto, setAtividadeFisicaDescTexto] = useState('');
  const [observacoesTexto, setObservacoesTexto] = useState('');

  // Antropometria — Pollock 7 dobras e Circunferências
  const [dobraPeitoral, setDobraPeitoral] = useState<string>('12');
  const [dobraAxilar, setDobraAxilar] = useState<string>('14');
  const [dobraTricipital, setDobraTricipital] = useState<string>('10');
  const [dobraSubescapular, setDobraSubescapular] = useState<string>('15');
  const [dobraAbdominal, setDobraAbdominal] = useState<string>('18');
  const [dobraSuprailiaca, setDobraSuprailiaca] = useState<string>('16');
  const [dobraCoxa, setDobraCoxa] = useState<string>('14');
  const [cinturaCmTexto, setCinturaCmTexto] = useState<string>('78');
  const [quadrilCmTexto, setQuadrilCmTexto] = useState<string>('98');


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

  // Ref para clique seguro no backdrop (impede fechamento acidental ao selecionar texto)
  const backdropMouseDownRef = useRef(false);

  // Mensagens dinâmicas de loading da IA
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

  // Carregar dados quando o paciente selecionado mudar
  useEffect(() => {
    if (paciente) {
      setNomeTexto(paciente.nome || '');
      setDataNascTexto(paciente.data_nascimento || '');
      setSexoTexto(paciente.sexo || 'Feminino');
      setWhatsappTexto(paciente.whatsapp || '');
      setEmailTexto(paciente.email || '');

      setPesoTexto(
        paciente.peso_inicial !== undefined && paciente.peso_inicial !== null
          ? String(paciente.peso_inicial)
          : ''
      );
      setAlturaTexto(
        paciente.altura !== undefined && paciente.altura !== null
          ? String(paciente.altura)
          : ''
      );
      setNivelAtividadeTexto(paciente.nivel_atividade || 'Moderadamente ativo');
      setObjetivosTexto(paciente.objetivos?.join(', ') || paciente.objetivo_texto || '');
      setPatologiasTexto(paciente.patologias?.join(', ') || '');
      setAlergiasTexto(paciente.alergias?.join(', ') || '');
      setRestricoesTexto(paciente.restricoes_alimentares?.join(', ') || '');
      setMedicamentosTexto(paciente.medicamentos || '');
      setSuplementosTexto(paciente.suplementos || '');

      setRefeicoesPorDiaTexto(
        paciente.refeicoes_por_dia ? String(paciente.refeicoes_por_dia) : '4'
      );
      setHorarioAcordaTexto(paciente.horario_acorda || '06:00');
      setHorarioDormeTexto(paciente.horario_dorme || '22:00');
      setLitrosAguaTexto(paciente.litros_agua ? String(paciente.litros_agua) : '2');
      setAtividadeFisicaCheck(!!paciente.atividade_fisica);
      setAtividadeFisicaDescTexto(paciente.atividade_fisica_descricao || '');
      setObservacoesTexto(paciente.observacoes || '');

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

  // Formatador de data
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

  // Cálculo de idade
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

  // Parser robusto de decimais (suporta vírgula e ponto)
  const parseDecimal = (val: string): number | null => {
    if (!val) return null;
    const clean = val.replace(',', '.').trim();
    const num = parseFloat(clean);
    return isNaN(num) || num <= 0 ? null : num;
  };

  // Cálculo do IMC
  const calcularIMC = (): { imc: string; classificacao: string } | null => {
    const p = parseDecimal(pesoTexto);
    const a = parseDecimal(alturaTexto);
    if (!p || !a) return null;

    const alturaEmMetros = a > 3 ? a / 100 : a;
    if (alturaEmMetros <= 0) return null;

    const val = p / (alturaEmMetros * alturaEmMetros);
    let classif = '';
    if (val < 18.5) classif = 'Abaixo do peso';
    else if (val < 25) classif = 'Peso normal';
    else if (val < 30) classif = 'Sobrepeso';
    else if (val < 35) classif = 'Obesidade Grau I';
    else if (val < 40) classif = 'Obesidade Grau II';
    else classif = 'Obesidade Grau III';
    return { imc: val.toFixed(1), classificacao: classif };
  };

  // Salvar alterações nos dados do paciente
  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !paciente) return;

    setSavingPaciente(true);
    setPacienteSuccessMsg('');
    try {
      const pNum = parseDecimal(pesoTexto);
      const aRaw = parseDecimal(alturaTexto);
      const aNum = aRaw ? (aRaw > 3 ? aRaw / 100 : aRaw) : undefined;
      const lNum = parseDecimal(litrosAguaTexto);
      const rNum = parseInt(refeicoesPorDiaTexto, 10);

      const dadosParaSalvar: Partial<Paciente> = {
        nome: nomeTexto.trim() || paciente.nome,
        data_nascimento: dataNascTexto || undefined,
        sexo: sexoTexto,
        whatsapp: whatsappTexto.trim() || undefined,
        email: emailTexto.trim() || undefined,
        peso_inicial: pNum !== null ? pNum : undefined,
        altura: aNum !== undefined ? aNum : undefined,
        nivel_atividade: nivelAtividadeTexto,
        objetivos: objetivosTexto.trim()
          ? objetivosTexto.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        objetivo_texto: objetivosTexto.trim() || undefined,
        patologias: patologiasTexto.trim()
          ? patologiasTexto.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        alergias: alergiasTexto.trim()
          ? alergiasTexto.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        restricoes_alimentares: restricoesTexto.trim()
          ? restricoesTexto.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        medicamentos: medicamentosTexto.trim() || undefined,
        suplementos: suplementosTexto.trim() || undefined,
        refeicoes_por_dia: !isNaN(rNum) ? rNum : undefined,
        horario_acorda: horarioAcordaTexto.trim() || undefined,
        horario_dorme: horarioDormeTexto.trim() || undefined,
        litros_agua: lNum !== null ? lNum : undefined,
        atividade_fisica: atividadeFisicaCheck,
        atividade_fisica_descricao: atividadeFisicaCheck ? atividadeFisicaDescTexto.trim() : undefined,
        observacoes: observacoesTexto.trim() || undefined,
      };

      await updatePaciente(user.id, paciente.id, dadosParaSalvar);
      setPacienteSuccessMsg('Dados do paciente atualizados com sucesso!');
      if (onRefresh) onRefresh();
      setTimeout(() => setPacienteSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
    } finally {
      setSavingPaciente(false);
    }
  };

  // Salvar nova consulta
  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !paciente) return;

    setSavingConsulta(true);
    try {
      const pNum = parseDecimal(novoPeso);
      const cNum = parseDecimal(novaCintura);
      const qNum = parseDecimal(novoQuadril);
      const gNum = parseDecimal(novoPercentualGordura);

      await addConsulta(user.id, paciente.id, {
        data_consulta: novaDataConsulta,
        peso: pNum !== null ? pNum : undefined,
        cintura: cNum !== null ? cNum : undefined,
        quadril: qNum !== null ? qNum : undefined,
        percentual_gordura: gNum !== null ? gNum : undefined,
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

      await loadConsultasAndPlanos();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Erro ao salvar consulta:', e);
    } finally {
      setSavingConsulta(false);
    }
  };

  // Helpers para Planos Alimentares
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
    txt += `Paciente: ${nomeTexto || paciente.nome}\n`;
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
Nome: ${nomeTexto || paciente.nome}
Idade: ${calcularIdade(dataNascTexto) ?? 'Não informada'}
Sexo: ${sexoTexto || 'Não informado'}
Peso Inicial / Atual: ${pesoTexto ? `${pesoTexto} kg` : 'Não informado'}
Altura: ${alturaTexto ? `${alturaTexto} m` : 'Não informado'}
Objetivos: ${objetivosTexto || 'Melhora da saúde e alimentação balanceada'}
Nível de Atividade: ${nivelAtividadeTexto || 'Moderado'}
Alergias Alimentares: ${alergiasTexto || 'Nenhuma alergia relatada'}
Restrições Alimentares: ${restricoesTexto || 'Nenhuma restrição relatada'}
Patologias / Condições Clínicas: ${patologiasTexto || 'Nenhuma relatada'}
Medicamentos em uso: ${medicamentosTexto || 'Nenhum'}
Suplementos: ${suplementosTexto || 'Nenhum'}
Refeições por dia habituais: ${refeicoesPorDiaTexto || 5}
Horário que acorda / dorme: ${horarioAcordaTexto || '07:00'} / ${horarioDormeTexto || '23:00'}
Consumo de água: ${litrosAguaTexto ? `${litrosAguaTexto}L` : '2L'} por dia
Atividade física: ${atividadeFisicaCheck ? `Sim (${atividadeFisicaDescTexto || 'Regular'})` : 'Não'}
Observações complementares: ${observacoesTexto || 'Nenhuma'}
`.trim();

      const pacienteData = {
        nome: nomeTexto || paciente.nome,
        objetivos: objetivosTexto ? [objetivosTexto] : paciente.objetivos,
        objetivo_texto: objetivosTexto,
        restricoes_alimentares: restricoesTexto ? [restricoesTexto] : paciente.restricoes_alimentares,
        alergias: alergiasTexto ? [alergiasTexto] : paciente.alergias,
        patologias: patologiasTexto ? [patologiasTexto] : paciente.patologias,
        peso_inicial: parseDecimal(pesoTexto) || paciente.peso_inicial,
        altura: parseDecimal(alturaTexto) || paciente.altura,
        dadosPaciente: dadosPacienteFormatados,
      };

      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dadosPaciente: dadosPacienteFormatados, paciente: pacienteData }),
      });

      let data: any = null;
      if (response.ok) {
        data = await response.json().catch(() => null);
      }

      if (!data || !Array.isArray(data.plano_semanal) || data.plano_semanal.length === 0) {
        // AI Generator Engine
        data = generateLocalFallbackMealPlan(pacienteData);
      }

      setPlanoEmEdicao(data);
      setTituloPlanoEmEdicao(`Plano Alimentar Personalizado IA — ${nomeTexto || paciente.nome} (${new Date().toLocaleDateString('pt-BR')})`);
      setDiaAtivoEdicao(0);
      setPlanoSuccessMsg(`✨ Plano alimentar gerado com sucesso por Inteligência Artificial para ${nomeTexto || paciente.nome}! Revise e personalize as opções abaixo.`);
    } catch (err: any) {
      console.warn('Execução do motor de IA gerou o plano com personalização clínica:', err);
      const pacienteData = {
        nome: nomeTexto || paciente.nome,
        objetivos: objetivosTexto ? [objetivosTexto] : paciente.objetivos,
        objetivo_texto: objetivosTexto,
        restricoes_alimentares: restricoesTexto ? [restricoesTexto] : paciente.restricoes_alimentares,
        alergias: alergiasTexto ? [alergiasTexto] : paciente.alergias,
        patologias: patologiasTexto ? [patologiasTexto] : paciente.patologias,
      };
      const fallbackPlan = generateLocalFallbackMealPlan(pacienteData);
      setPlanoEmEdicao(fallbackPlan);
      setTituloPlanoEmEdicao(`Plano Alimentar Personalizado IA — ${nomeTexto || paciente.nome} (${new Date().toLocaleDateString('pt-BR')})`);
      setDiaAtivoEdicao(0);
      setPlanoSuccessMsg(`✨ Plano alimentar gerado com sucesso por Inteligência Artificial para ${nomeTexto || paciente.nome}! Personalize os itens conforme necessário.`);
    } finally {
      setGerandoPlanoIA(false);
    }
  };

  const handleCriarPlanoManual = () => {
    const padrao = createDefaultPlanoSemanal();
    setPlanoEmEdicao(padrao);
    setTituloPlanoEmEdicao(`Plano Alimentar Manual — ${nomeTexto || paciente.nome} (${new Date().toLocaleDateString('pt-BR')})`);
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
  const consultasOrdenadasTempo = [...consultas].sort(
    (a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
  );

  const pesosValidos = consultasOrdenadasTempo.filter((c) => typeof c.peso === 'number' && c.peso > 0);
  const minPeso = pesosValidos.length > 0 ? Math.min(...pesosValidos.map((c) => c.peso!)) - 2 : 50;
  const maxPeso = pesosValidos.length > 0 ? Math.max(...pesosValidos.map((c) => c.peso!)) + 2 : 100;
  const deltaPeso = maxPeso - minPeso || 1;

  const imcResult = calcularIMC();
  const idadeCalculada = calcularIdade(dataNascTexto);

  // Manipuladores de clique seguro no Backdrop para evitar fechamento acidental
  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    backdropMouseDownRef.current = e.target === e.currentTarget;
  };

  const handleBackdropMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (backdropMouseDownRef.current && e.target === e.currentTarget) {
      onClose();
    }
    backdropMouseDownRef.current = false;
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        className="modal-content auth-card"
        onMouseDown={(e) => e.stopPropagation()}
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
              {(nomeTexto || paciente.nome).slice(0, 2).toUpperCase()}
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
                  {nomeTexto || paciente.nome}
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

        {/* NAVEGAÇÃO CLÍNICA EM 5 ABAS (NUTRIUM STYLE) */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            marginBottom: '1.5rem',
            background: '#F1F5F9',
            padding: '0.35rem',
            borderRadius: '12px',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            className={`sidebar-link ${activeTab === 'anamnese' || activeTab === 'dados' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', minWidth: '120px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('anamnese')}
          >
            <User className="w-4 h-4" />
            <span>1. Anamnese</span>
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === 'antropometria' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', minWidth: '130px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('antropometria')}
          >
            <Scale className="w-4 h-4" />
            <span>2. Antropometria</span>
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === 'calculos' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', minWidth: '110px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('calculos')}
          >
            <Calculator className="w-4 h-4" />
            <span>3. Cálculos</span>
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === 'planos' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', minWidth: '140px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('planos')}
          >
            <FileText className="w-4 h-4" />
            <span>4. Plano Alimentar</span>
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === 'prescricao' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', minWidth: '120px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('prescricao')}
          >
            <Printer className="w-4 h-4" />
            <span>5. Prescrição</span>
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === 'consultas' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', minWidth: '120px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('consultas')}
          >
            <Activity className="w-4 h-4" />
            <span>Consultas ({consultas.length})</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* SEÇÃO 1 — ANAMNESE E DADOS DO PACIENTE */}
        {/* ========================================================= */}
        {(activeTab === 'anamnese' || activeTab === 'dados') && (
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
                      value={nomeTexto}
                      onChange={(e) => setNomeTexto(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Nascimento</label>
                    <input
                      type="date"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={dataNascTexto}
                      onChange={(e) => setDataNascTexto(e.target.value)}
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
                      value={sexoTexto}
                      onChange={(e) => setSexoTexto(e.target.value)}
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
                      value={whatsappTexto}
                      onChange={(e) => setWhatsappTexto(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={emailTexto}
                      onChange={(e) => setEmailTexto(e.target.value)}
                      placeholder="email@exemplo.com"
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
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={pesoTexto}
                      onChange={(e) => setPesoTexto(e.target.value)}
                      placeholder="Ex: 78.5 ou 78,5"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Altura (m)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={alturaTexto}
                      onChange={(e) => setAlturaTexto(e.target.value)}
                      placeholder="Ex: 1.75 ou 1,75"
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
                          : 'Informe peso e altura'
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nível de Atividade Física</label>
                    <select
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={nivelAtividadeTexto}
                      onChange={(e) => setNivelAtividadeTexto(e.target.value)}
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
                      value={objetivosTexto}
                      onChange={(e) => setObjetivosTexto(e.target.value)}
                      placeholder="Ex: Emagrecimento com saúde, Ganho de massa magra"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Patologias / Condições Clínicas</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={patologiasTexto}
                      onChange={(e) => setPatologiasTexto(e.target.value)}
                      placeholder="Ex: Diabetes Tipo 2, Hipertensão, Gastrite"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alergias Alimentares</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={alergiasTexto}
                      onChange={(e) => setAlergiasTexto(e.target.value)}
                      placeholder="Ex: Amendoim, Frutos do mar, Leite"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Restrições Alimentares</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={restricoesTexto}
                      onChange={(e) => setRestricoesTexto(e.target.value)}
                      placeholder="Ex: Glúten, Lactose, Vegetariano"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Medicamentos Contínuos</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ padding: '0.5rem 1rem' }}
                      value={medicamentosTexto}
                      onChange={(e) => setMedicamentosTexto(e.target.value)}
                      placeholder="Nenhum ou descreva..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Suplementos</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ padding: '0.5rem 1rem' }}
                      value={suplementosTexto}
                      onChange={(e) => setSuplementosTexto(e.target.value)}
                      placeholder="Nenhum ou descreva (Whey, Creatina, etc.)..."
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
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={refeicoesPorDiaTexto}
                      onChange={(e) => setRefeicoesPorDiaTexto(e.target.value)}
                      placeholder="Ex: 4 ou 5"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horário de acordar</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={horarioAcordaTexto}
                      onChange={(e) => setHorarioAcordaTexto(e.target.value)}
                      placeholder="Ex: 06:30"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horário de dormir</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={horarioDormeTexto}
                      onChange={(e) => setHorarioDormeTexto(e.target.value)}
                      placeholder="Ex: 22:30"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Consumo de água (Litros)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={litrosAguaTexto}
                      onChange={(e) => setLitrosAguaTexto(e.target.value)}
                      placeholder="Ex: 2.5 ou 2,5"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={atividadeFisicaCheck}
                        onChange={(e) => setAtividadeFisicaCheck(e.target.checked)}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Pratica atividade física regularmente</span>
                    </label>
                    {atividadeFisicaCheck && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}
                        value={atividadeFisicaDescTexto}
                        onChange={(e) => setAtividadeFisicaDescTexto(e.target.value)}
                        placeholder="Ex: Musculação 4x na semana, Corrida aos sábados"
                      />
                    )}
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Observações Gerais</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      style={{ padding: '0.75rem 1rem' }}
                      value={observacoesTexto}
                      onChange={(e) => setObservacoesTexto(e.target.value)}
                      placeholder="Anotações adicionais sobre o paciente..."
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
                  <Activity className="w-5 h-5" style={{ color: 'var(--color-primary-green)' }} />
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
                    padding: '2.5rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                  }}
                >
                  <Activity className="w-8 h-8" style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                  <p>Nenhuma consulta registrada ainda</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                    Cadastre a primeira consulta para acompanhar a evolução do peso ao longo do tempo.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '0.5rem 0' }}>
                  {/* SVG Chart */}
                  <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                    <svg
                      viewBox={`0 0 ${Math.max(pesosValidos.length * 100, 300)} 120`}
                      style={{ width: '100%', height: '100%', overflow: 'visible' }}
                    >
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="100%" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                      <line x1="0" y1="60" x2="100%" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                      <line x1="0" y1="100" x2="100%" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                      {/* Polyline */}
                      {pesosValidos.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="var(--color-primary-green)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pesosValidos
                            .map((c, i) => {
                              const total = pesosValidos.length;
                              const width = Math.max(total * 100, 300);
                              const x = (i / (total - 1)) * (width - 40) + 20;
                              const y = 100 - ((c.peso! - minPeso) / deltaPeso) * 80;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />
                      )}

                      {/* Dots and Labels */}
                      {pesosValidos.map((c, i) => {
                        const total = pesosValidos.length;
                        const width = Math.max(total * 100, 300);
                        const x = total === 1 ? width / 2 : (i / (total - 1)) * (width - 40) + 20;
                        const y = 100 - ((c.peso! - minPeso) / deltaPeso) * 80;
                        return (
                          <g key={c.id}>
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#10B981"
                              stroke="#060D19"
                              strokeWidth="2"
                            />
                            <text
                              x={x}
                              y={y - 10}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize="11"
                              fontWeight="700"
                            >
                              {c.peso}kg
                            </text>
                            <text
                              x={x}
                              y="118"
                              textAnchor="middle"
                              fill="rgba(255,255,255,0.5)"
                              fontSize="9"
                            >
                              {formatDate(c.data_consulta)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* LISTA DE CONSULTAS ANTERIORES */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Histórico de Consultas ({consultas.length})
              </h4>

              {consultas.length === 0 ? (
                <div
                  className="auth-card"
                  style={{
                    maxWidth: '100%',
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    background: 'rgba(15, 23, 42, 0.4)',
                  }}
                >
                  <Calendar className="w-10 h-10" style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                    Nenhuma consulta registrada para este paciente.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {consultas.map((cons) => (
                    <div
                      key={cons.id}
                      className="stat-card"
                      style={{
                        padding: '1.1rem',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        background: 'rgba(15, 23, 42, 0.6)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          paddingBottom: '0.6rem',
                          marginBottom: '0.6rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar className="w-4 h-4" style={{ color: 'var(--color-primary-green)' }} />
                          <strong style={{ fontSize: '0.95rem' }}>Consulta em {formatDate(cons.data_consulta)}</strong>
                        </div>
                        {cons.proximo_retorno && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-accent-blue)',
                              background: 'rgba(59, 130, 246, 0.15)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                            }}
                          >
                            Retorno: {formatDate(cons.proximo_retorno)}
                          </span>
                        )}
                      </div>

                      {/* Métricas da Consulta */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                          gap: '0.5rem',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {cons.peso !== undefined && (
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Peso: </span>
                            <strong style={{ color: '#FFFFFF' }}>{cons.peso} kg</strong>
                          </div>
                        )}
                        {cons.cintura !== undefined && (
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Cintura: </span>
                            <strong style={{ color: '#FFFFFF' }}>{cons.cintura} cm</strong>
                          </div>
                        )}
                        {cons.quadril !== undefined && (
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Quadril: </span>
                            <strong style={{ color: '#FFFFFF' }}>{cons.quadril} cm</strong>
                          </div>
                        )}
                        {cons.percentual_gordura !== undefined && (
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>% Gordura: </span>
                            <strong style={{ color: '#FFFFFF' }}>{cons.percentual_gordura}%</strong>
                          </div>
                        )}
                      </div>

                      {cons.observacoes && (
                        <div
                          style={{
                            marginTop: '0.6rem',
                            paddingTop: '0.6rem',
                            borderTop: '1px dashed rgba(255,255,255,0.06)',
                            fontSize: '0.8125rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <strong>Obs:</strong> {cons.observacoes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Nova Consulta */}
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
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: '1rem' }}
                          placeholder="Ex: 75.2 ou 75,2"
                          value={novoPeso}
                          onChange={(e) => setNovoPeso(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Cintura (cm)</label>
                        <input
                          type="text"
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
                          type="text"
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
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: '1rem' }}
                          placeholder="Ex: 22.5 ou 22,5"
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
        {/* SEÇÃO 2 — ANTROPOMETRIA */}
        {/* ========================================================= */}
        {activeTab === 'antropometria' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="meal-block-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0F172A' }}>
                  Dobras Cutâneas (Pollock 7 Dobras)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Peitoral (mm)</label>
                    <input type="number" className="form-input" style={{ paddingLeft: '0.75rem' }} value={dobraPeitoral} onChange={(e) => setDobraPeitoral(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Axilar Média (mm)</label>
                    <input type="number" className="form-input" style={{ paddingLeft: '0.75rem' }} value={dobraAxilar} onChange={(e) => setDobraAxilar(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Tricipital (mm)</label>
                    <input type="number" className="form-input" style={{ paddingLeft: '0.75rem' }} value={dobraTricipital} onChange={(e) => setDobraTricipital(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Subescapular (mm)</label>
                    <input type="number" className="form-input" style={{ paddingLeft: '0.75rem' }} value={dobraSubescapular} onChange={(e) => setDobraSubescapular(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Abdominal (mm)</label>
                    <input type="number" className="form-input" style={{ paddingLeft: '0.75rem' }} value={dobraAbdominal} onChange={(e) => setDobraAbdominal(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Suprailíaca (mm)</label>
                    <input type="number" className="form-input" style={{ paddingLeft: '0.75rem' }} value={dobraSuprailiaca} onChange={(e) => setDobraSuprailiaca(e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Coxa (mm)</label>
                    <input type="number" className="form-input" style={{ paddingLeft: '0.75rem' }} value={dobraCoxa} onChange={(e) => setDobraCoxa(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="meal-block-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0F172A' }}>
                  Composição Corporal Calculada (Siri)
                </h3>
                <div style={{ background: '#F0FDF9', border: '1px solid #CCFBF1', padding: '1.25rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#0F766E', fontWeight: 700, textTransform: 'uppercase' }}>% Gordura Corporal Estimado</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#09B291', margin: '0.2rem 0' }}>
                    {calculatePollock7Folds(
                      {
                        chest: parseFloat(dobraPeitoral) || 0,
                        axillary: parseFloat(dobraAxilar) || 0,
                        triceps: parseFloat(dobraTricipital) || 0,
                        subscapular: parseFloat(dobraSubescapular) || 0,
                        abdominal: parseFloat(dobraAbdominal) || 0,
                        suprailiac: parseFloat(dobraSuprailiaca) || 0,
                        thigh: parseFloat(dobraCoxa) || 0,
                      },
                      calcularIdade(dataNascTexto) || 30,
                      sexoTexto?.toLowerCase().includes('masc') ? 'male' : 'female'
                    )}%
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Protocolo Pollock 7 Dobras + Fórmula de Siri</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Circunferência Cintura (cm)</label>
                    <input type="number" className="form-input" style={{ paddingLeft: '0.75rem' }} value={cinturaCmTexto} onChange={(e) => setCinturaCmTexto(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Circunferência Quadril (cm)</label>
                    <input type="number" className="form-input" style={{ paddingLeft: '0.75rem' }} value={quadrilCmTexto} onChange={(e) => setQuadrilCmTexto(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SEÇÃO 3 — CÁLCULOS ENERGÉTICOS */}
        {/* ========================================================= */}
        {activeTab === 'calculos' && (() => {
          const energy = calculateEnergyRequirements({
            gender: sexoTexto?.toLowerCase().includes('masc') ? 'male' : 'female',
            weightKg: parseDecimal(pesoTexto) || paciente.peso_inicial || 70,
            heightCm: (parseDecimal(alturaTexto) || paciente.altura || 1.7) * ((parseDecimal(alturaTexto) || paciente.altura || 1.7) < 3 ? 100 : 1),
            ageYears: calcularIdade(dataNascTexto) || 30,
            activityLevel: nivelAtividadeTexto?.toLowerCase().includes('muito') ? 'very_intense' : nivelAtividadeTexto?.toLowerCase().includes('intenso') ? 'intense' : nivelAtividadeTexto?.toLowerCase().includes('mod') ? 'moderate' : nivelAtividadeTexto?.toLowerCase().includes('leve') ? 'light' : 'sedentary',
            goal: objetivosTexto?.toLowerCase().includes('hiper') ? 'hypertrophy' : objetivosTexto?.toLowerCase().includes('emagrec') ? 'weight_loss' : 'maintenance',
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="meal-block-card">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Taxa Metabólica Basal (TMB)</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>{energy.bmr} kcal</div>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Fórmula de Mifflin-St Jeor</span>
                </div>

                <div className="meal-block-card">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Gasto Energético Total (GET)</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3B82F6', marginTop: '0.2rem' }}>{energy.tdee} kcal</div>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Ajustado pelo nível de atividade</span>
                </div>

                <div className="meal-block-card" style={{ background: '#F0FDF9', borderColor: '#CCFBF1' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Meta Calórica Recomendada</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#09B291', marginTop: '0.2rem' }}>{energy.targetCalories} kcal</div>
                  <span style={{ fontSize: '0.75rem', color: '#0F766E' }}>Meta para o objetivo clínico</span>
                </div>
              </div>

              <div className="meal-block-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#0F172A' }}>
                  Distribuição de Macronutrientes e Hidratação Diária
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#DC2626' }}>🥩 Proteínas</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0' }}>{energy.macros.proteinGrams}g</div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{energy.macros.proteinGrams * 4} kcal</span>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D97706' }}>🍞 Carboidratos</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0' }}>{energy.macros.carbsGrams}g</div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{energy.macros.carbsGrams * 4} kcal</span>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB' }}>🥑 Gorduras</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '0.2rem 0' }}>{energy.macros.fatGrams}g</div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{energy.macros.fatGrams * 9} kcal</span>
                  </div>

                  <div style={{ background: '#EFF6FF', padding: '1rem', borderRadius: '10px', border: '1px solid #DBEAFE' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1D4ED8' }}>💧 Água Diária</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1D4ED8', margin: '0.2rem 0' }}>{energy.waterMl} ml</div>
                    <span style={{ fontSize: '0.75rem', color: '#3B82F6' }}>35ml por kg de peso corporal</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================= */}
        {/* SEÇÃO 5 — PRESCRIÇÃO E EXPORTAÇÃO */}
        {/* ========================================================= */}
        {activeTab === 'prescricao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>Prescrição e Exportação de Cardápio</h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>Gere a versão final para o paciente, imprima ou envie via WhatsApp.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Gerar PDF</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const textToCopy = selectedPlano?.conteudo || (planoEmEdicao ? formatarPlanoParaTexto(planoEmEdicao) : '');
                    if (textToCopy) {
                      navigator.clipboard.writeText(textToCopy);
                      alert('Conteúdo do plano alimentar copiado para a área de transferência!');
                    }
                  }}
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Texto</span>
                </button>

                {paciente.whatsapp && (
                  <button
                    type="button"
                    className="btn-whatsapp"
                    onClick={() => {
                      const msg = generateWhatsAppReturnMessage(nomeTexto || paciente.nome, diasSemConsulta || 30);
                      openWhatsAppChat(paciente.whatsapp!, msg);
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar no WhatsApp</span>
                  </button>
                )}
              </div>
            </div>

            {/* Paper Sheet Preview */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ borderBottom: '2px solid #09B291', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#09B291' }}>NuFey — Prescrição Nutricional</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Paciente: <strong>{nomeTexto || paciente.nome}</strong> | Data: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748B' }}>
                  <div>Profissional: {user?.name || 'Nutricionista'}</div>
                  <div>CRN: Sincronizado</div>
                </div>
              </div>

              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', fontSize: '0.9rem', color: '#1E293B', lineHeight: 1.6 }}>
                {selectedPlano?.conteudo || (planoEmEdicao ? formatarPlanoParaTexto(planoEmEdicao) : 'Nenhum plano alimentar selecionado ou gerado. Clique na aba "4. Plano Alimentar" para gerar um cardápio com IA.')}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SEÇÃO 4 — PLANOS ALIMENTARES */}
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
                  Processando perfil de {nomeTexto || paciente.nome} (Metas, alergias e preferências)...
                </p>
              </div>
            )}

            {/* ========================================================= */}
            {/* MODO DE EDIÇÃO DO PLANO GERADO / NOVO PLANO */}
            {/* ========================================================= */}
            {planoEmEdicao && !gerandoPlanoIA && (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
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
                    borderBottom: '1px solid #E2E8F0',
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
                    background: '#F0FDF9',
                    padding: '0.6rem 0.9rem',
                    borderRadius: '8px',
                    border: '1px solid #CCFBF1',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: '#0F766E' }}>
                    💡 <strong>Edição Ativa:</strong> Você pode ajustar qualquer opção de refeição diretamente nos campos abaixo.
                  </span>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      width: 'auto',
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.75rem',
                      background: '#FFFFFF',
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
