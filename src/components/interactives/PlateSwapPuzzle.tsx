import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RefreshCw, RotateCcw, BookOpen, Trophy, CheckCircle, ExternalLink } from 'lucide-react';

interface Person {
  id: number;
  plate: number;
  isSelected: boolean;
  isPaired: boolean;
  pairId: number | null;
  pairColor: string | null;
}

interface GameState {
  people: Person[];
  moves: number;
  isComplete: boolean;
  gameStarted: boolean;
}

const PlateSwapPuzzle = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const people: Person[] = [];
    for (let i = 1; i <= 16; i++) {
      people.push({
        id: i,
        plate: i === 16 ? 1 : i + 1, // 1 has 2's plate, 2 has 3's plate, ..., 16 has 1's plate
        isSelected: false,
        isPaired: false,
        pairId: null,
        pairColor: null
      });
    }
    
    return {
      people,
      moves: 0,
      isComplete: false,
      gameStarted: true
    };
  });

  const [showRules, setShowRules] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const resetGame = () => {
    const people: Person[] = [];
    for (let i = 1; i <= 16; i++) {
      people.push({
        id: i,
        plate: i === 16 ? 1 : i + 1, // 1 has 2's plate, 2 has 3's plate, ..., 16 has 1's plate
        isSelected: false,
        isPaired: false,
        pairId: null,
        pairColor: null
      });
    }
    
    setGameState({
      people,
      moves: 0,
      isComplete: false,
      gameStarted: true
    });
    setShowVictory(false);
  };

  const pairColors = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316'  // orange
  ];

  const handlePersonClick = (personId: number) => {
    if (!gameState.gameStarted || gameState.isComplete) return;

    const person = gameState.people.find(p => p.id === personId);
    if (!person || person.plate === person.id) return; // Can't select people who already have their plate

    setGameState(prev => {
      const updatedPeople = [...prev.people];
      const clickedPerson = updatedPeople.find(p => p.id === personId)!;
      
      // If this person is already paired, unselect them
      if (clickedPerson.isPaired) {
        const pairId = clickedPerson.pairId!;
        const pairedPerson = updatedPeople.find(p => p.id === pairId)!;
        
        clickedPerson.isSelected = false;
        clickedPerson.isPaired = false;
        clickedPerson.pairId = null;
        clickedPerson.pairColor = null;
        pairedPerson.isSelected = false;
        pairedPerson.isPaired = false;
        pairedPerson.pairId = null;
        pairedPerson.pairColor = null;
        
        return { ...prev, people: updatedPeople };
      }
      
      // If this person is selected, unselect them
      if (clickedPerson.isSelected) {
        clickedPerson.isSelected = false;
        return { ...prev, people: updatedPeople };
      }
      
      // Check if there's already a selected person
      const selectedPerson = updatedPeople.find(p => p.isSelected && !p.isPaired);
      
      if (selectedPerson) {
        // Find the next available color
        const usedColors = updatedPeople.filter(p => p.pairColor !== null).map(p => p.pairColor);
        const availableColor = pairColors.find(color => !usedColors.includes(color)) || pairColors[0];
        
        // Pair them up
        selectedPerson.isSelected = false;
        selectedPerson.isPaired = true;
        selectedPerson.pairId = personId;
        selectedPerson.pairColor = availableColor;
        clickedPerson.isSelected = false;
        clickedPerson.isPaired = true;
        clickedPerson.pairId = selectedPerson.id;
        clickedPerson.pairColor = availableColor;
      } else {
        // Select this person
        clickedPerson.isSelected = true;
      }
      
      return { ...prev, people: updatedPeople };
    });
  };

  const handleSwap = () => {
    if (!gameState.gameStarted || gameState.isComplete) return;

    const pairedPeople = gameState.people.filter(p => p.isPaired);
    if (pairedPeople.length === 0) return;

    setGameState(prev => {
      const updatedPeople = [...prev.people];
      
      // Process each paired person and swap with their pair
      const processedPairs = new Set<number>();
      
      pairedPeople.forEach(person => {
        if (processedPairs.has(person.id)) return; // Skip if already processed
        
        const person1 = updatedPeople.find(p => p.id === person.id)!;
        const person2 = updatedPeople.find(p => p.id === person.pairId!)!;
        
        // Swap plates
        const tempPlate = person1.plate;
        person1.plate = person2.plate;
        person2.plate = tempPlate;
        
        // Reset pairing state
        person1.isSelected = false;
        person1.isPaired = false;
        person1.pairId = null;
        person1.pairColor = null;
        person2.isSelected = false;
        person2.isPaired = false;
        person2.pairId = null;
        person2.pairColor = null;
        
        // Mark both as processed
        processedPairs.add(person1.id);
        processedPairs.add(person2.id);
      });
      
      // Check if puzzle is complete
      const isComplete = updatedPeople.every(p => p.plate === p.id);
      
      if (isComplete) {
        setShowVictory(true);
      }
      
      return {
        ...prev,
        people: updatedPeople,
        moves: prev.moves + 1,
        isComplete
      };
    });
  };

  const canSwap = () => {
    const pairedPeople = gameState.people.filter(p => p.isPaired);
    const peopleWithoutCorrectPlate = gameState.people.filter(p => p.plate !== p.id);
    
    // Check if all people without correct plates are paired
    const allIncorrectPeoplePaired = peopleWithoutCorrectPlate.every(p => p.isPaired);
    
    return pairedPeople.length >= 2 && pairedPeople.length % 2 === 0 && allIncorrectPeoplePaired;
  };

  const renderPerson = (person: Person) => {
    const isCorrect = person.plate === person.id;
    const isSelected = person.isSelected;
    const isPaired = person.isPaired;
    
    return (
      <div
        key={person.id}
        className={`
          relative w-20 h-20 rounded-full border-4 flex items-center justify-center cursor-pointer
          transition-all duration-200 hover:scale-105
          ${isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'}
          ${isSelected ? 'border-dashed border-blue-500 bg-blue-50 shadow-lg' : ''}
          ${isPaired && person.pairColor ? `border-[${person.pairColor}] bg-[${person.pairColor}]/10 shadow-lg` : ''}
          ${person.plate === person.id ? 'cursor-default hover:scale-100' : ''}
        `}
        style={{
          borderColor: isPaired && person.pairColor ? person.pairColor : undefined,
          backgroundColor: isPaired && person.pairColor ? `${person.pairColor}10` : undefined
        }}
        onClick={() => handlePersonClick(person.id)}
      >
        {/* Plate number */}
        <div className="text-base font-bold text-gray-700">
          {person.plate}
        </div>
      </div>
    );
  };

  const renderTable = () => {
    const people = gameState.people;
    if (people.length === 0) return null;

    // Calculate positions for a circular table
    const radius = 240;
    const centerX = 300;
    const centerY = 300;
    const outerRadius = 310; // Outer radius for seat numbers

    return (
      <div className="relative w-[600px] h-[600px] mx-auto">
        <div className="absolute inset-0 border-4 border-gray-300 rounded-full bg-gray-50"></div>
        
        {/* Seat numbers on outer boundary */}
        {people.map((person, index) => {
          const angle = (index * 360) / 16 - 90; // Start from top
          const x = centerX + outerRadius * Math.cos((angle * Math.PI) / 180);
          const y = centerY + outerRadius * Math.sin((angle * Math.PI) / 180);
          
          return (
            <div
              key={`seat-${person.id}`}
              className="absolute w-8 h-8 bg-gray-800 text-white text-sm rounded-full flex items-center justify-center font-bold transform -translate-x-4 -translate-y-4"
              style={{ left: x, top: y }}
            >
              {person.id}
            </div>
          );
        })}
        
        {/* Plates */}
        {people.map((person, index) => {
          const angle = (index * 360) / 16 - 90; // Start from top
          const x = centerX + radius * Math.cos((angle * Math.PI) / 180);
          const y = centerY + radius * Math.sin((angle * Math.PI) / 180);
          
          return (
            <div
              key={person.id}
              className="absolute transform -translate-x-10 -translate-y-10"
              style={{ left: x, top: y }}
            >
              {renderPerson(person)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl">
            <RefreshCw className="w-8 h-8 text-blue-500" />
            The Plate Swap Puzzle
            <RefreshCw className="w-8 h-8 text-blue-500" />
          </CardTitle>
          <CardDescription className="text-lg max-w-2xl mx-auto">
            Arrange the plates so each person has their own plate. <br /> Pair people up and swap their plates!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Game Controls */}
          <div className="flex justify-center items-center gap-4">
            <Button onClick={() => setShowRules(true)} variant="outline" size="lg" className="px-8">
              <BookOpen className="w-4 h-4 mr-2" />
              Rules
            </Button>
            <Button onClick={resetGame} variant="outline" size="lg" className="px-8">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Puzzle
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Moves:</span>
              <Badge className="text-lg px-4 py-2 bg-blue-600 text-white">
                {gameState.moves}
              </Badge>
            </div>
          </div>

          {/* Game Board */}
          <div className="space-y-8">
            {renderTable()}
          </div>
            
          {/* Instructions */}
          <div className="text-center mt-8">
            <div className="inline-block bg-gray-50 px-6 py-3 rounded-lg border">
              <p className="text-sm text-gray-700 font-medium">
                {gameState.isComplete ? (
                  "Congratulations! All plates are in their correct positions!"
                ) : (
                  "Click on people to pair them up. All people without correct plates must be paired before swapping."
                )}
              </p>
            </div>
          </div>

          {/* Swap Button */}
          {!gameState.isComplete && (
            <div className="flex justify-center mt-4">
              <Button 
                onClick={handleSwap}
                disabled={!canSwap()}
                size="lg"
                className={`px-8 ${canSwap() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                SWAP
              </Button>
            </div>
          )}

          {/* Legend */}
          <div className="space-y-3 mt-8">
            <h3 className="font-semibold text-lg text-center">Legend</h3>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-300 bg-white rounded-full"></div>
                <span>Person with wrong plate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-green-500 bg-green-50 rounded-full"></div>
                <span>Person with correct plate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-dashed border-blue-500 bg-blue-50 rounded-full"></div>
                <span>Selected for pairing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-300 bg-gray-50 rounded-full"></div>
                <span>Paired up (color-coded)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Rules Dialog */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              The Plate Swap Puzzle Rules
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-lg">Objective</h4>
              <p className="text-gray-700">Arrange the plates so that each person has their own plate (Person 1 has Plate 1, Person 2 has Plate 2, etc.).</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">Initial Setup</h4>
              <p className="text-gray-700">Each person starts with the next person's plate: Person 1 has Plate 2, Person 2 has Plate 3, ..., Person 16 has Plate 1.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">How to Play</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-700">
                <li><strong>Pair people up:</strong> Click on two people to select them for pairing.</li>
                <li><strong>Swap plates:</strong> Click the SWAP button to exchange the plates of all paired people.</li>
                <li><strong>Repeat:</strong> Continue pairing and swapping until everyone has their correct plate.</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">Rules</h4>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                <li>People who already have their correct plate cannot be selected.</li>
                <li>You must pair an even number of people to swap.</li>
                <li>The SWAP button is only enabled when everyone is properly paired.</li>
                <li>Try to solve the puzzle in as few moves as possible!</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">Strategy Tips</h4>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                <li>Look for cycles in the plate arrangement</li>
                <li>Try to fix multiple people at once with strategic swaps</li>
                <li>Plan your moves ahead to minimize the total number of swaps</li>
                <li>Remember that each swap affects all paired people simultaneously</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Victory Dialog */}
      <Dialog open={showVictory} onOpenChange={setShowVictory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Puzzle Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <span className="text-2xl font-bold text-green-600">
                Congratulations!
              </span>
            </div>
            <p className="text-gray-600 text-lg">
              You solved the puzzle in {gameState.moves} moves!
            </p>
            {gameState.moves > 2 && (
              <p className="text-blue-600 font-medium">
                Can you solve it in fewer moves?
              </p>
            )}
            <Button onClick={resetGame} className="w-full" size="lg">
              Play Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attribution */}
      <div className="pt-4 border-t border-outline">
        <p className="text-xs text-muted-foreground">
          I learned about this puzzle from{" "}
          <a 
            href="https://sites.google.com/view/kumarakash/home" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-accent hover:underline inline-flex items-center gap-1"
          >
            Akash Kumar
            <ExternalLink className="w-3 h-3" />
          </a>
          {" "}over some very fun discussions! He in turn learned of this puzzle from{" "}
          <a 
            href="https://www.tcs.tifr.res.in/~jaikumar/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-accent hover:underline inline-flex items-center gap-1"
          >
            Jaikumar Radhakrishnan
            <ExternalLink className="w-3 h-3" />
          </a>
          .
        </p>
      </div>

      {/* Social Share Section */}
    </div>
  );
};

export default PlateSwapPuzzle; 