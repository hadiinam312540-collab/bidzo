import React, { useState } from 'react';
import bidzoDomainLogo from '../assets/images/bidzo_domain_logo.svg';

interface BidzoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/**
 * Official Bidzo Domain Logo Icon:
 * Features 4 ascending metallic cybernetic pillars with a sweeping futuristic arrow
 * and circuitry lines, matching the official brand domain emblem.
 */
export const BidzoLogoIcon: React.FC<{ sizeClass?: string; className?: string }> = ({
  sizeClass = 'w-8 h-8',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative ${sizeClass} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      {!hasError ? (
        <img
          src={bidzoDomainLogo}
          alt="Bidzo Domain Logo"
          onError={() => setHasError(true)}
          className="w-full h-full object-contain filter drop-shadow-sm select-none"
        />
      ) : (
        <svg
          viewBox="0 0 400 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          {/* Fallback vector pillars */}
          <polygon points="24,272 50,260 76,272 76,420 24,420" fill="#475569" />
          <polygon points="94,222 120,210 146,222 146,420 94,420" fill="#475569" />
          <polygon points="164,172 190,160 216,172 216,420 164,420" fill="#475569" />
          <polygon points="234,152 260,140 286,152 286,420 234,420" fill="#334155" />
          <path
            d="M 22 395 Q 110 365 185 260 Q 240 180 285 120"
            stroke="#94A3B8"
            strokeWidth="24"
            strokeLinecap="round"
          />
          <polygon points="265,50 216,152 304,152" fill="#CBD5E1" />
        </svg>
      )}
    </div>
  );
};

export const BidzoLogo: React.FC<BidzoLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', badge: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-lg sm:text-xl', badge: 'text-[10px]' },
    lg: { icon: 'w-10 h-10 sm:w-12 sm:h-12', text: 'text-2xl', badge: 'text-xs' },
  };

  const current = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <BidzoLogoIcon sizeClass={current.icon} />
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span
              className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-tight text-slate-900 leading-none ${current.text}`}
              style={{ letterSpacing: '-0.03em' }}
            >
              Bidzo
            </span>

            {/* Refined subtle LIVE pill tag with soft green pulsing dot indicator */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 tracking-wide shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              <span>LIVE</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidzoLogo;
