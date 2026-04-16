import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, CheckCircle, XCircle } from 'lucide-react';

interface QuestionGuessingModeProps {
  maxRange: number;
  guesses: number[];
  feedback: string;
  validNumbers: Set<number>;
  userGuess: string;
  setUserGuess: (value: string) => void;
  onGuess: (guessValue?: number) => void;
  onUpdateValidNumbers: (newValidNumbers: Set<number>) => void;
  onWin: (questionsAsked: number, finalGuesses: number) => void;
}

const QuestionGuessingMode: React.FC<QuestionGuessingModeProps> = ({
  maxRange,
  guesses,
  feedback,
  validNumbers,
  userGuess,
  setUserGuess,
  onGuess,
  onUpdateValidNumbers,
  onWin
}) => {
  const [question, setQuestion] = useState('');
  const [questionHistory, setQuestionHistory] = useState<{question: string, answer: string, understood: boolean}[]>([]);
  const [questionFeedback, setQuestionFeedback] = useState('');
  const [finalGuessCount, setFinalGuessCount] = useState(0);

  // Function to determine the optimal answer to keep search space as large as possible
  const getOptimalAnswer = (question: string): { understood: boolean, answer: boolean, questionType?: string, value?: number, isNegated?: boolean } => {
    const q = question.toLowerCase().trim();
    
    // Remove question marks and normalize
    const normalizedQ = q.replace(/\?/g, '').trim();
    
    // Check for negations
    const isNegated = normalizedQ.includes(' not ') || normalizedQ.includes("n't") || normalizedQ.includes(" isn't") || normalizedQ.includes(" doesn't");
    
    // Remove negation words for parsing the base question
    const baseQuestion = normalizedQ
      .replace(/ not /g, ' ')
      .replace(/n't/g, '')
      .replace(/ isn't/g, ' is')
      .replace(/ doesn't/g, ' does')
      .replace(/\bis\s+not\b/g, 'is')
      .trim();
    
    // Check for various question patterns
    if (baseQuestion.includes('is') && baseQuestion.includes('number')) {
      // Is the number...
      if (baseQuestion.includes('even')) {
        const evenCount = Array.from(validNumbers).filter(n => n % 2 === 0).length;
        const oddCount = validNumbers.size - evenCount;
        
        let answer: boolean;
        if (isNegated) {
          // Question is "Is it NOT even?" - answer "Yes" if odd numbers are more
          answer = oddCount > evenCount;
        } else {
          // Question is "Is it even?" - answer "Yes" if even numbers are more
          answer = evenCount > oddCount;
        }
        return { understood: true, answer, questionType: 'even', isNegated };
      }
      if (baseQuestion.includes('odd')) {
        const oddCount = Array.from(validNumbers).filter(n => n % 2 !== 0).length;
        const evenCount = validNumbers.size - oddCount;
        
        let answer: boolean;
        if (isNegated) {
          // Question is "Is it NOT odd?" - answer "Yes" if even numbers are more
          answer = evenCount > oddCount;
        } else {
          // Question is "Is it odd?" - answer "Yes" if odd numbers are more
          answer = oddCount > evenCount;
        }
        return { understood: true, answer, questionType: 'odd', isNegated };
      }
      if (baseQuestion.includes('prime')) {
        const isPrime = (num: number): boolean => {
          if (num < 2) return false;
          for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
          }
          return true;
        };
        const primeCount = Array.from(validNumbers).filter(n => isPrime(n)).length;
        const nonPrimeCount = validNumbers.size - primeCount;
        
        let answer: boolean;
        if (isNegated) {
          // Question is "Is it NOT prime?" - answer "Yes" if non-primes are more
          answer = nonPrimeCount > primeCount;
        } else {
          // Question is "Is it prime?" - answer "Yes" if primes are more
          answer = primeCount > nonPrimeCount;
        }
        return { understood: true, answer, questionType: 'prime', isNegated };
      }
      if (baseQuestion.includes('perfect square')) {
        const perfectSquareCount = Array.from(validNumbers).filter(n => Math.sqrt(n) % 1 === 0).length;
        const nonPerfectSquareCount = validNumbers.size - perfectSquareCount;
        
        let answer: boolean;
        if (isNegated) {
          // Question is "Is it NOT a perfect square?" - answer "Yes" if non-perfect squares are more
          answer = nonPerfectSquareCount > perfectSquareCount;
        } else {
          // Question is "Is it a perfect square?" - answer "Yes" if perfect squares are more
          answer = perfectSquareCount > nonPerfectSquareCount;
        }
        return { understood: true, answer, questionType: 'perfectSquare', isNegated };
      }
    }
    
    // Check for divisibility questions (including "multiple of")
    if (baseQuestion.includes('divisible by') || baseQuestion.includes('multiple of')) {
      const matches = baseQuestion.match(/(?:divisible by|multiple of)\s+(\d+)/);
      if (matches) {
        const divisor = parseInt(matches[1]);
        const divisibleCount = Array.from(validNumbers).filter(n => n % divisor === 0).length;
        const nonDivisibleCount = validNumbers.size - divisibleCount;
        
        // For negated questions, we need to think about which answer keeps more numbers
        let answer: boolean;
        if (isNegated) {
          // Question is "Is it NOT divisible by X?"
          // If we answer "Yes" (it is NOT divisible), we keep non-divisible numbers
          // If we answer "No" (it IS divisible), we keep divisible numbers
          answer = nonDivisibleCount > divisibleCount; // Answer "Yes" if non-divisible are more
        } else {
          // Question is "Is it divisible by X?"
          // If we answer "Yes" (it is divisible), we keep divisible numbers
          // If we answer "No" (it is NOT divisible), we keep non-divisible numbers
          answer = divisibleCount > nonDivisibleCount; // Answer "Yes" if divisible are more
        }
        
        return { understood: true, answer, questionType: 'divisible', value: divisor, isNegated };
      }
    }
    
    // Check for range questions
    if (baseQuestion.includes('greater than') || baseQuestion.includes('bigger than') || baseQuestion.includes('larger than')) {
      const matches = baseQuestion.match(/(?:greater than|bigger than|larger than)\s+(\d+)/);
      if (matches) {
        const threshold = parseInt(matches[1]);
        const greaterCount = Array.from(validNumbers).filter(n => n > threshold).length;
        const lessEqualCount = validNumbers.size - greaterCount;
        const answer = greaterCount > lessEqualCount;
        return { understood: true, answer, questionType: 'greaterThan', value: threshold, isNegated };
      }
    }
    
    if (baseQuestion.includes('less than') || baseQuestion.includes('smaller than')) {
      const matches = baseQuestion.match(/(?:less than|smaller than)\s+(\d+)/);
      if (matches) {
        const threshold = parseInt(matches[1]);
        const lessCount = Array.from(validNumbers).filter(n => n < threshold).length;
        const greaterEqualCount = validNumbers.size - lessCount;
        const answer = lessCount > greaterEqualCount;
        return { understood: true, answer, questionType: 'lessThan', value: threshold, isNegated };
      }
    }
    
    // Check for digit contains questions
    if (baseQuestion.includes('contain') && baseQuestion.includes('digit')) {
      const matches = baseQuestion.match(/contain(?:s)?\s+(?:the\s+)?digit\s+(\d)/);
      if (matches) {
        const digit = matches[1];
        const containsCount = Array.from(validNumbers).filter(n => n.toString().includes(digit)).length;
        const doesntContainCount = validNumbers.size - containsCount;
        const answer = containsCount > doesntContainCount;
        return { understood: true, answer, questionType: 'containsDigit', value: parseInt(digit), isNegated };
      }
    }
    
    // Check for specific number questions
    if (baseQuestion.includes('is it') || baseQuestion.includes('is the number')) {
      const matches = baseQuestion.match(/(?:is it|is the number)\s+(\d+)/);
      if (matches) {
        const num = parseInt(matches[1]);
        // If there's only one number left and they're asking about it, we must answer truthfully
        if (validNumbers.size === 1) {
          const answer = validNumbers.has(num);
          return { understood: true, answer, questionType: 'equals', value: num, isNegated };
        }
        // Otherwise, say no to keep the game going unless this number isn't even valid
        const answer = false;
        return { understood: true, answer, questionType: 'equals', value: num, isNegated };
      }
    }
    
    return { understood: false, answer: false };
  };

  // Function to update valid numbers based on question and answer, handling negations
  const updateValidNumbersFromQuestion = (questionType: string, answer: boolean, value?: number, isNegated?: boolean) => {
    const newValidNumbers = new Set<number>();
    
    for (let num = 1; num <= maxRange; num++) {
      if (!validNumbers.has(num)) continue; // Skip already invalid numbers
      
      let shouldKeep = false;
      let baseCondition = false;
      
      switch (questionType) {
        case 'even':
          baseCondition = (num % 2 === 0);
          break;
        case 'odd':
          baseCondition = (num % 2 !== 0);
          break;
        case 'prime':
          const isPrimeNum = (n: number): boolean => {
            if (n < 2) return false;
            for (let i = 2; i <= Math.sqrt(n); i++) {
              if (n % i === 0) return false;
            }
            return true;
          };
          baseCondition = isPrimeNum(num);
          break;
        case 'perfectSquare':
          baseCondition = Math.sqrt(num) % 1 === 0;
          break;
        case 'divisible':
          if (value !== undefined) {
            baseCondition = (num % value === 0);
          }
          break;
        case 'greaterThan':
          if (value !== undefined) {
            baseCondition = (num > value);
          }
          break;
        case 'lessThan':
          if (value !== undefined) {
            baseCondition = (num < value);
          }
          break;
        case 'containsDigit':
          if (value !== undefined) {
            baseCondition = num.toString().includes(value.toString());
          }
          break;
        case 'equals':
          if (value !== undefined) {
            baseCondition = (num === value);
          }
          break;
        default:
          shouldKeep = true; // Keep all numbers if we don't understand the question type
      }
      
      if (shouldKeep !== true) {
        // Apply negation logic if present
        if (isNegated) {
          // If the question was negated, we need to flip the base condition
          // e.g., "Is it NOT divisible by 4?" with answer "No" means it IS divisible by 4
          shouldKeep = answer ? !baseCondition : baseCondition;
        } else {
          // Normal case: answer matches the base condition
          shouldKeep = answer ? baseCondition : !baseCondition;
        }
      }
      
      if (shouldKeep) {
        newValidNumbers.add(num);
      }
    }
    
    onUpdateValidNumbers(newValidNumbers);
  };

  const handleQuestionSubmit = () => {
    if (!question.trim()) return;
    
    const result = getOptimalAnswer(question);
    
    if (result.understood && result.questionType) {
      const answer = result.answer ? 'Yes' : 'No';
      setQuestionHistory([...questionHistory, { 
        question: question, 
        answer: answer, 
        understood: true 
      }]);
      setQuestionFeedback(answer);
      
      // Update valid numbers based on the question and answer
      updateValidNumbersFromQuestion(result.questionType, result.answer, result.value, result.isNegated);
      
    } else {
      setQuestionHistory([...questionHistory, { 
        question: question, 
        answer: "I don't understand this question", 
        understood: false 
      }]);
      setQuestionFeedback("I don't understand that question. Please try rephrasing it as a clear yes/no question about mathematical properties, ranges, or specific values.");
    }
    
    setQuestion('');
  };

  // Handle final number guess - just check if it's the only remaining valid number
  const handleFinalGuess = (guessValue?: number) => {
    const guess = guessValue || parseInt(userGuess);
    if (isNaN(guess) || guess < 1 || guess > maxRange) {
      return;
    }

    const newFinalGuessCount = finalGuessCount + 1;
    setFinalGuessCount(newFinalGuessCount);

    if (validNumbers.size === 1 && validNumbers.has(guess)) {
      onWin(questionHistory.length, newFinalGuessCount);
    } else if (validNumbers.has(guess)) {
      // Remove this number from valid numbers since it's not the answer
      const newValidNumbers = new Set(validNumbers);
      newValidNumbers.delete(guess);
      onUpdateValidNumbers(newValidNumbers);
      
      // Check if we're down to one number
      if (newValidNumbers.size === 1) {
        onWin(questionHistory.length, newFinalGuessCount);
      }
    }
    
    setUserGuess('');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Ask yes/no questions to find the number between 1 and {maxRange}</h3>
        <p className="text-muted-foreground">Questions asked: {questionHistory.length}</p>
        {feedback && (
          <div className={`p-3 rounded-lg ${feedback.includes('Congratulations') ? 'bg-success/10 text-success' : 'bg-muted'}`}>
            {feedback}
          </div>
        )}
      </div>

      {/* Question Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="font-semibold">Ask a yes/no question:</label>
          <div className="flex gap-2">
            <Textarea
              placeholder="e.g., 'Is the number even?', 'Is it greater than 25?', 'Is it NOT divisible by 3?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuestionSubmit();
                }
              }}
              rows={2}
            />
            <Button onClick={handleQuestionSubmit} disabled={!question.trim()}>
              Ask
            </Button>
          </div>
        </div>
        
        {questionFeedback && (
          <div className="p-3 rounded-lg bg-muted border">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="font-medium">Answer:</span>
              <span>{questionFeedback}</span>
            </div>
          </div>
        )}
      </div>

      {/* Question History */}
      {questionHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold">Question History:</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {questionHistory.map((item, index) => (
              <div key={index} className="p-3 rounded-lg border bg-card">
                <div className="flex items-start gap-2">
                  {item.understood ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm"><strong>Q:</strong> {item.question}</p>
                    <p className="text-sm text-muted-foreground"><strong>A:</strong> {item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Number Grid Display */}
      <div className="space-y-4">
        <h4 className="font-semibold text-center">Click a number to make your final guess ({validNumbers.size} possibilities remaining):</h4>
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-1 max-h-64 overflow-y-auto p-2 border rounded-lg">
          {Array.from({ length: maxRange }, (_, i) => i + 1).map(num => {
            const isValid = validNumbers.has(num);
            const isGuessed = guesses.includes(num);
            
            return (
              <Button
                key={num}
                size="sm"
                variant={isGuessed ? "default" : isValid ? "outline" : "ghost"}
                className={`
                  h-8 p-1 text-xs
                  ${!isValid && !isGuessed ? 'opacity-30 cursor-not-allowed text-muted-foreground' : ''}
                  ${isGuessed ? 'bg-accent text-accent-foreground' : ''}
                  ${isValid && !isGuessed ? 'hover:bg-accent/10' : ''}
                `}
                onClick={() => isValid && !isGuessed && handleFinalGuess(num)}
                disabled={!isValid || isGuessed}
              >
                {num}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Or type your final guess"
          value={userGuess}
          onChange={(e) => setUserGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFinalGuess()}
          min={1}
          max={maxRange}
        />
        <Button onClick={() => handleFinalGuess()} disabled={!userGuess}>
          Guess
        </Button>
      </div>
    </div>
  );
};

export default QuestionGuessingMode;
