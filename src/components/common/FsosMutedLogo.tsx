import React from 'react';

export interface FsosMutedLogoProps {
  className?: string;
  size?: number | string;
  showBadge?: boolean;
}

/**
 * FSOS Muted Logo Identity (v3.6.1)
 * Authentic vector implementation of the selected Muted (Dark UI) branding variant:
 * Waveform (Machine Health / Pulse) + Engineering Gear (Precision Operations)
 * in restrained industrial slate / cool titanium tones.
 */
export const FsosMutedLogo: React.FC<FsosMutedLogoProps> = ({
  className = 'w-7 h-7',
  size,
  showBadge = true
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="FSOS Muted Logo"
      role="img"
    >
      <defs>
        {/* Subtle Dark Squircle Badge Gradient */}
        <linearGradient id="fsos-muted-badge-bg" x1="10" y1="5" x2="90" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C232E" />
          <stop offset="50%" stopColor="#141A22" />
          <stop offset="100%" stopColor="#0D1217" />
        </linearGradient>

        {/* Squircle Metallic Border Gradient */}
        <linearGradient id="fsos-muted-badge-border" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B485A" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#25303F" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#18202B" stopOpacity="0.9" />
        </linearGradient>

        {/* Waveform Gradient: Muted Titanium / Steel */}
        <linearGradient id="fsos-muted-wave" x1="16" y1="20" x2="62" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B2C2D6" />
          <stop offset="45%" stopColor="#8E9EB3" />
          <stop offset="100%" stopColor="#6C7F97" />
        </linearGradient>

        {/* Gear Gradient: Industrial Matte Steel */}
        <linearGradient id="fsos-muted-gear" x1="45" y1="20" x2="85" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7588A0" />
          <stop offset="50%" stopColor="#5B6D83" />
          <stop offset="100%" stopColor="#465569" />
        </linearGradient>

        {/* Subtle Inner Ambient Glow for Depth (Restrained Muted Dark Tone) */}
        <radialGradient id="fsos-muted-ambient" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#4A5D75" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0D1217" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Optional Squircle Badge Background */}
      {showBadge && (
        <>
          <rect
            x="3"
            y="3"
            width="94"
            height="94"
            rx="24"
            ry="24"
            fill="url(#fsos-muted-badge-bg)"
            stroke="url(#fsos-muted-badge-border)"
            strokeWidth="1.5"
          />
          <rect
            x="3"
            y="3"
            width="94"
            height="94"
            rx="24"
            ry="24"
            fill="url(#fsos-muted-ambient)"
          />
        </>
      )}

      {/* 2. Engineering Gear Profile (Intermeshed on the Right) */}
      <path
        d="M 54.5 24.5
           L 57.2 21.0
           L 62.5 24.0
           L 60.8 28.5
           A 32 32 0 0 1 67.2 33.5
           L 72.0 32.0
           L 75.2 38.0
           L 70.8 41.2
           A 32 32 0 0 1 72.0 48.0
           L 77.2 49.0
           L 77.2 56.0
           L 72.0 57.0
           A 32 32 0 0 1 70.8 63.8
           L 75.2 67.0
           L 72.0 73.0
           L 67.2 71.5
           A 32 32 0 0 1 60.8 76.5
           L 62.5 81.0
           L 57.2 84.0
           L 54.5 80.5
           A 33 33 0 0 1 48.0 78.5
           L 49.5 73.0
           A 22 22 0 0 0 57.5 67.5
           L 53.5 64.0
           A 22 22 0 0 0 58.5 52.5
           A 22 22 0 0 0 53.5 41.0
           L 57.5 37.5
           A 22 22 0 0 0 49.5 32.0
           L 48.0 26.5
           A 33 33 0 0 1 54.5 24.5 Z"
        fill="url(#fsos-muted-gear)"
        opacity="0.95"
      />

      {/* 3. Waveform / Machine Health Signal Line */}
      <path
        d="M 15 50
           H 31
           L 42 22
           L 52 78
           L 61 50
           H 65"
        stroke="url(#fsos-muted-wave)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 4. Precision Focal Indicator Point at Wave-Gear Intersection */}
      <circle
        cx="61"
        cy="50"
        r="2"
        fill="#B2C2D6"
        opacity="0.9"
      />
    </svg>
  );
};

export default FsosMutedLogo;
