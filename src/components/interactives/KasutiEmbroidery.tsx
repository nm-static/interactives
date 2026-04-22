import confetti from 'canvas-confetti';
import { ChevronLeft, ChevronRight, Download, Link as LinkIcon, Pause, Play, Plus, RotateCcw, Share2, SkipBack, SkipForward, Undo2, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

type V = readonly [number, number]; // [row, col]
type EdgeKey = string;
type Side = 'front' | 'back';

interface Pattern {
  id: string;
  title: string;
  description: string;
  bbox: readonly [number, number]; // [rows, cols]
  edges: ReadonlyArray<readonly [V, V]>;
}

interface Stitch {
  side: Side;
  from: V;
  to: V;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GRID_SIZE = 20; // (GRID_SIZE + 1) x (GRID_SIZE + 1) points
const CELL = 22; // px per cell
const PAD = 12;
const SVG_DIM = GRID_SIZE * CELL + PAD * 2;

const FRONT_COLORS = ['#000000', '#1e3a8a', '#7c2d12', '#052e16', '#3b0764'];
const BACK_COLORS = ['#b91c1c', '#ca8a04', '#0f766e', '#6d28d9', '#be185d'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function edgeKey(a: V, b: V): EdgeKey {
  const [r1, c1] = a;
  const [r2, c2] = b;
  if (r1 < r2 || (r1 === r2 && c1 < c2)) return `${r1},${c1}|${r2},${c2}`;
  return `${r2},${c2}|${r1},${c1}`;
}

function vKey(v: V): string {
  return `${v[0]},${v[1]}`;
}

function isNeighbor(a: V, b: V): boolean {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  // Orthogonal unit step or diagonal unit step.
  return (
    (dr === 1 && dc === 0) ||
    (dr === 0 && dc === 1) ||
    (dr === 1 && dc === 1)
  );
}

function vEqual(a: V | null, b: V | null): boolean {
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
}

// ─── Replay URL codec ───────────────────────────────────────────────────────
// The payload captures just enough to reconstruct a completed tour: which
// pattern (preset id, or "custom" with its edge list), the start vertex, and
// the sequence of to-points. Sides alternate front/back so they don't need
// encoding. Coordinates are placed coords on the 20×20 grid; placement is
// deterministic (bbox centering) so a snowflake reload lands on the same
// vertices that were recorded.

interface ReplayPayload {
  v: 1;
  p: string;
  e?: Array<[[number, number], [number, number]]>;
  s: [number, number];
  t: Array<[number, number]>;
}

function b64urlEncode(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice(0, (4 - (s.length % 4)) % 4);
  return atob(padded);
}

function encodeReplay(
  patternId: string,
  customPattern: Pattern | null,
  startVertex: V,
  stitches: Stitch[]
): string {
  const payload: ReplayPayload = {
    v: 1,
    p: patternId,
    s: [startVertex[0], startVertex[1]],
    t: stitches.map((st) => [st.to[0], st.to[1]]),
  };
  if (patternId === 'custom' && customPattern) {
    payload.e = customPattern.edges.map(([a, b]) => [
      [a[0], a[1]],
      [b[0], b[1]],
    ]);
  }
  return b64urlEncode(JSON.stringify(payload));
}

function decodeReplay(raw: string): ReplayPayload | null {
  try {
    const obj = JSON.parse(b64urlDecode(raw)) as ReplayPayload;
    if (!obj || obj.v !== 1) return null;
    if (typeof obj.p !== 'string') return null;
    if (!Array.isArray(obj.s) || obj.s.length !== 2) return null;
    if (!Array.isArray(obj.t)) return null;
    for (const pt of obj.t) {
      if (!Array.isArray(pt) || pt.length !== 2) return null;
      if (typeof pt[0] !== 'number' || typeof pt[1] !== 'number') return null;
    }
    if (obj.e !== undefined) {
      if (!Array.isArray(obj.e)) return null;
      for (const e of obj.e) {
        if (!Array.isArray(e) || e.length !== 2) return null;
        const [a, b] = e;
        if (!Array.isArray(a) || !Array.isArray(b)) return null;
        if (a.length !== 2 || b.length !== 2) return null;
      }
    }
    return obj;
  } catch {
    return null;
  }
}

// ─── Patterns ───────────────────────────────────────────────────────────────

const PATTERNS: Pattern[] = [
  {
    id: 'square',
    title: 'Square',
    description: '4 stitches',
    bbox: [1, 1],
    edges: [
      [[0, 0], [0, 1]],
      [[0, 1], [1, 1]],
      [[1, 1], [1, 0]],
      [[1, 0], [0, 0]],
    ],
  },
  {
    id: 'rectangle',
    title: 'Rectangle',
    description: '6 stitches',
    bbox: [1, 2],
    edges: [
      [[0, 0], [0, 1]],
      [[0, 1], [0, 2]],
      [[0, 2], [1, 2]],
      [[1, 2], [1, 1]],
      [[1, 1], [1, 0]],
      [[1, 0], [0, 0]],
    ],
  },
  {
    id: 'box',
    title: 'Window',
    description: '8 stitches',
    bbox: [2, 2],
    edges: [
      [[0, 0], [0, 1]],
      [[0, 1], [0, 2]],
      [[0, 2], [1, 2]],
      [[1, 2], [2, 2]],
      [[2, 2], [2, 1]],
      [[2, 1], [2, 0]],
      [[2, 0], [1, 0]],
      [[1, 0], [0, 0]],
    ],
  },
  {
    id: 'l-shape',
    title: 'L-Shape',
    description: '8 stitches',
    bbox: [2, 2],
    edges: [
      [[0, 0], [0, 1]],
      [[0, 1], [1, 1]],
      [[1, 1], [1, 2]],
      [[1, 2], [2, 2]],
      [[2, 2], [2, 1]],
      [[2, 1], [2, 0]],
      [[2, 0], [1, 0]],
      [[1, 0], [0, 0]],
    ],
  },
  {
    id: 'figure-eight',
    title: 'Figure-Eight',
    description: '8 stitches, crossing',
    bbox: [2, 2],
    edges: [
      [[0, 0], [0, 1]],
      [[0, 1], [1, 1]],
      [[1, 1], [1, 0]],
      [[1, 0], [0, 0]],
      [[1, 1], [1, 2]],
      [[1, 2], [2, 2]],
      [[2, 2], [2, 1]],
      [[2, 1], [1, 1]],
    ],
  },
  {
    id: 'plus',
    title: 'Cross',
    description: '12 stitches',
    bbox: [3, 3],
    edges: [
      [[0, 1], [0, 2]],
      [[0, 2], [1, 2]],
      [[1, 2], [1, 3]],
      [[1, 3], [2, 3]],
      [[2, 3], [2, 2]],
      [[2, 2], [3, 2]],
      [[3, 2], [3, 1]],
      [[3, 1], [2, 1]],
      [[2, 1], [2, 0]],
      [[2, 0], [1, 0]],
      [[1, 0], [1, 1]],
      [[1, 1], [0, 1]],
    ],
  },
  {
    id: 'temple',
    title: 'Temple',
    description: '12 stitches',
    bbox: [3, 3],
    edges: [
      [[0, 1], [0, 2]],
      [[0, 2], [1, 2]],
      [[1, 2], [1, 3]],
      [[1, 3], [2, 3]],
      [[2, 3], [3, 3]],
      [[3, 3], [3, 2]],
      [[3, 2], [3, 1]],
      [[3, 1], [3, 0]],
      [[3, 0], [2, 0]],
      [[2, 0], [1, 0]],
      [[1, 0], [1, 1]],
      [[1, 1], [0, 1]],
    ],
  },
  // Rose — central square with four corner-shared petal squares (pattern 1 from the
  // reference sheet). Each corner of the central square carries a 2×2 petal.
  {
    id: 'rose',
    title: 'Rose',
    description: '36 stitches',
    bbox: [7, 7],
    edges: [
      // Central 1×1 square at (3,3)..(4,4)
      [[3, 3], [3, 4]],
      [[3, 4], [4, 4]],
      [[4, 4], [4, 3]],
      [[4, 3], [3, 3]],
      // NW petal: 2×2 square with corner (3,3)
      [[1, 1], [1, 2]],
      [[1, 2], [1, 3]],
      [[1, 3], [2, 3]],
      [[2, 3], [3, 3]],
      [[3, 3], [3, 2]],
      [[3, 2], [3, 1]],
      [[3, 1], [2, 1]],
      [[2, 1], [1, 1]],
      // NE petal: corner (3,4)
      [[1, 4], [1, 5]],
      [[1, 5], [1, 6]],
      [[1, 6], [2, 6]],
      [[2, 6], [3, 6]],
      [[3, 6], [3, 5]],
      [[3, 5], [3, 4]],
      [[3, 4], [2, 4]],
      [[2, 4], [1, 4]],
      // SW petal: corner (4,3)
      [[4, 1], [4, 2]],
      [[4, 2], [4, 3]],
      [[4, 3], [5, 3]],
      [[5, 3], [6, 3]],
      [[6, 3], [6, 2]],
      [[6, 2], [6, 1]],
      [[6, 1], [5, 1]],
      [[5, 1], [4, 1]],
      // SE petal: corner (4,4)
      [[4, 4], [4, 5]],
      [[4, 5], [4, 6]],
      [[4, 6], [5, 6]],
      [[5, 6], [6, 6]],
      [[6, 6], [6, 5]],
      [[6, 5], [6, 4]],
      [[6, 4], [5, 4]],
      [[5, 4], [4, 4]],
    ],
  },
  // Totem — top two boxes, middle square, wide base (pattern 2 from the reference).
  {
    id: 'totem',
    title: 'Totem',
    description: '24 stitches',
    bbox: [3, 5],
    edges: [
      // Top-left box (0..1, 1..2)
      [[0, 1], [0, 2]],
      [[0, 2], [1, 2]],
      [[1, 2], [1, 1]],
      [[1, 1], [0, 1]],
      // Top-right box (0..1, 3..4)
      [[0, 3], [0, 4]],
      [[0, 4], [1, 4]],
      [[1, 4], [1, 3]],
      [[1, 3], [0, 3]],
      // Middle square (1..2, 2..3) — shares corners (1,2) and (1,3)
      [[1, 2], [1, 3]],
      [[1, 3], [2, 3]],
      [[2, 3], [2, 2]],
      [[2, 2], [1, 2]],
      // Base (2..3, 0..5) — passes through (2,2),(2,3) so their degree stays even
      [[2, 0], [2, 1]],
      [[2, 1], [2, 2]],
      [[2, 2], [2, 3]],
      [[2, 3], [2, 4]],
      [[2, 4], [2, 5]],
      [[2, 5], [3, 5]],
      [[3, 5], [3, 4]],
      [[3, 4], [3, 3]],
      [[3, 3], [3, 2]],
      [[3, 2], [3, 1]],
      [[3, 1], [3, 0]],
      [[3, 0], [2, 0]],
    ],
  },
  // Figurine — head / arms / body / legs (pattern 4 from the reference).
  {
    id: 'figurine',
    title: 'Figurine',
    description: '34 stitches',
    bbox: [5, 6],
    edges: [
      // Head (0..1, 3..4)
      [[0, 3], [0, 4]],
      [[0, 4], [1, 4]],
      [[1, 4], [1, 3]],
      [[1, 3], [0, 3]],
      // Left arm: 2×2 rect (1..2, 1..3), corner-shared at (1,3)
      [[1, 1], [1, 2]],
      [[1, 2], [1, 3]],
      [[1, 3], [2, 3]],
      [[2, 3], [2, 2]],
      [[2, 2], [2, 1]],
      [[2, 1], [1, 1]],
      // Right arm: 2×2 rect (1..2, 4..6), corner-shared at (1,4)
      [[1, 4], [1, 5]],
      [[1, 5], [1, 6]],
      [[1, 6], [2, 6]],
      [[2, 6], [2, 5]],
      [[2, 5], [2, 4]],
      [[2, 4], [1, 4]],
      // Body: 1×2 rect (2..4, 3..4) — corner-shared with left arm at (2,3)
      //       and with right arm at (2,4)
      [[2, 3], [2, 4]],
      [[2, 4], [3, 4]],
      [[3, 4], [4, 4]],
      [[4, 4], [4, 3]],
      [[4, 3], [3, 3]],
      [[3, 3], [2, 3]],
      // Left leg: 2×2 rect (4..5, 1..3), corner-shared with body at (4,3)
      [[4, 1], [4, 2]],
      [[4, 2], [4, 3]],
      [[4, 3], [5, 3]],
      [[5, 3], [5, 2]],
      [[5, 2], [5, 1]],
      [[5, 1], [4, 1]],
      // Right leg: corner-shared with body at (4,4)
      [[4, 4], [4, 5]],
      [[4, 5], [4, 6]],
      [[4, 6], [5, 6]],
      [[5, 6], [5, 5]],
      [[5, 5], [5, 4]],
      [[5, 4], [4, 4]],
    ],
  },
  // Snowflake — central square, four inner petals, four outer 2×2 petals. 4-fold
  // symmetric, richer motif inspired by the red kasuti sample.
  {
    id: 'snowflake',
    title: 'Snowflake',
    description: '52 stitches',
    bbox: [7, 7],
    edges: [
      // Central 1×1 square at (3,3)..(4,4)
      [[3, 3], [3, 4]],
      [[3, 4], [4, 4]],
      [[4, 4], [4, 3]],
      [[4, 3], [3, 3]],
      // Inner NW petal (2,2)..(3,3)
      [[2, 2], [2, 3]],
      [[2, 3], [3, 3]],
      [[3, 3], [3, 2]],
      [[3, 2], [2, 2]],
      // Inner NE petal (2,4)..(3,5)
      [[2, 4], [2, 5]],
      [[2, 5], [3, 5]],
      [[3, 5], [3, 4]],
      [[3, 4], [2, 4]],
      // Inner SW petal (4,2)..(5,3)
      [[4, 2], [4, 3]],
      [[4, 3], [5, 3]],
      [[5, 3], [5, 2]],
      [[5, 2], [4, 2]],
      // Inner SE petal (4,4)..(5,5)
      [[4, 4], [4, 5]],
      [[4, 5], [5, 5]],
      [[5, 5], [5, 4]],
      [[5, 4], [4, 4]],
      // Outer NW 2×2 square sharing (2,2)
      [[0, 0], [0, 1]],
      [[0, 1], [0, 2]],
      [[0, 2], [1, 2]],
      [[1, 2], [2, 2]],
      [[2, 2], [2, 1]],
      [[2, 1], [2, 0]],
      [[2, 0], [1, 0]],
      [[1, 0], [0, 0]],
      // Outer NE 2×2 sharing (2,5)
      [[0, 5], [0, 6]],
      [[0, 6], [0, 7]],
      [[0, 7], [1, 7]],
      [[1, 7], [2, 7]],
      [[2, 7], [2, 6]],
      [[2, 6], [2, 5]],
      [[2, 5], [1, 5]],
      [[1, 5], [0, 5]],
      // Outer SW 2×2 sharing (5,2)
      [[5, 0], [5, 1]],
      [[5, 1], [5, 2]],
      [[5, 2], [6, 2]],
      [[6, 2], [7, 2]],
      [[7, 2], [7, 1]],
      [[7, 1], [7, 0]],
      [[7, 0], [6, 0]],
      [[6, 0], [5, 0]],
      // Outer SE 2×2 sharing (5,5)
      [[5, 5], [5, 6]],
      [[5, 6], [5, 7]],
      [[5, 7], [6, 7]],
      [[6, 7], [7, 7]],
      [[7, 7], [7, 6]],
      [[7, 6], [7, 5]],
      [[7, 5], [6, 5]],
      [[6, 5], [5, 5]],
    ],
  },
];

// ─── Pattern placement (centered in GRID_SIZE x GRID_SIZE) ──────────────────

interface PlacedPattern {
  pattern: Pattern;
  edgeKeys: Set<EdgeKey>;
  edges: Array<readonly [V, V]>;
  vertices: V[];
  neighbors: Map<string, V[]>;
  offset: readonly [number, number];
}

function placePattern(pattern: Pattern): PlacedPattern {
  const [br, bc] = pattern.bbox;
  const offsetR = Math.floor((GRID_SIZE - br) / 2);
  const offsetC = Math.floor((GRID_SIZE - bc) / 2);
  const shifted: Array<readonly [V, V]> = pattern.edges.map(([a, b]) => [
    [a[0] + offsetR, a[1] + offsetC] as V,
    [b[0] + offsetR, b[1] + offsetC] as V,
  ]);
  const edgeKeys = new Set<EdgeKey>();
  const vMap = new Map<string, V>();
  const neighbors = new Map<string, V[]>();
  for (const [a, b] of shifted) {
    edgeKeys.add(edgeKey(a, b));
    vMap.set(vKey(a), a);
    vMap.set(vKey(b), b);
    if (!neighbors.has(vKey(a))) neighbors.set(vKey(a), []);
    if (!neighbors.has(vKey(b))) neighbors.set(vKey(b), []);
    neighbors.get(vKey(a))!.push(b);
    neighbors.get(vKey(b))!.push(a);
  }
  return {
    pattern,
    edgeKeys,
    edges: shifted,
    vertices: Array.from(vMap.values()),
    neighbors,
    offset: [offsetR, offsetC],
  };
}

// ─── Coordinate helpers ─────────────────────────────────────────────────────

function toXY([r, c]: V): { x: number; y: number } {
  return { x: PAD + c * CELL, y: PAD + r * CELL };
}

// ─── Mini pattern preview for the reel ──────────────────────────────────────

const MINI_SIZE = 60;
const MINI_PAD = 4;

const MiniPreview: React.FC<{ pattern: Pattern; active: boolean }> = ({ pattern, active }) => {
  const [rows, cols] = pattern.bbox;
  // Scale to fit the fixed MINI_SIZE square so big motifs (Snowflake, Rose) don't overshoot.
  const span = Math.max(rows, cols, 1);
  const inner = MINI_SIZE - MINI_PAD * 2;
  const cell = inner / span;
  const offsetR = (inner - rows * cell) / 2;
  const offsetC = (inner - cols * cell) / 2;
  return (
    <svg width={MINI_SIZE} height={MINI_SIZE} className="shrink-0">
      {pattern.edges.map(([a, b], i) => (
        <line
          key={i}
          x1={MINI_PAD + offsetC + a[1] * cell}
          y1={MINI_PAD + offsetR + a[0] * cell}
          x2={MINI_PAD + offsetC + b[1] * cell}
          y2={MINI_PAD + offsetR + b[0] * cell}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className={active ? 'text-primary' : 'text-muted-foreground'}
        />
      ))}
    </svg>
  );
};

// ─── Motif reel (custom horizontal scroller) ────────────────────────────────

interface MotifReelProps {
  patterns: Pattern[];
  activeId: string;
  onSelect: (id: string) => void;
  onOpenEditor: () => void;
}

const MotifReel: React.FC<MotifReelProps> = ({ patterns, activeId, onSelect, onOpenEditor }) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdgeState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateEdgeState();
    const el = trackRef.current;
    if (!el) return;
    const handler = () => updateEdgeState();
    el.addEventListener('scroll', handler, { passive: true });
    const ro = new ResizeObserver(handler);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', handler);
      ro.disconnect();
    };
  }, [updateEdgeState, patterns.length]);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.8, 180);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }, []);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
        style={{ scrollbarWidth: 'none' }}
        role="radiogroup"
        aria-label="Motif picker"
      >
        {patterns.map((p) => {
          const active = p.id === activeId;
          return (
            <button
              key={p.id}
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(p.id)}
              className={`shrink-0 flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors min-w-[92px] ${
                active
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="h-[60px] w-[60px] flex items-center justify-center">
                <MiniPreview pattern={p} active={active} />
              </div>
              <span className="text-xs font-medium">{p.title}</span>
              <span className="text-[10px] text-muted-foreground">{p.description}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenEditor}
          aria-label="Design your own motif"
          className="shrink-0 flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border p-2 transition-colors min-w-[92px] hover:border-primary/60 hover:bg-primary/5"
        >
          <div className="h-[60px] w-[60px] flex items-center justify-center">
            <div className="w-9 h-9 rounded-full border-2 border-primary/60 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
          </div>
          <span className="text-xs font-medium">Make your own</span>
          <span className="text-[10px] text-muted-foreground">draw a motif</span>
        </button>
      </div>

      {/* Edge fades + arrow buttons */}
      {!atStart && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-card to-transparent" />
      )}
      {!atEnd && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent" />
      )}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={atStart}
        aria-label="Scroll motifs left"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center transition-opacity disabled:opacity-0 disabled:pointer-events-none hover:border-primary/60"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={atEnd}
        aria-label="Scroll motifs right"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center transition-opacity disabled:opacity-0 disabled:pointer-events-none hover:border-primary/60"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────

const KasutiEmbroidery: React.FC = () => {
  const [patternId, setPatternId] = useState<string>(PATTERNS[0].id);
  const [customPattern, setCustomPattern] = useState<Pattern | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentVertex, setCurrentVertex] = useState<V | null>(null);
  const [startVertex, setStartVertex] = useState<V | null>(null);
  const [activeSide, setActiveSide] = useState<Side>('front');
  const [stitches, setStitches] = useState<Stitch[]>([]);
  const [frontColor, setFrontColor] = useState(FRONT_COLORS[0]);
  const [backColor, setBackColor] = useState(BACK_COLORS[0]);
  const [completed, setCompleted] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1); // 0.5 | 1 | 2
  const celebratedRef = useRef(false);

  const visiblePatterns = useMemo(
    () => (customPattern ? [...PATTERNS, customPattern] : PATTERNS),
    [customPattern]
  );

  const placed = useMemo(() => {
    const p = visiblePatterns.find((x) => x.id === patternId) ?? PATTERNS[0];
    return placePattern(p);
  }, [patternId, visiblePatterns]);

  const drawnFront = useMemo(() => {
    const s = new Set<EdgeKey>();
    for (const st of stitches) {
      if (st.side === 'front') s.add(edgeKey(st.from, st.to));
    }
    return s;
  }, [stitches]);

  const drawnBack = useMemo(() => {
    const s = new Set<EdgeKey>();
    for (const st of stitches) {
      if (st.side === 'back') s.add(edgeKey(st.from, st.to));
    }
    return s;
  }, [stitches]);

  const resetTrace = useCallback(() => {
    setCurrentVertex(null);
    setStartVertex(null);
    setActiveSide('front');
    setStitches([]);
    setCompleted(false);
    celebratedRef.current = false;
  }, []);

  const selectPattern = useCallback(
    (id: string) => {
      setPatternId(id);
      resetTrace();
    },
    [resetTrace]
  );

  // Pick starting vertex — any pattern-incident vertex is valid.
  const canStartAt = useCallback(
    (v: V) => placed.neighbors.has(vKey(v)),
    [placed]
  );

  // For a given current vertex and active side, compute reachable neighbors.
  const legalNextVertices = useMemo(() => {
    if (!currentVertex) return [] as V[];
    const key = vKey(currentVertex);
    const neigh = placed.neighbors.get(key) ?? [];
    const drawn = activeSide === 'front' ? drawnFront : drawnBack;
    return neigh.filter((n) => !drawn.has(edgeKey(currentVertex, n)));
  }, [currentVertex, placed, activeSide, drawnFront, drawnBack]);

  const handleVertexClick = useCallback(
    (v: V) => {
      if (completed) return;
      if (!currentVertex) {
        if (!canStartAt(v)) return;
        setStartVertex(v);
        setCurrentVertex(v);
        return;
      }
      if (!isNeighbor(currentVertex, v)) return;
      const k = edgeKey(currentVertex, v);
      if (!placed.edgeKeys.has(k)) return;
      const drawn = activeSide === 'front' ? drawnFront : drawnBack;
      if (drawn.has(k)) return;
      const next: Stitch = { side: activeSide, from: currentVertex, to: v };
      const newStitches = [...stitches, next];
      setStitches(newStitches);
      setCurrentVertex(v);
      setActiveSide(activeSide === 'front' ? 'back' : 'front');

      // Check completion: all edges drawn on both sides AND we've returned to start.
      const totalEdges = placed.edges.length;
      const newFront = activeSide === 'front' ? drawnFront.size + 1 : drawnFront.size;
      const newBack = activeSide === 'back' ? drawnBack.size + 1 : drawnBack.size;
      if (
        newFront === totalEdges &&
        newBack === totalEdges &&
        startVertex &&
        vEqual(v, startVertex)
      ) {
        setCompleted(true);
      }
    },
    [
      completed,
      currentVertex,
      canStartAt,
      placed,
      activeSide,
      drawnFront,
      drawnBack,
      stitches,
      startVertex,
    ]
  );

  const undo = useCallback(() => {
    if (stitches.length === 0) {
      setCurrentVertex(null);
      setStartVertex(null);
      return;
    }
    const last = stitches[stitches.length - 1];
    setStitches(stitches.slice(0, -1));
    setCurrentVertex(last.from);
    setActiveSide(last.side);
    setCompleted(false);
    celebratedRef.current = false;
  }, [stitches]);

  // Build a shareable URL that hydrates to this tour on arrival.
  const buildReplayUrl = useCallback((): string | null => {
    if (!completed || !startVertex || typeof window === 'undefined') return null;
    const encoded = encodeReplay(patternId, customPattern, startVertex, stitches);
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('replay', encoded);
    return url.toString();
  }, [completed, startVertex, patternId, customPattern, stitches]);

  const copyReplayLink = useCallback(async () => {
    const url = buildReplayUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Replay link copied to clipboard.');
    } catch {
      toast.error('Could not copy — your browser blocked clipboard access.');
    }
  }, [buildReplayUrl]);

  const shareReplayOnX = useCallback(() => {
    const url = buildReplayUrl();
    if (!url) return;
    const patternName =
      visiblePatterns.find((p) => p.id === patternId)?.title ?? 'kasuti';
    const text = `I just traced a ${patternName} kasuti tour in ${stitches.length} stitches — watch it replay:`;
    const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweet, '_blank', 'noopener,noreferrer');
  }, [buildReplayUrl, patternId, stitches.length, visiblePatterns]);

  // On first completion: confetti + kick off an autoplay replay from step 0.
  // When the tour is un-completed (undo/reset/pattern change), tear down replay.
  useEffect(() => {
    if (completed && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
      setReplayIdx(0);
      setReplayPlaying(true);
    } else if (!completed) {
      setReplayIdx(0);
      setReplayPlaying(false);
    }
  }, [completed]);

  // Hydrate from ?replay=... on mount. Runs once client-side; if the payload
  // parses and the pattern is known (preset or carried inline), rebuild the
  // stitch sequence and mark the tour complete — the completion effect above
  // then takes care of confetti + autoplay.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('replay');
    if (!raw) return;
    const payload = decodeReplay(raw);
    if (!payload) return;

    let targetPattern: Pattern | null = null;
    if (payload.p === 'custom' && payload.e) {
      const customEdges: Array<readonly [V, V]> = payload.e.map(([a, b]) => [
        [a[0], a[1]] as V,
        [b[0], b[1]] as V,
      ]);
      // Build a Pattern from the raw (already-placed) edges. bbox should be 0..max.
      let maxR = 0;
      let maxC = 0;
      for (const [a, b] of customEdges) {
        maxR = Math.max(maxR, a[0], b[0]);
        maxC = Math.max(maxC, a[1], b[1]);
      }
      targetPattern = {
        id: 'custom',
        title: 'Custom',
        description: `${customEdges.length} stitches`,
        bbox: [maxR, maxC],
        edges: customEdges,
      };
      setCustomPattern(targetPattern);
    } else {
      targetPattern = PATTERNS.find((p) => p.id === payload.p) ?? null;
    }
    if (!targetPattern) return;

    setPatternId(payload.p);

    // Reconstruct stitches: start at payload.s, alternate sides, each entry's
    // `to` is the corresponding tour point.
    const start: V = [payload.s[0], payload.s[1]];
    const rebuilt: Stitch[] = [];
    let from: V = start;
    payload.t.forEach((pt, i) => {
      const to: V = [pt[0], pt[1]];
      rebuilt.push({ side: i % 2 === 0 ? 'front' : 'back', from, to });
      from = to;
    });
    setStartVertex(start);
    setCurrentVertex(from);
    setActiveSide(rebuilt.length % 2 === 0 ? 'front' : 'back');
    setStitches(rebuilt);
    setCompleted(true);
    hydratedRef.current = true;
  }, []);

  // Replay autoplay tick.
  useEffect(() => {
    if (!completed || !replayPlaying) return;
    const id = setInterval(() => {
      setReplayIdx((prev) => {
        if (prev >= stitches.length) {
          setReplayPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 320 / replaySpeed);
    return () => clearInterval(id);
  }, [completed, replayPlaying, stitches.length, replaySpeed]);

  // Effective view for rendering: during replay, clip stitches to replayIdx.
  const effectiveStitches = useMemo(
    () => (completed ? stitches.slice(0, replayIdx) : stitches),
    [completed, stitches, replayIdx]
  );
  const effectiveDrawnFront = useMemo(() => {
    if (!completed) return drawnFront;
    const s = new Set<EdgeKey>();
    for (const st of effectiveStitches) {
      if (st.side === 'front') s.add(edgeKey(st.from, st.to));
    }
    return s;
  }, [completed, effectiveStitches, drawnFront]);
  const effectiveDrawnBack = useMemo(() => {
    if (!completed) return drawnBack;
    const s = new Set<EdgeKey>();
    for (const st of effectiveStitches) {
      if (st.side === 'back') s.add(edgeKey(st.from, st.to));
    }
    return s;
  }, [completed, effectiveStitches, drawnBack]);
  const effectiveCurrentVertex: V | null = completed
    ? replayIdx === 0
      ? startVertex
      : stitches[replayIdx - 1].to
    : currentVertex;
  const effectiveActiveSide: Side = completed
    ? replayIdx === 0
      ? 'front'
      : stitches[replayIdx - 1].side === 'front'
        ? 'back'
        : 'front'
    : activeSide;

  const totalEdges = placed.edges.length;
  const frontRemaining = totalEdges - effectiveDrawnFront.size;
  const backRemaining = totalEdges - effectiveDrawnBack.size;
  const deadEnd = !completed && currentVertex !== null && legalNextVertices.length === 0;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Kasuti
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            A traditional hand-embroidery from Karnataka, India (7th century).
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Kasuti follows three rules: the design looks{' '}
            <em className="text-foreground font-medium">identical on both sides</em> of the cloth,
            you <em className="text-foreground font-medium">end where you start</em>, and{' '}
            <em className="text-foreground font-medium">no stitch is made twice</em>. Trace a
            motif alternately on the front (left) and back (right). Each stitch flips the fabric.
          </p>
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
            Kasuti is best experienced with thread and fabric, but if you want to experiment
            with making some designs or just get a feel for the pathways the thread will take
            when you don't have your materials handy, you can try emulating kasuti embroidery
            below. Pick one of the premade examples or make, save, and share your own designs!
            The editor does not currently support disjoint designs so make sure your patterns
            are connected.
          </p>
        </CardContent>
      </Card>

      {/* Pattern reel */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Choose a motif</CardTitle>
            <span className="text-xs text-muted-foreground">
              easy → more intricate
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <MotifReel
            patterns={visiblePatterns}
            activeId={patternId}
            onSelect={selectPattern}
            onOpenEditor={() => setEditorOpen(true)}
          />
        </CardContent>
      </Card>

      <PatternEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={customPattern}
        onSave={(p) => {
          setCustomPattern(p);
          setPatternId(p.id);
          resetTrace();
          setEditorOpen(false);
        }}
      />

      {/* Status bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border bg-muted/40 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={
              activeSide === 'front'
                ? 'border-foreground/60 text-foreground'
                : 'border-foreground/20 text-muted-foreground'
            }
          >
            Front{effectiveActiveSide === 'front' ? ' · active' : ''}
          </Badge>
          <Badge
            variant="outline"
            className={
              effectiveActiveSide === 'back'
                ? 'border-foreground/60 text-foreground'
                : 'border-foreground/20 text-muted-foreground'
            }
          >
            Back{effectiveActiveSide === 'back' ? ' · active' : ''}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {effectiveStitches.length} stitch{effectiveStitches.length === 1 ? '' : 'es'} · front{' '}
            {effectiveDrawnFront.size}/{totalEdges} · back {effectiveDrawnBack.size}/{totalEdges}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={stitches.length === 0}
          >
            <Undo2 className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={resetTrace}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Two fabric panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FabricPanel
          side="front"
          title="Front"
          color={frontColor}
          setColor={setFrontColor}
          palette={FRONT_COLORS}
          placed={placed}
          currentVertex={effectiveCurrentVertex}
          startVertex={startVertex}
          drawn={effectiveDrawnFront}
          otherDrawn={effectiveDrawnBack}
          stitches={effectiveStitches}
          frontColor={frontColor}
          backColor={backColor}
          activeSide={effectiveActiveSide}
          onVertexClick={handleVertexClick}
          legalNext={legalNextVertices}
          canStartAt={canStartAt}
          completed={completed}
          deadEnd={deadEnd}
          remaining={frontRemaining}
        />
        <FabricPanel
          side="back"
          title="Back"
          color={backColor}
          setColor={setBackColor}
          palette={BACK_COLORS}
          placed={placed}
          currentVertex={effectiveCurrentVertex}
          startVertex={startVertex}
          drawn={effectiveDrawnBack}
          otherDrawn={effectiveDrawnFront}
          stitches={effectiveStitches}
          frontColor={frontColor}
          backColor={backColor}
          activeSide={effectiveActiveSide}
          onVertexClick={handleVertexClick}
          legalNext={legalNextVertices}
          canStartAt={canStartAt}
          completed={completed}
          deadEnd={deadEnd}
          remaining={backRemaining}
        />
      </div>

      {completed && (
        <ReplayControls
          totalStitches={stitches.length}
          replayIdx={replayIdx}
          playing={replayPlaying}
          speed={replaySpeed}
          onIdxChange={setReplayIdx}
          onPlayingChange={setReplayPlaying}
          onSpeedChange={setReplaySpeed}
          onCopyLink={copyReplayLink}
          onShareTweet={shareReplayOnX}
        />
      )}

      {deadEnd && (
        <div className="text-center p-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-500 text-amber-800 dark:text-amber-200 text-sm">
          No legal stitches from here on the {activeSide}. Undo a step or reset to try a
          different route.
        </div>
      )}

      <footer className="pt-2 text-center text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        Find out more about Kasuti on the{' '}
        <a
          href="https://en.wikipedia.org/wiki/Kasuti"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          wikipedia page
        </a>{' '}
        and{' '}
        <a
          href="https://www.embroidery.rocksea.org/hand-embroidery/kasuti/kasuti-lesson-1/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          this nice tutorial
        </a>
        . I learned about Kasuti from Priyam when{' '}
        <a
          href="https://misc.neeldhara.courses/recreational-math/kasuti-embroidery/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          she taught a course
        </a>{' '}
        about it at IITGN. Priyam works as a Visiting Livelihood Development Researcher with
        the Karunar Kheti Trust in Upper Assam and has founded{' '}
        <a
          href="https://guddicrafts.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Guddi Crafts
        </a>
        , follow them on{' '}
        <a
          href="https://www.instagram.com/guddi.crafts/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Instagram
        </a>
        !
      </footer>
      <SonnerToaster richColors position="bottom-center" />
    </div>
  );
};

// ─── Replay controls ────────────────────────────────────────────────────────

interface ReplayControlsProps {
  totalStitches: number;
  replayIdx: number;
  playing: boolean;
  speed: number; // 0.5 | 1 | 2
  onIdxChange: (idx: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onCopyLink: () => void;
  onShareTweet: () => void;
}

const REPLAY_SPEEDS = [0.5, 1, 2] as const;

const ReplayControls: React.FC<ReplayControlsProps> = ({
  totalStitches,
  replayIdx,
  playing,
  speed,
  onIdxChange,
  onPlayingChange,
  onSpeedChange,
  onCopyLink,
  onShareTweet,
}) => {
  const atStart = replayIdx <= 0;
  const atEnd = replayIdx >= totalStitches;

  const handlePlay = () => {
    if (atEnd) {
      // If at the end, rewind and start over.
      onIdxChange(0);
      onPlayingChange(true);
      return;
    }
    onPlayingChange(!playing);
  };

  return (
    <div className="rounded-xl border border-green-500/60 bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
          Tour complete in {totalStitches} stitches — replay below.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onCopyLink}>
            <LinkIcon className="w-4 h-4 mr-1" />
            Copy link
          </Button>
          <Button variant="outline" size="sm" onClick={onShareTweet}>
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            speed
            {REPLAY_SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-0.5 rounded-md font-mono ${
                  s === speed
                    ? 'bg-foreground text-background'
                    : 'hover:bg-muted'
                }`}
              >
                {s === 1 ? '1×' : `${s}×`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onPlayingChange(false);
            onIdxChange(0);
          }}
          disabled={atStart}
          aria-label="Jump to start"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onPlayingChange(false);
            onIdxChange(Math.max(0, replayIdx - 1));
          }}
          disabled={atStart}
          aria-label="Previous stitch"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={handlePlay}
          aria-label={playing ? 'Pause replay' : 'Play replay'}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onPlayingChange(false);
            onIdxChange(Math.min(totalStitches, replayIdx + 1));
          }}
          disabled={atEnd}
          aria-label="Next stitch"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onPlayingChange(false);
            onIdxChange(totalStitches);
          }}
          disabled={atEnd}
          aria-label="Jump to end"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
        <input
          type="range"
          min={0}
          max={totalStitches}
          value={replayIdx}
          onChange={(e) => {
            onPlayingChange(false);
            onIdxChange(Number(e.target.value));
          }}
          className="flex-1 accent-primary"
          aria-label="Replay scrubber"
        />
        <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">
          {replayIdx} / {totalStitches}
        </span>
      </div>
    </div>
  );
};

