import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Printer,
  ShoppingBag,
  Flame,
  Coffee,
  Sun,
  Moon,
  Apple,
  Save,
  LogOut,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { PlanoSemanalEstrutura, RefeicoesDia, ResumoNutricional } from '../lib/neonData';
import { createDefaultPlanoSemanal } from '../lib/neonData';

export const ClientDashboard: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'plano' | 'anamnese' | 'compras'>('plano');
  const [diaAtivo, setDiaAtivo] = useState<number>(0);

  // Estados da Anamnese do Cliente
  const [idade, setIdade] = useState('28');
  const [sexo, setSexo] = useState('Feminino');
  const [peso, setPeso] = useState('65');
  const [altura, setAltura] = useState('1.68');
  const [nivelAtividade, setNivelAtividade] = useState('Moderadamente ativo');
  const [objetivo, setObjetivo] = useState('Emagrecimento & Reeducação Alimentar');
  const [alergias, setAlergias] = useState('Lactose');
  const [restricoes, setRestricoes] = useState('Sem carne vermelha');
  const [preferencias, setPreferencias] = useState('Frutas vermelhas, ovos, frango, aveia, batata doce');
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('5');
  const [horarios, setHorarios] = useState('07:00, 10:00, 13:00, 16:30, 20:00');
  const [orcamento, setOrcamento] = useState('Médio / Acessível');
  const [salvandoAnamnese, setSalvandoAnamnese] = useState(false);
  const [sucessoAnamneseMsg, setSucessoAnamneseMsg] = useState('');

  // Estado do Plano Alimentar do Cliente
  const [plano, setPlano] = useState<PlanoSemanalEstrutura>(() => createDefaultPlanoSemanal());
  const [resumoNutricional, setResumoNutricional] = useState<ResumoNutricional>({
    calorias_totais: 1850,
    carboidratos_g: 210,
    proteinas_g: 130,
    gorduras_g: 50,
  });

  // Lista de compras gerada
  const [listaCompras, setListaCompras] = useState<string[]>([
    'Ovos orgânicos (2 dúzias)',
    'Pão integral artesanal (1 pacote)',
    'Peito de frango (1.5 kg)',
    'Arroz integral (1 kg)',
    'Feijão carioca (1 kg)',
    'Iogurte natural desnatado (6 unidades)',
    'Banana prata e Maçã Fuji (1 kg cada)',
    'Aveia em flocos finos (500g)',
    'Azeite de oliva extravirgem (1 garrafa)',
    'Folhas verdes mistas e Tomate (para a semana)',
  ]);

  useEffect(() => {
    // Carregar plano salvo do localStorage se disponível
    const localPlano = localStorage.getItem('nufey_client_plano');
    if (localPlano) {
      try {
        const parsed = JSON.parse(localPlano);
        setPlano(parsed);
        if (parsed.resumo_nutricional) setResumoNutricional(parsed.resumo_nutricional);
        if (parsed.lista_compras) setListaCompras(parsed.lista_compras);
      } catch (e) {
        console.warn('Erro ao carregar plano local:', e);
      }
    }
  }, []);

  const handleSaveAnamnese = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoAnamnese(true);
    setSucessoAnamneseMsg('');
    setTimeout(() => {
      setSalvandoAnamnese(false);
      setSucessoAnamneseMsg('✅ Seu perfil de saúde e anamnese foram atualizados com sucesso!');
      setTimeout(() => setSucessoAnamneseMsg(''), 4000);
    }, 600);
  };

  const handlePrintPlano = () => {
    window.print();
  };

  const getRefeicaoIcon = (key: keyof RefeicoesDia) => {
    switch (key) {
      case 'cafe_da_manha':
        return { label: 'Café da Manhã', icon: Coffee, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'lanche_manha':
        return { label: 'Lanche da Manhã', icon: Sun, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' };
      case 'almoco':
        return { label: 'Almoço', icon: Utensils, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'lanche_tarde':
        return { label: 'Lanche da Tarde', icon: Apple, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
      case 'jantar':
        return { label: 'Jantar', icon: Moon, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
      default:
        return { label: key, icon: Utensils, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
    }
  };

  const diaAtual = plano.plano_semanal[diaAtivo] || plano.plano_semanal[0];

  return (
    <div className="client-dashboard-container">
      {/* Header superior do cliente */}
      <header className="client-header">
        <div className="client-brand">
          <div className="brand-logo-icon">
            <span>⚡</span>
          </div>
          <div>
            <h2 className="client-brand-title">NuFey Client</h2>
            <span className="client-role-badge">ROLE_CLIENT</span>
          </div>
        </div>

        <div className="client-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => switchRole('ROLE_ADMIN')}
            title="Alternar para visão de Administrador"
            style={{ fontSize: '0.8125rem' }}
          >
            <span>Modo Nutricionista / Admin 👑</span>
          </button>
          <button type="button" className="btn-secondary btn-icon-only" onClick={logout} title="Sair da Conta">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Welcome banner */}
      <div className="client-welcome-hero">
        <div className="hero-content">
          <h1 className="hero-title">Olá, {user?.name || 'Cliente'}! 👋</h1>
          <p className="hero-subtitle">
            Seu plano alimentar e acompanhamento nutricional individualizado está pronto.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn-primary-glow" onClick={handlePrintPlano}>
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Navegação principal do Cliente */}
      <nav className="client-tabs-nav">
        <button
          type="button"
          className={`client-tab-btn ${activeTab === 'plano' ? 'active' : ''}`}
          onClick={() => setActiveTab('plano')}
        >
          <Utensils className="w-4 h-4" />
          <span>Meu Plano Alimentar</span>
        </button>
        <button
          type="button"
          className={`client-tab-btn ${activeTab === 'anamnese' ? 'active' : ''}`}
          onClick={() => setActiveTab('anamnese')}
        >
          <Edit3 className="w-4 h-4" />
          <span>Anamnese & Perfil de Saúde</span>
        </button>
        <button
          type="button"
          className={`client-tab-btn ${activeTab === 'compras' ? 'active' : ''}`}
          onClick={() => setActiveTab('compras')}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Lista de Compras</span>
        </button>
      </nav>

      {/* Conteúdo Aba 1: Plano Alimentar */}
      {activeTab === 'plano' && (
        <div className="client-plano-view">
          {/* Cards de Resumo Nutricional */}
          <div className="nutritional-summary-grid">
            <div className="macro-card macro-calories">
              <div className="macro-icon">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="macro-value">{resumoNutricional.calorias_totais} kcal</div>
                <div className="macro-label">Meta Calórica Diária</div>
              </div>
            </div>

            <div className="macro-card macro-carbs">
              <div className="macro-icon">🌾</div>
              <div>
                <div className="macro-value">{resumoNutricional.carboidratos_g}g</div>
                <div className="macro-label">Carboidratos</div>
              </div>
            </div>

            <div className="macro-card macro-protein">
              <div className="macro-icon">🍗</div>
              <div>
                <div className="macro-value">{resumoNutricional.proteinas_g}g</div>
                <div className="macro-label">Proteínas</div>
              </div>
            </div>

            <div className="macro-card macro-fat">
              <div className="macro-icon">🥑</div>
              <div>
                <div className="macro-value">{resumoNutricional.gorduras_g}g</div>
                <div className="macro-label">Gorduras</div>
              </div>
            </div>
          </div>

          {/* Seleção dos dias da semana */}
          <div className="client-days-selector">
            {plano.plano_semanal.map((d, index) => (
              <button
                key={d.dia}
                type="button"
                className={`day-pill ${diaAtivo === index ? 'active' : ''}`}
                onClick={() => setDiaAtivo(index)}
              >
                <span>{d.dia}</span>
              </button>
            ))}
          </div>

          {/* Lista de Refeições do dia selecionado */}
          <div className="client-meals-grid">
            {(['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'] as (keyof RefeicoesDia)[]).map((refKey) => {
              const info = getRefeicaoIcon(refKey);
              const IconComp = info.icon;
              const opcoes = diaAtual.refeicoes[refKey] || [];

              return (
                <div key={refKey} className="client-meal-card">
                  <div className="meal-card-header" style={{ borderLeftColor: info.color }}>
                    <div className="meal-title-box">
                      <div className="meal-icon-wrapper" style={{ backgroundColor: info.bg, color: info.color }}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <h3 className="meal-title">{info.label}</h3>
                    </div>
                  </div>

                  <div className="meal-card-body">
                    {opcoes.map((opcao, idx) => (
                      <div key={idx} className="meal-option-item">
                        <span className="option-bullet" style={{ backgroundColor: info.color }} />
                        <span className="option-text">{opcao}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conteúdo Aba 2: Anamnese & Perfil de Saúde */}
      {activeTab === 'anamnese' && (
        <div className="client-anamnese-container">
          <div className="anamnese-card">
            <div className="card-header">
              <h2>Formulário de Anamnese / Perfil de Saúde</h2>
              <p>Preencha e mantenha atualizadas suas informações de saúde para personalizar seu plano alimentar.</p>
            </div>

            {sucessoAnamneseMsg && <div className="alert-success">{sucessoAnamneseMsg}</div>}

            <form onSubmit={handleSaveAnamnese} className="anamnese-form-grid">
              {/* Seção 1: Dados Físicos */}
              <div className="form-section">
                <h3>1. Dados Físicos & Antropometria</h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Idade (anos)</label>
                    <input type="number" value={idade} onChange={(e) => setIdade(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Sexo Biológico</label>
                    <select value={sexo} onChange={(e) => setSexo(e.target.value)}>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Peso Atual (kg)</label>
                    <input type="text" value={peso} onChange={(e) => setPeso(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Altura (m ou cm)</label>
                    <input type="text" value={altura} onChange={(e) => setAltura(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Nível de Atividade Física Habitual</label>
                  <select value={nivelAtividade} onChange={(e) => setNivelAtividade(e.target.value)}>
                    <option value="Sedentário">Sedentário (pouco ou nenhum exercício)</option>
                    <option value="Levemente ativo">Levemente ativo (1 a 3 dias/semana)</option>
                    <option value="Moderadamente ativo">Moderadamente ativo (3 a 5 dias/semana)</option>
                    <option value="Muito ativo">Muito ativo (6 a 7 dias/semana)</option>
                  </select>
                </div>
              </div>

              {/* Seção 2: Objetivos & Saúde */}
              <div className="form-section">
                <h3>2. Objetivos & Restrições</h3>
                <div className="form-group">
                  <label>Objetivo Principal</label>
                  <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
                    <option value="Emagrecimento">Emagrecimento</option>
                    <option value="Hipertrofia">Hipertrofia / Ganho de Massa</option>
                    <option value="Reeducação Alimentar">Reeducação Alimentar</option>
                    <option value="Manutenção de Peso">Manutenção de Peso</option>
                    <option value="Saúde & Disposição">Saúde & Disposição</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Alergias / Intolências Alimentares</label>
                  <input
                    type="text"
                    value={alergias}
                    onChange={(e) => setAlergias(e.target.value)}
                    placeholder="Ex: Glúten, Lactose, Frutos do Mar"
                  />
                </div>
                <div className="form-group">
                  <label>Restrições / Alimentos Rejeitados</label>
                  <input
                    type="text"
                    value={restricoes}
                    onChange={(e) => setRestricoes(e.target.value)}
                    placeholder="Ex: Não consome carne vermelha, coentro..."
                  />
                </div>
                <div className="form-group">
                  <label>Alimentos de Preferência</label>
                  <input
                    type="text"
                    value={preferencias}
                    onChange={(e) => setPreferencias(e.target.value)}
                    placeholder="Ex: Ovos, frango, frutas vermelhas, aveia..."
                  />
                </div>
              </div>

              {/* Seção 3: Rotina & Hábitos */}
              <div className="form-section form-section-full">
                <h3>3. Rotina Diária & Orçamento</h3>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Refeições por dia desejadas</label>
                    <input type="number" value={refeicoesPorDia} onChange={(e) => setRefeicoesPorDia(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Horários Habituais</label>
                    <input type="text" value={horarios} onChange={(e) => setHorarios(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Orçamento Alimentício</label>
                    <input type="text" value={orcamento} onChange={(e) => setOrcamento(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="form-actions-full">
                <button type="submit" className="btn-primary" disabled={salvandoAnamnese}>
                  <Save className="w-4 h-4" />
                  <span>{salvandoAnamnese ? 'Salvando...' : 'Salvar Anamnese'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo Aba 3: Lista de Compras */}
      {activeTab === 'compras' && (
        <div className="client-compras-container">
          <div className="compras-card">
            <div className="card-header">
              <div>
                <h2>Lista de Compras Semanal Automática 🛒</h2>
                <p>Gerada automaticamente pela IA com base nos ingredientes do seu plano alimentar.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
                <span>Imprimir Lista</span>
              </button>
            </div>

            <div className="compras-grid">
              {listaCompras.map((item, index) => (
                <label key={index} className="compras-item">
                  <input type="checkbox" defaultChecked={false} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
