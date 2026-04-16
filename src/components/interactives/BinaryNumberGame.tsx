import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const POWERS_OF_TWO = [128, 64, 32, 16, 8, 4, 2, 1];

interface BinaryNumberGameProps {
}

const BinaryNumberGame: React.FC<BinaryNumberGameProps> = () => {
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<boolean[]>(new Array(8).fill(false));
  const [currentSum, setCurrentSum] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number | null>(null);

  // Load high score from localStorage on component mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('binary-game-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Start new game
  const startNewGame = useCallback(() => {
    const newTarget = Math.floor(Math.random() * 257); // 0-256
    setTargetNumber(newTarget);
    setFlippedCards(new Array(8).fill(false));
    setCurrentSum(0);
    setTimer(0);
    setIsGameActive(true);
    setIsGameWon(false);
    setHasGameStarted(true);
  }, []);

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
        localStorage.setItem('binary-game-high-score', currentTime.toString());
      }
    }
  }, [currentSum, targetNumber, isGameActive, timer, highScore]);

  // Calculate current sum
  useEffect(() => {
    const sum = flippedCards.reduce((acc, isFlipped, index) => {
      return isFlipped ? acc + POWERS_OF_TWO[index] : acc;
    }, 0);
    setCurrentSum(sum);
  }, [flippedCards]);

  const toggleCard = (index: number) => {
    if (!isGameActive || isGameWon) return;
    
    setFlippedCards(prev => {
      const newFlipped = [...prev];
      newFlipped[index] = !newFlipped[index];
      return newFlipped;
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Binary Number Representation</h2>
        <p className="text-muted-foreground">Click the cards to represent the target number as a sum of powers of two!</p>
        {highScore !== null && (
          <Badge variant="secondary" className="text-sm">
            Best Time: {highScore}s
          </Badge>
        )}
      </div>

      {/* Cards representing powers of two */}
      <div className="grid grid-cols-8 gap-3">
        {POWERS_OF_TWO.map((power, index) => (
          <div key={power} className="flex flex-col items-center space-y-2">
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:scale-105 aspect-square w-full ${
                flippedCards[index] 
                  ? 'bg-blue-100 border-blue-300 shadow-md' 
                  : 'bg-gradient-to-br from-pink-100 to-purple-100 border-pink-200'
              }`}
              onClick={() => toggleCard(index)}
            >
              <CardContent className="p-0 h-full flex items-center justify-center">
                {flippedCards[index] ? (
                  <span className="text-2xl font-bold text-blue-800">{power}</span>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 rounded-lg opacity-80 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full opacity-60"></div>
                  </div>
                )}
              </CardContent>
            </Card>
            <span className="text-xs text-muted-foreground font-medium">{power}</span>
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
            <div className={`text-4xl font-bold ${isGameWon ? "text-red-800" : "text-primary"}`}>
              {!hasGameStarted ? "🎯" : isGameWon ? targetNumber.toString(2) : targetNumber}
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
    </div>
  );
};

export default BinaryNumberGame;