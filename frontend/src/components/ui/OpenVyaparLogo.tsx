import React from 'react';

interface OpenVyaparLogoProps {
  variant?: 'mark' | 'full';
  size?: number;
  className?: string;
  theme?: 'dark' | 'light';
}

/**
 * OpenVyapar Official Minimalist Logo:
 * Pure geometric 'V' mark inside a balanced squircle.
 */
export const OpenVyaparLogo: React.FC<OpenVyaparLogoProps> = ({
  variant = 'mark',
  size = 36,
  className = '',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  if (variant === 'mark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 select-none ${className}`}
        shapeRendering="geometricPrecision"
      >
        <defs>
          <linearGradient id="ov-gold" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer Squircle Container */}
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          fill="#0a1424"
          stroke="url(#ov-gold)"
          strokeWidth="2"
        />

        {/* Bold, Clean Geometric 'V' */}
        <path
          d="M11 13H16.8L20 23.5L23.2 13H29L22.5 28.5H17.5L11 13Z"
          fill="url(#ov-gold)"
        />
      </svg>
    );
  }

  // Full Horizontal Vector Lockup
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <OpenVyaparLogo variant="mark" size={size} theme={theme} />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-display font-extrabold tracking-tight text-base leading-none ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Open<span className="text-amber-400 font-extrabold">Vyapar</span>
          </span>
        </div>
        <span
          className={`text-[9.5px] uppercase font-mono tracking-widest font-semibold mt-1 ${
            isDark ? 'text-amber-400/80' : 'text-amber-700'
          }`}
        >
          Public Infrastructure
        </span>
      </div>
    </div>
  );
};
