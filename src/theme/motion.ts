/**
 * FSOS Motion System — M0 Motion Foundation
 * Document ID: ECO-20260918-M0 / FSOS-MOTION-SYSTEM
 *
 * Visual Direction: Calm Industrial Software / Precision Operations
 * Motion DNA: MECHANICAL + SMOOTH
 *
 * Core Principles:
 * 1. Fast enough for field-service engineering workflows.
 * 2. Smooth enough to communicate precision and physical responsiveness.
 * 3. Predictable, deterministic, and repeatable.
 * 4. Zero arbitrary bouncy springs, exaggerated physics, or playful rubber-banding.
 * 5. Full support for prefers-reduced-motion: instant or clean fade-only fallbacks.
 * 6. Transform and opacity only — never animate layout-triggering properties.
 */

import type { TargetAndTransition, Transition, Variants } from 'motion/react';

/**
 * A. TIMING SYSTEM
 * Standardized durations (in seconds) for FSOS UI transitions.
 */
export const motionTimings = {
  /** 80ms: Micro toggles, checkbox ticks, instantaneous tactile responses */
  instant: 0.08,
  /** 150ms: Tactile button presses, hover lifts, tooltip emergence */
  quick: 0.15,
  /** 250ms: Standard UI transitions (tabs, drawer slides, list items, card states) */
  standard: 0.25,
  /** 400ms: Deliberate transitions (modal overlays, view switches, login handshakes) */
  deliberate: 0.4,
  /** 3.0s: Slow constant-velocity mechanical telemetry scan sweeps */
  scan: 3.0,
} as const;

export type FSOSMotionTiming = keyof typeof motionTimings;

/**
 * B. EASING SYSTEM
 * A restrained vocabulary of mechanical + smooth easing curves.
 */
export const motionEasings = {
  /** Responsive: Fast initial acceleration with crisp, controlled deceleration */
  responsive: [0.2, 0, 0, 1] as const,
  /** Smooth: Balanced, natural operational transitions */
  smooth: [0.25, 0.1, 0.25, 1] as const,
  /** Deliberate: Purposeful mechanical arrival curve (for dialogs, sheets, login) */
  deliberate: [0.16, 1, 0.3, 1] as const,
  /** Linear: Constant velocity (for laser scans, gauge telemetry sweeps) */
  linear: 'linear' as const,
} as const;

export type FSOSMotionEasing = keyof typeof motionEasings;

/**
 * C. MOTION DISTANCE SYSTEM
 * Pixel distances for spatial displacement. Motion must be small and purposeful.
 */
export const motionDistances = {
  /** 2px: Micro hover lift, active state nudge */
  micro: 2,
  /** 4px: Subtle indicator adjustment, badge reveal */
  subtle: 4,
  /** 8px: Component transitions, dropdown menus, popovers */
  component: 8,
  /** 16px: Section panels, expanding cards, slide-in drawers */
  section: 16,
  /** 24px: Full view transitions, modal arrival */
  page: 24,
} as const;

export type FSOSMotionDistance = keyof typeof motionDistances;

/**
 * D. SCALE SYSTEM
 * Restrained scale multipliers. Never bouncy or hyperactive.
 */
export const motionScales = {
  /** 0.98: Tactile physical depression on primary buttons */
  press: 0.98,
  /** 0.99: Subtle depression on dense data rows, chips, and compact buttons */
  subtlePress: 0.99,
  /** 1.015: Subtle hover elevation on interactive cards/tiles */
  hover: 1.015,
  /** 0.97: Gentle scaling entry for dialogs and modals */
  dialogEntry: 0.97,
  /** 1.0: Neutral unscaled reference */
  none: 1.0,
} as const;

export type FSOSMotionScale = keyof typeof motionScales;

/**
 * E. OPACITY SYSTEM
 * Standard opacity states for transitions.
 */
export const motionOpacities = {
  hidden: 0,
  muted: 0.45,
  subtle: 0.75,
  visible: 1,
} as const;

export type FSOSMotionOpacity = keyof typeof motionOpacities;

/**
 * F. REDUCED MOTION HELPERS
 * Creates deterministic variants and transitions respecting prefers-reduced-motion.
 */

/**
 * Returns an instantaneous or fade-only transition configuration when reduced motion is preferred.
 */
