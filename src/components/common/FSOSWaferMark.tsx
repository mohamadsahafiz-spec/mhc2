import React from 'react';

interface FSOSWaferMarkProps {
  className?: string;
  size?: number;
}

export const FSOSWaferMark: React.FC<FSOSWaferMarkProps> = ({
  className = 'w-10 h-10',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="FSOS Semiconductor Wafer Mark"
    >
      <defs>
        {/* Wafer Silhouette Clip Path with Orientation Flat & Notch */}
        <clipPath id="fsos-wafer-silhouette">
          <path d="M 50,6 A 44,44 0 1,0 71.5,87.5 L 53,87.5 L 50,84.5 L 47,87.5 L 28.5,87.5 A 44,44 0 0,0 50,6 Z" />
        </clipPath>

        {/* Base Wafer Substrate Metallic Gradient */}
        <linearGradient id="wafer-substrate" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="45%" stopColor="#0f172a" />
          <stop offset="70%" stopColor="#111827" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Iridescent Wafer Rim Edge Gradient */}
        <linearGradient id="wafer-rim-iridescent" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="25%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="75%" stopColor="#ec4899" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        {/* Diagonal Silicon Reflection Sheen */}
        <linearGradient id="wafer-reflection-sheen" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="30%" stopColor="#818cf8" stopOpacity="0.15" />
          <stop offset="60%" stopColor="#c084fc" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>

        {/* Specific Die Iridescent Highlights */}
        <linearGradient id="die-cyan-glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>

        <linearGradient id="die-violet-glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.25" />
        </linearGradient>

        <linearGradient id="die-indigo-glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Wafer Shadow Backdrop */}
      <circle cx="50" cy="51" r="44" fill="#000000" fillOpacity="0.4" />

      {/* Wafer Body Clipped Area */}
      <g clipPath="url(#fsos-wafer-silhouette)">
        {/* Base Substrate */}
        <rect x="0" y="0" width="100" height="100" fill="url(#wafer-substrate)" />

        {/* Die Grid Pattern (8x8 Grid of Silicon Dies) */}
        <g stroke="#1e293b" strokeWidth="0.6" fill="#0f172a">
          {/* Row 0 */}
          <rect x="30" y="10" width="8" height="8" rx="0.5" fill="#1e1b4b" fillOpacity="0.6" stroke="#312e81" strokeWidth="0.5" />
          <rect x="39" y="10" width="8" height="8" rx="0.5" fill="url(#die-cyan-glint)" stroke="#38bdf8" strokeWidth="0.5" />
          <rect x="48" y="10" width="8" height="8" rx="0.5" fill="#1e1b4b" fillOpacity="0.6" stroke="#312e81" strokeWidth="0.5" />
          <rect x="57" y="10" width="8" height="8" rx="0.5" fill="#111827" stroke="#1e293b" strokeWidth="0.5" />

          {/* Row 1 */}
          <rect x="21" y="19" width="8" height="8" rx="0.5" fill="#111827" />
          <rect x="30" y="19" width="8" height="8" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" strokeWidth="0.5" />
          <rect x="39" y="19" width="8" height="8" rx="0.5" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="0.5" />
          <rect x="48" y="19" width="8" height="8" rx="0.5" fill="url(#die-cyan-glint)" stroke="#22d3ee" strokeWidth="0.5" />
          <rect x="57" y="19" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="66" y="19" width="8" height="8" rx="0.5" fill="#111827" />

          {/* Row 2 */}
          <rect x="12" y="28" width="8" height="8" rx="0.5" fill="#111827" />
          <rect x="21" y="28" width="8" height="8" rx="0.5" fill="url(#die-violet-glint)" stroke="#8b5cf6" strokeWidth="0.5" />
          <rect x="30" y="28" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="39" y="28" width="8" height="8" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" strokeWidth="0.5" />
          <rect x="48" y="28" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="57" y="28" width="8" height="8" rx="0.5" fill="url(#die-cyan-glint)" stroke="#06b6d4" strokeWidth="0.5" />
          <rect x="66" y="28" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="75" y="28" width="8" height="8" rx="0.5" fill="#111827" />

          {/* Row 3 */}
          <rect x="12" y="37" width="8" height="8" rx="0.5" fill="#111827" />
          <rect x="21" y="37" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="30" y="37" width="8" height="8" rx="0.5" fill="url(#die-cyan-glint)" stroke="#38bdf8" strokeWidth="0.5" />
          <rect x="39" y="37" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="48" y="37" width="8" height="8" rx="0.5" fill="url(#die-violet-glint)" stroke="#a855f7" strokeWidth="0.5" />
          <rect x="57" y="37" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="66" y="37" width="8" height="8" rx="0.5" fill="url(#die-indigo-glint)" stroke="#4f46e5" strokeWidth="0.5" />
          <rect x="75" y="37" width="8" height="8" rx="0.5" fill="#111827" />

          {/* Row 4 */}
          <rect x="12" y="46" width="8" height="8" rx="0.5" fill="#111827" />
          <rect x="21" y="46" width="8" height="8" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" strokeWidth="0.5" />
          <rect x="30" y="46" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="39" y="46" width="8" height="8" rx="0.5" fill="url(#die-violet-glint)" stroke="#8b5cf6" strokeWidth="0.5" />
          <rect x="48" y="46" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="57" y="46" width="8" height="8" rx="0.5" fill="url(#die-cyan-glint)" stroke="#22d3ee" strokeWidth="0.5" />
          <rect x="66" y="46" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="75" y="46" width="8" height="8" rx="0.5" fill="#111827" />

          {/* Row 5 */}
          <rect x="12" y="55" width="8" height="8" rx="0.5" fill="#111827" />
          <rect x="21" y="55" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="30" y="55" width="8" height="8" rx="0.5" fill="url(#die-violet-glint)" stroke="#a855f7" strokeWidth="0.5" />
          <rect x="39" y="55" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="48" y="55" width="8" height="8" rx="0.5" fill="url(#die-indigo-glint)" stroke="#4f46e5" strokeWidth="0.5" />
          <rect x="57" y="55" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="66" y="55" width="8" height="8" rx="0.5" fill="url(#die-cyan-glint)" stroke="#06b6d4" strokeWidth="0.5" />
          <rect x="75" y="55" width="8" height="8" rx="0.5" fill="#111827" />

          {/* Row 6 */}
          <rect x="21" y="64" width="8" height="8" rx="0.5" fill="#111827" />
          <rect x="30" y="64" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="39" y="64" width="8" height="8" rx="0.5" fill="url(#die-cyan-glint)" stroke="#38bdf8" strokeWidth="0.5" />
          <rect x="48" y="64" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="57" y="64" width="8" height="8" rx="0.5" fill="url(#die-violet-glint)" stroke="#8b5cf6" strokeWidth="0.5" />
          <rect x="66" y="64" width="8" height="8" rx="0.5" fill="#111827" />

          {/* Row 7 */}
          <rect x="30" y="73" width="8" height="8" rx="0.5" fill="#111827" />
          <rect x="39" y="73" width="8" height="8" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" strokeWidth="0.5" />
          <rect x="48" y="73" width="8" height="8" rx="0.5" fill="#1e1b4b" />
          <rect x="57" y="73" width="8" height="8" rx="0.5" fill="#111827" />
        </g>

        {/* Diagonal Silicon Spectral Reflection Sheen */}
        <rect x="0" y="0" width="100" height="100" fill="url(#wafer-reflection-sheen)" pointerEvents="none" />

        {/* Fine Alignment Crosshairs at Center (Subtle Engineering Detail) */}
        <line x1="50" y1="12" x2="50" y2="20" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
        <line x1="50" y1="80" x2="50" y2="85" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
        <line x1="12" y1="50" x2="20" y2="50" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
        <line x1="80" y1="50" x2="88" y2="50" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
      </g>

      {/* Wafer Outer Perimeter Bevel / Iridescent Rim */}
      <path
        d="M 50,6 A 44,44 0 1,0 71.5,87.5 L 53,87.5 L 50,84.5 L 47,87.5 L 28.5,87.5 A 44,44 0 0,0 50,6 Z"
        stroke="url(#wafer-rim-iridescent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Outer Glow / Highlight Accent Ring */}
      <circle cx="50" cy="50" r="44.8" stroke="#6366f1" strokeWidth="0.4" strokeOpacity="0.3" fill="none" />
    </svg>
  );
};
