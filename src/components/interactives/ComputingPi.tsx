import { Play, RotateCcw } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

type Toss = 'H' | 'T';

interface Run {
  sequence: Toss[];
  stopped: boolean;
  discarded: boolean;
  heads: number;
  tails: number;
  fraction: number | null;
}

const MIN_RUNS = 4;
const MAX_RUNS = 100;
const DEFAULT_RUNS = 36;
const TICK_MS = 110;
const MAX_TOSSES_PER_RUN = 5000; // safety cap; first-passage time has infinite expectation
const AMBER_STEP = 500; // tosses per amber level
const AMBER_MAX_LEVEL = 9;

// Amber wash classes, pre-declared so Tailwind's JIT picks them up.
const AMBER_WASH: Record<number, string> = {
  0: '',
  1: 'bg-amber-500/10 border-amber-500/30',
  2: 'bg-amber-500/20 border-amber-500/40',
  3: 'bg-amber-500/30 border-amber-500/50',
  4: 'bg-amber-500/40 border-amber-500/60',
  5: 'bg-amber-500/50 border-amber-500/70',
  6: 'bg-amber-500/60 border-amber-500/80',
  7: 'bg-amber-500/70 border-amber-500/90',
  8: 'bg-amber-500/80 border-amber-600',
  9: 'bg-amber-500/90 border-amber-600',
};

function emptyRun(): Run {
  return { sequence: [], stopped: false, discarded: false, heads: 0, tails: 0, fraction: null };
}

function stepRun(r: Run): Run {
  if (r.stopped) return r;
  const toss: Toss = Math.random() < 0.5 ? 'H' : 'T';
  const heads = r.heads + (toss === 'H' ? 1 : 0);
  const tails = r.tails + (toss === 'T' ? 1 : 0);
  const sequence = [...r.sequence, toss];
  if (heads > tails) {
    return {
      sequence,
      stopped: true,
      discarded: false,
      heads,
      tails,
      fraction: heads / sequence.length,
    };
  }
  if (sequence.length >= MAX_TOSSES_PER_RUN) {
    // Cap hit without the walk crossing above ½ — drop this run so it doesn't bias the average.
    return { sequence, stopped: true, discarded: true, heads, tails, fraction: null };
  }
  return { sequence, stopped: false, discarded: false, heads, tails, fraction: null };
}

function amberLevel(run: Run): number {
  if (run.stopped) return 0;
  return Math.min(AMBER_MAX_LEVEL, Math.floor(run.sequence.length / AMBER_STEP));
}

