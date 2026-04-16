import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Trophy } from 'lucide-react';

interface PebblePlacementGameProps {
}

const PebblePlacementGame: React.FC<PebblePlacementGameProps> = () => {
  const [numPebbles, setNumPebbles] = useState<number>(3);
  const [pebblesInHand, setPebblesInHand] = useState<number>(3);
  const [placedPebbles, setPlacedPebbles] = useState<Set<number>>(new Set());
  const [furthestReached, setFurthestReached] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Reset game when number of pebbles changes
  useEffect(() => {
    resetGame();
  }, [numPebbles]);

  // Update furthest reached whenever pebbles are placed
  useEffect(() => {
    if (placedPebbles.size > 0) {
      const maxPosition = Math.max(...Array.from(placedPebbles));
      if (maxPosition > furthestReached) {
        setFurthestReached(maxPosition);
      }
    }
  }, [placedPebbles, furthestReached]);

  const resetGame = () => {
    setPebblesInHand(numPebbles);
    setPlacedPebbles(new Set());
    setFurthestReached(0);
    setGameStarted(false);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const canPlacePebble = (position: number): boolean => {
    // Can always place on position 1
    if (position === 1) return true;
    // For other positions, predecessor must have a pebble
    return placedPebbles.has(position - 1);
  };

  const canRemovePebble = (position: number): boolean => {
    // Can only remove if pebble is placed
    if (!placedPebbles.has(position)) return false;
    // Position 1 is always removable
    if (position === 1) return true;
    // For other positions, predecessor must have pebble
    return placedPebbles.has(position - 1);
  };

  const hasAnyRemovablePebble = (): boolean => {
    return Array.from(placedPebbles).some(pos => canRemovePebble(pos));
  };

  const handlePositionClick = (position: number) => {
    if (!gameStarted) return;

    if (placedPebbles.has(position)) {
      // Try to remove pebble
      if (canRemovePebble(position)) {
        const newPlacedPebbles = new Set(placedPebbles);
        newPlacedPebbles.delete(position);
        setPlacedPebbles(newPlacedPebbles);
        setPebblesInHand(pebblesInHand + 1);
      }
    } else {
      // Try to place pebble
      if (pebblesInHand > 0 && canPlacePebble(position)) {
        const newPlacedPebbles = new Set(placedPebbles);
        newPlacedPebbles.add(position);
        setPlacedPebbles(newPlacedPebbles);
        setPebblesInHand(pebblesInHand - 1);
      }
    }
  };

  const getPositionState = (position: number): 'placed-removable' | 'placed-fixed' | 'available' | 'blocked' => {
    if (placedPebbles.has(position)) {
      return canRemovePebble(position) ? 'placed-removable' : 'placed-fixed';
    }
    if (canPlacePebble(position) && pebblesInHand > 0) return 'available';
    return 'blocked';
  };

  const getPositionStyle = (position: number): string => {
    const state = getPositionState(position);
    const baseClasses = "w-8 h-8 border-2 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200";
    
    switch (state) {
      case 'placed-removable':
        return `${baseClasses} bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700`;
      case 'placed-fixed':
        return `${baseClasses} bg-red-100 text-red-800 border-red-200 cursor-not-allowed dark:bg-red-900/30 dark:text-red-300 dark:border-red-700`;
      case 'available':
        return `${baseClasses} bg-secondary text-secondary-foreground border-primary border-2 hover:bg-secondary/80 hover:scale-110 shadow-sm`;
      case 'blocked':
        return `${baseClasses} bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Pebble Placement Strategy Game</CardTitle>
          <CardDescription className="text-lg">
            Place your pebbles strategically to reach the furthest position possible!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Setup */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Pebbles: {numPebbles}</label>
              <Slider
                value={[numPebbles]}
                onValueChange={(value) => setNumPebbles(value[0])}
                min={2}
                max={6}
                step={1}
                className="w-full max-w-xs"
                disabled={gameStarted}
              />
            </div>

            {!gameStarted ? (
              <Button onClick={startGame} size="lg">
                Start Game
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Button onClick={resetGame} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Game
                </Button>
                <Badge variant="secondary">
                  Pebbles in hand: {pebblesInHand}
                </Badge>
                {furthestReached > 0 && (
                  <Badge variant="default" className="bg-green-600">
                    <Trophy className="w-3 h-3 mr-1" />
                    Furthest: {furthestReached}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Rules */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Rules:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• You can always place a pebble on position 1</li>
              <li>• You can place a pebble on position i only if position (i-1) has a pebble</li>
              <li>• You can remove a pebble from position i only if position (i-1) has a pebble</li>
              <li>• The pebble on position 1 is always removable</li>
              <li>• Goal: Place a pebble on the largest possible position</li>
            </ul>
          </div>

          {/* Game Board */}
          {gameStarted && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Positions 1-100</h3>
              
              {/* All positions in a flowing line */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 100 }, (_, i) => {
                  const position = i + 1;
                  
                  return (
                    <div
                      key={position}
                      className={getPositionStyle(position)}
                      onClick={() => handlePositionClick(position)}
                      title={
                        placedPebbles.has(position)
                          ? canRemovePebble(position)
                            ? `Pebble placed on ${position}. Click to remove.`
                            : `Pebble on ${position} cannot be removed (no predecessor pebble)`
                          : canPlacePebble(position) && pebblesInHand > 0
                          ? `Click to place pebble on ${position}`
                          : `Cannot place pebble on ${position}`
                      }
                    >
                      {position}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Game Status */}
          {gameStarted && pebblesInHand === 0 && (
            <div className="text-center p-4 bg-accent rounded-lg">
              <h3 className="text-lg font-semibold">All pebbles placed!</h3>
              <p className="text-accent-foreground">
                Your furthest position: <span className="font-semibold text-accent-foreground">{furthestReached}</span>
              </p>
              {hasAnyRemovablePebble() ? (
                <p className="text-sm text-accent-foreground mt-2">
                  You can still rearrange your pebbles to try reaching further!
                </p>
              ) : (
                <p className="text-sm text-accent-foreground mt-2">
                  No more moves possible - great job!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PebblePlacementGame;