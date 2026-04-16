import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, RotateCcw, Crown, Timer, Trophy } from 'lucide-react';

const NQueensPuzzle = () => {
  const [boardSize, setBoardSize] = useState([8]);
  const [queens, setQueens] = useState<Set<string>>(new Set());
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setTimerStarted(true);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetPuzzle = () => {
    setQueens(new Set());
    setTimerStarted(false);
    setIsRunning(false);
    setTimeElapsed(0);
  };

  const isQueenAt = (row: number, col: number) => {
    return queens.has(`${row}-${col}`);
  };

  const isSquareAttacked = useCallback((row: number, col: number) => {
    for (const queenPos of queens) {
      const [queenRow, queenCol] = queenPos.split('-').map(Number);
      
      // Same row or column
      if (queenRow === row || queenCol === col) {
        return true;
      }
      
      // Diagonal
      if (Math.abs(queenRow - row) === Math.abs(queenCol - col)) {
        return true;
      }
    }
    return false;
  }, [queens]);

  const handleSquareClick = (row: number, col: number) => {
    if (!timerStarted) return;

    const posKey = `${row}-${col}`;
    
    if (queens.has(posKey)) {
      // Remove queen
      const newQueens = new Set(queens);
      newQueens.delete(posKey);
      setQueens(newQueens);
    } else {
      // Add queen
      const newQueens = new Set(queens);
      newQueens.add(posKey);
      setQueens(newQueens);
    }
  };

  const getSquareStyle = (row: number, col: number) => {
    const isLight = (row + col) % 2 === 0;
    const hasQueen = isQueenAt(row, col);
    const isAttacked = !hasQueen && isSquareAttacked(row, col);
    
    let baseClasses = "aspect-square border border-border flex items-center justify-center text-2xl font-bold transition-all cursor-pointer relative";
    
    if (isLight) {
      baseClasses += " bg-amber-100 dark:bg-amber-200";
    } else {
      baseClasses += " bg-amber-600 dark:bg-amber-700";
    }
    
    if (hasQueen) {
      baseClasses += " bg-primary/20 ring-2 ring-primary";
    } else if (isAttacked) {
      baseClasses += " bg-destructive/10";
    }
    
    if (!timerStarted) {
      baseClasses += " cursor-not-allowed opacity-50";
    } else {
      baseClasses += " hover:bg-accent/20";
    }
    
    return baseClasses;
  };

  const renderSquare = (row: number, col: number) => {
    const hasQueen = isQueenAt(row, col);
    const isAttacked = !hasQueen && isSquareAttacked(row, col);
    
    return (
      <div
        key={`${row}-${col}`}
        className={getSquareStyle(row, col)}
        onClick={() => handleSquareClick(row, col)}
      >
        {hasQueen && <Crown className="w-6 h-6 text-foreground" />}
        {isAttacked && (
          <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
            <div className="w-2 h-2 bg-destructive rounded-full" />
          </div>
        )}
      </div>
    );
  };

  const currentBoardSize = boardSize[0];
  const maxPossibleQueens = currentBoardSize;
  const currentQueenCount = queens.size;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">N-Queens Puzzle</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Place as many queens as possible on the chessboard so that no two queens attack each other. 
            Queens attack horizontally, vertically, and diagonally.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Game Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Board Size: {currentBoardSize}×{currentBoardSize}
                  </label>
                  <Slider
                    value={boardSize}
                    onValueChange={setBoardSize}
                    min={4}
                    max={12}
                    step={1}
                    className="w-full"
                    disabled={timerStarted}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time:</span>
                    <Badge variant="outline" className="font-mono">
                      {formatTime(timeElapsed)}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    {!timerStarted ? (
                      <Button onClick={startTimer} className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    ) : (
                      <Button 
                        onClick={isRunning ? pauseTimer : () => setIsRunning(true)} 
                        variant="secondary" 
                        className="flex-1"
                      >
                        {isRunning ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button onClick={resetPuzzle} variant="outline">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Queens Placed:</span>
                    <Badge variant={currentQueenCount === maxPossibleQueens ? "default" : "secondary"}>
                      {currentQueenCount}/{maxPossibleQueens}
                    </Badge>
                  </div>

                  {currentQueenCount === maxPossibleQueens && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Trophy className="w-4 h-4" />
                      Perfect solution found!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Start the timer to begin placing queens</p>
                <p>• Click empty squares to place queens</p>
                <p>• Click placed queens to remove them</p>
                <p>• Red dots show attacked squares</p>
                <p>• Try to place {currentBoardSize} queens without conflicts!</p>
              </CardContent>
            </Card>
          </div>

          {/* Chessboard */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="inline-block">
              <div 
                className="grid border-2 border-border bg-background"
                style={{ 
                  gridTemplateColumns: `repeat(${currentBoardSize}, 1fr)`,
                  width: '500px',
                  height: '500px'
                }}
              >
                {Array.from({ length: currentBoardSize }, (_, row) =>
                  Array.from({ length: currentBoardSize }, (_, col) => 
                    renderSquare(row, col)
                  )
                )}
              </div>
              
              {!timerStarted && (
                <div className="text-center mt-4">
                  <p className="text-muted-foreground text-sm">
                    Start the timer to begin placing queens
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NQueensPuzzle;