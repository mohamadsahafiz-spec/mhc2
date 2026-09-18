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
        {/* Wafer Silhouette Clip Path (Circle with Micro Orientation Notch at Bottom) */}
        <clipPath id="fsos-wafer-silhouette">
          <path d="M 50,6 A 44,44 0 1,0 48.5,93.8 L 50,91.8 L 51.5,93.8 A 44,44 0 0,0 50,6 Z" />
        </clipPath>

        {/* Base Wafer Substrate Metallic Gradient */}
        <linearGradient id="wafer-substrate" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="35%" stopColor="#0f172a" />
          <stop offset="70%" stopColor="#111827" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Iridescent Wafer Rim Edge Gradient */}
        <linearGradient id="wafer-rim-iridescent" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="25%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="75%" stopColor="#ec4899" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        {/* Spectral Silicon Sheen (Reflecting Light Across Wafer Face) */}
        <linearGradient id="wafer-reflection-sheen" x1="10" y1="15" x2="90" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="28%" stopColor="#818cf8" stopOpacity="0.2" />
          <stop offset="55%" stopColor="#c084fc" stopOpacity="0.15" />
          <stop offset="78%" stopColor="#fbbf24" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>

        {/* Silicon Die Glint Gradients */}
        <linearGradient id="die-cyan-glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="die-violet-glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.35" />
        </linearGradient>

        <linearGradient id="die-indigo-glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.4" />
        </linearGradient>

        <linearGradient id="die-amber-glint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Wafer Silhouette Shadow Backdrop (Centered at 50, 50.8) */}
      <circle cx="50" cy="50.8" r="44" fill="#000000" fillOpacity="0.35" />

      {/* Wafer Body Clipped Area */}
      <g clipPath="url(#fsos-wafer-silhouette)">
        {/* Base Substrate */}
        <rect x="0" y="0" width="100" height="100" fill="url(#wafer-substrate)" />

        {/* Die Grid Pattern (9x9 Symmetric Silicon Die Grid, Centered at 50, 50) */}
        <g stroke="#1e293b" strokeWidth="0.55" fill="#0f172a">
          {/* Row 0 (y = 10.5) */}
          <rect x="37.5" y="10.5" width="7" height="7" rx="0.5" fill="#1e1b4b" fillOpacity="0.7" stroke="#312e81" />
          <rect x="46.5" y="10.5" width="7" height="7" rx="0.5" fill="url(#die-cyan-glint)" stroke="#38bdf8" />
          <rect x="55.5" y="10.5" width="7" height="7" rx="0.5" fill="#1e1b4b" fillOpacity="0.7" stroke="#312e81" />

          {/* Row 1 (y = 19.5) */}
          <rect x="28.5" y="19.5" width="7" height="7" rx="0.5" fill="#111827" />
          <rect x="37.5" y="19.5" width="7" height="7" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" />
          <rect x="46.5" y="19.5" width="7" height="7" rx="0.5" fill="url(#die-violet-glint)" stroke="#c084fc" />
          <rect x="55.5" y="19.5" width="7" height="7" rx="0.5" fill="url(#die-cyan-glint)" stroke="#22d3ee" />
          <rect x="64.5" y="19.5" width="7" height="7" rx="0.5" fill="#111827" />

          {/* Row 2 (y = 28.5) */}
          <rect x="19.5" y="28.5" width="7" height="7" rx="0.5" fill="#111827" />
          <rect x="28.5" y="28.5" width="7" height="7" rx="0.5" fill="url(#die-violet-glint)" stroke="#8b5cf6" />
          <rect x="37.5" y="28.5" width="7" height="7" rx="0.5" fill="#1e1b4b" />
          <rect x="46.5" y="28.5" width="7" height="7" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" />
          <rect x="55.5" y="28.5" width="7" height="7" rx="0.5" fill="url(#die-violet-glint)" stroke="#a855f7" />
          <rect x="64.5" y="28.5" width="7" height="7" rx="0.5" fill="url(#die-cyan-glint)" stroke="#06b6d4" />
          <rect x="73.5" y="28.5" width="7" height="7" rx="0.5" fill="#111827" />

          {/* Row 3 (y = 37.5) */}
          <rect x="19.5" y="37.5" width="7" height="7" rx="0.5" fill="#111827" />
          <rect x="28.5" y="37.5" width="7" height="7" rx="0.5" fill="url(#die-indigo-glint)" stroke="#4f46e5" />
          <rect x="37.5" y="37.5" width="7" height="7" rx="0.5" fill="url(#die-cyan-glint)" stroke="#38bdf8" />
          <rect x="46.5" y="37.5" width="7" height="7" rx="0.5" fill="#1e1b4b" />
          <rect x="55.5" y="37.5" width="7" height="7" rx="0.5" fill="url(#die-violet-glint)" stroke="#a855f7" />
          <rect x="64.5" y="37.5" width="7" height="7" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" />
          <rect x="73.5" y="37.5" width="7" height="7" rx="0.5" fill="#111827" />

          {/* Row 4 (y = 46.5 — Equator Row) */}
          <rect x="10.5" y="46.5" width="7" height="7" rx="0.5" fill="#111827" />
          <rect x="19.5" y="46.5" width="7" height="7" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" />
          <rect x="28.5" y="46.5" width="7" height="7" rx="0.5" fill="url(#die-cyan-glint)" stroke="#22d3ee" />
          <rect x="37.5" y="46.5" width="7" height="7" rx="0.5" fill="#1e1b4b" />
          <rect x="46.5" y="46.5" width="7" height="7" rx="0.5" fill="url(#die-violet-glint)" stroke="#8b5cf6" />
          <rect x="55.5" y="46.5" width="7" height="7" rx="0.5" fill="url(#die-amber-glint)" stroke="#fbbf24" />
          <rect x="64.5" y="46.5" width="7" height="7" rx="0.5" fill="url(#die-cyan-glint)" stroke="#38bdf8" />
          <rect x="73.5" y="46.5" width="7" height="7" rx="0.5" fill="#1e1b4b" />
          <rect x="82.5" y="46.5" width="7" height="7" rx="0.5" fill="#111827" />

          {/* Row 5 (y = 55.5) */}
          <rect x="19.5" y="55.5" width="7" height="7" rx="0.5" fill="#111827" />
          <rect x="28.5" y="55.5" width="7" height="7" rx="0.5" fill="url(#die-violet-glint)" stroke="#a855f7" />
          <rect x="37.5" y="55.5" width="7" height="7" rx="0.5" fill="url(#die-cyan-glint)" stroke="#06b6d4" />
          <rect x="46.5" y="55.5" width="7" height="7" rx="0.5" fill="url(#die-amber-glint)" stroke="#f59e0b" />
          <rect x="55.5" y="55.5" width="7" height="7" rx="0.5" fill="url(#die-amber-glint)" stroke="#fbbf24" />
          <rect x="64.5" y="55.5" width="7" height="7" rx="0.5" fill="url(#die-indigo-glint)" stroke="#4f46e5" />
          <rect x="73.5" y="55.5" width="7" height="7" rx="0.5" fill="#111827" />

          {/* Row 6 (y = 64.5) */}
          <rect x="19.5" y="64.5" width="7" height="7" rx="0.5" fill="#111827" />
          <rect x="28.5" y="64.5" width="7" height="7" rx="0.5" fill="#1e1b4b" />
          <rect x="37.5" y="64.5" width="7" height="7" rx="0.5" fill="url(#die-amber-glint)" stroke="#fbbf24" />
          <rect x="46.5" y="64.5" width="7" height="7" rx="0.5" fill="url(#die-amber-glint)" stroke="#f59e0b" />
          <rect x="55.5" y="64.5" width="7" height="7" rx="0.5" fill="url(#die-violet-glint)" stroke="#8b5cf6" />
          <rect x="64.5" y="64.5" width="7" height="7" rx="0.5" fill="#1e1b4b" />
          <rect x="73.5" y="64.5" width="7" height="7" rx="0.5" fill="#111827" />

          {/* Row 7 (y = 73.5) */}
          <rect x="28.5" y="73.5" width="7" height="7" rx="0.5" fill="#111827" />
          <rect x="37.5" y="73.5" width="7" height="7" rx="0.5" fill="url(#die-amber-glint)" stroke="#f59e0b" />
          <rect x="46.5" y="73.5" width="7" height="7" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" />
          <rect x="55.5" y="73.5" width="7" height="7" rx="0.5" fill="#1e1b4b" />
          <rect x="64.5" y="73.5" width="7" height="7" rx="0.5" fill="#111827" />

          {/* Row 8 (y = 82.5) */}
          <rect x="37.5" y="82.5" width="7" height="7" rx="0.5" fill="#111827" />
          <rect x="46.5" y="82.5" width="7" height="7" rx="0.5" fill="url(#die-indigo-glint)" stroke="#6366f1" />
          <rect x="55.5" y="82.5" width="7" height="7" rx="0.5" fill="#111827" />
        </g>

        {/* Spectral Silicon Sheen Overlay */}
        <rect x="0" y="0" width="100" height="100" fill="url(#wafer-reflection-sheen)" pointerEvents="none" />

        {/* Fine Alignment Reticle Crosshairs at (50, 50) */}
        <line x1="50" y1="8" x2="50" y2="18" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.45" />
        <line x1="50" y1="82" x2="50" y2="92" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.45" />
        <line x1="8" y1="50" x2="18" y2="50" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.45" />
        <line x1="82" y1="50" x2="92" y2="50" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.45" />
      </g>

      {/* Wafer Outer Perimeter Bevel / Iridescent Rim */}
      <path
        d="M 50,6 A 44,44 0 1,0 48.5,93.8 L 50,91.8 L 51.5,93.8 A 44,44 0 0,0 50,6 Z"
        stroke="url(#wafer-rim-iridescent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Outer Subtle Accent Ring Concentric at (50, 50) */}
      <circle cx="50" cy="50" r="44.9" stroke="#6366f1" strokeWidth="0.4" strokeOpacity="0.25" fill="none" />
    </svg>
  );
};
