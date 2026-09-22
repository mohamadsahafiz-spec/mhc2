import React, { useEffect, useRef } from 'react';
import { NamedTheme } from '../../theme/tokens';

interface CanvasShaderBackgroundProps {
  activeTheme: NamedTheme;
  prefersReducedMotion?: boolean;
}

// GLSL Vertex Shader: Standard Fullscreen Quad
const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// GLSL Fragment Shader: 3 Distinct Procedural Atmospheric Shaders
const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_theme;        // 0.0: Precision, 1.0: Lumen, 2.0: Aero, 3.0: Other Light, 4.0: Other Dark
uniform float u_theme_prev;   // Previous theme index for crossfades
uniform float u_transition;   // 0.0 -> 1.0 crossfade progress
uniform float u_reduced_motion; // 1.0 if reduced motion active

varying vec2 v_uv;

// =========================================================================
// NOISE & FRACTAL BROWNIAN MOTION (FBM) PRIMITIVES FOR AERO CLOUD GENERATION
// Analytical 2D Value Noise & 4-Octave Rotational FBM (zero texture lookups)
// =========================================================================
float hash2D(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Smooth Hermite Quintic curve for C1-continuous cloud derivatives
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash2D(i + vec2(0.0, 0.0)), hash2D(i + vec2(1.0, 0.0)), u.x),
    mix(hash2D(i + vec2(0.0, 1.0)), hash2D(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// 4-Octave FBM with 37-degree rotational domain mixing for natural atmospheric turbulence
float fbmCloud4(vec2 p) {
  float v = 0.0;
  float a = 0.50;
  // Rotation matrix: [cos(37°), -sin(37°); sin(37°), cos(37°)]
  mat2 rot = mat2(0.7986, -0.6018, 0.6018, 0.7986);
  for (int i = 0; i < 4; i++) {
    v += a * valueNoise2D(p);
    p = rot * p * 2.04;
    a *= 0.50;
  }
  return v;
}

// =========================================================================
// 1. PRECISION PROCEDURAL SHADER
// Concept: Coherent Quantum Lattice & Anisotropic Phase Wave
// Deep obsidian-slate (#111315) with subtle mathematical diffraction harmonics
// =========================================================================
vec3 renderPrecision(vec2 uv, float t) {
  // Base dark industrial canvas (#111315)
  vec3 baseColor = vec3(0.067, 0.075, 0.082);
  vec3 slateColor = vec3(0.110, 0.125, 0.149);
  vec3 amberPhaseColor = vec3(0.961, 0.620, 0.043);
  vec3 coolSlateAccent = vec3(0.247, 0.282, 0.329);

  // Aspect-corrected coordinate space
  vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

  // Multi-axis coherent harmonic waves (orthogonal phase topography)
  float w1 = sin(p.x * 5.0 + p.y * 3.0 + t * 0.35);
  float w2 = cos(p.x * 3.5 - p.y * 4.5 - t * 0.25);
  float w3 = sin(length(p * 2.5) * 4.0 - t * 0.30);
  
  // Anisotropic interference lattice
  float lattice = sin(p.x * 18.0 + w1 * 1.2) * cos(p.y * 18.0 + w2 * 1.2);
  lattice = smoothstep(0.75, 1.0, lattice) * 0.045;

  // Broad harmonic contour flow (metrology phase wave)
  float contour = sin(w1 * 2.0 + w2 * 2.0 + w3 * 1.5);
  float contourBand = smoothstep(0.85, 0.98, abs(contour)) * 0.035;

  // Micro-scale golden phase coherence accent (3% max intensity)
  float amberInterference = pow(max(0.0, sin(p.x * 2.0 + p.y * 1.5 + t * 0.2) * cos(w3)), 4.0) * 0.035;

  // Composite Precision atmospheric layers
  vec3 col = baseColor;
  col = mix(col, slateColor, (w1 * 0.5 + 0.5) * 0.08 + (w2 * 0.5 + 0.5) * 0.06);
  col += coolSlateAccent * (lattice + contourBand);
  col += amberPhaseColor * amberInterference;

  // Subtle vignette for clean viewport focus
  float vign = 1.0 - smoothstep(0.5, 1.4, length(p));
  col *= (0.92 + 0.08 * vign);

  return col;
}

// =========================================================================
// 2. LUMEN PROCEDURAL SHADER
// Concept: Atmospheric Horizon Luminescence & Volumetric Cyan Drift
// Deepest obsidian black (#07080A) with rolling volumetric cyan dusk waves
// =========================================================================
vec3 renderLumen(vec2 uv, float t) {
  // Deep obsidian canvas (#07080A)
  vec3 baseColor = vec3(0.027, 0.031, 0.039);
  vec3 cyanDusk = vec3(0.220, 0.741, 0.973);   // #38BDF8
  vec3 deepIndigo = vec3(0.008, 0.518, 0.780); // #0284C7
  vec3 voidCharcoal = vec3(0.051, 0.067, 0.094);

  vec2 p = uv;
  vec2 center = vec2(0.5, 0.0); // Horizon origin at bottom center

  // Volumetric wave coordinates
  float distToHorizon = length(p - center);
  
  // Smooth rotating wave vectors
  float angle = atan(p.y, p.x - 0.5);
  float wave1 = sin(p.x * 3.0 + p.y * 2.0 - t * 0.28) * cos(p.y * 4.0 + t * 0.20);
  float wave2 = cos(p.x * 5.0 - p.y * 3.0 + t * 0.35) * sin(angle * 3.0 - t * 0.22);
  float wave3 = sin(distToHorizon * 6.0 - t * 0.40 + wave1 * 1.5);

  // Volumetric horizon glow breathing
  float horizonPulse = 0.5 + 0.5 * sin(t * 0.35);
  float horizonGlow = exp(-distToHorizon * 2.2) * (0.08 + 0.04 * horizonPulse);

  // Flowing ethereal dusk luminescence wave fronts
  float duskCurvature = smoothstep(0.2, 0.9, (wave1 * 0.5 + 0.5) * (1.0 - p.y * 0.6));
  float deepWaveFront = smoothstep(0.4, 0.95, (wave2 * 0.5 + 0.5) * (wave3 * 0.5 + 0.5));

  // Layer colors
  vec3 col = baseColor;
  col = mix(col, voidCharcoal, (1.0 - p.y) * 0.15);
  col += deepIndigo * (duskCurvature * 0.07 + horizonGlow * 0.4);
  col += cyanDusk * (deepWaveFront * 0.055 + horizonGlow * 0.6);

  // Delicate top-right atmospheric twilight shimmer
  float topDrift = exp(-length(p - vec2(0.9, 0.9)) * 3.0) * (0.04 + 0.02 * sin(t * 0.25));
  col += cyanDusk * topDrift;

  return col;
}

// =========================================================================
// 3. AERO PROCEDURAL SHADER
// Concept: Living Daylight Sky with Soft Volumetric Moving Cloud Formations
// Multi-layer procedural FBM clouds with continuous natural drift & parallax
// =========================================================================
vec3 renderAero(vec2 uv, float t) {
  // Aspect-corrected coordinate space for distortion-free cloud masses
  float aspect = u_resolution.x / max(1.0, u_resolution.y);
  vec2 p = vec2(uv.x * aspect, uv.y);

  // 1. Daylight Azure Sky Foundation (Deep Cerulean to Soft Horizon)
  vec3 skyZenith = vec3(0.18, 0.54, 0.88);   // Vivid daytime azure (#2E8AE0)
  vec3 skyMid = vec3(0.38, 0.72, 0.95);      // Radiant daylight sky (#60B8F2)
  vec3 skyHorizon = vec3(0.76, 0.89, 0.98);  // Atmospheric haze (#C2E3FA)
  
  vec3 sky = mix(skyHorizon, skyMid, smoothstep(0.0, 0.45, uv.y));
  sky = mix(sky, skyZenith, smoothstep(0.35, 1.0, uv.y));

  // 2. Layer B: High-Altitude Wispy Cirrus Strata (Parallax Drift)
  // Moves at independent speed/angle: V = (0.022, -0.004)
  vec2 pCirrus = p * 2.6 + vec2(t * 0.022, -t * 0.004);
  vec2 cirrusWind = vec2(pCirrus.x * 0.75 + pCirrus.y * 0.45, pCirrus.y * 1.4 - pCirrus.x * 0.25);
  float cirrusFbm = fbmCloud4(cirrusWind);
  float cirrusDensity = smoothstep(0.48, 0.74, cirrusFbm) * 0.32;
  vec3 cirrusColor = vec3(0.96, 0.98, 1.0);

  // 3. Layer A: Volumetric Cumulus Cloud Masses (Continuous Reshaping & Drift)
  // Moves at slow natural wind velocity: V = (0.013, 0.0025)
  vec2 pCumulus = p * 1.30 + vec2(t * 0.013, t * 0.0025);

  // Dual-Domain Warping for organic billowing cumulus contours
  vec2 q = vec2(
    fbmCloud4(pCumulus + vec2(0.0, 0.0) + t * 0.007),
    fbmCloud4(pCumulus + vec2(4.3, 1.7) - t * 0.005)
  );

  vec2 r = vec2(
    fbmCloud4(pCumulus + 1.75 * q + vec2(1.7, 8.2) + t * 0.009),
    fbmCloud4(pCumulus + 1.75 * q + vec2(7.3, 2.5) - t * 0.007)
  );

  float cloudRaw = fbmCloud4(pCumulus + 1.40 * r);

  // Soft density thresholds for billowy cloud bodies and wispy perimeter vapor
  float cloudDense = smoothstep(0.43, 0.76, cloudRaw);
  float cloudVapor = smoothstep(0.30, 0.55, cloudRaw) * 0.38;
  float totalCloudAlpha = clamp(cloudDense + cloudVapor, 0.0, 1.0);

  // Directional Sunlit Cloud Shading (Sun positioned at upper-left)
  float sunFactor = clamp(0.42 + 0.58 * (r.x - r.y * 0.75 + (1.0 - uv.y) * 0.25), 0.0, 1.0);
  vec3 cloudShadow = vec3(0.66, 0.81, 0.95); // Ambient tropospheric sky-blue shadow
  vec3 cloudWhite = vec3(0.96, 0.98, 1.0);   // Pure cumulus vapor white
  vec3 sunHighlight = vec3(1.0, 1.0, 1.0);   // Direct sunlit rim illumination

  vec3 cloudColor = mix(cloudShadow, cloudWhite, sunFactor);
  cloudColor += sunHighlight * pow(sunFactor, 2.6) * 0.15;

  // 4. Composite Atmospheric Layers (Sky -> Cirrus -> Volumetric Cumulus)
  vec3 col = sky;
  col = mix(col, cirrusColor, cirrusDensity);
  col = mix(col, cloudColor, totalCloudAlpha * 0.82);

  // 5. Delicate Sun Ambient Dispersion at Upper Left
  float sunDist = length(uv - vec2(0.20, 1.02));
  float sunHalo = exp(-sunDist * 1.6) * 0.10;
  col += vec3(1.0, 0.98, 0.92) * sunHalo;

  return col;
}

// Helper: map arbitrary theme id to shader function
vec3 getThemeColor(float themeId, vec2 uv, float t) {
  if (themeId < 0.5) {
    return renderPrecision(uv, t);
  } else if (themeId < 1.5) {
    return renderLumen(uv, t);
  } else if (themeId < 2.5) {
    return renderAero(uv, t);
  } else if (themeId < 3.5) {
    // Other Light (Aether / Prism)
    return renderAero(uv, t);
  } else {
    // Other Dark (Forge / Cairn)
    return renderPrecision(uv, t);
  }
}

void main() {
  // Respect reduced motion by applying an ultra-slow tranquil baseline
  float t = u_time * (u_reduced_motion > 0.5 ? 0.04 : 1.0);

  vec3 colCurr = getThemeColor(u_theme, v_uv, t);

  // Smooth cross-fade during theme switching
  if (u_transition < 1.0 && abs(u_theme - u_theme_prev) > 0.01) {
    vec3 colPrev = getThemeColor(u_theme_prev, v_uv, t);
    float fade = smoothstep(0.0, 1.0, u_transition);
    gl_FragColor = vec4(mix(colPrev, colCurr, fade), 1.0);
  } else {
    gl_FragColor = vec4(colCurr, 1.0);
  }
}
`;

function getThemeIndex(theme: NamedTheme): number {
  switch (theme) {
    case 'precision':
      return 0.0;
    case 'lumen':
      return 1.0;
    case 'aero':
      return 2.0;
    case 'aether':
    case 'prism':
      return 3.0; // Light theme procedural variant
    case 'forge':
    case 'cairn':
      return 4.0; // Dark theme procedural variant
    default:
      return 0.0;
  }
}

export const CanvasShaderBackground: React.FC<CanvasShaderBackgroundProps> = ({
  activeTheme,
  prefersReducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Theme transition state refs
  const currentThemeRef = useRef<number>(getThemeIndex(activeTheme));
  const prevThemeRef = useRef<number>(getThemeIndex(activeTheme));
  const transitionRef = useRef<number>(1.0);
  const startTimeRef = useRef<number>(performance.now());
  const transitionStartTimeRef = useRef<number>(performance.now());

  // Update theme target on change
  useEffect(() => {
    const newThemeIndex = getThemeIndex(activeTheme);
    if (newThemeIndex !== currentThemeRef.current) {
      prevThemeRef.current = currentThemeRef.current;
      currentThemeRef.current = newThemeIndex;
      transitionRef.current = 0.0;
      transitionStartTimeRef.current = performance.now();
    }
  }, [activeTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL initialization with graceful fallback
    const gl = (canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    }) ||
      canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      })) as WebGLRenderingContext | null;

    if (!gl) {
      // Graceful fallback for non-WebGL environments (e.g. tests or legacy devices)
      return;
    }

    // Helper: Compile Shader
    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('[CanvasShaderBackground] Shader compile warning:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[CanvasShaderBackground] Program link warning:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uThemeLoc = gl.getUniformLocation(program, 'u_theme');
    const uThemePrevLoc = gl.getUniformLocation(program, 'u_theme_prev');
    const uTransitionLoc = gl.getUniformLocation(program, 'u_transition');
    const uReducedMotionLoc = gl.getUniformLocation(program, 'u_reduced_motion');

    // Resize handling with buffer resolution scaling (DPR capped to 1.25 for battery efficiency)
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const displayWidth = Math.floor(window.innerWidth * dpr);
      const displayHeight = Math.floor(window.innerHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        width = displayWidth;
        height = displayHeight;
        gl.viewport(0, 0, width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Render loop
    let isRunning = true;

    const render = (now: number) => {
      if (!isRunning) return;

      // Skip rendering if page is in background tab to save field-service laptop battery
      if (document.hidden) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Update transition progress (400ms crossfade)
      if (transitionRef.current < 1.0) {
        const elapsedTransition = (now - transitionStartTimeRef.current) / 400.0;
        transitionRef.current = Math.min(1.0, elapsedTransition);
      }

      const elapsedTime = (now - startTimeRef.current) / 1000.0;

      gl.useProgram(program);
      if (uResolutionLoc) gl.uniform2f(uResolutionLoc, width || 1.0, height || 1.0);
      if (uTimeLoc) gl.uniform1f(uTimeLoc, elapsedTime);
      if (uThemeLoc) gl.uniform1f(uThemeLoc, currentThemeRef.current);
      if (uThemePrevLoc) gl.uniform1f(uThemePrevLoc, prevThemeRef.current);
      if (uTransitionLoc) gl.uniform1f(uTransitionLoc, transitionRef.current);
      if (uReducedMotionLoc) gl.uniform1f(uReducedMotionLoc, prefersReducedMotion ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    // Cleanup on unmount
    return () => {
      isRunning = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resize);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
    };
  }, [prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="canvas-shader-background"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full select-none"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};
