import React, { useState } from 'react';
import { ShieldCheck, Mail, Smartphone, RefreshCw, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TwoFactorModal: React.FC = () => {
  const { pending2FA, showTwoFactorModal, setShowTwoFactorModal, confirm2FALogin, resend2FACode } = useAuth();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'sms'>(pending2FA?.method || 'email');

  if (!showTwoFactorModal || !pending2FA) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code || code.length < 6) {
      setErrorMessage('Por favor, informe o código completo de 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const res = await confirm2FALogin(code);
      if (!res.success) {
        setErrorMessage(res.error || 'Código 2FA incorreto ou expirado.');
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao validar o código de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (method: 'email' | 'sms') => {
    setSelectedMethod(method);
    setResending(true);
    setErrorMessage(null);
    try {
      const res = await resend2FACode(method);
      if (res.success) {
        setSuccessNotice(res.message || `Novo código enviado via ${method.toUpperCase()}.`);
        setTimeout(() => setSuccessNotice(null), 6000);
      }
    } catch (err) {
      setErrorMessage('Falha ao reenviar código.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div className="modal-card" style={{
        background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '24px',
        maxWidth: '480px',
        width: '100%',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.15)',
        position: 'relative',
        animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
            }}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                Autenticação de Dois Fatores (2FA)
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Proteção reforçada para a sua conta NuFey
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTwoFactorModal(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '8px',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo delivery banner toast */}
        {pending2FA.code && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '14px',
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#10B981' }} />
            <div style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>
              <strong>Código 2FA gerado ({selectedMethod.toUpperCase()}):</strong>{' '}
              <span style={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 800, color: '#34D399', letterSpacing: '2px' }}>
                {pending2FA.code}
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38BDF8',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <CheckCircle2 className="w-4 h-4" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.5rem' }}>
              Selecione a forma de envio do código:
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleResend('email')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '12px',
                  border: selectedMethod === 'email' ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                  background: selectedMethod === 'email' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: selectedMethod === 'email' ? '#38BDF8' : '#94A3B8',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Mail className="w-4 h-4" />
                <span>E-mail</span>
              </button>

              <button
                type="button"
                onClick={() => handleResend('sms')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '12px',
                  border: selectedMethod === 'sms' ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                  background: selectedMethod === 'sms' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: selectedMethod === 'sms' ? '#10B981' : '#94A3B8',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Smartphone className="w-4 h-4" />
                <span>SMS Celular</span>
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="input-2fa-code" className="form-label" style={{ color: '#E2E8F0' }}>
              Digite o Código de 6 Dígitos
            </label>
            <input
              id="input-2fa-code"
              type="text"
              className="form-input"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{
                textAlign: 'center',
                letterSpacing: '8px',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#38BDF8',
                padding: '0.75rem',
                fontFamily: 'monospace',
              }}
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || code.length < 6}
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
          >
            {loading ? <span className="spinner" /> : 'Confirmar e Entrar 🔐'}
          </button>
        </form>

        {/* Footer actions */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className="auth-link"
            onClick={() => handleResend(selectedMethod)}
            disabled={resending}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'spin' : ''}`} />
            <span>Reenviar código por {selectedMethod.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
