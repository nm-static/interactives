import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Line {
  id: number;
  start: Point;
  end: Point;
  isSunny: boolean;
}

interface SunnyLinesPuzzleProps {
}

const SunnyLinesPuzzle: React.FC<SunnyLinesPuzzleProps> = () => {
  const [n, setN] = useState<number>(5);
  const [lines, setLines] = useState<Line[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const gridSize = n + 2;
  const canvasSize = 600;
  const cellSize = canvasSize / gridSize;

  // Check if a line is sunny (not parallel to x-axis, y-axis, or x+y=0)
  const isSunnyLine = (start: Point, end: Point): boolean => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (dx === 0) return false; // Parallel to y-axis
    if (dy === 0) return false; // Parallel to x-axis
    if (dx === -dy) return false; // Parallel to x+y=0 (slope = -1)
    
    return true;
  };

  // Convert canvas coordinates to grid coordinates
  const canvasToGrid = (canvasX: number, canvasY: number): Point => {
    const x = canvasX / cellSize;
    const y = (canvasSize - canvasY) / cellSize; // Flip Y axis
    return { x, y };
  };

  // Convert grid coordinates to canvas coordinates
  const gridToCanvas = (gridX: number, gridY: number): Point => {
    const x = gridX * cellSize;
    const y = canvasSize - (gridY * cellSize); // Flip Y axis
    return { x, y };
  };

  // Snap a point to the nearest grid point or midpoint
  const snapToGrid = (point: Point): Point => {
    return {
      x: Math.round(point.x * 2) / 2, // Snap to 0, 0.5, 1, 1.5, 2, etc.
      y: Math.round(point.y * 2) / 2  // Snap to 0, 0.5, 1, 1.5, 2, etc.
    };
  };

  // Extend a line to grid boundaries
  const extendLineToBoundaries = (start: Point, end: Point): { start: Point; end: Point } => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (dx === 0) {
      // Vertical line - extend to top and bottom boundaries
      return {
        start: { x: start.x, y: 0 },
        end: { x: end.x, y: gridSize }
      };
    }
    
    if (dy === 0) {
      // Horizontal line - extend to left and right boundaries
      return {
        start: { x: 0, y: start.y },
        end: { x: gridSize, y: end.y }
      };
    }
    
    // Diagonal line - extend to grid boundaries
    const slope = dy / dx;
    
    // Find intersection with left boundary (x = 0)
    const leftY = start.y - slope * start.x;
    const leftPoint = { x: 0, y: leftY };
    
    // Find intersection with right boundary (x = gridSize)
    const rightY = start.y + slope * (gridSize - start.x);
    const rightPoint = { x: gridSize, y: rightY };
    
    // Find intersection with bottom boundary (y = 0)
    const bottomX = start.x - start.y / slope;
    const bottomPoint = { x: bottomX, y: 0 };
    
    // Find intersection with top boundary (y = gridSize)
    const topX = start.x + (gridSize - start.y) / slope;
    const topPoint = { x: topX, y: gridSize };
    
    // Find the two boundary points that are actually on the grid
    const boundaryPoints = [];
    
    if (leftY >= 0 && leftY <= gridSize) boundaryPoints.push(leftPoint);
    if (rightY >= 0 && rightY <= gridSize) boundaryPoints.push(rightPoint);
    if (bottomX >= 0 && bottomX <= gridSize) boundaryPoints.push(bottomPoint);
    if (topX >= 0 && topX <= gridSize) boundaryPoints.push(topPoint);
    
    // Return the two points that are furthest apart
    if (boundaryPoints.length >= 2) {
      let maxDistance = 0;
      let bestPair = { start: boundaryPoints[0], end: boundaryPoints[1] };
      
      for (let i = 0; i < boundaryPoints.length; i++) {
        for (let j = i + 1; j < boundaryPoints.length; j++) {
          const dist = Math.sqrt(
            Math.pow(boundaryPoints[i].x - boundaryPoints[j].x, 2) +
            Math.pow(boundaryPoints[i].y - boundaryPoints[j].y, 2)
          );
          if (dist > maxDistance) {
            maxDistance = dist;
            bestPair = { start: boundaryPoints[i], end: boundaryPoints[j] };
          }
        }
      }
      
      return bestPair;
    }
    
    // Fallback to original points if boundary calculation fails
    return { start, end };
  };

  // Check if a point (a,b) is in the triangle a+b <= n+1
  const isInTriangle = (a: number, b: number): boolean => {
    return a >= 1 && b >= 1 && a + b <= n + 1;
  };

  // Check if a point is covered by any line
  const isPointCovered = (a: number, b: number): boolean => {
    return lines.some(line => {
      const dx = line.end.x - line.start.x;
      const dy = line.end.y - line.start.y;
      
      // Check if point (a,b) lies on the line
      const t1 = (a - line.start.x) / dx;
      const t2 = (b - line.start.y) / dy;
      
      // If line is vertical or horizontal, check differently
      if (dx === 0) {
        return Math.abs(a - line.start.x) < 0.01;
      }
      if (dy === 0) {
        return Math.abs(b - line.start.y) < 0.01;
      }
      
      return Math.abs(t1 - t2) < 0.01 && t1 >= 0 && t1 <= 1;
    });
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const gridPoint = snapToGrid(canvasToGrid(canvasX, canvasY));
    
    if (!isDrawing) {
      setStartPoint(gridPoint);
      setIsDrawing(true);
    } else {
      if (startPoint) {
        const extendedLine = extendLineToBoundaries(startPoint, gridPoint);
        const newLine: Line = {
          id: Date.now(),
          start: extendedLine.start,
          end: extendedLine.end,
          isSunny: isSunnyLine(extendedLine.start, extendedLine.end)
        };
        
        setLines(prev => [...prev, newLine]);
        setIsDrawing(false);
        setStartPoint(null);
        setHoverPoint(null);
      }
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    if (!canvasRef.current || !isDrawing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const gridPoint = snapToGrid(canvasToGrid(canvasX, canvasY));
    
    setHoverPoint(gridPoint);
  };

  const handleCanvasMouseLeave = () => {
    setHoverPoint(null);
  };

  const resetPuzzle = () => {
    setLines([]);
    setIsDrawing(false);
    setStartPoint(null);
    setHoverPoint(null);
    setShowResults(false);
  };

  const undoLastLine = () => {
    setLines(prev => prev.slice(0, -1));
    setShowResults(false);
  };

  const calculateResults = () => {
    setShowResults(true);
  };

  const getLineColor = (line: Line): string => {
    return line.isSunny ? '#10b981' : '#ef4444';
  };

  const renderGrid = () => {
    const cells = [];
    
    // Render grid cells for reference - include both integer points and midpoints
    for (let x = 0; x <= gridSize * 2; x++) {
      for (let y = 0; y <= gridSize * 2; y++) {
        const gridX = x / 2;
        const gridY = y / 2;
        const canvasPoint = gridToCanvas(gridX, gridY);
        
        // Make integer points slightly larger and midpoints smaller
        const isIntegerPoint = x % 2 === 0 && y % 2 === 0;
        const size = isIntegerPoint ? 2 : 1;
        const opacity = isIntegerPoint ? 0.8 : 0.4;
        
        cells.push(
          <div
            key={`cell-${x}-${y}`}
            className="absolute border border-gray-200"
            style={{
              left: canvasPoint.x - size,
              top: canvasPoint.y - size,
              width: size * 2,
              height: size * 2,
              borderRadius: '50%',
              backgroundColor: `rgba(243, 244, 246, ${opacity})`
            }}
          />
        );
      }
    }
    
    return cells;
  };

  const renderTriangle = () => {
    const trianglePoints = [];
    
    // Render blue dots at integer lattice points where a + b <= n + 1
    for (let a = 1; a <= n; a++) {
      for (let b = 1; b <= n; b++) {
        if (a + b <= n + 1) {
          const canvasPoint = gridToCanvas(a, b);
          trianglePoints.push(
            <circle
              key={`triangle-${a}-${b}`}
              cx={canvasPoint.x}
              cy={canvasPoint.y}
              r="4"
              fill="rgba(59, 130, 246, 0.8)"
              stroke="rgba(59, 130, 246, 1)"
              strokeWidth="1"
            />
          );
        }
      }
    }
    
    return trianglePoints;
  };

  const renderCoveredPoints = () => {
    const coveredPoints = [];
    
    // Check only integer lattice points in the triangle for coverage
    for (let a = 1; a <= n; a++) {
      for (let b = 1; b <= n; b++) {
        if (a + b <= n + 1 && isPointCovered(a, b)) {
          const canvasPoint = gridToCanvas(a, b);
          coveredPoints.push(
            <circle
              key={`covered-${a}-${b}`}
              cx={canvasPoint.x}
              cy={canvasPoint.y}
              r="4"
              fill="rgba(34, 197, 94, 0.8)"
              stroke="rgba(34, 197, 94, 1)"
              strokeWidth="1"
            />
          );
        }
      }
    }
    
    return coveredPoints;
  };

  const renderLines = () => {
    return lines.map(line => {
      const startCanvas = gridToCanvas(line.start.x, line.start.y);
      const endCanvas = gridToCanvas(line.end.x, line.end.y);
      
      return (
        <line
          key={line.id}
          x1={startCanvas.x}
          y1={startCanvas.y}
          x2={endCanvas.x}
          y2={endCanvas.y}
          stroke={getLineColor(line)}
          strokeWidth={3}
          strokeDasharray={line.isSunny ? "none" : "5,5"}
        />
      );
    });
  };

  const renderPreviewLine = () => {
    if (!isDrawing || !startPoint || !hoverPoint) return null;
    
    const extendedLine = extendLineToBoundaries(startPoint, hoverPoint);
    const startCanvas = gridToCanvas(extendedLine.start.x, extendedLine.start.y);
    const endCanvas = gridToCanvas(extendedLine.end.x, extendedLine.end.y);
    
    const isSunny = isSunnyLine(extendedLine.start, extendedLine.end);
    
    return (
      <line
        x1={startCanvas.x}
        y1={startCanvas.y}
        x2={endCanvas.x}
        y2={endCanvas.y}
        stroke={isSunny ? '#10b981' : '#ef4444'}
        strokeWidth={2}
        strokeDasharray="10,5"
        opacity={0.7}
      />
    );
  };

  const countSunnyLines = () => lines.filter(line => line.isSunny).length;
  const countNonSunnyLines = () => lines.filter(line => !line.isSunny).length;

  const allTrianglePointsCovered = () => {
    // Check only integer lattice points where a + b <= n + 1
    for (let a = 1; a <= n; a++) {
      for (let b = 1; b <= n; b++) {
        if (a + b <= n + 1 && !isPointCovered(a, b)) {
          return false;
        }
      }
    }
    return true;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Sunny Lines Puzzle
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Based on IMO 2025 Problem P1. The original problem was to determine all nonnegative integers k such that there exist n distinct lines in the plane satisfying both of the following: for all positive integers a and b with a + b ≤ n + 1, the point (a, b) lies on at least one of the lines; and exactly k of the n lines are sunny.
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              Place lines to cover all blue dots in the triangle where a + b ≤ n + 1. <br />
              A line is "sunny" if it's not parallel to the x-axis, y-axis, or x + y = 0.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 items-center">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">n = {n}</label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">3</span>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={n}
                    onChange={(e) => {
                      setN(parseInt(e.target.value));
                      resetPuzzle();
                    }}
                    className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">10</span>
                </div>
              </div>
              
              <Button onClick={resetPuzzle} variant="outline" size="sm">
                Reset Puzzle
              </Button>

              <Button 
                onClick={undoLastLine} 
                variant="outline" 
                size="sm"
                disabled={lines.length === 0}
              >
                <Undo2 className="w-4 h-4 mr-1" />
                Undo
              </Button>
            </div>

            <div className="flex justify-center items-center gap-4">
              <Badge variant="outline" className="text-sm">
                Lines: {lines.length}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Sunny: {countSunnyLines()}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Non-sunny: {countNonSunnyLines()}
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
                <li>Click anywhere to start drawing a line</li>
                <li>Click again to complete the line</li>
                <li>Cover all blue dots in the triangle (a + b ≤ n + 1)</li>
                <li>Green lines are "sunny" (not parallel to x-axis, y-axis, or x + y = 0)</li>
                <li>Red dashed lines are non-sunny</li>
                <li>Try to minimize the number of lines used</li>
              </ul>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>Legend: Blue dots = Points to cover, Green dots = Covered points, Green lines = Sunny, Red dashed = Non-sunny</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div 
              ref={canvasRef}
              className="relative border-2 border-gray-400 cursor-crosshair"
              style={{ width: canvasSize, height: canvasSize }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
            >
              <svg
                width={canvasSize}
                height={canvasSize}
                className="absolute inset-0"
              >
                {renderLines()}
                {renderPreviewLine()}
                {renderTriangle()}
                {renderCoveredPoints()}
              </svg>
              {renderGrid()}
              
              {/* Coordinate labels */}
              <div className="absolute bottom-0 left-0 text-xs text-gray-600">
                (0,0)
              </div>
              <div className="absolute top-0 right-0 text-xs text-gray-600">
                ({gridSize},{gridSize})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculate Results */}
      <div className="flex justify-center">
        <Button 
          onClick={calculateResults} 
          disabled={lines.length === 0}
          size="lg"
          className="px-8"
        >
          Calculate Results
        </Button>
      </div>

      {/* Results */}
      {showResults && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">
                    Results for n = {n}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    k = {countSunnyLines()} (number of sunny lines)
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-800">Coverage Status:</p>
                  <p className="text-sm text-blue-700">
                    {allTrianglePointsCovered() ? 
                      "✅ All triangle points are covered" : 
                      "❌ Some triangle points are not covered"
                    }
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-800">Line Summary:</p>
                  <p className="text-sm text-blue-700">
                    Total: {lines.length} | Sunny: {countSunnyLines()} | Non-sunny: {countNonSunnyLines()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line List */}
      {lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Placed Lines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lines.map((line, index) => (
                <div key={line.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Line {index + 1}:</span>
                    <br />
                    <span className="text-muted-foreground">
                      ({line.start.x.toFixed(1)}, {line.start.y.toFixed(1)}) to ({line.end.x.toFixed(1)}, {line.end.y.toFixed(1)})
                    </span>
                    <br />
                    <span className={`text-xs ${line.isSunny ? 'text-green-600' : 'text-red-600'}`}>
                      {line.isSunny ? '☀️ Sunny' : '🌧️ Non-sunny'}
                    </span>
                  </div>
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

export default SunnyLinesPuzzle; 