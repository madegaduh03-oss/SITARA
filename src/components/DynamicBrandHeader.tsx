import React, { useState } from 'react';
import {
  Building2,
  CreditCard,
  Users,
  Baby,
  Smartphone,
  FileText,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';
import { Service, Settings } from '../types/sitara';

interface BrandLogoProps {
  logoUrl: string;
  altText: string;
  sizeClass?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  altText,
  sizeClass = 'w-14 h-14',
}) => {
  const [failed, setFailed] = useState(false);

  // Reset error state whenever logoUrl changes
  React.useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  if (!logoUrl || failed) {
    return (
      <div
        className={`${sizeClass} rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 border border-slate-700`}
        aria-label={altText}
      >
        <Building2 className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={altText}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${sizeClass} rounded-xl object-contain bg-white border border-slate-200 p-1 shrink-0`}
    />
  );
};

interface DynamicBrandHeaderProps {
  settings: Settings;
  variant?: 'light' | 'dark' | 'teal';
  rightSlot?: React.ReactNode;
}

export const DynamicBrandHeader: React.FC<DynamicBrandHeaderProps> = ({
  settings,
  variant = 'light',
  rightSlot,
}) => {
  const isDark = variant === 'dark' || variant === 'teal';
  const isTeal = variant === 'teal';

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
        isTeal ? 'border-teal-700/70' : isDark ? 'border-slate-800' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <BrandLogo
          logoUrl={settings.logo_url}
          altText={settings.header_text || 'Logo Instansi'}
          sizeClass="w-16 h-16"
        />
        <div className="min-w-0">
          <h1
            className={`font-display text-2xl sm:text-3xl font-bold tracking-tight truncate ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {settings.header_text || 'SITARA'}
          </h1>
          <p
            className={`text-sm sm:text-base mt-0.5 leading-snug ${
              isTeal ? 'text-teal-100' : isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {settings.subheader_text || 'Sistem Informasi Antrean Kecamatan Tulangan'}
          </p>
        </div>
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
};

export const ServiceIcon: React.FC<{ icon: Service['icon']; className?: string }> = ({
  icon,
  className = 'w-6 h-6',
}) => {
  switch (icon) {
    case 'id-card':
      return <CreditCard className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'baby':
      return <Baby className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'building':
      return <Building2 className={className} />;
    case 'clipboard-check':
      return <ClipboardCheck className={className} />;
    case 'shield-check':
      return <ShieldCheck className={className} />;
    default:
      return <FileText className={className} />;
  }
};
