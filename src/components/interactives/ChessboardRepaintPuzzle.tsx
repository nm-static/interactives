import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RefreshCw, RotateCcw, BookOpen, Trophy, CheckCircle, ExternalLink } from 'lucide-react';

const ChessboardRepaintPuzzle = () => {
  // Initialize 8x8 chessboard with alternating colors
  const initializeBoard = (): boolean[][] => {
    const board: boolean[][] = [];
    for (let row = 0; row < 8; row++) {
      board[row] = [];
      for (let col = 0; col < 8; col++) {
        // true = black, false = white
        board[row][col] = (row + col) % 2 === 0;
      }
    }
    return board;
  };

  const [board, setBoard] = useState<boolean[][]>(initializeBoard);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const resetPuzzle = () => {
    setBoard(initializeBoard());
    setMoves(0);
    setIsComplete(false);
    setShowVictory(false);
  };

  const countBlackSquares = (board: boolean[][]): number => {
    return board.flat().filter(square => square).length;
  };

  const repaintRow = (rowIndex: number) => {
    const newBoard = board.map(row => [...row]);
    for (let col = 0; col < 8; col++) {
      newBoard[rowIndex][col] = !newBoard[rowIndex][col];
    }
    setBoard(newBoard);
    setMoves(moves + 1);
    
    const blackCount = countBlackSquares(newBoard);
    if (blackCount === 1) {
      setIsComplete(true);
      setShowVictory(true);
    }
  };

  const repaintColumn = (colIndex: number) => {
    const newBoard = board.map(row => [...row]);
    for (let row = 0; row < 8; row++) {
      newBoard[row][colIndex] = !newBoard[row][colIndex];
    }
    setBoard(newBoard);
    setMoves(moves + 1);
    
    const blackCount = countBlackSquares(newBoard);
    if (blackCount === 1) {
      setIsComplete(true);
      setShowVictory(true);
    }
  };

  const repaint2x2Square = (startRow: number, startCol: number) => {
    const newBoard = board.map(row => [...row]);
    for (let row = startRow; row < startRow + 2 && row < 8; row++) {
      for (let col = startCol; col < startCol + 2 && col < 8; col++) {
        newBoard[row][col] = !newBoard[row][col];
      }
    }
    setBoard(newBoard);
    setMoves(moves + 1);
    
    const blackCount = countBlackSquares(newBoard);
    if (blackCount === 1) {
      setIsComplete(true);
      setShowVictory(true);
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (isComplete) return;
    
    // Special case for bottom-right corner
    if (row === 7 && col === 7) {
      if (bottomRightMode === 'row') {
        repaintRow(7);
      } else {
        repaintColumn(7);
      }
      return;
    }
    
    // If clicking on the rightmost column, repaint the entire row
    if (col === 7) {
      repaintRow(row);
      return;
    }
    
    // If clicking on the bottom row, repaint the entire column
    if (row === 7) {
      repaintColumn(col);
      return;
    }
    
    // Otherwise, repaint the 2x2 square with this square as top-left
    repaint2x2Square(row, col);
  };

  const handleBottomRightHover = () => {
    // Clear any existing timer
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    
    // Set a new timer to switch mode after 3 seconds
    const timer = setTimeout(() => {
      setBottomRightMode(prev => prev === 'row' ? 'column' : 'row');
    }, 3000);
    
    setHoverTimer(timer);
  };

  const handleBottomRightLeave = () => {
    // Clear the timer when leaving the square
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  const [hoveredSquare, setHoveredSquare] = useState<{row: number, col: number} | null>(null);
  const [bottomRightMode, setBottomRightMode] = useState<'row' | 'column'>('row');
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  const getAffectedSquares = (row: number, col: number) => {
    const squares: {row: number, col: number}[] = [];
    
    // Special case for bottom-right corner
    if (row === 7 && col === 7) {
      if (bottomRightMode === 'row') {
        for (let c = 0; c < 8; c++) {
          squares.push({row: 7, col: c});
        }
      } else {
        for (let r = 0; r < 8; r++) {
          squares.push({row: r, col: 7});
        }
      }
      return squares;
    }
    
    // If clicking on the rightmost column, repaint the entire row
    if (col === 7) {
      for (let c = 0; c < 8; c++) {
        squares.push({row, col: c});
      }
      return squares;
    }
    
    // If clicking on the bottom row, repaint the entire column
    if (row === 7) {
      for (let r = 0; r < 8; r++) {
        squares.push({row: r, col});
      }
      return squares;
    }
    
    // Otherwise, repaint the 2x2 square with this square as top-left
    for (let r = row; r < row + 2 && r < 8; r++) {
      for (let c = col; c < col + 2 && c < 8; c++) {
        squares.push({row: r, col: c});
      }
    }
    return squares;
  };

  const getBoundingBox = (squares: {row: number, col: number}[]) => {
    if (squares.length === 0) return null;
    
    const minRow = Math.min(...squares.map(s => s.row));
    const maxRow = Math.max(...squares.map(s => s.row));
    const minCol = Math.min(...squares.map(s => s.col));
    const maxCol = Math.max(...squares.map(s => s.col));
    
    return { minRow, maxRow, minCol, maxCol };
  };

  const renderSquare = (row: number, col: number) => {
    const isBlack = board[row][col];
    const isBottomRow = row === 7;
    const isRightmostCol = col === 7;
    const isBottomRight = row === 7 && col === 7;
    
    return (
      <div
        key={`${row}-${col}`}
        onClick={() => handleSquareClick(row, col)}
        onMouseEnter={() => {
          setHoveredSquare({row, col});
          if (isBottomRight) {
            handleBottomRightHover();
          }
        }}
        onMouseLeave={() => {
          setHoveredSquare(null);
          if (isBottomRight) {
            handleBottomRightLeave();
          }
        }}
        className={`
          w-12 h-12 border border-gray-300 flex items-center justify-center cursor-pointer
          transition-all duration-200 hover:scale-105
          ${isBlack ? 'bg-gray-800' : 'bg-gray-100'}
        `}
        title={isBottomRight ? `Hover for 3s to switch mode (current: ${bottomRightMode})` : undefined}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl">
            <RefreshCw className="w-8 h-8 text-blue-500" />
            Chessboard Repaint Puzzle
            <RefreshCw className="w-8 h-8 text-blue-500" />
          </CardTitle>
          <CardDescription className="text-lg max-w-2xl mx-auto">
            Repaint rows, columns, or 2×2 squares to achieve exactly one black square!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Game Controls */}
          <div className="flex justify-center items-center gap-4">
            <Button onClick={() => setShowRules(true)} variant="outline" size="lg" className="px-8">
              <BookOpen className="w-4 h-4 mr-2" />
              Rules
            </Button>
            <Button onClick={resetPuzzle} variant="outline" size="lg" className="px-8">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Puzzle
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Moves:</span>
              <Badge className="text-lg px-4 py-2 bg-blue-600 text-white">
                {moves}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Black Squares:</span>
              <Badge className={`text-lg px-4 py-2 ${countBlackSquares(board) === 1 ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
                {countBlackSquares(board)}
              </Badge>
            </div>
          </div>

          {/* Chessboard */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Chessboard grid */}
              <div className="grid grid-cols-8 gap-0 border-2 border-gray-400">
                {board.map((row, rowIndex) =>
                  row.map((square, colIndex) => renderSquare(rowIndex, colIndex))
                )}
              </div>
              
              {/* Bounding rectangle overlay */}
              {hoveredSquare && (() => {
                const boundingBox = getBoundingBox(getAffectedSquares(hoveredSquare.row, hoveredSquare.col));
                if (!boundingBox) return null;
                
                const squareSize = 48; // w-12 = 48px
                const left = boundingBox.minCol * squareSize;
                const top = boundingBox.minRow * squareSize;
                const width = (boundingBox.maxCol - boundingBox.minCol + 1) * squareSize;
                const height = (boundingBox.maxRow - boundingBox.minRow + 1) * squareSize;
                
                return (
                  <div
                    className="absolute pointer-events-none border-2 border-red-500 bg-red-500 bg-opacity-10"
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                    }}
                  />
                );
              })()}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center mt-8">
            <div className="inline-block bg-gray-50 px-6 py-3 rounded-lg border">
              <p className="text-sm text-gray-700 font-medium">
                {isComplete ? (
                  "🎉 Congratulations! You achieved exactly one black square!"
                ) : (
                  "Click any square to repaint the 2×2 region with that square as top-left. Click rightmost column to repaint entire row, or bottom row to repaint entire column. Bottom-right corner switches between row/column mode on 3s hover. Hover to preview affected squares!"
                )}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3 mt-8">
            <h3 className="font-semibold text-lg text-center">Legend</h3>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-100 border border-gray-300"></div>
                <span>White square</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-800 border border-gray-300"></div>
                <span>Black square</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-red-500"></div>
                <span>Hover to preview affected squares</span>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Dialog */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Chessboard Repaint Puzzle Rules
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-lg">Objective</h4>
              <p className="text-gray-700">You start with a standard 8×8 chessboard with alternating black and white squares. Repaint the chessboard to achieve exactly one black square.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">How to Play</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-700">
                <li><strong>Repaint a 2×2 square:</strong> Click any square to flip all four squares in the 2×2 region with that square as the top-left corner.</li>
                <li><strong>Repaint a row:</strong> Click any square in the rightmost column to flip all squares in that entire row.</li>
                <li><strong>Repaint a column:</strong> Click any square in the bottom row to flip all squares in that entire column.</li>
                <li><strong>Bottom-right corner:</strong> Hover for 3 seconds to switch between row and column mode.</li>
                <li><strong>Preview:</strong> Hover over any square to see which squares will be affected.</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">Rules</h4>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                <li>You can repaint any row, any column, or any 2×2 square; each click counts as one move.</li>
                <li>The puzzle is solved when exactly one square is black.</li>
                <li>Try to solve it in as few moves as possible!</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">Strategy Tips</h4>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                <li>Think about parity - how do different operations affect the total number of black squares?</li>
                <li>Consider the effect of each operation on the overall pattern</li>
                <li>Remember that flipping a row or column affects 8 squares, while flipping a 2×2 affects 4 squares</li>
                <li>Look for patterns in how the operations interact with each other</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Victory Dialog */}
      <Dialog open={showVictory} onOpenChange={setShowVictory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Puzzle Solved!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <span className="text-2xl font-bold text-green-600">
                Congratulations!
              </span>
            </div>
            <p className="text-gray-600 text-lg">
              You solved the puzzle in {moves} moves!
            </p>
            {moves > 5 && (
              <p className="text-blue-600 font-medium">
                Can you solve it in fewer moves?
              </p>
            )}
            <Button onClick={resetPuzzle} className="w-full" size="lg">
              Play Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attribution */}
      <div className="pt-4 border-t border-outline">
        <p className="text-xs text-muted-foreground">
          ⚠️ Spoiler: This solution to this puzzle leverages a parity-based invariant.
        </p>
      </div>

      {/* Social Share Section */}
    </div>
  );
};

export default ChessboardRepaintPuzzle; 