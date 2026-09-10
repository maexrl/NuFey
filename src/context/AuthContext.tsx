import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../lib/neonAuth';
import {
  getStoredUser,
  setStoredUser,
  signInNutritionist,
  signUpNutritionist,
  signOutNutritionist,
  generate2FACode,
  verify2FACode,
} from '../lib/neonAuth';

export type AuthView = 'login' | 'register' | 'dashboard';

export interface Pending2FASession {
  user: UserProfile;
  email: string;
  method: 'email' | 'sms';
  code?: string;
  type: 'login' | 'reset_password';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  currentView: AuthView;
  setCurrentView: (view: AuthView) => void;
  pending2FA: Pending2FASession | null;
  setPending2FA: (session: Pending2FASession | null) => void;
  showTwoFactorModal: boolean;
  setShowTwoFactorModal: (show: boolean) => void;
  showForgotPasswordModal: boolean;
  setShowForgotPasswordModal: (show: boolean) => void;
  login: (
    email: string,
    password: string,
    role?: 'ROLE_ADMIN' | 'ROLE_CLIENT'
  ) => Promise<{ success: boolean; require2FA?: boolean; method?: 'email' | 'sms'; error?: string }>;
  confirm2FALogin: (code: string) => Promise<{ success: boolean; error?: string }>;
  resend2FACode: (method?: 'email' | 'sms') => Promise<{ success: boolean; code?: string; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: 'ROLE_ADMIN' | 'ROLE_CLIENT',
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: 'ROLE_ADMIN' | 'ROLE_CLIENT') => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<AuthView>('login');
  
  const [pending2FA, setPending2FA] = useState<Pending2FASession | null>(null);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState<boolean>(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role?: 'ROLE_ADMIN' | 'ROLE_CLIENT') => {
    const res = await signInNutritionist(email, password, role);
    if (res.user) {
      if (res.require2FA) {
        // Gerar código de 2FA
        const method = res.twoFactorMethod || 'email';
        const codeRes = await generate2FACode(res.user.email, method, 'login');
        
        const session: Pending2FASession = {
          user: res.user,
          email: res.user.email,
          method,
          code: codeRes.code,
          type: 'login',
        };
        
        setPending2FA(session);
        setShowTwoFactorModal(true);
        return { success: true, require2FA: true, method };
      }

      setUser(res.user);
      setCurrentView('dashboard');
      return { success: true };
    }
    return { success: false, error: res.error || 'Falha ao autenticar.' };
  };

  const confirm2FALogin = async (code: string) => {
    if (!pending2FA) {
      return { success: false, error: 'Nenhuma sessão de verificação 2FA ativa.' };
    }

    const verifyRes = await verify2FACode(pending2FA.email, code, pending2FA.type);
    if (verifyRes.success) {
      setUser(pending2FA.user);
      setStoredUser(pending2FA.user);
      setPending2FA(null);
      setShowTwoFactorModal(false);
      setCurrentView('dashboard');
      return { success: true };
    }

    return { success: false, error: verifyRes.error || 'Código 2FA incorreto.' };
  };

  const resend2FACode = async (overrideMethod?: 'email' | 'sms') => {
    if (!pending2FA) {
      return { success: false, message: 'Nenhuma sessão 2FA ativa.' };
    }

    const method = overrideMethod || pending2FA.method;
    const res = await generate2FACode(pending2FA.email, method, pending2FA.type);
    
    setPending2FA({
      ...pending2FA,
      method,
      code: res.code,
    });

    return {
      success: res.success,
      code: res.code,
      message: res.message || `Código reenviado via ${method.toUpperCase()}.`,
    };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role?: 'ROLE_ADMIN' | 'ROLE_CLIENT',
    phone?: string
  ) => {
    const res = await signUpNutritionist(name, email, password, role, phone);
    if (res.user) {
      setUser(res.user);
      setCurrentView('dashboard');
      return { success: true };
    }
    return { success: false, error: res.error || 'Falha ao registrar conta.' };
  };

  const switchRole = (newRole: 'ROLE_ADMIN' | 'ROLE_CLIENT') => {
    if (!user) return;
    const updatedUser: UserProfile = { ...user, role: newRole };
    setUser(updatedUser);
    setStoredUser(updatedUser);
  };

  const logout = async () => {
    await signOutNutritionist();
    setUser(null);
    setPending2FA(null);
    setShowTwoFactorModal(false);
    setShowForgotPasswordModal(false);
    setCurrentView('login');
  };

  const handleSetCurrentView = (view: AuthView) => {
    if (user && (view === 'login' || view === 'register')) {
      setCurrentView('dashboard');
    } else {
      setCurrentView(view);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        currentView,
        setCurrentView: handleSetCurrentView,
        pending2FA,
        setPending2FA,
        showTwoFactorModal,
        setShowTwoFactorModal,
        showForgotPasswordModal,
        setShowForgotPasswordModal,
        login,
        confirm2FALogin,
        resend2FACode,
        register,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
