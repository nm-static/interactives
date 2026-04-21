import confetti from 'canvas-confetti';
import { RotateCcw, Undo2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

function vEqual(a: V | null, b: V | null): boolean {
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
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

const MiniPreview: React.FC<{ pattern: Pattern; active: boolean }> = ({ pattern, active }) => {
  const [rows, cols] = pattern.bbox;
  const pad = 4;
  const cell = 14;
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2;
  return (
    <svg width={w} height={h} className="shrink-0">
      {pattern.edges.map(([a, b], i) => (
        <line
          key={i}
          x1={pad + a[1] * cell}
          y1={pad + a[0] * cell}
          x2={pad + b[1] * cell}
          y2={pad + b[0] * cell}
          stroke={active ? 'currentColor' : 'currentColor'}
          strokeWidth={2}
          strokeLinecap="round"
          className={active ? 'text-primary' : 'text-muted-foreground'}
        />
      ))}
    </svg>
  );
};

// ─── Main component ────────────────────────────────────────────────────────

const KasutiEmbroidery: React.FC = () => {
  const [patternId, setPatternId] = useState<string>(PATTERNS[0].id);
  const [currentVertex, setCurrentVertex] = useState<V | null>(null);
  const [startVertex, setStartVertex] = useState<V | null>(null);
  const [activeSide, setActiveSide] = useState<Side>('front');
  const [stitches, setStitches] = useState<Stitch[]>([]);
  const [frontColor, setFrontColor] = useState(FRONT_COLORS[0]);
  const [backColor, setBackColor] = useState(BACK_COLORS[0]);
  const [completed, setCompleted] = useState(false);
  const celebratedRef = useRef(false);

  const placed = useMemo(() => {
    const p = PATTERNS.find((x) => x.id === patternId) ?? PATTERNS[0];
    return placePattern(p);
  }, [patternId]);

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

  useEffect(() => {
    if (completed && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
    }
  }, [completed]);

  const totalEdges = placed.edges.length;
  const frontRemaining = totalEdges - drawnFront.size;
  const backRemaining = totalEdges - drawnBack.size;

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
            Equivalently: given the pattern graph, double every edge with two colours and find a
            closed Eulerian tour that alternates colours at every step.
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
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            role="radiogroup"
            aria-label="Motif picker"
          >
            {PATTERNS.map((p) => {
              const active = p.id === patternId;
              return (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => selectPattern(p.id)}
                  className={`shrink-0 flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors min-w-[88px] ${
                    active
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="h-[60px] flex items-center justify-center">
                    <MiniPreview pattern={p} active={active} />
                  </div>
                  <span className="text-xs font-medium">{p.title}</span>
                  <span className="text-[10px] text-muted-foreground">{p.description}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
            Front{activeSide === 'front' ? ' · active' : ''}
          </Badge>
          <Badge
            variant="outline"
            className={
              activeSide === 'back'
                ? 'border-foreground/60 text-foreground'
                : 'border-foreground/20 text-muted-foreground'
            }
          >
            Back{activeSide === 'back' ? ' · active' : ''}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {stitches.length} stitch{stitches.length === 1 ? '' : 'es'} · front{' '}
            {drawnFront.size}/{totalEdges} · back {drawnBack.size}/{totalEdges}
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
          currentVertex={currentVertex}
          startVertex={startVertex}
          drawn={drawnFront}
          otherDrawn={drawnBack}
          stitches={stitches}
          frontColor={frontColor}
          backColor={backColor}
          activeSide={activeSide}
          onVertexClick={handleVertexClick}
          legalNext={legalNextVertices}
          canStartAt={canStartAt}
          completed={completed}
          remaining={frontRemaining}
        />
        <FabricPanel
          side="back"
          title="Back"
          color={backColor}
          setColor={setBackColor}
          palette={BACK_COLORS}
          placed={placed}
          currentVertex={currentVertex}
          startVertex={startVertex}
          drawn={drawnBack}
          otherDrawn={drawnFront}
          stitches={stitches}
          frontColor={frontColor}
          backColor={backColor}
          activeSide={activeSide}
          onVertexClick={handleVertexClick}
          legalNext={legalNextVertices}
          canStartAt={canStartAt}
          completed={completed}
          remaining={backRemaining}
        />
      </div>

      {completed && (
        <div className="text-center p-4 rounded-xl bg-green-100 dark:bg-green-900/30 border border-green-500 text-green-800 dark:text-green-200 font-semibold">
          You ended where you started — both sides match exactly. A complete kasuti tour in{' '}
          {stitches.length} stitches.
        </div>
      )}

      {!completed && currentVertex && legalNextVertices.length === 0 && (
        <div className="text-center p-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-500 text-amber-800 dark:text-amber-200 text-sm">
          No legal stitches from here on the {activeSide}. Undo a step or reset to try a
          different route.
        </div>
      )}
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
            <div className="flex gap-1">
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
            className="rounded-lg bg-card"
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

            {/* Legal-next affordances */}
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
                    className="fill-primary/30 stroke-primary"
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
                    className="fill-primary/20 stroke-primary/70"
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

            {/* Current vertex marker */}
            {currentVertex && (
              <circle
                cx={toXY(currentVertex).x}
                cy={toXY(currentVertex).y}
                r={4}
                className="fill-primary"
              />
            )}

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

export default KasutiEmbroidery;
