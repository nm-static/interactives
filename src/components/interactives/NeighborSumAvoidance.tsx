import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Timer, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface NeighborSumAvoidanceProps {
  shareUrl?: string;
}

const NeighborSumAvoidance = ({ shareUrl }: NeighborSumAvoidanceProps) => {
  const [numberCount, setNumberCount] = useState(9);
  const [mode, setMode] = useState<'default' | 'guided'>('default');
  const [isActive, setIsActive] = useState(false);
  const [slots, setSlots] = useState<(number | null)[]>(Array(numberCount).fill(null));
  const [availableNumbers, setAvailableNumbers] = useState<number[]>(
    Array.from({ length: numberCount }, (_, i) => i + 1)
  );
  const [draggedNumber, setDraggedNumber] = useState<number | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<number | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !isComplete) {
      timerRef.current = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isComplete]);

  // Keep the pre-start arena in sync with the Numbers slider.
  useEffect(() => {
    if (!isActive) {
      setSlots(Array(numberCount).fill(null));
      setAvailableNumbers(Array.from({ length: numberCount }, (_, i) => i + 1));
    }
  }, [numberCount, isActive]);

  const isDivisible = (a: number, b: number) => {
    const sum = a + b;
    return sum % 3 === 0 || sum % 5 === 0 || sum % 7 === 0;
  };

  const getViolations = () => {
    const violations: number[] = [];
    for (let i = 0; i < numberCount; i++) {
      const current = slots[i];
      const next = slots[(i + 1) % numberCount];
      if (current !== null && next !== null && isDivisible(current, next)) {
        violations.push(i);
      }
    }
    return violations;
  };

  const checkWin = () => {
    if (slots.every(s => s !== null) && getViolations().length === 0) {
      setIsComplete(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success(`Congratulations! Completed in ${formatTime(time)}${mode === 'guided' ? ` with ${swaps} swaps` : ''}!`);
    }
  };

  useEffect(() => {
    if (isActive) {
      checkWin();
    }
  }, [slots, isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startGame = (selectedMode: 'default' | 'guided') => {
    setMode(selectedMode);
    setIsActive(true);
    setTime(0);
    setSwaps(0);
    setIsComplete(false);

    if (selectedMode === 'default') {
      setSlots(Array(numberCount).fill(null));
      setAvailableNumbers(Array.from({ length: numberCount }, (_, i) => i + 1));
    } else {
      // Guided mode: random arrangement
      const shuffled = Array.from({ length: numberCount }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
      setSlots(shuffled);
      setAvailableNumbers([]);
    }
  };

  const restart = () => {
    setIsActive(false);
    setIsComplete(false);
    setSlots(Array(numberCount).fill(null));
    setAvailableNumbers(Array.from({ length: numberCount }, (_, i) => i + 1));
    setTime(0);
    setSwaps(0);
  };

  const handleDragStart = (num: number, fromSlot: number | null) => {
    if (!isActive) return;
    setDraggedNumber(num);
    setDraggedFrom(fromSlot);
  };

  const handleDrop = (toSlot: number) => {
    if (!isActive || draggedNumber === null) return;

    if (mode === 'default') {
      // Default mode: place number in slot
      const newSlots = [...slots];
      newSlots[toSlot] = draggedNumber;
      setSlots(newSlots);
      setAvailableNumbers(availableNumbers.filter(n => n !== draggedNumber));
    } else {
      // Guided mode: swap numbers
      if (draggedFrom !== null && draggedFrom !== toSlot) {
        const newSlots = [...slots];
        const temp = newSlots[toSlot];
        newSlots[toSlot] = newSlots[draggedFrom];
        newSlots[draggedFrom] = temp;
        setSlots(newSlots);
        setSwaps(s => s + 1);
      }
    }

    setDraggedNumber(null);
    setDraggedFrom(null);
  };

  const handleSlotClick = (slotIndex: number) => {
    if (!isActive) return;
    if (mode === 'default') {
      // Remove from slot in default mode
      if (slots[slotIndex] !== null) {
        setAvailableNumbers([...availableNumbers, slots[slotIndex]!].sort((a, b) => a - b));
        const newSlots = [...slots];
        newSlots[slotIndex] = null;
        setSlots(newSlots);
      }
    } else if (mode === 'guided') {
      // Swap in guided mode
      if (draggedSlot === null) {
        setDraggedSlot(slotIndex);
      } else if (draggedSlot !== slotIndex) {
        const newSlots = [...slots];
        const temp = newSlots[slotIndex];
        newSlots[slotIndex] = newSlots[draggedSlot];
        newSlots[draggedSlot] = temp;
        setSlots(newSlots);
        setSwaps(s => s + 1);
        setDraggedSlot(null);
      } else {
        setDraggedSlot(null);
      }
    }
  };

  const renderCircle = () => {
    // Dynamic radius based on number count
    const baseRadius = 120;
    const radiusIncrement = (numberCount - 5) * 5;
    const radius = baseRadius + radiusIncrement;
    const svgSize = (radius + 50) * 2;
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const violations = getViolations();

    return (
      <svg width={svgSize} height={svgSize} className="mx-auto">
        {/* Draw circle */}
        <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="var(--border)" strokeWidth="2" />
        
        {/* Draw violation arcs */}
        {violations.map(i => {
          const angle1 = (i * 360 / numberCount - 90) * Math.PI / 180;
          const angle2 = ((i + 1) * 360 / numberCount - 90) * Math.PI / 180;
          const x1 = centerX + radius * Math.cos(angle1);
          const y1 = centerY + radius * Math.sin(angle1);
          const x2 = centerX + radius * Math.cos(angle2);
          const y2 = centerY + radius * Math.sin(angle2);
          
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke="var(--destructive)"
              strokeWidth="4"
            />
          );
        })}

        {/* Draw edges in guided mode */}
        {mode === 'guided' && slots.every(s => s !== null) && slots.map((num1, i) => {
          return slots.slice(i + 1).map((num2, j) => {
            const idx2 = i + j + 1;
            if (num1 !== null && num2 !== null && !isDivisible(num1, num2)) {
              const angle1 = (i * 360 / numberCount - 90) * Math.PI / 180;
              const angle2 = (idx2 * 360 / numberCount - 90) * Math.PI / 180;
              const x1 = centerX + radius * Math.cos(angle1);
              const y1 = centerY + radius * Math.sin(angle1);
              const x2 = centerX + radius * Math.cos(angle2);
              const y2 = centerY + radius * Math.sin(angle2);
              
              // Check if this forms part of the cycle (adjacent positions on circle)
              const isAdjacentOnCircle = Math.abs(i - idx2) === 1 || Math.abs(i - idx2) === numberCount - 1;
              
              return (
                <line
                  key={`${i}-${idx2}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isAdjacentOnCircle ? "#22c55e" : "var(--muted-foreground)"}
                  strokeWidth={isAdjacentOnCircle ? "2.5" : "1"}
                  opacity={isAdjacentOnCircle ? "0.9" : "0.3"}
                />
              );
            }
            return null;
          });
        })}
        
        {/* Draw slots */}
        {slots.map((num, i) => {
          const angle = (i * 360 / numberCount - 90) * Math.PI / 180;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          
          const isSelected = mode === 'guided' && draggedSlot === i;
          
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="25"
                fill={isSelected ? "var(--primary)" : "var(--background)"}
                stroke={isSelected ? "var(--primary)" : "var(--border)"}
                strokeWidth="2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                onClick={() => handleSlotClick(i)}
                className="cursor-pointer"
              />
              {num !== null && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xl font-bold select-none pointer-events-none"
                  fill={isSelected ? "var(--primary-foreground)" : "var(--foreground)"}
                >
                  {num}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Neighbor Sum Avoidance</CardTitle>
          <CardDescription>
            Can you arrange the numbers 1-{numberCount} in a circle so that the sum of two neighbors is never divisible by 3, 5, or 7?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Config controls — shown before start */}
          {!isActive && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-4">
                  <Label htmlFor="mode-switch">Default Mode</Label>
                  <Switch
                    id="mode-switch"
                    checked={mode === 'guided'}
                    onCheckedChange={(checked) => setMode(checked ? 'guided' : 'default')}
                  />
                  <Label htmlFor="mode-switch">Guided Mode</Label>
                </div>

                <div className="flex items-center gap-4 min-w-[200px]">
                  <Label htmlFor="number-count">Numbers: {numberCount}</Label>
                  <Slider
                    id="number-count"
                    min={5}
                    max={15}
                    step={1}
                    value={[numberCount]}
                    onValueChange={(value) => setNumberCount(value[0])}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2 text-center">
                {mode === 'default' ? (
                  <>
                    <p>Drag numbers from below into the circle slots.</p>
                    <p>Adjacent numbers that sum to a multiple of 3, 5, or 7 will show a red arc.</p>
                    <p>Click a filled slot to remove the number.</p>
                  </>
                ) : (
                  <>
                    <p>Numbers are connected by edges if their sum is NOT divisible by 3, 5, or 7.</p>
                    <p>Click two slots to swap their numbers and form a cycle on the circle's edge.</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Timer + controls — shown after start */}
          {isActive && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span className="font-mono">{formatTime(time)}</span>
              </div>
              {mode === 'guided' && (
                <div className="text-sm text-muted-foreground">
                  Swaps: {swaps}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={restart}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </div>
          )}

          {/* Arena — always visible */}
          <div className={!isActive ? 'opacity-60 pointer-events-none' : ''}>
            {renderCircle()}
          </div>

          {/* Start button — shown before start */}
          {!isActive && (
            <div className="text-center">
              <Button onClick={() => startGame(mode)} size="lg">
                Start {mode === 'default' ? 'Default' : 'Guided'} Mode
              </Button>
            </div>
          )}

          {/* Available numbers for default mode */}
          {isActive && mode === 'default' && availableNumbers.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4">
              {availableNumbers.map(num => (
                <div
                  key={num}
                  draggable
                  onDragStart={() => handleDragStart(num, null)}
                  className="w-12 h-12 rounded-full border-2 border-primary bg-background flex items-center justify-center text-lg font-bold cursor-move hover:scale-110 transition-transform"
                >
                  {num}
                </div>
              ))}
            </div>
          )}

          {isComplete && (
            <div className="text-center space-y-4">
              <p className="text-lg font-semibold text-primary">
                🎉 Congratulations! You solved it in {formatTime(time)}
                {mode === 'guided' && ` with ${swaps} swaps`}!
              </p>
              <Button onClick={restart}>Play Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NeighborSumAvoidance;
