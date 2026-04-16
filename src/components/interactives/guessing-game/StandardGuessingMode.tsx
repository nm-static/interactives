import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StandardGuessingModeProps {
  maxRange: number;
  secretNumber: number;
  guesses: number[];
  feedback: string;
  validNumbers: Set<number>;
  userGuess: string;
  setUserGuess: (value: string) => void;
  onGuess: (guessValue?: number) => void;
}

const StandardGuessingMode: React.FC<StandardGuessingModeProps> = ({
  maxRange,
  secretNumber,
  guesses,
  feedback,
  validNumbers,
  userGuess,
  setUserGuess,
  onGuess
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Guess the number between 1 and {maxRange}</h3>
        <p className="text-muted-foreground">Guesses made: {guesses.length}</p>
        {feedback && (
          <div className={`p-3 rounded-lg ${feedback.includes('Congratulations') ? 'bg-success/10 text-success' : 'bg-muted'}`}>
            {feedback}
          </div>
        )}
      </div>

      {/* Number Grid Display */}
      <div className="space-y-4">
        <h4 className="font-semibold text-center">Click a number or type your guess:</h4>
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
                onClick={() => isValid && !isGuessed && onGuess(num)}
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
          placeholder="Or type your guess"
          value={userGuess}
          onChange={(e) => setUserGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onGuess()}
          min={1}
          max={maxRange}
        />
        <Button onClick={() => onGuess()} disabled={!userGuess}>
          Guess
        </Button>
      </div>
    </div>
  );
};

export default StandardGuessingMode;