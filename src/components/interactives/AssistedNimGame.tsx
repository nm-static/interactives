import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

const SKY_BLUE = '#e0f2fe';
const MAROON = '#800000';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MIN_HEAPS = 2;
const MAX_HEAPS = 10;
const MIN_STONES = 1;
const MAX_STONES = 31; // Extended to 31 to include power-of-16 box

type Mode = 'random' | 'user';

type Heap = number;

type Player = 0 | 1;

const heapColors = [
  '#fbbf24', '#60a5fa', '#34d399', '#f472b6', '#f87171', '#a78bfa', '#facc15', '#38bdf8', '#4ade80', '#f472b6',
  '#f87171', '#a78bfa', '#fbbf24', '#60a5fa', '#34d399', '#f472b6', '#f87171', '#a78bfa', '#facc15', '#38bdf8',
];

// Function to break down a number into its binary representation (powers of 2)
const getBinaryRepresentation = (num: number): number[] => {
  const powers: number[] = [];
  let remaining = num;
  let power = 1;
  
  while (remaining > 0) {
    if (remaining & 1) {
      powers.push(power);
    }
    remaining >>= 1;
    power <<= 1;
  }
  
  return powers;
};

// Function to calculate which powers of 2 appear an odd number of times across all heaps
const getOddPowers = (heaps: number[]): Set<number> => {
  const powerCounts = new Map<number, number>();
  
  heaps.forEach(heap => {
    const powers = getBinaryRepresentation(heap);
    powers.forEach(power => {
      powerCounts.set(power, (powerCounts.get(power) || 0) + 1);
    });
  });
  
  const oddPowers = new Set<number>();
  powerCounts.forEach((count, power) => {
    if (count % 2 === 1) {
      oddPowers.add(power);
    }
  });
  
  return oddPowers;
};

interface AssistedNimGameProps {
}

