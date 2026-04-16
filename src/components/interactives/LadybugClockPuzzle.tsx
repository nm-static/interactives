import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw, SkipForward, FastForward, Info, ExternalLink, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
interface LadybugClockPuzzleProps {
}
interface SimulationState {
  position: number; // 0-11 (0 = 12 o'clock, 1 = 1 o'clock, etc.)
  visited: Set<number>;
  path: number[];
  lastPainted: number | null;
  isComplete: boolean;
  moveCount: number;
}
const CLOCK_NUMBERS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const LadybugClockPuzzle: React.FC<LadybugClockPuzzleProps> = () => {
  // Simulation state
  const [simulation, setSimulation] = useState<SimulationState>({
    position: 0,
    visited: new Set([0]),
    path: [0],
    lastPainted: null,
    isComplete: false,
    moveCount: 0
  });

  // Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50); // 1-100, maps to delay
  const [numPositions, setNumPositions] = useState(12);

  // Statistics
  const [lastPaintedCounts, setLastPaintedCounts] = useState<Record<number, number>>({});
  const [totalSimulations, setTotalSimulations] = useState(0);
  const [averageMoves, setAverageMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);

  // User prediction
  const [userPrediction, setUserPrediction] = useState<number | null>(null);
  const [showPredictionResult, setShowPredictionResult] = useState(false);

  // Refs
  const animationRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Get delay from speed (inverse relationship)
  const getDelay = useCallback(() => {
    return Math.max(50, 1000 - speed * 9);
  }, [speed]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setSimulation({
      position: 0,
      visited: new Set([0]),
      path: [0],
      lastPainted: null,
      isComplete: false,
      moveCount: 0
    });
  }, []);

  // Perform one step
  const step = useCallback(() => {
    setSimulation(prev => {
      if (prev.isComplete) return prev;

      // Random move: clockwise or counterclockwise
      const direction = Math.random() < 0.5 ? 1 : -1;
      const newPosition = ((prev.position + direction) % numPositions + numPositions) % numPositions;
      const newVisited = new Set(prev.visited);
      const wasNewlyPainted = !newVisited.has(newPosition);
      newVisited.add(newPosition);
      const isNowComplete = newVisited.size === numPositions;
      const lastPainted = isNowComplete && wasNewlyPainted ? newPosition : prev.lastPainted;
      return {
        position: newPosition,
        visited: newVisited,
        path: [...prev.path, newPosition],
        lastPainted: lastPainted,
        isComplete: isNowComplete,
        moveCount: prev.moveCount + 1
      };
    });
  }, [numPositions]);

  // Auto-play loop
  useEffect(() => {
    if (!isPlaying || simulation.isComplete) {
      return;
    }
    const timeoutId = setTimeout(() => {
      if (isPlayingRef.current && !simulation.isComplete) {
        step();
      }
    }, getDelay());
    return () => clearTimeout(timeoutId);
  }, [isPlaying, simulation, step, getDelay]);

  // Handle simulation completion
  useEffect(() => {
    if (simulation.isComplete && simulation.lastPainted !== null) {
      setIsPlaying(false);
    }
  }, [simulation.isComplete, simulation.lastPainted]);

  // Run instant simulation (no animation)
  const runInstantSimulation = useCallback(() => {
    let position = 0;
    const visited = new Set([0]);
    let moveCount = 0;
    let lastPainted = 0;
    while (visited.size < numPositions) {
      const direction = Math.random() < 0.5 ? 1 : -1;
      position = ((position + direction) % numPositions + numPositions) % numPositions;
      if (!visited.has(position)) {
        lastPainted = position;
        visited.add(position);
      }
      moveCount++;
    }
    return {
      lastPainted,
      moveCount
    };
  }, [numPositions]);

  // Run to completion
  const runToCompletion = useCallback(() => {
    setIsPlaying(false);
    let currentSim = simulation;
    let position = currentSim.position;
    const visited = new Set(currentSim.visited);
    let moveCount = currentSim.moveCount;
    let lastPainted = currentSim.lastPainted;
    const path = [...currentSim.path];
    while (visited.size < numPositions) {
      const direction = Math.random() < 0.5 ? 1 : -1;
      position = ((position + direction) % numPositions + numPositions) % numPositions;
      path.push(position);
      if (!visited.has(position)) {
        lastPainted = position;
        visited.add(position);
      }
      moveCount++;
    }
    setSimulation({
      position,
      visited,
      path,
      lastPainted,
      isComplete: true,
      moveCount
    });
  }, [simulation, numPositions]);

  // Run batch simulations
  const runBatchSimulations = useCallback((count: number) => {
    const newCounts = {
      ...lastPaintedCounts
    };
    let batchMoves = 0;
    for (let i = 0; i < count; i++) {
      const result = runInstantSimulation();
      newCounts[result.lastPainted] = (newCounts[result.lastPainted] || 0) + 1;
      batchMoves += result.moveCount;
    }
    setLastPaintedCounts(newCounts);
    setTotalSimulations(prev => prev + count);
    setTotalMoves(prev => prev + batchMoves);
    setAverageMoves((totalMoves + batchMoves) / (totalSimulations + count));
  }, [lastPaintedCounts, runInstantSimulation, totalMoves, totalSimulations]);

  // Clear statistics
  const clearStats = useCallback(() => {
    setLastPaintedCounts({});
    setTotalSimulations(0);
    setAverageMoves(0);
    setTotalMoves(0);
    setUserPrediction(null);
    setShowPredictionResult(false);
  }, []);

  // Reset everything when numPositions changes
  useEffect(() => {
    resetSimulation();
    clearStats();
  }, [numPositions, resetSimulation, clearStats]);

  // Convert position index to display number
  const positionToNumber = (pos: number) => {
    if (numPositions === 12) {
      return pos === 0 ? 12 : pos;
    }
    return pos + 1;
  };

  // Calculate clock position for a given index
  const getClockPosition = (index: number, radius: number) => {
    const angle = index / numPositions * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  // Prepare chart data
  const chartData = Array.from({
    length: numPositions - 1
  }, (_, i) => {
    const pos = i + 1; // 1 to n-1 (0/12 can't be last)
    const count = lastPaintedCounts[pos] || 0;
    const percentage = totalSimulations > 0 ? count / totalSimulations * 100 : 0;
    return {
      position: positionToNumber(pos),
      count,
      percentage,
      label: `${positionToNumber(pos)}`
    };
  });
  const theoreticalProbability = 100 / (numPositions - 1);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/puzzles/ladybug-clock` : '';
  return <div className="w-full max-w-6xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">The Ladybug Clock Puzzle</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A ladybug walks randomly on a clock face. What's the probability each number is painted last?
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clock Visualization */}
        <Card className="bg-[#1a1a2e] border-slate-700">
          <CardContent className="p-6">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <svg viewBox="-150 -150 300 300" className="w-full h-full">
                {/* Clock face background */}
                <circle cx="0" cy="0" r="140" fill="#2d2d44" stroke="#4a4a6a" strokeWidth="3" />
                <circle cx="0" cy="0" r="120" fill="none" stroke="#3d3d5c" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Hour markers and numbers */}
                {Array.from({
                length: numPositions
              }, (_, i) => {
                const pos = getClockPosition(i, 100);
                const isPainted = simulation.visited.has(i);
                const isLast = simulation.isComplete && simulation.lastPainted === i;
                const isCurrent = simulation.position === i;
                return <g key={i}>
                      {/* Tick mark */}
                      <line x1={getClockPosition(i, 115).x} y1={getClockPosition(i, 115).y} x2={getClockPosition(i, 125).x} y2={getClockPosition(i, 125).y} stroke={isPainted ? '#f59e0b' : '#6b7280'} strokeWidth="2" />
                      
                      {/* Number circle background */}
                      <circle cx={pos.x} cy={pos.y} r="20" fill={isLast ? '#ef4444' : isPainted ? '#f59e0b' : '#374151'} className="transition-all duration-300" />
                      
                      {/* Glow effect for newly painted or last */}
                      {(isPainted || isLast) && <circle cx={pos.x} cy={pos.y} r="24" fill="none" stroke={isLast ? '#ef4444' : '#f59e0b'} strokeWidth="2" opacity="0.5" />}
                      
                      {/* Number text */}
                      <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill={isPainted ? '#1a1a2e' : '#d1d5db'} fontSize="14" fontWeight="bold" className="select-none">
                        {positionToNumber(i)}
                      </text>
                    </g>;
              })}
                
                {/* Ladybug */}
                {(() => {
                const ladybugPos = getClockPosition(simulation.position, 100);
                return <g transform={`translate(${ladybugPos.x}, ${ladybugPos.y})`} className="transition-transform duration-200">
                      {/* Ladybug body */}
                      <ellipse cx="0" cy="-30" rx="12" ry="15" fill="#dc2626" />
                      {/* Head */}
                      <circle cx="0" cy="-48" r="6" fill="#1f2937" />
                      {/* Center line */}
                      <line x1="0" y1="-45" x2="0" y2="-15" stroke="#1f2937" strokeWidth="2" />
                      {/* Spots */}
                      <circle cx="-5" cy="-35" r="3" fill="#1f2937" />
                      <circle cx="5" cy="-35" r="3" fill="#1f2937" />
                      <circle cx="-4" cy="-24" r="2.5" fill="#1f2937" />
                      <circle cx="4" cy="-24" r="2.5" fill="#1f2937" />
                      {/* Antennae */}
                      <line x1="-3" y1="-52" x2="-6" y2="-58" stroke="#1f2937" strokeWidth="1.5" />
                      <line x1="3" y1="-52" x2="6" y2="-58" stroke="#1f2937" strokeWidth="1.5" />
                    </g>;
              })()}
                
                {/* Center decoration */}
                <circle cx="0" cy="0" r="8" fill="#4a4a6a" />
              </svg>
            </div>
            
            {/* Status display */}
            <div className="mt-4 text-center space-y-2">
              <div className="flex justify-center gap-4 text-sm">
                <Badge variant="outline" className="bg-slate-800 text-slate-200">
                  Position: {positionToNumber(simulation.position)}
                </Badge>
                <Badge variant="outline" className="bg-slate-800 text-slate-200">
                  Moves: {simulation.moveCount}
                </Badge>
                <Badge variant="outline" className="bg-slate-800 text-slate-200">
                  Painted: {simulation.visited.size}/{numPositions}
                </Badge>
              </div>
              
              {simulation.isComplete && simulation.lastPainted !== null && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 font-semibold">
                    🎉 Complete! Last painted: <span className="text-red-300 text-lg">{positionToNumber(simulation.lastPainted)}</span>
                  </p>
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Controls and Stats */}
        <div className="space-y-4">
          {/* Simulation Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Simulation Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setIsPlaying(!isPlaying)} disabled={simulation.isComplete} variant={isPlaying ? "destructive" : "default"} size="sm">
                  {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button onClick={step} disabled={simulation.isComplete || isPlaying} variant="outline" size="sm">
                  <SkipForward className="w-4 h-4 mr-1" />
                  Step
                </Button>
                
                <Button onClick={runToCompletion} disabled={simulation.isComplete} variant="outline" size="sm">
                  <FastForward className="w-4 h-4 mr-1" />
                  Complete
                </Button>
                
                <Button onClick={resetSimulation} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Animation Speed</label>
                <Slider value={[speed]} onValueChange={v => setSpeed(v[0])} min={1} max={100} step={1} className="w-full" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Number of Positions: {numPositions}</label>
                <Slider value={[numPositions]} onValueChange={v => setNumPositions(v[0])} min={4} max={24} step={2} className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Batch Simulations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Batch Simulations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[100, 1000, 10000].map(count => <Button key={count} onClick={() => runBatchSimulations(count)} variant="outline" size="sm">
                    Run {count.toLocaleString()}
                  </Button>)}
                <Button onClick={clearStats} variant="ghost" size="sm">
                  Clear Stats
                </Button>
              </div>
              
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  Total simulations: <span className="text-foreground font-medium">{totalSimulations.toLocaleString()}</span>
                </p>
                {totalSimulations > 0 && <p className="text-muted-foreground">
                    Average moves to complete: <span className="text-foreground font-medium">{averageMoves.toFixed(1)}</span>
                  </p>}
              </div>
            </CardContent>
          </Card>

          {/* User Prediction */}
          {totalSimulations === 0 && <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Make a Prediction! 🤔</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Which number do you think is most likely to be painted last?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({
                length: numPositions - 1
              }, (_, i) => i + 1).map(pos => <Button key={pos} onClick={() => setUserPrediction(pos)} variant={userPrediction === pos ? "default" : "outline"} size="sm" className="w-8 h-8 text-xs p-0">
                      {positionToNumber(pos)}
                    </Button>)}
                </div>
                {userPrediction !== null && <p className="mt-3 text-sm text-primary">
                    You predicted: <strong>{positionToNumber(userPrediction)}</strong>. Run some simulations to see!
                  </p>}
              </CardContent>
            </Card>}
        </div>
      </div>

      {/* Statistics Chart */}
      {totalSimulations > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Statistics: Which number was painted last?
              <Badge variant="secondary">{totalSimulations.toLocaleString()} simulations</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={v => `${v.toFixed(1)}%`} domain={[0, Math.max(theoreticalProbability * 1.5, 15)]} />
                  <Tooltip contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151'
              }} labelStyle={{
                color: '#f3f4f6'
              }} formatter={(value: number) => [`${value.toFixed(2)}%`, 'Probability']} />
                  <ReferenceLine y={theoreticalProbability} stroke="#22c55e" strokeDasharray="5 5" label={{
                value: `Theory: ${theoreticalProbability.toFixed(2)}%`,
                fill: '#22c55e',
                fontSize: 12,
                position: 'right'
              }} />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={userPrediction === index + 1 ? '#8b5cf6' : '#f59e0b'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {userPrediction !== null && <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm">
                  <strong className="text-purple-400">Your prediction ({positionToNumber(userPrediction)}):</strong>{' '}
                  {((lastPaintedCounts[userPrediction] || 0) / totalSimulations * 100).toFixed(2)}%
                  {' '}— Theory predicts all numbers have equal probability of{' '}
                  <span className="text-green-400">{theoreticalProbability.toFixed(2)}%</span>!
                </p>
              </div>}
            
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-200">
                <strong>The Surprising Result:</strong> Despite {numPositions === 12 ? '6' : Math.floor(numPositions / 2)} being the farthest from the start, 
                every number (1-{numPositions - 1}) has an equal probability of being painted last: exactly 1/{numPositions - 1} ≈ {theoreticalProbability.toFixed(2)}%!
              </p>
            </div>
          </CardContent>
        </Card>}

      {/* Path History */}
      {simulation.path.length > 1 && <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Path History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {simulation.path.map((pos, i) => <Badge key={i} variant={i === 0 ? "default" : "outline"} className={`${simulation.isComplete && i === simulation.path.length - 1 ? 'bg-red-500 text-white' : ''}`}>
                  {positionToNumber(pos)}
                </Badge>)}
            </div>
          </CardContent>
        </Card>}

      {/* Educational Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            About This Puzzle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h4 className="text-foreground">The Rules</h4>
            <ul className="text-muted-foreground">
              <li>A ladybug starts at the 12 o'clock position</li>
              <li>Each second, it randomly moves one step clockwise or counterclockwise (50/50 chance)</li>
              <li>When the ladybug visits a number, that number gets "painted"</li>
              <li>The simulation ends when all numbers have been visited at least once</li>
            </ul>
            
            
            
            
            
            <ul className="text-muted-foreground">
              
              
              
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Acknowledgement */}
      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            This puzzle is featured by{' '}
            <a href="https://momath.org/mindbenders/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              MoMath Mindbenders
            </a>
            {' '}and demonstrated in{' '}
            <a href="https://www.youtube.com/shorts/t3jZ2xGOvYg" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              this YouTube short
            </a>.
          </p>
        </CardContent>
      </Card>

    </div>;
};
export default LadybugClockPuzzle;