export function getFSOSReducedTransition(fallbackDuration = motionTimings.quick): Transition {
  return {
    duration: fallbackDuration,
    ease: motionEasings.smooth,
  };
}

/**
 * Helper to build variants that gracefully collapse spatial displacement into a clean fade
 * when reduced motion is enabled.
 */
export function buildFSOSVariant(
  standardVariant: TargetAndTransition,
  reducedVariant: TargetAndTransition,
  prefersReducedMotion: boolean
): TargetAndTransition {
  return prefersReducedMotion ? reducedVariant : standardVariant;
}

/**
 * G. STANDARD MOTION PRIMITIVES & PRESETS (M0)
 * Reusable motion configurations for M1–M6 components.
 */

export interface FadeSlideOptions {
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: FSOSMotionDistance;
  timing?: FSOSMotionTiming;
  easing?: FSOSMotionEasing;
  prefersReducedMotion?: boolean;
}

/**
 * Directional fade-and-slide primitive.
 */
export function createFadeSlideVariants(options: FadeSlideOptions = {}): Variants {
  const {
    direction = 'up',
    distance = 'component',
    timing = 'standard',
    easing = 'responsive',
    prefersReducedMotion = false,
  } = options;

  const d = motionDistances[distance];
  const dur = prefersReducedMotion ? 0 : motionTimings[timing];
  const ease = motionEasings[easing];

  const isVertical = direction === 'up' || direction === 'down';
  const offset = direction === 'up' || direction === 'left' ? d : -d;

  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: motionTimings.quick, ease: motionEasings.smooth },
      },
      exit: {
        opacity: 0,
        transition: { duration: motionTimings.instant, ease: motionEasings.smooth },
      },
    };
  }

  if (isVertical) {
    return {
      hidden: { opacity: 0, y: offset },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: dur, ease },
      },
      exit: {
        opacity: 0,
        y: -offset * 0.5,
        transition: { duration: dur * 0.75, ease },
      },
    };
  }

  return {
    hidden: { opacity: 0, x: offset },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: dur, ease },
    },
    exit: {
      opacity: 0,
      x: -offset * 0.5,
      transition: { duration: dur * 0.75, ease },
    },
  };
}

/**
 * Simple fade in / out primitive (no spatial displacement).
 */
export function createFadeVariants(prefersReducedMotion = false): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : motionTimings.standard,
        ease: motionEasings.smooth,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : motionTimings.quick,
        ease: motionEasings.smooth,
      },
    },
  };
}

/**
 * Scale and fade primitive for modal dialogs and dropdown menus.
 */
export function createScaleFadeVariants(prefersReducedMotion = false): Variants {
  return {
    hidden: prefersReducedMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: motionScales.dialogEntry },
    visible: prefersReducedMotion
      ? {
          opacity: 1,
          transition: { duration: motionTimings.quick, ease: motionEasings.smooth },
        }
      : {
          opacity: 1,
          scale: motionScales.none,
          transition: {
            duration: motionTimings.deliberate,
            ease: motionEasings.deliberate,
          },
        },
    exit: prefersReducedMotion
      ? {
          opacity: 0,
          transition: { duration: motionTimings.instant, ease: motionEasings.smooth },
        }
      : {
          opacity: 0,
          scale: motionScales.dialogEntry,
          transition: {
            duration: motionTimings.quick,
            ease: motionEasings.responsive,
          },
        },
  };
}

/**
 * Staggered container primitive for controlled sequential item reveals.
 */
export function createStaggerContainerVariants(
  staggerDelay = 0.04,
  prefersReducedMotion = false
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
        delayChildren: prefersReducedMotion ? 0 : 0.02,
      },
    },
  };
}

/**
 * Mechanical tactile press interaction configuration.
 */
export const mechanicalPressConfig = {
  tap: {
    scale: motionScales.press,
    transition: {
      duration: motionTimings.instant,
      ease: motionEasings.responsive,
    },
  },
  subtleTap: {
    scale: motionScales.subtlePress,
    transition: {
      duration: motionTimings.instant,
      ease: motionEasings.responsive,
    },
  },
  hover: {
    scale: motionScales.hover,
    transition: {
      duration: motionTimings.quick,
      ease: motionEasings.responsive,
    },
  },
};

/**
 * Physical sliding layout indicator transition (for tabs, segmented controls, mode selectors).
 */
export const slidingIndicatorTransition: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.8,
};
