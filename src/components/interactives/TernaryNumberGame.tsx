import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RangeSlider } from '@/components/ui/range-slider';
import { Label } from '@/components/ui/label';

const POWERS_OF_THREE = [2187, 729, 243, 81, 27, 9, 3, 1]; // 3^7 to 3^0

interface TernaryNumberGameProps {
}

const TernaryNumberGame: React.FC<TernaryNumberGameProps> = () => {
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [cardValues, setCardValues] = useState<number[]>(new Array(8).fill(0)); // 0, 1, or 2 for each position
  const [currentSum, setCurrentSum] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [targetRange, setTargetRange] = useState<[number, number]>([1, 1000]);

  // Load high score from localStorage on component mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('ternary-game-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Start new game
  const startNewGame = useCallback(() => {
    // Generate a random number within the selected range
    const [min, max] = targetRange;
    const newTarget = Math.floor(Math.random() * (max - min + 1)) + min;
    
    setTargetNumber(newTarget);
    setCardValues(new Array(8).fill(0));
    setCurrentSum(0);
    setTimer(0);
    setIsGameActive(true);
    setIsGameWon(false);
    setHasGameStarted(true);
  }, [targetRange]);

  // Start game for the first time or reset game
  const startGame = () => {
    if (hasGameStarted) {
      // Reset to allow range selection
      setIsGameActive(false);
      setHasGameStarted(false);
      setIsGameWon(false);
      setTimer(0);
      setCurrentSum(0);
      setCardValues(new Array(8).fill(0));
    } else {
      startNewGame();
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && !isGameWon) {
      interval = setInterval(() => {
        setTimer(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isGameActive, isGameWon]);

  // Check for win condition
  useEffect(() => {
    if (currentSum === targetNumber && isGameActive) {
      setIsGameActive(false);
      setIsGameWon(true);
      
      // Update high score
      const currentTime = Math.round(timer * 10) / 10;
      if (highScore === null || currentTime < highScore) {
        setHighScore(currentTime);
        localStorage.setItem('ternary-game-high-score', currentTime.toString());
      }
    }
  }, [currentSum, targetNumber, isGameActive, timer, highScore]);

  // Calculate current sum
  useEffect(() => {
    const sum = cardValues.reduce((acc, value, index) => {
      return acc + value * POWERS_OF_THREE[index];
    }, 0);
    setCurrentSum(sum);
  }, [cardValues]);

  const toggleCard = (index: number) => {
    if (!isGameActive || isGameWon) return;
    
    setCardValues(prev => {
      const newValues = [...prev];
      newValues[index] = (newValues[index] + 1) % 3; // Cycle through 0, 1, 2
      return newValues;
    });
  };

  // Convert number to ternary string for display
  const toTernary = (num: number) => {
    if (num === 0) return '0';
    let result = '';
    let n = num;
    while (n > 0) {
      result = (n % 3) + result;
      n = Math.floor(n / 3);
    }
    return result;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Ternary Number Representation</h2>
        <p className="text-muted-foreground">Click the cards to cycle through 0, 1, or 2 copies of each power of three to match the target!</p>
        {highScore !== null && (
          <Badge variant="secondary" className="text-sm">
            Best Time: {highScore}s
          </Badge>
        )}
      </div>

      {/* Range Selection */}
      {!isGameActive && (
        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Target Number Range</Label>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Min: {targetRange[0]}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Max: {targetRange[1]}</span>
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                </div>
              </div>
              <RangeSlider
                value={targetRange}
                onValueChange={(value) => {
                  // Snap to multiples of 10 if close enough
                  const snappedValue = value.map(v => {
                    const remainder = v % 10;
                    if (remainder <= 2) return v - remainder;
                    if (remainder >= 8) return v + (10 - remainder);
                    return v;
                  });
                  setTargetRange(snappedValue as [number, number]);
                }}
                min={1}
                max={3280}
                step={1}
                className="w-full"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Choose the range for target numbers. Maximum possible: {POWERS_OF_THREE.reduce((sum, power) => sum + 2 * power, 0)}
            </p>
          </div>
        </Card>
      )}

      {/* Cards representing powers of three */}
      <div className="grid grid-cols-8 gap-3">
        {POWERS_OF_THREE.map((power, index) => (
          <div key={power} className="flex flex-col items-center space-y-2">
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:scale-105 aspect-square w-full ${
                cardValues[index] === 0 
                  ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
                  : cardValues[index] === 1
                  ? 'bg-gradient-to-br from-green-100 to-emerald-200 border-green-300 shadow-md'
                  : 'bg-gradient-to-br from-orange-100 to-yellow-200 border-orange-300 shadow-lg'
              }`}
              onClick={() => toggleCard(index)}
            >
              <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${
                  cardValues[index] === 0 ? 'text-gray-500' :
                  cardValues[index] === 1 ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {cardValues[index] === 0 ? '0' : cardValues[index]}
                </span>
                <span className={`text-xs font-medium ${
                  cardValues[index] === 0 ? 'text-gray-400' :
                  cardValues[index] === 1 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  ×{power}
                </span>
              </CardContent>
            </Card>
            <span className="text-xs text-muted-foreground font-medium">3^{7-index}</span>
          </div>
        ))}
      </div>

      {/* Sum display boxes */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-secondary">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Current Sum</h3>
            <div className={`text-4xl font-bold ${currentSum > targetNumber ? "text-red-600" : "text-foreground"}`}>{currentSum}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Target Sum</h3>
            <div className={`text-4xl font-bold ${isGameWon ? "text-green-600" : "text-primary"}`}>
              {!hasGameStarted ? "🎯" : isGameWon ? toTernary(targetNumber) : targetNumber}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer and controls */}
      <div className="text-center space-y-4">
        <div className="text-2xl font-mono text-foreground">
          Time: {Math.round(timer * 10) / 10}s
        </div>
        
        {isGameWon && (
          <div className="space-y-2">
            <div className="text-xl font-bold text-green-600">Congratulations! 🎉</div>
            <div className="text-lg text-muted-foreground">
              Your score: {Math.round(timer * 10) / 10} seconds
            </div>
            {highScore === Math.round(timer * 10) / 10 && (
              <Badge variant="default" className="bg-yellow-500 text-yellow-900">
                New High Score! 🏆
              </Badge>
            )}
          </div>
        )}
        
        <Button onClick={!isGameActive ? startNewGame : startGame} size="lg" className="px-8">
          {!hasGameStarted ? 'Start Game' : isGameWon ? 'Play Again' : 'New Game'}
        </Button>
      </div>
    </div>
  );
};

export default TernaryNumberGame;