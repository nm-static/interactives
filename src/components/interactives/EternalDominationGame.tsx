import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Target, RotateCcw, Info } from "lucide-react";

// Extended good rectangle: 10 columns × 12 rows (following Fig. 10)
// Border: columns 0 and 9, rows 0/1 (top) and 10/11 (bottom)
const COLS = 10;
const ROWS = 12;

type Position = { x: number; y: number };
type Movement = { from: Position; to: Position; type: 'interior' | 'toInterior' | 'toBorder' | 'pathShift' };

const posKey = (p: Position): string => `${p.x},${p.y}`;
const parseKey = (key: string): Position => {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
};

const isValidPos = (x: number, y: number): boolean => 
  x >= 0 && x < COLS && y >= 0 && y < ROWS;

// Hexagonal adjacency (brick pattern)
const getHexNeighbors = (x: number, y: number): Position[] => {
  const neighbors: Position[] = [];
  
  if (isValidPos(x - 1, y)) neighbors.push({ x: x - 1, y });
  if (isValidPos(x + 1, y)) neighbors.push({ x: x + 1, y });
  
  const isEvenRow = y % 2 === 0;
  if (isEvenRow) {
    if (isValidPos(x - 1, y - 1)) neighbors.push({ x: x - 1, y: y - 1 });
    if (isValidPos(x, y - 1)) neighbors.push({ x: x, y: y - 1 });
    if (isValidPos(x - 1, y + 1)) neighbors.push({ x: x - 1, y: y + 1 });
    if (isValidPos(x, y + 1)) neighbors.push({ x: x, y: y + 1 });
  } else {
    if (isValidPos(x, y - 1)) neighbors.push({ x: x, y: y - 1 });
    if (isValidPos(x + 1, y - 1)) neighbors.push({ x: x + 1, y: y - 1 });
    if (isValidPos(x, y + 1)) neighbors.push({ x: x, y: y + 1 });
    if (isValidPos(x + 1, y + 1)) neighbors.push({ x: x + 1, y: y + 1 });
  }
  
  return neighbors;
};

// Border: left/right columns and top/bottom double rows
const isBorder = (x: number, y: number): boolean => {
  if (x === 0 || x === COLS - 1) return true;
  if (y === 0 || y === 1 || y === ROWS - 2 || y === ROWS - 1) return true;
  return false;
};

const isInterior = (x: number, y: number): boolean => 
  x > 0 && x < COLS - 1 && y > 1 && y < ROWS - 2;

// Get the initial guard configuration U₃
// All border vertices guarded + interior guards in dominating pattern
const generateInitialGuards = (): Set<string> => {
  const guards = new Set<string>();
  
  // All border vertices
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (isBorder(x, y)) {
        guards.add(posKey({ x, y }));
      }
    }
  }
  
  // Interior guards: dominating set pattern from S₃
  // Place at positions where (x + 2*y) % 4 === 0
  for (let x = 1; x < COLS - 1; x++) {
    for (let y = 2; y < ROWS - 2; y++) {
      if ((x + 2 * y) % 4 === 0) {
        guards.add(posKey({ x, y }));
      }
    }
  }
  
  return guards;
};

// Get the target pattern for interior (what we want to restore to)
const getTargetInteriorPattern = (): Set<string> => {
  const pattern = new Set<string>();
  for (let x = 1; x < COLS - 1; x++) {
    for (let y = 2; y < ROWS - 2; y++) {
      if ((x + 2 * y) % 4 === 0) {
        pattern.add(posKey({ x, y }));
      }
    }
  }
  return pattern;
};

const isDominated = (x: number, y: number, guards: Set<string>): boolean => {
  if (guards.has(posKey({ x, y }))) return true;
  return getHexNeighbors(x, y).some(p => guards.has(posKey(p)));
};

const isFullyDominated = (guards: Set<string>): boolean => {
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!isDominated(x, y, guards)) return false;
    }
  }
  return true;
};

// Get ordered border cycle C (for path finding)
const getBorderCycleOrdered = (): Position[] => {
  const cycle: Position[] = [];
  
  // Outer ring clockwise
  for (let x = 0; x < COLS; x++) cycle.push({ x, y: 0 });
  for (let y = 1; y < ROWS; y++) cycle.push({ x: COLS - 1, y });
  for (let x = COLS - 2; x >= 0; x--) cycle.push({ x, y: ROWS - 1 });
  for (let y = ROWS - 2; y > 0; y--) cycle.push({ x: 0, y });
  
  return cycle;
};

