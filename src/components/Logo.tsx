import React from 'react';

interface LogoProps {
  subtitle?: string;
  size?: 'normal' | 'large';
}

export const NutritionSymbol: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Haste Central (Esculápio) */}
    <path
      d="M12 2.5V19.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="12" cy="2" r="1" fill="currentColor" />

    {/* Travessão da Balança em Equilíbrio */}
    <path
      d="M5 6.5H19"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />

    {/* Prato Esquerdo e Cordas */}
    <path d="M5 6.5L3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M5 6.5L7 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path
      d="M2.5 11C2.5 12.8 4 13.5 5 13.5C6 13.5 7.5 12.8 7.5 11H2.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />

    {/* Prato Direito e Cordas */}
    <path d="M19 6.5L17 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M19 6.5L21 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path
      d="M16.5 11C16.5 12.8 18 13.5 19 13.5C20 13.5 21.5 12.8 21.5 11H16.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />

    {/* Serpente Enrolada na Haste */}
    <path
      d="M14 5.5C14 5.5 10 7 10 9C10 11 14 12 14 14C14 16 10 17 10 18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />

    {/* Ramos de Trigo / Louro na Base */}
    <path
      d="M3.5 17.5C5.5 20.5 8.5 21.5 12 21.5C15.5 21.5 18.5 20.5 20.5 17.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M4 16.5C3 18 3.5 19.5 5 19.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M20 16.5C21 18 20.5 19.5 19 19.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({ subtitle, size = 'normal' }) => {
  return (
    <div className="brand-header">
      <div className="brand-logo-wrapper">
        <div className="brand-logo-icon">
          <NutritionSymbol className={size === 'large' ? 'w-7 h-7' : 'w-6 h-6'} />
        </div>
        <span className="brand-title">NuFey</span>
      </div>
      {subtitle && <p className="brand-subtitle">{subtitle}</p>}
    </div>
  );
};
