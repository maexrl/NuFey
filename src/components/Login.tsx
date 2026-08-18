import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export const Login: React.FC = () => {
  const { login, setCurrentView } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      const res = await login(email, password);
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
    <div className="auth-card">
      <Logo subtitle="Acesse o seu portal de gestão nutricional" />

      {errorMessage && (
        <div className="alert-error" role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">
            E-mail profissional
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
          <label htmlFor="login-password" className="form-label">
            Senha
          </label>
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

        <button type="submit" className="btn-primary" disabled={loading} id="btn-login-submit">
          {loading ? (
            <span className="spinner" />
          ) : (
            <>
              Entrar <ArrowRight className="w-5 h-5" />
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
  );
};
