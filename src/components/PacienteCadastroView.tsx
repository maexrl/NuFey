import React, { useState } from 'react';
import { ArrowLeft, Check, Save } from 'lucide-react';
import type { Paciente } from '../lib/neonData';
import { addPaciente } from '../lib/neonData';
import { useAuth } from '../context/AuthContext';

interface PacienteCadastroViewProps {
  onBack: () => void;
  onSuccess: (paciente: Paciente) => void;
}

export const PacienteCadastroView: React.FC<PacienteCadastroViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Aba 1 — Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Feminino');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 — Clínico
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([]);
  const [objetivoLivre, setObjetivoLivre] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Moderadamente ativo');
  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([]);
  const [patologiaLivre, setPatologiaLivre] = useState('');
  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([]);
  const [restricaoLivre, setRestricaoLivre] = useState('');
  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([]);
  const [alergiaLivre, setAlergiaLivre] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('4');
  const [horarioAcorda, setHorarioAcorda] = useState('06:00');
  const [horarioDorme, setHorarioDorme] = useState('22:00');
  const [litrosAgua, setLitrosAgua] = useState('2');
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState(false);
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Formatação / cálculos automáticos
  const calcularIdade = (dataNascStr: string): number | null => {
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

  const calcularIMC = (): { imc: string; classificacao: string } | null => {
    const p = parseFloat(peso.replace(',', '.'));
    const aCm = parseFloat(altura.replace(',', '.'));
    if (!p || !aCm || p <= 0 || aCm <= 0) return null;
    const aM = aCm > 3 ? aCm / 100 : aCm;
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

  const formatarHora = (val: string): string => {
    const limpo = val.replace(/\D/g, '');
    if (!limpo) return '';
    if (limpo.length === 1 || limpo.length === 2) {
      const h = parseInt(limpo, 10);
      return h < 24 ? `${limpo.padStart(2, '0')}:00` : val;
    }
    if (limpo.length === 3) {
      const h = parseInt(limpo.slice(0, 1), 10);
      const m = parseInt(limpo.slice(1), 10);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    if (limpo.length >= 4) {
      const h = parseInt(limpo.slice(0, 2), 10);
      const m = parseInt(limpo.slice(2, 4), 10);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    return val;
  };

  const toggleMultiSelect = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (item === 'Nenhum') {
      setList(['Nenhum']);
      return;
    }
    const semNenhum = list.filter((i) => i !== 'Nenhum');
    if (semNenhum.includes(item)) {
      setList(semNenhum.filter((i) => i !== item));
    } else {
      setList([...semNenhum, item]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nome.trim()) {
      setErrorMessage('O campo Nome Completo é obrigatório.');
      setActiveTab('pessoal');
      return;
    }

    if (!user) {
      setErrorMessage('Nutricionista não autenticada.');
      return;
    }

    setSubmitting(true);
    try {
      // Monta listas finais incluindo itens adicionados livremente
      const objetivosFinais = [...objetivosSelecionados];
      if (objetivoLivre.trim()) objetivosFinais.push(objetivoLivre.trim());

      const patologiasFinais = [...patologiasSelecionadas];
      if (patologiaLivre.trim()) patologiasFinais.push(patologiaLivre.trim());

      const restricoesFinais = [...restricoesSelecionadas];
      if (restricaoLivre.trim()) restricoesFinais.push(restricaoLivre.trim());

      const alergiasFinais = [...alergiasSelecionadas];
      if (alergiaLivre.trim()) alergiasFinais.push(alergiaLivre.trim());

      // Converte altura e peso com suporte a virgula e ponto
      const alturaParsed = altura ? parseFloat(altura.replace(',', '.')) : undefined;
      const alturaM = alturaParsed ? (alturaParsed > 3 ? alturaParsed / 100 : alturaParsed) : undefined;
      const pesoKg = peso ? parseFloat(peso.replace(',', '.')) : undefined;

      const pacienteCriado = await addPaciente(user.id, {
        nome: nome.trim(),
        data_nascimento: dataNascimento || undefined,
        sexo: sexo || undefined,
        whatsapp: whatsapp.trim() || telefone.trim() || undefined,
        email: email.trim() || undefined,
        peso_inicial: pesoKg,
        altura: alturaM,
        objetivos: objetivosFinais.length > 0 ? objetivosFinais : undefined,
        objetivo_texto: objetivoLivre.trim() || undefined,
        nivel_atividade: nivelAtividade,
        patologias: patologiasFinais,
        restricoes_alimentares: restricoesFinais,
        alergias: alergiasFinais,
        medicamentos: medicamentos.trim() || undefined,
        suplementos: suplementos.trim() || undefined,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : undefined,
        horario_acorda: formatarHora(horarioAcorda),
        horario_dorme: formatarHora(horarioDorme),
        litros_agua: litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : undefined,
        atividade_fisica: praticaAtividadeFisica,
        atividade_fisica_descricao: praticaAtividadeFisica ? atividadeFisicaDescricao.trim() : undefined,
        observacoes: observacoes.trim() || undefined,
      });

      setSuccessMessage('Paciente cadastrado com sucesso!');
      setTimeout(() => {
        onSuccess(pacienteCriado);
      }, 1000);
    } catch (err) {
      setErrorMessage('Erro ao salvar paciente. Tente novamente.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const imcResult = calcularIMC();
  const idadeCalculada = calcularIdade(dataNascimento);

  const listaObjetivos = [
    'Emagrecer',
    'Ganhar massa',
    'Controlar diabetes',
    'Saúde geral',
    'Performance esportiva',
    'Reeducação alimentar',
  ];

  const listaPatologias = [
    'Diabetes',
    'Hipertensão',
    'Hipotireoidismo',
    'Hipertireoidismo',
    'Síndrome do ovário policístico',
    'Doença celíaca',
    'Colesterol alto',
  ];

  const listaRestricoes = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
  const listaAlergias = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

  return (
    <div className="view-content-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            style={{ width: 'auto', padding: '0.5rem 0.875rem' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Novo Paciente
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Preencha os dados do paciente organizados em abas.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={submitting}
          style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Salvando...' : 'Salvar Paciente'}</span>
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
          {errorMessage}
        </div>
      )}

      {/* Tabs Nav */}
      <div style={{ maxWidth: '100%', padding: '0.35rem', display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '12px' }}>

        <button
          type="button"
          className={`sidebar-link ${activeTab === 'pessoal' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', padding: '0.75rem' }}
          onClick={() => setActiveTab('pessoal')}
        >
          1. Pessoal {nome.trim() ? '✓' : '*'}
        </button>
        <button
          type="button"
          className={`sidebar-link ${activeTab === 'clinico' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', padding: '0.75rem' }}
          onClick={() => setActiveTab('clinico')}
        >
          2. Clínico
        </button>
        <button
          type="button"
          className={`sidebar-link ${activeTab === 'habitos' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', padding: '0.75rem' }}
          onClick={() => setActiveTab('habitos')}
        >
          3. Hábitos
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="auth-card" style={{ maxWidth: '100%' }}>
        {/* ABA 1 — PESSOAL */}
        {activeTab === 'pessoal' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Nome Completo *</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="Ex: Maria Oliveira Santos"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Nascimento</label>
              <input
                type="date"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
              {idadeCalculada !== null && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-accent-yellow)', marginTop: '0.25rem', fontWeight: 600 }}>
                  Idade calculada: {idadeCalculada} anos
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Sexo</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                {['Feminino', 'Masculino', 'Outro'].map((item) => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                    <input
                      type="radio"
                      name="sexo"
                      value={item}
                      checked={sexo === item}
                      onChange={(e) => setSexo(e.target.value)}
                      style={{ accentColor: 'var(--color-primary-red)' }}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="(11) 3333-4444"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="(11) 99999-8888"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="paciente@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ABA 2 — CLÍNICO */}
        {activeTab === 'clinico' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Peso Atual (kg)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  style={{ paddingLeft: '1rem', paddingRight: '3rem' }}
                  placeholder="70.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                  kg
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Altura (cm)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="1"
                  className="form-input"
                  style={{ paddingLeft: '1rem', paddingRight: '3rem' }}
                  placeholder="170"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                  cm
                </span>
              </div>
            </div>

            {/* IMC Calculado (Somente Leitura) */}
            <div className="form-group">
              <label className="form-label">IMC (Calculado automaticamente)</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem', background: 'rgba(255,255,255,0.05)', color: 'var(--color-accent-yellow)', fontWeight: 700 }}
                readOnly
                value={imcResult ? `${imcResult.imc} kg/m² (${imcResult.classificacao})` : 'Informe peso e altura'}
              />
            </div>

            {/* Nível de Atividade Física */}
            <div className="form-group">
              <label className="form-label">Nível de Atividade Física</label>
              <select
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={nivelAtividade}
                onChange={(e) => setNivelAtividade(e.target.value)}
              >
                <option value="Sedentário">Sedentário</option>
                <option value="Levemente ativo">Levemente ativo</option>
                <option value="Moderadamente ativo">Moderadamente ativo</option>
                <option value="Muito ativo">Muito ativo</option>
                <option value="Extremamente ativo">Extremamente ativo</option>
              </select>
            </div>

            {/* Objetivos */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Objetivo(s)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {listaObjetivos.map((obj) => {
                  const sel = objetivosSelecionados.includes(obj);
                  return (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => toggleMultiSelect(obj, objetivosSelecionados, setObjetivosSelecionados)}
                      style={{
                        padding: '0.4rem 0.875rem',
                        borderRadius: '999px',
                        border: '1px solid',
                        borderColor: sel ? 'var(--color-primary-red)' : 'rgba(255,255,255,0.15)',
                        background: sel ? 'var(--color-primary-red-light)' : 'rgba(255,255,255,0.05)',
                        color: sel ? '#F43F5E' : 'var(--text-main)',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {sel ? '✓ ' : '+ '} {obj}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="Adicionar objetivo específico (opcional)..."
                value={objetivoLivre}
                onChange={(e) => setObjetivoLivre(e.target.value)}
              />
            </div>

            {/* Patologias */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Patologias ou Condições de Saúde</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {['Nenhum', ...listaPatologias].map((pat) => {
                  const sel = patologiasSelecionadas.includes(pat);
                  return (
                    <button
                      key={pat}
                      type="button"
                      onClick={() => toggleMultiSelect(pat, patologiasSelecionadas, setPatologiasSelecionadas)}
                      style={{
                        padding: '0.4rem 0.875rem',
                        borderRadius: '999px',
                        border: '1px solid',
                        borderColor: sel ? 'var(--color-accent-yellow)' : 'rgba(255,255,255,0.15)',
                        background: sel ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: sel ? '#FBBF24' : 'var(--text-main)',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {sel ? '✓ ' : '+ '} {pat}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="Outra patologia/condição livre..."
                value={patologiaLivre}
                onChange={(e) => setPatologiaLivre(e.target.value)}
              />
            </div>

            {/* Restrições Alimentares */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Restrições Alimentares</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {['Nenhum', ...listaRestricoes].map((rest) => {
                  const sel = restricoesSelecionadas.includes(rest);
                  return (
                    <button
                      key={rest}
                      type="button"
                      onClick={() => toggleMultiSelect(rest, restricoesSelecionadas, setRestricoesSelecionadas)}
                      style={{
                        padding: '0.4rem 0.875rem',
                        borderRadius: '999px',
                        border: '1px solid',
                        borderColor: sel ? '#38BDF8' : 'rgba(255,255,255,0.15)',
                        background: sel ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: sel ? '#38BDF8' : 'var(--text-main)',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {sel ? '✓ ' : '+ '} {rest}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="Outra restrição alimentar livre..."
                value={restricaoLivre}
                onChange={(e) => setRestricaoLivre(e.target.value)}
              />
            </div>

            {/* Alergias Alimentares */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Alergias Alimentares</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {['Nenhum', ...listaAlergias].map((alerg) => {
                  const sel = alergiasSelecionadas.includes(alerg);
                  return (
                    <button
                      key={alerg}
                      type="button"
                      onClick={() => toggleMultiSelect(alerg, alergiasSelecionadas, setAlergiasSelecionadas)}
                      style={{
                        padding: '0.4rem 0.875rem',
                        borderRadius: '999px',
                        border: '1px solid',
                        borderColor: sel ? '#A855F7' : 'rgba(255,255,255,0.15)',
                        background: sel ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: sel ? '#C084FC' : 'var(--text-main)',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {sel ? '✓ ' : '+ '} {alerg}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="Outra alergia alimentar livre..."
                value={alergiaLivre}
                onChange={(e) => setAlergiaLivre(e.target.value)}
              />
            </div>

            {/* Medicamentos & Suplementos */}
            <div className="form-group">
              <label className="form-label">Medicamentos Contínuos</label>
              <textarea
                className="form-input"
                rows={3}
                style={{ padding: '0.75rem 1rem', resize: 'vertical' }}
                placeholder="Ex: Papanicolau 50mg, Levotiroxina..."
                value={medicamentos}
                onChange={(e) => setMedicamentos(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Suplementos em Uso</label>
              <textarea
                className="form-input"
                rows={3}
                style={{ padding: '0.75rem 1rem', resize: 'vertical' }}
                placeholder="Ex: Whey Protein, Creatina 5g, Vitamina D..."
                value={suplementos}
                onChange={(e) => setSuplementos(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ABA 3 — HÁBITOS */}
        {activeTab === 'habitos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Quantas refeições faz por dia?</label>
              <input
                type="number"
                min="1"
                max="10"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={refeicoesPorDia}
                onChange={(e) => setRefeicoesPorDia(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Horário que acorda</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="Ex: 6 ou 06:30"
                value={horarioAcorda}
                onChange={(e) => setHorarioAcorda(e.target.value)}
                onBlur={() => setHorarioAcorda(formatarHora(horarioAcorda))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Formato automático ex: 6 → 06:00, 630 → 06:30
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Horário que dorme</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="Ex: 23 ou 22:30"
                value={horarioDorme}
                onChange={(e) => setHorarioDorme(e.target.value)}
                onBlur={() => setHorarioDorme(formatarHora(horarioDorme))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Formato automático ex: 23 → 23:00, 2230 → 22:30
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Quantidade de água por dia</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  style={{ paddingLeft: '1rem', paddingRight: '4rem' }}
                  placeholder="2"
                  value={litrosAgua}
                  onChange={(e) => setLitrosAgua(e.target.value)}
                />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                  litros
                </span>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Pratica atividade física?</label>
              <div style={{ display: 'flex', gap: '1.5rem', margin: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                  <input
                    type="radio"
                    name="praticaAtividade"
                    checked={praticaAtividadeFisica === true}
                    onChange={() => setPraticaAtividadeFisica(true)}
                    style={{ accentColor: 'var(--color-primary-red)' }}
                  />
                  Sim
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                  <input
                    type="radio"
                    name="praticaAtividade"
                    checked={praticaAtividadeFisica === false}
                    onChange={() => setPraticaAtividadeFisica(false)}
                    style={{ accentColor: 'var(--color-primary-red)' }}
                  />
                  Não
                </label>
              </div>

              {praticaAtividadeFisica && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Qual atividade e frequência semanal?</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="Ex: Musculação 4x na semana e Corrida 2x na semana"
                    value={atividadeFisicaDescricao}
                    onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Observações Gerais</label>
              <textarea
                className="form-input"
                rows={4}
                style={{ padding: '0.75rem 1rem', resize: 'vertical' }}
                placeholder="Anotações gerais do paciente..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Buttons bottom */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
          <div>
            {activeTab === 'clinico' && (
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('pessoal')}>
                Anterior: Pessoal
              </button>
            )}
            {activeTab === 'habitos' && (
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('clinico')}>
                Anterior: Clínico
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {activeTab === 'pessoal' && (
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('clinico')}>
                Próximo: Clínico →
              </button>
            )}
            {activeTab === 'clinico' && (
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('habitos')}>
                Próximo: Hábitos →
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: 'auto' }}>
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Salvando...' : 'Salvar Paciente'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
