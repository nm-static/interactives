import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

interface BagchalGameProps {
}

type Phase = 'setup' | 'tiger-placement' | 'goat-placement' | 'playing';
type GameMode = '2-player' | 'vs-computer';
type ComputerSide = 'tiger' | 'goats';
type Turn = 'tiger' | 'goats';

interface Position {
  row: number;
  col: number;
}

interface GameState {
  phase: Phase;
  tigerPosition: Position | null;
  goatPositions: Position[];
  goatsPlaced: number;
  goatsToPlace: number;
  turn: Turn;
  winner: 'tiger' | 'goats' | null;
  selectedGoat: number | null; // index of selected goat for moving
}

const BagchalGame: React.FC<BagchalGameProps> = () => {
  // Grid parameters
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(6);
  const [numGoats, setNumGoats] = useState(4);
  
  // Game mode
  const [gameMode, setGameMode] = useState<GameMode>('2-player');
  const [computerSide, setComputerSide] = useState<ComputerSide>('tiger');
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    tigerPosition: null,
    goatPositions: [],
    goatsPlaced: 0,
    goatsToPlace: numGoats,
    turn: 'tiger',
    winner: null,
    selectedGoat: null,
  });

  const maxGoats = rows * cols - 1;

  // Reset game when parameters change
  const resetGame = useCallback(() => {
    setGameState({
      phase: 'setup',
      tigerPosition: null,
      goatPositions: [],
      goatsPlaced: 0,
      goatsToPlace: numGoats,
      turn: 'tiger',
      winner: null,
      selectedGoat: null,
    });
  }, [numGoats]);

  // Start the game
  const startGame = () => {
    setGameState({
      phase: 'tiger-placement',
      tigerPosition: null,
      goatPositions: [],
      goatsPlaced: 0,
      goatsToPlace: numGoats,
      turn: 'tiger',
      winner: null,
      selectedGoat: null,
    });
  };

  // Check if a position is occupied
  const isOccupied = (row: number, col: number): boolean => {
    if (gameState.tigerPosition?.row === row && gameState.tigerPosition?.col === col) {
      return true;
    }
    return gameState.goatPositions.some(g => g.row === row && g.col === col);
  };

  // Get adjacent positions
  const getAdjacentPositions = (pos: Position): Position[] => {
    const adjacent: Position[] = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // orthogonal
    ];
    
    for (const [dr, dc] of directions) {
      const newRow = pos.row + dr;
      const newCol = pos.col + dc;
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        adjacent.push({ row: newRow, col: newCol });
      }
    }
    return adjacent;
  };

  // Get valid tiger moves (adjacent empty positions)
  const getValidTigerMoves = (tigerPos: Position): Position[] => {
    return getAdjacentPositions(tigerPos).filter(
      pos => !isOccupied(pos.row, pos.col)
    );
  };

  // Check if tiger can capture a goat (jump over it to empty space)
  const getTigerCaptures = (tigerPos: Position): { jumpTo: Position; capturedGoat: Position }[] => {
    const captures: { jumpTo: Position; capturedGoat: Position }[] = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
    ];
    
    for (const [dr, dc] of directions) {
      const goatRow = tigerPos.row + dr;
      const goatCol = tigerPos.col + dc;
      const landRow = tigerPos.row + 2 * dr;
      const landCol = tigerPos.col + 2 * dc;
      
      // Check if there's a goat adjacent and empty space beyond
      if (goatRow >= 0 && goatRow < rows && goatCol >= 0 && goatCol < cols &&
          landRow >= 0 && landRow < rows && landCol >= 0 && landCol < cols) {
        const hasGoat = gameState.goatPositions.some(g => g.row === goatRow && g.col === goatCol);
        const landingEmpty = !isOccupied(landRow, landCol);
        
        if (hasGoat && landingEmpty) {
          captures.push({
            jumpTo: { row: landRow, col: landCol },
            capturedGoat: { row: goatRow, col: goatCol }
          });
        }
      }
    }
    return captures;
  };

  // Check if tiger is trapped (no valid moves) with given goat positions
  const isTigerTrappedWithGoats = (tigerPos: Position, goats: Position[]): boolean => {
    // Check for valid moves (adjacent empty positions)
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
      const newRow = tigerPos.row + dr;
      const newCol = tigerPos.col + dc;
      
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        const isTiger = tigerPos.row === newRow && tigerPos.col === newCol;
        const isGoat = goats.some(g => g.row === newRow && g.col === newCol);
        
        if (!isTiger && !isGoat) {
          // There's an empty adjacent cell - tiger can move
          return false;
        }
      }
    }
    
    // Check for captures (jump over goat to empty space)
    for (const [dr, dc] of directions) {
      const goatRow = tigerPos.row + dr;
      const goatCol = tigerPos.col + dc;
      const landRow = tigerPos.row + 2 * dr;
      const landCol = tigerPos.col + 2 * dc;
      
      if (goatRow >= 0 && goatRow < rows && goatCol >= 0 && goatCol < cols &&
          landRow >= 0 && landRow < rows && landCol >= 0 && landCol < cols) {
        const hasGoat = goats.some(g => g.row === goatRow && g.col === goatCol);
        const landingIsTiger = tigerPos.row === landRow && tigerPos.col === landCol;
        const landingIsGoat = goats.some(g => g.row === landRow && g.col === landCol);
        
        if (hasGoat && !landingIsTiger && !landingIsGoat) {
          // Tiger can capture - not trapped
          return false;
        }
      }
    }
    
    return true;
  };

  // Legacy function for backward compatibility
  const isTigerTrapped = (tigerPos: Position): boolean => {
    return isTigerTrappedWithGoats(tigerPos, gameState.goatPositions);
  };

  // Computer strategy for goats on 2xn board with 4 goats
  const getGoatComputerMove = (): { type: 'place' | 'move'; position?: Position; fromIndex?: number; toPosition?: Position } | null => {
    const tiger = gameState.tigerPosition;
    if (!tiger) return null;

    if (gameState.phase === 'goat-placement') {
      // Strategy: Place goats to surround the tiger
      // For 2xn board, place goats to block tiger's movement
      const adjacentEmpty = getAdjacentPositions(tiger).filter(pos => !isOccupied(pos.row, pos.col));
      
      // Prioritize positions that help trap the tiger
      // First, block escape routes
      if (adjacentEmpty.length > 0) {
        // Pick the position that leaves tiger with fewest options
        let bestPos = adjacentEmpty[0];
        let minOptions = Infinity;
        
        for (const pos of adjacentEmpty) {
          // Simulate placing goat here
          const simulatedGoats = [...gameState.goatPositions, pos];
          const tigerOptions = getAdjacentPositions(tiger).filter(
            p => !simulatedGoats.some(g => g.row === p.row && g.col === p.col) &&
                 !(tiger.row === p.row && tiger.col === p.col)
          );
          
          if (tigerOptions.length < minOptions) {
            minOptions = tigerOptions.length;
            bestPos = pos;
          }
        }
        return { type: 'place', position: bestPos };
      }
      
      // If can't place adjacent, find any empty spot
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!isOccupied(r, c)) {
            return { type: 'place', position: { row: r, col: c } };
          }
        }
      }
    } else if (gameState.phase === 'playing') {
      // Move goats to trap tiger
      for (let i = 0; i < gameState.goatPositions.length; i++) {
        const goat = gameState.goatPositions[i];
        const goatMoves = getAdjacentPositions(goat).filter(pos => !isOccupied(pos.row, pos.col));
        
        for (const move of goatMoves) {
          // Check if this move helps trap the tiger
          const simulatedGoats = gameState.goatPositions.map((g, idx) => 
            idx === i ? move : g
          );
          
          // Avoid moving into capture position
          const wouldBeCaptured = getTigerCapturesWithGoats(tiger, simulatedGoats).length > 0;
          if (!wouldBeCaptured) {
            const adjacentToTiger = getAdjacentPositions(tiger);
            const isAdjacentToTiger = adjacentToTiger.some(p => p.row === move.row && p.col === move.col);
            
            if (isAdjacentToTiger) {
              return { type: 'move', fromIndex: i, toPosition: move };
            }
          }
        }
      }
      
      // Default: move any goat that can move
      for (let i = 0; i < gameState.goatPositions.length; i++) {
        const goat = gameState.goatPositions[i];
        const goatMoves = getAdjacentPositions(goat).filter(pos => !isOccupied(pos.row, pos.col));
        if (goatMoves.length > 0) {
          return { type: 'move', fromIndex: i, toPosition: goatMoves[0] };
        }
      }
    }
    
    return null;
  };

  // Helper for computer strategy
  const getTigerCapturesWithGoats = (tigerPos: Position, goats: Position[]): Position[] => {
    const captures: Position[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
      const goatRow = tigerPos.row + dr;
      const goatCol = tigerPos.col + dc;
      const landRow = tigerPos.row + 2 * dr;
      const landCol = tigerPos.col + 2 * dc;
      
      if (goatRow >= 0 && goatRow < rows && goatCol >= 0 && goatCol < cols &&
          landRow >= 0 && landRow < rows && landCol >= 0 && landCol < cols) {
        const hasGoat = goats.some(g => g.row === goatRow && g.col === goatCol);
        const tigerThere = tigerPos.row === landRow && tigerPos.col === landCol;
        const goatThere = goats.some(g => g.row === landRow && g.col === landCol);
        
        if (hasGoat && !tigerThere && !goatThere) {
          captures.push({ row: goatRow, col: goatCol });
        }
      }
    }
    return captures;
  };

  // Computer move for tiger
  const getTigerComputerMove = (): Position | null => {
    const tiger = gameState.tigerPosition;
    if (!tiger) return null;

    // Check for captures first
    const captures = getTigerCaptures(tiger);
    if (captures.length > 0) {
      return captures[0].jumpTo;
    }

    // Otherwise move to any valid position
    const moves = getValidTigerMoves(tiger);
    if (moves.length > 0) {
      // Prefer moves that might set up captures
      return moves[Math.floor(Math.random() * moves.length)];
    }

    return null;
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (gameState.winner) return;

    const clickedPos = { row, col };
    const isComputerTurn = gameMode === 'vs-computer' && 
      ((gameState.turn === 'tiger' && computerSide === 'tiger') ||
       (gameState.turn === 'goats' && computerSide === 'goats'));
    
    if (isComputerTurn) return;

    if (gameState.phase === 'tiger-placement') {
      // Place tiger
      setGameState(prev => ({
        ...prev,
        tigerPosition: clickedPos,
        phase: 'goat-placement',
        turn: 'goats',
      }));
    } else if (gameState.phase === 'goat-placement') {
      if (gameState.turn === 'goats') {
        // Place a goat
        if (isOccupied(row, col)) return;
        
        const newGoatPositions = [...gameState.goatPositions, clickedPos];
        const newGoatsPlaced = gameState.goatsPlaced + 1;
        
        setGameState(prev => ({
          ...prev,
          goatPositions: newGoatPositions,
          goatsPlaced: newGoatsPlaced,
          turn: 'tiger',
        }));
      } else if (gameState.turn === 'tiger') {
        // Tiger moves during goat placement
        if (!gameState.tigerPosition) return;
        
        const validMoves = getValidTigerMoves(gameState.tigerPosition);
        const captures = getTigerCaptures(gameState.tigerPosition);
        
        // Check for capture
        const capture = captures.find(c => c.jumpTo.row === row && c.jumpTo.col === col);
        if (capture) {
          // Tiger captures a goat - tiger wins!
          setGameState(prev => ({
            ...prev,
            tigerPosition: capture.jumpTo,
            goatPositions: prev.goatPositions.filter(
              g => !(g.row === capture.capturedGoat.row && g.col === capture.capturedGoat.col)
            ),
            winner: 'tiger',
          }));
          return;
        }
        
        // Regular move
        const isValidMove = validMoves.some(m => m.row === row && m.col === col);
        if (!isValidMove) return;
        
        const newPhase = gameState.goatsPlaced >= gameState.goatsToPlace - 1 ? 'playing' : 'goat-placement';
        
        setGameState(prev => ({
          ...prev,
          tigerPosition: clickedPos,
          phase: prev.goatsPlaced >= prev.goatsToPlace ? 'playing' : 'goat-placement',
          turn: 'goats',
        }));
      }
    } else if (gameState.phase === 'playing') {
      if (gameState.turn === 'tiger') {
        if (!gameState.tigerPosition) return;
        
        const validMoves = getValidTigerMoves(gameState.tigerPosition);
        const captures = getTigerCaptures(gameState.tigerPosition);
        
        // Check for capture
        const capture = captures.find(c => c.jumpTo.row === row && c.jumpTo.col === col);
        if (capture) {
          setGameState(prev => ({
            ...prev,
            tigerPosition: capture.jumpTo,
            goatPositions: prev.goatPositions.filter(
              g => !(g.row === capture.capturedGoat.row && g.col === capture.capturedGoat.col)
            ),
            winner: 'tiger',
          }));
          return;
        }
        
        const isValidMove = validMoves.some(m => m.row === row && m.col === col);
        if (!isValidMove) return;
        
        setGameState(prev => {
          const newState = {
            ...prev,
            tigerPosition: clickedPos,
            turn: 'goats' as Turn,
          };
          
          // Check if goats win (tiger trapped after this move)
          if (isTigerTrapped(clickedPos)) {
            return { ...newState, winner: 'goats' };
          }
          
          return newState;
        });
      } else {
        // Goat turn - select or move a goat
        const clickedGoatIndex = gameState.goatPositions.findIndex(
          g => g.row === row && g.col === col
        );
        
        if (clickedGoatIndex !== -1) {
          // Select this goat
          setGameState(prev => ({
            ...prev,
            selectedGoat: clickedGoatIndex,
          }));
        } else if (gameState.selectedGoat !== null) {
          // Try to move selected goat
          const selectedGoatPos = gameState.goatPositions[gameState.selectedGoat];
          const validMoves = getAdjacentPositions(selectedGoatPos).filter(
            pos => !isOccupied(pos.row, pos.col)
          );
          
          const isValidMove = validMoves.some(m => m.row === row && m.col === col);
          if (!isValidMove) return;
          
          const newGoatPositions = gameState.goatPositions.map((g, i) =>
            i === gameState.selectedGoat ? clickedPos : g
          );
          
          setGameState(prev => {
            const newState = {
              ...prev,
              goatPositions: newGoatPositions,
              selectedGoat: null,
              turn: 'tiger' as Turn,
            };
            
            // Check if tiger is trapped with the NEW goat positions
            if (prev.tigerPosition && isTigerTrappedWithGoats(prev.tigerPosition, newGoatPositions)) {
              return { ...newState, winner: 'goats' };
            }
            
            return newState;
          });
        }
      }
    }
  };

  // Computer makes a move
  useEffect(() => {
    if (gameState.winner) return;
    if (gameMode !== 'vs-computer') return;
    if (gameState.phase === 'setup') return;

    const isComputerTurn = 
      (gameState.turn === 'tiger' && computerSide === 'tiger') ||
      (gameState.turn === 'goats' && computerSide === 'goats');
    
    if (!isComputerTurn) return;

    const timer = setTimeout(() => {
      if (gameState.turn === 'tiger' && gameState.tigerPosition) {
        const move = getTigerComputerMove();
        if (move) {
          // Check if it's a capture
          const captures = getTigerCaptures(gameState.tigerPosition);
          const capture = captures.find(c => c.jumpTo.row === move.row && c.jumpTo.col === move.col);
          
          if (capture) {
            setGameState(prev => ({
              ...prev,
              tigerPosition: capture.jumpTo,
              goatPositions: prev.goatPositions.filter(
                g => !(g.row === capture.capturedGoat.row && g.col === capture.capturedGoat.col)
              ),
              winner: 'tiger',
            }));
          } else {
            setGameState(prev => ({
              ...prev,
              tigerPosition: move,
              phase: prev.goatsPlaced >= prev.goatsToPlace ? 'playing' : prev.phase,
              turn: 'goats',
            }));
          }
        }
      } else if (gameState.turn === 'goats') {
        const goatMove = getGoatComputerMove();
        if (goatMove) {
          if (goatMove.type === 'place' && goatMove.position) {
            const newGoatPositions = [...gameState.goatPositions, goatMove.position];
            setGameState(prev => ({
              ...prev,
              goatPositions: newGoatPositions,
              goatsPlaced: prev.goatsPlaced + 1,
              turn: 'tiger',
            }));
          } else if (goatMove.type === 'move' && goatMove.fromIndex !== undefined && goatMove.toPosition) {
            const newGoatPositions = gameState.goatPositions.map((g, i) =>
              i === goatMove.fromIndex ? goatMove.toPosition! : g
            );
            
            setGameState(prev => {
              const newState = {
                ...prev,
                goatPositions: newGoatPositions,
                turn: 'tiger' as Turn,
              };
              
              // Check if tiger is trapped with the NEW goat positions
              if (prev.tigerPosition && isTigerTrappedWithGoats(prev.tigerPosition, newGoatPositions)) {
                return { ...newState, winner: 'goats' };
              }
              
              return newState;
            });
          }
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [gameState, gameMode, computerSide]);

  // Check for goat placement phase completion
  useEffect(() => {
    if (gameState.phase === 'goat-placement' && 
        gameState.goatsPlaced >= gameState.goatsToPlace &&
        gameState.turn === 'goats') {
      setGameState(prev => ({
        ...prev,
        phase: 'playing',
      }));
    }
  }, [gameState.goatsPlaced, gameState.goatsToPlace, gameState.phase, gameState.turn]);

  // Render grid cell
  const renderCell = (row: number, col: number) => {
    const isTiger = gameState.tigerPosition?.row === row && gameState.tigerPosition?.col === col;
    const goatIndex = gameState.goatPositions.findIndex(g => g.row === row && g.col === col);
    const isGoat = goatIndex !== -1;
    const isSelected = gameState.selectedGoat === goatIndex;
    
    const validTigerMoves = gameState.tigerPosition ? getValidTigerMoves(gameState.tigerPosition) : [];
    const tigerCaptures = gameState.tigerPosition ? getTigerCaptures(gameState.tigerPosition) : [];
    const isValidTigerMove = gameState.turn === 'tiger' && gameState.phase !== 'setup' && gameState.phase !== 'tiger-placement' &&
      (validTigerMoves.some(m => m.row === row && m.col === col) ||
       tigerCaptures.some(c => c.jumpTo.row === row && c.jumpTo.col === col));
    
    const selectedGoatPos = gameState.selectedGoat !== null ? gameState.goatPositions[gameState.selectedGoat] : null;
    const validGoatMoves = selectedGoatPos ? getAdjacentPositions(selectedGoatPos).filter(p => !isOccupied(p.row, p.col)) : [];
    const isValidGoatMove = gameState.turn === 'goats' && gameState.phase === 'playing' &&
      validGoatMoves.some(m => m.row === row && m.col === col);
    
    const canPlaceGoat = gameState.phase === 'goat-placement' && gameState.turn === 'goats' && !isOccupied(row, col);
    const isCaptureTarget = tigerCaptures.some(c => c.capturedGoat.row === row && c.capturedGoat.col === col);

    return (
      <div
        key={`${row}-${col}`}
        onClick={() => handleCellClick(row, col)}
        className={`
          w-16 h-16 border-2 border-border rounded-lg flex items-center justify-center text-3xl
          cursor-pointer transition-all duration-200
          ${isSelected ? 'ring-4 ring-primary bg-primary/20' : ''}
          ${isValidTigerMove ? 'bg-orange-200 dark:bg-orange-900/30' : ''}
          ${isValidGoatMove ? 'bg-green-200 dark:bg-green-900/30' : ''}
          ${canPlaceGoat ? 'bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40' : ''}
          ${isCaptureTarget && gameState.turn === 'tiger' ? 'bg-red-200 dark:bg-red-900/30' : ''}
          ${!isTiger && !isGoat && !isValidTigerMove && !isValidGoatMove && !canPlaceGoat ? 'hover:bg-muted' : ''}
        `}
      >
        {isTiger && '🐯'}
        {isGoat && '🐐'}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Bagchal (Tiger and Goats)</CardTitle>
        <CardDescription>
          A strategic game where the tiger tries to capture goats, while goats try to trap the tiger.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {gameState.phase === 'setup' ? (
          <div className="space-y-6">
            {/* Grid size controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Rows (m): {rows}</Label>
                <Slider
                  value={[rows]}
                  onValueChange={(v) => { setRows(v[0]); setNumGoats(Math.min(numGoats, v[0] * cols - 1)); }}
                  min={2}
                  max={10}
                  step={1}
                />
              </div>
              <div className="space-y-3">
                <Label>Columns (n): {cols}</Label>
                <Slider
                  value={[cols]}
                  onValueChange={(v) => { setCols(v[0]); setNumGoats(Math.min(numGoats, rows * v[0] - 1)); }}
                  min={2}
                  max={10}
                  step={1}
                />
              </div>
            </div>

            {/* Number of goats */}
            <div className="space-y-3">
              <Label>Number of Goats (k): {numGoats}</Label>
              <Slider
                value={[numGoats]}
                onValueChange={(v) => setNumGoats(v[0])}
                min={1}
                max={maxGoats}
                step={1}
              />
              <p className="text-sm text-muted-foreground">Max: {maxGoats} goats for {rows}×{cols} grid</p>
            </div>

            {/* Game mode */}
            <div className="space-y-3">
              <Label>Game Mode</Label>
              <RadioGroup value={gameMode} onValueChange={(v) => setGameMode(v as GameMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2-player" id="2-player" />
                  <Label htmlFor="2-player">2 Player</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vs-computer" id="vs-computer" />
                  <Label htmlFor="vs-computer">Play vs Computer</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Computer side selection */}
            {gameMode === 'vs-computer' && (
              <div className="space-y-3">
                <Label>You play as:</Label>
                <RadioGroup value={computerSide === 'tiger' ? 'goats' : 'tiger'} onValueChange={(v) => setComputerSide(v === 'tiger' ? 'goats' : 'tiger')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tiger" id="play-tiger" />
                    <Label htmlFor="play-tiger">🐯 Tiger</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="goats" id="play-goats" />
                    <Label htmlFor="play-goats">🐐 Goats</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <Button onClick={startGame} size="lg" className="w-full">
              Start Game
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Game status */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={gameState.turn === 'tiger' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                {gameState.turn === 'tiger' ? '🐯 Tiger\'s Turn' : '🐐 Goats\' Turn'}
              </Badge>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Phase: {gameState.phase === 'tiger-placement' ? 'Place Tiger' : 
                        gameState.phase === 'goat-placement' ? `Place Goats (${gameState.goatsPlaced}/${gameState.goatsToPlace})` : 
                        'Playing'}
              </Badge>
              {gameState.winner && (
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {gameState.winner === 'tiger' ? '🐯 Tiger Wins!' : '🐐 Goats Win!'}
                </Badge>
              )}
            </div>

            {/* Instructions */}
            <div className="text-sm text-muted-foreground">
              {gameState.phase === 'tiger-placement' && 'Click on any cell to place the tiger.'}
              {gameState.phase === 'goat-placement' && gameState.turn === 'goats' && 'Click on an empty cell to place a goat.'}
              {gameState.phase === 'goat-placement' && gameState.turn === 'tiger' && 'Tiger: Click on an adjacent empty cell to move.'}
              {gameState.phase === 'playing' && gameState.turn === 'tiger' && 'Tiger: Click on an adjacent cell to move, or jump over a goat to capture.'}
              {gameState.phase === 'playing' && gameState.turn === 'goats' && 'Click a goat to select it, then click an adjacent empty cell to move.'}
            </div>

            {/* Game grid */}
            <div className="flex justify-center overflow-x-auto">
              <div 
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: rows }, (_, row) =>
                  Array.from({ length: cols }, (_, col) => renderCell(row, col))
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-200 dark:bg-orange-900/30 rounded"></div>
                <span>Valid tiger move</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 dark:bg-green-900/30 rounded"></div>
                <span>Valid goat move</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 dark:bg-red-900/30 rounded"></div>
                <span>Capturable goat</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button onClick={resetGame} variant="outline">
                Reset Game
              </Button>
              <Button onClick={() => setGameState(prev => ({ ...prev, phase: 'setup' }))} variant="secondary">
                Change Settings
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default BagchalGame;
