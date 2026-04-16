import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RotateCcw, Wand2, Info } from 'lucide-react';

interface TernarySearchTrickProps {
}

const TernarySearchTrick: React.FC<TernarySearchTrickProps> = () => {
  const [step, setStep] = useState<'cards' | 'final-question' | 'result'>('cards');
  const [cardSelections, setCardSelections] = useState<{
    card1: 'left' | 'right' | 'missing' | null;
    card2: 'left' | 'right' | 'missing' | null;
    card3: 'left' | 'right' | 'missing' | null;
  }>({
    card1: null,
    card2: null,
    card3: null
  });
  const [isBiggerThan13, setIsBiggerThan13] = useState<boolean | null>(null);
  const [calculatedNumber, setCalculatedNumber] = useState<number | null>(null);

  const cardData = {
    card1: {
      left: [5, 6, 7, 8, 9, 10, 11, 12, 13, 32, 33, 34, 35, 36, 37, 38, 39, 40],
      right: [14, 15, 16, 17, 18, 19, 20, 21, 22]
    },
    card2: {
      left: [2, 3, 4, 11, 12, 13, 20, 21, 22, 29, 30, 31, 38, 39, 40],
      right: [5, 6, 7, 14, 15, 16, 23, 24, 25, 32, 33, 34]
    },
    card3: {
      left: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40],
      right: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38]
    }
  };

  const resetTrick = () => {
    setStep('cards');
    setCardSelections({
      card1: null,
      card2: null,
      card3: null
    });
    setIsBiggerThan13(null);
    setCalculatedNumber(null);
  };

  const handleCardSelection = (cardNumber: 1 | 2 | 3, side: 'left' | 'right' | 'missing') => {
    setCardSelections(prev => ({
      ...prev,
      [`card${cardNumber}`]: side
    }));
  };

  const handleContinue = () => {
    if (cardSelections.card1 && cardSelections.card2 && cardSelections.card3) {
      setStep('final-question');
    }
  };

  const handleFinalAnswer = (biggerThan13: boolean) => {
    setIsBiggerThan13(biggerThan13);
    
    // Calculate the number
    let guess = 0;
    
    // Card 1: left adds 9, right subtracts 9, missing adds 0
    if (cardSelections.card1 === 'left') guess += 9;
    else if (cardSelections.card1 === 'right') guess -= 9;
    // missing adds 0, so no change
    
    // Card 2: left adds 3, right subtracts 3, missing adds 0
    if (cardSelections.card2 === 'left') guess += 3;
    else if (cardSelections.card2 === 'right') guess -= 3;
    // missing adds 0, so no change
    
    // Card 3: left adds 1, right subtracts 1, missing adds 0
    if (cardSelections.card3 === 'left') guess += 1;
    else if (cardSelections.card3 === 'right') guess -= 1;
    // missing adds 0, so no change
    
    // If bigger than 13, add 27
    if (biggerThan13) guess += 27;
    
    setCalculatedNumber(guess);
    setStep('result');
  };

  const renderCard = (cardNumber: 1 | 2 | 3) => {
    const cardKey = `card${cardNumber}` as keyof typeof cardData;
    const isSelected = cardSelections[cardKey as keyof typeof cardSelections];
    
    return (
      <Card className={`w-full max-w-md ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader>
          <CardTitle className="text-center">Card {cardNumber}</CardTitle>
          <CardDescription className="text-center">
            {isSelected ? `You selected: ${isSelected === 'missing' ? 'not present' : isSelected}` : 'Choose where your number appears'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Emoji Buttons at Top */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Button
                variant={isSelected === 'left' ? 'default' : 'outline'}
                size="lg"
                className="w-full h-16 text-2xl"
                onClick={() => handleCardSelection(cardNumber, 'left')}
              >
                ⬅️
              </Button>
              <p className="text-sm font-medium mt-2">Left</p>
            </div>
            
            <div className="text-center">
              <Button
                variant={isSelected === 'missing' ? 'default' : 'outline'}
                size="lg"
                className="w-full h-16 text-2xl"
                onClick={() => handleCardSelection(cardNumber, 'missing')}
              >
                ❌
              </Button>
              <p className="text-sm font-medium mt-2">Not Present</p>
            </div>

            <div className="text-center">
              <Button
                variant={isSelected === 'right' ? 'default' : 'outline'}
                size="lg"
                className="w-full h-16 text-2xl"
                onClick={() => handleCardSelection(cardNumber, 'right')}
              >
                ➡️
              </Button>
              <p className="text-sm font-medium mt-2">Right</p>
            </div>
          </div>

          {/* Number Boxes at Bottom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="bg-muted p-3 rounded-lg text-xs">
                {cardData[cardKey].left.map(num => (
                  <span key={num} className="inline-block w-6 text-center">{num}</span>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="bg-muted p-3 rounded-lg text-xs">
                {cardData[cardKey].right.map(num => (
                  <span key={num} className="inline-block w-6 text-center">{num}</span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFinalQuestion = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Final Question</CardTitle>
        <CardDescription className="text-center">
          Is your number bigger than 13?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleFinalAnswer(true)}
          >
            Yes, bigger than 13
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleFinalAnswer(false)}
          >
            No, 13 or smaller
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderResult = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Wand2 className="w-6 h-6" />
          Magic Result!
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="text-6xl font-bold text-primary">
          {calculatedNumber}
        </div>
        <p className="text-muted-foreground">
          That's your number! 🎉
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Ternary Search Magic Trick</CardTitle>
          <CardDescription className="text-center">
            Think of a number between 1 and 40, then follow the magic cards to reveal your number!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Indicator */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Badge variant={step === 'cards' ? 'default' : 'secondary'}>1. Cards</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant={step === 'final-question' ? 'default' : 'secondary'}>2. Question</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant={step === 'result' ? 'default' : 'secondary'}>3. Result</Badge>
            </div>
          </div>

          {/* Content based on step */}
          {step === 'cards' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderCard(1)}
                {renderCard(2)}
                {renderCard(3)}
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleContinue}
                  disabled={!cardSelections.card1 || !cardSelections.card2 || !cardSelections.card3}
                  className="flex items-center gap-2"
                >
                  Continue to Final Question
                </Button>
              </div>
            </div>
          )}

          {step === 'final-question' && renderFinalQuestion()}
          {step === 'result' && renderResult()}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={resetTrick} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Start Over
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  How it Works
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    How the Ternary Search Magic Trick Works
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    This trick uses the balanced ternary representation of numbers, about which you can learn more in the following video:
                  </p>
                  <div className="flex justify-center">
                    <iframe 
                      width="560" 
                      height="315" 
                      src="https://www.youtube.com/embed/yfQVL0_POKg?si=h52dE5LtTb7BWoHG" 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      referrerPolicy="strict-origin-when-cross-origin" 
                      allowFullScreen
                      className="w-full max-w-full rounded-lg"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Think of a number between 1 and 40, then select which side of each card contains your number.
            </p>
            <p className="text-sm font-medium text-foreground">
              The magic will reveal your number through mathematical calculations!
            </p>
          </div>

          {/* Social Share */}
        </CardContent>
      </Card>
    </div>
  );
};

export default TernarySearchTrick; 