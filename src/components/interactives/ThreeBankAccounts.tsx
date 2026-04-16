import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import confetti from 'canvas-confetti';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

function tex(expr: string): string {
  return katex.renderToString(expr, { throwOnError: false });
}

function toBin(n: number): string {
  return n.toString(2);
}

const ACCOUNT_LABELS = ['A', 'B', 'C'] as const;
type AccountLabel = (typeof ACCOUNT_LABELS)[number];

const RANK_COLORS = {
  MIN: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    border: 'border-green-500',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-500 text-white',
    inlineText: 'text-green-700 dark:text-green-400',
  },
  MID: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    border: 'border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500 text-white',
    inlineText: 'text-amber-700 dark:text-amber-400',
  },
  MAX: {
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    border: 'border-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-500 text-white',
    inlineText: 'text-rose-700 dark:text-rose-400',
  },
} as const;

type RankLabel = 'MIN' | 'MID' | 'MAX' | 'TIE';

const TIE_COLORS = {
  bg: 'bg-purple-100 dark:bg-purple-900/40',
  border: 'border-purple-500',
  text: 'text-purple-700 dark:text-purple-300',
  badge: 'bg-purple-500 text-white',
  inlineText: 'text-purple-700 dark:text-purple-400',
};

function getRanks(balances: [number, number, number]): [RankLabel, RankLabel, RankLabel] {
  const [a, b, c] = balances;
  const indices = [0, 1, 2].sort((x, y) => balances[x] - balances[y]);
  const sorted = [balances[indices[0]], balances[indices[1]], balances[indices[2]]];

  const ranks: [RankLabel, RankLabel, RankLabel] = ['MIN', 'MIN', 'MIN'];

  if (sorted[0] === sorted[1] && sorted[1] === sorted[2]) {
    // All three equal
    ranks[0] = ranks[1] = ranks[2] = 'TIE';
  } else if (sorted[0] === sorted[1]) {
    // Two smallest are tied
    ranks[indices[0]] = 'TIE';
    ranks[indices[1]] = 'TIE';
    ranks[indices[2]] = 'MAX';
  } else if (sorted[1] === sorted[2]) {
    // Two largest are tied
    ranks[indices[0]] = 'MIN';
    ranks[indices[1]] = 'TIE';
    ranks[indices[2]] = 'TIE';
  } else {
    ranks[indices[0]] = 'MIN';
    ranks[indices[1]] = 'MID';
    ranks[indices[2]] = 'MAX';
  }
  return ranks;
}

function hasEquality(balances: [number, number, number]): boolean {
  return (
    balances[0] === balances[1] ||
    balances[1] === balances[2] ||
    balances[0] === balances[2]
  );
}

function RankText({ rank, colorEnabled }: { rank: RankLabel; colorEnabled: boolean }) {
  const color = rank === 'TIE' ? TIE_COLORS.inlineText : RANK_COLORS[rank as keyof typeof RANK_COLORS]?.inlineText || '';
  if (colorEnabled) {
    return <span className={`font-bold ${color}`}>{rank}</span>;
  }
  return <span className="font-bold">{rank}</span>;
}

interface Transfer {
  from: number;
  to: number;
  amount: number;
}

interface GameState {
  balances: [number, number, number];
  history: Transfer[];
}

function getLegalTransfers(balances: [number, number, number]): Transfer[] {
  const transfers: Transfer[] = [];
  for (let from = 0; from < 3; from++) {
    for (let to = 0; to < 3; to++) {
      if (from === to) continue;
      if (balances[from] >= balances[to] && balances[to] > 0) {
        transfers.push({ from, to, amount: balances[to] });
      }
    }
  }
  return transfers;
}

function applyTransfer(
  balances: [number, number, number],
  transfer: Transfer
): [number, number, number] {
  const next: [number, number, number] = [...balances];
  next[transfer.from] -= transfer.amount;
  next[transfer.to] += transfer.amount;
  return next;
}

function hasWon(balances: [number, number, number]): number | null {
  for (let i = 0; i < 3; i++) {
    if (balances[i] === 0) return i;
  }
  return null;
}

// T8: Game is "done" if any account is 0 OR any two are equal (for Play/Explore)
function isGameDone(balances: [number, number, number]): boolean {
  return hasWon(balances) !== null || hasEquality(balances);
}

function getEqualPair(balances: [number, number, number]): [number, number] | null {
  if (balances[0] === balances[1]) return [0, 1];
  if (balances[0] === balances[2]) return [0, 2];
  if (balances[1] === balances[2]) return [1, 2];
  return null;
}

