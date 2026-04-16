import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface BulgarianSolitaireProps {
}

interface Box {
  id: number;
  columnIndex: number | null; // null means it's in the container
}

const BulgarianSolitaire: React.FC<BulgarianSolitaireProps> = () => {
  const [n, setN] = useState(15);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [columns, setColumns] = useState<number[][]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [draggedBox, setDraggedBox] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [highlightedBoxes, setHighlightedBoxes] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'fade-to-red' | 'red-pause' | 'moving' | 'fade-from-red' | 'sorting'>('idle');
  const [lastUsedColumn, setLastUsedColumn] = useState<number | null>(null);
  const [selectedBoxForMove, setSelectedBoxForMove] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const pauseRef = useRef(false);

  const totalBoxes = n;

  // Initialize boxes and columns when n changes
  useEffect(() => {
    const newBoxes: Box[] = [];
    for (let i = 0; i < totalBoxes; i++) {
      newBoxes.push({ id: i, columnIndex: null });
    }
    setBoxes(newBoxes);
    setColumns(Array.from({ length: totalBoxes }, () => []));
    setStep(0);
    setIsComplete(false);
  }, [n, totalBoxes]);

  const handleDragStart = (e: React.DragEvent, boxId: number) => {
    setDraggedBox(boxId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnIndex: number) => {
    e.preventDefault();
    if (draggedBox === null) return;

    const box = boxes.find(b => b.id === draggedBox);
    if (!box || box.columnIndex === columnIndex) return;

    // Remove from previous location
    if (box.columnIndex !== null) {
      setColumns(prev => prev.map((col, idx) => 
        idx === box.columnIndex ? col.filter(id => id !== draggedBox) : col
      ));
    }

    // Add to new column
    setColumns(prev => prev.map((col, idx) => 
      idx === columnIndex ? [...col, draggedBox] : col
    ));

    // Update box location
    setBoxes(prev => prev.map(b => 
      b.id === draggedBox ? { ...b, columnIndex } : b
    ));

    // Track last used column
    setLastUsedColumn(columnIndex);
    setDraggedBox(null);
  };

  const handleDropToContainer = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBox === null) return;

    const box = boxes.find(b => b.id === draggedBox);
    if (!box || box.columnIndex === null) return;

    // Remove from column
    setColumns(prev => prev.map((col, idx) => 
      idx === box.columnIndex ? col.filter(id => id !== draggedBox) : col
    ));

    // Return to container
    setBoxes(prev => prev.map(b => 
      b.id === draggedBox ? { ...b, columnIndex: null } : b
    ));

    setDraggedBox(null);
  };

  const handleBoxClick = (boxId: number) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box || box.columnIndex !== null || isPlaying) return;
    
    // Select box for moving
    setSelectedBoxForMove(boxId);
  };

  const handleColumnClick = (e: React.MouseEvent, columnIndex: number) => {
    e.stopPropagation();
    if (selectedBoxForMove === null || isPlaying) return;

    // Move selected box to this column
    setColumns(prev => prev.map((col, idx) => 
      idx === columnIndex ? [...col, selectedBoxForMove] : col
    ));
    
    // Update box location
    setBoxes(prev => prev.map(b => 
      b.id === selectedBoxForMove ? { ...b, columnIndex } : b
    ));

    // Track last used column and clear selection
    setLastUsedColumn(columnIndex);
    setSelectedBoxForMove(null);
  };

  const handleDoubleClick = (boxId: number) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    // If box is in container, move to last used column
    if (box.columnIndex === null) {
      if (lastUsedColumn !== null) {
        // Add to last used column
        setColumns(prev => prev.map((col, idx) => 
          idx === lastUsedColumn ? [...col, boxId] : col
        ));
        
        // Update box location
        setBoxes(prev => prev.map(b => 
          b.id === boxId ? { ...b, columnIndex: lastUsedColumn } : b
        ));
      }
      return;
    }

    // If box is in a column, remove from current column
    setColumns(prev => prev.map((col, idx) => 
      idx === box.columnIndex ? col.filter(id => id !== boxId) : col
    ));

    // Move to last used column or container if no last used column
    if (lastUsedColumn !== null && lastUsedColumn !== box.columnIndex) {
      // Add to last used column
      setColumns(prev => prev.map((col, idx) => 
        idx === lastUsedColumn ? [...col, boxId] : col
      ));
      
      // Update box location
      setBoxes(prev => prev.map(b => 
        b.id === boxId ? { ...b, columnIndex: lastUsedColumn } : b
      ));
    } else {
      // Return to container if no last used column or same as current
      setBoxes(prev => prev.map(b => 
        b.id === boxId ? { ...b, columnIndex: null } : b
      ));
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const waitForUnpause = async () => {
    while (pauseRef.current) {
      await sleep(100);
    }
  };

  const handlePause = () => {
    pauseRef.current = true;
    setIsPaused(true);
  };

  const handleResume = () => {
    pauseRef.current = false;
    setIsPaused(false);
  };

  const isTriangularConfiguration = (cols: number[][]) => {
    const nonEmptyCols = cols.filter(col => col.length > 0).sort((a, b) => a.length - b.length);
    
    // Check if n is a triangular number and if columns form the staircase pattern
    // Find k such that k*(k+1)/2 = n
    const k = Math.floor((-1 + Math.sqrt(1 + 8 * n)) / 2);
    if (k * (k + 1) / 2 !== n) return false; // n is not a triangular number
    
    if (nonEmptyCols.length !== k) return false;
    
    for (let i = 0; i < k; i++) {
      if (nonEmptyCols[i].length !== i + 1) return false;
    }
    return true;
  };

  const simulateBulgarianSolitaire = async () => {
    if (boxes.filter(b => b.columnIndex === null).length > 0) {
      toast.error("Please place all boxes in columns before playing!");
      return;
    }

    setIsPlaying(true);
    setStep(0);
    let currentColumns = [...columns];
    let stepCount = 0;

    while (!isTriangularConfiguration(currentColumns) && stepCount < 50) {
      stepCount++;
      setStep(stepCount);

      // Highlight top boxes that will be moved
      const topBoxes = new Set<number>();
      currentColumns.forEach(col => {
        if (col.length > 0) {
          topBoxes.add(col[col.length - 1]);
        }
      });
      
      setHighlightedBoxes(topBoxes);
      
      // Phase 1: Fade to red
      setAnimationPhase('fade-to-red');
      setIsAnimating(true);
      await sleep(500); // Fade to red animation
      await waitForUnpause();

      // Phase 2: Red pause
      setAnimationPhase('red-pause');
      await sleep(1000); // Pause for 1 second with red blocks
      await waitForUnpause();

      // Phase 3: Move blocks
      setAnimationPhase('moving');
      
      // Create new pile from non-empty columns
      const newPile: number[] = [];
      const updatedColumns = currentColumns.map(col => {
        if (col.length > 0) {
          const boxToMove = col[col.length - 1]; // Take from top
          newPile.push(boxToMove);
          return col.slice(0, -1); // Remove from column
        }
        return col;
      });

      // Add the new pile
      const emptyColumnIndex = updatedColumns.findIndex(col => col.length === 0);
      if (emptyColumnIndex !== -1) {
        updatedColumns[emptyColumnIndex] = newPile;
      } else {
        // This shouldn't happen in a properly configured game
        console.error("No empty column found for new pile");
        break;
      }

      currentColumns = updatedColumns;
      setColumns(currentColumns);

      // Update box positions
      setBoxes(prev => prev.map(box => {
        for (let i = 0; i < currentColumns.length; i++) {
          if (currentColumns[i].includes(box.id)) {
            return { ...box, columnIndex: i };
          }
        }
        return box;
      }));

      await sleep(500); // Show move
      await waitForUnpause();

      // Phase 4: Sort columns while boxes are still red
      setAnimationPhase('sorting');

      // Sort columns by height (tallest to left) with smooth transition
      const columnData = currentColumns.map((col, index) => ({ col, originalIndex: index }))
        .filter(item => item.col.length > 0)
        .sort((a, b) => b.col.length - a.col.length);
      
      const sortedColumns = Array.from({ length: updatedColumns.length }, () => []);
      columnData.forEach((item, index) => {
        sortedColumns[index] = item.col;
      });

      currentColumns = sortedColumns;
      setColumns(currentColumns);

      // Update box positions
      setBoxes(prev => prev.map(box => {
        for (let i = 0; i < currentColumns.length; i++) {
          if (currentColumns[i].includes(box.id)) {
            return { ...box, columnIndex: i };
          }
        }
        return box;
      }));

      await sleep(800); // Wait for sorting animation to complete
      await waitForUnpause();

      // Phase 5: Fade from red to normal
      setAnimationPhase('fade-from-red');
      await sleep(500); // Fade from red animation
      await waitForUnpause();

      // Clear highlighting and animation
      setHighlightedBoxes(new Set());
      setIsAnimating(false);
      setAnimationPhase('idle');

      await waitForUnpause(); // Check for pause again
    }

    setIsComplete(isTriangularConfiguration(currentColumns));
    setIsPlaying(false);
    
    if (isTriangularConfiguration(currentColumns)) {
      toast.success(`Reached triangular configuration in ${stepCount} steps!`);
    } else {
      toast.error("Maximum steps reached without convergence");
    }
  };

  const reset = () => {
    pauseRef.current = false;
    setIsPaused(false);
    setIsPlaying(false);
    setDraggedBox(null);
    setLastUsedColumn(null);
    setSelectedBoxForMove(null);
    
    const newBoxes: Box[] = [];
    for (let i = 0; i < totalBoxes; i++) {
      newBoxes.push({ id: i, columnIndex: null });
    }
    setBoxes(newBoxes);
    setColumns(Array.from({ length: totalBoxes }, () => []));
    setStep(0);
    setIsComplete(false);
    setHighlightedBoxes(new Set());
    setIsAnimating(false);
    setAnimationPhase('idle');
  };

  const randomStart = () => {
    // Reset first
    reset();
    
    // Randomly distribute all boxes into columns
    const newBoxes: Box[] = [];
    const newColumns = Array.from({ length: totalBoxes }, () => []);
    
    for (let i = 0; i < totalBoxes; i++) {
      // Pick a random column index (ensure we use at least some columns)
      const columnIndex = Math.floor(Math.random() * Math.min(totalBoxes, 8)); // Limit to 8 columns for better visualization
      newBoxes.push({ id: i, columnIndex });
      newColumns[columnIndex].push(i);
    }
    
    setBoxes(newBoxes);
    setColumns(newColumns);
  };

  const containerBoxes = boxes.filter(box => box.columnIndex === null);

  const handleBackgroundClick = () => {
    if (selectedBoxForMove !== null) {
      setSelectedBoxForMove(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8" onClick={handleBackgroundClick}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Bulgarian Solitaire</h1>
        <p className="text-muted-foreground text-base max-w-3xl mx-auto">
          Choose a number n, then drag the {totalBoxes} boxes into columns. <br />
          Note that one column can hold multiple boxes. <br />
          Click "Play" to simulate the Bulgarian Solitaire process: <br />
          here one box is taken from each non-empty column to form a new column.
          <br />
          <span className="border-t border-muted-foreground/30 block w-16 mx-auto my-4"></span>
          <br />
          Will this process always converge?
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Total boxes = {n}</label>
          <Slider
            value={[n]}
            onValueChange={(value) => setN(value[0])}
            min={2}
            max={45}
            step={1}
            className="w-32"
            disabled={isPlaying}
          />
        </div>
        <Button onClick={reset} variant="outline" disabled={isPlaying && !isPaused}>
          Reset
        </Button>
        <Button onClick={randomStart} variant="default" disabled={isPlaying && !isPaused}>
          Random Start
        </Button>
      </div>

      {/* Container */}
      <div className="flex justify-center">
        <div 
          className="border-2 border-dashed border-muted-foreground rounded-lg p-4 min-h-[120px] bg-muted/20"
          onDragOver={handleDragOver}
          onDrop={handleDropToContainer}
        >
          <div className="text-center text-sm text-muted-foreground mb-2">Container</div>
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {containerBoxes.map((box) => (
              <div
                key={box.id}
                draggable={!isPlaying}
                onDragStart={(e) => handleDragStart(e, box.id)}
                onDoubleClick={() => handleDoubleClick(box.id)}
                onClick={() => handleBoxClick(box.id)}
                className={`w-8 h-8 bg-primary rounded cursor-pointer hover:bg-primary/80 transition-colors ${
                  selectedBoxForMove === box.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
              >
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Columns</h3>
          {step > 0 && (
            <p className="text-sm text-muted-foreground">Step: {step}</p>
          )}
        </div>
        
        <div className="flex justify-center gap-1 flex-wrap max-w-full mx-auto">
          {columns.map((column, index) => (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={(e) => handleColumnClick(e, index)}
              className={`border rounded-lg min-h-[100px] w-12 p-1 bg-background/50 flex flex-col-reverse gap-1 transition-all duration-700 ease-in-out ${
                selectedBoxForMove !== null ? 'border-blue-500 border-2 cursor-pointer hover:bg-blue-50' : 'border-muted-foreground'
              } ${animationPhase === 'sorting' ? 'transform-gpu' : ''}`}
              style={{ flexBasis: `calc(${100/15}% - 0.25rem)`, minWidth: '48px' }}
            >
              <div className="text-xs text-center text-muted-foreground mb-1 transform rotate-0">
                {index + 1}
              </div>
              {column.map((boxId, boxIndex) => (
                <div
                  key={boxId}
                  draggable={!isPlaying}
                  onDragStart={(e) => handleDragStart(e, boxId)}
                  onDoubleClick={() => handleDoubleClick(boxId)}
                  className={`w-8 h-8 rounded cursor-move transition-all duration-300 flex items-center justify-center text-xs font-medium mx-auto ${
                    highlightedBoxes.has(boxId) && animationPhase === 'fade-to-red'
                      ? 'animate-fade-to-red shadow-lg text-white'
                      : highlightedBoxes.has(boxId) && (animationPhase === 'red-pause' || animationPhase === 'moving' || animationPhase === 'sorting')
                      ? 'bg-red-500 text-white shadow-lg'
                      : highlightedBoxes.has(boxId) && animationPhase === 'fade-from-red'
                      ? 'animate-fade-from-red shadow-lg'
                      : 'bg-primary text-primary-foreground hover:bg-primary/80'
                  }`}
                  title="Drag to move or double-click to move to last-used column"
                >
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Play Button */}
      <div className="flex justify-center">
        <Button
          onClick={isPlaying ? (isPaused ? handleResume : handlePause) : simulateBulgarianSolitaire}
          disabled={!isPlaying && containerBoxes.length > 0}
          size="lg"
          className="px-12"
        >
          {isPlaying ? (isPaused ? 'Continue' : 'Pause') : 'Play'}
        </Button>
      </div>

      {/* Status */}
      {isComplete && (
        <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg">
          <h3 className="text-lg font-semibold text-success">Triangular Configuration Reached! 🎉</h3>
          <p className="text-sm text-muted-foreground">
            The Bulgarian Solitaire process converged to the stable triangular configuration in {step} steps.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-lg font-semibold text-primary hover:underline cursor-pointer text-left"
        >
          Click here for instructions.
        </button>
        {showInstructions && (
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Choose a value for n (2-45) using the slider</li>
            <li>Drag the {totalBoxes} boxes from the container into any of the columns</li>
            <li>Drag boxes between columns to rearrange them as needed</li>
            <li>Drag boxes back to the container or double-click any box in a column to move it to the last-used column</li>
            <li>Once all boxes are placed in columns, click "Play" to start the simulation</li>
            <li>Watch as the algorithm takes one box from each non-empty column to form a new column</li>
            <li>Spoiler: For triangular numbers, the process continues until reaching the staircase configuration: columns of sizes 1, 2, 3, ..., n.</li>
          </ul>
        )}
      </div>

      {/* Credits */}
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4 flex flex-col justify-center">
        <p className="text-sm text-muted-foreground">
          Find out more about Bulgarian Solitaire on{" "}
          <a href="https://en.wikipedia.org/wiki/Bulgarian_solitaire" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Wikipedia
          </a>
          . I learned of this game from{" "}
          <a href="https://sites.google.com/view/kumarakash/home" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Akash Kumar
          </a>
          , who very kindly walked me through the argument found in{" "}
          <a href="https://math.dartmouth.edu/~pw/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Peter Winkler's
          </a>
          {" "}beautiful puzzle book,{" "}
          <a href="https://math.dartmouth.edu/news-resources/electronic/puzzlebook/book/book.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            available here
          </a>
          . The game was introduced by{" "}
          <a href="https://en.wikipedia.org/wiki/Martin_Gardner" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Martin Gardner
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default BulgarianSolitaire;