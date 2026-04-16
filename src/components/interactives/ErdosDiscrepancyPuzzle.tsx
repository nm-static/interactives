import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { 
  Play, RotateCcw, Info, ChevronDown, ChevronUp, 
  ArrowLeft, ArrowRight, Skull, AlertTriangle,
  BookOpen, Zap, Eye, Grid3X3, TrendingUp, Pause,
  Volume2, VolumeX, Target, Trophy
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ErdosDiscrepancyPuzzleProps {
}

type GamePhase = 'intro' | 'writing' | 'captor-reveal' | 'walking' | 'fallen' | 'survived';
type Direction = 1 | -1 | null;

interface DiscrepancyResult {
  d: number;
  k: number;
  sum: number;
  positions: number[];
}

const ErdosDiscrepancyPuzzle: React.FC<ErdosDiscrepancyPuzzleProps> = () => {
  // Core game state
  const [sequence, setSequence] = useState<Direction[]>([]);
  const [discrepancyBound, setDiscrepancyBound] = useState(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [showRules, setShowRules] = useState(false);
  
  // Walk visualization state
  const [selectedD, setSelectedD] = useState(1);
  const [walkPosition, setWalkPosition] = useState(0);
  const [walkStep, setWalkStep] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [walkSpeed, setWalkSpeed] = useState(500);
  
  // Prisoner's Walk story mode
  const [captorChosenD, setCaptorChosenD] = useState<number | null>(null);
  const [prisonerPosition, setPrisonerPosition] = useState(0);
  const [prisonerStep, setPrisonerStep] = useState(0);
  
  // Heatmap state
  const [hoveredCell, setHoveredCell] = useState<{d: number, k: number} | null>(null);
  const [highlightedSubsequence, setHighlightedSubsequence] = useState<number[]>([]);
  
  // Best score tracking
  const [bestLength, setBestLength] = useState<number | null>(null);

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`erdos-best-length-c${discrepancyBound}`);
    if (saved) {
      setBestLength(parseInt(saved));
    }
  }, [discrepancyBound]);

  // Calculate all discrepancies for current sequence
  const allDiscrepancies = useMemo((): DiscrepancyResult[] => {
    if (sequence.length === 0) return [];
    
    const results: DiscrepancyResult[] = [];
    const n = sequence.length;
    
    for (let d = 1; d <= n; d++) {
      let sum = 0;
      const positions: number[] = [];
      
      for (let k = 1; k * d <= n; k++) {
        const pos = k * d - 1; // 0-indexed
        if (sequence[pos] !== null) {
          sum += sequence[pos]!;
          positions.push(k * d);
          results.push({
            d,
            k,
            sum,
            positions: [...positions]
          });
        }
      }
    }
    
    return results;
  }, [sequence]);

  // Find maximum discrepancy
  const maxDiscrepancy = useMemo(() => {
    if (allDiscrepancies.length === 0) return { value: 0, result: null };
    
    let maxAbs = 0;
    let maxResult: DiscrepancyResult | null = null;
    
    for (const result of allDiscrepancies) {
      if (Math.abs(result.sum) > maxAbs) {
        maxAbs = Math.abs(result.sum);
        maxResult = result;
      }
    }
    
    return { value: maxAbs, result: maxResult };
  }, [allDiscrepancies]);

  // Check if current sequence violates bound
  const hasViolation = maxDiscrepancy.value > discrepancyBound;

  // Find worst step size for captor
  const findWorstD = useCallback((): number => {
    let worstD = 1;
    let worstDiscrepancy = 0;
    
    for (const result of allDiscrepancies) {
      if (Math.abs(result.sum) > worstDiscrepancy) {
        worstDiscrepancy = Math.abs(result.sum);
        worstD = result.d;
      }
    }
    
    return worstD;
  }, [allDiscrepancies]);

  // Get discrepancy for specific d,k
  const getDiscrepancy = (d: number, k: number): number | null => {
    const result = allDiscrepancies.find(r => r.d === d && r.k === k);
    return result ? result.sum : null;
  };

  // Toggle sequence value
  const togglePosition = (index: number) => {
    if (gamePhase !== 'writing') return;
    
    setSequence(prev => {
      const newSeq = [...prev];
      if (newSeq[index] === null) {
        newSeq[index] = 1;
      } else if (newSeq[index] === 1) {
        newSeq[index] = -1;
      } else {
        newSeq[index] = 1;
      }
      return newSeq;
    });
  };

  // Add new position to sequence
  const addPosition = () => {
    if (gamePhase !== 'writing') return;
    setSequence(prev => [...prev, null]);
  };

  // Start the game
  const startGame = () => {
    setSequence([null, null, null, null, null]);
    setGamePhase('writing');
    setWalkPosition(0);
    setWalkStep(0);
    setPrisonerPosition(0);
    setPrisonerStep(0);
    setCaptorChosenD(null);
    setHighlightedSubsequence([]);
  };

  // Reset the game
  const resetGame = () => {
    setSequence([]);
    setGamePhase('intro');
    setWalkPosition(0);
    setWalkStep(0);
    setIsWalking(false);
    setPrisonerPosition(0);
    setPrisonerStep(0);
    setCaptorChosenD(null);
    setHighlightedSubsequence([]);
  };

  // Handle captor reveal (Prisoner's Walk mode)
  const revealCaptor = () => {
    const worstD = findWorstD();
    setCaptorChosenD(worstD);
    setGamePhase('captor-reveal');
    setPrisonerPosition(0);
    setPrisonerStep(0);
  };

  // Start prisoner walking
  const startPrisonerWalk = () => {
    if (captorChosenD === null) return;
    setGamePhase('walking');
    setPrisonerPosition(0);
    setPrisonerStep(0);
  };

  // Prisoner walk animation
  useEffect(() => {
    if (gamePhase !== 'walking' || captorChosenD === null) return;
    
    const interval = setInterval(() => {
      setPrisonerStep(prev => {
        const nextStep = prev + 1;
        const posIndex = nextStep * captorChosenD - 1;
        
        if (posIndex >= sequence.length || sequence[posIndex] === null) {
          // Sequence ended without falling
          setGamePhase('survived');
          clearInterval(interval);
          
          // Save best score
          const validLength = sequence.filter(s => s !== null).length;
          if (!bestLength || validLength > bestLength) {
            setBestLength(validLength);
            localStorage.setItem(`erdos-best-length-c${discrepancyBound}`, validLength.toString());
          }
          
          return prev;
        }
        
        const newPosition = prisonerPosition + sequence[posIndex]!;
        setPrisonerPosition(newPosition);
        
        if (Math.abs(newPosition) > discrepancyBound) {
          setGamePhase('fallen');
          clearInterval(interval);
          return nextStep;
        }
        
        return nextStep;
      });
    }, walkSpeed);
    
    return () => clearInterval(interval);
  }, [gamePhase, captorChosenD, sequence, prisonerPosition, discrepancyBound, walkSpeed, bestLength]);

  // Manual walk control
  const walkSubsequence = () => {
    if (isWalking) {
      setIsWalking(false);
      return;
    }
    
    setWalkPosition(0);
    setWalkStep(0);
    setIsWalking(true);
  };

  // Walk animation effect
  useEffect(() => {
    if (!isWalking) return;
    
    const interval = setInterval(() => {
      setWalkStep(prev => {
        const nextStep = prev + 1;
        const posIndex = nextStep * selectedD - 1;
        
        if (posIndex >= sequence.length || sequence[posIndex] === null) {
          setIsWalking(false);
          return prev;
        }
        
        setWalkPosition(current => current + sequence[posIndex]!);
        return nextStep;
      });
    }, walkSpeed);
    
    return () => clearInterval(interval);
  }, [isWalking, selectedD, sequence, walkSpeed]);

  // Get color for heatmap cell
  const getHeatmapColor = (discrepancy: number | null): string => {
    if (discrepancy === null) return 'bg-muted/30';
    
    const absVal = Math.abs(discrepancy);
    if (absVal > discrepancyBound) {
      return 'bg-destructive/80 text-destructive-foreground';
    }
    if (absVal === discrepancyBound) {
      return 'bg-amber-500/70 text-white';
    }
    if (absVal === 0) {
      return 'bg-emerald-500/50 text-emerald-900 dark:text-emerald-100';
    }
    
    const intensity = absVal / discrepancyBound;
    if (intensity < 0.5) {
      return 'bg-emerald-400/40 text-emerald-900 dark:text-emerald-100';
    }
    return 'bg-amber-400/50 text-amber-900 dark:text-amber-100';
  };

  // Max valid k for given d
  const maxK = (d: number) => Math.floor(sequence.length / d);

  // Highlighted positions for selected d
  const selectedPositions = useMemo(() => {
    const positions: number[] = [];
    for (let k = 1; k * selectedD <= sequence.length; k++) {
      positions.push(k * selectedD);
    }
    return positions;
  }, [selectedD, sequence.length]);

  // Get fill status of sequence
  const filledCount = sequence.filter(s => s !== null).length;
  const allFilled = filledCount === sequence.length && sequence.length > 0;

  // Known optimal sequences
  const optimalSequences: Record<number, Direction[]> = {
    1: [1, 1, -1, 1, -1, -1, -1, 1, 1, 1, -1], // One of the optimal 11-length sequences for C=1
  };

  const loadOptimalSequence = () => {
    const optimal = optimalSequences[discrepancyBound];
    if (optimal) {
      setSequence([...optimal]);
      setGamePhase('writing');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            The Erdős Discrepancy Problem
          </h1>
          <p className="text-muted-foreground mt-1">
            Can you write instructions to survive the tunnel forever?
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRules(!showRules)}
          >
            {showRules ? <ChevronUp className="w-4 h-4 mr-1" /> : <Info className="w-4 h-4 mr-1" />}
            {showRules ? 'Hide' : 'Rules'}
          </Button>
        </div>
      </div>

      {/* Rules Panel */}
      {showRules && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Skull className="w-4 h-4" /> The Prisoner's Dilemma
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  You're trapped in a tunnel with a <span className="text-destructive font-semibold">deadly cliff {discrepancyBound} step{discrepancyBound > 1 ? 's' : ''} to your LEFT</span> and 
                  a <span className="text-destructive font-semibold">pit of vipers {discrepancyBound} step{discrepancyBound > 1 ? 's' : ''} to your RIGHT</span>.
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Write a list of instructions: each is either <span className="text-primary font-semibold">LEFT</span> or <span className="text-blue-500 font-semibold">RIGHT</span>.
                </p>
                <p className="text-sm text-muted-foreground">
                  The evil captor then picks a step size <strong>d</strong> and you follow every d-th instruction.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> The Impossible Task
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>C = 1:</strong> Maximum possible sequence length is <strong>11</strong>
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>C = 2:</strong> Maximum possible sequence length is <strong>1,160</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Terence Tao proved in 2015: <em>No infinite sequence can survive!</em>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Phase: Intro */}
      {gamePhase === 'intro' && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="max-w-lg mx-auto">
              <Skull className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-4">The Prisoner's Walk</h2>
              <p className="text-muted-foreground mb-6">
                You wake up in a dark tunnel. There's a cliff to your left and vipers to your right. 
                Your captor demands you write a sequence of LEFT/RIGHT instructions... 
                but they get to choose which instructions you follow.
              </p>
              
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">
                  Discrepancy Bound (C): {discrepancyBound}
                </label>
                <div className="flex items-center gap-4 max-w-xs mx-auto">
                  <span className="text-xs">1</span>
                  <Slider
                    value={[discrepancyBound]}
                    onValueChange={(v) => setDiscrepancyBound(v[0])}
                    min={1}
                    max={3}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs">3</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  C=1: Max 11 steps | C=2: Max 1,160 steps | C=3: Unknown (very large)
                </p>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button onClick={startGame} size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Start Writing
                </Button>
                {discrepancyBound === 1 && (
                  <Button variant="outline" onClick={loadOptimalSequence} size="lg">
                    <Trophy className="w-4 h-4 mr-2" />
                    Load Optimal (11)
                  </Button>
                )}
              </div>
              
              {bestLength && (
                <p className="text-sm text-muted-foreground mt-4">
                  Your best: <strong>{bestLength}</strong> steps with C={discrepancyBound}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Game UI */}
      {gamePhase !== 'intro' && (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="outline" className="text-sm">
              Length: {sequence.length}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Filled: {filledCount}/{sequence.length}
            </Badge>
            <Badge 
              variant={hasViolation ? "destructive" : maxDiscrepancy.value === discrepancyBound ? "secondary" : "outline"}
              className="text-sm"
            >
              Max Discrepancy: {maxDiscrepancy.value}
              {maxDiscrepancy.result && ` (d=${maxDiscrepancy.result.d}, k=${maxDiscrepancy.result.k})`}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Bound: C = {discrepancyBound}
            </Badge>
            {bestLength && (
              <Badge variant="secondary" className="text-sm">
                <Trophy className="w-3 h-3 mr-1" />
                Best: {bestLength}
              </Badge>
            )}
          </div>

          {/* Violation Alert */}
          {hasViolation && gamePhase === 'writing' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Bound Exceeded!</AlertTitle>
              <AlertDescription>
                The subsequence with d={maxDiscrepancy.result?.d}, k={maxDiscrepancy.result?.k} has 
                discrepancy {maxDiscrepancy.value}, which exceeds your bound of {discrepancyBound}.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="sequence" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sequence" className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Sequence</span>
              </TabsTrigger>
              <TabsTrigger value="walk" className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Walk</span>
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="flex items-center gap-1">
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Heatmap</span>
              </TabsTrigger>
            </TabsList>

            {/* Sequence Builder Tab */}
            <TabsContent value="sequence" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Write Your Instructions
                    {gamePhase === 'writing' && (
                      <Badge variant="secondary" className="ml-2">Click to toggle</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Sequence Grid */}
                  <div className="mb-4 overflow-x-auto">
                    <div className="flex gap-1 min-w-max pb-2">
                      {sequence.map((val, idx) => {
                        const pos = idx + 1;
                        const isHighlighted = highlightedSubsequence.includes(pos) || selectedPositions.includes(pos);
                        const isViolationPart = maxDiscrepancy.result?.positions.includes(pos) && hasViolation;
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => togglePosition(idx)}
                            disabled={gamePhase !== 'writing'}
                            className={`
                              relative w-10 h-14 rounded-lg border-2 flex flex-col items-center justify-center
                              transition-all duration-200
                              ${val === 1 ? 'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400' : ''}
                              ${val === -1 ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400' : ''}
                              ${val === null ? 'bg-muted/50 border-muted-foreground/30 text-muted-foreground' : ''}
                              ${isHighlighted ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
                              ${isViolationPart ? 'ring-2 ring-destructive ring-offset-1' : ''}
                              ${gamePhase === 'writing' ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
                            `}
                          >
                            <span className="text-[10px] absolute top-0.5 left-1 opacity-50">{pos}</span>
                            {val === 1 && <ArrowRight className="w-5 h-5" />}
                            {val === -1 && <ArrowLeft className="w-5 h-5" />}
                            {val === null && <span className="text-lg">?</span>}
                          </button>
                        );
                      })}
                      
                      {gamePhase === 'writing' && (
                        <button
                          onClick={addPosition}
                          className="w-10 h-14 rounded-lg border-2 border-dashed border-muted-foreground/30 
                                     flex items-center justify-center text-muted-foreground
                                     hover:border-primary hover:text-primary transition-colors"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap gap-2">
                    {gamePhase === 'writing' && (
                      <>
                        <Button 
                          onClick={revealCaptor} 
                          disabled={!allFilled}
                          className="flex-1 sm:flex-none"
                        >
                          <Skull className="w-4 h-4 mr-2" />
                          Face the Captor
                        </Button>
                        <Button variant="outline" onClick={resetGame}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Walk Visualization Tab */}
            <TabsContent value="walk" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Walk Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Step size selector */}
                  <div className="mb-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Step size (d):</label>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(sequence.length, 8) }, (_, i) => i + 1).map(d => (
                          <Button
                            key={d}
                            variant={selectedD === d ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedD(d);
                              setWalkPosition(0);
                              setWalkStep(0);
                              setIsWalking(false);
                            }}
                            className="w-8 h-8 p-0"
                          >
                            {d}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Speed:</label>
                      <Slider
                        value={[1000 - walkSpeed]}
                        onValueChange={(v) => setWalkSpeed(1000 - v[0])}
                        min={0}
                        max={900}
                        step={100}
                        className="w-24"
                      />
                    </div>
                  </div>

                  {/* Number line visualization */}
                  <div className="relative h-32 bg-muted/20 rounded-lg overflow-hidden mb-4">
                    {/* Danger zones */}
                    <div 
                      className="absolute top-0 bottom-0 bg-destructive/20 flex items-center justify-center"
                      style={{ left: 0, width: `${(discrepancyBound / (discrepancyBound * 2 + 3)) * 100}%` }}
                    >
                      <span className="text-destructive text-xs font-bold rotate-90">CLIFF</span>
                    </div>
                    <div 
                      className="absolute top-0 bottom-0 bg-destructive/20 flex items-center justify-center"
                      style={{ right: 0, width: `${(discrepancyBound / (discrepancyBound * 2 + 3)) * 100}%` }}
                    >
                      <span className="text-destructive text-xs font-bold rotate-90">VIPERS</span>
                    </div>

                    {/* Safe zone markers */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
                      {Array.from({ length: discrepancyBound * 2 + 1 }, (_, i) => i - discrepancyBound).map(pos => (
                        <div
                          key={pos}
                          className={`
                            w-8 h-8 mx-1 rounded-full flex items-center justify-center text-xs font-bold
                            ${pos === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                            ${Math.abs(pos) === discrepancyBound ? 'border-2 border-amber-500' : ''}
                          `}
                        >
                          {pos}
                        </div>
                      ))}
                    </div>

                    {/* Walker position */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 transition-all duration-300"
                      style={{ 
                        left: `calc(50% + ${walkPosition * 40}px - 12px)`,
                      }}
                    >
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs animate-pulse">
                        👤
                      </div>
                    </div>
                  </div>

                  {/* Walk info */}
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <span>Position: <strong>{walkPosition}</strong></span>
                    <span>Steps taken: <strong>{walkStep}</strong></span>
                    <span>Following: positions {selectedPositions.slice(0, 5).join(', ')}{selectedPositions.length > 5 ? '...' : ''}</span>
                  </div>

                  {/* Walk controls */}
                  <div className="flex gap-2">
                    <Button onClick={walkSubsequence} variant="outline" className="flex-1">
                      {isWalking ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {isWalking ? 'Pause' : 'Walk d=' + selectedD}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setWalkPosition(0);
                        setWalkStep(0);
                        setIsWalking(false);
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Heatmap Tab */}
            <TabsContent value="walk" className="mt-4">
              {/* This is actually handled in the walk tab above */}
            </TabsContent>

            <TabsContent value="heatmap" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Discrepancy Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Each cell shows the sum of values at positions d, 2d, 3d, ..., kd. 
                    Red cells exceed the bound.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="text-xs">
                      <thead>
                        <tr>
                          <th className="p-1 text-muted-foreground">d \ k</th>
                          {Array.from({ length: Math.min(12, sequence.length) }, (_, i) => i + 1).map(k => (
                            <th key={k} className="p-1 w-8 text-center text-muted-foreground">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: Math.min(8, sequence.length) }, (_, i) => i + 1).map(d => (
                          <tr key={d}>
                            <td className="p-1 font-medium text-muted-foreground">{d}</td>
                            {Array.from({ length: Math.min(12, sequence.length) }, (_, i) => i + 1).map(k => {
                              const discrepancy = getDiscrepancy(d, k);
                              const isValid = d * k <= sequence.length;
                              
                              return (
                                <td 
                                  key={k} 
                                  className={`
                                    p-1 w-8 h-8 text-center cursor-pointer transition-all
                                    ${isValid ? getHeatmapColor(discrepancy) : 'bg-transparent'}
                                    ${hoveredCell?.d === d && hoveredCell?.k === k ? 'ring-2 ring-primary' : ''}
                                  `}
                                  onMouseEnter={() => {
                                    if (isValid) {
                                      setHoveredCell({ d, k });
                                      const result = allDiscrepancies.find(r => r.d === d && r.k === k);
                                      if (result) {
                                        setHighlightedSubsequence(result.positions);
                                      }
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    setHoveredCell(null);
                                    setHighlightedSubsequence([]);
                                  }}
                                >
                                  {isValid && discrepancy !== null ? discrepancy : ''}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {hoveredCell && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                      <strong>d={hoveredCell.d}, k={hoveredCell.k}:</strong> Looking at positions{' '}
                      {Array.from({ length: hoveredCell.k }, (_, i) => (i + 1) * hoveredCell.d).join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Captor Reveal Phase */}
          {gamePhase === 'captor-reveal' && captorChosenD !== null && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-6 text-center">
                <Skull className="w-12 h-12 mx-auto text-destructive mb-4" />
                <h3 className="text-xl font-bold mb-2">The Captor Speaks...</h3>
                <p className="text-muted-foreground mb-4">
                  "Interesting sequence... Let me see... I choose <strong className="text-destructive text-2xl">d = {captorChosenD}</strong>!"
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  You will follow every {captorChosenD === 1 ? '' : captorChosenD === 2 ? '2nd' : captorChosenD === 3 ? '3rd' : `${captorChosenD}th`} instruction: 
                  positions {Array.from({ length: Math.floor(sequence.length / captorChosenD) }, (_, i) => (i + 1) * captorChosenD).slice(0, 8).join(', ')}...
                </p>
                <Button onClick={startPrisonerWalk} size="lg" variant="destructive">
                  <Play className="w-4 h-4 mr-2" />
                  Begin Walking
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Walking Phase */}
          {gamePhase === 'walking' && captorChosenD !== null && (
            <Card>
              <CardContent className="py-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold">Walking with d = {captorChosenD}...</h3>
                  <p className="text-sm text-muted-foreground">
                    Step {prisonerStep} | Position: {prisonerPosition}
                  </p>
                </div>
                
                {/* Tunnel visualization */}
                <div className="relative h-24 bg-gradient-to-r from-destructive/30 via-muted/20 to-destructive/30 rounded-lg overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center">
                    <span className="text-2xl">🏔️</span>
                  </div>
                  <div className="absolute inset-y-0 right-0 w-8 flex items-center justify-center">
                    <span className="text-2xl">🐍</span>
                  </div>
                  
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 text-3xl transition-all duration-300"
                    style={{ 
                      left: `calc(50% + ${prisonerPosition * (100 / (discrepancyBound * 2 + 2))}% - 16px)` 
                    }}
                  >
                    🚶
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fallen Phase */}
          {gamePhase === 'fallen' && (
            <Alert variant="destructive">
              <Skull className="h-4 w-4" />
              <AlertTitle>You Fell!</AlertTitle>
              <AlertDescription>
                After {prisonerStep} steps with d={captorChosenD}, you ended up at position {prisonerPosition}.
                The captor found your weakness! Your sequence lasted {sequence.length} instructions.
                <div className="mt-4 flex gap-2">
                  <Button onClick={startGame} variant="outline" size="sm">
                    Try Again
                  </Button>
                  <Button onClick={resetGame} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Survived Phase (temporary - sequence ended) */}
          {gamePhase === 'survived' && (
            <Alert className="border-emerald-500 bg-emerald-500/10">
              <Trophy className="h-4 w-4 text-emerald-500" />
              <AlertTitle className="text-emerald-600 dark:text-emerald-400">Sequence Complete!</AlertTitle>
              <AlertDescription>
                Your {sequence.length}-instruction sequence survived d={captorChosenD}! 
                But remember: no sequence can survive forever. Try making it longer!
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setGamePhase('writing')} variant="outline" size="sm">
                    Extend Sequence
                  </Button>
                  <Button onClick={resetGame} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Game
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Acknowledgement */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="py-4">
          <h3 className="font-semibold text-foreground mb-2">Credits & History</h3>
          <p className="text-sm text-muted-foreground mb-2">
            This puzzle is based on the Erdős Discrepancy Problem, posed by Paul Erdős in the 1930s 
            (with a $500 prize!). The "Prisoner's Walk" framing comes from various mathematical expositions, 
            popularized by James Grime's singingbanana video.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>2014:</strong> Boris Konev & Alexei Lisitsa proved C=2 has maximum length 1,160 using SAT solvers 
            (generating a 13GB proof!). <strong>2015:</strong> Terence Tao proved that NO infinite sequence 
            can have bounded discrepancy, settling the problem completely.
          </p>
        </CardContent>
      </Card>

      {/* Social Share */}
    </div>
  );
};

export default ErdosDiscrepancyPuzzle;
