import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Undo2 } from 'lucide-react';

interface Edge {
  from: number;
  to: number;
  color: 'red' | 'blue' | null;
}

interface GameState {
  edges: Edge[];
  currentPlayer: 'red' | 'blue';
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  moveHistory: Edge[];
}

interface GameOfSimProps {
}

const GameOfSim: React.FC<GameOfSimProps> = () => {
  const [vertices, setVertices] = useState(6);
  const [gameState, setGameState] = useState<GameState>(() => initializeGame(6));

  function initializeGame(numVertices: number): GameState {
    const edges: Edge[] = [];
    
    // Create all possible edges between vertices
    for (let i = 0; i < numVertices; i++) {
      for (let j = i + 1; j < numVertices; j++) {
        edges.push({ from: i, to: j, color: null });
      }
    }

    return {
      edges,
      currentPlayer: 'red',
      gameOver: false,
      winner: null,
      moveHistory: []
    };
  }

  const resetGame = useCallback(() => {
    setGameState(initializeGame(vertices));
  }, [vertices]);

  const undoMove = useCallback(() => {
    if (gameState.moveHistory.length === 0) return;

    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    const newEdges = gameState.edges.map(edge => {
      if (edge.from === lastMove.from && edge.to === lastMove.to) {
        return { ...edge, color: null };
      }
      return edge;
    });

    setGameState(prev => ({
      ...prev,
      edges: newEdges,
      currentPlayer: prev.currentPlayer === 'red' ? 'blue' : 'red',
      moveHistory: prev.moveHistory.slice(0, -1),
      gameOver: false,
      winner: null
    }));
  }, [gameState.moveHistory, gameState.edges]);

  const checkForTriangle = useCallback((edges: Edge[], player: 'red' | 'blue'): boolean => {
    const playerEdges = edges.filter(edge => edge.color === player);
    
    // Check all possible triangles
    for (let i = 0; i < vertices; i++) {
      for (let j = i + 1; j < vertices; j++) {
        for (let k = j + 1; k < vertices; k++) {
          // Check if all three edges of triangle exist for this player
          const edge1 = playerEdges.find(e => (e.from === i && e.to === j) || (e.from === j && e.to === i));
          const edge2 = playerEdges.find(e => (e.from === i && e.to === k) || (e.from === k && e.to === i));
          const edge3 = playerEdges.find(e => (e.from === j && e.to === k) || (e.from === k && e.to === j));
          
          if (edge1 && edge2 && edge3) {
            return true;
          }
        }
      }
    }
    return false;
  }, [vertices]);

  const handleEdgeClick = useCallback((edgeIndex: number) => {
    if (gameState.gameOver || gameState.edges[edgeIndex].color !== null) return;

    const newEdges = [...gameState.edges];
    const clickedEdge = { ...newEdges[edgeIndex], color: gameState.currentPlayer };
    newEdges[edgeIndex] = clickedEdge;

    // Check if this move creates a triangle
    const hasTriangle = checkForTriangle(newEdges, gameState.currentPlayer);

    setGameState(prev => ({
      edges: newEdges,
      currentPlayer: hasTriangle ? prev.currentPlayer : (prev.currentPlayer === 'red' ? 'blue' : 'red'),
      gameOver: hasTriangle,
      winner: hasTriangle ? (prev.currentPlayer === 'red' ? 'blue' : 'red') : null,
      moveHistory: [...prev.moveHistory, clickedEdge]
    }));
  }, [gameState, checkForTriangle]);

  const getVertexPosition = (index: number, total: number) => {
    const angle = (2 * Math.PI * index) / total;
    const radius = 120;
    const centerX = 150;
    const centerY = 150;
    
    return {
      x: centerX + radius * Math.cos(angle - Math.PI / 2),
      y: centerY + radius * Math.sin(angle - Math.PI / 2)
    };
  };

  const handleVerticesChange = (value: string) => {
    const newVertices = parseInt(value);
    setVertices(newVertices);
    setGameState(initializeGame(newVertices));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Game of Sim</CardTitle>
          <CardDescription className="text-center">
            Take turns coloring the lines between dots. Avoid creating a triangle of your color - first player to make one loses!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label htmlFor="vertices-select" className="text-sm font-medium">
                Vertices:
              </label>
              <Select value={vertices.toString()} onValueChange={handleVerticesChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undoMove}
                disabled={gameState.moveHistory.length === 0}
              >
                <Undo2 className="w-4 h-4 mr-1" />
                Undo
              </Button>
              <Button variant="outline" size="sm" onClick={resetGame}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset Game
              </Button>
            </div>
          </div>

          {/* Current Turn Indicator */}
          <div className="text-center">
            {gameState.gameOver ? (
              <div className="space-y-2">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Game Over!
                </Badge>
                <p className="text-lg font-medium">
                  <span className={gameState.winner === 'blue' ? 'text-blue-600' : 'text-red-600'}>
                    {gameState.winner === 'blue' ? 'Blue' : 'Red'} Player
                  </span>{' '}
                  wins!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Turn:</p>
                <Badge 
                  variant="outline" 
                  className={`text-lg px-4 py-2 ${
                    gameState.currentPlayer === 'red' 
                      ? 'border-red-500 text-red-600' 
                      : 'border-blue-500 text-blue-600'
                  }`}
                >
                  {gameState.currentPlayer === 'red' ? 'Red' : 'Blue'} Player
                </Badge>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="flex justify-center">
            <div className="bg-surface rounded-lg p-8 border">
              <svg width="300" height="300" viewBox="0 0 300 300">
                {/* Draw edges */}
                {gameState.edges.map((edge, index) => {
                  const pos1 = getVertexPosition(edge.from, vertices);
                  const pos2 = getVertexPosition(edge.to, vertices);
                  
                  return (
                    <line
                      key={index}
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke={edge.color || '#e2e8f0'}
                      strokeWidth={edge.color ? 3 : 2}
                      className="cursor-pointer hover:stroke-gray-400 transition-colors"
                      onClick={() => handleEdgeClick(index)}
                    />
                  );
                })}
                
                {/* Draw vertices */}
                {Array.from({ length: vertices }, (_, i) => {
                  const pos = getVertexPosition(i, vertices);
                  return (
                    <g key={i}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="8"
                        fill="hsl(var(--primary))"
                        stroke="hsl(var(--background))"
                        strokeWidth="2"
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 20}
                        textAnchor="middle"
                        className="text-sm font-medium fill-foreground"
                      >
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Click on the lines between dots to color them with your color.
            </p>
            <p className="text-sm font-medium text-foreground">
              Avoid creating a triangle of your own color!
            </p>
          </div>

          {/* Social Share */}
        </CardContent>
      </Card>
    </div>
  );
};

export default GameOfSim;