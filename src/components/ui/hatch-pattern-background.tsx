'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type HatchPatternBackgroundProps = {
  className?: string;
  gridOpacity?: number;
  gridSize?: number;
  accents?: boolean;
  accentCount?: number;
  animateAccents?: boolean;
  cycleMs?: number;
};

type Accent = { col: number; row: number; id: string };

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3);
const EASE_IN_OUT = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(col: number, row: number) {
  let x = col * 374761393 + row * 668265263;
  x = (x ^ (x >>> 13)) >>> 0;
  x = Math.imul(x, 1274126177) >>> 0;
  return x >>> 0;
}

function key(col: number, row: number) {
  return `${col}:${row}`;
}

function stableSeedFromProps({
  gridOpacity,
  gridSize,
  accents,
  accentCount,
  animateAccents,
  cycleMs,
}: {
  gridOpacity: number;
  gridSize: number;
  accents: boolean;
  accentCount: number;
  animateAccents: boolean;
  cycleMs: number;
}) {
  const a = (Math.round(clamp(gridOpacity, 0, 1) * 1000) >>> 0) * 2654435761;
  const b = (Math.round(gridSize) >>> 0) * 1597334677;
  const c = (accentCount >>> 0) * 3812015801;
  const d = (Math.round(cycleMs) >>> 0) * 958282397;
  const e = (accents ? 1 : 0) * 1013904223;
  const f = (animateAccents ? 1 : 0) * 1664525;
  return (a ^ b ^ c ^ d ^ e ^ f) >>> 0;
}

