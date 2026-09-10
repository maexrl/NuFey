import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { TwoFactorModal } from './TwoFactorModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const Login: React.FC = () => {
  const { login, setCurrentView, setShowForgotPasswordModal } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<'ROLE_ADMIN' | 'ROLE_CLIENT'>('ROLE_ADMIN');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Por favor, informe o seu e-mail.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, informe a sua senha.');
      return;
    }

    if (password.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password, selectedRole);
      if (!res.success) {
        setErrorMessage(res.error || 'E-mail ou senha incorretos.');
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao realizar o login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card">
        <Logo subtitle="Acesse o seu portal de gestão nutricional" />

        {errorMessage && (
          <div className="alert-error" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="role-selector-toggle" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '12px' }}>
            <button
              type="button"
              className={`btn-role-tab ${selectedRole === 'ROLE_ADMIN' ? 'active' : ''}`}
              onClick={() => setSelectedRole('ROLE_ADMIN')}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: selectedRole === 'ROLE_ADMIN' ? 'var(--primary)' : 'transparent',
                color: selectedRole === 'ROLE_ADMIN' ? '#000' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              Nutricionista (Admin)
            </button>
            <button
              type="button"
              className={`btn-role-tab ${selectedRole === 'ROLE_CLIENT' ? 'active' : ''}`}
              onClick={() => setSelectedRole('ROLE_CLIENT')}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: selectedRole === 'ROLE_CLIENT' ? '#38BDF8' : 'transparent',
                color: selectedRole === 'ROLE_CLIENT' ? '#000' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              Cliente / Paciente
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              {selectedRole === 'ROLE_CLIENT' ? 'E-mail do Cliente' : 'E-mail profissional'}
            </label>
            <div className="input-wrapper">
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="seu.email@nutri.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
              <Mail className="input-icon w-5 h-5" />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <label htmlFor="login-password" className="form-label" style={{ marginBottom: 0 }}>
                Senha
              </label>
              <button
                type="button"
                className="auth-link"
                onClick={() => setShowForgotPasswordModal(true)}
                style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                id="btn-forgot-password"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Esqueceu a senha?</span>
              </button>
            </div>
            <div className="input-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Mínimo de 9 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <Lock className="input-icon w-5 h-5" />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'rgba(16, 185, 129, 0.08)',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#10B981' }} />
            <span>Autenticação protegida com verificação 2FA por E-mail ou SMS.</span>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} id="btn-login-submit">
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                Entrar com 2FA <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Não tem conta?</span>
          <button
            type="button"
            className="auth-link"
            onClick={() => setCurrentView('register')}
            id="link-go-to-register"
          >
            Cadastre-se
          </button>
        </div>
      </div>

      {/* Modais Globais de 2FA e Redefinição de Senha */}
      <TwoFactorModal />
      <ForgotPasswordModal />
    </>
  );
};
