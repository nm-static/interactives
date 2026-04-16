import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, RotateCcw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
type Piece = 'white' | 'black' | null;
type Position = {
  row: number;
  col: number;
};

const KnightsPuzzle = () => {
  // Initial state: white knights at top corners, black knights at bottom corners
  const initialBoard: Piece[][] = [['white', null, 'white'], [null, null, null], ['black', null, 'black']];

  // Target state: black knights at top corners, white knights at bottom corners
  const targetBoard: Piece[][] = [['black', null, 'black'], [null, null, null], ['white', null, 'white']];
  const [board, setBoard] = useState<Piece[][]>(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [moveHistory, setMoveHistory] = useState<Position[][]>([]);

  // Knight move offsets
  const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const isValidPosition = (row: number, col: number): boolean => {
    return row >= 0 && row < 3 && col >= 0 && col < 3;
  };
  const getValidMoves = (fromRow: number, fromCol: number): Position[] => {
    const validMoves: Position[] = [];
    knightMoves.forEach(([dRow, dCol]) => {
      const newRow = fromRow + dRow;
      const newCol = fromCol + dCol;
      if (isValidPosition(newRow, newCol) && board[newRow][newCol] === null) {
        validMoves.push({
          row: newRow,
          col: newCol
        });
      }
    });
    return validMoves;
  };
  const isValidMove = (from: Position, to: Position): boolean => {
    const rowDiff = Math.abs(from.row - to.row);
    const colDiff = Math.abs(from.col - to.col);
    return rowDiff === 2 && colDiff === 1 || rowDiff === 1 && colDiff === 2;
  };
  const checkWinCondition = (currentBoard: Piece[][]): boolean => {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (currentBoard[row][col] !== targetBoard[row][col]) {
          return false;
        }
      }
    }
    return true;
  };
  const handleSquareClick = (row: number, col: number) => {
    const piece = board[row][col];
    if (selectedSquare) {
      const from = selectedSquare;
      const to = {
        row,
        col
      };

      // If clicking on the same square, deselect
      if (from.row === to.row && from.col === to.col) {
        setSelectedSquare(null);
        return;
      }

      // If clicking on an empty square and it's a valid knight move
      if (piece === null && isValidMove(from, to)) {
        const newBoard = board.map(r => [...r]);
        const movingPiece = newBoard[from.row][from.col];
        newBoard[from.row][from.col] = null;
        newBoard[to.row][to.col] = movingPiece;
        setBoard(newBoard);
        setMoveCount(moveCount + 1);
        setMoveHistory([...moveHistory, [from, to]]);
        setSelectedSquare(null);

        // Check win condition
        if (checkWinCondition(newBoard)) {
          setIsComplete(true);
          toast.success(`Puzzle solved in ${moveCount + 1} moves!`);
        }
      } else if (piece !== null) {
        // Select a different piece
        setSelectedSquare({
          row,
          col
        });
      } else {
        setSelectedSquare(null);
      }
    } else if (piece !== null) {
      // Select a piece
      setSelectedSquare({
        row,
        col
      });
    }
  };
  const resetPuzzle = () => {
    setBoard(initialBoard);
    setSelectedSquare(null);
    setMoveCount(0);
    setIsComplete(false);
    setMoveHistory([]);
  };
  const undoLastMove = () => {
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    const [from, to] = lastMove;
    const newBoard = board.map(r => [...r]);
    const movingPiece = newBoard[to.row][to.col];
    newBoard[to.row][to.col] = null;
    newBoard[from.row][from.col] = movingPiece;
    setBoard(newBoard);
    setMoveCount(moveCount - 1);
    setMoveHistory(moveHistory.slice(0, -1));
    setSelectedSquare(null);
    setIsComplete(false);
  };
  const getSquareClass = (row: number, col: number): string => {
    const baseClass = "w-16 h-16 border-2 border-outline flex items-center justify-center cursor-pointer transition-all duration-200";
    const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
    const validMoves = selectedSquare ? getValidMoves(selectedSquare.row, selectedSquare.col) : [];
    const isValidMoveTarget = validMoves.some(move => move.row === row && move.col === col);
    let bgClass = (row + col) % 2 === 0 ? "bg-surface" : "bg-surface-variant";
    if (isSelected) {
      bgClass = "bg-accent";
    } else if (isValidMoveTarget) {
      bgClass = "bg-accent/30 ring-2 ring-accent";
    }
    return `${baseClass} ${bgClass}`;
  };
  const renderPiece = (piece: Piece) => {
    if (piece === 'white') {
      return <span className="text-4xl">♘</span>;
    } else if (piece === 'black') {
      return <span className="text-4xl">♞</span>;
    }
    return null;
  };
  return <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Title and Description - Centered */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Knights Exchange Puzzle</h1>
        <p className="text-muted-foreground">
          Can the black and white knights swap places using legal chess moves? Move knights by clicking on them, then clicking on a valid destination.
        </p>
      </div>

      {/* Blue and Orange: Moves (left) and Status (right) on same line */}
      <div className="flex justify-between items-center text-lg">
        <div>
          <span className="font-semibold">Moves: </span>
          <span className="font-mono text-primary">{moveCount}</span>
        </div>
        <div className="font-semibold">
          {isComplete ? "🎉 Puzzle Solved!" : "🎯 In Progress"}
        </div>
      </div>

      {/* Interactive and Goal State side by side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Interactive game */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="grid grid-cols-3 gap-1 border-2 border-outline rounded-lg p-4 bg-background">
                {board.map((row, rowIndex) => row.map((piece, colIndex) => <div key={`${rowIndex}-${colIndex}`} className={getSquareClass(rowIndex, colIndex)} onClick={() => handleSquareClick(rowIndex, colIndex)}>
                      {renderPiece(piece)}
                    </div>))}
              </div>
              
              {/* Controls */}
              <div className="flex gap-2">
                <Button onClick={resetPuzzle} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={undoLastMove} variant="outline" size="sm" disabled={moveHistory.length === 0}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Undo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Goal state */}
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="grid grid-cols-3 gap-1 border-2 border-outline rounded-lg p-4 bg-background">
                {targetBoard.map((row, rowIndex) => row.map((piece, colIndex) => <div key={`goal-${rowIndex}-${colIndex}`} className="w-16 h-16 border-2 border-outline flex items-center justify-center bg-surface">
                      {renderPiece(piece)}
                    </div>))}
              </div>
              
              {/* Goal label */}
              <div className="text-center">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Goal State</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purple: Initial and Target positions side by side */}
      <div className="grid grid-cols-2 gap-6">
        

        
      </div>

      {/* Red: Game rules */}
      <Card className="bg-destructive/5 border-destructive/20">
        <CardHeader className="pb-3">
          
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Click on a knight to select it, valid moves will be highlighted. Click on a highlighted square to move the knight to said square (knights move in an L-shape, like in chess).

          </li>
            
            
            <li>Goal: Swap white and black knights</li>
            
          </ul>
        </CardContent>
      </Card>

      {/* Attribution */}
      <div className="pt-4 border-t border-outline">
        <p className="text-xs text-muted-foreground">
          Puzzle source:{" "}
          <a href="https://bsky.app/profile/neuwirthe.bsky.social/post/3luhmc7gilc2x" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
            @neuwirthe.bsky.social
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      {/* Social Share Section */}
    </div>;
};
export default KnightsPuzzle;