const ComputingPi: React.FC = () => {
  const [n, setN] = useState(DEFAULT_RUNS);
  const [runs, setRuns] = useState<Run[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const started = runs.length > 0;
  const allStopped = started && runs.every((r) => r.stopped);
  const discardedCount = runs.filter((r) => r.discarded).length;

  const avgTimes4 = useMemo(() => {
    const usable = runs.filter((r) => r.stopped && !r.discarded && r.fraction !== null);
    if (usable.length === 0) return null;
    const sum = usable.reduce((acc, r) => acc + (r.fraction ?? 0), 0);
    return (sum / usable.length) * 4;
  }, [runs]);

  // Simulate one toss per active run on every tick.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRuns((prev) => prev.map(stepRun));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && allStopped) setRunning(false);
  }, [running, allStopped]);

  const handleStart = () => {
    setRuns(Array.from({ length: n }, emptyRun));
    setRunning(true);
    setSelectedIdx(null);
  };

  const handleReset = () => {
    setRunning(false);
    setRuns([]);
    setSelectedIdx(null);
  };

  const selectedRun = selectedIdx !== null ? runs[selectedIdx] : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Computing π from Coin Tosses</CardTitle>
          <CardDescription>
            Toss a fair coin until the number of heads first exceeds the number of tails,
            and record the fraction of heads at that moment. Repeated, the average of those
            fractions approaches <span className="font-mono">π/4</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header: slider | running avg × 4 | start/reset */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center rounded-xl border bg-muted/40 p-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Runs: <span className="font-mono">{n}</span>
              </label>
              <Slider
                min={MIN_RUNS}
                max={MAX_RUNS}
                step={1}
                value={[n]}
                onValueChange={(v) => setN(v[0])}
                disabled={started}
              />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Average × 4
              </span>
              <span className="font-mono text-3xl tabular-nums">
                {avgTimes4 !== null ? avgTimes4.toFixed(4) : '—'}
              </span>
              <span className="text-xs text-muted-foreground">
                π ≈ 3.1416
              </span>
            </div>

            <div className="flex justify-center sm:justify-end">
              {!started ? (
                <Button size="lg" onClick={handleStart}>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              ) : (
                <Button size="lg" variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Grid of runs */}
          {started ? (
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}
            >
              {runs.map((run, idx) => (
                <RunTile
                  key={idx}
                  index={idx}
                  run={run}
                  clickable={allStopped}
                  onClick={() => allStopped && setSelectedIdx(idx)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              Pick a number of runs and press <span className="font-medium">Start</span>.
            </div>
          )}

          {allStopped && (
            <p className="text-sm text-center text-muted-foreground">
              All {runs.length} runs complete
              {discardedCount > 0 && (
                <>
                  {' '}(
                  <span className="text-destructive">
                    {discardedCount} discarded after hitting the {MAX_TOSSES_PER_RUN}-toss cap
                  </span>
                  )
                </>
              )}
              . Click any tile to see its full toss sequence.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selectedIdx !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedIdx(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Run {(selectedIdx ?? 0) + 1}</DialogTitle>
            {selectedRun && (
              <DialogDescription>
                <span className="font-mono">{selectedRun.heads}</span> heads,{' '}
                <span className="font-mono">{selectedRun.tails}</span> tails in{' '}
                <span className="font-mono">{selectedRun.sequence.length}</span>{' '}
                toss{selectedRun.sequence.length === 1 ? '' : 'es'}.{' '}
                {selectedRun.discarded ? (
                  <span className="text-destructive">
                    Discarded: hit the {MAX_TOSSES_PER_RUN}-toss cap without heads ever exceeding tails.
                  </span>
                ) : (
                  <>
                    Recorded fraction:{' '}
                    <span className="font-mono font-semibold">
                      {selectedRun.heads}/{selectedRun.sequence.length} ={' '}
                      {(selectedRun.fraction ?? 0).toFixed(4)}
                    </span>
                    .
                  </>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedRun && (
            <div className="font-mono text-sm break-all bg-muted p-3 rounded-lg max-h-64 overflow-y-auto leading-6 tracking-wider">
              {selectedRun.sequence.join('')}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface RunTileProps {
  index: number;
  run: Run;
  clickable: boolean;
  onClick: () => void;
}

const RunTile: React.FC<RunTileProps> = ({ index, run, clickable, onClick }) => {
  const seq = run.sequence.join('');
  const settledClass = run.discarded
    ? 'bg-red-50 dark:bg-red-950/30 border-red-500/60'
    : run.stopped
      ? 'bg-green-50 dark:bg-green-950/30 border-green-500/60'
      : AMBER_WASH[amberLevel(run)] || 'bg-card border-border';
  const footer = run.discarded
    ? 'discarded'
    : run.stopped
      ? `${run.heads}/${run.sequence.length}`
      : `${run.sequence.length} toss${run.sequence.length === 1 ? '' : 'es'}`;
  const aria = run.discarded
    ? `Run ${index + 1}, discarded (cap)`
    : run.stopped
      ? `Run ${index + 1}, fraction ${run.heads}/${run.sequence.length}`
      : `Run ${index + 1}, in progress (${run.sequence.length} tosses)`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      aria-label={aria}
      className={`rounded-lg border overflow-hidden flex flex-col text-left transition-colors ${settledClass} ${
        clickable ? 'cursor-pointer hover:border-primary' : 'cursor-default'
      }`}
    >
      {/* H / T counters with a fraction indicator dot — position = H/N,
          midpoint = H=T, so the dot crosses the middle exactly when the run stops. */}
      <div className="relative flex justify-between items-center text-[10px] font-mono tabular-nums bg-black/5 dark:bg-white/5 px-2 py-0.5 text-muted-foreground">
        <span>H:{run.heads}</span>
        <span>T:{run.tails}</span>
        {run.sequence.length > 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-foreground"
            style={{ left: `${(run.heads / run.sequence.length) * 100}%` }}
          />
        )}
      </div>

      {/* Billboard + footer */}
      <div className="flex flex-col gap-1 px-2 py-1.5 flex-1">
        <div
          className="overflow-hidden whitespace-nowrap text-right font-mono text-xs h-4 tracking-wider"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0, black 25%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 25%)',
          }}
        >
          {seq || ' '}
        </div>
        <div
          className={`font-mono text-[11px] tabular-nums ${
            run.discarded ? 'text-destructive italic' : 'text-muted-foreground'
          }`}
        >
          {footer}
        </div>
      </div>
    </button>
  );
};

export default ComputingPi;
