import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw, Info } from 'lucide-react';

interface ParityBitsGameProps {
}

const ParityBitsGame = ({}: ParityBitsGameProps) => {
  const [gridSize, setGridSize] = useState(5);
  const [grid, setGrid] = useState<boolean[][]>(() => 
    Array(5).fill(null).map(() => Array(5).fill(false))
  );
  const [parityBitsAdded, setParityBitsAdded] = useState(false);
  const [parityGrid, setParityGrid] = useState<boolean[][]>([]);
  const [flippedCell, setFlippedCell] = useState<{row: number, col: number} | null>(null);
  const [errorDetected, setErrorDetected] = useState<{row: number, col: number} | null>(null);
  const [phase, setPhase] = useState<'setup' | 'parity' | 'flip' | 'detect'>('setup');
  const [animationState, setAnimationState] = useState<{
    isAnimating: boolean;
    currentRow: number;
    currentCol: number;
    showRowParity: boolean;
    showColParity: boolean;
    rowParities: boolean[];
    colParities: boolean[];
    rowCounts: number[];
    colCounts: number[];
  }>({
    isAnimating: false,
    currentRow: -1,
    currentCol: -1,
    showRowParity: false,
    showColParity: false,
    rowParities: [],
    colParities: [],
    rowCounts: [],
    colCounts: []
  });

  // Reset game when grid size changes
  const handleGridSizeChange = useCallback((newSize: number[]) => {
    const size = newSize[0];
    setGridSize(size);
    setGrid(Array(size).fill(null).map(() => Array(size).fill(false)));
    setParityBitsAdded(false);
    setParityGrid([]);
    setFlippedCell(null);
    setErrorDetected(null);
    setPhase('setup');
  }, []);

  // Toggle a cell in the main grid
  const toggleCell = (row: number, col: number) => {
    if (phase !== 'setup') return;
    
    const newGrid = [...grid];
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);
  };

  // Calculate parity for a row or column
  const calculateParity = (bits: boolean[]): boolean => {
    return bits.filter(bit => bit).length % 2 === 1;
  };

  // Add parity bits to create the extended grid
  const addParityBits = () => {
    const extended = Array(gridSize + 1).fill(null).map(() => Array(gridSize + 1).fill(false));
    
    // Copy original grid
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        extended[i][j] = grid[i][j];
      }
    }
    
    // Calculate row parities
    for (let i = 0; i < gridSize; i++) {
      extended[i][gridSize] = calculateParity(grid[i]);
    }
    
    // Calculate column parities
    for (let j = 0; j < gridSize; j++) {
      const column = grid.map(row => row[j]);
      extended[gridSize][j] = calculateParity(column);
    }
    
    // Calculate overall parity (XOR of all data bits)
    const allBits = grid.flat();
    extended[gridSize][gridSize] = calculateParity(allBits);
    
    setParityGrid(extended);
    setParityBitsAdded(true);
    setPhase('parity');
  };

  // Flip a bit in the parity grid
  const flipBit = (row: number, col: number) => {
    if (phase !== 'parity') return;
    
    const newGrid = [...parityGrid];
    newGrid[row][col] = !newGrid[row][col];
    setParityGrid(newGrid);
    setFlippedCell({row, col});
    setPhase('flip');
  };

  // Identify the flipped bit using parity check with animation
  const identifyFlip = async () => {
    if (!parityBitsAdded) return;
    
    // Calculate all parities first
    const rowParities: boolean[] = [];
    const colParities: boolean[] = [];
    const rowCounts: number[] = [];
    const colCounts: number[] = [];
    
    for (let i = 0; i <= gridSize; i++) {
      const rowBits = parityGrid[i] || [];
      const rowCount = rowBits.filter(bit => bit).length;
      const expectedParity = calculateParity(rowBits.slice(0, gridSize));
      rowParities[i] = i < gridSize ? (expectedParity !== parityGrid[i][gridSize]) : false;
      rowCounts[i] = rowCount;
    }
    
    for (let j = 0; j <= gridSize; j++) {
      const colBits = parityGrid.map(row => row?.[j] || false);
      const colCount = colBits.filter(bit => bit).length;
      const expectedParity = calculateParity(colBits.slice(0, gridSize));
      colParities[j] = j < gridSize ? (expectedParity !== parityGrid[gridSize][j]) : false;
      colCounts[j] = colCount;
    }
    
    setAnimationState({
      isAnimating: true,
      currentRow: -1,
      currentCol: -1,
      showRowParity: false,
      showColParity: false,
      rowParities,
      colParities,
      rowCounts,
      colCounts
    });
    
    // Animate through rows (including parity row)
    for (let i = 0; i <= gridSize; i++) {
      setAnimationState(prev => ({...prev, currentRow: i}));
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Show row parities
    setAnimationState(prev => ({...prev, currentRow: -1, showRowParity: true}));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Animate through columns (including parity column)
    for (let j = 0; j <= gridSize; j++) {
      setAnimationState(prev => ({...prev, currentCol: j}));
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Show column parities and keep them persistent
    setAnimationState(prev => ({...prev, currentCol: -1, showColParity: true}));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find and highlight the error
    const errorRow = rowParities.findIndex(parity => parity);
    const errorCol = colParities.findIndex(parity => parity);
    
    if (errorRow >= 0 && errorCol >= 0) {
      setErrorDetected({row: errorRow, col: errorCol});
    }
    
    // Keep labels persistent - don't reset them
    setAnimationState(prev => ({
      ...prev,
      isAnimating: false,
      currentRow: -1,
      currentCol: -1
    }));
    
    setPhase('detect');
  };

  // Random start - fill random cells
  const randomStart = () => {
    if (phase !== 'setup') return;
    
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    
    // Fill about 30-50% of cells randomly
    const fillPercentage = 0.3 + Math.random() * 0.2; // 30-50%
    const totalCells = gridSize * gridSize;
    const cellsToFill = Math.floor(totalCells * fillPercentage);
    
    const positions: {row: number, col: number}[] = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        positions.push({row: i, col: j});
      }
    }
    
    // Shuffle and take first cellsToFill positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    for (let i = 0; i < cellsToFill; i++) {
      const {row, col} = positions[i];
      newGrid[row][col] = true;
    }
    
    setGrid(newGrid);
  };

  // Reset the game
  const resetGame = () => {
    setGrid(Array(gridSize).fill(null).map(() => Array(gridSize).fill(false)));
    setParityBitsAdded(false);
    setParityGrid([]);
    setFlippedCell(null);
    setErrorDetected(null);
    setPhase('setup');
    setAnimationState({
      isAnimating: false,
      currentRow: -1,
      currentCol: -1,
      showRowParity: false,
      showColParity: false,
      rowParities: [],
      colParities: [],
      rowCounts: [],
      colCounts: []
    });
  };

  const renderGrid = () => {
    const currentGrid = parityBitsAdded ? parityGrid : grid;
    const size = parityBitsAdded ? gridSize + 1 : gridSize;
    
    return (
      <div className="flex flex-col items-center gap-2">
        {/* Main grid with row labels */}
        <div className="flex items-center gap-2">
          <div className="grid gap-1" style={{gridTemplateColumns: `repeat(${size}, 1fr)`}}>
            {Array(size).fill(null).map((_, row) =>
              Array(size).fill(null).map((_, col) => {
                const isParityCell = parityBitsAdded && (row === gridSize || col === gridSize);
                const isFlipped = flippedCell?.row === row && flippedCell?.col === col;
                const isError = errorDetected?.row === row && errorDetected?.col === col;
                const isCurrentRowBeingChecked = animationState.currentRow === row;
                const isCurrentColBeingChecked = animationState.currentCol === col;
                const shouldHighlightForAnimation = isCurrentRowBeingChecked || isCurrentColBeingChecked;
                const isBlackCell = currentGrid[row]?.[col];
                const highlightColor = isBlackCell ? 'ring-2 ring-orange-400 bg-orange-400/20' : 'ring-2 ring-yellow-400 bg-yellow-400/15';
                
                return (
                  <button
                    key={`${row}-${col}`}
                    className={`
                      w-12 h-12 border-2 transition-all duration-200
                      ${currentGrid[row]?.[col] ? 'bg-foreground' : 'bg-background'}
                      ${isParityCell ? 'border-muted-foreground/40 border-dashed' : 'border-foreground'}
                      ${isError ? 'ring-4 ring-green-500 bg-green-500/20' : ''}
                      ${shouldHighlightForAnimation ? highlightColor : ''}
                      ${phase === 'setup' && !isParityCell ? 'hover:bg-accent cursor-pointer' : ''}
                      ${phase === 'parity' ? 'hover:bg-accent cursor-pointer' : ''}
                    `}
                    onClick={() => {
                      if (phase === 'setup') toggleCell(row, col);
                      else if (phase === 'parity') flipBit(row, col);
                    }}
                    disabled={false}
                  />
                );
              })
            )}
          </div>
          
          {/* Row parity labels */}
          {(animationState.currentRow >= 0 || animationState.showRowParity) && (
            <div className="flex flex-col gap-1">
              {Array(gridSize + 1).fill(null).map((_, row) => {
                const hasOddParity = animationState.rowParities[row];
                const count = animationState.rowCounts[row];
                const showLabel = (row === animationState.currentRow) || animationState.showRowParity;
                return (
                  <div key={`row-${row}`} className="w-12 h-12 flex items-center justify-center">
                    {showLabel && (
                      <span className={`text-xs font-medium ${hasOddParity ? 'text-red-500' : 'text-foreground'}`}>
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Column parity labels */}
        {(animationState.currentCol >= 0 || animationState.showColParity) && (
          <div className="flex items-center gap-2">
            <div className="grid gap-1" style={{gridTemplateColumns: `repeat(${gridSize + 1}, 1fr)`}}>
              {Array(gridSize + 1).fill(null).map((_, col) => {
                const hasOddParity = animationState.colParities[col];
                const count = animationState.colCounts[col];
                const showLabel = (col === animationState.currentCol) || animationState.showColParity;
                return (
                  <div key={`col-${col}`} className="w-12 h-6 flex items-center justify-center">
                    {showLabel && (
                      <span className={`text-xs font-medium ${hasOddParity ? 'text-red-500' : 'text-foreground'}`}>
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Spacer matching the row labels width */}
            {(animationState.currentRow >= 0 || animationState.showRowParity) && (
              <div className="w-12" />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Parity Bits Error Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <Alert className="border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950/30">
            <AlertDescription className="text-yellow-900 dark:text-yellow-200 font-medium">
              {phase === 'setup' && 'Set your grid by clicking squares to make them black. Then add parity bits.'}
              {phase === 'parity' && 'Parity bits added! Now flip exactly one bit anywhere in the grid.'}
              {phase === 'flip' && 'Bit flipped! Click "Identify Flip" to see error detection in action.'}
              {phase === 'detect' && 'Animation complete! Rows and columns with odd parity were highlighted, revealing the error location in green.'}
            </AlertDescription>
          </Alert>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="grid-size" className="text-sm font-medium whitespace-nowrap">
                Grid Size: {gridSize}×{gridSize}
              </label>
              <Slider
                id="grid-size"
                min={2}
                max={10}
                step={1}
                value={[gridSize]}
                onValueChange={handleGridSizeChange}
                className="w-24"
                disabled={phase !== 'setup'}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={addParityBits}
                disabled={phase !== 'setup'}
                variant={phase === 'setup' ? 'default' : 'outline'}
                className="!h-10 !min-h-10 rounded-full !px-6"
              >
                Add Parity Bits
              </Button>

              <Button
                onClick={randomStart}
                disabled={phase !== 'setup'}
                variant="outline"
              >
                Random Start
              </Button>

              <Button
                onClick={identifyFlip}
                disabled={phase !== 'flip' || animationState.isAnimating}
                variant={phase === 'flip' ? 'default' : 'outline'}
                className="!h-10 !min-h-10 rounded-full !px-6"
              >
                {animationState.isAnimating ? 'Checking...' : 'Identify Flip'}
              </Button>

              <Button
                onClick={resetGame}
                variant="outline"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex justify-center">
            {renderGrid()}
          </div>

          {/* Status Information */}
          {parityBitsAdded && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Parity cells have dashed borders. Each row and column should have an even number of black squares.
              </p>
              {flippedCell && (
                <p className="text-sm text-white">
                  Flipped bit at position ({flippedCell.row + 1}, {flippedCell.col + 1})
                </p>
              )}
              {errorDetected && (
                <p className="text-sm text-green-600 font-medium">
                  Error detected at position ({errorDetected.row + 1}, {errorDetected.col + 1}) - highlighted in green!
                </p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p><strong>How it works:</strong> Parity bits ensure even parity in each row/column.</p>
            <p>When a bit flips, the affected row and column will have odd parity, pinpointing the error.</p>
          </div>

          {/* Social Share */}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParityBitsGame;