import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export const Register: React.FC = () => {
  const { register, setCurrentView } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'ROLE_ADMIN' | 'ROLE_CLIENT'>('ROLE_ADMIN');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem. Verifique e tente novamente.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password, selectedRole);
      if (!res.success) {
        setErrorMessage(res.error || 'Falha ao criar conta. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao realizar o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <Logo subtitle="Crie sua conta no portal NuFey" />

      {errorMessage && (
        <div className="alert-error" role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Seleção do Nível de Acesso (ROLE_ADMIN vs ROLE_CLIENT) */}
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
            Administrador (Nutri)
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
            Usuário (Paciente)
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="reg-name" className="form-label">
            Nome completo
          </label>
          <div className="input-wrapper">
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder={selectedRole === 'ROLE_ADMIN' ? 'Dra. Juliana Silva' : 'João Santos'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoComplete="name"
              required
            />
            <User className="input-icon w-5 h-5" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reg-email" className="form-label">
            {selectedRole === 'ROLE_ADMIN' ? 'E-mail profissional' : 'E-mail do paciente'}
          </label>
          <div className="input-wrapper">
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="seu.email@exemplo.com"
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
          <label htmlFor="reg-password" className="form-label">
            Senha (mínimo 9 caracteres)
          </label>
          <div className="input-wrapper">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="No mínimo 9 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
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

        <div className="form-group">
          <label htmlFor="reg-confirm-password" className="form-label">
            Confirmar senha
          </label>
          <div className="input-wrapper">
            <input
              id="reg-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              required
            />
            <Lock className="input-icon w-5 h-5" />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} id="btn-register-submit">
          {loading ? (
            <span className="spinner" />
          ) : (
            <>
              Criar conta ({selectedRole === 'ROLE_ADMIN' ? 'Admin' : 'Usuário'}) <UserPlus className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <span>Já tem conta?</span>
        <button
          type="button"
          className="auth-link"
          onClick={() => setCurrentView('login')}
          id="link-go-to-login"
        >
          Faça login
        </button>
      </div>
    </div>
  );
};
