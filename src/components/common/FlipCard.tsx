import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

export interface FlipCardProps {
  id?: string;
  isFlipped?: boolean;
  defaultFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  axis?: 'y' | 'x';
  tilt?: boolean | number;
  hoverScale?: number;
  className?: string;
  isDark?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * FlipCard — FSOS Calm Industrial / Precision Operations
 * 
 * Interactive 3D flip card with subtle tilt, controlled spring physics,
 * keyboard accessibility, and prefers-reduced-motion support.
 */
export const FlipCard: React.FC<FlipCardProps> = ({
  id,
  isFlipped: controlledFlipped,
  defaultFlipped = false,
  onFlipChange,
  frontContent,
  backContent,
  axis = 'y',
  tilt = 3.5,
  hoverScale = 1.01,
  className = '',
  isDark = false,
  disabled = false,
  ariaLabel
}) => {
  const shouldReduceMotion = !!useReducedMotion();
  const [uncontrolledFlipped, setUncontrolledFlipped] = useState(defaultFlipped);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : uncontrolledFlipped;

  const cardRef = useRef<HTMLDivElement>(null);

  // Subtle tilt physics
  const maxTilt = typeof tilt === 'number' ? tilt : tilt ? 3.5 : 0;
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 28 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 28 });

  // Map mouse offsets (-0.5 to 0.5) to subtle degrees of tilt (approx 3-5 deg)
  const tiltRotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const tiltRotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || maxTilt === 0 || disabled) return;
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const xPct = mouseX / width - 0.5;
      const yPct = mouseY / height - 0.5;

      x.set(xPct);
      y.set(yPct);
    },
    [shouldReduceMotion, maxTilt, disabled, x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const toggleFlip = useCallback(() => {
    if (disabled) return;
    const nextFlipped = !isFlipped;
    if (controlledFlipped === undefined) {
      setUncontrolledFlipped(nextFlipped);
    }
    if (onFlipChange) {
      onFlipChange(nextFlipped);
    }
  }, [disabled, isFlipped, controlledFlipped, onFlipChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      // Only flip on Enter/Space if the focused target is the card itself (not an inner interactive element)
      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        toggleFlip();
      }
    },
    [disabled, toggleFlip]
  );

  const targetRotation = isFlipped ? 180 : 0;

  return (
    <div
      id={id}
      ref={cardRef}
      role="region"
      aria-label={ariaLabel || 'Machine inspection card'}
      tabIndex={disabled ? -1 : 0}
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-2xl select-none ${
        disabled ? 'cursor-default' : 'cursor-pointer'
      } ${className}`}
      style={{
        perspective: 1200
      }}
    >
      {/* Tilt & Hover Scale Wrapper */}
      <motion.div
        style={{
          transformStyle: 'preserve-3d',
          rotateX: shouldReduceMotion ? 0 : tiltRotateX,
          rotateY: shouldReduceMotion ? 0 : tiltRotateY
        }}
        whileHover={
          shouldReduceMotion || disabled
            ? undefined
            : {
                scale: hoverScale,
                transition: { duration: 0.15, ease: 'easeOut' }
              }
        }
        className="w-full h-full relative"
      >
        {/* 3D Flip Rotating Inner Container */}
        <motion.div
          animate={{
            rotateY: axis === 'y' ? targetRotation : 0,
            rotateX: axis === 'x' ? targetRotation : 0
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  type: 'spring',
                  stiffness: 260,
                  damping: 26,
                  mass: 0.9
                }
          }
          style={{
            transformStyle: 'preserve-3d'
          }}
          className="w-full h-full relative min-h-[290px]"
        >
          {/* FRONT FACE */}
          <div
            className={`w-full h-full p-5 rounded-card border transition-all flex flex-col justify-between ${
              isDark
                ? 'bg-surface border-theme-default hover:border-theme-strong shadow-theme-card'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              pointerEvents: isFlipped ? 'none' : 'auto'
            }}
          >
            {frontContent}
          </div>

          {/* BACK FACE */}
          <div
            className={`absolute inset-0 w-full h-full p-5 rounded-card border transition-all flex flex-col justify-between ${
              isDark
                ? 'bg-surface border-theme-default hover:border-theme-strong shadow-theme-card'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: axis === 'y' ? 'rotateY(180deg)' : 'rotateX(180deg)',
              pointerEvents: isFlipped ? 'auto' : 'none'
            }}
          >
            {backContent}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
