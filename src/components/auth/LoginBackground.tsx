import React, { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeCanvasShader } from '../common/ThemeCanvasShader';

interface LoginBackgroundProps {
  isDark?: boolean;
}

export const LoginBackground: React.FC<LoginBackgroundProps> = ({ isDark: propIsDark }) => {
  const { activeTheme, effectiveTheme } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : effectiveTheme === 'dark';
  const isLumen = activeTheme === 'lumen';
  const isAero = activeTheme === 'aero';
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
      id="login-background"
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 login-background-container"
      aria-hidden="true"
    >
      {/* Real-Time Theme Canvas Shader */}
      <ThemeCanvasShader />

      {/* Interactive Ambient Spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out login-ambient-spotlight"
        style={{
          background: isAero
            ? `radial-gradient(750px circle at ${mousePos.x}% ${mousePos.y}%, rgba(186, 230, 253, 0.55), rgba(224, 242, 254, 0.2) 50%, transparent 80%)`
            : isLumen
            ? `radial-gradient(700px circle at ${mousePos.x}% ${mousePos.y}%, rgba(56, 189, 248, 0.16), rgba(30, 41, 59, 0.35) 45%, transparent 75%)`
            : isDark
            ? `radial-gradient(650px circle at ${mousePos.x}% ${mousePos.y}%, rgba(30, 41, 59, 0.35), transparent 70%)`
            : `radial-gradient(650px circle at ${mousePos.x}% ${mousePos.y}%, rgba(226, 232, 240, 0.7), transparent 70%)`
        }}
      />

      {/* SVG Fine Engineering Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30 login-grid-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="fsos-dense-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={isAero ? '#93C5FD' : isLumen ? '#1E293B' : isDark ? '#2A3441' : '#CBD5E1'}
              strokeWidth="0.5"
              strokeDasharray="2,4"
            />
            <circle cx="0" cy="0" r="1" fill={isAero ? '#60A5FA' : isLumen ? '#38BDF8' : isDark ? '#475569' : '#94A3B8'} />
            <circle cx="40" cy="0" r="1" fill={isAero ? '#60A5FA' : isLumen ? '#38BDF8' : isDark ? '#475569' : '#94A3B8'} />
            <circle cx="0" cy="40" r="1" fill={isAero ? '#60A5FA' : isLumen ? '#38BDF8' : isDark ? '#475569' : '#94A3B8'} />
            <circle cx="40" cy="40" r="1" fill={isAero ? '#60A5FA' : isLumen ? '#38BDF8' : isDark ? '#475569' : '#94A3B8'} />
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
          className="absolute left-0 right-0 h-24 pointer-events-none opacity-25 dark:opacity-20 login-scan-beam"
          style={{
            background: isAero
              ? 'linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.15) 50%, rgba(14, 165, 233, 0.3) 98%, #0284C7 100%, transparent)'
              : isLumen
              ? 'linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.12) 50%, rgba(56, 189, 248, 0.35) 98%, #38BDF8 100%, transparent)'
              : isDark
              ? 'linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.08) 50%, rgba(56, 189, 248, 0.25) 98%, #38BDF8 100%, transparent)'
              : 'linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.03) 50%, rgba(15, 23, 42, 0.1) 98%, #0F172A 100%, transparent)'
          }}
        />
      )}

    </div>
  );
};

