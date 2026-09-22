import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useReducedMotion } from 'motion/react';

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_theme; // 0: precision, 1: lumen, 2: aero
uniform float u_reduced_motion;
varying vec2 v_uv;

// --- Helper Noise & Caustic Math ---
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// =========================================================================
// 1. PRECISION THEME: Industrial Dark Laser Metrology Grid & Scan Beam
// =========================================================================
vec3 renderPrecision(vec2 uv, float t) {
  vec2 aspectUV = uv * vec2(u_resolution.x / u_resolution.y, 1.0);
  
  // Base dark industrial console graphite
  vec3 bg = vec3(0.067, 0.075, 0.082); // #111315
  
  // Fine orthogonal wafer matrix
  float gridSize = 0.08;
  vec2 grid = abs(fract(aspectUV / gridSize - 0.5) - 0.5) / fwidth(aspectUV / gridSize);
  float line = min(grid.x, grid.y);
  float gridMask = 1.0 - min(line, 1.0);
  
  // Major grid subdivisions
  float majorGridSize = 0.40;
  vec2 majorGrid = abs(fract(aspectUV / majorGridSize - 0.5) - 0.5) / fwidth(aspectUV / majorGridSize);
  float majorLine = min(majorGrid.x, majorGrid.y);
  float majorGridMask = 1.0 - min(majorLine, 1.0);
  
  // Grid line colors
  vec3 gridColor = vec3(0.12, 0.14, 0.17); // #1F242C
  vec3 majorGridColor = vec3(0.16, 0.19, 0.23); // #2A323D
  
  vec3 col = bg;
  col = mix(col, gridColor, gridMask * 0.45);
  col = mix(col, majorGridColor, majorGridMask * 0.65);
  
  // Intersection Reticle Dots
  vec2 dotPos = floor(aspectUV / majorGridSize) * majorGridSize + majorGridSize * 0.5;
  float dDot = length(aspectUV - dotPos);
  float dotMask = smoothstep(0.004, 0.001, dDot);
  col = mix(col, vec3(0.35, 0.40, 0.48), dotMask * 0.7);
  
  // Scanning Collimated Laser Beam (amber #F59E0B / cyan laser pulse)
  if (u_reduced_motion < 0.5) {
    float beamY = fract(t * 0.08); // slow continuous sweep
    float beamDist = abs(uv.y - beamY);
    
    // Laser beam core & exponential falloff glow
    float beamCore = smoothstep(0.003, 0.0, beamDist);
    float beamGlow = exp(-beamDist * 32.0);
    
    vec3 laserColor = vec3(0.96, 0.62, 0.04); // Amber #F59E0B
    col += laserColor * (beamCore * 0.35 + beamGlow * 0.07);
    
    // Subtle secondary calibration pulse
    float pulseDist = abs(uv.y - fract(t * 0.08 + 0.5));
    float pulseGlow = exp(-pulseDist * 48.0);
    col += vec3(0.22, 0.74, 0.97) * pulseGlow * 0.03; // cool cyan
  }
  
  return col;
}

// =========================================================================
// 2. LUMEN THEME: Obsidian Dusk & Luminous Cyan Horizon Caustics
// =========================================================================
vec3 renderLumen(vec2 uv, float t) {
  // Deep obsidian void
  vec3 bg = vec3(0.027, 0.031, 0.039); // #07080A
  
  // Horizon gradient (radial atmosphere from top-center)
  vec2 horizonOrigin = vec2(0.5, 1.1);
  float distToHorizon = length(uv - horizonOrigin);
  vec3 horizonAtmosphere = mix(vec3(0.05, 0.12, 0.22), bg, smoothstep(0.0, 1.4, distToHorizon));
  
  vec3 col = horizonAtmosphere;
  
  // Fluid Chromatic Plasma Waves
  float speed = u_reduced_motion > 0.5 ? 0.0 : t * 0.25;
  vec2 p = uv * 3.0;
  
  float wave1 = sin(p.x * 1.5 + speed + sin(p.y * 2.0 + speed * 0.8));
  float wave2 = cos(p.y * 1.8 - speed * 0.7 + cos(p.x * 2.2 + speed * 0.5));
  float wave = (wave1 + wave2) * 0.5;
  
  // Luminous Cyan / Electric Blue Caustic Dispersion
  vec3 cyanGlow = vec3(0.22, 0.74, 0.97); // #38BDF8
  vec3 sapphireGlow = vec3(0.12, 0.23, 0.54); // Deep sapphire
  
  float causticIntensity = smoothstep(-0.4, 0.8, wave) * (1.0 - uv.y * 0.7);
  col += mix(sapphireGlow, cyanGlow, causticIntensity) * (causticIntensity * 0.10);
  
  // Radial Top Horizon Luminous Edge
  float topEdgeGlow = exp(-(1.0 - uv.y) * 8.0);
  col += cyanGlow * topEdgeGlow * 0.15;
  
  // Atmospheric Micro-Photons Drift
  if (u_reduced_motion < 0.5) {
    vec2 pDust = uv * vec2(u_resolution.x / u_resolution.y, 1.0) * 12.0;
    pDust.y += t * 0.15;
    pDust.x += sin(t * 0.1 + pDust.y * 0.5) * 0.3;
    float dust = hash(floor(pDust));
    if (dust > 0.985) {
      vec2 f = fract(pDust) - 0.5;
      float d = length(f);
      float sparkle = smoothstep(0.15, 0.0, d) * sin(t * 2.0 + dust * 20.0);
      col += cyanGlow * max(0.0, sparkle) * 0.35;
    }
  }
  
  return col;
}

// =========================================================================
// 3. AERO THEME: Daylight Sky, Liquid Crystal Caustics & Gloss Reflections
// =========================================================================
vec3 renderAero(vec2 uv, float t) {
  // Vibrant daylight sky gradient
  vec3 skyTop = vec3(0.96, 0.98, 1.0);     // #F8FAFC crisp cloud white
  vec3 skyMid = vec3(0.73, 0.89, 0.98);     // #BAE6FD azure sky
  vec3 skyBottom = vec3(0.42, 0.73, 0.92);  // #6BB8EB daylight water
  
  vec3 col = mix(skyBottom, skyMid, uv.y);
  col = mix(col, skyTop, smoothstep(0.5, 1.0, uv.y));
  
  // Organic Liquid Caustics
  float speed = u_reduced_motion > 0.5 ? 0.0 : t * 0.35;
  vec2 p = uv * vec2(u_resolution.x / u_resolution.y, 1.0) * 4.5;
  
  float c1 = noise(p + vec2(speed * 0.4, speed * 0.2));
  float c2 = noise(p * 2.0 - vec2(speed * 0.3, speed * 0.5));
  float caustic = pow(sin((c1 + c2) * 6.2831), 2.0);
  
  vec3 causticLight = vec3(1.0, 1.0, 1.0);
  col += causticLight * caustic * 0.12 * (1.0 - uv.y * 0.4);
  
  // Diagonal Specular Gloss Sweeps (Frutiger Aero signature glass curve)
  float diagonalSweep = sin((uv.x * 1.5 + uv.y * 1.0) * 3.1415 + (u_reduced_motion > 0.5 ? 0.5 : sin(t * 0.2) * 0.5));
  float gloss = smoothstep(0.85, 1.0, diagonalSweep);
  col += vec3(1.0, 1.0, 1.0) * gloss * 0.08;
  
  // Floating Buoyant Light Bubbles
  if (u_reduced_motion < 0.5) {
    vec2 bUV = uv * vec2(u_resolution.x / u_resolution.y, 1.0) * 8.0;
    bUV.y -= t * 0.2; // upward float
    bUV.x += sin(t * 0.3 + bUV.y * 0.4) * 0.4;
    
    float bubbleHash = hash(floor(bUV));
    if (bubbleHash > 0.97) {
      vec2 bFract = fract(bUV) - 0.5;
      float d = length(bFract);
      float bubbleRing = smoothstep(0.28, 0.22, d) * smoothstep(0.12, 0.20, d);
      float bubbleHighlight = smoothstep(0.08, 0.0, length(bFract - vec2(-0.08, 0.08)));
      col += vec3(1.0, 1.0, 1.0) * (bubbleRing * 0.35 + bubbleHighlight * 0.55);
    }
  }
  
  return col;
}

void main() {
  vec3 color = vec3(0.0);
  
  if (u_theme < 0.5) {
    color = renderPrecision(v_uv, u_time);
  } else if (u_theme < 1.5) {
    color = renderLumen(v_uv, u_time);
  } else {
    color = renderAero(v_uv, u_time);
  }
  
  gl_FragColor = vec4(color, 1.0);
}
`;

export interface ThemeCanvasShaderProps {
  className?: string;
}

export const ThemeCanvasShader: React.FC<ThemeCanvasShaderProps> = ({ className = '' }) => {
  const { activeTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      });
    } catch {
      gl = null;
    }

    // Fallback if WebGL is unavailable
    if (!gl) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const resize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          if (activeTheme === 'lumen') {
            const grad = ctx.createRadialGradient(
              canvas.width * 0.5,
              0,
              10,
              canvas.width * 0.5,
              canvas.height * 0.5,
              canvas.height
            );
            grad.addColorStop(0, '#0E1726');
            grad.addColorStop(1, '#07080A');
            ctx.fillStyle = grad;
          } else if (activeTheme === 'aero') {
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, '#E0F2FE');
            grad.addColorStop(1, '#6BB8EB');
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = '#111315';
          }
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
      }
      return;
    }

    // Compile helper
    const createShader = (type: number, source: string) => {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.warn('[ThemeCanvasShader] Shader error:', gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[ThemeCanvasShader] Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry (full screen rectangle)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const posAttrLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttrLoc);
    gl.vertexAttribPointer(posAttrLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uThemeLoc = gl.getUniformLocation(program, 'u_theme');
    const uReducedMotionLoc = gl.getUniformLocation(program, 'u_reduced_motion');

    let animationFrameId: number;
    const startTime = performance.now();
    let isVisible = true;

    const getThemeNumeric = (theme: string): number => {
      if (theme === 'lumen') return 1.0;
      if (theme === 'aero') return 2.0;
      return 0.0; // precision & default
    };

    const handleResize = () => {
      if (!canvas || !gl) return;
      // Cap DPR at 1.0 for optimal background shader performance with zero UI frame lag
      const width = Math.floor(window.innerWidth);
      const height = Math.floor(window.innerHeight);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !prefersReducedMotion) {
        render();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!gl || !canvas) return;

      const elapsed = (performance.now() - startTime) / 1000.0;
      const themeVal = getThemeNumeric(activeTheme);

      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform1f(uThemeLoc, themeVal);
      gl.uniform1f(uReducedMotionLoc, prefersReducedMotion ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // If reduced motion is active, we render once and do not loop
      if (!prefersReducedMotion && isVisible) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (gl) {
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
      }
    };
  }, [activeTheme, prefersReducedMotion]);

  return (
    <canvas
      id="fsos-theme-canvas-shader"
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none -z-10 w-full h-full select-none transition-opacity duration-300 ${className}`}
      aria-hidden="true"
      data-theme={activeTheme}
    />
  );
};
