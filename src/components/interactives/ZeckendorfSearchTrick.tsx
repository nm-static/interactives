import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { HelpCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface ZeckendorfSearchTrickProps {
}

// First 8 Fibonacci numbers: 1, 1, 2, 3, 5, 8, 13, 21
  const FIBONACCI_NUMBERS = [21, 13, 8, 5, 3, 2, 1];

// Function to get Zeckendorf representation of a number
const getZeckendorfRepresentation = (n: number): number[] => {
  if (n === 0) return [];
  
  // Find the largest Fibonacci number less than or equal to n
  let largestFib = 0;
  let largestFibIndex = 0;
  
  for (let i = 0; i < FIBONACCI_NUMBERS.length; i++) {
    if (FIBONACCI_NUMBERS[i] <= n) {
      largestFib = FIBONACCI_NUMBERS[i];
      largestFibIndex = i;
      break;
    }
  }
  
  if (largestFib === 0) return [];
  
  // Recursively get representation for the remainder
  const remainder = n - largestFib;
  const remainderRep = getZeckendorfRepresentation(remainder);
  
  // Check if adding this Fibonacci number would create consecutive numbers
  if (remainderRep.length > 0 && remainderRep[0] === FIBONACCI_NUMBERS[largestFibIndex + 1]) {
    // If it would create consecutive, try the next smaller Fibonacci number
    return getZeckendorfRepresentation(n);
  }
  
  return [largestFib, ...remainderRep];
};

// Function to check if a number contains a specific Fibonacci number in its Zeckendorf representation
const containsFibonacciInZeckendorf = (number: number, fibonacci: number): boolean => {
  const representation = getZeckendorfRepresentation(number);
  return representation.includes(fibonacci);
};

const ZeckendorfSearchTrick = ({}: ZeckendorfSearchTrickProps) => {
  const [cardStates, setCardStates] = useState<Record<number, 'unselected' | 'present' | 'absent'>>({});
  const [result, setResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isOneByOne, setIsOneByOne] = useState(false);
  const [isRandomized, setIsRandomized] = useState(true);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cards, setCards] = useState<Array<{id: number; title: string; numbers: number[]}>>([]);

  // Function to shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Generate cards with optional randomization
  const generateCards = () => {
    const baseCards = FIBONACCI_NUMBERS.map((fib, index) => {
      const numbers: number[] = [];
      // Check numbers from 1 to 33 to see which ones contain this Fibonacci number
      for (let i = 1; i <= 33; i++) {
        if (containsFibonacciInZeckendorf(i, fib)) {
          numbers.push(i);
        }
      }
      
      return {
        id: fib,
        title: `Card ${index + 1}`,
        numbers: numbers
      };
    });

    // Apply randomization based on toggle state
    return baseCards.map(card => ({
      ...card,
      numbers: isRandomized ? shuffleArray(card.numbers) : card.numbers
    }));
  };

  // Initialize cards on component mount
  useEffect(() => {
    setCards(generateCards());
  }, [isRandomized]);

  // Handle mode toggle
  const handleModeToggle = (checked: boolean) => {
    setIsOneByOne(checked);
    setCurrentCardIndex(0);
    setCardStates({});
    setShowResult(false);
  };

  // Handle randomization toggle
  const handleRandomizationToggle = (checked: boolean) => {
    setIsRandomized(checked);
    setCardStates({});
    setShowResult(false);
    setCurrentCardIndex(0);
  };

  // Handle spoiler toggle
  const handleSpoilerToggle = (checked: boolean) => {
    setIsSpoiler(checked);
  };

  // Navigation functions for one-by-one mode
  const goToPreviousCard = () => {
    setCurrentCardIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextCard = () => {
    setCurrentCardIndex(prev => Math.min(cards.length - 1, prev + 1));
  };

  const handleCardSelection = (cardId: number, state: 'present' | 'absent') => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: state
    }));
    setShowResult(false);
  };

  const calculateResult = () => {
    const sum = Object.entries(cardStates)
      .filter(([_, state]) => state === 'present')
      .reduce((acc, [cardId, _]) => acc + parseInt(cardId), 0);
    setResult(sum);
    setShowResult(true);
  };

  const reset = () => {
    setCardStates({});
    setResult(null);
    setShowResult(false);
    setCurrentCardIndex(0);
    setCards(generateCards()); // Regenerate with current randomization setting
  };

  // Check if at least one card has been selected (present or absent)
  const hasAnySelection = Object.values(cardStates).some(state => state !== 'unselected');
  
  // Check if all cards have been committed to in one-by-one mode
  const allCardsCommitted = isOneByOne 
    ? cards.every(card => cardStates[card.id] && cardStates[card.id] !== 'unselected')
    : hasAnySelection;

  // Get cards to display based on mode
  const getDisplayCards = () => {
    if (isOneByOne) {
      return cards.length > 0 ? [cards[currentCardIndex]] : [];
    }
    return cards;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Zeckendorf Search Magic Trick
          </CardTitle>
          <div className="flex justify-center mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  How it works
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Zeckendorf Representation Magic Trick Explained</DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-4 text-left">
                      <h3 className="font-semibold text-lg">How to perform the trick:</h3>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Ask someone to pick a secret number between 1 and 33</li>
                        <li>Show them the 8 cards below and ask them to tell you which cards contain their number</li>
                        <li>Add up the first numbers (21, 13, 8, 5, 3, 2, 1, 1) from the cards they selected</li>
                        <li>The sum will be their secret number!</li>
                      </ol>
                      
                      <h3 className="font-semibold text-lg mt-6">Why does it work?</h3>
                      <p>
                        This trick is based on Zeckendorf representation. Every positive integer can be uniquely represented as a sum of Fibonacci numbers, where no two consecutive Fibonacci numbers are used.
                      </p>
                      <p>
                        Each card contains all numbers that have a specific Fibonacci number in their Zeckendorf representation:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Card 21:</strong> Numbers that have 21 in their Zeckendorf representation</li>
                        <li><strong>Card 13:</strong> Numbers that have 13 in their Zeckendorf representation</li>
                        <li><strong>Card 8:</strong> Numbers that have 8 in their Zeckendorf representation</li>
                        <li><strong>Card 5:</strong> Numbers that have 5 in their Zeckendorf representation</li>
                        <li><strong>Card 3:</strong> Numbers that have 3 in their Zeckendorf representation</li>
                        <li><strong>Card 2:</strong> Numbers that have 2 in their Zeckendorf representation</li>
                        <li><strong>Card 1:</strong> Numbers that have 1 in their Zeckendorf representation</li>
                      </ul>
                      
                      <div className="bg-muted p-4 rounded-lg mt-4">
                        <p className="font-semibold">Example:</p>
                        <p>The number 19 in Zeckendorf representation is 13 + 5 + 1 = 19</p>
                        <p>So 19 appears on cards 13, 5, and 1, but not on cards 21, 8, 3, or 2.</p>
                      </div>
                      
                      <p>
                        When you add up the first numbers from the selected cards, you're reconstructing the Zeckendorf representation of their secret number!
                      </p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              Think of a number between 1 and 33, then tell me which cards contain your number!
            </p>
            
            {/* Controls */}
            <div className="flex flex-wrap justify-center gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="one-by-one"
                  checked={isOneByOne}
                  onCheckedChange={handleModeToggle}
                />
                <Label htmlFor="one-by-one">One by one mode</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="randomized"
                  checked={isRandomized}
                  onCheckedChange={handleRandomizationToggle}
                />
                <Label htmlFor="randomized">Randomized order</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="spoiler"
                  checked={isSpoiler}
                  onCheckedChange={handleSpoilerToggle}
                />
                <Label htmlFor="spoiler">Spoiler</Label>
              </div>
              
              <Button onClick={reset} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Navigation for one-by-one mode */}
            {isOneByOne && cards.length > 0 && (
              <div className="flex justify-center items-center gap-4">
                <Button
                  onClick={goToPreviousCard}
                  disabled={currentCardIndex === 0}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Card {currentCardIndex + 1} of {cards.length}
                </span>
                <Button
                  onClick={goToNextCard}
                  disabled={currentCardIndex === cards.length - 1}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getDisplayCards().map(card => (
          <Card key={card.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{isSpoiler ? card.id : card.title.replace('Card ', '')}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCardSelection(card.id, 'present')}
                    variant={cardStates[card.id] === 'present' ? 'default' : 'outline'}
                    size="sm"
                    className="aspect-square flex items-center justify-center"
                  >
                    ✅
                  </Button>
                  <Button
                    onClick={() => handleCardSelection(card.id, 'absent')}
                    variant={cardStates[card.id] === 'absent' ? 'default' : 'outline'}
                    size="sm"
                    className="aspect-square flex items-center justify-center"
                  >
                    ❌
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-4 gap-1 text-xs">
                {card.numbers.map(num => (
                  <div 
                    key={num} 
                    className="p-1 text-center rounded h-6 flex items-center justify-center bg-muted"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reveal button */}
      <div className="text-center">
        <Button
          onClick={calculateResult}
          disabled={!allCardsCommitted}
          size="lg"
          className="px-8"
        >
          Reveal My Number
        </Button>
      </div>

      {/* Result */}
      {showResult && result !== null && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Your number is: {result}
            </h3>
            <p className="text-muted-foreground">
              Magic! 🎩✨
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ZeckendorfSearchTrick; 