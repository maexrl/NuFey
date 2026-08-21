import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

const AppContent: React.FC = () => {
  const { currentView, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="app-viewport">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="brand-logo-icon" style={{ width: 60, height: 60, borderRadius: 16 }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>⚡</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', fontWeight: 500 }}>Carregando NuFey...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-viewport">
        {isAuthenticated || currentView === 'dashboard' ? (
          <Dashboard />
        ) : currentView === 'register' ? (
          <Register />
        ) : (
          <Login />
        )}
      </div>
      {/* PWA install prompt — appears after 3s if not yet installed */}
      <PWAInstallPrompt />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
