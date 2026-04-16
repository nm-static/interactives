import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, RotateCcw, Trophy, Clock, Info, ChevronDown, ChevronUp, User, UserCircle, Users, UserCheck, UserX, Baby, PersonStanding, Smile, Frown, Meh } from 'lucide-react';

interface Person {
  id: number;
  x: number;
  y: number;
  color: 'grey' | 'blue' | 'pink';
}

interface Edge {
  from: number;
  to: number;
  isViolation: boolean;
}

interface SikiniaParliamentPuzzleProps {
}

const SikiniaParliamentPuzzle: React.FC<SikiniaParliamentPuzzleProps> = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Initialize people in circular layout
  useEffect(() => {
    const centerX = 200;
    const centerY = 200;
    const radius = 150;
    const newPeople: Person[] = [];

    for (let i = 0; i < 10; i++) {
      const angle = (i * 2 * Math.PI) / 10 - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      newPeople.push({
        id: i,
        x,
        y,
        color: 'grey'
      });
    }
    setPeople(newPeople);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Generate random graph with max degree 3
  const generateRandomGraph = useCallback(() => {
    const newEdges: Edge[] = [];
    const degrees = new Array(10).fill(0);
    
    // Try to create edges while respecting max degree constraint
    for (let attempts = 0; attempts < 100 && newEdges.length < 15; attempts++) {
      const from = Math.floor(Math.random() * 10);
      const to = Math.floor(Math.random() * 10);
      
      if (from !== to && 
          degrees[from] < 3 && 
          degrees[to] < 3 && 
          !newEdges.some(e => (e.from === from && e.to === to) || (e.from === to && e.to === from))) {
        newEdges.push({ from, to, isViolation: false });
        degrees[from]++;
        degrees[to]++;
      }
    }
    
    setEdges(newEdges);
  }, []);

  // Check for violations and update edge colors
  const updateViolations = useCallback(() => {
    const updatedEdges = edges.map(edge => {
      const person1 = people.find(p => p.id === edge.from);
      const person2 = people.find(p => p.id === edge.to);
      
      if (!person1 || !person2 || person1.color === 'grey' || person2.color === 'grey') {
        return { ...edge, isViolation: false };
      }
      
      if (person1.color === person2.color) {
        // Check if either person has more than 1 enemy of their color
        const person1Enemies = edges.filter(e => 
          (e.from === person1.id || e.to === person1.id) &&
          e !== edge
        ).map(e => e.from === person1.id ? e.to : e.from)
         .map(id => people.find(p => p.id === id))
         .filter(p => p && p.color === person1.color);
        
        const person2Enemies = edges.filter(e => 
          (e.from === person2.id || e.to === person2.id) &&
          e !== edge
        ).map(e => e.from === person2.id ? e.to : e.from)
         .map(id => people.find(p => p.id === id))
         .filter(p => p && p.color === person2.color);
        
        return { ...edge, isViolation: person1Enemies.length >= 1 || person2Enemies.length >= 1 };
      }
      
      return { ...edge, isViolation: false };
    });
    
    setEdges(updatedEdges);
    return updatedEdges;
  }, [people, edges]);

  // Check if puzzle is solved
  const checkCompletion = useCallback(() => {
    if (!gameStarted) return;
    
    const allColored = people.every(p => p.color !== 'grey');
    const noViolations = edges.every(e => !e.isViolation);
    
    if (allColored && noViolations && !isComplete) {
      setIsComplete(true);
      setIsRunning(false);
      
      if (!bestTime || timer < bestTime) {
        setBestTime(timer);
        localStorage.setItem('sikinia-best-time', timer.toString());
      }
    }
  }, [people, edges, gameStarted, isComplete, timer, bestTime]);

  useEffect(() => {
    const updatedEdges = updateViolations();
    
    // Check completion with the updated edges
    if (gameStarted && !isComplete) {
      const allColored = people.every(p => p.color !== 'grey');
      const noViolations = updatedEdges.every(e => !e.isViolation);
      
      if (allColored && noViolations) {
        setIsComplete(true);
        setIsRunning(false);
        
        if (!bestTime || timer < bestTime) {
          setBestTime(timer);
          localStorage.setItem('sikinia-best-time', timer.toString());
        }
      }
    }
  }, [people, updateViolations, gameStarted, isComplete, timer, bestTime]);

  // Load best time from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sikinia-best-time');
    if (saved) {
      setBestTime(parseInt(saved));
    }
  }, []);

  const startGame = () => {
    generateRandomGraph();
    setGameStarted(true);
    setIsRunning(true);
    setTimer(0);
    setIsComplete(false);
    setPeople(people.map(p => ({ ...p, color: 'grey' })));
  };

  const resetGame = () => {
    setGameStarted(false);
    setIsRunning(false);
    setTimer(0);
    setIsComplete(false);
    setEdges([]);
    setPeople(people.map(p => ({ ...p, color: 'grey' })));
  };

  const colorPerson = (id: number) => {
    if (!gameStarted) return;
    
    setPeople(people.map(person => {
      if (person.id === id) {
        const nextColor = person.color === 'grey' ? 'blue' : 
                         person.color === 'blue' ? 'pink' : 'grey';
        return { ...person, color: nextColor };
      }
      return person;
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPersonColor = (color: string) => {
    switch (color) {
      case 'blue': return '#3b82f6';
      case 'pink': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const getPersonIcon = (id: number) => {
    const icons = [User, UserCircle, Users, UserCheck, UserX, Baby, PersonStanding, Smile, Frown, Meh];
    return icons[id];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                Parliament of Sikinia Puzzle
                <Badge variant="secondary" className="text-xs">Graph Theory</Badge>
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Separate parliament members into two houses so each has at most one enemy in their house
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
              className="shrink-0"
            >
              <Info className="w-4 h-4 mr-2" />
              Rules
              {showExplanation ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showExplanation && (
            <Alert className="mb-6">
              <AlertDescription>
                <strong>Goal:</strong> Color all 10 parliament members blue or pink such that each member has at most one enemy of their own color in their house.<br/>
                <strong>How to play:</strong> Click grey icons to make them blue, blue to make them pink, pink to make them grey. Red edges indicate violations (someone has more than one enemy of their color).<br/>
                <strong>Mathematical insight:</strong> This demonstrates that any graph with maximum degree 3 is 2-colorable in a way that each vertex has at most one neighbor of its color.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            <div className="flex gap-4">
              {!gameStarted ? (
                <Button onClick={startGame} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Start Game
                </Button>
              ) : (
                <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timer)}</span>
              </div>
              {bestTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="w-4 h-4" />
                  <span className="font-mono">{formatTime(bestTime)}</span>
                </div>
              )}
            </div>
          </div>

          {isComplete && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                🎉 Congratulations! You've successfully separated the parliament in {formatTime(timer)}!
                {timer === bestTime && " New best time!"}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <div className="relative">
              <svg width="400" height="400" viewBox="0 0 400 400">
                {/* Draw edges */}
                {edges.map((edge, index) => {
                  const person1 = people.find(p => p.id === edge.from);
                  const person2 = people.find(p => p.id === edge.to);
                  if (!person1 || !person2) return null;
                  
                  return (
                    <line
                      key={index}
                      x1={person1.x}
                      y1={person1.y}
                      x2={person2.x}
                      y2={person2.y}
                      stroke={edge.isViolation ? "#ef4444" : "#d1d5db"}
                      strokeWidth={edge.isViolation ? "3" : "2"}
                      className={edge.isViolation ? "animate-pulse" : ""}
                    />
                  );
                })}
                
                {/* Draw people */}
                {people.map((person) => (
                  <g key={person.id}>
                    <circle
                      cx={person.x}
                      cy={person.y}
                      r="20"
                      fill={getPersonColor(person.color)}
                      stroke={person.color === 'grey' ? "#374151" : "white"}
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => colorPerson(person.id)}
                    />
                    <foreignObject
                      x={person.x - 10}
                      y={person.y - 10}
                      width="20"
                      height="20"
                      className="pointer-events-none"
                    >
                      {(() => {
                        const IconComponent = getPersonIcon(person.id);
                        return (
                          <IconComponent 
                            size={16} 
                            color="white" 
                            className="w-4 h-4"
                            style={{ display: 'block', margin: '2px auto' }}
                          />
                        );
                      })()}
                    </foreignObject>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span className="text-sm">Unassigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">House 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-pink-500"></div>
              <span className="text-sm">House 2</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Share */}
    </div>
  );
};

export default SikiniaParliamentPuzzle;