// ─── Solution algorithm ─────────────────────────────────────────────────────

interface SolutionStep {
  balances: [number, number, number];
  sorted: [number, number, number];
  sortedLabels: [string, string, string];
  /** Labels fixed at start of iteration */
  iterationLabels?: [string, string, string]; // [MIN, MID, MAX]
  transfer?: { from: string; to: string; fromAccount: string; toAccount: string; amount: number; bit: number; bitIndex: number; totalBits: number };
  q?: number;
  qBits?: number[]; // LSB first
  r?: number;
  iteration?: number;
}

function computeSolution(initial: [number, number, number]): SolutionStep[] {
  const steps: SolutionStep[] = [];
  let balances: [number, number, number] = [...initial];

  if (balances.some((b) => b === 0)) {
    steps.push({
      balances: [...balances],
      sorted: [...balances].sort((a, b) => a - b) as [number, number, number],
      sortedLabels: getSortedLabels(balances),
    });
    return steps;
  }

  let iteration = 0;
  const maxSteps = 10000;
  let totalSteps = 0;

  while (!balances.some((b) => b === 0) && totalSteps < maxSteps) {
    iteration++;
    const indices = [0, 1, 2].sort((a, b) => balances[a] - balances[b]);
    const L = balances[indices[0]];
    const M = balances[indices[1]];
    const q = Math.floor(M / L);
    const r = M % L;

    // Fix the roles for this iteration
    const idxSmallest = indices[0];
    const idxMiddle = indices[1];
    const idxLargest = indices[2];
    const iterationLabels: [string, string, string] = [
      ACCOUNT_LABELS[idxSmallest],
      ACCOUNT_LABELS[idxMiddle],
      ACCOUNT_LABELS[idxLargest],
    ];

    const bits = toBin(q).split('').map(Number).reverse(); // LSB first

    steps.push({
      balances: [...balances],
      sorted: [balances[indices[0]], balances[indices[1]], balances[indices[2]]],
      sortedLabels: [ACCOUNT_LABELS[indices[0]], ACCOUNT_LABELS[indices[1]], ACCOUNT_LABELS[indices[2]]],
      iterationLabels,
      q, qBits: bits, r, iteration,
    });

    // Process bits from LSB to MSB: a_0, a_1, ..., a_k
    // Each transfer doubles the smallest account. Source is middle (bit=1) or largest (bit=0).
    for (let bitIdx = 0; bitIdx < bits.length; bitIdx++) {
      const bit = bits[bitIdx];
      if (balances.some((b) => b === 0) || totalSteps >= maxSteps) break;

      const amount = balances[idxSmallest];
      if (amount === 0) break;
      const from = bit === 1 ? idxMiddle : idxLargest;

      if (balances[from] < amount) break;

      const transfer = { from, to: idxSmallest, amount };
      balances = applyTransfer(balances, transfer);
      totalSteps++;

      steps.push({
        balances: [...balances],
        sorted: [...balances].sort((a, b) => a - b) as [number, number, number],
        sortedLabels: getSortedLabels(balances),
        iterationLabels,
        transfer: {
          from: ACCOUNT_LABELS[from],
          to: ACCOUNT_LABELS[idxSmallest],
          fromAccount: ACCOUNT_LABELS[from],
          toAccount: ACCOUNT_LABELS[idxSmallest],
          amount,
          bit,
          bitIndex: bitIdx,
          totalBits: bits.length,
        },
        q, qBits: bits, r, iteration,
      });
    }
  }
  return steps;
}