// Find path on border between two positions (along the cycle)
const findBorderPath = (from: Position, to: Position): Position[] => {
  const cycle = getBorderCycleOrdered();
  const fromIdx = cycle.findIndex(p => p.x === from.x && p.y === from.y);
  const toIdx = cycle.findIndex(p => p.x === to.x && p.y === to.y);
  
  if (fromIdx === -1 || toIdx === -1) return [];
  
  const n = cycle.length;
  const path1: Position[] = [];
  const path2: Position[] = [];
  
  // Clockwise path
  for (let i = fromIdx; ; i = (i + 1) % n) {
    path1.push(cycle[i]);
    if (i === toIdx) break;
  }
  
  // Counter-clockwise path
  for (let i = fromIdx; ; i = (i - 1 + n) % n) {
    path2.push(cycle[i]);
    if (i === toIdx) break;
  }
  
  return path1.length <= path2.length ? path1 : path2;
};

// === Pattern + simultaneous-move defense (no teleporting) =====================

// Interior configurations come in 4 residue classes.
// We model the paper's “restore configuration via border patchwork” as:
// after each attack we move (simultaneously) to the interior residue class that
// contains the attacked vertex, while keeping the entire border guarded.
const interiorResidue = (p: Position): number => ((p.x + 2 * p.y) % 4 + 4) % 4;

const getInteriorPatternByResidue = (r: number): Set<string> => {
  const pattern = new Set<string>();
  for (let x = 1; x < COLS - 1; x++) {
    for (let y = 2; y < ROWS - 2; y++) {
      if (interiorResidue({ x, y }) === r) pattern.add(posKey({ x, y }));
    }
  }
  return pattern;
};

const getAllBorderKeys = (): Set<string> => {
  const border = new Set<string>();
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (isBorder(x, y)) border.add(posKey({ x, y }));
    }
  }
  return border;
};

const BORDER_KEYS = getAllBorderKeys();

const getTargetGuardsForResidue = (r: number): Set<string> => {
  const target = new Set<string>(BORDER_KEYS);
  for (const k of getInteriorPatternByResidue(r)) target.add(k);
  return target;
};

const inferCurrentInteriorResidue = (guards: Set<string>): number => {
  for (const k of guards) {
    const p = parseKey(k);
    if (isInterior(p.x, p.y)) return interiorResidue(p);
  }
  // Should never happen (we always have interior guards), but default safely.
  return 0;
};

// Hopcroft–Karp for perfect matching in the “guards → target cells” bipartite graph.
// Left: current guard indices. Right: target indices.
const hopcroftKarp = (adj: number[][], leftSize: number, rightSize: number) => {
  const NIL = -1;
  const pairU = new Array<number>(leftSize).fill(NIL);
  const pairV = new Array<number>(rightSize).fill(NIL);
  const dist = new Array<number>(leftSize).fill(0);

  const bfs = (): boolean => {
    const q: number[] = [];
    for (let u = 0; u < leftSize; u++) {
      if (pairU[u] === NIL) {
        dist[u] = 0;
        q.push(u);
      } else {
        dist[u] = Number.POSITIVE_INFINITY;
      }
    }

    let foundFreeVertex = false;

    while (q.length) {
      const u = q.shift()!;
      for (const v of adj[u]) {
        const u2 = pairV[v];
        if (u2 !== NIL) {
          if (dist[u2] === Number.POSITIVE_INFINITY) {
            dist[u2] = dist[u] + 1;
            q.push(u2);
          }
        } else {
          foundFreeVertex = true;
        }
      }
    }

    return foundFreeVertex;
  };

  const dfs = (u: number): boolean => {
    for (const v of adj[u]) {
      const u2 = pairV[v];
      if (u2 === NIL || (dist[u2] === dist[u] + 1 && dfs(u2))) {
        pairU[u] = v;
        pairV[v] = u;
        return true;
      }
    }
    dist[u] = Number.POSITIVE_INFINITY;
    return false;
  };

  let matching = 0;
  while (bfs()) {
    for (let u = 0; u < leftSize; u++) {
      if (pairU[u] === NIL && dfs(u)) matching++;
    }
  }

  return { matching, pairU };
};

