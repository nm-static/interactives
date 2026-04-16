import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { HelpCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface BinarySearchTrickProps {
}

const BinarySearchTrick = ({}: BinarySearchTrickProps) => {
  const [cardStates, setCardStates] = useState<Record<number, 'unselected' | 'present' | 'absent'>>({});
  const [result, setResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isOneByOne, setIsOneByOne] = useState(false);
  const [isRandomized, setIsRandomized] = useState(true);
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
    const baseCards = [
      {
        id: 16,
        title: "Card 16",
        numbers: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
      },
      {
        id: 8,
        title: "Card 8", 
        numbers: [8, 9, 10, 11, 12, 13, 14, 15, 24, 25, 26, 27, 28, 29, 30, 31]
      },
      {
        id: 4,
        title: "Card 4",
        numbers: [4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 28, 29, 30, 31]
      },
      {
        id: 2,
        title: "Card 2",
        numbers: [2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 22, 23, 26, 27, 30, 31]
      },
      {
        id: 1,
        title: "Card 1",
        numbers: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31]
      }
    ];

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
            Binary Search Magic Trick
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
                  <DialogTitle>Binary Numbers Magic Trick Explained</DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-4 text-left">
                      <h3 className="font-semibold text-lg">How to perform the trick:</h3>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Ask someone to pick a secret number between 1 and 31</li>
                        <li>Show them the 5 cards below and ask them to tell you which cards contain their number</li>
                        <li>Add up the first numbers (16, 8, 4, 2, 1) from the cards they selected</li>
                        <li>The sum will be their secret number!</li>
                      </ol>
                      
                      <h3 className="font-semibold text-lg mt-6">Why does it work?</h3>
                      <p>
                        This trick is based on binary number representation. Every number from 1 to 31 can be expressed as a sum of powers of 2: 16, 8, 4, 2, and 1.
                      </p>
                      <p>
                        Each card contains all numbers that have a "1" in a specific binary position:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Card 16:</strong> Numbers with 1 in the 16's place (binary position 4)</li>
                        <li><strong>Card 8:</strong> Numbers with 1 in the 8's place (binary position 3)</li>
                        <li><strong>Card 4:</strong> Numbers with 1 in the 4's place (binary position 2)</li>
                        <li><strong>Card 2:</strong> Numbers with 1 in the 2's place (binary position 1)</li>
                        <li><strong>Card 1:</strong> Numbers with 1 in the 1's place (binary position 0)</li>
                      </ul>
                      
                      <div className="bg-muted p-4 rounded-lg mt-4">
                        <p className="font-semibold">Example:</p>
                        <p>The number 19 in binary is 10011, which means 16 + 2 + 1 = 19</p>
                        <p>So 19 appears on cards 16, 2, and 1, but not on cards 8 or 4.</p>
                      </div>
                      
                      <p>
                        When you add up the first numbers from the selected cards, you're reconstructing the binary representation of their secret number!
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
              Think of a number between 1 and 31, then select all the cards that contain your number:
            </p>
            
            <div className="flex items-center justify-center gap-3 pt-4">
              <Label htmlFor="mode-toggle" className="text-sm font-medium">
                All at once
              </Label>
              <Switch
                id="mode-toggle"
                checked={isOneByOne}
                onCheckedChange={handleModeToggle}
              />
              <Label htmlFor="mode-toggle" className="text-sm font-medium">
                One by one
              </Label>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <Label htmlFor="randomization-toggle" className="text-sm font-medium">
                Randomize numbers
              </Label>
              <Switch
                id="randomization-toggle"
                checked={isRandomized}
                onCheckedChange={handleRandomizationToggle}
              />
              <Label htmlFor="randomization-toggle" className="text-sm font-medium">
                Ordered numbers
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation controls for one-by-one mode */}
      {isOneByOne && cards.length > 0 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousCard}
            disabled={currentCardIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground px-4">
            Card {currentCardIndex + 1} of {cards.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextCard}
            disabled={currentCardIndex === cards.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      <div className={`grid gap-4 ${isOneByOne ? 'grid-cols-1 justify-items-center' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
        {getDisplayCards().map((card) => {
          const cardState = cardStates[card.id] || 'unselected';
          return (
            <Card 
              key={card.id} 
              className={`transition-all duration-500 hover:shadow-lg animate-fade-in ${
                cardState === 'present' 
                  ? 'ring-2 ring-green-500 bg-green-50' 
                  : cardState === 'absent'
                  ? 'ring-2 ring-red-500 bg-red-50'
                  : 'hover:bg-muted/50'
              } ${isOneByOne ? 'max-w-md w-full' : ''}`}
            >
              <CardHeader className={`${isOneByOne ? 'pb-4' : 'pb-2'}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={`font-bold text-primary ${isOneByOne ? 'text-3xl' : 'text-xl'}`}>
                    {card.id}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={cardState === 'present' ? 'default' : 'outline'}
                      onClick={() => handleCardSelection(card.id, 'present')}
                    >
                      ✅
                    </Button>
                    <Button
                      size="sm"
                      variant={cardState === 'absent' ? 'destructive' : 'outline'}
                      onClick={() => handleCardSelection(card.id, 'absent')}
                    >
                      ❌
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`grid grid-cols-4 gap-1 ${isOneByOne ? 'text-lg gap-2' : 'text-sm'}`}>
                  {card.numbers.map((num) => (
                    <div 
                      key={num} 
                      className={`text-center bg-muted/30 rounded border ${isOneByOne ? 'p-3' : 'p-1'}`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={calculateResult}
            disabled={!allCardsCommitted}
            size="lg"
            className="min-w-32"
          >
            Reveal Number
          </Button>
          <Button 
            onClick={reset}
            variant="outline"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {showResult && result !== null && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 animate-scale-in">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-2">
                Your number is: {result}
              </h3>
              <p className="text-green-600">
                {result === 0 ? "Please select at least one card!" : "Amazing, right? ✨"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BinarySearchTrick;