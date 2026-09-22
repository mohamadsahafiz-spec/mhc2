import React from 'react';
import { NamedTheme } from '../../theme/tokens';

interface ThemeThumbnailProps {
  theme: NamedTheme | 'precision' | 'lumen' | 'aero';
  isSelected?: boolean;
  className?: string;
}

export const ThemeThumbnail: React.FC<ThemeThumbnailProps> = ({
  theme,
  isSelected = false,
  className = '',
}) => {
  return (
    <div
      className={`relative w-10 h-6 sm:w-11 sm:h-6 rounded-[5px] overflow-hidden border transition-all duration-150 select-none shrink-0 ${
        isSelected
          ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/40 shadow-xs'
          : 'border-theme-subtle opacity-75 hover:opacity-100 hover:border-theme-strong'
      } ${className}`}
      data-testid={`theme-thumbnail-${theme}`}
    >
      {theme === 'precision' && (
        <div className="absolute inset-0 bg-[#111315] flex flex-col">
          {/* Mini Header */}
          <div className="h-1.5 bg-[#1C2026] border-b border-[#2B323A] flex items-center px-1 justify-between">
            <div className="w-1 h-0.5 rounded-full bg-[#94A3B8]" />
            <div className="w-0.5 h-0.5 rounded-full bg-[#F59E0B]" />
          </div>
          {/* Mini Body */}
          <div className="flex-1 flex">
            {/* Mini Sidebar */}
            <div className="w-2.5 bg-[#16191D] border-r border-[#2B323A] flex flex-col items-center py-0.5 gap-0.5">
              <div className="w-1.5 h-0.5 rounded-[1px] bg-[#F59E0B]" />
              <div className="w-1.5 h-0.5 rounded-[1px] bg-[#3F4854]" />
              <div className="w-1.5 h-0.5 rounded-[1px] bg-[#3F4854]" />
            </div>
            {/* Mini Canvas */}
            <div className="flex-1 p-0.5 flex flex-col justify-between relative bg-[#111315]">
              {/* Mini Card */}
              <div className="h-2.5 rounded-[2px] bg-[#20252B] border border-[#2B323A] p-0.5 flex items-center justify-between">
                <div className="w-2 h-0.5 rounded-full bg-[#94A3B8]" />
                <div className="w-1 h-1 rounded-full bg-[#F59E0B]/80 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-[#FEF3C7]" />
                </div>
              </div>
              {/* Micro Status Bar */}
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-0.5 rounded-full bg-[#10B981]" />
                <div className="w-3 h-0.5 rounded-full bg-[#2B323A]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {theme === 'lumen' && (
        <div className="absolute inset-0 bg-[#07080A] flex flex-col relative overflow-hidden">
          {/* Radial Cyan Dusk Glow */}
          <div
            className="absolute -right-2 -top-2 w-8 h-8 rounded-full pointer-events-none opacity-40"
            style={{
              background: 'radial-gradient(circle, #38BDF8 0%, rgba(56, 189, 248, 0) 70%)',
            }}
          />
          {/* Mini Header with luminous cyan edge line */}
          <div className="h-1.5 bg-[#0D1117] border-b border-[#38BDF8]/40 flex items-center px-1 justify-between relative z-10">
            <div className="w-1 h-0.5 rounded-full bg-[#38BDF8]" />
            <div className="w-0.5 h-0.5 rounded-full bg-[#38BDF8] shadow-[0_0_3px_#38BDF8]" />
          </div>
          {/* Mini Body */}
          <div className="flex-1 flex relative z-10">
            {/* Mini Sidebar */}
            <div className="w-2.5 bg-[#0D1117] border-r border-[#1E293B] flex flex-col items-center py-0.5 gap-0.5">
              <div className="w-1.5 h-0.5 rounded-[1px] bg-[#38BDF8] shadow-[0_0_2px_#38BDF8]" />
              <div className="w-1.5 h-0.5 rounded-[1px] bg-[#1E293B]" />
              <div className="w-1.5 h-0.5 rounded-[1px] bg-[#1E293B]" />
            </div>
            {/* Mini Canvas */}
            <div className="flex-1 p-0.5 flex flex-col justify-between">
              {/* Mini Glass Card */}
              <div className="h-2.5 rounded-[2px] bg-[#111827]/90 border border-[#38BDF8]/50 p-0.5 flex items-center justify-between shadow-[0_0_4px_rgba(56,189,248,0.15)]">
                <div className="w-2 h-0.5 rounded-full bg-[#E0F2FE]" />
                <div className="w-1 h-1 rounded-full bg-[#38BDF8] shadow-[0_0_3px_#38BDF8]" />
              </div>
              {/* Micro Status Bar */}
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-0.5 rounded-full bg-[#38BDF8]" />
                <div className="w-3 h-0.5 rounded-full bg-[#1E293B]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {theme === 'aero' && (
        <div
          className="absolute inset-0 flex flex-col relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #BAE6FD 0%, #E0F2FE 50%, #7DD3FC 100%)',
          }}
        >
          {/* Diagonal Glass Specular Reflection */}
          <div
            className="absolute -inset-x-2 -top-3 h-6 pointer-events-none rotate-12 opacity-60"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)',
            }}
          />
          {/* Mini Header */}
          <div className="h-1.5 bg-white/80 border-b border-sky-300/80 flex items-center px-1 justify-between relative z-10 backdrop-blur-[1px]">
            <div className="w-1 h-0.5 rounded-full bg-sky-700" />
            <div className="w-0.5 h-0.5 rounded-full bg-sky-500" />
          </div>
          {/* Mini Body */}
          <div className="flex-1 flex relative z-10">
            {/* Mini Sidebar */}
            <div className="w-2.5 bg-white/70 border-r border-sky-200/80 flex flex-col items-center py-0.5 gap-0.5 backdrop-blur-[1px]">
              <div className="w-1.5 h-0.5 rounded-[1px] bg-sky-600 shadow-xs" />
              <div className="w-1.5 h-0.5 rounded-[1px] bg-sky-200" />
              <div className="w-1.5 h-0.5 rounded-[1px] bg-sky-200" />
            </div>
            {/* Mini Canvas */}
            <div className="flex-1 p-0.5 flex flex-col justify-between">
              {/* Mini Glass Card */}
              <div className="h-2.5 rounded-[2px] bg-white/90 border border-sky-300/90 p-0.5 flex items-center justify-between shadow-xs">
                <div className="w-2 h-0.5 rounded-full bg-sky-800" />
                <div className="w-1 h-1 rounded-full bg-sky-500" />
              </div>
              {/* Micro Status Bar */}
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-0.5 rounded-full bg-sky-600" />
                <div className="w-3 h-0.5 rounded-full bg-sky-200/80" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
