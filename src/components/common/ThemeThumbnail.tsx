import React from 'react';
import { NamedTheme } from '../../theme/tokens';

interface ThemeThumbnailProps {
  theme: NamedTheme | 'precision' | 'lumen' | 'aero';
  isSelected?: boolean;
  size?: 'sm' | 'lg' | 'full';
  className?: string;
}

export const ThemeThumbnail: React.FC<ThemeThumbnailProps> = ({
  theme,
  isSelected = false,
  size = 'sm',
  className = '',
}) => {
  const isSm = size === 'sm';
  const isFull = size === 'full';

  return (
    <div
      className={`relative overflow-hidden transition-all duration-200 select-none shrink-0 ${
        isFull
          ? 'w-full h-full'
          : isSm
          ? 'w-11 h-6 rounded-[6px] border'
          : 'w-full h-24 sm:h-28 rounded-[8px] border'
      } ${
        !isFull
          ? isSelected
            ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/40 shadow-xs'
            : 'border-theme-subtle opacity-85 hover:opacity-100 hover:border-theme-strong'
          : ''
      } ${className}`}
      data-testid={`theme-thumbnail-${theme}`}
    >
      {/* ========================================================================= */}
      {/* 1. PRECISION: Industrial Graphite / Amber Laser Reticle / Grid Visual     */}
      {/* ========================================================================= */}
      {theme === 'precision' && (
        <div
          className="absolute inset-0 bg-[#111315] flex items-center justify-center overflow-hidden"
          style={{
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.06), inset 0 -1px 2px rgba(0,0,0,0.6)',
          }}
        >
          {/* Subtle Technical Grid */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, #334155 1px, transparent 1px),
                linear-gradient(to bottom, #334155 1px, transparent 1px)
              `,
              backgroundSize: isSm ? '8px 8px' : '16px 16px',
            }}
          />

          {/* Calibrated Reticle Crosshair & Concentric Orbit */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Concentric Circle */}
            <div
              className={`rounded-full border border-slate-700/60 ${
                isSm ? 'w-5 h-5' : 'w-24 h-24'
              }`}
            />
            {!isSm && (
              <div className="rounded-full border border-dashed border-slate-700/40 w-36 h-36" />
            )}
            {/* Horizontal Axis */}
            <div className={`absolute h-[1px] bg-slate-600/50 ${isSm ? 'w-7' : 'w-44'}`} />
            {/* Vertical Axis */}
            <div className={`absolute w-[1px] bg-slate-600/50 ${isSm ? 'h-5' : 'h-28'}`} />
          </div>

          {/* Central Laser Focal Diode (Amber) */}
          <div className="relative z-10 flex items-center justify-center">
            {/* Outer Amber Halo */}
            <div
              className={`rounded-full bg-[#F59E0B]/25 animate-pulse ${
                isSm ? 'w-3 h-3' : 'w-8 h-8'
              }`}
            />
            {/* Sharp Core Dot */}
            <div
              className={`absolute rounded-full bg-[#F59E0B] shadow-[0_0_12px_#F59E0B] ${
                isSm ? 'w-1.5 h-1.5' : 'w-3.5 h-3.5'
              }`}
            />
          </div>

          {/* Micro Status / Calibration Accent */}
          {!isSm && (
            <div className="absolute top-2.5 right-3 flex items-center gap-1.5 text-[9px] font-mono text-slate-400 pointer-events-none z-10 bg-black/40 px-2 py-0.5 rounded border border-white/5">
              <span className="text-[#F59E0B] font-semibold">● COHERENT</span>
              <span className="text-slate-500">PRC-700</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LUMEN: Deep Obsidian / Luminous Cyan Horizon / Star Atmosphere          */}
      {/* ========================================================================= */}
      {theme === 'lumen' && (
        <div
          className="absolute inset-0 bg-[#07080A] flex items-center justify-center overflow-hidden"
          style={{
            boxShadow: 'inset 0 1px 2px rgba(56,189,248,0.2), inset 0 -1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {/* Volumetric Radial Dusk Horizon Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-85"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, #0284C7 0%, #0369A1 30%, #082F49 60%, #07080A 100%)',
            }}
          />

          {/* Star Sparkle Elements */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-[#BAE6FD]"
            viewBox="0 0 100 50"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            {/* 4-Point Star Glints */}
            <path
              d="M15,12 C15.4,12 16,11 16,10 C16,11 16.6,12 17,12 C16.6,12 16,13 16,14 C16,13 15.4,12 15,12 Z"
              className="opacity-70"
            />
            <path
              d="M82,14 C82.5,14 83,12.8 83,11.5 C83,12.8 83.5,14 84,14 C83.5,14 83,15.2 83,16.5 C83,15.2 82.5,14 82,14 Z"
              className="opacity-90"
            />
            <path
              d="M70,24 C70.3,24 70.8,23 70.8,22 C70.8,23 71.3,24 71.6,24 C71.3,24 70.8,25 70.8,26 C70.8,25 70.3,24 70,24 Z"
              className="opacity-60"
            />
            {!isSm && (
              <>
                <path
                  d="M32,16 C32.6,16 33.2,14.5 33.2,13 C33.2,14.5 33.8,16 34.4,16 C33.8,16 33.2,17.5 33.2,19 C33.2,17.5 32.6,16 32,16 Z"
                  className="opacity-80"
                />
                <circle cx="24" cy="24" r="0.75" className="opacity-45" />
                <circle cx="58" cy="10" r="0.6" className="opacity-65" />
                <circle cx="88" cy="26" r="0.75" className="opacity-55" />
                <circle cx="45" cy="20" r="0.5" className="opacity-50" />
              </>
            )}
          </svg>

          {/* Luminous Cyan Horizon Orb */}
          <div className="relative z-10 flex items-center justify-center">
            <div
              className={`rounded-full bg-[#38BDF8] shadow-[0_0_16px_#38BDF8] ${
                isSm ? 'w-3 h-3' : 'w-10 h-10'
              }`}
              style={{
                background: 'linear-gradient(135deg, #E0F2FE 0%, #38BDF8 60%, #0284C7 100%)',
              }}
            />
          </div>

          {/* Cyan Horizon Line Arc */}
          <div
            className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-90"
            style={{
              boxShadow: '0 -1px 8px #38BDF8',
            }}
          />

          {/* Micro Metadata */}
          {!isSm && (
            <div className="absolute top-2.5 right-3 flex items-center gap-1.5 text-[9px] font-mono text-sky-300 pointer-events-none z-10 bg-black/40 px-2 py-0.5 rounded border border-white/5">
              <span className="text-[#38BDF8] font-semibold">● 480nm</span>
              <span className="text-sky-400/70">LUMEN</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AERO: Radiant Daylight Sky / Puffy Clouds / Golden Sun Visual           */}
      {/* ========================================================================= */}
      {theme === 'aero' && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #1D70B8 0%, #38BDF8 55%, #93C5FD 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.2)',
          }}
        >
          {/* Luminous Golden Sun Disc */}
          <div
            className={`absolute rounded-full z-10 ${
              isSm ? 'w-2.5 h-2.5 top-1 right-2' : 'w-10 h-10 top-4 right-8'
            }`}
            style={{
              background: 'linear-gradient(135deg, #FEF08A 0%, #FBBF24 70%, #F59E0B 100%)',
              boxShadow: '0 0 14px rgba(251, 191, 36, 0.9), 0 0 28px rgba(254, 240, 138, 0.5)',
            }}
          />

          {/* Sun Halo Glint */}
          <div
            className={`absolute rounded-full pointer-events-none opacity-40 ${
              isSm ? 'w-5 h-5 top-0 right-1' : 'w-24 h-24 -top-2 right-1'
            }`}
            style={{
              background: 'radial-gradient(circle, rgba(254,240,138,0.8) 0%, rgba(254,240,138,0) 70%)',
            }}
          />

          {/* Multi-Layer Puffy Cloud Formations (Back + Front) */}
          {/* Layer 1: Back Clouds (Atmospheric Sky Blue Shadow) */}
          <div
            className={`absolute rounded-full bg-[#BAE6FD]/85 pointer-events-none ${
              isSm ? 'w-6 h-4 -bottom-1 left-1' : 'w-36 h-20 -bottom-4 left-4'
            }`}
          />
          <div
            className={`absolute rounded-full bg-[#BAE6FD]/85 pointer-events-none ${
              isSm ? 'w-8 h-4 -bottom-1 right-0' : 'w-44 h-22 -bottom-4 right-2'
            }`}
          />

          {/* Layer 2: Front Clouds (Pure Vapor White Billows) */}
          <div
            className={`absolute rounded-full bg-white pointer-events-none ${
              isSm ? 'w-5 h-3.5 -bottom-1.5 left-2' : 'w-28 h-16 -bottom-5 left-10'
            }`}
            style={{
              boxShadow: '0 -1px 4px rgba(255,255,255,0.9), 0 2px 6px rgba(30,58,138,0.25)',
            }}
          />
          <div
            className={`absolute rounded-full bg-white pointer-events-none ${
              isSm ? 'w-7 h-4 -bottom-1.5 right-1' : 'w-36 h-18 -bottom-5 right-8'
            }`}
            style={{
              boxShadow: '0 -1px 4px rgba(255,255,255,0.9), 0 2px 6px rgba(30,58,138,0.25)',
            }}
          />
          <div
            className={`absolute rounded-full bg-[#F8FAFC] pointer-events-none ${
              isSm ? 'w-4 h-3 -bottom-1 left-4' : 'w-24 h-14 -bottom-3 left-28'
            }`}
          />

          {/* Specular Diagonal Sunlight Glass Reflection */}
          <div
            className="absolute -inset-x-8 -top-8 h-20 pointer-events-none rotate-12 opacity-35"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)',
            }}
          />

          {/* Micro Metadata */}
          {!isSm && (
            <div className="absolute top-2.5 left-3 flex items-center gap-1.5 text-[9px] font-mono text-sky-900 pointer-events-none z-10 bg-white/60 backdrop-blur-xs px-2 py-0.5 rounded border border-white/30 font-semibold">
              <span className="text-sky-950 font-bold">CIRRUS SKY</span>
              <span className="text-sky-800">10,000FT</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
