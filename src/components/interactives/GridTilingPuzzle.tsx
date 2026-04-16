import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface Rectangle {
  id: number;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

interface GridTilingPuzzleProps {
}

const GridTilingPuzzle: React.FC<GridTilingPuzzleProps> = () => {
  const [gridSize, setGridSize] = useState<number>(9);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    uncoveredCount: number;
  } | null>(null);

  const specialSizes = [4, 9, 25];

  // Different shades of blue for rectangles - starting very dark and getting lighter
  const blueShades = [
    'bg-blue-900',
    'bg-blue-800', 
    'bg-blue-700',
    'bg-blue-600',
    'bg-blue-500',
    'bg-blue-400',
    'bg-blue-300',
    'bg-blue-200'
  ];

  const resetPuzzle = () => {
    setRectangles([]);
    setIsDrawing(false);
    setStartCell(null);
    setHoverCell(null);
    setIsValidating(false);
    setValidationResult(null);
  };

  const isCellCovered = (row: number, col: number): boolean => {
    return rectangles.some(rect => 
      row >= rect.startRow && row <= rect.endRow && 
      col >= rect.startCol && col <= rect.endCol
    );
  };

  const isCellInRectangle = (row: number, col: number, rect: Rectangle): boolean => {
    return row >= rect.startRow && row <= rect.endRow && 
           col >= rect.startCol && col <= rect.endCol;
  };

  const getCellClass = (row: number, col: number): string => {
    let classes = 'border border-gray-300 cursor-pointer transition-colors';
    
    // Check if cell is covered by any rectangle
    const coveredRect = rectangles.find(rect => isCellInRectangle(row, col, rect));
    if (coveredRect) {
      const rectIndex = rectangles.findIndex(rect => rect.id === coveredRect.id);
      const blueShade = blueShades[rectIndex % blueShades.length];
      classes += ` ${blueShade} hover:${blueShade.replace('bg-', 'bg-').replace('-', '-')}`;
      return classes;
    }

    // Check if this is the start cell
    if (startCell && startCell.row === row && startCell.col === col) {
      classes += ' bg-green-500 hover:bg-green-600';
      return classes;
    }

    // Check if this would be a valid completion (no overlap)
    if (startCell && hoverCell && !isCellCovered(row, col)) {
      const minRow = Math.min(startCell.row, hoverCell.row);
      const maxRow = Math.max(startCell.row, hoverCell.row);
      const minCol = Math.min(startCell.col, hoverCell.col);
      const maxCol = Math.max(startCell.col, hoverCell.col);
      
      if (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol) {
        // Check if this preview rectangle would overlap with any existing rectangles
        const wouldOverlap = rectangles.some(existingRect => {
          return !(maxRow < existingRect.startRow || 
                   minRow > existingRect.endRow ||
                   maxCol < existingRect.startCol || 
                   minCol > existingRect.endCol);
        });
        
        if (!wouldOverlap) {
          classes += ' bg-yellow-300 hover:bg-yellow-400';
          return classes;
        }
      }
    }

    classes += ' bg-white hover:bg-gray-100';
    return classes;
  };

  const handleCellClick = (row: number, col: number) => {
    if (isCellCovered(row, col)) return;

    if (!isDrawing) {
      // Start drawing a rectangle
      setIsDrawing(true);
      setStartCell({ row, col });
    } else {
      // Complete the rectangle
      if (startCell) {
        const newRect: Rectangle = {
          id: Date.now(),
          startRow: Math.min(startCell.row, row),
          startCol: Math.min(startCell.col, col),
          endRow: Math.max(startCell.row, row),
          endCol: Math.max(startCell.col, col)
        };
        
        // Check if the new rectangle would overlap with any existing rectangles
        const wouldOverlap = rectangles.some(existingRect => {
          return !(newRect.endRow < existingRect.startRow || 
                   newRect.startRow > existingRect.endRow ||
                   newRect.endCol < existingRect.startCol || 
                   newRect.startCol > existingRect.endCol);
        });
        
        if (wouldOverlap) {
          // Don't place the rectangle if it would overlap
          setIsDrawing(false);
          setStartCell(null);
          setHoverCell(null);
          return;
        }
        
        setRectangles(prev => [...prev, newRect]);
        setIsDrawing(false);
        setStartCell(null);
        setHoverCell(null);
      }
    }
  };

  const handleCellHover = (row: number, col: number) => {
    if (isDrawing && startCell) {
      setHoverCell({ row, col });
    }
  };

  const handleCellLeave = () => {
    setHoverCell(null);
  };

  const validateSolution = () => {
    setIsValidating(true);
    
    // Check if each row and column has exactly one uncovered square
    let uncoveredCount = 0;
    const rowUncovered = new Array(gridSize).fill(0);
    const colUncovered = new Array(gridSize).fill(0);
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (!isCellCovered(row, col)) {
          uncoveredCount++;
          rowUncovered[row]++;
          colUncovered[col]++;
        }
      }
    }
    
    const isValid = rowUncovered.every(count => count === 1) && 
                   colUncovered.every(count => count === 1);
    
    let message = '';
    if (isValid) {
      message = `Perfect! Your solution is valid. You used ${rectangles.length} rectangles.`;
    } else {
      const invalidRows = rowUncovered.map((count, i) => count !== 1 ? i + 1 : null).filter(Boolean);
      const invalidCols = colUncovered.map((count, i) => count !== 1 ? i + 1 : null).filter(Boolean);
      message = `Invalid solution. Rows ${invalidRows.join(', ')} and columns ${invalidCols.join(', ')} don't have exactly one uncovered square.`;
    }
    
    setValidationResult({ isValid, message, uncoveredCount });
    setIsValidating(false);
  };

  const removeRectangle = (rectId: number) => {
    setRectangles(prev => prev.filter(rect => rect.id !== rectId));
    setValidationResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Grid Tiling Puzzle
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            This is P6 on IMO 2025. The given grid size was 2025 in the original problem.
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              Place rectangular tiles on the grid so that each row and each column has exactly one uncovered square. What's the smallest number of rectangles you can use?
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 items-center">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Grid Size: {gridSize}×{gridSize}</label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">3</span>
                  <input
                    type="range"
                    min="3"
                    max="25"
                    value={gridSize}
                    onChange={(e) => {
                      setGridSize(parseInt(e.target.value));
                      resetPuzzle();
                    }}
                    className={`w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${
                      specialSizes.includes(gridSize) ? 'slider-special' : 'slider-normal'
                    }`}
                    style={{
                      '--thumb-color': specialSizes.includes(gridSize) ? '#10b981' : '#6b7280'
                    } as React.CSSProperties}
                  />
                  <span className="text-xs text-muted-foreground">25</span>
                </div>
              </div>
              
              <Button onClick={resetPuzzle} variant="outline" size="sm">
                Reset Puzzle
              </Button>

              <Button 
                onClick={() => {
                  setRectangles(prev => prev.slice(0, -1));
                  setValidationResult(null);
                }} 
                variant="outline" 
                size="sm"
                disabled={rectangles.length === 0}
              >
                Undo Last Move
              </Button>
            </div>

            <div className="flex justify-center items-center gap-4">
              <Badge variant="outline" className="text-sm">
                Rectangles: {rectangles.length}
              </Badge>
              <Badge 
                variant={specialSizes.includes(gridSize) ? "default" : "outline"} 
                className={`text-sm ${specialSizes.includes(gridSize) ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                Grid: {gridSize}×{gridSize}
                {specialSizes.includes(gridSize) && <span className="ml-1">⭐</span>}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Instructions</CardTitle>
            {showInstructions ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showInstructions && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Click on any empty square to start drawing a rectangle</li>
                <li>Click on another square to complete the rectangle</li>
                <li>Each row and column must have exactly one uncovered square</li>
                <li>Rectangles cannot overlap</li>
                <li>Try to use the minimum number of rectangles possible</li>
              </ul>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>Legend: Green = Start, Yellow = Preview, Blue shades = Placed Rectangles</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div 
              className="grid gap-0 border-2 border-gray-400"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: `${Math.min(600, 50 * gridSize)}px`,
                height: `${Math.min(600, 50 * gridSize)}px`
              }}
            >
              {Array.from({ length: gridSize * gridSize }, (_, index) => {
                const row = Math.floor(index / gridSize);
                const col = index % gridSize;
                return (
                  <div
                    key={index}
                    className={getCellClass(row, col)}
                    style={{ width: '100%', height: '100%' }}
                    onClick={() => handleCellClick(row, col)}
                    onMouseEnter={() => handleCellHover(row, col)}
                    onMouseLeave={handleCellLeave}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation */}
      <div className="flex justify-center">
        <Button 
          onClick={validateSolution} 
          disabled={isValidating || rectangles.length === 0}
          size="lg"
          className="px-8"
        >
          {isValidating ? 'Validating...' : 'Validate Solution'}
        </Button>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <Card className={validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              {validationResult.isValid ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${validationResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                  {validationResult.message}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total uncovered squares: {validationResult.uncoveredCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rectangle List */}
      {rectangles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Placed Rectangles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rectangles.map((rect, index) => (
                <div key={rect.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Rectangle {index + 1}:</span>
                    <br />
                    <span className="text-muted-foreground">
                      ({rect.startRow + 1},{rect.startCol + 1}) to ({rect.endRow + 1},{rect.endCol + 1})
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRectangle(rect.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Share */}
    </div>
  );
};

export default GridTilingPuzzle; 