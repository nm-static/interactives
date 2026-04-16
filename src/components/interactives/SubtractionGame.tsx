import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import confetti from 'canvas-confetti';

interface SubtractionGameProps {
}

const SubtractionGame: React.FC<SubtractionGameProps> = () => {
  const [n, setN] = useState([10]);
  const [k, setK] = useState([3]);
  const [gameStarted, setGameStarted] = useState(false);
  const [circles, setCircles] = useState<number[]>([]);
  const [removedCircles, setRemovedCircles] = useState<Set<number>>(new Set());
  const [removedByPlayer, setRemovedByPlayer] = useState<Map<number, 'Lata' | 'Raj'>>(new Map());
  const [currentPlayer, setCurrentPlayer] = useState<'Lata' | 'Raj'>('Lata');
  const [winner, setWinner] = useState<string | null>(null);
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [previousGameState, setPreviousGameState] = useState<{
    removedCircles: Set<number>;
    removedByPlayer: Map<number, 'Lata' | 'Raj'>;
    currentPlayer: 'Lata' | 'Raj';
  } | null>(null);

  // Update k slider max when n changes
  useEffect(() => {
    if (k[0] > n[0]) {
      setK([n[0]]);
    }
  }, [n, k]);

  // Calculate highlighted indices
  useEffect(() => {
    if (circles.length > 0) {
      const activeCircles = circles.filter(i => !removedCircles.has(i));
      const lastKIndices = [];
      const activeCount = activeCircles.length;
      const start = Math.max(0, activeCount - k[0]);
      for (let i = start; i < activeCount; i++) {
        lastKIndices.push(activeCircles[i]);
      }
      setHighlightedIndices(lastKIndices);
    }
  }, [circles, k, removedCircles]);

  const startGame = () => {
    const initialCircles = Array.from({ length: n[0] }, (_, i) => i);
    setCircles(initialCircles);
    setRemovedCircles(new Set());
    setRemovedByPlayer(new Map());
    setGameStarted(true);
    setCurrentPlayer('Lata');
    setWinner(null);
    setPreviousGameState(null);
  };

  const resetGame = () => {
    setGameStarted(false);
    setCircles([]);
    setRemovedCircles(new Set());
    setRemovedByPlayer(new Map());
    setWinner(null);
    setCurrentPlayer('Lata');
    setHighlightedIndices([]);
    setHoveredIndex(null);
    setPreviousGameState(null);
  };

  const handleCircleClick = (index: number) => {
    if (!gameStarted || winner || !highlightedIndices.includes(index) || removedCircles.has(index)) {
      return;
    }

    // Store current state before making the move
    setPreviousGameState({
      removedCircles: new Set(removedCircles),
      removedByPlayer: new Map(removedByPlayer),
      currentPlayer
    });

    // Mark all circles from clicked index onwards as removed
    const newRemovedCircles = new Set(removedCircles);
    const newRemovedByPlayer = new Map(removedByPlayer);
    const activeCircles = circles.filter(i => !removedCircles.has(i));
    const clickedPosition = activeCircles.indexOf(index);
    
    // Remove all circles from clicked position onwards
    for (let i = clickedPosition; i < activeCircles.length; i++) {
      newRemovedCircles.add(activeCircles[i]);
      newRemovedByPlayer.set(activeCircles[i], currentPlayer);
    }
    
    setRemovedCircles(newRemovedCircles);
    setRemovedByPlayer(newRemovedByPlayer);

    // Check if game is over (no active circles left)
    const remainingActive = circles.filter(i => !newRemovedCircles.has(i));
    if (remainingActive.length === 0) {
      setWinner(currentPlayer);
      setGameStarted(false);
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      return;
    }

    // Switch player
    setCurrentPlayer(currentPlayer === 'Lata' ? 'Raj' : 'Lata');
  };

  const undoLastMove = () => {
    if (!previousGameState) return;
    
    setRemovedCircles(previousGameState.removedCircles);
    setRemovedByPlayer(previousGameState.removedByPlayer);
    setCurrentPlayer(previousGameState.currentPlayer);
    setPreviousGameState(null);
  };

  const getBackgroundColor = () => {
    if (!gameStarted || winner) return 'bg-background';
    return currentPlayer === 'Lata' ? 'bg-blue-100 dark:bg-blue-950' : 'bg-purple-100 dark:bg-purple-950';
  };

  const getCircleClass = (index: number) => {
    const isRemoved = removedCircles.has(index);
    const isHighlighted = highlightedIndices.includes(index);
    const isHovered = hoveredIndex !== null && index >= hoveredIndex;
    
    if (isRemoved) {
      const removedBy = removedByPlayer.get(index);
      const borderColor = removedBy === 'Lata' ? 'border-blue-400' : 'border-purple-400';
      return `w-8 h-8 rounded-full border-2 border-dashed bg-transparent ${borderColor}`;
    }
    
    const baseClass = `w-8 h-8 rounded-full border-2 border-black transition-colors ${isHighlighted ? 'cursor-pointer' : ''}`;
    
    let fillClass;
    if (isHovered && isHighlighted) {
      fillClass = 'bg-red-300 hover:bg-red-400';
    } else if (isHighlighted) {
      fillClass = 'bg-yellow-200 hover:bg-yellow-300';
    } else {
      fillClass = 'bg-gray-300';
    }
    
    return `${baseClass} ${fillClass}`;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getBackgroundColor()}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">The Subtraction Game</h1>
          
          {/* Game Controls */}
          <div className="bg-card rounded-lg p-6 mb-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* N Slider */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Number of circles (n): {n[0]}
                </label>
                <Slider
                  value={n}
                  onValueChange={setN}
                  min={3}
                  max={20}
                  step={1}
                  disabled={gameStarted}
                  className="w-full"
                />
              </div>

              {/* K Slider */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Max selection (k): {k[0]}
                </label>
                <Slider
                  value={k}
                  onValueChange={setK}
                  min={1}
                  max={n[0]}
                  step={1}
                  disabled={gameStarted}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={gameStarted ? resetGame : startGame}
                size="lg"
                className="px-8"
              >
                {gameStarted ? 'Reset' : 'Play'}
              </Button>
              
              {gameStarted && !winner && previousGameState && (
                <Button
                  onClick={undoLastMove}
                  variant="outline"
                  size="lg"
                  className="px-6"
                >
                  Undo Last Move
                </Button>
              )}
            </div>
          </div>

          {/* Game Status */}
          {gameStarted && !winner && (
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">
                {currentPlayer}'s Turn
              </h2>
              <p className="text-muted-foreground mt-2">
                Click on any highlighted circle to make your move
              </p>
            </div>
          )}

          {/* Winner Display */}
          {winner && (
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-primary">
                🎉 {winner} Wins! 🎉
              </h2>
              <p className="text-muted-foreground mt-2">
                {winner} made the last move and won the game!
              </p>
            </div>
          )}

          {/* Game Board */}
          {circles.length > 0 && (
            <div className="bg-card rounded-lg p-8 shadow-lg">
              <div className="flex flex-wrap justify-center gap-3">
                {circles.map((_, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={getCircleClass(index)}
                      onClick={() => handleCircleClick(index)}
                      onMouseEnter={() => (highlightedIndices.includes(index) && !removedCircles.has(index)) ? setHoveredIndex(index) : null}
                      onMouseLeave={() => setHoveredIndex(null)}
                      title={highlightedIndices.includes(index) ? 'Click to select' : 'Not selectable'}
                    />
                    <span className="text-xs text-black dark:text-white mt-1 font-medium">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
              
              {circles.length > 0 && (
                <div className="text-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    {highlightedIndices.length} circle(s) highlighted • Last {Math.min(k[0], circles.filter(i => !removedCircles.has(i)).length)} positions
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Game Rules */}
          <div className="bg-card rounded-lg p-6 mt-8 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">How to Play</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Set the number of circles (n) and maximum selection range (k)</li>
              <li>• Players take turns clicking on highlighted circles</li>
              <li>• When you click a circle, all circles to its right disappear</li>
              <li>• The last k circles (or fewer if less than k remain) are always highlighted</li>
              <li>• The player who makes the last move wins!</li>
              <li>• Background color indicates whose turn it is</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtractionGame;