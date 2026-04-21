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
  heads: number;
  tails: number;
  fraction: number | null;
}

const MIN_RUNS = 4;
const MAX_RUNS = 100;
const DEFAULT_RUNS = 36;
const TICK_MS = 110;
const MAX_TOSSES_PER_RUN = 1000; // safety cap; first-passage time has infinite expectation

function emptyRun(): Run {
  return { sequence: [], stopped: false, heads: 0, tails: 0, fraction: null };
}

function stepRun(r: Run): Run {
  if (r.stopped) return r;
  const toss: Toss = Math.random() < 0.5 ? 'H' : 'T';
  const heads = r.heads + (toss === 'H' ? 1 : 0);
  const tails = r.tails + (toss === 'T' ? 1 : 0);
  const sequence = [...r.sequence, toss];
  if (heads > tails) {
    return { sequence, stopped: true, heads, tails, fraction: heads / sequence.length };
  }
  if (sequence.length >= MAX_TOSSES_PER_RUN) {
    return { sequence, stopped: true, heads, tails, fraction: heads / sequence.length };
  }
  return { sequence, stopped: false, heads, tails, fraction: null };
}

const ComputingPi: React.FC = () => {
  const [n, setN] = useState(DEFAULT_RUNS);
  const [runs, setRuns] = useState<Run[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const started = runs.length > 0;
  const allStopped = started && runs.every((r) => r.stopped);

  const avgTimes4 = useMemo(() => {
    const stopped = runs.filter((r) => r.stopped && r.fraction !== null);
    if (stopped.length === 0) return null;
    const sum = stopped.reduce((acc, r) => acc + (r.fraction ?? 0), 0);
    return (sum / stopped.length) * 4;
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
              All {runs.length} runs complete. Click any tile to see its full toss sequence.
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
                toss{selectedRun.sequence.length === 1 ? '' : 'es'}. Recorded fraction:{' '}
                <span className="font-mono font-semibold">
                  {selectedRun.heads}/{selectedRun.sequence.length} ={' '}
                  {(selectedRun.fraction ?? 0).toFixed(4)}
                </span>
                .
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
  const footer = run.stopped
    ? `${run.heads}/${run.sequence.length}`
    : `${run.sequence.length}`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      aria-label={`Run ${index + 1}${run.stopped ? `, fraction ${footer}` : ''}`}
      className={`rounded-lg border px-2 py-1.5 flex flex-col gap-1 text-left transition-colors ${
        run.stopped
          ? 'bg-green-50 dark:bg-green-950/30 border-green-500/60'
          : 'bg-card border-border'
      } ${clickable ? 'cursor-pointer hover:border-primary' : 'cursor-default'}`}
    >
      <div
        className="overflow-hidden whitespace-nowrap text-right font-mono text-xs h-4 tracking-wider"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0, black 25%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 25%)',
        }}
      >
        {seq || ' '}
      </div>
      <div className="font-mono text-[11px] text-muted-foreground tabular-nums">
        {run.stopped ? footer : `${footer} toss${run.sequence.length === 1 ? '' : 'es'}`}
      </div>
    </button>
  );
};

export default ComputingPi;
