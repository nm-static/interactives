import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronDown, ChevronUp, Shuffle, Lightbulb } from 'lucide-react';

interface Domino {
  id: number;
  row: number;
  col: number;
  isHorizontal: boolean;
}

interface DominoRetilingPuzzleProps {
}

const DominoRetilingPuzzle: React.FC<DominoRetilingPuzzleProps> = () => {
  const [boardSize, setBoardSize] = useState(8);
  const [dominoes, setDominoes] = useState<Domino[]>([]);
  const [selectedDomino, setSelectedDomino] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hoverPlacement, setHoverPlacement] = useState<{ row: number; col: number; isHorizontal: boolean } | null>(null);

  const BOARD_ROWS = boardSize;
  const BOARD_COLS = boardSize + 1; // n + 1 extra square on top row

  // Generate a random valid tiling of the n×n board using backtracking
  const generateRandomTiling = useCallback(() => {
    const newDominoes: Domino[] = [];
    const occupied = new Set<string>();
    let dominoId = 0;

    // Helper to find first uncovered cell
    const findFirstUncovered = (): { row: number; col: number } | null => {
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          if (!occupied.has(`${row},${col}`)) {
            return { row, col };
          }
        }
      }
      return null;
    };

    // Greedy fill with backtracking if needed
    while (true) {
      const cell = findFirstUncovered();
      if (!cell) break; // All covered

      const { row, col } = cell;
      
      // Try to place a domino here
      const canHorizontal = col + 1 < boardSize && !occupied.has(`${row},${col + 1}`);
      const canVertical = row + 1 < boardSize && !occupied.has(`${row + 1},${col}`);

      if (!canHorizontal && !canVertical) {
        // Stuck - this shouldn't happen with even board sizes, but reset if it does
        newDominoes.length = 0;
        occupied.clear();
        dominoId = 0;
        continue;
      }

      let isHorizontal: boolean;
      if (canHorizontal && canVertical) {
        isHorizontal = Math.random() > 0.5;
      } else {
        isHorizontal = canHorizontal;
      }

      newDominoes.push({
        id: dominoId++,
        row,
        col,
        isHorizontal
      });

      occupied.add(`${row},${col}`);
      if (isHorizontal) {
        occupied.add(`${row},${col + 1}`);
      } else {
        occupied.add(`${row + 1},${col}`);
      }
    }

    setDominoes(newDominoes);
    setSelectedDomino(null);
    setMoveCount(0);
    setHoverPlacement(null);
  }, [boardSize]);

  useEffect(() => {
    generateRandomTiling();
  }, [generateRandomTiling]);

  // Get all cells occupied by dominoes
  const getOccupiedCells = useCallback((excludeDominoId?: number): Set<string> => {
    const occupied = new Set<string>();
    dominoes.forEach(d => {
      if (d.id === excludeDominoId) return;
      occupied.add(`${d.row},${d.col}`);
      if (d.isHorizontal) {
        occupied.add(`${d.row},${d.col + 1}`);
      } else {
        occupied.add(`${d.row + 1},${d.col}`);
      }
    });
    return occupied;
  }, [dominoes]);

  // Check if a position is valid for the augmented board
  const isValidCell = useCallback((row: number, col: number): boolean => {
    if (row < 0 || row >= BOARD_ROWS) return false;
    if (row === 0) return col >= 0 && col < BOARD_COLS;
    return col >= 0 && col < boardSize;
  }, [BOARD_ROWS, BOARD_COLS, boardSize]);

  // Check if we can place a domino at a position
  const canPlaceDomino = useCallback((row: number, col: number, isHorizontal: boolean, excludeDominoId: number): boolean => {
    const cell1Row = row;
    const cell1Col = col;
    const cell2Row = isHorizontal ? row : row + 1;
    const cell2Col = isHorizontal ? col + 1 : col;

    if (!isValidCell(cell1Row, cell1Col) || !isValidCell(cell2Row, cell2Col)) return false;

    const occupied = getOccupiedCells(excludeDominoId);
    return !occupied.has(`${cell1Row},${cell1Col}`) && !occupied.has(`${cell2Row},${cell2Col}`);
  }, [getOccupiedCells]);

  // Handle clicking on a domino
  const handleDominoClick = (dominoId: number) => {
    if (selectedDomino === dominoId) {
      setSelectedDomino(null);
      setHoverPlacement(null);
    } else {
      setSelectedDomino(dominoId);
      setHoverPlacement(null);
    }
  };

  // Handle clicking on a valid placement
  const handlePlacementClick = (row: number, col: number, isHorizontal: boolean) => {
    if (selectedDomino === null) return;

    setDominoes(prev => prev.map(d => 
      d.id === selectedDomino 
        ? { ...d, row, col, isHorizontal }
        : d
    ));
    setSelectedDomino(null);
    setHoverPlacement(null);
    setMoveCount(prev => prev + 1);
  };

  // Handle cell hover
  const handleCellHover = (row: number, col: number) => {
    if (selectedDomino === null) return;

    // Check all possible placements where this cell could be part of a domino
    // A domino can be placed with this cell as the first cell, or as the second cell
    
    // Horizontal placements: domino at (row, col) or (row, col-1)
    const canH_start = canPlaceDomino(row, col, true, selectedDomino);
    const canH_end = col > 0 && canPlaceDomino(row, col - 1, true, selectedDomino);
    
    // Vertical placements: domino at (row, col) or (row-1, col)
    const canV_start = canPlaceDomino(row, col, false, selectedDomino);
    const canV_end = row > 0 && canPlaceDomino(row - 1, col, false, selectedDomino);

    // Prioritize: horizontal starting here, horizontal ending here, vertical starting here, vertical ending here
    if (canH_start) {
      setHoverPlacement({ row, col, isHorizontal: true });
    } else if (canH_end) {
      setHoverPlacement({ row, col: col - 1, isHorizontal: true });
    } else if (canV_start) {
      setHoverPlacement({ row, col, isHorizontal: false });
    } else if (canV_end) {
      setHoverPlacement({ row: row - 1, col, isHorizontal: false });
    } else {
      setHoverPlacement(null);
    }
  };

  // Check if puzzle is solved (all dominoes horizontal)
  const isSolved = dominoes.length > 0 && dominoes.every(d => d.isHorizontal);

  // Get domino color based on orientation
  const getDominoColor = (isHorizontal: boolean): string => {
    if (isHorizontal) return 'bg-emerald-500 border-emerald-700';
    return 'bg-rose-400 border-rose-600';
  };

  const cellSize = Math.max(32, Math.min(44, 480 / boardSize));

  // Render the board
  const renderBoard = () => {
    const cells: JSX.Element[] = [];

    // Render the inaccessible shaded region (last column except top cell)
    for (let row = 1; row < BOARD_ROWS; row++) {
      cells.push(
        <div
          key={`inaccessible-${row}`}
          className="border border-border/30"
          style={{
            position: 'absolute',
            left: boardSize * cellSize,
            top: row * cellSize,
            width: cellSize,
            height: cellSize,
            backgroundColor: 'rgba(100, 100, 100, 0.3)',
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(80, 80, 80, 0.4) 4px, rgba(80, 80, 80, 0.4) 8px)',
          }}
        />
      );
    }

    // Render cells
    for (let row = 0; row < BOARD_ROWS; row++) {
      const maxCol = row === 0 ? BOARD_COLS : boardSize;
      for (let col = 0; col < maxCol; col++) {
        const isExtraSquare = row === 0 && col === boardSize;

        const cellStyle: React.CSSProperties = {
          position: 'absolute',
          left: col * cellSize,
          top: row * cellSize,
          width: cellSize,
          height: cellSize,
        };

        cells.push(
          <div
            key={`cell-${row}-${col}`}
            className={`border border-border/50 ${
              isExtraSquare 
                ? 'bg-blue-400/50' 
                : (row + col) % 2 === 0 ? 'bg-muted/30' : 'bg-muted/60'
            } ${selectedDomino !== null ? 'cursor-pointer' : ''}`}
            style={cellStyle}
            onMouseEnter={() => handleCellHover(row, col)}
            onMouseLeave={() => setHoverPlacement(null)}
            onClick={() => {
              if (hoverPlacement && hoverPlacement.row === row && hoverPlacement.col === col) {
                handlePlacementClick(hoverPlacement.row, hoverPlacement.col, hoverPlacement.isHorizontal);
              }
            }}
          />
        );
      }
    }

    // Render dominoes (except selected one)
    dominoes.forEach(d => {
      if (d.id === selectedDomino) return; // Hide selected domino
      
      const width = d.isHorizontal ? cellSize * 2 - 4 : cellSize - 4;
      const height = d.isHorizontal ? cellSize - 4 : cellSize * 2 - 4;

      cells.push(
        <div
          key={`domino-${d.id}`}
          className={`absolute rounded border-2 cursor-pointer transition-all z-20 ${getDominoColor(d.isHorizontal)} hover:brightness-110`}
          style={{
            left: d.col * cellSize + 2,
            top: d.row * cellSize + 2,
            width,
            height,
          }}
          onClick={() => handleDominoClick(d.id)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full ${d.isHorizontal ? 'bg-emerald-700' : 'bg-rose-700'}`} />
          </div>
        </div>
      );
    });

    // Render hover preview domino
    if (hoverPlacement && selectedDomino !== null) {
      const width = hoverPlacement.isHorizontal ? cellSize * 2 - 4 : cellSize - 4;
      const height = hoverPlacement.isHorizontal ? cellSize - 4 : cellSize * 2 - 4;

      cells.push(
        <div
          key="hover-preview"
          className="absolute rounded border-2 cursor-pointer z-30 bg-amber-400 border-amber-600 opacity-80 hover:opacity-100 transition-opacity"
          style={{
            left: hoverPlacement.col * cellSize + 2,
            top: hoverPlacement.row * cellSize + 2,
            width,
            height,
            pointerEvents: 'none',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-amber-700" />
          </div>
        </div>
      );
    }

    return cells;
  };

  const horizontalCount = dominoes.filter(d => d.isHorizontal).length;
  const verticalCount = dominoes.filter(d => !d.isHorizontal).length;

  const numDominoes = (boardSize * boardSize) / 2;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Domino Retiling Puzzle
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Can you retile the augmented board so all dominoes are horizontal?
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              A {boardSize}×{boardSize} board is tiled with {numDominoes} dominoes. An extra square is added to the top-right. 
              Move dominoes one at a time to make all dominoes horizontal.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 items-center">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Board Size: {boardSize}×{boardSize}</label>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="2"
                  value={boardSize}
                  onChange={(e) => setBoardSize(parseInt(e.target.value))}
                  className="w-24 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <Button onClick={generateRandomTiling} variant="outline" size="sm">
                <Shuffle className="w-4 h-4 mr-2" />
                New Puzzle
              </Button>
              <Button onClick={() => setShowHint(!showHint)} variant="outline" size="sm">
                <Lightbulb className="w-4 h-4 mr-2" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
            </div>

            <div className="flex justify-center items-center gap-4 flex-wrap">
              <Badge variant="outline" className="text-sm">
                Moves: {moveCount}
              </Badge>
              <Badge variant="outline" className="text-sm bg-emerald-100 text-emerald-800 border-emerald-300">
                Horizontal: {horizontalCount}
              </Badge>
              <Badge variant="outline" className="text-sm bg-rose-100 text-rose-800 border-rose-300">
                Vertical: {verticalCount}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {showHint && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Hint:</p>
                <p>Consider the coloring argument: in a standard chessboard coloring, each horizontal domino covers one black and one white square. 
                But on the augmented board (8×8 + 1 extra square), the parity changes. Think about what this means for the possibility of an all-horizontal tiling!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Instructions</CardTitle>
            {showInstructions ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showInstructions && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Click on a domino to pick it up (it disappears from the board)</li>
                <li>Hover over empty cells to see where you can place it</li>
                <li>Click to place the domino in the highlighted position</li>
                <li>You can only move a domino if there are two adjacent empty squares to receive it</li>
                <li>Goal: Make all {numDominoes} dominoes horizontal</li>
              </ul>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span>Horizontal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-rose-400" />
                  <span>Vertical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-400" />
                  <span>Selected</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Board */}
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div 
              className="relative bg-background rounded-lg border border-border shadow-sm p-3"
            >
              <div
                className="relative"
                style={{
                  width: BOARD_COLS * cellSize,
                  height: BOARD_ROWS * cellSize,
                }}
              >
                {renderBoard()}
              </div>
            </div>
          </div>
          {selectedDomino !== null && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Domino picked up. Hover over empty cells to preview placement, then click to place.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {isSolved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Wait... You solved it? That shouldn't be possible!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Actually, this puzzle is impossible to solve! The extra square creates a parity imbalance that prevents an all-horizontal tiling.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Share */}
    </div>
  );
};

export default DominoRetilingPuzzle;