import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';

export const AppCanvasShader: React.FC = () => {
  const { activeTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let time = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle seeds for Lumen and Aero
    const particles = Array.from({ length: 32 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 2.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -0.2 - Math.random() * 0.4,
      opacity: 0.15 + Math.random() * 0.35,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      phase: i * 0.2,
    }));

    // Aero Bokeh Bubbles
    const aeroBubbles = Array.from({ length: 18 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 12 + Math.random() * 38,
      speedY: -0.15 - Math.random() * 0.3,
      speedX: Math.sin(i) * 0.2,
      wobbleSpeed: 0.015 + Math.random() * 0.02,
      opacity: 0.18 + Math.random() * 0.25,
      phase: i * 0.4,
    }));

    const renderPrecision = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      // Deep Industrial Graphite Base
      ctx.fillStyle = '#111315';
      ctx.fillRect(0, 0, width, height);

      // Fine Technical Coordinate Grid
      const gridSize = 48;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(43, 50, 58, 0.4)';

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Precision Laser Interferometer Scan Wave
      const waveY = (t * 40) % (height + 200) - 100;
      const scanGradient = ctx.createLinearGradient(0, waveY - 60, 0, waveY + 60);
      scanGradient.addColorStop(0, 'rgba(139, 157, 255, 0)');
      scanGradient.addColorStop(0.5, 'rgba(139, 157, 255, 0.045)');
      scanGradient.addColorStop(1, 'rgba(139, 157, 255, 0)');
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, Math.max(0, waveY - 60), width, 120);

      // Subtle Precision Crosshair Nodes
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      const nodeStep = gridSize * 4;
      for (let x = gridSize * 2; x < width; x += nodeStep) {
        for (let y = gridSize * 2; y < height; y += nodeStep) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + (x + y) * 0.005);
          ctx.beginPath();
          ctx.arc(x, y, 1.2 * pulse, 0, Math.PI * 2);
          ctx.fill();

          // Reticle tick
          ctx.strokeStyle = `rgba(148, 163, 184, ${0.15 * pulse})`;
          ctx.beginPath();
          ctx.moveTo(x - 4, y);
          ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4);
          ctx.lineTo(x, y + 4);
          ctx.stroke();
        }
      }
    };

    const renderLumen = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      // Deep Obsidian Base
      ctx.fillStyle = '#07080A';
      ctx.fillRect(0, 0, width, height);

      // Luminous Dusk Cyan / Indigo Radial Auroras
      const auroraX1 = width * 0.85 + Math.sin(t * 0.4) * 80;
      const auroraY1 = height * 0.15 + Math.cos(t * 0.3) * 60;
      const rad1 = ctx.createRadialGradient(auroraX1, auroraY1, 10, auroraX1, auroraY1, width * 0.65);
      rad1.addColorStop(0, 'rgba(56, 189, 248, 0.07)');
      rad1.addColorStop(0.4, 'rgba(14, 165, 233, 0.03)');
      rad1.addColorStop(1, 'rgba(7, 8, 10, 0)');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, width, height);

      const auroraX2 = width * 0.15 + Math.cos(t * 0.35) * 70;
      const auroraY2 = height * 0.8 + Math.sin(t * 0.45) * 50;
      const rad2 = ctx.createRadialGradient(auroraX2, auroraY2, 10, auroraX2, auroraY2, width * 0.55);
      rad2.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
      rad2.addColorStop(0.5, 'rgba(30, 41, 59, 0.04)');
      rad2.addColorStop(1, 'rgba(7, 8, 10, 0)');
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, width, height);

      // Subtle Dusk Horizon Wave
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 20) {
        const y = height * 0.45 + Math.sin(x * 0.003 + t * 0.6) * 24 + Math.cos(x * 0.006 - t * 0.4) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Floating Luminous Photon Dust Particles
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        }
        const alpha = p.opacity * (0.6 + 0.4 * Math.sin(t * 2 + p.phase));
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const renderAero = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      // Daylight Azure Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, width, height);
      skyGrad.addColorStop(0, '#E0F2FE');
      skyGrad.addColorStop(0.45, '#BAE6FD');
      skyGrad.addColorStop(1, '#93C5FD');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Prismatic Diagonal Sunbeam / Specular Sheen
      const sheenX = ((t * 25) % (width + 600)) - 300;
      const sheenGrad = ctx.createLinearGradient(sheenX, 0, sheenX + 250, height);
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, width, height);

      // Translucent Organic Bokeh Bubbles
      aeroBubbles.forEach((b) => {
        if (!prefersReducedMotion) {
          b.y += b.speedY;
          b.x += Math.sin(t * b.wobbleSpeed + b.phase) * 0.4;
          if (b.y < -b.radius * 2) {
            b.y = height + b.radius * 2;
            b.x = Math.random() * width;
          }
        }

        // Bubble body with specular highlight
        const bubbleGrad = ctx.createRadialGradient(
          b.x - b.radius * 0.3,
          b.y - b.radius * 0.3,
          b.radius * 0.1,
          b.x,
          b.y,
          b.radius
        );
        bubbleGrad.addColorStop(0, `rgba(255, 255, 255, ${b.opacity * 0.8})`);
        bubbleGrad.addColorStop(0.7, `rgba(186, 230, 253, ${b.opacity * 0.4})`);
        bubbleGrad.addColorStop(1, `rgba(56, 189, 248, ${b.opacity * 0.15})`);

        ctx.fillStyle = bubbleGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${b.opacity * 0.6})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Harmonic Sky Caustic Waves
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 15) {
        const y = height * 0.65 + Math.sin(x * 0.005 + t * 0.8) * 18 + Math.cos(x * 0.008 - t * 0.5) * 10;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const loop = () => {
      time += 0.016;

      if (activeTheme === 'lumen') {
        renderLumen(time);
      } else if (activeTheme === 'aero') {
        renderAero(time);
      } else {
        renderPrecision(time);
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    // Initial render
    loop();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [activeTheme, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      id="fsos-app-canvas-shader"
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-0"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};
