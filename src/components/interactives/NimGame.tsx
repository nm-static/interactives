import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SKY_BLUE = '#e0f2fe';
const MAROON = '#800000';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MIN_HEAPS = 2;
const MAX_HEAPS = 10;
const MIN_STONES = 1;
const MAX_STONES = 20;

type Mode = 'random' | 'user';

type Heap = number;

type Player = 0 | 1;

const heapColors = [
  '#fbbf24', '#60a5fa', '#34d399', '#f472b6', '#f87171', '#a78bfa', '#facc15', '#38bdf8', '#4ade80', '#f472b6',
  '#f87171', '#a78bfa', '#fbbf24', '#60a5fa', '#34d399', '#f472b6', '#f87171', '#a78bfa', '#facc15', '#38bdf8',
];

interface NimGameProps {
}

const NimGame: React.FC<NimGameProps> = () => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [userHeapCount, setUserHeapCount] = useState(3);
  const [userHeapSizes, setUserHeapSizes] = useState<number[]>([3, 3, 3]);
  const [heaps, setHeaps] = useState<Heap[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(0);
  const [winner, setWinner] = useState<Player | null>(null);
  // Store the initial heap sizes to keep the left edge fixed
  const [initialHeapSizes, setInitialHeapSizes] = useState<number[]>([]);
  // Store the initial max heap size for all heaps in a ref
  const initialMaxHeapSizeRef = useRef<number>(0);
  // Store the pixel width for the entire heaps group container (label + stones)
  const [heapsGroupWidth, setHeapsGroupWidth] = useState<string>('0px');
  // Store the initial heaps for reset
  const initialHeapsRef = useRef<number[]>([]);

  // When a new game starts, record the initial heap sizes and max size and compute the group width
  React.useEffect(() => {
    if (mode !== null && heaps.length > 0) {
      const maxSize = Math.max(...heaps);
      initialMaxHeapSizeRef.current = maxSize;
      // Each stone is 1.25rem wide (w-5 = 1.25rem), gap is 0.25rem (gap-1), label is ~2ch (about 1.5rem)
      // Total width = label + stones + gaps between stones
      const stoneWidth = 1.25; // rem
      const gapWidth = 0.25; // rem
      const labelWidth = 1.5; // rem (for 'min-w-[2ch]' + gap)
      const totalWidthRem = maxSize > 0 ? (labelWidth + maxSize * stoneWidth + (maxSize - 1) * gapWidth) : labelWidth;
      setHeapsGroupWidth(`${totalWidthRem}rem`);
    }
    // eslint-disable-next-line
  }, [mode, heaps.length]);

  // When a new game starts, record the initial heaps
  React.useEffect(() => {
    if (mode !== null && heaps.length > 0) {
      initialHeapsRef.current = [...heaps];
    }
    // eslint-disable-next-line
  }, [mode, heaps.length]);

  // Start a new game
  const startGame = (selectedMode: Mode) => {
    setMode(selectedMode);
    setWinner(null);
    setCurrentPlayer(0);
    if (selectedMode === 'random') {
      const k = getRandomInt(MIN_HEAPS, MAX_HEAPS);
      const randomHeaps = Array.from({ length: k }, () => getRandomInt(MIN_STONES, MAX_STONES));
      setHeaps(randomHeaps);
    } else {
      setShowSetup(true);
    }
  };

  // Handle user-defined setup
  const handleUserSetupConfirm = () => {
    setHeaps([...userHeapSizes]);
    setShowSetup(false);
    setWinner(null);
    setCurrentPlayer(0);
  };

  // Handle stone click: remove all stones from clicked index to the end in that heap
  const handleStoneClick = (heapIdx: number, stoneIdx: number) => {
    if (winner !== null) return;
    if (heaps[heapIdx] === 0) return;
    const newHeaps = [...heaps];
    newHeaps[heapIdx] = stoneIdx;
    setHeaps(newHeaps);
    // Check for win
    if (newHeaps.every(h => h === 0)) {
      setWinner(currentPlayer);
    } else {
      setCurrentPlayer((currentPlayer === 0 ? 1 : 0) as Player);
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    setMode(null);
    setHeaps([]);
    setWinner(null);
    setCurrentPlayer(0);
  };

  // Reset the game to the initial heaps
  const handleResetGame = () => {
    setHeaps([...initialHeapsRef.current]);
    setWinner(null);
    setCurrentPlayer(0);
  };

  // Start a new game (go back to mode selection)
  const handleNewGame = () => {
    setMode(null);
    setHeaps([]);
    setWinner(null);
    setCurrentPlayer(0);
  };

  // User heap count slider change
  const handleHeapCountChange = (val: number) => {
    setUserHeapCount(val);
    setUserHeapSizes(Array.from({ length: val }, (_, i) => userHeapSizes[i] || 3));
  };

  // User heap size slider change
  const handleHeapSizeChange = (idx: number, val: number) => {
    setUserHeapSizes(sizes => sizes.map((s, i) => (i === idx ? val : s)));
  };

  // Find the max heap size for centering
  const maxHeapSize = Math.max(0, ...heaps, ...userHeapSizes);

  // Visual heap rendering: always show all heaps, show 0 for empty, keep left anchoring, reserve space for initial max heap size
  const renderHeap = (heap: number, idx: number) => {
    const maxInitial = initialMaxHeapSizeRef.current;
    return (
      <div key={idx} className="flex flex-row items-center gap-2">
        {/* Heap size label */}
        <span className="font-mono text-sm text-muted-foreground min-w-[2ch] text-right">{heap}</span>
        {/* Stones, left-aligned, reserve space for initial max heap size */}
        <div className="flex gap-1" style={{ minWidth: `${maxInitial * 1.25 + (maxInitial - 1) * 0.25}rem` }}>
          {heap > 0 ? (
            Array.from({ length: heap }).map((_, i) => (
              <span
                key={i}
                className="inline-block w-5 h-5 rounded-full cursor-pointer border-2 border-gray-400 hover:border-black transition-all"
                style={{ background: heapColors[idx % heapColors.length], opacity: winner !== null ? 0.5 : 1 }}
                onClick={() => handleStoneClick(idx, i)}
                title="Click to remove this stone and all to its right"
              />
            ))
          ) : (
            <span className="inline-block w-5 h-5 rounded-full border-2 border-dashed border-gray-300 bg-gray-100 opacity-60" />
          )}
        </div>
      </div>
    );
  };

  // Center the group of heaps only at the start
  // We'll use a flex container with justify-center for the initial render, but keep the left edge fixed after
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Game of Nim</CardTitle>
          <CardDescription className="text-center">
            Take turns. On your turn, click any stone in any heap to remove that stone and all stones to its right in that heap. The player to take the last stone wins!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Controls */}
          {mode === null && (
            <div className="flex flex-col gap-4 items-center">
              <Button onClick={() => startGame('random')}>Random Instance</Button>
              <Button onClick={() => startGame('user')}>User-Defined Instance</Button>
            </div>
          )}

          {mode !== null && (
            <>
              {/* Current Turn Indicator and Reset Button */}
              <div className="text-center flex flex-col items-center gap-2">
                {winner === null ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Turn:</p>
                      <span className={`inline-block text-lg px-4 py-2 rounded font-semibold ${currentPlayer === 0 ? 'bg-sky-200 text-sky-800' : 'bg-red-200 text-red-800'}`}>
                        Player {currentPlayer + 1}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={handleResetGame}>Reset Game</Button>
                      <Button variant="outline" size="sm" onClick={handleNewGame}>New Game</Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <span className="inline-block text-lg px-4 py-2 rounded font-semibold bg-green-200 text-green-800">Winner: Player {winner + 1}!</span>
                  </div>
                )}
              </div>

              {/* Heaps Display */}
              <div className="w-full flex justify-center">
                <div className="flex flex-col items-start gap-4 my-4 mx-auto" style={{ width: heapsGroupWidth }}>
                  {heaps.map((heap, idx) => renderHeap(heap, idx))}
                </div>
              </div>

              {/* Play Again Button */}
              {winner !== null && (
                <div className="flex justify-center">
                  <Button onClick={handlePlayAgain}>Play Again</Button>
                </div>
              )}
            </>
          )}

          {/* Instructions */}
          <div className="text-center space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Click any stone in any heap to remove that stone and all stones to its right in that heap. The player to take the last stone wins!
            </p>
          </div>

          {/* User-defined setup modal */}
          <Dialog open={showSetup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set up your Nim instance</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1">Number of heaps: {userHeapCount}</label>
                  <input
                    type="range"
                    min={MIN_HEAPS}
                    max={MAX_HEAPS}
                    value={userHeapCount}
                    onChange={e => handleHeapCountChange(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                {Array.from({ length: userHeapCount }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <label>Heap {idx + 1}:</label>
                    <input
                      type="range"
                      min={MIN_STONES}
                      max={MAX_STONES}
                      value={userHeapSizes[idx] || 3}
                      onChange={e => handleHeapSizeChange(idx, Number(e.target.value))}
                      className="w-40"
                    />
                    <span className="w-8 text-center">{userHeapSizes[idx] || 3}</span>
                  </div>
                ))}
                <Button onClick={handleUserSetupConfirm}>Start Game</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default NimGame;  