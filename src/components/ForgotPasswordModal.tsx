import React, { useState } from 'react';
import { KeyRound, Mail, Smartphone, ArrowRight, CheckCircle2, AlertCircle, X, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestPasswordReset, resetPasswordWithCode } from '../lib/neonAuth';

export const ForgotPasswordModal: React.FC = () => {
  const { showForgotPasswordModal, setShowForgotPasswordModal, setCurrentView } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [resolvedEmail, setResolvedEmail] = useState<string>('');

  if (!showForgotPasswordModal) return null;

  const handleClose = () => {
    setShowForgotPasswordModal(false);
    setStep(1);
    setIdentifier('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setGeneratedCode(null);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier || identifier.trim().length < 3) {
      setErrorMessage('Por favor, informe seu e-mail ou telefone cadastrado.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(identifier, method);
      if (res.success && res.email) {
        setResolvedEmail(res.email);
        setGeneratedCode(res.code || '123456');
        setStep(2);
      } else {
        setErrorMessage(res.error || 'Falha ao gerar código de recuperação.');
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao conectar ao serviço de segurança.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code || code.length < 6) {
      setErrorMessage('Por favor, digite o código de 6 dígitos.');
      return;
    }

    if (!newPassword || newPassword.length < 9) {
      setErrorMessage('A nova senha deve possuir no mínimo 9 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Verifique os campos.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordWithCode(resolvedEmail || identifier, code, newPassword);
      if (res.success) {
        setStep(3);
      } else {
        setErrorMessage(res.error || 'Falha ao redefinir senha. Verifique o código.');
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao atualizar a sua senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        className="modal-card"
        style={{
          background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '24px',
          maxWidth: '480px',
          width: '100%',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.15)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}
            >
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                Redefinir Senha
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Recuperação segura com validação 2FA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
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

        {errorMessage && (
          <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Passo 1: Informar E-mail / Telefone e método */}
        {step === 1 && (
          <form onSubmit={handleRequestCode}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="reset-identifier" className="form-label" style={{ color: '#E2E8F0' }}>
                E-mail ou Telefone Cadastrado
              </label>
              <div className="input-wrapper">
                <input
                  id="reset-identifier"
                  type="text"
                  className="form-input"
                  placeholder="exemplo@nutri.com.br ou (11) 99999-8888"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                />
                <Mail className="input-icon w-5 h-5" />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.5rem' }}>
                Enviar código de validação via:
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '12px',
                    border: method === 'email' ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                    background: method === 'email' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: method === 'email' ? '#10B981' : '#94A3B8',
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
                  onClick={() => setMethod('sms')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '12px',
                    border: method === 'sms' ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                    background: method === 'sms' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: method === 'sms' ? '#38BDF8' : '#94A3B8',
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

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.875rem' }}>
              {loading ? <span className="spinner" /> : <>Enviar Código 2FA <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        )}

        {/* Passo 2: Digitar Código e Nova Senha */}
        {step === 2 && (
          <form onSubmit={handleConfirmReset}>
            {generatedCode && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '14px',
                  padding: '0.875rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#10B981' }} />
                <div style={{ fontSize: '0.8125rem', color: '#E2E8F0' }}>
                  <strong>Código de 2FA ({method.toUpperCase()}):</strong>{' '}
                  <span style={{ fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 800, color: '#34D399', letterSpacing: '2px' }}>
                    {generatedCode}
                  </span>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="reset-2fa-code" className="form-label" style={{ color: '#E2E8F0' }}>
                Código 2FA de 6 Dígitos
              </label>
              <input
                id="reset-2fa-code"
                type="text"
                className="form-input"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#34D399',
                  padding: '0.625rem',
                  fontFamily: 'monospace',
                }}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="reset-new-password" className="form-label" style={{ color: '#E2E8F0' }}>
                Nova Senha (Mínimo de 9 caracteres)
              </label>
              <div className="input-wrapper">
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Lock className="input-icon w-5 h-5" />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="reset-confirm-password" className="form-label" style={{ color: '#E2E8F0' }}>
                Confirme a Nova Senha
              </label>
              <div className="input-wrapper">
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Lock className="input-icon w-5 h-5" />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.875rem' }}>
              {loading ? <span className="spinner" /> : 'Redefinir e Salvar Senha 🔒'}
            </button>
          </form>
        )}

        {/* Passo 3: Sucesso */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                margin: '0 auto 1.25rem auto',
              }}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.5rem' }}>
              Senha Redefinida com Sucesso!
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
              Sua senha foi atualizada no banco de dados Neon. Você já pode fazer login com as novas credenciais.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                handleClose();
                setCurrentView('login');
              }}
              style={{ width: '100%', padding: '0.875rem' }}
            >
              Ir para o Login 🔑
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
