import React, { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface LoginBackgroundProps {
  isDark: boolean;
}

export const LoginBackground: React.FC<LoginBackgroundProps> = ({ isDark }) => {
  const prefersReducedMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = document.documentElement;
      const xPercent = Math.round((e.clientX / clientWidth) * 100);
      const yPercent = Math.round((e.clientY / clientHeight) * 100);
      setMousePos({ x: xPercent, y: yPercent });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Interactive Ambient Spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out"
        style={{
          background: isDark
            ? `radial-gradient(650px circle at ${mousePos.x}% ${mousePos.y}%, rgba(30, 41, 59, 0.35), transparent 70%)`
            : `radial-gradient(650px circle at ${mousePos.x}% ${mousePos.y}%, rgba(226, 232, 240, 0.7), transparent 70%)`
        }}
      />

      {/* SVG Fine Engineering Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="fsos-dense-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={isDark ? '#2A3441' : '#CBD5E1'}
              strokeWidth="0.5"
              strokeDasharray="2,4"
            />
            <circle cx="0" cy="0" r="1" fill={isDark ? '#475569' : '#94A3B8'} />
            <circle cx="40" cy="0" r="1" fill={isDark ? '#475569' : '#94A3B8'} />
            <circle cx="0" cy="40" r="1" fill={isDark ? '#475569' : '#94A3B8'} />
            <circle cx="40" cy="40" r="1" fill={isDark ? '#475569' : '#94A3B8'} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fsos-dense-grid)" />
      </svg>

      {/* Continuous Slow Mechanical Laser / Grid Scan Beam */}
      {!prefersReducedMotion && (
        <motion.div
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 1.5
          }}
          className="absolute left-0 right-0 h-24 pointer-events-none opacity-25 dark:opacity-20"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.08) 50%, rgba(56, 189, 248, 0.25) 98%, #38BDF8 100%, transparent)'
              : 'linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.03) 50%, rgba(15, 23, 42, 0.1) 98%, #0F172A 100%, transparent)'
          }}
        />
      )}

      {/* Corner Precision Optical Crosshairs & Technical Metadata */}
      <div className="absolute top-6 left-8 hidden md:flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400/60 dark:text-slate-600/80">
        <span className="text-slate-500 font-semibold">EO-TECHNICS</span>
        <span>/</span>
        <span>FSOS PRECISION SYSTEM</span>
      </div>

      <div className="absolute top-6 right-8 hidden md:flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400/60 dark:text-slate-600/80">
        <span>GRID: CALIBRATED</span>
        <span>·</span>
        <span>SESSION: LOCAL</span>
      </div>

      <div className="absolute bottom-6 left-8 hidden md:flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400/60 dark:text-slate-600/80">
        <span>CLEANROOM CERTIFIED</span>
        <span>·</span>
        <span>LAT: 03°08&apos;N 101°41&apos;E</span>
      </div>

      <div className="absolute bottom-6 right-8 hidden md:flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400/60 dark:text-slate-600/80">
        <span>SECURITY: LOCAL-FIRST</span>
        <span>·</span>
        <span>REV: 2026.09</span>
      </div>

      {/* Viewport Corner Registration Marks */}
      <div className="absolute top-3 left-3 text-slate-300 dark:text-slate-700 font-mono text-xs">+</div>
      <div className="absolute top-3 right-3 text-slate-300 dark:text-slate-700 font-mono text-xs">+</div>
      <div className="absolute bottom-3 left-3 text-slate-300 dark:text-slate-700 font-mono text-xs">+</div>
      <div className="absolute bottom-3 right-3 text-slate-300 dark:text-slate-700 font-mono text-xs">+</div>
    </div>
  );
};
