import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Gift, Play, RotateCw, Zap, Pause, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';
interface PresentsPuzzleProps {
  shareUrl?: string;
}
interface SimulationResult {
  alice: number;
  bob: number;
  ties: number;
}
const PresentsPuzzle = ({
    shareUrl
}: PresentsPuzzleProps) => {
  const [numBoxes, setNumBoxes] = useState(100);
  const [numPresents, setNumPresents] = useState(26);
  const [presentBoxes, setPresentBoxes] = useState<Set<number>>(new Set());
  const [aliceOpened, setAliceOpened] = useState<Set<number>>(new Set());
  const [bobOpened, setBobOpened] = useState<Set<number>>(new Set());
  const [aliceFound, setAliceFound] = useState(0);
  const [bobFound, setBobFound] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [aliceOrder, setAliceOrder] = useState<number[]>([]);
  const [bobOrder, setBobOrder] = useState<number[]>([]);
  const [winner, setWinner] = useState<'alice' | 'bob' | 'tie' | null>(null);
  const [simulationResults, setSimulationResults] = useState<SimulationResult>({
    alice: 0,
    bob: 0,
    ties: 0
  });
  const [hasSimulated, setHasSimulated] = useState(false);
  const isPausedRef = useRef(false);

  // Generate random present positions
  const generatePresents = (): Set<number> => {
    const presents = new Set<number>();
    while (presents.size < numPresents) {
      presents.add(Math.floor(Math.random() * numBoxes) + 1);
    }
    return presents;
  };

  // Get Alice's opening order: 1, 2, 3, ..., numBoxes
  const getAliceOrder = (): number[] => {
    return Array.from({
      length: numBoxes
    }, (_, i) => i + 1);
  };

  // Get Bob's opening order: 1, 3, 5, ..., odds, 2, 4, 6, ..., evens
  const getBobOrder = (): number[] => {
    const odds = Array.from({
      length: Math.ceil(numBoxes / 2)
    }, (_, i) => i * 2 + 1).filter(n => n <= numBoxes);
    const evens = Array.from({
      length: Math.floor(numBoxes / 2)
    }, (_, i) => (i + 1) * 2).filter(n => n <= numBoxes);
    return [...odds, ...evens];
  };

  // Simulate one round
  const simulateRound = (presents: Set<number>): 'alice' | 'bob' | 'tie' => {
    const aliceOrder = getAliceOrder();
    const bobOrder = getBobOrder();
    let aliceCount = 0;
    let bobCount = 0;
    for (let i = 0; i < numBoxes; i++) {
      const aliceFoundPresent = presents.has(aliceOrder[i]);
      const bobFoundPresent = presents.has(bobOrder[i]);
      if (aliceFoundPresent) aliceCount++;
      if (bobFoundPresent) bobCount++;

      // Check if both reached target on the same turn (tie)
      if (aliceCount === numPresents && bobCount === numPresents) return 'tie';

      // Check individual winners
      if (aliceCount === numPresents) return 'alice';
      if (bobCount === numPresents) return 'bob';
    }
    return 'tie'; // Default, though this should never happen
  };

  // Initialize simulation if not already initialized
  const initializeSimulation = () => {
    if (aliceOrder.length === 0) {
      const presents = generatePresents();
      setPresentBoxes(presents);
      const newAliceOrder = getAliceOrder();
      const newBobOrder = getBobOrder();
      setAliceOrder(newAliceOrder);
      setBobOrder(newBobOrder);
      return { presents, aliceOrder: newAliceOrder, bobOrder: newBobOrder };
    }
    return { presents: presentBoxes, aliceOrder, bobOrder };
  };

  // Update display for a specific step
  const updateStep = (step: number) => {
    const { presents, aliceOrder: aOrder, bobOrder: bOrder } = initializeSimulation();
    
    const aliceOpenedSet = new Set<number>();
    const bobOpenedSet = new Set<number>();
    let aliceCount = 0;
    let bobCount = 0;
    let currentWinner: 'alice' | 'bob' | 'tie' | null = null;

    for (let i = 0; i <= step; i++) {
      const aliceBox = aOrder[i];
      const bobBox = bOrder[i];
      aliceOpenedSet.add(aliceBox);
      bobOpenedSet.add(bobBox);
      
      if (presents.has(aliceBox)) aliceCount++;
      if (presents.has(bobBox)) bobCount++;

      if (aliceCount === numPresents && bobCount === numPresents) {
        currentWinner = 'tie';
      } else if (aliceCount === numPresents) {
        currentWinner = 'alice';
      } else if (bobCount === numPresents) {
        currentWinner = 'bob';
      }
    }

    setAliceOpened(aliceOpenedSet);
    setBobOpened(bobOpenedSet);
    setAliceFound(aliceCount);
    setBobFound(bobCount);
    setWinner(currentWinner);
    setCurrentStep(step);
  };

  // Animate a single simulation
  const startSimulation = async () => {
    if (currentStep === 0 || aliceOrder.length === 0) {
      // Start new simulation
      setIsRunning(true);
      isPausedRef.current = false;
      setWinner(null);
      const presents = generatePresents();
      setPresentBoxes(presents);
      const newAliceOrder = getAliceOrder();
      const newBobOrder = getBobOrder();
      setAliceOrder(newAliceOrder);
      setBobOrder(newBobOrder);
      
      // Initialize with empty state
      setAliceOpened(new Set());
      setBobOpened(new Set());
      setAliceFound(0);
      setBobFound(0);
      setCurrentStep(-1); // -1 means no boxes opened yet
      
      // Start animation from beginning
      let aliceCount = 0;
      let bobCount = 0;
      let currentWinner: 'alice' | 'bob' | 'tie' | null = null;
      
      for (let i = 0; i < numBoxes && !currentWinner; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Check pause after delay, before opening boxes
        if (isPausedRef.current) {
          setIsRunning(false);
          return;
        }
        
        const aliceBox = newAliceOrder[i];
        const bobBox = newBobOrder[i];
        
        // Create new sets with the new boxes (ensures synchronous update)
        const newAliceOpened = new Set<number>();
        const newBobOpened = new Set<number>();
        for (let j = 0; j <= i; j++) {
          newAliceOpened.add(newAliceOrder[j]);
          newBobOpened.add(newBobOrder[j]);
        }
        
        const aliceFoundPresent = presents.has(aliceBox);
        const bobFoundPresent = presents.has(bobBox);
        if (aliceFoundPresent) aliceCount++;
        if (bobFoundPresent) bobCount++;
        
        // Update all state together for perfect sync
        setAliceOpened(newAliceOpened);
        setBobOpened(newBobOpened);
        setAliceFound(aliceCount);
        setBobFound(bobCount);
        setCurrentStep(i);

        if (aliceCount === numPresents && bobCount === numPresents) {
          currentWinner = 'tie';
        } else if (aliceCount === numPresents) {
          currentWinner = 'alice';
        } else if (bobCount === numPresents) {
          currentWinner = 'bob';
        }
      }
      setWinner(currentWinner);
      setIsRunning(false);
    } else {
      // Resume from current step
      setIsRunning(true);
      isPausedRef.current = false;
      
      let aliceCount = aliceFound;
      let bobCount = bobFound;
      let currentWinner: 'alice' | 'bob' | 'tie' | null = winner;
      
      for (let i = currentStep + 1; i < numBoxes && !currentWinner; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Check pause after delay, before opening boxes
        if (isPausedRef.current) {
          setIsRunning(false);
          return;
        }
        
        const aliceBox = aliceOrder[i];
        const bobBox = bobOrder[i];
        
        // Create new sets with the new boxes
        const newAliceOpened = new Set<number>();
        const newBobOpened = new Set<number>();
        for (let j = 0; j <= i; j++) {
          newAliceOpened.add(aliceOrder[j]);
          newBobOpened.add(bobOrder[j]);
        }
        
        const aliceFoundPresent = presentBoxes.has(aliceBox);
        const bobFoundPresent = presentBoxes.has(bobBox);
        if (aliceFoundPresent) aliceCount++;
        if (bobFoundPresent) bobCount++;
        
        // Update all state together for perfect sync
        setAliceOpened(newAliceOpened);
        setBobOpened(newBobOpened);
        setAliceFound(aliceCount);
        setBobFound(bobCount);
        setCurrentStep(i);

        if (aliceCount === numPresents && bobCount === numPresents) {
          currentWinner = 'tie';
        } else if (aliceCount === numPresents) {
          currentWinner = 'alice';
        } else if (bobCount === numPresents) {
          currentWinner = 'bob';
        }
      }
      setWinner(currentWinner);
      setIsRunning(false);
    }
  };

  const pauseSimulation = () => {
    isPausedRef.current = true;
    setIsRunning(false);
  };

  const stepNext = () => {
    if (currentStep >= numBoxes - 1 || winner) return;
    updateStep(currentStep + 1);
  };

  const stepBack = () => {
    if (currentStep <= 0) return;
    setWinner(null);
    updateStep(currentStep - 1);
  };

  const stepToEnd = () => {
    // Don't do anything if already at end or winner already determined
    if (currentStep >= numBoxes - 1 || winner !== null) return;
    
    const { presents, aliceOrder: aOrder, bobOrder: bOrder } = initializeSimulation();
    
    let aliceCount = 0;
    let bobCount = 0;
    let winningStep = numBoxes - 1; // default to last step if no winner found
    
    // Find the step where someone first wins
    for (let i = 0; i < numBoxes; i++) {
      if (presents.has(aOrder[i])) aliceCount++;
      if (presents.has(bOrder[i])) bobCount++;
      
      // Check if someone won on this step
      if (aliceCount === numPresents || bobCount === numPresents) {
        winningStep = i;
        break;
      }
    }
    
    // Update to that step
    updateStep(winningStep);
  };

  const stepToStart = () => {
    initializeSimulation();
    setAliceOpened(new Set());
    setBobOpened(new Set());
    setAliceFound(0);
    setBobFound(0);
    setCurrentStep(-1); // -1 means no boxes opened yet
    setWinner(null);
  };

  // Reset simulation
  const resetSimulation = () => {
    setPresentBoxes(new Set());
    setAliceOpened(new Set());
    setBobOpened(new Set());
    setAliceFound(0);
    setBobFound(0);
    setWinner(null);
    setIsRunning(false);
    isPausedRef.current = false;
    setCurrentStep(-1); // -1 means not initialized
    setAliceOrder([]);
    setBobOrder([]);
  };

  // Run 100 simulations
  const runMultipleSimulations = () => {
    const results: SimulationResult = {
      alice: 0,
      bob: 0,
      ties: 0
    };
    for (let i = 0; i < 100; i++) {
      const presents = generatePresents();
      const winner = simulateRound(presents);
      if (winner === 'alice') {
        results.alice++;
      } else if (winner === 'bob') {
        results.bob++;
      } else {
        results.ties++;
      }
    }
    setSimulationResults(results);
    setHasSimulated(true);
  };

  // Render a grid of boxes
  const renderGrid = (title: string, openedBoxes: Set<number>, found: number, color: string) => {
    const cols = Math.min(10, numBoxes);
    return <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {title} <span className="text-sm text-muted-foreground">({openedBoxes.size}/{numBoxes})</span>
          </h3>
          <Badge variant="secondary" className="text-sm">
            <Gift className="w-3 h-3 mr-1" />
            {found}/{numPresents}
          </Badge>
        </div>
        <div className={`grid gap-1 p-2 bg-muted/30 rounded-lg`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({
          length: numBoxes
        }, (_, i) => i + 1).map(boxNum => {
          const hasPresent = presentBoxes.has(boxNum);
          const isOpened = openedBoxes.has(boxNum);
          const showPresent = isOpened && hasPresent;
          return <div key={boxNum} className={`
                  aspect-square rounded border flex items-center justify-center text-xs font-medium
                  transition-all duration-200
                  ${isOpened ? showPresent ? 'bg-[#808000] text-white border-[#606000] shadow-sm' : 'bg-muted border-border text-muted-foreground' : 'bg-gray-400 border-gray-500 text-gray-700'}
                `} title={`Box ${boxNum}${hasPresent ? ' (Present!)' : ''}`}>
                {showPresent ? <Gift className="w-3 h-3" /> : boxNum}
              </div>;
        })}
        </div>
        <div className="text-xs text-muted-foreground">
          {title === 'Alice' && 'Opens in order: 1, 2, 3, 4, 5, ...'}
          {title === 'Bob' && 'Opens odds first, then evens: 1, 3, 5, ..., 2, 4, 6, ...'}
        </div>
      </div>;
  };
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-6 h-6" />
            The Presents Puzzle
          </CardTitle>
          <CardDescription>
            A probability puzzle about search strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Puzzle Statement */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm leading-relaxed">
                Charlie puts{' '}
                <span className="inline-flex items-center gap-2 font-semibold">
                  <input 
                    type="number" 
                    value={numPresents} 
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(numBoxes, parseInt(e.target.value) || 1));
                      setNumPresents(val);
                      resetSimulation();
                    }}
                    className="w-16 px-2 py-0.5 text-center border rounded bg-background"
                    disabled={isRunning || currentStep > -1}
                  />
                  presents
                </span>
                {' '}in{' '}
                <span className="inline-flex items-center gap-2 font-semibold">
                  <input 
                    type="number" 
                    value={numBoxes} 
                    onChange={(e) => {
                      const val = Math.max(numPresents, parseInt(e.target.value) || numPresents);
                      setNumBoxes(val);
                      resetSimulation();
                    }}
                    className="w-16 px-2 py-0.5 text-center border rounded bg-background"
                    disabled={isRunning || currentStep > -1}
                  />
                  boxes
                </span>
                , labeled 1 to {numBoxes}.
                Each second, Alice and Bob look in one box. Alice opens them in order (1, 2, 3, …),
                while Bob opens the odds first, then the evens (1, 3, 5, …, 2, 4, 6, …).
                <strong> Who is more likely to see all {numPresents} presents first?</strong>
              </p>
            </CardContent>
          </Card>

          {/* Grids */}
          <div className="grid md:grid-cols-2 gap-6">
            {renderGrid('Alice', aliceOpened, aliceFound, 'blue')}
            {renderGrid('Bob', bobOpened, bobFound, 'green')}
          </div>

          {/* Winner Display */}
          {winner && <Card className="bg-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {winner === 'tie' ? `🤝 It's a tie! Both found all ${numPresents} presents at the same time!` : `🎉 ${winner === 'alice' ? 'Alice' : 'Bob'} found all ${numPresents} presents first!`}
                  </div>
                </div>
              </CardContent>
            </Card>}

          {/* Control Buttons */}
          <div className="flex gap-2 justify-center flex-wrap">
            <Button 
              onClick={startSimulation} 
              disabled={isRunning || (aliceOrder.length > 0 && winner !== null)} 
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {currentStep === -1 ? 'Auto Play' : 'Resume'}
            </Button>
            <Button 
              onClick={pauseSimulation} 
              disabled={!isRunning} 
              variant="outline"
              className="gap-2"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
            <Button 
              onClick={stepToStart} 
              disabled={isRunning || currentStep <= -1} 
              variant="outline"
              className="gap-2"
              title="Step to start"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button 
              onClick={stepBack} 
              disabled={isRunning || currentStep <= -1} 
              variant="outline"
              className="gap-2"
              title="Step back"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              onClick={stepNext} 
              disabled={isRunning || currentStep >= numBoxes - 1 || winner !== null} 
              variant="outline"
              className="gap-2"
              title="Step next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              onClick={stepToEnd} 
              disabled={isRunning || currentStep >= numBoxes - 1 || winner !== null} 
              variant="outline"
              className="gap-2"
              title="Step to end"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
            <Button onClick={resetSimulation} variant="outline" disabled={isRunning} className="gap-2">
              <RotateCw className="w-4 h-4" />
              Reset
            </Button>
          </div>

          {/* Simulate 100 */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button onClick={runMultipleSimulations} variant="secondary" className="gap-2" size="lg">
                <Zap className="w-4 h-4" />
                Simulate 100 Rounds
              </Button>
            </div>

            {/* Results */}
            {hasSimulated && <Card className="bg-accent/10 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg">Results from 100 Simulations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                        {simulationResults.alice}
                      </div>
                      <div className="text-sm font-medium">Alice Wins</div>
                      <div className="text-xs text-muted-foreground">
                        {(simulationResults.alice / 100 * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                        {simulationResults.bob}
                      </div>
                      <div className="text-sm font-medium">Bob Wins</div>
                      <div className="text-xs text-muted-foreground">
                        {(simulationResults.bob / 100 * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                        {simulationResults.ties}
                      </div>
                      <div className="text-sm font-medium">Ties</div>
                      <div className="text-xs text-muted-foreground">
                        {(simulationResults.ties / 100 * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      {simulationResults.alice > simulationResults.bob && simulationResults.alice > simulationResults.ties ? '💡 Alice tends to win more often!' : simulationResults.bob > simulationResults.alice && simulationResults.bob > simulationResults.ties ? '💡 Bob tends to win more often!' : simulationResults.ties > simulationResults.alice && simulationResults.ties > simulationResults.bob ? '💡 Ties are most common!' : '💡 The results are quite balanced!'}
                    </p>
                  </div>
                </CardContent>
              </Card>}
          </div>

          {/* Insight */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2 text-sm">💭 Think About It</h4>
              <p className="text-xs text-muted-foreground">
                At first glance, both strategies seem equivalent—they both check all 100 boxes eventually.
                But the <em>order</em> matters! Try running the simulation multiple times to see which strategy
                performs better on average. Can you explain why?
              </p>
            </CardContent>
          </Card>

          {/* Acknowledgement */}
          <Card className="bg-green-50 dark:bg-green-950/30">
            <CardContent className="pt-6">
              
              <p className="text-xs text-muted-foreground">
                This simulation was inspired by{' '}
                <a href="https://x.com/littmath/status/1990807150101475653" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  this tweet
                </a>
                {' '}by Daniel Litt, which in turn is a variation of{' '}
                <a href="https://gilkalai.wordpress.com/2024/09/03/test-your-intuition-56-fifteen-boxes-puzzle/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  this puzzle
                </a>
                {' '}by Gil Kalai.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

    </div>;
};
export default PresentsPuzzle;