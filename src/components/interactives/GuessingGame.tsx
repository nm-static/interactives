import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Brain, User, Trophy, Target, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import StandardGuessingMode from './guessing-game/StandardGuessingMode';
import QuestionGuessingMode from './guessing-game/QuestionGuessingMode';

interface GuessingGameProps {
}

type GameMode = 'user-guesses' | 'computer-asks';
type UserGuessingMode = 'standard' | 'questions';
type ComputerStrategy = 'random' | 'linear' | 'binary';
type GameState = 'setup' | 'playing' | 'won' | 'contradiction';

interface Question {
  text: string;
  isCorrect: (num: number) => boolean;
}

const GuessingGame: React.FC<GuessingGameProps> = () => {
  // Game settings
  const [range, setRange] = useState([50]);
  const [gameMode, setGameMode] = useState<GameMode>('user-guesses');
  const [userGuessingMode, setUserGuessingMode] = useState<UserGuessingMode>('standard');
  const [computerStrategy, setComputerStrategy] = useState<ComputerStrategy>('binary');
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('setup');
  const [secretNumber, setSecretNumber] = useState<number | null>(null);
  const [userGuess, setUserGuess] = useState('');
  const [guesses, setGuesses] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [validNumbers, setValidNumbers] = useState<Set<number>>(new Set());
  
  // Computer asking mode
  const [possibleNumbers, setPossibleNumbers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const [userScore, setUserScore] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  // Question mode stats
  const [questionModeStats, setQuestionModeStats] = useState<{questionsAsked: number, finalGuesses: number}>({questionsAsked: 0, finalGuesses: 0});

  const maxRange = range[0];

  // Prime checker utility
  const isPrime = (num: number): boolean => {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };

  // Random question generator
  const generateRandomQuestion = useCallback((): Question => {
    const questions = [
      {
        text: "Is your number prime?",
        isCorrect: (num: number) => isPrime(num)
      },
      {
        text: "Is your number even?",
        isCorrect: (num: number) => num % 2 === 0
      },
      {
        text: "Is your number divisible by 3?",
        isCorrect: (num: number) => num % 3 === 0
      },
      {
        text: "Is your number divisible by 5?",
        isCorrect: (num: number) => num % 5 === 0
      },
      {
        text: "Is your number a perfect square?",
        isCorrect: (num: number) => Math.sqrt(num) % 1 === 0
      },
      {
        text: "Is your number greater than half the maximum range?",
        isCorrect: (num: number) => num > maxRange / 2
      },
      {
        text: "Does your number contain the digit 5?",
        isCorrect: (num: number) => num.toString().includes('5')
      }
    ];
    
    return questions[Math.floor(Math.random() * questions.length)];
  }, [maxRange]);

  // Linear search question generator
  const generateLinearQuestion = useCallback((): Question => {
    const currentNum = currentSearchIndex + 1;
    return {
      text: `Is your number ${currentNum}?`,
      isCorrect: (num: number) => num === currentNum
    };
  }, [currentSearchIndex]);

  // Binary search question generator
  const generateBinaryQuestion = useCallback((): Question => {
    if (possibleNumbers.length <= 1) {
      return {
        text: `Is your number ${possibleNumbers[0]}?`,
        isCorrect: (num: number) => num === possibleNumbers[0]
      };
    }
    
    const midIndex = Math.floor(possibleNumbers.length / 2);
    const midValue = possibleNumbers[midIndex];
    
    return {
      text: `Is your number ${midValue} or less?`,
      isCorrect: (num: number) => num <= midValue
    };
  }, [possibleNumbers]);

  // Calculate valid numbers based on guesses and feedback
  const updateValidNumbers = useCallback((guesses: number[], secretNumber: number | null) => {
    if (guesses.length === 0 || !secretNumber) {
      const allNumbers = new Set(Array.from({ length: maxRange }, (_, i) => i + 1));
      setValidNumbers(allNumbers);
      return;
    }

    const valid = new Set<number>();
    for (let num = 1; num <= maxRange; num++) {
      let isValid = true;
      
      for (const guess of guesses) {
        if (guess === secretNumber) break; // Game would be over
        
        if (guess < secretNumber) {
          // Guess was too low, so number must be higher than guess
          if (num <= guess) {
            isValid = false;
            break;
          }
        } else {
          // Guess was too high, so number must be lower than guess
          if (num >= guess) {
            isValid = false;
            break;
          }
        }
      }
      
      if (isValid) {
        valid.add(num);
      }
    }
    
    setValidNumbers(valid);
  }, [maxRange]);

  // Start new game
  const startGame = () => {
    if (gameMode === 'user-guesses') {
      const secret = Math.floor(Math.random() * maxRange) + 1;
      setSecretNumber(secret);
      setGuesses([]);
      setFeedback('');
      const allNumbers = new Set(Array.from({ length: maxRange }, (_, i) => i + 1));
      setValidNumbers(allNumbers);
    } else {
      const numbers = Array.from({ length: maxRange }, (_, i) => i + 1);
      setPossibleNumbers(numbers);
      setQuestionsAsked([]);
      setUserScore(0);
      setCurrentSearchIndex(0);
      setSecretNumber(null);
    }
    
    setGameState('playing');
    setUserGuess('');
  };

  // Generate next question for computer
  const generateNextQuestion = useCallback(() => {
    if (possibleNumbers.length <= 1) {
      setGameState('won');
      return;
    }

    let question: Question;
    
    switch (computerStrategy) {
      case 'random':
        question = generateRandomQuestion();
        break;
      case 'linear':
        question = generateLinearQuestion();
        break;
      case 'binary':
        question = generateBinaryQuestion();
        break;
    }
    
    setCurrentQuestion(question);
  }, [computerStrategy, possibleNumbers, generateRandomQuestion, generateLinearQuestion, generateBinaryQuestion]);

  // Handle user's guess (both input and number click)
  const handleGuess = (guessValue?: number) => {
    const guess = guessValue || parseInt(userGuess);
    if (isNaN(guess) || guess < 1 || guess > maxRange) {
      setFeedback('Please enter a valid number within the range.');
      return;
    }

    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);

    if (guess === secretNumber) {
      setGameState('won');
      setFeedback(`Congratulations! You found the number in ${newGuesses.length} guesses!`);
    } else {
      if (guess < secretNumber!) {
        setFeedback('Too low! Try a higher number.');
      } else {
        setFeedback('Too high! Try a lower number.');
      }
      // Update valid numbers based on new feedback
      updateValidNumbers(newGuesses, secretNumber);
    }
    
    setUserGuess('');
  };

  // Handle computer's question answer
  const handleQuestionAnswer = (answer: boolean) => {
    if (!currentQuestion) return;

    const questionText = `${currentQuestion.text} → ${answer ? 'Yes' : 'No'}`;
    const newQuestionsAsked = [...questionsAsked, questionText];
    setQuestionsAsked(newQuestionsAsked);
    setUserScore(userScore + 1);

    let newPossibleNumbers = [...possibleNumbers];

    if (computerStrategy === 'random') {
      // Filter based on the answer to the random question
      newPossibleNumbers = possibleNumbers.filter(num => 
        currentQuestion.isCorrect(num) === answer
      );
    } else if (computerStrategy === 'linear') {
      if (answer) {
        // Found the number
        setGameState('won');
        return;
      } else {
        // Move to next number in linear search
        setCurrentSearchIndex(currentSearchIndex + 1);
        newPossibleNumbers = possibleNumbers.filter(num => num > currentSearchIndex + 1);
      }
    } else if (computerStrategy === 'binary') {
      const midIndex = Math.floor(possibleNumbers.length / 2);
      const midValue = possibleNumbers[midIndex];
      
      if (possibleNumbers.length === 1) {
        setGameState('won');
        return;
      }
      
      if (answer) {
        // Number is <= midValue
        newPossibleNumbers = possibleNumbers.slice(0, midIndex + 1);
      } else {
        // Number is > midValue
        newPossibleNumbers = possibleNumbers.slice(midIndex + 1);
      }
    }

    // Check for contradictions - if no numbers remain, the answers are contradictory
    if (newPossibleNumbers.length === 0) {
      setGameState('contradiction');
      return;
    }

    setPossibleNumbers(newPossibleNumbers);
  };

  // Generate question when computer is asking
  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'computer-asks') {
      generateNextQuestion();
    }
  }, [gameState, gameMode, possibleNumbers, generateNextQuestion]);

  const resetGame = () => {
    setGameState('setup');
    setSecretNumber(null);
    setUserGuess('');
    setGuesses([]);
    setFeedback('');
    setPossibleNumbers([]);
    setCurrentQuestion(null);
    setQuestionsAsked([]);
    setUserScore(0);
    setCurrentSearchIndex(0);
    setQuestionModeStats({questionsAsked: 0, finalGuesses: 0});
  };

  const getStrategyDescription = (strategy: ComputerStrategy) => {
    switch (strategy) {
      case 'random':
        return 'Asks random mathematical questions about your number';
      case 'linear':
        return 'Checks each number sequentially from 1 upward';
      case 'binary':
        return 'Uses binary search to efficiently narrow down the range';
    }
  };

  const getOptimalGuesses = () => {
    return Math.ceil(Math.log2(maxRange));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Target className="w-8 h-8 text-accent" />
            Number Guessing Game
          </CardTitle>
          <CardDescription className="text-lg">
            Experience different search strategies in this interactive guessing game
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {gameState === 'setup' && (
            <div className="space-y-6">
              {/* Range Selection */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Number Range: 1 to {maxRange}</Label>
                <div className="space-y-2">
                  <Slider
                    value={range}
                    onValueChange={setRange}
                    min={10}
                    max={512}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Min: 10</span>
                    <span>Current: {maxRange}</span>
                    <span>Max: 512</span>
                  </div>
                </div>
              </div>

              {/* Game Mode Selection */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Game Mode</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${gameMode === 'user-guesses' ? 'ring-2 ring-accent' : ''}`}
                    onClick={() => setGameMode('user-guesses')}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <User className="w-8 h-8 text-accent mx-auto" />
                      <h3 className="font-semibold">You Guess</h3>
                      <p className="text-sm text-muted-foreground">
                        Computer thinks of a number, you try to guess it
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Optimal: {getOptimalGuesses()} guesses
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${gameMode === 'computer-asks' ? 'ring-2 ring-accent' : ''}`}
                    onClick={() => setGameMode('computer-asks')}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <Brain className="w-8 h-8 text-accent mx-auto" />
                      <h3 className="font-semibold">Computer Asks</h3>
                      <p className="text-sm text-muted-foreground">
                        You think of a number, computer asks questions
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Earn points for each question
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* User Guessing Mode Selection */}
              {gameMode === 'user-guesses' && (
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Guessing Style</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all ${userGuessingMode === 'standard' ? 'ring-2 ring-accent' : ''}`}
                      onClick={() => setUserGuessingMode('standard')}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <Target className="w-6 h-6 text-accent mx-auto" />
                        <h4 className="font-semibold">Standard (High/Low)</h4>
                        <p className="text-sm text-muted-foreground">
                          Traditional guessing with "too high" or "too low" feedback
                        </p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all ${userGuessingMode === 'questions' ? 'ring-2 ring-accent' : ''}`}
                      onClick={() => setUserGuessingMode('questions')}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <HelpCircle className="w-6 h-6 text-accent mx-auto" />
                        <h4 className="font-semibold">Ask Questions</h4>
                        <p className="text-sm text-muted-foreground">
                          Ask yes/no questions about mathematical properties
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Computer Strategy Selection */}
              {gameMode === 'computer-asks' && (
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Computer Strategy</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {(['random', 'linear', 'binary'] as ComputerStrategy[]).map(strategy => (
                      <Card 
                        key={strategy}
                        className={`cursor-pointer transition-all ${computerStrategy === strategy ? 'ring-2 ring-accent' : ''}`}
                        onClick={() => setComputerStrategy(strategy)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold capitalize">{strategy} Search</h4>
                              <p className="text-sm text-muted-foreground">
                                {getStrategyDescription(strategy)}
                              </p>
                            </div>
                            <Badge variant={computerStrategy === strategy ? "default" : "outline"}>
                              {strategy === 'binary' ? `~${getOptimalGuesses()} questions` : 
                               strategy === 'linear' ? `~${Math.ceil(maxRange/2)} questions` : 
                               '? questions'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={startGame} className="w-full" size="lg">
                Start Game
              </Button>
            </div>
          )}

          {gameState === 'playing' && gameMode === 'user-guesses' && userGuessingMode === 'standard' && (
            <StandardGuessingMode
              maxRange={maxRange}
              secretNumber={secretNumber!}
              guesses={guesses}
              feedback={feedback}
              validNumbers={validNumbers}
              userGuess={userGuess}
              setUserGuess={setUserGuess}
              onGuess={handleGuess}
            />
          )}

          {gameState === 'playing' && gameMode === 'user-guesses' && userGuessingMode === 'questions' && (
            <QuestionGuessingMode
              maxRange={maxRange}
              guesses={guesses}
              feedback={feedback}
              validNumbers={validNumbers}
              userGuess={userGuess}
              setUserGuess={setUserGuess}
              onGuess={handleGuess}
              onUpdateValidNumbers={setValidNumbers}
              onWin={(questionsAsked, finalGuesses) => {
                setQuestionModeStats({questionsAsked, finalGuesses});
                setGameState('won');
              }}
            />
          )}

          {gameState === 'playing' && gameMode === 'computer-asks' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Think of a number between 1 and {maxRange}</h3>
                <p className="text-muted-foreground">
                  Strategy: {computerStrategy.charAt(0).toUpperCase() + computerStrategy.slice(1)} Search
                </p>
                <div className="flex justify-center gap-4">
                  <Badge variant="outline">
                    <Trophy className="w-4 h-4 mr-1" />
                    Score: {userScore}
                  </Badge>
                  <Badge variant="outline">
                    Remaining: {possibleNumbers.length}
                  </Badge>
                </div>
              </div>

              {currentQuestion && (
                <Card className="text-center">
                  <CardContent className="p-6 space-y-4">
                    <HelpCircle className="w-12 h-12 text-accent mx-auto" />
                    <h4 className="text-lg font-semibold">{currentQuestion.text}</h4>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => handleQuestionAnswer(true)}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Yes
                      </Button>
                      <Button 
                        onClick={() => handleQuestionAnswer(false)}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        No
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {questionsAsked.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Questions Asked:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {questionsAsked.map((question, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        {question}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={resetGame} variant="outline" className="w-full">
                New Game
              </Button>
            </div>
          )}

          {gameState === 'contradiction' && (
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
                <h3 className="text-2xl font-bold text-destructive">Contradiction Detected!</h3>
                <p className="text-lg">
                  Your answers are contradictory - no number can satisfy all the conditions you've given.
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Please check your answers in the question history below.</p>
                  <p>You may have accidentally given incorrect responses.</p>
                </div>
              </div>

              {questionsAsked.length > 0 && (
                <div className="space-y-2 text-left">
                  <h4 className="font-semibold text-center">Your Answer History:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                    {questionsAsked.map((question, index) => (
                      <div key={index} className="text-sm p-2 bg-card rounded border">
                        {question}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={resetGame} size="lg" className="w-full">
                Start Over
              </Button>
            </div>
          )}

          {gameState === 'won' && (
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <CheckCircle className="w-16 h-16 text-success mx-auto" />
                <h3 className="text-2xl font-bold text-success">Game Complete!</h3>
                {gameMode === 'user-guesses' && userGuessingMode === 'standard' ? (
                  <p className="text-lg">
                    You found the number <span className="font-bold">{secretNumber}</span> in{' '}
                    <span className="font-bold">{guesses.length}</span> guesses!
                  </p>
                ) : gameMode === 'user-guesses' && userGuessingMode === 'questions' ? (
                  <div className="space-y-2">
                    <p className="text-lg">
                      You found the number with <span className="font-bold">{questionModeStats.questionsAsked}</span> questions and{' '}
                      <span className="font-bold">{questionModeStats.finalGuesses}</span> final guesses!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total interactions: <span className="font-bold">{questionModeStats.questionsAsked + questionModeStats.finalGuesses}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg">
                      The computer identified your number using the{' '}
                      <span className="font-bold">{computerStrategy}</span> search strategy!
                    </p>
                    <div className="flex justify-center gap-4">
                      <Badge variant="outline" className="text-lg p-2">
                        <Trophy className="w-5 h-5 mr-2" />
                        Final Score: {userScore} points
                      </Badge>
                    </div>
                    {possibleNumbers.length === 1 && (
                      <p className="text-muted-foreground">
                        Your number was: <span className="font-bold">{possibleNumbers[0]}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button onClick={resetGame} size="lg" className="w-full">
                Play Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GuessingGame;