// ─── Fabric panel (one side) ────────────────────────────────────────────────

interface FabricPanelProps {
  side: Side;
  title: string;
  color: string;
  setColor: (c: string) => void;
  palette: string[];
  placed: PlacedPattern;
  currentVertex: V | null;
  startVertex: V | null;
  drawn: Set<EdgeKey>;
  otherDrawn: Set<EdgeKey>;
  stitches: Stitch[];
  frontColor: string;
  backColor: string;
  activeSide: Side;
  onVertexClick: (v: V) => void;
  legalNext: V[];
  canStartAt: (v: V) => boolean;
  completed: boolean;
  deadEnd: boolean;
  remaining: number;
}

const FabricPanel: React.FC<FabricPanelProps> = ({
  side,
  title,
  color,
  setColor,
  palette,
  placed,
  currentVertex,
  startVertex,
  drawn,
  stitches,
  activeSide,
  onVertexClick,
  legalNext,
  canStartAt,
  completed,
  deadEnd,
  remaining,
}) => {
  const isActive = activeSide === side && !completed;
  const dots: V[] = useMemo(() => {
    const out: V[] = [];
    for (let r = 0; r <= GRID_SIZE; r++) {
      for (let c = 0; c <= GRID_SIZE; c++) {
        out.push([r, c]);
      }
    }
    return out;
  }, []);

  const legalSet = useMemo(() => {
    const s = new Set<string>();
    for (const v of legalNext) s.add(vKey(v));
    return s;
  }, [legalNext]);

  const mySideStitches = stitches.filter((s) => s.side === side);

  return (
    <Card className={isActive ? 'border-primary' : 'border-border'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {isActive && (
              <Badge className="bg-primary text-primary-foreground">active</Badge>
            )}
            {!isActive && !completed && (
              <Badge variant="outline" className="text-muted-foreground">
                waiting
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">thread</Label>
            <div className="flex items-center gap-1">
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Set ${side} thread color`}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c ? 'border-foreground scale-110' : 'border-border'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label
                aria-label={`Pick a custom ${side} thread color`}
                className={`relative w-5 h-5 rounded-full border-2 transition-transform cursor-pointer overflow-hidden ${
                  palette.includes(color) ? 'border-border' : 'border-foreground scale-110'
                }`}
                style={{
                  background:
                    'conic-gradient(from 0deg, #ef4444, #f59e0b, #facc15, #22c55e, #06b6d4, #3b82f6, #a855f7, #ec4899, #ef4444)',
                }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {mySideStitches.length} / {placed.edges.length} stitches · {remaining} remaining
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto flex justify-center">
          <svg
            width={SVG_DIM}
            height={SVG_DIM}
            className={`rounded-lg transition-colors ${
              deadEnd ? 'bg-muted' : 'bg-card'
            }`}
            style={{
              outline: '1px solid var(--border)',
            }}
          >
            {/* Grid dots */}
            {dots.map(([r, c]) => {
              const { x, y } = toXY([r, c]);
              return (
                <circle
                  key={`d${r}-${c}`}
                  cx={x}
                  cy={y}
                  r={0.8}
                  className="fill-muted-foreground/30"
                />
              );
            })}

            {/* Pattern guide lines (undrawn). Drawn ones rendered below in thread color. */}
            {placed.edges.map(([a, b], i) => {
              const k = edgeKey(a, b);
              if (drawn.has(k)) return null;
              const p = toXY(a);
              const q = toXY(b);
              return (
                <line
                  key={`g${i}`}
                  x1={p.x}
                  y1={p.y}
                  x2={q.x}
                  y2={q.y}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  className="text-muted-foreground/60"
                />
              );
            })}

            {/* Drawn stitches on this side in thread color */}
            {mySideStitches.map((st, i) => {
              const p = toXY(st.from);
              const q = toXY(st.to);
              return (
                <line
                  key={`s${i}`}
                  x1={p.x}
                  y1={p.y}
                  x2={q.x}
                  y2={q.y}
                  stroke={color}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Legal-next affordances (green = go) */}
            {isActive &&
              currentVertex &&
              legalNext.map((v, i) => {
                const { x, y } = toXY(v);
                return (
                  <circle
                    key={`n${i}`}
                    cx={x}
                    cy={y}
                    r={6}
                    className="fill-green-500/30 stroke-green-600 dark:fill-green-400/25 dark:stroke-green-400"
                    strokeWidth={1.5}
                  />
                );
              })}

            {/* Start-picker affordances (only when no current vertex yet and this side is active) */}
            {isActive &&
              !currentVertex &&
              placed.vertices.map((v, i) => {
                const { x, y } = toXY(v);
                return (
                  <circle
                    key={`pick${i}`}
                    cx={x}
                    cy={y}
                    r={5}
                    className="fill-green-500/20 stroke-green-600/70 dark:fill-green-400/15 dark:stroke-green-400/70"
                    strokeWidth={1}
                  />
                );
              })}

            {/* Start vertex marker (persists across sides) */}
            {startVertex && (
              <circle
                cx={toXY(startVertex).x}
                cy={toXY(startVertex).y}
                r={4}
                className="fill-none stroke-foreground"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
            )}

            {/* Current vertex marker — red on the active side, muted grey on the other.
                A ring briefly expands each time the marker moves or the side flips
                (the browser won't let us move the OS mouse pointer, so this draws
                the eye instead). */}
            {currentVertex &&
              (() => {
                const { x, y } = toXY(currentVertex);
                if (!isActive) {
                  return (
                    <circle cx={x} cy={y} r={4} className="fill-muted-foreground/60" />
                  );
                }
                return (
                  <g key={`cur-${side}-${vKey(currentVertex)}`}>
                    <circle cx={x} cy={y} r={4} className="fill-primary/60">
                      <animate
                        attributeName="r"
                        from="4"
                        to="18"
                        dur="0.65s"
                        begin="0s"
                        repeatCount="1"
                        fill="freeze"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.6"
                        to="0"
                        dur="0.65s"
                        begin="0s"
                        repeatCount="1"
                        fill="freeze"
                      />
                    </circle>
                    <circle cx={x} cy={y} r={4} className="fill-primary" />
                  </g>
                );
              })()}

            {/* Click overlays: only active side accepts clicks */}
            {isActive &&
              dots.map(([r, c]) => {
                const v: V = [r, c];
                const clickable = currentVertex
                  ? legalSet.has(vKey(v))
                  : canStartAt(v);
                if (!clickable) return null;
                const { x, y } = toXY(v);
                return (
                  <circle
                    key={`h${r}-${c}`}
                    cx={x}
                    cy={y}
                    r={10}
                    fill="transparent"
                    onClick={() => onVertexClick(v)}
                    className="cursor-pointer"
                  />
                );
              })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Pattern editor modal ──────────────────────────────────────────────────

const EDITOR_SIZE = 14; // cells
const EDITOR_CELL = 22; // px
const EDITOR_PAD = 14;
const EDITOR_DIM = EDITOR_SIZE * EDITOR_CELL + EDITOR_PAD * 2;

function edgeListFromKeys(keys: Set<EdgeKey>): Array<readonly [V, V]> {
  const out: Array<readonly [V, V]> = [];
  for (const k of keys) {
    const [a, b] = k.split('|');
    const [r1, c1] = a.split(',').map(Number);
    const [r2, c2] = b.split(',').map(Number);
    out.push([[r1, c1] as V, [r2, c2] as V]);
  }
  return out;
}

function isConnected(edges: Array<readonly [V, V]>): boolean {
  if (edges.length === 0) return false;
  const adj = new Map<string, string[]>();
  for (const [a, b] of edges) {
    const ka = vKey(a);
    const kb = vKey(b);
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka)!.push(kb);
    adj.get(kb)!.push(ka);
  }
  const start = adj.keys().next().value as string | undefined;
  if (!start) return false;
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift()!;
    for (const next of adj.get(node) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === adj.size;
}

function normalizePattern(edges: Array<readonly [V, V]>): Pattern | null {
  if (edges.length === 0) return null;
  let minR = Infinity,
    minC = Infinity,
    maxR = -Infinity,
    maxC = -Infinity;
  for (const [a, b] of edges) {
    for (const [r, c] of [a, b]) {
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
  }
  const shifted: Array<readonly [V, V]> = edges.map(([a, b]) => [
    [a[0] - minR, a[1] - minC] as V,
    [b[0] - minR, b[1] - minC] as V,
  ]);
  return {
    id: 'custom',
    title: 'Custom',
    description: `${edges.length} stitches`,
    bbox: [maxR - minR, maxC - minC],
    edges: shifted,
  };
}

interface PatternEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Pattern | null;
  onSave: (p: Pattern) => void;
}

interface KasutiPatternFile {
  kind: 'kasuti-pattern';
  version: 1;
  title: string;
  edges: Array<[[number, number], [number, number]]>;
}

function centeredEdgeSetFromPattern(p: Pattern): Set<EdgeKey> {
  const [br, bc] = p.bbox;
  const offR = Math.max(0, Math.floor((EDITOR_SIZE - br) / 2));
  const offC = Math.max(0, Math.floor((EDITOR_SIZE - bc) / 2));
  const out = new Set<EdgeKey>();
  for (const [a, b] of p.edges) {
    const sa: V = [a[0] + offR, a[1] + offC];
    const sb: V = [b[0] + offR, b[1] + offC];
    out.add(edgeKey(sa, sb));
  }
  return out;
}

function parsePatternFile(raw: string): Pattern | null {
  try {
    const data = JSON.parse(raw) as KasutiPatternFile;
    if (!data || data.kind !== 'kasuti-pattern' || !Array.isArray(data.edges)) return null;
    const edges: Array<readonly [V, V]> = [];
    for (const e of data.edges) {
      if (!Array.isArray(e) || e.length !== 2) return null;
      const [a, b] = e;
      if (!Array.isArray(a) || !Array.isArray(b)) return null;
      if (a.length !== 2 || b.length !== 2) return null;
      const [r1, c1] = a;
      const [r2, c2] = b;
      if (
        typeof r1 !== 'number' ||
        typeof c1 !== 'number' ||
        typeof r2 !== 'number' ||
        typeof c2 !== 'number'
      )
        return null;
      // Orthogonal or diagonal unit-length segments are valid.
      const dr = Math.abs(r1 - r2);
      const dc = Math.abs(c1 - c2);
      if (
        !(
          (dr === 1 && dc === 0) ||
          (dr === 0 && dc === 1) ||
          (dr === 1 && dc === 1)
        )
      )
        return null;
      edges.push([[r1, c1] as V, [r2, c2] as V]);
    }
    const normalized = normalizePattern(edges);
    if (!normalized) return null;
    return { ...normalized, title: data.title || 'Custom' };
  } catch {
    return null;
  }
}

const PatternEditor: React.FC<PatternEditorProps> = ({ open, onOpenChange, initial, onSave }) => {
  const [edges, setEdges] = useState<Set<EdgeKey>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // When the modal opens, seed from the initial custom pattern (if any), centred in the
  // editor grid. Resetting here avoids stale state between open/close cycles.
  useEffect(() => {
    if (!open) return;
    setLoadError(null);
    if (!initial) {
      setEdges(new Set());
      return;
    }
    setEdges(centeredEdgeSetFromPattern(initial));
  }, [open, initial]);

  const toggleEdge = useCallback((a: V, b: V) => {
    setEdges((prev) => {
      const next = new Set(prev);
      const k = edgeKey(a, b);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  const edgeList = useMemo(() => edgeListFromKeys(edges), [edges]);
  const connected = useMemo(() => isConnected(edgeList), [edgeList]);
  const count = edges.size;

  // Orthogonal edges are painted first so they stay on top (clicks near a vertex
  // prefer the straight segment); diagonals sit underneath and catch clicks in
  // the middle of each cell.
  const orthogonalEdges: Array<[V, V]> = useMemo(() => {
    const out: Array<[V, V]> = [];
    for (let r = 0; r <= EDITOR_SIZE; r++) {
      for (let c = 0; c < EDITOR_SIZE; c++) {
        out.push([[r, c], [r, c + 1]]);
      }
    }
    for (let r = 0; r < EDITOR_SIZE; r++) {
      for (let c = 0; c <= EDITOR_SIZE; c++) {
        out.push([[r, c], [r + 1, c]]);
      }
    }
    return out;
  }, []);

  const diagonalEdges: Array<[V, V]> = useMemo(() => {
    const out: Array<[V, V]> = [];
    for (let r = 0; r < EDITOR_SIZE; r++) {
      for (let c = 0; c < EDITOR_SIZE; c++) {
        out.push([[r, c], [r + 1, c + 1]]); // ╲
        out.push([[r, c + 1], [r + 1, c]]); // ╱
      }
    }
    return out;
  }, []);

  const handleSave = useCallback(() => {
    if (!connected) return;
    const pattern = normalizePattern(edgeList);
    if (!pattern) return;
    // Main grid has GRID_SIZE cells; patterns larger than that will not fit.
    const [br, bc] = pattern.bbox;
    if (br > GRID_SIZE || bc > GRID_SIZE) return;
    onSave(pattern);
  }, [connected, edgeList, onSave]);

  const handleClear = useCallback(() => setEdges(new Set()), []);

  const handleDownload = useCallback(() => {
    const pattern = normalizePattern(edgeList);
    if (!pattern) return;
    const payload: KasutiPatternFile = {
      kind: 'kasuti-pattern',
      version: 1,
      title: 'Custom',
      edges: pattern.edges.map(([a, b]) => [
        [a[0], a[1]],
        [b[0], b[1]],
      ]),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kasuti-motif-${pattern.edges.length}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [edgeList]);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilePicked = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parsePatternFile(result);
      if (!parsed) {
        setLoadError('That file does not look like a saved Kasuti motif.');
        return;
      }
      const [br, bc] = parsed.bbox;
      if (br > EDITOR_SIZE || bc > EDITOR_SIZE) {
        setLoadError(
          `That motif is too big for the editor grid (${br + 1}×${bc + 1} > ${EDITOR_SIZE + 1}×${EDITOR_SIZE + 1}).`
        );
        return;
      }
      setLoadError(null);
      setEdges(centeredEdgeSetFromPattern(parsed));
    };
    reader.onerror = () => setLoadError('Could not read that file.');
    reader.readAsText(file);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Design your own motif</DialogTitle>
          <DialogDescription>
            Click between two dots to add or remove a stitch line. As long as your motif is{' '}
            <em>connected</em>, an alternating kasuti tour exists on it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center overflow-auto">
          <svg
            width={EDITOR_DIM}
            height={EDITOR_DIM}
            className="rounded-lg bg-card"
            style={{ outline: '1px solid var(--border)' }}
          >
            {/* Grid dots */}
            {Array.from({ length: (EDITOR_SIZE + 1) * (EDITOR_SIZE + 1) }).map((_, i) => {
              const r = Math.floor(i / (EDITOR_SIZE + 1));
              const c = i % (EDITOR_SIZE + 1);
              return (
                <circle
                  key={`d${r}-${c}`}
                  cx={EDITOR_PAD + c * EDITOR_CELL}
                  cy={EDITOR_PAD + r * EDITOR_CELL}
                  r={1}
                  className="fill-muted-foreground/40"
                />
              );
            })}

            {/* Drawn edges */}
            {edgeList.map(([a, b], i) => {
              const ax = EDITOR_PAD + a[1] * EDITOR_CELL;
              const ay = EDITOR_PAD + a[0] * EDITOR_CELL;
              const bx = EDITOR_PAD + b[1] * EDITOR_CELL;
              const by = EDITOR_PAD + b[0] * EDITOR_CELL;
              return (
                <line
                  key={`e${i}`}
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  className="text-foreground"
                />
              );
            })}

            {/* Hit areas — diagonals underneath (catch clicks in cell centre),
                orthogonals on top (catch clicks near each edge). */}
            {diagonalEdges.map(([a, b], i) => {
              const ax = EDITOR_PAD + a[1] * EDITOR_CELL;
              const ay = EDITOR_PAD + a[0] * EDITOR_CELL;
              const bx = EDITOR_PAD + b[1] * EDITOR_CELL;
              const by = EDITOR_PAD + b[0] * EDITOR_CELL;
              return (
                <line
                  key={`dhit${i}`}
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke="transparent"
                  strokeWidth={8}
                  strokeLinecap="butt"
                  pointerEvents="stroke"
                  onClick={() => toggleEdge(a, b)}
                  className="cursor-pointer hover:stroke-primary/15"
                />
              );
            })}
            {orthogonalEdges.map(([a, b], i) => {
              const horizontal = a[0] === b[0];
              const x = EDITOR_PAD + Math.min(a[1], b[1]) * EDITOR_CELL;
              const y = EDITOR_PAD + Math.min(a[0], b[0]) * EDITOR_CELL;
              const w = horizontal ? EDITOR_CELL : 8;
              const h = horizontal ? 8 : EDITOR_CELL;
              return (
                <rect
                  key={`hit${i}`}
                  x={horizontal ? x : x - 4}
                  y={horizontal ? y - 4 : y}
                  width={w}
                  height={h}
                  fill="transparent"
                  onClick={() => toggleEdge(a, b)}
                  className="cursor-pointer hover:fill-primary/10"
                />
              );
            })}
          </svg>
        </div>

        <div className="text-xs text-center space-y-0.5">
          <p className="text-muted-foreground">{count} stitch{count === 1 ? '' : 'es'}</p>
          {count > 0 && !connected && (
            <p className="text-destructive">
              Not connected — every drawn segment must reach every other segment.
            </p>
          )}
          {count > 0 && connected && (
            <p className="text-success">Connected — ready to stitch.</p>
          )}
          {loadError && <p className="text-destructive">{loadError}</p>}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFilePicked}
        />

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleUpload}>
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={count === 0}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} disabled={count === 0}>
              Clear
            </Button>
          </div>
          <Button onClick={handleSave} disabled={!connected}>
            Use this motif
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KasutiEmbroidery;
