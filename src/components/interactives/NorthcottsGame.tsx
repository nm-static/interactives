import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Shuffle } from 'lucide-react';

interface GameState {
  board: ('L' | 'R' | null)[][];
  currentPlayer: 'L' | 'R';
  gameOver: boolean;
  winner: 'L' | 'R' | null;
  rows: number;
  cols: number;
  misereMode: boolean;
  cleanStart: boolean;
  forwardOnly: boolean;
  gameStarted: boolean;
  selectedPiece: { row: number; col: number } | null;
}

interface NorthcottsGameProps {
}

const NorthcottsGame: React.FC<NorthcottsGameProps> = () => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: Array(3).fill(null).map(() => Array(6).fill(null)),
    currentPlayer: 'L',
    gameOver: false,
    winner: null,
    rows: 3,
    cols: 6,
    misereMode: false,
    cleanStart: false,
    forwardOnly: true,
    gameStarted: false,
    selectedPiece: null
  }));

  function initializeGame(rows: number, cols: number, misereMode: boolean, cleanStart: boolean, forwardOnly: boolean): GameState {
    const board: ('L' | 'R' | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
    
    if (cleanStart) {
      // Clean start: all L on left, all R on right
      for (let row = 0; row < rows; row++) {
        board[row][0] = 'L';
        board[row][cols - 1] = 'R';
      }
    } else {
      // Random positions ensuring L is to the left of R
      for (let row = 0; row < rows; row++) {
        const lPos = Math.floor(Math.random() * (cols - 1));
        const rPos = lPos + 1 + Math.floor(Math.random() * (cols - lPos - 1));
        
        board[row][lPos] = 'L';
        board[row][rPos] = 'R';
      }
    }

    return {
      board,
      currentPlayer: 'L',
      gameOver: false,
      winner: null,
      rows,
      cols,
      misereMode,
      cleanStart,
      forwardOnly,
      gameStarted: true,
      selectedPiece: null
    };
  }

  const getValidMoves = (row: number, col: number, player: 'L' | 'R'): number[] => {
    const moves: number[] = [];
    const { board, forwardOnly } = gameState;
    
    if (player === 'L') {
      // L can move right (forward towards R)
      for (let newCol = col + 1; newCol < gameState.cols; newCol++) {
        if (board[row][newCol] === 'R') break; // Can't jump over R
        if (board[row][newCol] === null) moves.push(newCol);
      }
      
      // L can also move left (backward) if forwardOnly is false
      if (!forwardOnly) {
        for (let newCol = col - 1; newCol >= 0; newCol--) {
          if (board[row][newCol] === 'R') break; // Can't jump over R
          if (board[row][newCol] === null) moves.push(newCol);
        }
      }
    } else {
      // R can move left (forward towards L)
      for (let newCol = col - 1; newCol >= 0; newCol--) {
        if (board[row][newCol] === 'L') break; // Can't jump over L
        if (board[row][newCol] === null) moves.push(newCol);
      }
      
      // R can also move right (backward) if forwardOnly is false
      if (!forwardOnly) {
        for (let newCol = col + 1; newCol < gameState.cols; newCol++) {
          if (board[row][newCol] === 'L') break; // Can't jump over L
          if (board[row][newCol] === null) moves.push(newCol);
        }
      }
    }
    
    return moves;
  };

  const hasAnyMoves = (player: 'L' | 'R'): boolean => {
    const { board } = gameState;
    for (let row = 0; row < gameState.rows; row++) {
      for (let col = 0; col < gameState.cols; col++) {
        if (board[row][col] === player) {
          if (getValidMoves(row, col, player).length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameState.gameOver || !gameState.gameStarted) return;

    const { board, currentPlayer, selectedPiece } = gameState;
    
    if (selectedPiece) {
      // Try to move selected piece
      const validMoves = getValidMoves(selectedPiece.row, selectedPiece.col, currentPlayer);
      
      if (validMoves.includes(col) && row === selectedPiece.row) {
        // Valid move
        const newBoard = board.map(r => [...r]);
        newBoard[selectedPiece.row][selectedPiece.col] = null;
        newBoard[row][col] = currentPlayer;
        
        const nextPlayer = currentPlayer === 'L' ? 'R' : 'L';
        const hasMovesNext = hasAnyMovesForBoard(newBoard, nextPlayer);
        
        setGameState({
          ...gameState,
          board: newBoard,
          currentPlayer: nextPlayer,
          selectedPiece: null,
          gameOver: !hasMovesNext,
          winner: !hasMovesNext ? (gameState.misereMode ? nextPlayer : currentPlayer) : null
        });
      } else {
        // Invalid move or selecting different piece
        if (board[row][col] === currentPlayer) {
          setGameState({ ...gameState, selectedPiece: { row, col } });
        } else {
          setGameState({ ...gameState, selectedPiece: null });
        }
      }
    } else {
      // Select piece
      if (board[row][col] === currentPlayer) {
        setGameState({ ...gameState, selectedPiece: { row, col } });
      }
    }
  };

  const hasAnyMovesForBoard = (board: ('L' | 'R' | null)[][], player: 'L' | 'R'): boolean => {
    for (let row = 0; row < gameState.rows; row++) {
      for (let col = 0; col < gameState.cols; col++) {
        if (board[row][col] === player) {
          const moves = getValidMovesForBoard(board, row, col, player);
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  };

  const getValidMovesForBoard = (board: ('L' | 'R' | null)[][], row: number, col: number, player: 'L' | 'R'): number[] => {
    const moves: number[] = [];
    const { forwardOnly } = gameState;
    
    if (player === 'L') {
      // L can move right (forward towards R)
      for (let newCol = col + 1; newCol < gameState.cols; newCol++) {
        if (board[row][newCol] === 'R') break;
        if (board[row][newCol] === null) moves.push(newCol);
      }
      
      // L can also move left (backward) if forwardOnly is false
      if (!forwardOnly) {
        for (let newCol = col - 1; newCol >= 0; newCol--) {
          if (board[row][newCol] === 'R') break;
          if (board[row][newCol] === null) moves.push(newCol);
        }
      }
    } else {
      // R can move left (forward towards L)
      for (let newCol = col - 1; newCol >= 0; newCol--) {
        if (board[row][newCol] === 'L') break;
        if (board[row][newCol] === null) moves.push(newCol);
      }
      
      // R can also move right (backward) if forwardOnly is false
      if (!forwardOnly) {
        for (let newCol = col + 1; newCol < gameState.cols; newCol++) {
          if (board[row][newCol] === 'L') break;
          if (board[row][newCol] === null) moves.push(newCol);
        }
      }
    }
    
    return moves;
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      board: Array(prev.rows).fill(null).map(() => Array(prev.cols).fill(null)),
      currentPlayer: 'L',
      gameOver: false,
      winner: null,
      gameStarted: false,
      selectedPiece: null
    }));
  };

  const startGame = () => {
    setGameState(initializeGame(gameState.rows, gameState.cols, gameState.misereMode, gameState.cleanStart, gameState.forwardOnly));
  };

  const randomGame = () => {
    const rows = 3 + Math.floor(Math.random() * 8); // 3-10
    const cols = 3 + Math.floor(Math.random() * 8); // 3-10
    setGameState(initializeGame(rows, cols, gameState.misereMode, gameState.cleanStart, gameState.forwardOnly));
  };

  const toggleMisereMode = () => {
    setGameState(prev => ({
      ...prev,
      misereMode: !prev.misereMode
    }));
  };

  const toggleCleanStart = () => {
    setGameState(prev => ({
      ...prev,
      cleanStart: !prev.cleanStart
    }));
  };

  const toggleForwardOnly = () => {
    setGameState(prev => ({
      ...prev,
      forwardOnly: !prev.forwardOnly
    }));
  };

  const changeBoardSize = (rows: number, cols: number) => {
    setGameState(prev => ({
      ...prev,
      rows,
      cols,
      board: Array(rows).fill(null).map(() => Array(cols).fill(null)),
      gameStarted: false,
      gameOver: false,
      winner: null,
      selectedPiece: null
    }));
  };

  const getCellClass = (row: number, col: number) => {
    const { board, selectedPiece, currentPlayer } = gameState;
    const piece = board[row][col];
    let classes = 'w-12 h-12 border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ';
    
    if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
      classes += 'border-primary bg-primary/20 ';
    } else if (selectedPiece && selectedPiece.row === row) {
      const validMoves = getValidMoves(selectedPiece.row, selectedPiece.col, currentPlayer);
      if (validMoves.includes(col)) {
        classes += 'border-green-500 bg-green-100 ';
      } else {
        classes += 'border-border bg-background ';
      }
    } else {
      classes += 'border-border bg-background hover:bg-muted/50 ';
    }
    
    return classes;
  };

  const getPieceDisplay = (piece: 'L' | 'R' | null) => {
    if (!piece) return '';
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
        piece === 'L' ? 'bg-blue-600' : 'bg-red-600'
      }`}>
        {piece}
      </div>
    );
  };

  const currentPlayerColor = gameState.currentPlayer === 'L' ? 'blue' : 'red';
  const bgClass = gameState.gameStarted ? (gameState.currentPlayer === 'L' ? 'bg-blue-50' : 'bg-red-50') : 'bg-background';
  const borderClass = gameState.gameStarted ? (gameState.currentPlayer === 'L' ? 'border-blue-600' : 'border-red-900') : 'border-border';

  return (
    <div className="space-y-6">
      <Card className={`${bgClass} ${borderClass} border-2`}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Northcott's Game</CardTitle>
          
          {/* Mode Options Row */}
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex items-center space-x-2">
              <Label htmlFor="misere-mode">Misère Mode:</Label>
              <Switch 
                id="misere-mode"
                checked={gameState.misereMode}
                onCheckedChange={toggleMisereMode}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="clean-start">Clean Start:</Label>
              <Switch 
                id="clean-start"
                checked={gameState.cleanStart}
                onCheckedChange={toggleCleanStart}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="forward-only">Forward Only:</Label>
              <Switch 
                id="forward-only"
                checked={gameState.forwardOnly}
                onCheckedChange={toggleForwardOnly}
              />
            </div>
          </div>
          
          {/* Board Size and Game Control Row */}
          <div className="flex flex-wrap gap-4 items-center justify-center mt-3">
            <div className="flex items-center space-x-2">
              <Label>Rows:</Label>
              <Select value={gameState.rows.toString()} onValueChange={(v) => changeBoardSize(parseInt(v), gameState.cols)}>
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 8}, (_, i) => i + 3).map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label>Cols:</Label>
              <Select value={gameState.cols.toString()} onValueChange={(v) => changeBoardSize(gameState.rows, parseInt(v))}>
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 8}, (_, i) => i + 3).map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={startGame} variant="outline" size="sm" disabled={gameState.gameStarted}>
              Start Game
            </Button>
            
            <Button onClick={randomGame} variant="outline" size="sm">
              <Shuffle className="w-4 h-4 mr-2" />
              Start A Random Game
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            {gameState.gameOver ? (
              <div className="space-y-2">
                <Badge variant="destructive" className="text-lg py-1 px-4">
                  Game Over! {gameState.winner} Wins!
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {gameState.misereMode ? 'Last to move loses (Misère)' : 'Last to move wins (Normal)'}
                </p>
              </div>
            ) : gameState.gameStarted ? (
              <div className="space-y-2">
                <Badge variant="secondary" className="text-lg py-1 px-4">
                  Current Player: {gameState.currentPlayer} ({gameState.currentPlayer === 'L' ? 'Blue' : 'Red'})
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {gameState.misereMode ? 'Misère Mode: Last to move loses' : 'Normal Mode: Last to move wins'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {gameState.misereMode ? 'Misère Mode: Last to move loses' : 'Normal Mode: Last to move wins'}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gameState.cols}, 1fr)` }}>
              {gameState.board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={getCellClass(rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {getPieceDisplay(cell)}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 text-center">
            <p><strong>Rules:</strong> Players alternate turns. L (blue) moves right, R (red) moves left.</p>
            <p>Pieces cannot jump over the opponent and must stay in their row.</p>
            <p>Click a piece to select it, then click a valid destination to move.</p>
          </div>

          {gameState.gameStarted && (
            <div className="flex justify-center pt-4">
              <Button onClick={resetGame} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NorthcottsGame;