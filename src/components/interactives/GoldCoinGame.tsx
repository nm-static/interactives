import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Crown, Circle, RotateCcw, BookOpen, Trophy } from 'lucide-react';

type Player = 0 | 1;
type CellState = 'empty' | 'penny' | 'gold';

interface GameState {
  track: CellState[];
  currentPlayer: Player;
  winner: Player | null;
  gameStarted: boolean;
  selectedCoin: number | null;
  moveHistory: string[];
}

interface GoldCoinGameProps {
}

const GoldCoinGame: React.FC<GoldCoinGameProps> = () => {
  const [gameState, setGameState] = useState<GameState>({
    track: Array(15).fill('empty'),
    currentPlayer: 0,
    winner: null,
    gameStarted: false,
    selectedCoin: null,
    moveHistory: []
  });

  const [showRules, setShowRules] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  const playerNames = ['Player 1', 'Player 2'];
  const playerColors = ['#3b82f6', '#ef4444'];

  const generateRandomBoard = (): CellState[] => {
    const track = Array(15).fill('empty') as CellState[];
    
    // Always place the gold coin at position 7-14 (random)
    const goldPosition = Math.floor(Math.random() * 8) + 7;
    track[goldPosition] = 'gold';
    
    // Place 3-5 pennies randomly in positions 0-6
    const numPennies = Math.floor(Math.random() * 3) + 3; // 3-5 pennies
    const availablePositions = Array.from({length: 7}, (_, i) => i); // positions 0-6
    
    for (let i = 0; i < numPennies; i++) {
      if (availablePositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        const position = availablePositions.splice(randomIndex, 1)[0];
        track[position] = 'penny';
      }
    }
    
    return track;
  };

  const initializeGame = () => {
    setGameState({
      track: generateRandomBoard(),
      currentPlayer: 0,
      winner: null,
      gameStarted: true,
      selectedCoin: null,
      moveHistory: []
    });
  };

  const resetGame = () => {
    setGameState({
      track: Array(15).fill('empty'),
      currentPlayer: 0,
      winner: null,
      gameStarted: false,
      selectedCoin: null,
      moveHistory: []
    });
    setShowGameOver(false);
  };

  const canMoveCoin = (fromIndex: number, toIndex: number): boolean => {
    if (fromIndex <= toIndex) return false; // Can only move left
    if (toIndex < 0) return false; // Can't move off the track
    if (gameState.track[toIndex] !== 'empty') return false; // Can't move to a position with a coin
    
    // Check if there are any coins in the way
    for (let i = toIndex + 1; i < fromIndex; i++) {
      if (gameState.track[i] !== 'empty') {
        return false;
      }
    }
    
    return true;
  };

  const canTakeCoin = (index: number): boolean => {
    // Can only take the leftmost coin
    for (let i = 0; i < index; i++) {
      if (gameState.track[i] !== 'empty') {
        return false;
      }
    }
    return gameState.track[index] !== 'empty';
  };

  const getValidMovePositions = (fromIndex: number): number[] => {
    const validPositions: number[] = [];
    for (let i = 0; i < fromIndex; i++) {
      if (canMoveCoin(fromIndex, i)) {
        validPositions.push(i);
      }
    }
    return validPositions;
  };

  const handleCellClick = (index: number) => {
    if (gameState.winner !== null || !gameState.gameStarted) return;

    const cellState = gameState.track[index];
    
    // If a coin is selected, try to move it
    if (gameState.selectedCoin !== null) {
      // If clicking on the same coin, deselect it
      if (gameState.selectedCoin === index) {
        setGameState(prev => ({
          ...prev,
          selectedCoin: null
        }));
        return;
      }
      
      if (canMoveCoin(gameState.selectedCoin, index)) {
        const newTrack = [...gameState.track];
        newTrack[index] = newTrack[gameState.selectedCoin];
        newTrack[gameState.selectedCoin] = 'empty';
        
        const moveDescription = `Player ${gameState.currentPlayer + 1} moved ${newTrack[index] === 'gold' ? 'gold coin' : 'penny'} from position ${gameState.selectedCoin + 1} to position ${index + 1}`;
        
        setGameState(prev => ({
          ...prev,
          track: newTrack,
          currentPlayer: ((prev.currentPlayer + 1) % 2) as Player,
          selectedCoin: null,
          moveHistory: [...prev.moveHistory, moveDescription]
        }));
      }
      return;
    }
    
    // Select a coin if it's not empty
    if (cellState !== 'empty') {
      setGameState(prev => ({
        ...prev,
        selectedCoin: index
      }));
    }
  };

  const handleTakeCoin = () => {
    if (gameState.winner !== null || !gameState.gameStarted || gameState.selectedCoin === null) return;
    if (!canTakeCoin(gameState.selectedCoin)) return;

    const cellState = gameState.track[gameState.selectedCoin];
    const newTrack = [...gameState.track];
    newTrack[gameState.selectedCoin] = 'empty';
    
    const moveDescription = `Player ${gameState.currentPlayer + 1} took ${cellState === 'gold' ? 'gold coin' : 'penny'} from position ${gameState.selectedCoin + 1}`;
    
    // Check if this is a winning move
    const isWinningMove = cellState === 'gold';
    
    setGameState(prev => ({
      ...prev,
      track: newTrack,
      currentPlayer: isWinningMove ? prev.currentPlayer : ((prev.currentPlayer + 1) % 2) as Player,
      winner: isWinningMove ? prev.currentPlayer : null,
      selectedCoin: null,
      moveHistory: [...prev.moveHistory, moveDescription]
    }));

    if (isWinningMove) {
      setShowGameOver(true);
    }
  };

  const renderCell = (cellState: CellState, index: number) => {
    const isSelected = gameState.selectedCoin === index;
    const validPositions = gameState.selectedCoin !== null ? getValidMovePositions(gameState.selectedCoin) : [];
    const isValidMoveTarget = validPositions.includes(index);
    const isClickable = gameState.gameStarted && (cellState !== 'empty' || gameState.selectedCoin !== null);
    
    return (
      <div
        key={index}
        className={`
          relative w-14 h-14 border-2 rounded-lg flex items-center justify-center cursor-pointer
          transition-all duration-200 hover:scale-105 shadow-sm
          ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300 bg-white'}
          ${isValidMoveTarget ? 'border-green-400 bg-green-50 shadow-md' : ''}
          ${!isClickable ? 'cursor-default hover:scale-100' : 'hover:shadow-md'}
        `}
        onClick={() => handleCellClick(index)}
      >
        {cellState === 'gold' && (
          <div className="flex items-center justify-center">
            <Crown className="w-7 h-7 text-yellow-500 drop-shadow-sm" />
          </div>
        )}
        {cellState === 'penny' && (
          <div className="flex items-center justify-center">
            <Circle className="w-7 h-7 text-orange-500 fill-orange-500 drop-shadow-sm" />
          </div>
        )}
        <div className="absolute -bottom-7 text-xs text-gray-500 font-mono font-medium">
          {index + 1}
        </div>
      </div>
    );
  };

  const getLeftmostCoin = (): { index: number; type: string } | null => {
    for (let i = 0; i < gameState.track.length; i++) {
      if (gameState.track[i] !== 'empty') {
        return { index: i, type: gameState.track[i] };
      }
    }
    return null;
  };

  const leftmostCoin = getLeftmostCoin();
  const canTakeSelectedCoin = gameState.selectedCoin !== null && canTakeCoin(gameState.selectedCoin);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl">
            <Crown className="w-8 h-8 text-yellow-500" />
            The Gold Coin Game
            <Crown className="w-8 h-8 text-yellow-500" />
          </CardTitle>
          <CardDescription className="text-lg max-w-2xl mx-auto">
            A strategic two-player game where you move coins to the left or take the leftmost coin. 
            The player who takes the gold coin wins!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Game Controls */}
          <div className="flex justify-center gap-4">
            {!gameState.gameStarted ? (
              <Button onClick={initializeGame} size="lg" className="px-8">
                Start Game
              </Button>
            ) : (
              <Button onClick={resetGame} variant="outline" size="lg" className="px-8">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Game
              </Button>
            )}
            <Button onClick={() => setShowRules(true)} variant="outline" size="lg" className="px-8">
              <BookOpen className="w-4 h-4 mr-2" />
              Rules
            </Button>
          </div>

          {/* Game Status */}
          {gameState.gameStarted && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <span className="font-semibold text-lg">Current Player:</span>
                <Badge 
                  style={{ backgroundColor: playerColors[gameState.currentPlayer] }}
                  className="text-white text-lg px-4 py-2"
                >
                  {playerNames[gameState.currentPlayer]}
                </Badge>
              </div>
              {gameState.selectedCoin !== null && (
                <div className="text-sm text-blue-700 bg-blue-100 px-4 py-2 rounded-lg font-medium">
                  Selected coin at position {gameState.selectedCoin + 1}. Click a position to move it.
                </div>
              )}
            </div>
          )}

          {/* Game Board */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-gray-100 p-8 rounded-2xl shadow-inner">
                <div className="flex gap-3 items-end">
                  {gameState.track.map((cellState, index) => (
                    <div key={index} className="flex flex-col items-center">
                      {renderCell(cellState, index)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="text-center">
              <div className="inline-block bg-gray-50 px-6 py-3 rounded-lg border">
                <p className="text-sm text-gray-700 font-medium">
                  {!gameState.gameStarted ? (
                    "Click 'Start Game' to begin with a randomized board"
                  ) : gameState.selectedCoin !== null ? (
                    canTakeSelectedCoin ? (
                      "Use the take button below to remove this coin"
                    ) : (
                      "Click a highlighted position to move the selected coin"
                    )
                  ) : (
                    "Click on a coin to select it, then click a position to move it left, or take the leftmost coin"
                  )}
                </p>
              </div>
            </div>

            {/* Take Coin Button */}
            {canTakeSelectedCoin && (
              <div className="flex justify-center">
                <Button 
                  onClick={handleTakeCoin}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  Take {gameState.track[gameState.selectedCoin!] === 'gold' ? 'Gold Coin' : 'Penny'}
                </Button>
              </div>
            )}
          </div>

          {/* Move History */}
          {gameState.moveHistory.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-center">Move History</h3>
              <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-50 p-4 rounded-lg">
                {gameState.moveHistory.map((move, index) => (
                  <div key={index} className="text-sm text-gray-700 bg-white p-3 rounded border-l-4 border-blue-500">
                    {move}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules Dialog */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              The Gold Coin Game Rules
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-lg">Objective</h4>
              <p className="text-gray-700">Be the first player to acquire the gold coin and win the game!</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">Setup</h4>
              <p className="text-gray-700">The game starts with coins placed on a 15-position track. The gold coin is positioned farthest to the right.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">On Your Turn</h4>
              <p className="text-gray-700 mb-3">You have two options:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-700">
                <li><strong>Move a coin:</strong> Move any coin to the left by one or more spaces. A coin cannot jump over another coin.</li>
                <li><strong>Take a coin:</strong> Take the leftmost coin on the track into your possession.</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">Winning</h4>
              <p className="text-gray-700">The player who successfully takes the gold coin is declared the winner!</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-lg">Strategy Tips</h4>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                <li>Try to control the position of the gold coin</li>
                <li>Use pennies to block your opponent's moves</li>
                <li>Plan several moves ahead</li>
                <li>Don't always take the first available coin</li>
                <li>Consider the spacing between coins carefully</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Over Dialog */}
      <Dialog open={showGameOver} onOpenChange={setShowGameOver}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Game Over!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Crown className="w-10 h-10 text-yellow-500" />
              <span className="text-2xl font-bold text-green-600">
                {playerNames[gameState.winner!]} wins!
              </span>
            </div>
            <p className="text-gray-600 text-lg">
              Congratulations! {playerNames[gameState.winner!]} successfully acquired the gold coin.
            </p>
            <Button onClick={resetGame} className="w-full" size="lg">
              Play Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoldCoinGame;  