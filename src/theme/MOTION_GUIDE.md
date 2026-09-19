# FSOS Motion System Guide (M0 Foundation)

**Document ID:** ECO-20260918-M0 / FSOS-MOTION-SYSTEM  
**Target FSOS Version:** v2.10.1  
**Design DNA:** Calm Industrial Software / Precision Operations  
**Motion DNA:** MECHANICAL + SMOOTH  

---

## 1. Core Philosophy

In FSOS, animation is an operational tool, not visual decoration.
Motion must communicate **physical state, navigation hierarchy, system feedback, and spatial relationships** with zero distracting fluff.

1. **Fast Enough for Field Work**: Low-latency, deterministic transitions that never make engineers wait.
2. **Mechanical + Smooth**: Fast initial response (`ease-out` feel) with smooth, controlled deceleration.
3. **Predictable & Repeatable**: Same action produces the exact same motion curve every single time.
4. **No Cartoonish Physics**: Zero bouncy springs, rubber-banding, or exaggerated oscillation.
5. **Universal Accessibility**: Complete `prefers-reduced-motion` compliance — transitions collapse to instant or clean opacity fades.

---

## 2. When to Animate vs. When NOT to Animate

| Scenario | Animate? | Implementation / Guidelines |
| :--- | :--- | :--- |
| **Workspace / Mode Switching** | **YES** | Use Motion `layoutId` with `slidingIndicatorTransition` for physical selector pill translation. |
| **Navigation & Route Changes** | **YES** | Clean `fadeSlideIn` (distance: `page`, timing: `standard` / 250ms). |
| **Modal / Dialog Overlays** | **YES** | Deliberate `scaleFade` (timing: `deliberate` / 400ms, scale from 0.97 to 1.0). |
| **Primary Action Feedback** | **YES** | Mechanical depression (`motionScales.press` / 0.98) on tap / click. |
| **Telemetry Laser Scans** | **YES** | Constant-velocity `linear` scan sweep only when explicitly representing sensor operation. |
| **Static Data & Tables** | **NO** | Never animate text, measurement values, or sensor numbers during standard reading. |
| **Frequent Re-renders** | **NO** | Do NOT animate cards on every data update or polling tick. |
| **Information Density** | **NO** | Never let motion obscure, delay, or displace dense engineering metrics. |

---

## 3. Motion Foundation Tokens

### A. Timing (`motionTimings`)
- `instant` (`0.08s` / 80ms): Micro toggles, checkbox state, immediate tactile clicks.
- `quick` (`0.15s` / 150ms): Hover lifts, button presses, tooltip emergence.
- `standard` (`0.25s` / 250ms): Tabs, drawer slides, list insertions, state transitions.
- `deliberate` (`0.40s` / 400ms): Dialogs, modal sheets, login handshakes.
- `scan` (`3.0s`): Slow mechanical telemetry scans.

### B. Easing (`motionEasings`)
- `responsive` (`[0.2, 0, 0, 1]`): Fast initial acceleration with crisp deceleration.
- `smooth` (`[0.25, 0.1, 0.25, 1]`): Balanced operational transitions.
- `deliberate` (`[0.16, 1, 0.3, 1]`): Purposeful arrival curve for modals and login.
- `linear` (`'linear'`): Constant velocity sweeps.

### C. Distances (`motionDistances`)
- `micro` (`2px`): Micro hover lift, active state offset.
- `subtle` (`4px`): Badge reveal, small indicator shift.
- `component` (`8px`): Dropdown menus, popovers.
- `section` (`16px`): Panel reveals, card expansions.
- `page` (`24px`): Full view transitions.

### D. Scales (`motionScales`)
- `press` (`0.98`): Primary button tactile depression.
- `subtlePress` (`0.99`): Dense data rows, table actions, compact chips.
- `hover` (`1.015`): Subtle card/tile hover feedback.
- `dialogEntry` (`0.97`): Modal dialog emergence.
- `none` (`1.0`): Neutral unscaled reference.

---

## 4. Usage Patterns in Components

### Reusable Primitives
```tsx
import { motion } from 'motion/react';
import { 
  createFadeSlideVariants, 
  createScaleFadeVariants, 
  mechanicalPressConfig 
} from '@/theme/motion';

// Page / Section Entrance
const variants = createFadeSlideVariants({
  direction: 'up',
  distance: 'page',
  timing: 'standard',
  easing: 'responsive'
});

export const MySection = () => (
  <motion.div variants={variants} initial="hidden" animate="visible" exit="exit">
    {/* Content */}
  </motion.div>
);

// Tactile Action Button
export const PrimaryButton = ({ onClick, children }) => (
  <motion.button
    whileTap={mechanicalPressConfig.tap}
    whileHover={mechanicalPressConfig.hover}
    onClick={onClick}
  >
    {children}
  </motion.button>
);
```

---

## 5. Reduced Motion Rules

All custom motion utilities accept a `prefersReducedMotion` boolean.
When active:
- **Movement distance is collapsed to 0**.
- **Durations are shortened to instantaneous (0s) or quick opacity-only fades (150ms)**.
- **Critical content and layouts remain fully rendered, visible, and interactive**.
