import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../lib/neonAuth';
import {
  getStoredUser,
  signInNutritionist,
  signUpNutritionist,
  signOutNutritionist,
} from '../lib/neonAuth';

export type AuthView = 'login' | 'register' | 'dashboard';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  currentView: AuthView;
  setCurrentView: (view: AuthView) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<AuthView>('login');

  useEffect(() => {
    // Check initial session state on load
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await signInNutritionist(email, password);
    if (res.user) {
      setUser(res.user);
      setCurrentView('dashboard');
      return { success: true };
    }
    return { success: false, error: res.error || 'Falha ao autenticar.' };
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await signUpNutritionist(name, email, password);
    if (res.user) {
      setUser(res.user);
      setCurrentView('dashboard');
      return { success: true };
    }
    return { success: false, error: res.error || 'Falha ao registrar conta.' };
  };

  const logout = async () => {
    await signOutNutritionist();
    setUser(null);
    setCurrentView('login');
  };

  // Rule: Se já estiver logada e tentar acessar login/register, redireciona direto para o dashboard
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
        login,
        register,
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
