import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FerrersRogersRamanujanProps {
}

const FerrersRogersRamanujan = ({}: FerrersRogersRamanujanProps) => {
  const [n, setN] = useState(14);
  const [partitionSliders, setPartitionSliders] = useState<number[]>([]);
  const [committedPartition, setCommittedPartition] = useState<number[]>([]);
  const [rrPartition, setRRPartition] = useState<number[]>([]);
  const [animatingHook, setAnimatingHook] = useState<{ row: number; col: number } | null>(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hookColors, setHookColors] = useState<string[]>([]);
  const [baseHue, setBaseHue] = useState(0);
  const [completedHooks, setCompletedHooks] = useState<Array<{ row: number; col: number }>>([]);

  useEffect(() => {
    // Initialize sliders with all zeros
    setPartitionSliders(new Array(n).fill(0));
    setCommittedPartition([]);
    setRRPartition([]);
  }, [n]);

  const currentSum = partitionSliders.reduce((sum, val) => sum + val, 0);
  const isValid = currentSum === n;

  const handleCommit = () => {
    if (!isValid) {
      toast.error(`Sum must equal ${n}. Current sum: ${currentSum}`);
      return;
    }
    // Filter out zeros and sort in descending order
    const partition = partitionSliders.filter(v => v > 0).sort((a, b) => b - a);
    setCommittedPartition(partition);
    setRRPartition([]);
    setAnimatingHook(null);
    setAnimationStep(0);
    toast.success("Partition committed!");
  };

  const handleReset = () => {
    setPartitionSliders(new Array(n).fill(0));
    setCommittedPartition([]);
    setRRPartition([]);
    setAnimatingHook(null);
    setAnimationStep(0);
    setIsAnimating(false);
    setHookColors([]);
    setCompletedHooks([]);
  };

  const generateRRPartition = () => {
    if (committedPartition.length === 0) {
      toast.error("Please commit a partition first");
      return;
    }

    // Pick a random base hue (0-360)
    const newBaseHue = Math.floor(Math.random() * 360);
    setBaseHue(newBaseHue);
    setHookColors([]);
    setCompletedHooks([]);
    setRRPartition([]);
    setAnimationStep(0);
    setIsAnimating(true);
  };

  // Generate muted pastel color for current hook
  const generateHookColor = (index: number, total: number) => {
    // Move through shades of the base hue
    const hueVariation = (index / Math.max(total - 1, 1)) * 60 - 30; // ±30 degrees
    const hue = (baseHue + hueVariation + 360) % 360;
    const saturation = 45 + (index % 3) * 10; // 45-65% for muted pastels
    const lightness = 75 + (index % 2) * 5; // 75-80% for pastels
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Animation effect - traverse main diagonal only
  useEffect(() => {
    if (!isAnimating || committedPartition.length === 0) return;

    const partition = committedPartition;
    
    // Main diagonal: positions (0,0), (1,1), (2,2), ... while box exists
    const row = animationStep;
    const col = animationStep;
    
    // Check if this diagonal position has a box
    if (row >= partition.length || col >= partition[row]) {
      // Animation complete - no more diagonal boxes
      setIsAnimating(false);
      setAnimatingHook(null);
      return;
    }

    setAnimatingHook({ row, col });

    // Calculate hook size: boxes to the right + boxes below + 1 (the box itself)
    const boxesRight = partition[row] - col - 1;
    let boxesBelow = 0;
    for (let r = row + 1; r < partition.length; r++) {
      if (partition[r] > col) {
        boxesBelow++;
      } else {
        break;
      }
    }
    const hookSize = boxesRight + boxesBelow + 1;

    // Generate color for this hook (estimate total hooks as partition length)
    const estimatedTotalHooks = Math.min(partition.length, partition[0] || 0);
    const color = generateHookColor(animationStep, estimatedTotalHooks);
    
    // Update colors, completed hooks, and RR partition
    setHookColors(prev => [...prev, color]);
    setCompletedHooks(prev => [...prev, { row, col }]);
    setRRPartition(prev => [...prev, hookSize]);

    // Schedule next step
    const timeout = setTimeout(() => {
      setAnimationStep(prev => prev + 1);
    }, 500);

    return () => clearTimeout(timeout);
  }, [isAnimating, animationStep, committedPartition, baseHue]);

  const renderFerrersDiagram = (partition: number[], highlightHook?: { row: number; col: number }, isOriginal = true) => {
    if (partition.length === 0) return null;

    return (
      <div className="inline-block p-4 bg-card rounded-lg border">
        {partition.map((count, rowIdx) => (
          <div key={rowIdx} className="flex gap-[2px] mb-[2px]">
            {Array.from({ length: count }).map((_, colIdx) => {
              let backgroundColor = 'bg-secondary';
              let borderColor = 'border-border';
              let extraClasses = 'hover:bg-secondary/80';
              let style: React.CSSProperties = {};
              
              if (isOriginal) {
                // Check if this box is part of any completed hook
                for (let i = 0; i < completedHooks.length; i++) {
                  const hook = completedHooks[i];
                  const isPartOfHook = 
                    (rowIdx === hook.row && colIdx >= hook.col) || // boxes to the right
                    (colIdx === hook.col && rowIdx >= hook.row);   // boxes below
                  
                  if (isPartOfHook) {
                    const color = hookColors[i];
                    backgroundColor = '';
                    borderColor = '';
                    extraClasses = 'scale-105 shadow-md';
                    style = { 
                      backgroundColor: color,
                      borderColor: color
                    };
                    break; // Use the first matching hook's color
                  }
                }
                
                // Highlight current hook being processed (override completed hooks)
                if (highlightHook) {
                  const isCurrentHook = 
                    (rowIdx === highlightHook.row && colIdx >= highlightHook.col) ||
                    (colIdx === highlightHook.col && rowIdx >= highlightHook.row);
                  
                  if (isCurrentHook) {
                    backgroundColor = 'bg-primary';
                    borderColor = 'border-primary';
                    extraClasses = 'scale-110 shadow-lg animate-pulse';
                    style = {};
                  }
                }
              }
              
              return (
                <div
                  key={colIdx}
                  className={`w-[30px] h-[30px] border-2 transition-all duration-300 ${backgroundColor} ${borderColor} ${extraClasses}`}
                  style={style}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderRRDiagram = (partition: number[]) => {
    if (partition.length === 0) return null;

    return (
      <div className="inline-block p-4 bg-card rounded-lg border">
        {partition.map((count, rowIdx) => (
          <div key={rowIdx} className="flex gap-[2px] mb-[2px]">
            {Array.from({ length: count }).map((_, colIdx) => {
              const color = hookColors[rowIdx] || 'hsl(var(--secondary))';
              return (
                <div
                  key={colIdx}
                  className="w-[30px] h-[30px] border-2 transition-all duration-300 scale-105 shadow-md"
                  style={{ 
                    backgroundColor: color,
                    borderColor: color
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-6 max-w-6xl mx-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Ferrers Diagram & Rogers-Ramanujan Partition</h2>
          <p className="text-muted-foreground">
            Create a partition of a number and visualize its transformation using L-shaped hooks.
          </p>
        </div>

        {/* Number Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Number (n)</label>
          <Input
            type="number"
            min={1}
            max={30}
            value={n}
            onChange={(e) => setN(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
            className="w-32"
            disabled={committedPartition.length > 0}
          />
        </div>

        {/* Partition Sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Create Partition</h3>
            <div className="text-sm">
              Sum: <span className={isValid ? "text-green-600 font-bold" : "text-destructive font-bold"}>{currentSum}</span> / {n}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {partitionSliders.map((value, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Part {idx + 1}</label>
                  <span className="text-sm font-mono">{value}</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([newVal]) => {
                    const newSliders = [...partitionSliders];
                    newSliders[idx] = newVal;
                    setPartitionSliders(newSliders);
                  }}
                  max={n}
                  step={1}
                  disabled={committedPartition.length > 0}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleCommit} 
              disabled={!isValid || committedPartition.length > 0}
            >
              Commit Partition
            </Button>
            <Button 
              onClick={handleReset} 
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Display Partitions */}
        {committedPartition.length > 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Partition</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {committedPartition.join(" + ")} = {n}
              </p>
              {renderFerrersDiagram(committedPartition, animatingHook || undefined)}
            </div>

            <Button 
              onClick={generateRRPartition}
              disabled={rrPartition.length > 0 || isAnimating}
              className="w-full md:w-auto"
            >
              {isAnimating ? "Generating..." : "Generate Rogers-Ramanujan Partition"}
            </Button>

            {/* RR Partition Display */}
            {rrPartition.length > 0 && (
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-2">Rogers-Ramanujan Partition</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {rrPartition.join(" + ")} = {n} (parts differ by ≥ 2)
                </p>
                {renderRRDiagram(rrPartition)}
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        <div className="pt-6 border-t space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Ferrers Diagram:</strong> A visual representation of an integer partition using boxes arranged in rows.
          </p>
          <p>
            <strong>Rogers-Ramanujan Partition:</strong> Traverse the L-shaped hooks of the Ferrers diagram. 
            Each hook consists of all boxes to the right and below (including the corner box). 
            The hook sizes form a new partition where parts differ by at least 2.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default FerrersRogersRamanujan;
