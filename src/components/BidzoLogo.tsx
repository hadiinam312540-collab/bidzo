import React, { useState } from 'react';
import bidzoDomainLogo from '../assets/images/bidzo_domain_logo.svg';

interface BidzoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/**
 * Official Bidzo Domain Logo Icon:
 * Features 3 ascending metallic cybernetic pillars with a sweeping futuristic arrow
 * and circuitry lines, matching the official brand domain emblem.
 */
export const BidzoLogoIcon: React.FC<{ sizeClass?: string; className?: string }> = ({
  sizeClass = 'h-8.5 sm:h-10 w-auto',
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
          className="h-full w-auto max-h-full object-contain filter drop-shadow-xs select-none"
        />
      ) : (
        <svg
          viewBox="20 35 350 375"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto max-h-full object-contain"
        >
          {/* Fallback metallic pillars & arrow */}
          <rect x="30" y="260" width="60" height="140" rx="4" fill="#64748B" />
          <rect x="37" y="267" width="46" height="126" rx="2" fill="#0B1B33" />
          <line x1="46" y1="385" x2="46" y2="300" stroke="#00F5FF" strokeWidth="2.5" />

          <rect x="105" y="200" width="60" height="200" rx="4" fill="#64748B" />
          <rect x="112" y="207" width="46" height="186" rx="2" fill="#0B1B33" />
          <line x1="122" y1="385" x2="122" y2="250" stroke="#00F5FF" strokeWidth="2.5" />

          <path
            d="M 180 145 L 240 145 L 240 330 Q 240 355 260 355 Q 280 355 280 330 L 280 145 L 340 145 L 340 335 Q 340 400 260 400 Q 180 400 180 335 Z"
            fill="#64748B"
          />
          <polygon points="310,45 250,145 370,145" fill="#94A3B8" />
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
    sm: {
      icon: 'h-8 sm:h-9 w-auto',
      text: 'text-base sm:text-lg',
      badge: 'text-[9px]',
      gap: 'gap-2',
    },
    md: {
      icon: 'h-9 sm:h-11 w-auto',
      text: 'text-xl sm:text-2xl',
      badge: 'text-[10px]',
      gap: 'gap-2.5 sm:gap-3',
    },
    lg: {
      icon: 'h-12 sm:h-14 w-auto',
      text: 'text-2xl sm:text-3xl',
      badge: 'text-xs',
      gap: 'gap-3',
    },
  };

  const current = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${current.gap} select-none ${className}`}>
      <BidzoLogoIcon sizeClass={current.icon} />
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span
              className={`font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight text-slate-900 leading-none ${current.text}`}
              style={{ letterSpacing: '-0.035em' }}
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
