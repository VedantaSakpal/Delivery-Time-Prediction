import { Link } from 'react-router-dom';

/**
 * JustWoww Icon Mark (SVG)
 * Modern, high-energy squircle with dynamic 'W' speed-ribbon, delight smile, and 'WOW' sparkle star.
 */
export function LogoIcon({ size = 36, className = '', animated = true }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 select-none ${animated ? 'group-hover:scale-105 transition-transform duration-200' : ''} ${className}`}
    >
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Background Gradient */}
          <linearGradient id="jw-icon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5722" />
            <stop offset="45%" stopColor="#FF1744" />
            <stop offset="100%" stopColor="#F50057" />
          </linearGradient>

          {/* Sparkle Gold Gradient */}
          <linearGradient id="jw-icon-star" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF59D" />
            <stop offset="100%" stopColor="#FFD54F" />
          </linearGradient>

          {/* Inner Glow Shadow */}
          <filter id="jw-icon-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#FF1744" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Rounded Squircle Base */}
        <rect x="8" y="8" width="104" height="104" rx="28" fill="url(#jw-icon-bg)" filter="url(#jw-icon-shadow)" />

        {/* Inner Border Sheen */}
        <rect
          x="9.5"
          y="9.5"
          width="101"
          height="101"
          rx="26.5"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="1.5"
        />

        {/* Dynamic Speed 'W' Monogram */}
        <path
          d="M 28 42 L 44 78 L 57 48 L 70 78 L 86 42"
          stroke="#FFFFFF"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Joyful Delivery Smile Accent */}
        <path
          d="M 38 88 Q 60 99 82 88"
          stroke="#FFE082"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* 4-Point 'WOW' Sparkle Star */}
        <path
          d="M 94 24 Q 94 30 100 30 Q 94 30 94 36 Q 94 30 88 30 Q 94 30 94 24 Z"
          fill="url(#jw-icon-star)"
        />
        <circle cx="94" cy="30" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

/**
 * JustWoww Full Logo (Icon + Wordmark)
 */
export default function Logo({
  size = 'md',
  theme = 'light',
  variant = 'full', // 'full' | 'icon' | 'badge'
  tagline = null,
  asLink = true,
  to = '/',
  className = ''
}) {
  const SIZES = {
    sm: { icon: 28, text: 'text-lg',  tagline: 'text-[9px]' },
    md: { icon: 38, text: 'text-2xl', tagline: 'text-[11px]' },
    lg: { icon: 46, text: 'text-3xl', tagline: 'text-xs' },
    xl: { icon: 58, text: 'text-4xl', tagline: 'text-sm' },
  };

  const s = SIZES[size] || SIZES.md;
  const isDark = theme === 'dark';

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <LogoIcon size={s.icon} />

      {variant !== 'icon' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight font-display">
            <span className={`font-black ${s.text} ${isDark ? 'text-white' : 'text-[#191411]'}`}>
              just
            </span>
            <span className={`font-black ${s.text} bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent ml-0.5`}>
              woww
            </span>
          </div>

          {(tagline !== null || variant === 'badge') && (
            <span className={`font-medium tracking-tight mt-0.5 ${s.tagline} ${isDark ? 'text-stone-400' : 'text-[#6E6157]'}`}>
              {tagline || 'Instant Food • Fast ETAs'}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