// Defense = one simultaneous move of all guards (each guard moves at most 1 step).
// We compute the intended post-defense configuration (target) and then find a
// perfect matching that assigns each current guard to a unique reachable target.
const defendAttack = (
  guards: Set<string>,
  attack: Position
): {
  newGuards: Set<string>;
  movements: Movement[];
} | null => {
  const attackKey = posKey(attack);

  if (guards.has(attackKey)) {
    return { newGuards: guards, movements: [] };
  }

  // Must be defendable: some guard adjacent to v_t.
  const neighbors = getHexNeighbors(attack.x, attack.y);
  if (!neighbors.some((p) => guards.has(posKey(p)))) return null;

  const currentResidue = inferCurrentInteriorResidue(guards);
  const targetResidue = interiorResidue(attack);

  // Target config: same “family” of configuration, but switch residue class so that
  // the attacked vertex becomes a guard position again.
  const target = getTargetGuardsForResidue(targetResidue);
  if (!target.has(attackKey)) {
    // Should never happen by construction.
    return null;
  }

  // Build bipartite graph: each guard can go to {self ∪ hex-neighbors} ∩ target.
  const fromKeys = Array.from(guards);
  const toKeys = Array.from(target);

  if (fromKeys.length !== toKeys.length) return null;

  const toIndex = new Map<string, number>();
  for (let i = 0; i < toKeys.length; i++) toIndex.set(toKeys[i], i);

  const adj: number[][] = new Array(fromKeys.length);
  for (let i = 0; i < fromKeys.length; i++) {
    const from = parseKey(fromKeys[i]);
    const reachable: string[] = [posKey(from), ...getHexNeighbors(from.x, from.y).map(posKey)];

    const edges: number[] = [];
    for (const k of reachable) {
      const idx = toIndex.get(k);
      if (idx !== undefined) edges.push(idx);
    }

    // Deterministic order helps keep the visual behavior stable.
    edges.sort((a, b) => a - b);
    adj[i] = edges;
  }

  const { matching, pairU } = hopcroftKarp(adj, fromKeys.length, toKeys.length);
  if (matching !== fromKeys.length) return null;

  const movements: Movement[] = [];
  for (let u = 0; u < fromKeys.length; u++) {
    const v = pairU[u];
    if (v === -1) return null;
    const from = parseKey(fromKeys[u]);
    const to = parseKey(toKeys[v]);
    if (from.x !== to.x || from.y !== to.y) {
      const fromBorder = isBorder(from.x, from.y);
      const toBorder = isBorder(to.x, to.y);

      let type: Movement['type'] = 'interior';
      if (fromBorder && !toBorder) type = 'toInterior';
      else if (!fromBorder && toBorder) type = 'toBorder';
      else if (fromBorder && toBorder) type = 'pathShift';

      movements.push({ from, to, type });
    }
  }

  // Safety invariants: no creation / no disappearance.
  if (target.size !== guards.size) return null;

  // Theorem-backed invariant: target configuration is dominating.
  // If our modeling is wrong, fail loudly rather than “teleport”.
  if (!isFullyDominated(target)) return null;

  // Additional sanity: everybody moved at most one step.
  // (This should be guaranteed by the edge construction.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = currentResidue;

  return { newGuards: target, movements };
};


interface EternalDominationGameProps {
}

