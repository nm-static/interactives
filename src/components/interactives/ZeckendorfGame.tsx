import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// First 10 Fibonacci numbers: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55
const FIBONACCI_NUMBERS = [55, 34, 21, 13, 8, 5, 3, 2, 1, 1];

interface ZeckendorfGameProps {
}

const ZeckendorfGame: React.FC<ZeckendorfGameProps> = () => {
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<boolean[]>(new Array(10).fill(false));
  const [currentSum, setCurrentSum] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number | null>(null);

  // Load high score from localStorage on component mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('zeckendorf-game-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Generate a valid target number (sum of some Fibonacci numbers)
  const generateValidTarget = useCallback(() => {
    // Generate a random combination of Fibonacci numbers
    const numTerms = Math.floor(Math.random() * 4) + 2; // 2-5 terms
    let target = 0;
    let usedIndices = new Set<number>();
    
    for (let i = 0; i < numTerms; i++) {
      let index;
      do {
        index = Math.floor(Math.random() * 10);
      } while (usedIndices.has(index));
      
      usedIndices.add(index);
      target += FIBONACCI_NUMBERS[index];
    }
    
    return target;
  }, []);

  // Start new game
  const startNewGame = useCallback(() => {
    const newTarget = generateValidTarget();
    setTargetNumber(newTarget);
    setFlippedCards(new Array(10).fill(false));
    setCurrentSum(0);
    setTimer(0);
    setIsGameActive(true);
    setIsGameWon(false);
    setHasGameStarted(true);
  }, [generateValidTarget]);

  // Start game for the first time
  const startGame = () => {
    startNewGame();
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
        localStorage.setItem('zeckendorf-game-high-score', currentTime.toString());
      }
    }
  }, [currentSum, targetNumber, isGameActive, timer, highScore]);

  // Calculate current sum
  useEffect(() => {
    const sum = flippedCards.reduce((acc, isFlipped, index) => {
      return isFlipped ? acc + FIBONACCI_NUMBERS[index] : acc;
    }, 0);
    setCurrentSum(sum);
  }, [flippedCards]);

  // Check if current selection violates Zeckendorf rule (no consecutive Fibonacci numbers)
  const hasConsecutiveFibonacci = () => {
    for (let i = 0; i < flippedCards.length - 1; i++) {
      if (flippedCards[i] && flippedCards[i + 1]) {
        return true;
      }
    }
    return false;
  };

  const toggleCard = (index: number) => {
    if (!isGameActive || isGameWon) return;
    
    setFlippedCards(prev => {
      const newFlipped = [...prev];
      newFlipped[index] = !newFlipped[index];
      return newFlipped;
    });
  };

  const isInvalidSelection = hasConsecutiveFibonacci();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Zeckendorf Representation</h2>
        <p className="text-muted-foreground">Click the cards to represent the target number as a sum of Fibonacci numbers (no consecutive numbers allowed)!</p>
        {highScore !== null && (
          <Badge variant="secondary" className="text-sm">
            Best Time: {highScore}s
          </Badge>
        )}
      </div>

      {/* Cards representing Fibonacci numbers */}
      <div className="grid grid-cols-10 gap-3">
        {FIBONACCI_NUMBERS.map((fib, index) => (
          <div key={fib} className="flex flex-col items-center space-y-2">
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:scale-105 aspect-square w-full ${
                flippedCards[index] 
                  ? 'bg-green-100 border-green-300 shadow-md' 
                  : 'bg-gradient-to-br from-orange-100 to-red-100 border-orange-200'
              }`}
              onClick={() => toggleCard(index)}
            >
              <CardContent className="p-0 h-full flex items-center justify-center">
                {flippedCards[index] ? (
                  <span className="text-2xl font-bold text-green-800">{fib}</span>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 via-red-200 to-pink-200 rounded-lg opacity-80 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full opacity-60"></div>
                  </div>
                )}
              </CardContent>
            </Card>
            <span className="text-xs text-muted-foreground font-medium">{fib}</span>
          </div>
        ))}
      </div>

      {/* Warning for invalid selection */}
      {isInvalidSelection && (
        <div className="text-center">
          <Badge variant="destructive" className="text-sm">
            ⚠️ Invalid: Cannot use consecutive Fibonacci numbers!
          </Badge>
        </div>
      )}

      {/* Sum display boxes */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-secondary">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Current Sum</h3>
            <div className={`text-4xl font-bold ${currentSum > targetNumber ? "text-red-600" : isInvalidSelection ? "text-orange-600" : "text-foreground"}`}>
              {currentSum}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Target Sum</h3>
            <div className={`text-4xl font-bold ${isGameWon ? "text-green-800" : "text-primary"}`}>
              {!hasGameStarted ? "🎯" : targetNumber}
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
        
        <Button onClick={hasGameStarted ? startNewGame : startGame} size="lg" className="px-8">
          {!hasGameStarted ? 'Start Game' : isGameWon ? 'Play Again' : 'New Game'}
        </Button>
      </div>

      {/* Information about Zeckendorf representation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">About Zeckendorf Representation</h3>
        <p className="text-sm text-blue-800">
          Every positive integer can be uniquely represented as a sum of Fibonacci numbers, 
          where no two consecutive Fibonacci numbers are used. This is called the Zeckendorf representation.
        </p>
      </div>
    </div>
  );
};

export default ZeckendorfGame; 