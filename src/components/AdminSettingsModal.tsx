import React, { useState, useEffect } from 'react';
import { X, Key, MessageSquare, Save, CheckCircle2, RefreshCw } from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [customPrompt, setCustomPrompt] = useState(
    `Você é um nutricionista especialista em nutrição clínica e saúde. Com base nos dados do cliente fornecidos (idade, peso, altura, objetivo, restrições e preferências), crie um plano alimentar semanal completo, saudável e diversificado. Especifique porções em gramas ou medidas caseiras e horários para cada refeição.`
  );
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('nufey_custom_gemini_key') || '';
      const savedPrompt = localStorage.getItem('nufey_custom_gemini_prompt');
      if (savedKey) setApiKey(savedKey);
      if (savedPrompt) setCustomPrompt(savedPrompt);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagemSucesso('');

    localStorage.setItem('nufey_custom_gemini_key', apiKey.trim());
    localStorage.setItem('nufey_custom_gemini_prompt', customPrompt.trim());

    setTimeout(() => {
      setSalvando(false);
      setMensagemSucesso('Configurações da API Gemini atualizadas com sucesso!');
      setTimeout(() => {
        setMensagemSucesso('');
        onClose();
      }, 1500);
    }, 400);
  };

  const handleResetPrompt = () => {
    setCustomPrompt(
      `Você é um nutricionista especialista em nutrição clínica e saúde. Com base nos dados do cliente fornecidos (idade, peso, altura, objetivo, restrições e preferências), crie um plano alimentar semanal completo, saudável e diversificado. Especifique porções em gramas ou medidas caseiras e horários para cada refeição.`
    );
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-icon-box stat-purple">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="modal-title">Configurações do Sistema</h2>
              <p className="modal-subtitle">Gestão da Chave de API do Gemini e Engenharia de Prompt</p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {mensagemSucesso && (
          <div className="alert-success" style={{ margin: '1rem 1.5rem 0' }}>
            <CheckCircle2 className="w-4 h-4" /> {mensagemSucesso}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="modal-form-body">
          <div className="form-group">
            <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span>Chave de API do Google Gemini (`GEMINI_API_KEY` / `GOOGLE_API_KEY`)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua API Key aqui (ex: AIzaSy... ou deixe em branco para usar a chave padrão .env)"
              className="input-text-field"
            />
            <p className="field-help-text">
              Se deixado em branco, o sistema utilizará a chave `GOOGLE_API_KEY` já configurada no arquivo `.env`.
            </p>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                <MessageSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <span>Engenharia de Prompt Base (System Instruction)</span>
              </label>
              <button
                type="button"
                className="btn-link-action"
                onClick={handleResetPrompt}
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <RefreshCw className="w-3 h-3" /> Restaurar Padrão
              </button>
            </div>
            <textarea
              rows={6}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="input-textarea-field"
              placeholder="Digite o prompt-base instruindo o Gemini sobre como construir o plano alimentar..."
            />
            <p className="field-help-text">
              Esta instrução orienta a Inteligência Artificial durante a geração automática do plano alimentar.
            </p>
          </div>

          <div className="modal-footer-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              <Save className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
