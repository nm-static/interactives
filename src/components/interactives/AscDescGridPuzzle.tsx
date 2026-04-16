import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Check, Shuffle, Lightbulb } from "lucide-react";

type Label = 'A' | 'D';

interface AscDescGridPuzzleProps {
}

const AscDescGridPuzzle = ({}: AscDescGridPuzzleProps) => {
  const [gridSize, setGridSize] = useState(3);
  const [rowLabels, setRowLabels] = useState<Label[]>(['A', 'D', 'A']);
  const [colLabels, setColLabels] = useState<Label[]>(['A', 'D', 'A']);
  const [grid, setGrid] = useState<(number | null)[][]>(
    Array(3).fill(null).map(() => Array(3).fill(null))
  );
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    errors: { row?: number; col?: number; type: string }[];
  } | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Get all numbers that have been placed
  const getPlacedNumbers = useCallback((): Set<number> => {
    const placed = new Set<number>();
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r]?.[c] !== null && grid[r]?.[c] !== undefined) {
          placed.add(grid[r][c] as number);
        }
      }
    }
    return placed;
  }, [grid, gridSize]);

  // Reset the puzzle
  const resetPuzzle = useCallback(() => {
    setGrid(Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)));
    setSelectedNumber(null);
    setValidationResult(null);
    setShowHint(false);
  }, [gridSize]);

  // Change grid size
  const handleGridSizeChange = (value: number[]) => {
    const newSize = value[0];
    setGridSize(newSize);
    setRowLabels(Array(newSize).fill('A').map((_, i) => (i % 2 === 0 ? 'A' : 'D') as Label));
    setColLabels(Array(newSize).fill('A').map((_, i) => (i % 2 === 0 ? 'A' : 'D') as Label));
    setGrid(Array(newSize).fill(null).map(() => Array(newSize).fill(null)));
    setSelectedNumber(null);
    setValidationResult(null);
    setShowHint(false);
  };

  // Toggle row label
  const toggleRowLabel = (index: number) => {
    setRowLabels(prev => {
      const newLabels = [...prev];
      newLabels[index] = newLabels[index] === 'A' ? 'D' : 'A';
      return newLabels;
    });
    setValidationResult(null);
  };

  // Toggle column label
  const toggleColLabel = (index: number) => {
    setColLabels(prev => {
      const newLabels = [...prev];
      newLabels[index] = newLabels[index] === 'A' ? 'D' : 'A';
      return newLabels;
    });
    setValidationResult(null);
  };

  // Randomize labels
  const randomizeLabels = () => {
    setRowLabels(Array(gridSize).fill(null).map(() => (Math.random() > 0.5 ? 'A' : 'D') as Label));
    setColLabels(Array(gridSize).fill(null).map(() => (Math.random() > 0.5 ? 'A' : 'D') as Label));
    resetPuzzle();
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (selectedNumber === null) {
      // If clicking on a cell with a number, remove it
      if (grid[row][col] !== null) {
        setGrid(prev => {
          const newGrid = prev.map(r => [...r]);
          newGrid[row][col] = null;
          return newGrid;
        });
        setValidationResult(null);
      }
      return;
    }

    // Place the selected number
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      // Remove the number from any previous position
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (newGrid[r][c] === selectedNumber) {
            newGrid[r][c] = null;
          }
        }
      }
      newGrid[row][col] = selectedNumber;
      return newGrid;
    });
    setSelectedNumber(null);
    setValidationResult(null);
  };

  // Check if puzzle is complete and valid
  const validatePuzzle = () => {
    const errors: { row?: number; col?: number; type: string }[] = [];
    const totalNumbers = gridSize * gridSize;
    const placed = getPlacedNumbers();

    // Check if all numbers are placed
    if (placed.size !== totalNumbers) {
      setValidationResult({
        isValid: false,
        message: `Place all numbers from 1 to ${totalNumbers} first.`,
        errors: []
      });
      return;
    }

    // Check rows
    for (let r = 0; r < gridSize; r++) {
      const row = grid[r];
      const label = rowLabels[r];
      
      for (let c = 0; c < gridSize - 1; c++) {
        const current = row[c] as number;
        const next = row[c + 1] as number;
        
        if (label === 'A' && current >= next) {
          errors.push({ row: r, type: 'row' });
          break;
        }
        if (label === 'D' && current <= next) {
          errors.push({ row: r, type: 'row' });
          break;
        }
      }
    }

    // Check columns
    for (let c = 0; c < gridSize; c++) {
      const label = colLabels[c];
      
      for (let r = 0; r < gridSize - 1; r++) {
        const current = grid[r][c] as number;
        const next = grid[r + 1][c] as number;
        
        if (label === 'A' && current >= next) {
          errors.push({ col: c, type: 'col' });
          break;
        }
        if (label === 'D' && current <= next) {
          errors.push({ col: c, type: 'col' });
          break;
        }
      }
    }

    if (errors.length === 0) {
      setValidationResult({
        isValid: true,
        message: "🎉 Congratulations! The puzzle is solved correctly!",
        errors: []
      });
    } else {
      setValidationResult({
        isValid: false,
        message: `Found ${errors.length} constraint violation(s). Check highlighted rows/columns.`,
        errors
      });
    }
  };

  // Check for circular constraint (unsolvable pattern)
  const checkSolvability = (): { solvable: boolean; reason?: string } => {
    // Check for the circular constraint pattern described in the paper
    // If rows i < j have labels D,A (or A,D) and columns p < q have labels A,D (or D,A),
    // then we have a circular constraint making it unsolvable
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = i + 1; j < gridSize; j++) {
        // Check if rows i and j have opposite labels
        if ((rowLabels[i] === 'D' && rowLabels[j] === 'A') || 
            (rowLabels[i] === 'A' && rowLabels[j] === 'D')) {
          
          for (let p = 0; p < gridSize; p++) {
            for (let q = p + 1; q < gridSize; q++) {
              // Check if columns p and q have opposite labels in the "wrong" way
              const rowPattern = rowLabels[i] === 'D' ? 'DA' : 'AD';
              const colPattern = colLabels[p] === 'A' ? 'AD' : 'DA';
              
              // The circular constraint occurs when:
              // rows i,j are D,A and columns p,q are A,D (or vice versa pattern)
              if ((rowLabels[i] === 'D' && rowLabels[j] === 'A' && 
                   colLabels[p] === 'A' && colLabels[q] === 'D') ||
                  (rowLabels[i] === 'A' && rowLabels[j] === 'D' && 
                   colLabels[p] === 'D' && colLabels[q] === 'A')) {
                return {
                  solvable: false,
                  reason: `Circular constraint detected: rows ${i+1},${j+1} (${rowLabels[i]},${rowLabels[j]}) and columns ${p+1},${q+1} (${colLabels[p]},${colLabels[q]}) create an impossible configuration.`
                };
              }
            }
          }
        }
      }
    }
    
    return { solvable: true };
  };

  const solvabilityCheck = checkSolvability();
  const placedNumbers = getPlacedNumbers();
  const totalNumbers = gridSize * gridSize;

  const hasRowError = (row: number) => 
    validationResult?.errors.some(e => e.row === row && e.type === 'row');
  
  const hasColError = (col: number) => 
    validationResult?.errors.some(e => e.col === col && e.type === 'col');

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ascending-Descending Grid Puzzle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Fill the grid with numbers 1 to n² such that rows labeled <Badge variant="secondary">A</Badge> are 
            in <strong>ascending</strong> order (left→right) and rows labeled <Badge variant="outline">D</Badge> are 
            in <strong>descending</strong> order. The same applies to columns (top→bottom).
          </p>
          <p className="text-muted-foreground text-sm">
            Click on row/column labels to toggle between A and D. Click a number, then click a cell to place it.
          </p>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Grid Size: {gridSize} × {gridSize}
              </label>
              <Slider
                value={[gridSize]}
                onValueChange={handleGridSizeChange}
                min={2}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={randomizeLabels} variant="outline" size="sm">
                <Shuffle className="w-4 h-4 mr-1" /> Randomize
              </Button>
              <Button onClick={resetPuzzle} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-1" /> Reset
              </Button>
              <Button onClick={() => setShowHint(!showHint)} variant="outline" size="sm">
                <Lightbulb className="w-4 h-4 mr-1" /> {showHint ? 'Hide' : 'Show'} Hint
              </Button>
            </div>
          </div>

          {showHint && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <strong>Hint:</strong> Some configurations are unsolvable! A circular constraint occurs when 
              rows i {"<"} j have labels D,A (in that order) while columns p {"<"} q have labels A,D (in that order), 
              or vice versa. Try to avoid these patterns.
            </div>
          )}

          {!solvabilityCheck.solvable && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              ⚠️ {solvabilityCheck.reason}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Number Palette */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-2 text-sm font-medium">
            Select a number to place ({placedNumbers.size}/{totalNumbers} placed):
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: totalNumbers }, (_, i) => i + 1).map(num => {
              const isPlaced = placedNumbers.has(num);
              const isSelected = selectedNumber === num;
              return (
                <Button
                  key={num}
                  variant={isSelected ? "default" : isPlaced ? "ghost" : "outline"}
                  size="sm"
                  className={`w-10 h-10 ${isPlaced && !isSelected ? 'opacity-40' : ''}`}
                  onClick={() => setSelectedNumber(isSelected ? null : num)}
                >
                  {num}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="flex justify-center">
        <div className="inline-block">
          {/* Column labels */}
          <div className="flex">
            <div className="w-10 h-10" /> {/* Empty corner */}
            {colLabels.map((label, c) => (
              <button
                key={`col-${c}`}
                onClick={() => toggleColLabel(c)}
                className={`w-12 h-10 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors rounded-t
                  ${hasColError(c) ? 'bg-destructive/20 text-destructive' : 'hover:bg-muted'}
                  ${label === 'A' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Grid rows */}
          {Array.from({ length: gridSize }, (_, r) => (
            <div key={`row-${r}`} className="flex">
              {/* Row label */}
              <button
                onClick={() => toggleRowLabel(r)}
                className={`w-10 h-12 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors rounded-l
                  ${hasRowError(r) ? 'bg-destructive/20 text-destructive' : 'hover:bg-muted'}
                  ${rowLabels[r] === 'A' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}
              >
                {rowLabels[r]}
              </button>

              {/* Grid cells */}
              {Array.from({ length: gridSize }, (_, c) => {
                const value = grid[r]?.[c];
                const hasError = hasRowError(r) || hasColError(c);
                
                return (
                  <button
                    key={`cell-${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`w-12 h-12 border border-border flex items-center justify-center text-lg font-semibold
                      transition-all cursor-pointer
                      ${value !== null ? 'bg-primary/10' : 'bg-background hover:bg-muted'}
                      ${hasError && validationResult ? 'bg-destructive/10' : ''}
                      ${selectedNumber !== null ? 'hover:bg-primary/20' : ''}
                    `}
                  >
                    {value !== null ? value : ''}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Validate Button */}
      <div className="flex justify-center">
        <Button onClick={validatePuzzle} size="lg" disabled={placedNumbers.size !== totalNumbers}>
          <Check className="w-5 h-5 mr-2" /> Check Solution
        </Button>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <Card className={validationResult.isValid ? 'border-green-500' : 'border-destructive'}>
          <CardContent className="pt-6">
            <p className={`text-center font-medium ${validationResult.isValid ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {validationResult.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Play</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-1">
            <li>The grid has row labels on the left and column labels on top</li>
            <li><Badge variant="secondary" className="mx-1">A</Badge> means ascending order (numbers increase left→right or top→bottom)</li>
            <li><Badge variant="outline" className="mx-1">D</Badge> means descending order (numbers decrease left→right or top→bottom)</li>
            <li>Click on labels to toggle between A and D</li>
            <li>Click a number from the palette, then click a cell to place it</li>
            <li>Click a placed number in the grid to remove it</li>
            <li>Fill all cells with numbers 1 to n² satisfying all constraints</li>
            <li>Some label configurations are unsolvable — the puzzle will warn you!</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default AscDescGridPuzzle;