const EternalDominationGame: React.FC<EternalDominationGameProps> = () => {
  const [guards, setGuards] = useState<Set<string>>(generateInitialGuards);
  const [attackHistory, setAttackHistory] = useState<Position[]>([]);
  const [message, setMessage] = useState<string>("Click any unguarded cell to attack.");
  const [moveCount, setMoveCount] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [lastMovements, setLastMovements] = useState<Movement[]>([]);

  const [pendingDefense, setPendingDefense] = useState<{
    endGuards: Set<string>;
    movements: Movement[];
    summary: { interiorMoves: number; borderIn: number; borderOut: number; pathShifts: number };
  } | null>(null);
  const [activeMoveIdx, setActiveMoveIdx] = useState<number>(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeMove =
    pendingDefense && activeMoveIdx >= 0 && activeMoveIdx < pendingDefense.movements.length
      ? pendingDefense.movements[activeMoveIdx]
      : null;

  useEffect(() => {
    if (!pendingDefense) return;

    // No moves? Apply immediately.
    if (pendingDefense.movements.length === 0) {
      setGuards(pendingDefense.endGuards);
      setPendingDefense(null);
      setActiveMoveIdx(-1);
      return;
    }

    if (activeMoveIdx >= pendingDefense.movements.length) {
      // Finish: apply the simultaneous move.
      setGuards(pendingDefense.endGuards);
      setLastMovements(pendingDefense.movements);

      const { interiorMoves, borderIn, pathShifts } = pendingDefense.summary;
      let desc = `Defended! Interior shifts: ${interiorMoves}`;
      if (borderIn > 0) desc += `, w→u: ${borderIn}`;
      if (pathShifts > 0) desc += `, path shifts: ${pathShifts}`;
      setMessage(desc);

      setPendingDefense(null);
      setActiveMoveIdx(-1);
      return;
    }

    // Show one movement at a time (visualizing a simultaneous sweep).
    setLastMovements([pendingDefense.movements[activeMoveIdx]]);
    setMessage(`Defending… step ${activeMoveIdx + 1}/${pendingDefense.movements.length}`);

    timerRef.current = setTimeout(() => {
      setActiveMoveIdx((i) => i + 1);
    }, 220);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingDefense, activeMoveIdx]);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (pendingDefense) return; // ignore clicks during animation

      const attack: Position = { x, y };

      if (guards.has(posKey(attack))) {
        setMessage("Cannot attack a guarded position.");
        return;
      }

      const result = defendAttack(guards, attack);

      if (!result) {
        setMessage("Cannot defend under the rules (no legal simultaneous move found). ");
        return;
      }

      const interiorMoves = result.movements.filter((m) => m.type === "interior").length;
      const borderIn = result.movements.filter((m) => m.type === "toInterior").length;
      const borderOut = result.movements.filter((m) => m.type === "toBorder").length;
      const pathShifts = result.movements.filter((m) => m.type === "pathShift").length;

      setAttackHistory((prev) => [...prev, attack]);
      setMoveCount((prev) => prev + 1);

      setPendingDefense({
        endGuards: result.newGuards,
        movements: result.movements,
        summary: { interiorMoves, borderIn, borderOut, pathShifts },
      });
      setActiveMoveIdx(0);
    },
    [guards, pendingDefense]
  );

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPendingDefense(null);
    setActiveMoveIdx(-1);

    setGuards(generateInitialGuards());
    setAttackHistory([]);
    setLastMovements([]);
    setMessage("Click any unguarded cell to attack.");
    setMoveCount(0);
  }, []);

  const guardCount = guards.size;
  const interiorGuards = Array.from(guards).filter((k) => {
    const p = parseKey(k);
    return isInterior(p.x, p.y);
  }).length;
  const borderGuards = guardCount - interiorGuards;

  const cellW = 44;
  const cellH = 40;
  const offset = cellW / 2;

  // Color mapping for movement types
  const getMovementColor = (type: string) => {
    switch (type) {
      case 'interior': return '#ef4444';     // Red - interior chain shift
      case 'toInterior': return '#06b6d4';   // Cyan - w₃→u₃ (border to interior)
      case 'toBorder': return '#f97316';     // Orange - u₁→w₁ (interior to border)
      case 'pathShift': return '#22c55e';    // Green - complementary path shift
      default: return '#888';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Eternal Domination (Figure 10)
          </CardTitle>
          <CardDescription>
            10×12 grid with double-layer border — defense via interior chains and complementary path shifts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">Guards: {guardCount}</Badge>
              <Badge className="bg-cyan-600/80">Border: {borderGuards}</Badge>
              <Badge className="bg-red-600/80">Interior: {interiorGuards}</Badge>
              <Badge variant="outline">Attacks: {moveCount}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowInfo(!showInfo)}>
                <Info className="w-4 h-4 mr-1" />
                Info
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
          
          {showInfo && (
            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <p><strong>Figure 10 Defense Strategy:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="text-red-500 font-medium">Red arrows:</span> Interior guards shift in chains toward attack (v_t)</li>
                <li><span className="text-orange-500 font-medium">Orange:</span> Interior guard pushed to border (u₁→w₁, u₂→w₂)</li>
                <li><span className="text-cyan-500 font-medium">Cyan:</span> Border guard enters interior (w₃→u₃, w₄→u₄)</li>
                <li><span className="text-green-500 font-medium">Green arrows:</span> Complementary path shifts (P₁,₃ and P₂,₄) restore border</li>
              </ul>
            </div>
          )}

          <div className="p-3 rounded-md bg-muted/50 text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary flex-shrink-0" />
            {message}
          </div>

          {/* Grid */}
          <div className="flex justify-center overflow-x-auto pb-4">
            <div 
              className="relative"
              style={{ 
                width: COLS * cellW + offset + 20,
                height: ROWS * cellH + 20
              }}
            >
              <svg 
                className="absolute inset-0 pointer-events-none"
                width={COLS * cellW + offset + 20}
                height={ROWS * cellH + 20}
              >
                {/* Edges */}
                {Array.from({ length: ROWS }, (_, y) =>
                  Array.from({ length: COLS }, (_, x) => {
                    const rowOffset = y % 2 === 1 ? offset : 0;
                    const cx = x * cellW + cellW / 2 + rowOffset + 10;
                    const cy = y * cellH + cellH / 2 + 10;
                    
                    return getHexNeighbors(x, y)
                      .filter(n => n.x > x || (n.x === x && n.y > y))
                      .map((nb, i) => {
                        const nbOffset = nb.y % 2 === 1 ? offset : 0;
                        const ncx = nb.x * cellW + cellW / 2 + nbOffset + 10;
                        const ncy = nb.y * cellH + cellH / 2 + 10;
                        
                        const isBorderEdge = isBorder(x, y) && isBorder(nb.x, nb.y);
                        
                        return (
                          <line
                            key={`${x}-${y}-${i}`}
                            x1={cx} y1={cy} x2={ncx} y2={ncy}
                            stroke={isBorderEdge ? "#22c55e" : "currentColor"}
                            strokeOpacity={isBorderEdge ? 0.6 : 0.15}
                            strokeWidth={isBorderEdge ? 2 : 1}
                          />
                        );
                      });
                  })
                )}
                
                {/* Movement arrows */}
                {lastMovements.map((move, i) => {
                  const fromOff = move.from.y % 2 === 1 ? offset : 0;
                  const toOff = move.to.y % 2 === 1 ? offset : 0;
                  const x1 = move.from.x * cellW + cellW / 2 + fromOff + 10;
                  const y1 = move.from.y * cellH + cellH / 2 + 10;
                  const x2 = move.to.x * cellW + cellW / 2 + toOff + 10;
                  const y2 = move.to.y * cellH + cellH / 2 + 10;
                  
                  const color = getMovementColor(move.type);
                  
                  return (
                    <line
                      key={`mv-${i}`}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={color}
                      strokeWidth={3}
                      strokeOpacity={0.9}
                      markerEnd={`url(#arrow-${move.type})`}
                    />
                  );
                })}
                
                <defs>
                  <marker id="arrow-interior" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
                  </marker>
                  <marker id="arrow-toInterior" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" />
                  </marker>
                  <marker id="arrow-toBorder" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
                  </marker>
                  <marker id="arrow-pathShift" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
                  </marker>
                </defs>
              </svg>

              {/* Cells */}
              {Array.from({ length: ROWS }, (_, y) =>
                Array.from({ length: COLS }, (_, x) => {
                  const rowOffset = y % 2 === 1 ? offset : 0;
                  const hasGuard = guards.has(posKey({ x, y }));
                  const onBorder = isBorder(x, y);
                  const dominated = isDominated(x, y, guards);
                  
                  let bgClass = "bg-muted/60 hover:bg-muted";
                  if (hasGuard) {
                    bgClass = onBorder 
                      ? "bg-cyan-500/60 border-cyan-600" 
                      : "bg-red-500/60 border-red-600";
                  } else if (!dominated) {
                    bgClass = "bg-destructive/60 border-destructive";
                  }
                  
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`absolute w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm cursor-pointer transition-colors ${bgClass}`}
                      style={{
                        left: x * cellW + rowOffset + 10 + (cellW - 36) / 2,
                        top: y * cellH + 10 + (cellH - 36) / 2,
                      }}
                      onClick={() => handleCellClick(x, y)}
                      title={`(${x},${y})`}
                    >
                      {hasGuard && <Shield className="w-4 h-4" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-cyan-500/60 border-2 border-cyan-600 rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3" />
              </div>
              <span>Border</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500/60 border-2 border-red-600 rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3" />
              </div>
              <span>Interior</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span>Path shifts (P₁,₃/P₂,₄)</span>
            </div>
          </div>

          {attackHistory.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Attacks: </span>
              {attackHistory.slice(-8).map((pos, i) => (
                <Badge key={i} variant="outline" className="text-xs mx-0.5">
                  ({pos.x},{pos.y})
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EternalDominationGame;
