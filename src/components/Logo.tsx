import React from 'react';
import { Flame } from 'lucide-react';

interface LogoProps {
  subtitle?: string;
  size?: 'normal' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ subtitle, size = 'normal' }) => {
  return (
    <div className="brand-header">
      <div className="brand-logo-wrapper">
        <div className="brand-logo-icon">
          <Flame className={size === 'large' ? 'w-7 h-7' : 'w-6 h-6'} />
        </div>
        <span className="brand-title">NuFey</span>
      </div>
      {subtitle && <p className="brand-subtitle">{subtitle}</p>}
    </div>
  );
};