function getSortedLabels(balances: [number, number, number]): [string, string, string] {
  const indices = [0, 1, 2].sort((a, b) => balances[a] - balances[b]);
  return [ACCOUNT_LABELS[indices[0]], ACCOUNT_LABELS[indices[1]], ACCOUNT_LABELS[indices[2]]];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function AccountCard({
  label, balance, rank, showBinary, className = '',
}: {
  label: AccountLabel; balance: number; rank: RankLabel; showBinary?: boolean; className?: string;
}) {
  const colors = rank === 'TIE' ? TIE_COLORS : RANK_COLORS[rank as keyof typeof RANK_COLORS];
  return (
    <Card className={`${colors.bg} ${colors.border} border-2 transition-all duration-500 ${className}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="flex items-center justify-between text-base">
          <span className={`font-bold ${colors.text}`}>Account {label}</span>
          <Badge className={`${colors.badge} text-xs`}>{rank}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className={`text-3xl font-bold ${colors.text} transition-all duration-300`}
          style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
          ${balance.toLocaleString()}
        </div>
        {showBinary && balance > 0 && (
          <div className="text-xs text-muted-foreground mt-1 font-mono">bin: {toBin(balance)}</div>
        )}
      </CardContent>
    </Card>
  );
}

// T7: Animated sorted cards — uses a key based on sort order to trigger re-mount animation
function SortedAccountCards({ balances, showBinary }: { balances: [number, number, number]; showBinary?: boolean }) {
  const ranks = getRanks(balances);
  const sortedIndices = [0, 1, 2].sort((a, b) => balances[a] - balances[b]);
  const sortKey = sortedIndices.join('-');
  const [animating, setAnimating] = useState(false);
  const prevSortKey = useRef(sortKey);

  useEffect(() => {
    if (prevSortKey.current !== sortKey) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 500);
      prevSortKey.current = sortKey;
      return () => clearTimeout(timer);
    }
  }, [sortKey]);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-500 ${animating ? 'scale-[0.98] opacity-90' : ''}`}>
      {sortedIndices.map((i) => (
        <AccountCard key={ACCOUNT_LABELS[i]} label={ACCOUNT_LABELS[i]}
          balance={balances[i]} rank={ranks[i]} showBinary={showBinary}
          className={animating ? 'animate-pulse' : ''} />
      ))}
    </div>
  );
}

function BalanceInput({ label, value, onChange }: { label: AccountLabel; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="font-semibold w-6">{label}</Label>
      <Input type="number" min={0} max={10000} value={value}
        onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 0 && v <= 10000) onChange(v); }}
        className="w-24 font-mono" />
    </div>
  );
}

function PresetPicker({ initialBalances, setInitial }: { initialBalances: [number, number, number]; setInitial: (vals: [number, number, number]) => void }) {
  const randomPreset = () => {
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 50) + 1;
    const c = Math.floor(Math.random() * 50) + 1;
    setInitial([a, b, c]);
  };
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <BalanceInput label="A" value={initialBalances[0]} onChange={(v) => setInitial([v, initialBalances[1], initialBalances[2]])} />
          <BalanceInput label="B" value={initialBalances[1]} onChange={(v) => setInitial([initialBalances[0], v, initialBalances[2]])} />
          <BalanceInput label="C" value={initialBalances[2]} onChange={(v) => setInitial([initialBalances[0], initialBalances[1], v])} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setInitial([5, 8, 11])}>Easy (5, 8, 11)</Button>
          <Button variant="outline" size="sm" onClick={() => setInitial([4, 8, 13])}>Medium (4, 8, 13)</Button>
          <Button variant="outline" size="sm" onClick={() => setInitial([17, 23, 41])}>Hard (17, 23, 41)</Button>
          <Button variant="outline" size="sm" onClick={randomPreset}>Random</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// T9: Color-coded transfer button
function TransferButton({
  transfer, balances, onTransfer, colorText,
}: {
  transfer: Transfer; balances: [number, number, number]; onTransfer: (t: Transfer) => void; colorText: boolean;
}) {
  const ranks = getRanks(balances);
  const fromRank = ranks[transfer.from];
  const toRank = ranks[transfer.to];
  const fromLabel = ACCOUNT_LABELS[transfer.from];
  const toLabel = ACCOUNT_LABELS[transfer.to];

  return (
    <Button variant="outline" size="sm"
      className="justify-start text-left h-auto py-2 whitespace-normal"
      onClick={() => onTransfer(transfer)}>
      Transfer ${transfer.amount} from <RankText rank={fromRank} colorEnabled={colorText} /> ({fromLabel}) &rarr; <RankText rank={toRank} colorEnabled={colorText} /> ({toLabel})
      <span className="text-muted-foreground ml-1">
        (doubles <RankText rank={toRank} colorEnabled={colorText} /> to ${balances[transfer.to] * 2})
      </span>
    </Button>
  );
}