export default function HatchPatternBackground({
  className,
  gridOpacity = 1,
  gridSize = 10,
  accents = true,
  accentCount = 18,
  animateAccents = true,
  cycleMs = 2200,
}: HatchPatternBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const opacityCacheRef = React.useRef<Map<string, number>>(new Map());

  const accentsRef = React.useRef<Accent[]>([]);
  const accentSetRef = React.useRef<Set<string>>(new Set());

  const initSeedRef = React.useRef<number>(0);

  const animRef = React.useRef<{
    start: number;
    fadeStart: number;
    activeIdx: number;
    phase: 'idle' | 'out' | 'in';
    phaseAt: number;
    lastCycle: number;
  }>({
    start: 0,
    fadeStart: 0,
    activeIdx: 0,
    phase: 'idle',
    phaseAt: 0,
    lastCycle: 0,
  });

  const seed = React.useMemo(
    () =>
      stableSeedFromProps({
        gridOpacity,
        gridSize,
        accents,
        accentCount,
        animateAccents,
        cycleMs,
      }),
    [gridOpacity, gridSize, accents, accentCount, animateAccents, cycleMs],
  );

  React.useEffect(() => {
    initSeedRef.current = seed;
    opacityCacheRef.current.clear();
    accentsRef.current = [];
    accentSetRef.current = new Set();
    animRef.current = {
      start: 0,
      fadeStart: 0,
      activeIdx: 0,
      phase: 'idle',
      phaseAt: 0,
      lastCycle: 0,
    };
  }, [seed]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GAP = 2;
    const S = Math.max(6, Math.round(gridSize));
    const STEP = S + GAP;

    const BREATH_CYCLE_DURATION = 8000;
    const STAGGER_DELAY = 150;
    const MAX_OPACITY = 0.06;
    const MIN_OPACITY_THRESHOLD = 0.001;

    const getBaseOpacity = (col: number, row: number) => {
      const k = key(col, row);
      const cached = opacityCacheRef.current.get(k);
      if (typeof cached === 'number') return cached;

      const rng = mulberry32(hash2(col, row));
      const val = rng() < 0.7 ? rng() * MAX_OPACITY : 0;
      opacityCacheRef.current.set(k, val);
      return val;
    };

    const getStaggeredProgress = (x: number, y: number, time: number) => {
      const staggerOffset =
        (Math.floor(x) * 7919 + Math.floor(y) * 104729) % 1000;
      const staggeredTime =
        (time + staggerOffset * STAGGER_DELAY) % BREATH_CYCLE_DURATION;
      return staggeredTime / BREATH_CYCLE_DURATION;
    };

    const getBreathingMultiplier = (progress: number) => {
      return 0.6 + 0.4 * Math.sin(progress * Math.PI * 2);
    };

    const ensureAccents = (cols: number, rows: number) => {
      if (!accents) {
        accentsRef.current = [];
        accentSetRef.current = new Set();
        return;
      }
      if (accentsRef.current.length > 0) return;

      const rng = mulberry32(
        ((cols * 73856093) ^ (rows * 19349663) ^ initSeedRef.current) >>> 0,
      );

      const taken = new Set<string>();
      const out: Accent[] = [];

      const pad = 2;
      const minC = clamp(pad, 0, cols - 1);
      const maxC = clamp(cols - 1 - pad, 0, cols - 1);
      const minR = clamp(pad, 0, rows - 1);
      const maxR = clamp(rows - 1 - pad, 0, rows - 1);

      const safeCount = Math.min(accentCount, Math.max(1, cols * rows));
      let guard = 0;

      while (out.length < safeCount && guard < safeCount * 120) {
        const col = Math.floor(minC + rng() * (maxC - minC + 1));
        const row = Math.floor(minR + rng() * (maxR - minR + 1));
        const k = key(col, row);
        if (!taken.has(k)) {
          taken.add(k);
          out.push({ col, row, id: `a-${col}-${row}-${rng()}` });
        }
        guard++;
      }

      accentsRef.current = out;
      accentSetRef.current = new Set(out.map((a) => key(a.col, a.row)));
      animRef.current.activeIdx = 0;
      animRef.current.phase = 'idle';
      animRef.current.phaseAt = 0;
    };

    const reseatOneAccent = (cols: number, rows: number, idx: number) => {
      const list = accentsRef.current;
      if (!list[idx]) return;

      const pad = 2;
      const minC = clamp(pad, 0, cols - 1);
      const maxC = clamp(cols - 1 - pad, 0, cols - 1);
      const minR = clamp(pad, 0, rows - 1);
      const maxR = clamp(rows - 1 - pad, 0, rows - 1);

      const taken = new Set(accentSetRef.current);
      taken.delete(key(list[idx]!.col, list[idx]!.row));

      const rng = mulberry32(
        ((cols * 73856093) ^
          (rows * 19349663) ^
          (idx * 83492791) ^
          initSeedRef.current ^
          (Date.now() & 0xffffffff)) >>>
          0,
      );

      let col = Math.floor(minC + rng() * (maxC - minC + 1));
      let row = Math.floor(minR + rng() * (maxR - minR + 1));
      let guard = 0;

      while (taken.has(key(col, row)) && guard < 120) {
        col = Math.floor(minC + rng() * (maxC - minC + 1));
        row = Math.floor(minR + rng() * (maxR - minR + 1));
        guard++;
      }

      const oldK = key(list[idx]!.col, list[idx]!.row);
      const newK = key(col, row);

      list[idx] = { col, row, id: `a-${col}-${row}-${rng()}` };

      const nextSet = new Set(accentSetRef.current);
      nextSet.delete(oldK);
      nextSet.add(newK);
      accentSetRef.current = nextSet;
    };

    const draw = (ts: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.round(rect.width || 0);
      const height = Math.round(rect.height || 0);
      if (width <= 0 || height <= 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const pxW = Math.max(1, Math.floor(width * dpr));
      const pxH = Math.max(1, Math.floor(height * dpr));

      if (canvas.width !== pxW) canvas.width = pxW;
      if (canvas.height !== pxH) canvas.height = pxH;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pxW, pxH);
      ctx.scale(dpr, dpr);

      const computed = getComputedStyle(canvas);
      const colorRaw = computed.getPropertyValue('--muted-foreground').trim();
      const baseFill =
        colorRaw && colorRaw !== '' ? colorRaw : 'rgba(156,163,175,1)';

      const cols = Math.ceil(width / STEP);
      const rows = Math.ceil(height / STEP);

      ensureAccents(cols, rows);

      const now = ts;
      const a = animRef.current;

      if (!a.start) {
        a.start = now;
        a.fadeStart = now;
        a.lastCycle = now;
        a.phase = 'idle';
        a.phaseAt = now;
        a.activeIdx = 0;
      }

      const elapsed = now - a.start;
      const fade = EASE_IN_OUT(Math.min(elapsed / 2000, 1));

      if (accents && animateAccents && accentsRef.current.length > 0) {
        const OUT_MS = 220;
        const HIDDEN_MS = 120;
        const IN_MS = 260;

        const cycle = Math.max(900, cycleMs);
        if (now - a.lastCycle >= cycle && a.phase === 'idle') {
          a.lastCycle = now;
          a.phase = 'out';
          a.phaseAt = now;
        }

        if (a.phase === 'out' && now - a.phaseAt >= OUT_MS + HIDDEN_MS) {
          reseatOneAccent(cols, rows, a.activeIdx);
          a.phase = 'in';
          a.phaseAt = now;
        } else if (a.phase === 'in' && now - a.phaseAt >= IN_MS) {
          a.phase = 'idle';
          a.phaseAt = now;
          a.activeIdx =
            (a.activeIdx + 1) % Math.max(1, accentsRef.current.length);
        }
      }

      ctx.fillStyle = baseFill;

      const global = clamp(gridOpacity, 0, 1);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (accents && accentSetRef.current.has(key(col, row))) continue;

          const x = col * STEP + STEP / 2;
          const y = row * STEP + STEP / 2;
          if (x > width || y > height) continue;

          const baseOpacity = getBaseOpacity(col, row);
          if (baseOpacity < MIN_OPACITY_THRESHOLD) continue;

          const progress = getStaggeredProgress(x, y, elapsed);
          const breathing = getBreathingMultiplier(progress);

          const finalOpacity = baseOpacity * breathing * fade * global;
          if (finalOpacity < MIN_OPACITY_THRESHOLD) continue;

          ctx.save();
          ctx.globalAlpha = finalOpacity;
          ctx.fillRect(x - S / 2, y - S / 2, S, S);
          ctx.restore();
        }
      }

      if (accents && accentsRef.current.length > 0) {
        for (let i = 0; i < accentsRef.current.length; i++) {
          const ac = accentsRef.current[i]!;
          const x = ac.col * STEP + STEP / 2;
          const y = ac.row * STEP + STEP / 2;

          const isActive = animateAccents && i === animRef.current.activeIdx;

          let alpha = 0.9 * global;
          let scale = 1;

          if (isActive && animateAccents) {
            const p = animRef.current.phase;
            const dt = now - animRef.current.phaseAt;

            const OUT_MS = 220;
            const IN_MS = 260;

            if (p === 'out') {
              const t = clamp(dt / OUT_MS, 0, 1);
              const k = EASE_IN_OUT(t);
              scale = 1 - k;
              alpha = 0.9 * (1 - k) * global;
            } else if (p === 'in') {
              const t = clamp(dt / IN_MS, 0, 1);
              scale = EASE_OUT(t);
              alpha = 0.9 * global;
            }
          }

          ctx.save();
          ctx.translate(x, y);
          ctx.scale(scale, scale);
          ctx.translate(-x, -y);
          ctx.globalAlpha = alpha;

          ctx.fillStyle = 'rgb(255, 10, 10)';
          ctx.fillRect(x - S / 2, y - S / 2, S, S);

          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [gridSize, gridOpacity, accents, accentCount, animateAccents, cycleMs]);

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