const AssistedNimGame: React.FC<AssistedNimGameProps> = () => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [userHeapCount, setUserHeapCount] = useState(3);
  const [userHeapSizes, setUserHeapSizes] = useState<number[]>([3, 3, 3]);
  const [heaps, setHeaps] = useState<Heap[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const [heapsGroupWidth, setHeapsGroupWidth] = useState<string>('0px');
  const initialHeapsRef = useRef<number[]>([]);

  // Calculate the maximum number of powers of 2 needed for any heap
  const getMaxPowers = (heaps: number[]): number => {
    if (heaps.length === 0) return 0;
    // Since we cap at 31, we need 5 powers: 1, 2, 4, 8, 16
    return 5;
  };

  // Calculate width based on maximum powers of 2
  React.useEffect(() => {
    if (mode !== null && heaps.length > 0) {
      const maxPowers = getMaxPowers(heaps);
      const gapWidth = 0.5; // Gap between power groups
      const labelWidth = 2; // Width for heap size label
      
      // Calculate total width accounting for different box sizes
      let totalBoxWidth = 0;
      for (let i = 0; i < maxPowers; i++) {
        const power = 1 << i; // 1, 2, 4, 8, 16
        if (power === 16) {
          totalBoxWidth += 12; // Power-of-16 box is 12rem wide
        } else if (power === 8) {
          totalBoxWidth += 8; // Power-of-8 box is 8rem wide
        } else {
          totalBoxWidth += 4; // Other boxes are 4rem wide
        }
      }
      
      const totalWidthRem = labelWidth + totalBoxWidth + (maxPowers - 1) * gapWidth;
      setHeapsGroupWidth(`${totalWidthRem}rem`);
    }
  }, [mode, heaps.length]);

  // Store initial heaps for reset
  React.useEffect(() => {
    if (mode !== null && heaps.length > 0) {
      initialHeapsRef.current = [...heaps];
    }
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
    if (newHeaps.every(heap => heap === 0)) {
      setWinner(currentPlayer);
    } else {
      setCurrentPlayer(currentPlayer === 0 ? 1 : 0);
    }
  };

  const handlePlayAgain = () => {
    setWinner(null);
    setCurrentPlayer(0);
    setHeaps([...initialHeapsRef.current]);
  };

  const handleResetGame = () => {
    setWinner(null);
    setCurrentPlayer(0);
    setHeaps([...initialHeapsRef.current]);
  };

  const handleNewGame = () => {
    setMode(null);
    setHeaps([]);
    setWinner(null);
    setCurrentPlayer(0);
  };

  const handleHeapCountChange = (val: number) => {
    setUserHeapCount(val);
    setUserHeapSizes(Array.from({ length: val }, () => 3));
  };

  const handleHeapSizeChange = (idx: number, val: number) => {
    const newSizes = [...userHeapSizes];
    newSizes[idx] = val;
    setUserHeapSizes(newSizes);
  };

  // Calculate which powers of 2 appear an odd number of times
  const oddPowers = getOddPowers(heaps);

  // Render a heap broken down into powers of 2
  const renderHeap = (heap: number, idx: number) => {
    const powers = getBinaryRepresentation(heap);
    const maxPowers = getMaxPowers(heaps);
    
    return (
      <div key={idx} className="flex flex-row items-center gap-2">
        {/* Heap size label */}
        <span className="font-mono text-sm text-muted-foreground min-w-[2ch] text-right">{heap}</span>
        
        {/* Powers of 2 groups - horizontal layout with fixed widths */}
        <div className="flex gap-2">
          {Array.from({ length: maxPowers }, (_, powerIdx) => {
            const power = 1 << powerIdx; // 2^powerIdx (1, 2, 4, 8, 16)
            const hasPower = powers.includes(power);
            const isOdd = oddPowers.has(power);
            const isPower8 = power === 8; // Check if this is the power-of-8 box
            const isPower16 = power === 16; // Check if this is the power-of-16 box
            
            return (
              <div
                key={powerIdx}
                className={`flex flex-col gap-1 p-2 rounded border-2 ${
                  hasPower 
                    ? (isOdd ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50')
                    : 'border-gray-200 bg-gray-50'
                }`}
                style={{ 
                  minWidth: isPower16 ? '12rem' : (isPower8 ? '8rem' : '4rem'),
                  width: isPower16 ? '12rem' : (isPower8 ? '8rem' : '4rem')
                }}
              >
                {/* Stones for this power - single row layout */}
                {hasPower ? (
                  <div className="flex flex-row gap-0.5 justify-center">
                    {Array.from({ length: power }, (_, stoneIdx) => (
                      <span
                        key={stoneIdx}
                        className="inline-block w-2 h-2 rounded-full cursor-pointer border border-gray-400 hover:border-black transition-all"
                        style={{ 
                          background: heapColors[idx % heapColors.length], 
                          opacity: winner !== null ? 0.5 : 1 
                        }}
                        onClick={() => {
                          // Calculate the actual stone index in the heap
                          const actualIndex = powers
                            .filter(p => p < power)
                            .reduce((sum, p) => sum + p, 0) + stoneIdx;
                          handleStoneClick(idx, actualIndex);
                        }}
                        title={`Power of 2: ${power}, Stone ${stoneIdx + 1}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-2 h-2" /> // Fixed empty space
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Dynamic backdrop color based on current player
  const backdropColor = winner === null ? (currentPlayer === 0 ? SKY_BLUE : MAROON) : '#f0f0f0';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Assisted Game of Nim</CardTitle>
          <CardDescription className="text-center">
            Visualize the XOR strategy! Heaps are broken down into powers of 2. Red borders show powers that appear an odd number of times - these are your winning moves!
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

              {/* Strategy Explanation */}
              <div className="text-center space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">XOR Strategy Visualization</p>
                <p className="text-xs text-blue-600">
                  Red borders = Powers of 2 that appear an odd number of times (your winning moves)<br/>
                  Green borders = Powers of 2 that appear an even number of times (balanced)
                </p>
                <div className="mt-3 pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-500">
                    Strategy based on a well-known analysis, in particular the intuition explored by {' '}
                    <a 
                      href="https://jdh.hamkins.org/win-at-nim-the-secret-mathematical-strategy/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-700"
                    >
                      Joel David Hamkins
                    </a>
                  </p>
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
              Click any stone to remove it and all stones to its right. The visual breakdown shows powers of 2 - 
              red borders indicate winning moves in the XOR strategy!
            </p>
          </div>

          {/* User-defined setup modal */}
          <Dialog open={showSetup} onOpenChange={setShowSetup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Define Your Game</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Number of heaps: {userHeapCount}</label>
                  <Slider
                    value={[userHeapCount]}
                    onValueChange={(value) => handleHeapCountChange(value[0])}
                    min={MIN_HEAPS}
                    max={MAX_HEAPS}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Heap sizes:</label>
                  {userHeapSizes.map((size, idx) => (
                    <div key={idx}>
                      <label className="text-sm">Heap {idx + 1}: {size}</label>
                      <Slider
                        value={[size]}
                        onValueChange={(value) => handleHeapSizeChange(idx, value[0])}
                        min={MIN_STONES}
                        max={MAX_STONES}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleUserSetupConfirm} className="w-full">Start Game</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssistedNimGame;  