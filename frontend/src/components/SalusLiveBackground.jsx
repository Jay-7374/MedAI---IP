import React, { useEffect, useRef, useCallback } from 'react';

// Shape types for the canvas network
const SHAPES = ['dot', 'dot', 'dot', 'box', 'box', 'cross', 'triangle', 'diamond'];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function createParticle(W, H) {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return {
    x: randomBetween(0, W),
    y: randomBetween(0, H),
    vx: randomBetween(-0.18, 0.18),
    vy: randomBetween(-0.12, 0.12),
    size: randomBetween(2.5, 5.5),
    opacity: randomBetween(0.25, 0.65),
    shape,
    rotation: randomBetween(0, Math.PI * 2),
    rotSpeed: randomBetween(-0.003, 0.003),
  };
}

function drawShape(ctx, p) {
  const { x, y, size, shape, rotation } = p;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  switch (shape) {
    case 'dot':
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'box':
      ctx.strokeRect(-size, -size, size * 2, size * 2);
      break;

    case 'cross': {
      const arm = size * 1.3;
      const th = size * 0.38;
      ctx.beginPath();
      ctx.rect(-arm, -th, arm * 2, th * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.rect(-th, -arm, th * 2, arm * 2);
      ctx.fill();
      break;
    }

    case 'triangle': {
      const h = size * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.lineTo(h * 0.866, h * 0.5);
      ctx.lineTo(-h * 0.866, h * 0.5);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.4);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size * 1.4);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    default:
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.restore();
}

function drawCanvas(ctx, particles, W, H, maxDist, isDashboard) {
  ctx.clearRect(0, 0, W, H);

  const baseAlpha = isDashboard ? 0.28 : 0.48;

  // Draw connecting lines
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDist) continue;
      const alpha = (1 - dist / maxDist) * baseAlpha * 0.55;
      ctx.strokeStyle = `rgba(20, 138, 120, ${alpha})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  // Draw particles
  for (const p of particles) {
    const alpha = p.opacity * baseAlpha;
    // Fill for solid shapes
    ctx.fillStyle = `rgba(20, 138, 120, ${alpha})`;
    // Stroke for outlines
    ctx.strokeStyle = `rgba(20, 138, 120, ${alpha})`;
    ctx.lineWidth = 1.1;
    drawShape(ctx, p);
  }
}

function useParticleCanvas(canvasRef, variant) {
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const isDashboard = variant === 'dashboard';

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const count = isDashboard
      ? Math.floor((W * H) / 32000)
      : Math.floor((W * H) / 20000);
    const clamped = Math.max(22, Math.min(count, 80));
    particlesRef.current = Array.from({ length: clamped }, () => createParticle(W, H));
  }, [canvasRef, isDashboard]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const tick = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      const maxDist = Math.min(W, H) * 0.22;
      const particles = particlesRef.current;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;
      }

      drawCanvas(ctx, particles, W, H, maxDist, isDashboard);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, resize, isDashboard]);
}

export function SalusNetworkCanvas({ variant = 'landing' }) {
  const canvasRef = useRef(null);
  useParticleCanvas(canvasRef, variant);

  return (
    <canvas
      ref={canvasRef}
      className="salus-network-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

export default function SalusLiveBackground({ variant = 'landing', withNetwork = true }) {
  return (
    <div className={`salus-live-background variant-${variant}`} aria-hidden="true">
      <div className="salus-gradient-base" />
      <div className="salus-blob salus-blob-1" />
      <div className="salus-blob salus-blob-2" />
      <div className="salus-blob salus-blob-3" />
      {withNetwork && <SalusNetworkCanvas variant={variant} />}
    </div>
  );
}