function ColorToggle({ colorText, setColorText, balances, fixedLabels }: {
  colorText: boolean;
  setColorText: (v: boolean) => void;
  balances?: [number, number, number];
  /** Override labels for solution tab — uses iteration's fixed MIN/MID/MAX assignments */
  fixedLabels?: [string, string, string];
}) {
  const ranks = balances ? getRanks(balances) : null;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Switch id="color-toggle" checked={colorText} onCheckedChange={setColorText} />
        <Label htmlFor="color-toggle" className="text-xs text-muted-foreground cursor-pointer">
          Color-coded labels
        </Label>
      </div>
      {fixedLabels ? (
        /* T22: Solution tab shows iteration's fixed labels */
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
          {(['MIN', 'MID', 'MAX'] as const).map((rank, i) => {
            const rc = RANK_COLORS[rank];
            return (
              <span key={rank} className={colorText ? rc.inlineText : ''}>
                <span className="font-bold">{rank}</span>={fixedLabels[i]}
              </span>
            );
          })}
        </div>
      ) : ranks && balances ? (
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
          {ACCOUNT_LABELS.map((label, i) => {
            const rank = ranks[i];
            const rc = rank === 'TIE' ? TIE_COLORS : RANK_COLORS[rank as keyof typeof RANK_COLORS];
            return (
              <span key={label} className={colorText ? rc.inlineText : ''}>
                <span className="font-bold">{rank}</span>={label}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// T8: Game-over message for equality
function GameDoneMessage({ balances, history }: { balances: [number, number, number]; history: Transfer[] }) {
  const wonIdx = hasWon(balances);
  if (wonIdx !== null) {
    return (
      <div className="text-center p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-500 text-green-800 dark:text-green-200 font-semibold text-lg">
        You emptied account {ACCOUNT_LABELS[wonIdx]} in {history.length}{' '}
        move{history.length !== 1 ? 's' : ''}!
      </div>
    );
  }
  const pair = getEqualPair(balances);
  if (pair) {
    return (
      <div className="text-center p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-500 text-blue-800 dark:text-blue-200 font-semibold text-lg">
        Accounts {ACCOUNT_LABELS[pair[0]]} and {ACCOUNT_LABELS[pair[1]]} are equal (${balances[pair[0]]}) after {history.length}{' '}
        move{history.length !== 1 ? 's' : ''}! From here, one transfer empties an account.
      </div>
    );
  }
  return null;
}

// ─── Play Tab ───────────────────────────────────────────────────────────────

function PlayTab({ onSwitchTab }: { onSwitchTab: (tab: string) => void }) {
  const [initialBalances, setInitialBalances] = useState<[number, number, number]>([5, 8, 11]);
  const [state, setState] = useState<GameState>({ balances: [5, 8, 11], history: [] });
  const [done, setDone] = useState(false);
  const [colorText, setColorText] = useState(true);

  const setInitial = useCallback((vals: [number, number, number]) => {
    setInitialBalances(vals);
    setState({ balances: vals, history: [] });
    setDone(false);
  }, []);

  const doTransfer = useCallback(
    (transfer: Transfer) => {
      if (done) return;
      const newBalances = applyTransfer(state.balances, transfer);
      const newHistory = [...state.history, transfer];
      setState({ balances: newBalances, history: newHistory });
      if (hasWon(newBalances) !== null) {
        setDone(true);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
    },
    [state, done]
  );

  const undo = useCallback(() => {
    if (state.history.length === 0) return;
    const newHistory = state.history.slice(0, -1);
    let balances: [number, number, number] = [...initialBalances];
    for (const t of newHistory) balances = applyTransfer(balances, t);
    setState({ balances, history: newHistory });
    setDone(hasWon(balances) !== null);
  }, [state, initialBalances]);

  const reset = useCallback(() => {
    setState({ balances: [...initialBalances], history: [] });
    setDone(false);
  }, [initialBalances]);

  // T24: When there's a tie, only show transfers between the tied accounts
  const legalTransfers = useMemo(() => {
    if (done) return [];
    let transfers = getLegalTransfers(state.balances);
    const pair = getEqualPair(state.balances);
    if (pair) {
      transfers = transfers.filter(
        (t) => pair.includes(t.from) && pair.includes(t.to)
      );
    }
    return transfers;
  }, [state.balances, done]
  );

  const alreadyZero = initialBalances.some((b) => b === 0);

  return (
    <div className="space-y-6">
      <PresetPicker initialBalances={initialBalances} setInitial={setInitial} />
      <ColorToggle colorText={colorText} setColorText={setColorText} />

      {alreadyZero && (
        <div className="text-sm text-muted-foreground italic">One account is already at $0 — nothing to do!</div>
      )}

      <SortedAccountCards balances={state.balances} />

      {done && <GameDoneMessage balances={state.balances} history={state.history} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Available Transfers</h3>
          {legalTransfers.length === 0 && !done && !alreadyZero && (
            <p className="text-sm text-muted-foreground">No legal transfers available.</p>
          )}
          <div className="flex flex-col gap-2">
            {legalTransfers.map((t, i) => (
              <TransferButton key={i} transfer={t} balances={state.balances} onTransfer={doTransfer} colorText={colorText} />
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={state.history.length === 0}>Undo</Button>
            <Button variant="outline" size="sm" onClick={reset}>Reset</Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Transfer Log ({state.history.length} move{state.history.length !== 1 ? 's' : ''})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-1 text-sm font-mono">
            {state.history.length === 0 && <p className="text-muted-foreground text-sm">No transfers yet.</p>}
            {state.history.map((t, i) => (
              <div key={i} className="text-muted-foreground">
                <span className="text-foreground font-medium">#{i + 1}</span>{' '}
                ${t.amount}: {ACCOUNT_LABELS[t.from]} &rarr; {ACCOUNT_LABELS[t.to]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <button className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
          onClick={() => onSwitchTab('explore')}>
          Stuck? See the solution &rarr;
        </button>
      </div>
    </div>
  );
}

// ─── Explore Tab ────────────────────────────────────────────────────────────

function ExploreTab() {
  const [initialBalances, setInitialBalances] = useState<[number, number, number]>([5, 8, 11]);
  const [state, setState] = useState<GameState>({ balances: [5, 8, 11], history: [] });
  const [done, setDone] = useState(false);
  const [showBinary, setShowBinary] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [colorText, setColorText] = useState(true);

  const setInitial = useCallback((vals: [number, number, number]) => {
    setInitialBalances(vals);
    setState({ balances: vals, history: [] });
    setDone(false);
    setShowHint(false);
  }, []);

  // T18: Explore only stops when an account hits 0, not on equality
  const doTransfer = useCallback(
    (transfer: Transfer) => {
      if (done) return;
      const newBalances = applyTransfer(state.balances, transfer);
      const newHistory = [...state.history, transfer];
      setState({ balances: newBalances, history: newHistory });
      if (hasWon(newBalances) !== null) {
        setDone(true);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
    },
    [state, done]
  );

  const undo = useCallback(() => {
    if (state.history.length === 0) return;
    const newHistory = state.history.slice(0, -1);
    let balances: [number, number, number] = [...initialBalances];
    for (const t of newHistory) balances = applyTransfer(balances, t);
    setState({ balances, history: newHistory });
    setDone(hasWon(balances) !== null);
  }, [state, initialBalances]);

  const reset = useCallback(() => {
    setState({ balances: [...initialBalances], history: [] });
    setDone(false);
  }, [initialBalances]);

  const legalTransfers = useMemo(() => (done ? [] : getLegalTransfers(state.balances)), [state.balances, done]);

  const sorted = useMemo(() => {
    const indices = [0, 1, 2].sort((a, b) => state.balances[a] - state.balances[b]);
    return {
      L: state.balances[indices[0]], M: state.balances[indices[1]], N: state.balances[indices[2]],
      labels: [ACCOUNT_LABELS[indices[0]], ACCOUNT_LABELS[indices[1]], ACCOUNT_LABELS[indices[2]]] as [string, string, string],
    };
  }, [state.balances]);

  const qValue = sorted.L > 0 ? Math.floor(sorted.M / sorted.L) : undefined;
  const alreadyZero = initialBalances.some((b) => b === 0);

  return (
    <div className="space-y-6">
      <PresetPicker initialBalances={initialBalances} setInitial={setInitial} />
      <ColorToggle colorText={colorText} setColorText={setColorText} balances={state.balances} />

      {alreadyZero && <div className="text-sm text-muted-foreground italic">One account is already at $0 — nothing to do!</div>}

      <SortedAccountCards balances={state.balances} showBinary={showBinary} />

      {!alreadyZero && !done && (
        <Card className="border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Sorted: </span>
                <span className="font-mono font-semibold">
                  <RankText rank="MIN" colorEnabled={colorText} /> ({sorted.labels[0]})={sorted.L},{' '}
                  <RankText rank="MID" colorEnabled={colorText} /> ({sorted.labels[1]})={sorted.M},{' '}
                  <RankText rank="MAX" colorEnabled={colorText} /> ({sorted.labels[2]})={sorted.N}
                </span>
              </div>
              {qValue !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-lg" dangerouslySetInnerHTML={{ __html: tex(`\\lfloor M/L \\rfloor = \\lfloor ${sorted.M}/${sorted.L} \\rfloor = ${qValue}`) }} />
                  {showBinary && <Badge variant="outline" className="font-mono text-xs">bin: {toBin(qValue)}</Badge>}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={showBinary ? 'default' : 'outline'} className="!h-10 !min-h-10 rounded-full !px-6" onClick={() => setShowBinary(!showBinary)}>
                {showBinary ? 'Hide' : 'Show'} Binary View
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowHint(!showHint)}>
                {showHint ? 'Hide Hint' : 'Hint'}
              </Button>
            </div>
            {showHint && (
              <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700 rounded p-3">
                <span dangerouslySetInnerHTML={{ __html: tex(`\\lfloor M/L \\rfloor`) }} />{' '}
                written in binary tells you exactly which transfers to make.
                Each bit, from most significant to least, says: if the bit is 1,
                transfer from <RankText rank="MID" colorEnabled={colorText} /> to <RankText rank="MIN" colorEnabled={colorText} />; if 0, transfer
                from <RankText rank="MAX" colorEnabled={colorText} /> to <RankText rank="MIN" colorEnabled={colorText} />. After processing all bits,
                the smallest value strictly decreases, and you repeat.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {done && <GameDoneMessage balances={state.balances} history={state.history} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Available Transfers</h3>
          {legalTransfers.length === 0 && !done && !alreadyZero && (
            <p className="text-sm text-muted-foreground">No legal transfers available.</p>
          )}
          <div className="flex flex-col gap-2">
            {legalTransfers.map((t, i) => (
              <TransferButton key={i} transfer={t} balances={state.balances} onTransfer={doTransfer} colorText={colorText} />
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={state.history.length === 0}>Undo</Button>
            <Button variant="outline" size="sm" onClick={reset}>Reset</Button>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Transfer Log ({state.history.length} move{state.history.length !== 1 ? 's' : ''})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-1 text-sm font-mono">
            {state.history.length === 0 && <p className="text-muted-foreground text-sm">No transfers yet.</p>}
            {state.history.map((t, i) => (
              <div key={i} className="text-muted-foreground">
                <span className="text-foreground font-medium">#{i + 1}</span>{' '}
                ${t.amount}: {ACCOUNT_LABELS[t.from]} &rarr; {ACCOUNT_LABELS[t.to]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Solution Tab ───────────────────────────────────────────────────────────

function SolutionTab() {
  const [initialBalances, setInitialBalances] = useState<[number, number, number]>([5, 8, 11]);
  const [steps, setSteps] = useState<SolutionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [computed, setComputed] = useState(false);
  const [colorText, setColorText] = useState(true);

  const setInitial = useCallback((vals: [number, number, number]) => {
    setInitialBalances(vals);
    setSteps([]);
    setCurrentStep(0);
    setComputed(false);
  }, []);

  const compute = useCallback(() => {
    const result = computeSolution(initialBalances);
    setSteps(result);
    setCurrentStep(0);
    setComputed(true);
  }, [initialBalances]);

  const stepForward = useCallback(() => {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
  }, [currentStep, steps.length]);

  const runToCompletion = useCallback(() => setCurrentStep(steps.length - 1), [steps.length]);

  const currentStepData = steps[currentStep] ?? null;
  const alreadyZero = initialBalances.some((b) => b === 0);

  // T20: Find the header step for the current iteration (has correct q, sorted, etc.)
  const currentIterationHeader = useMemo(() => {
    if (!currentStepData?.iteration) return null;
    for (let i = currentStep; i >= 0; i--) {
      if (steps[i].iteration === currentStepData.iteration && !steps[i].transfer) return steps[i];
    }
    return null;
  }, [steps, currentStep, currentStepData]);

  // T21: Track evolving min across iterations
  const minHistory = useMemo(() => {
    const mins: { iteration: number; min: number }[] = [];
    const seen = new Set<number>();
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      const s = steps[i];
      if (s.iteration && !seen.has(s.iteration)) {
        seen.add(s.iteration);
        mins.push({ iteration: s.iteration, min: s.sorted[0] });
      }
    }
    return mins;
  }, [steps, currentStep]);

  const iterationsUpToCurrent = useMemo(() => {
    const iters: SolutionStep[] = [];
    const seen = new Set<number>();
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      const s = steps[i];
      if (s.iteration && !seen.has(s.iteration)) { seen.add(s.iteration); iters.push(s); }
    }
    return iters;
  }, [steps, currentStep]);

  const transferCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i <= currentStep && i < steps.length; i++) { if (steps[i].transfer) count++; }
    return count;
  }, [steps, currentStep]);

  // T30: All transfer steps up to current step for the modal
  const allTransfersUpToCurrent = useMemo(() => {
    const transfers: { step: SolutionStep; index: number }[] = [];
    let count = 0;
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      if (steps[i].transfer) {
        count++;
        transfers.push({ step: steps[i], index: count });
      }
    }
    return transfers;
  }, [steps, currentStep]);

  const isFinished = computed && currentStep === steps.length - 1;
  const finalWon = isFinished && currentStepData ? hasWon(currentStepData.balances) : null;

  useEffect(() => {
    if (finalWon !== null) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }, [finalWon]);

  return (
    <div className="space-y-6">
      <PresetPicker initialBalances={initialBalances} setInitial={setInitial} />
      <ColorToggle colorText={colorText} setColorText={setColorText} fixedLabels={currentIterationHeader?.iterationLabels} />

      {alreadyZero && <div className="text-sm text-muted-foreground italic">One account is already at $0 — trivially done.</div>}

      {!computed && !alreadyZero && (
        <div className="flex justify-center"><Button onClick={compute}>Compute Solution</Button></div>
      )}

      {computed && currentStepData && (() => {
        // T15: Show the *next* step's transfer as a preview of what will happen
        const nextStep = currentStep < steps.length - 1 ? steps[currentStep + 1] : null;
        const nextTransfer = nextStep?.transfer;

        return (
        <>
          <SortedAccountCards balances={currentStepData.balances} showBinary />

          {nextTransfer && (
            <Card className="border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30">
              <CardContent className="pt-4 text-sm space-y-2">
                <div className="font-semibold">
                  Next: Transfer ${nextTransfer.amount} from{' '}
                  {nextTransfer.bit === 1 ? 'MID' : 'MAX'} ({nextTransfer.fromAccount}) &rarr;{' '}
                  MIN ({nextTransfer.toAccount})
                </div>
                <div className="text-muted-foreground text-xs">
                  Bit a<sub>{nextTransfer.bitIndex}</sub> = {nextTransfer.bit}{' '}
                  &mdash;{' '}
                  {nextTransfer.bit === 1
                    ? <>transfer from MID to MIN</>
                    : <>transfer from MAX to MIN</>}
                  {' '}(iteration {nextStep?.iteration})
                </div>
              </CardContent>
            </Card>
          )}

          {/* T21: Min tracker */}
          {minHistory.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Min across iterations:</span>
              <div className="flex items-center gap-1 font-mono">
                {minHistory.map((m, i) => (
                  <span key={m.iteration} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground">&rarr;</span>}
                    <span className={`font-bold ${m.min === 0 ? 'text-green-600' : 'text-green-700 dark:text-green-400'}`}>
                      {m.min}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* T20: Use iteration header for correct q/sorted values */}
            {currentIterationHeader && currentIterationHeader.q !== undefined && currentIterationHeader.iterationLabels && (() => {
              const nextStep = currentStep < steps.length - 1 ? steps[currentStep + 1] : null;
              const iterationDone = !nextStep || !nextStep.transfer || nextStep.iteration !== currentIterationHeader.iteration;
              return (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">
                  {iterationDone
                    ? `Iteration ${currentIterationHeader.iteration} complete! Here's a summary:`
                    : `Iteration ${currentIterationHeader.iteration}`}
                </CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">At start: </span>
                    <span className="font-mono">
                      <RankText rank="MIN" colorEnabled={colorText} /> ({currentIterationHeader.iterationLabels[0]})={currentIterationHeader.sorted[0]},{' '}
                      <RankText rank="MID" colorEnabled={colorText} /> ({currentIterationHeader.iterationLabels[1]})={currentIterationHeader.sorted[1]},{' '}
                      <RankText rank="MAX" colorEnabled={colorText} /> ({currentIterationHeader.iterationLabels[2]})={currentIterationHeader.sorted[2]}
                    </span>
                  </div>
                  {iterationDone ? (
                    /* T28: When iteration is complete, just show start and end */
                    <div>
                      <span className="text-muted-foreground">At end: </span>
                      <span className="font-mono">
                        {ACCOUNT_LABELS.map((label, i) => (
                          <span key={label}>
                            {i > 0 && ', '}
                            {label}={currentStepData.balances[i]}
                          </span>
                        ))}
                      </span>
                    </div>
                  ) : (
                    /* When iteration is in progress, show q decomposition and binary */
                    <>
                      <div dangerouslySetInnerHTML={{ __html: tex(`q = \\lfloor M/L \\rfloor = \\lfloor ${currentIterationHeader.sorted[1]}/${currentIterationHeader.sorted[0]} \\rfloor = ${currentIterationHeader.q}`) }} />
                      <div dangerouslySetInnerHTML={{ __html: tex(`M = q \\cdot L + r = ${currentIterationHeader.q} \\cdot ${currentIterationHeader.sorted[0]} + ${currentIterationHeader.r}`) }} />
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">q in binary: </span>
                        <span className="font-mono font-bold tracking-widest text-lg">
                          {[...(currentIterationHeader.qBits || [])].reverse().map((bit, i) => {
                            const qBits = currentIterationHeader.qBits || [];
                            const lsbIndex = qBits.length - 1 - i;
                            const ns = currentStep < steps.length - 1 ? steps[currentStep + 1] : null;
                            const isActive = ns?.transfer?.bitIndex === lsbIndex && ns?.iteration === currentIterationHeader.iteration;
                            return (
                              <span key={i} className={`${
                                bit === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                              } ${isActive ? 'underline decoration-2 decoration-purple-500 bg-purple-200 dark:bg-purple-800 rounded px-0.5' : ''}`}>
                                {bit}
                              </span>
                            );
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">1</span> = MID &rarr; MIN,{' '}
                        <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">0</span> = MAX &rarr; MIN
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              );
            })()}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Iteration History
                  {allTransfersUpToCurrent.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                          Show Transfers
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>All Transfers ({allTransfersUpToCurrent.length})</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-1 text-sm font-mono">
                          {allTransfersUpToCurrent.map(({ step: s, index }) => (
                            <div key={index} className="flex items-center gap-2 py-1 border-b border-muted last:border-b-0">
                              <span className="text-muted-foreground w-8 text-right shrink-0">#{index}</span>
                              <span>
                                ${s.transfer!.amount}: {s.transfer!.from} &rarr; {s.transfer!.to}
                              </span>
                              <Badge variant="outline" className="text-xs ml-auto shrink-0">
                                iter {s.iteration}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {iterationsUpToCurrent.length === 0 && <p className="text-muted-foreground">No iterations yet.</p>}
                {iterationsUpToCurrent.map((s) => (
                  <div key={s.iteration} className="flex flex-wrap items-center gap-3 py-1 border-b border-muted last:border-b-0">
                    <Badge variant="outline" className="text-xs">#{s.iteration}</Badge>
                    <span className="font-mono text-xs">
                      MIN({s.iterationLabels?.[0]})={s.sorted[0]}, MID({s.iterationLabels?.[1]})={s.sorted[1]}, MAX({s.iterationLabels?.[2]})={s.sorted[2]}
                    </span>
                    {s.q !== undefined && <span className="text-xs" dangerouslySetInnerHTML={{ __html: tex(`q=${s.q},\\; r=${s.r}`) }} />}
                  </div>
                ))}
                {iterationsUpToCurrent.length > 1 && (
                  <div className="text-xs text-muted-foreground italic pt-1">The minimum value strictly decreases each iteration.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {finalWon !== null && (
            <div className="text-center p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-500 text-green-800 dark:text-green-200 font-semibold text-lg">
              Account {ACCOUNT_LABELS[finalWon]} emptied in {transferCount} total transfer{transferCount !== 1 ? 's' : ''}!
            </div>
          )}

          {/* T12: Step slider */}
          {steps.length > 1 && (
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={steps.length - 1}
                value={currentStep}
                onChange={(e) => setCurrentStep(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="text-center text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setCurrentStep(0)} disabled={currentStep === 0}>Restart</Button>
            <Button variant="outline" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}>Previous</Button>
            <Button className="!h-10 !min-h-10 rounded-full !px-6" onClick={stepForward} disabled={currentStep >= steps.length - 1}>Next</Button>
            <Button variant="outline" onClick={runToCompletion} disabled={currentStep >= steps.length - 1}>Run to Completion</Button>
          </div>
        </>
        );
      })()}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const ThreeBankAccounts: React.FC = () => {
  const [activeTab, setActiveTab] = useState('play');
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Three Bank Accounts
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            From the 1994 IMO Shortlist.
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Peter has three bank accounts, each containing a positive integer number of dollars.
            He can transfer money between accounts, but a transfer must{' '}
            <em className="text-foreground font-medium">exactly double</em>{' '}
            the recipient's balance. Can he always empty one account?
          </p>
          <div>
            <a
              href="https://www.youtube.com/watch?v=KErFxmsdrFM"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-start gap-2 text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.81zM9.55 15.57V8.43L15.8 12l-6.25 3.57z"/></svg>
              Watch this video for a beautiful exposition of this solution by Dr. Sucharit Sarkar,<br />an IMO 2001 gold medalist and IMO 2002 silver medalist
            </a>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="play">Play</TabsTrigger>
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="solution">Solution</TabsTrigger>
        </TabsList>
        <TabsContent value="play" className="mt-4"><PlayTab onSwitchTab={setActiveTab} /></TabsContent>
        <TabsContent value="explore" className="mt-4"><ExploreTab /></TabsContent>
        <TabsContent value="solution" className="mt-4"><SolutionTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ThreeBankAccounts;
