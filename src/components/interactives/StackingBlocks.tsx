import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import confetti from 'canvas-confetti';

interface StackingBlocksProps {
}

const StackingBlocks: React.FC<StackingBlocksProps> = () => {
  const [n, setN] = useState(8);
  const [stacks, setStacks] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [hoveredStack, setHoveredStack] = useState<number | null>(null);
  const [hoveredSplitPoint, setHoveredSplitPoint] = useState<number | null>(null);

  const startGame = useCallback(() => {
    setStacks([n]);
    setScore(0);
    setGameStarted(true);
    setGameComplete(false);
    setHoveredStack(null);
    setHoveredSplitPoint(null);
  }, [n]);

  const resetGame = useCallback(() => {
    setStacks([]);
    setScore(0);
    setGameStarted(false);
    setGameComplete(false);
    setHoveredStack(null);
    setHoveredSplitPoint(null);
  }, []);

  const handleStackClick = useCallback((stackIndex: number, bottomSize: number) => {
    if (hoveredStack !== stackIndex || hoveredSplitPoint !== bottomSize) return;
    
    const stackSize = stacks[stackIndex];
    const topSize = stackSize - bottomSize;
    
    // Validate the split
    if (bottomSize <= 0 || topSize <= 0) return;
    
    // Calculate points gained
    const pointsGained = bottomSize * topSize;
    
    // Update stacks
    const newStacks = [...stacks];
    newStacks.splice(stackIndex, 1); // Remove the original stack
    newStacks.push(bottomSize, topSize); // Add the two new stacks
    newStacks.sort((a, b) => b - a); // Sort in descending order for better visualization
    
    setStacks(newStacks);
    setScore(prev => prev + pointsGained);
    
    // Check if game is complete (all stacks are size 1)
    if (newStacks.every(stack => stack === 1)) {
      setGameComplete(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    setHoveredStack(null);
    setHoveredSplitPoint(null);
  }, [stacks, hoveredStack, hoveredSplitPoint]);

  const getStackColor = (size: number) => {
    if (size === 1) return 'bg-gray-200';
    if (size <= 3) return 'bg-blue-200';
    if (size <= 6) return 'bg-green-200';
    if (size <= 10) return 'bg-yellow-200';
    return 'bg-red-200';
  };

  const renderStack = (size: number, stackIndex: number) => {
    const canSplit = size > 1;
    return (
      <div key={stackIndex} className="flex flex-col items-center">
        <div className="text-sm font-medium mb-2">Stack {stackIndex + 1}</div>
        <div className="flex flex-col-reverse items-center">
          {Array.from({ length: size }).map((_, blockIndex) => {
            // Split happens ABOVE the hovered block
            // Bottom stack gets blocks 0 to blockIndex (inclusive)
            // Top stack gets blocks blockIndex+1 to size-1 (inclusive)
            const bottomSize = blockIndex + 1;
            const topSize = size - bottomSize;
            
            // Only allow splits that create two non-empty stacks
            const canSplitHere = canSplit && topSize > 0 && bottomSize > 0;
            const pointsGained = canSplitHere ? topSize * bottomSize : 0;
            const isHovered = hoveredStack === stackIndex && hoveredSplitPoint === bottomSize;
            const showSplitLine = canSplitHere && isHovered;
            
            return (
              <TooltipProvider key={blockIndex}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-12 h-6 border border-black ${getStackColor(size)} ${
                        canSplitHere ? 'cursor-pointer hover:brightness-90' : ''
                      } ${showSplitLine ? 'border-t-4 border-t-red-500' : ''} relative`}
                      style={{ marginBottom: '-1px' }}
                      onMouseEnter={() => {
                        if (canSplitHere) {
                          setHoveredStack(stackIndex);
                          setHoveredSplitPoint(bottomSize);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredStack(null);
                        setHoveredSplitPoint(null);
                      }}
                      onClick={() => {
                        if (canSplitHere) {
                          handleStackClick(stackIndex, bottomSize);
                        }
                      }}
                    />
                  </TooltipTrigger>
                  {canSplitHere && (
                    <TooltipContent>
                      <p>Split into {bottomSize} + {topSize} = {pointsGained} points</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground mt-2">Size: {size}</div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Stacking Blocks Optimization</CardTitle>
          <p className="text-muted-foreground text-center">
            Split stacks to maximize your score! Each split earns points equal to the product of the two new stack sizes.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!gameStarted ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="blocks-slider">Number of blocks (n): {n}</Label>
                <Slider
                  id="blocks-slider"
                  min={2}
                  max={15}
                  step={1}
                  value={[n]}
                  onValueChange={(value) => setN(value[0])}
                  className="mt-2"
                />
              </div>
              <Button onClick={startGame} size="lg" className="w-full">
                Start Game
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Current Score: <span className="text-primary">{score}</span>
                </div>
                <Button onClick={resetGame} variant="outline">
                  Reset Game
                </Button>
              </div>

              <Separator />

              {gameComplete ? (
                <div className="text-center space-y-4">
                  <div className="text-2xl font-bold text-green-600">
                    🎉 Game Complete! 🎉
                  </div>
                  <div className="text-lg">
                    Final Score: <span className="font-bold text-primary">{score}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    All stacks have been reduced to single blocks!
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center text-muted-foreground">
                    Hover over a stack to see where it will split, then click to execute
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-8 min-h-40">
                    {stacks.map((size, index) => renderStack(size, index))}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StackingBlocks;