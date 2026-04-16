import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { RotateCw, Palette } from 'lucide-react';

interface BurnsidesLemmaProps {
  shareUrl?: string;
}

interface Necklace {
  colors: number[];
  id: string;
}

const BurnsidesLemma = ({ shareUrl }: BurnsidesLemmaProps) => {
  const [numBeads, setNumBeads] = useState(6);
  const [numColors, setNumColors] = useState(3);
  const [allNecklaces, setAllNecklaces] = useState<Necklace[]>([]);
  const [equivalenceClasses, setEquivalenceClasses] = useState<Necklace[][]>([]);
  const [showFormula, setShowFormula] = useState(false);

  const colorPalette = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(220, 90%, 56%)',
    'hsl(142, 76%, 36%)',
    'hsl(38, 92%, 50%)',
    'hsl(280, 70%, 60%)',
  ];

  // Generate all possible colorings
  const generateAllColorings = (beads: number, colors: number): Necklace[] => {
    const total = Math.pow(colors, beads);
    const necklaces: Necklace[] = [];
    
    for (let i = 0; i < total; i++) {
      const coloring: number[] = [];
      let num = i;
      for (let j = 0; j < beads; j++) {
        coloring.push(num % colors);
        num = Math.floor(num / colors);
      }
      necklaces.push({
        colors: coloring,
        id: coloring.join(',')
      });
    }
    
    return necklaces;
  };

  // Rotate a necklace by k positions
  const rotate = (colors: number[], k: number): number[] => {
    const n = colors.length;
    const rotated = [...colors];
    return rotated.slice(k % n).concat(rotated.slice(0, k % n));
  };

  // Get canonical form (lexicographically smallest rotation)
  const getCanonical = (colors: number[]): string => {
    const n = colors.length;
    let minRotation = colors;
    
    for (let i = 1; i < n; i++) {
      const rotated = rotate(colors, i);
      if (rotated.join(',') < minRotation.join(',')) {
        minRotation = rotated;
      }
    }
    
    return minRotation.join(',');
  };

  // Group necklaces into equivalence classes
  const groupByEquivalence = (necklaces: Necklace[]): Necklace[][] => {
    const canonicalMap = new Map<string, Necklace[]>();
    
    for (const necklace of necklaces) {
      const canonical = getCanonical(necklace.colors);
      if (!canonicalMap.has(canonical)) {
        canonicalMap.set(canonical, []);
      }
      canonicalMap.get(canonical)!.push(necklace);
    }
    
    return Array.from(canonicalMap.values());
  };

  // Calculate using Burnside's Lemma
  const calculateBurnsideLemma = (): number => {
    let sum = 0;
    const n = numBeads;
    const k = numColors;
    
    // For each rotation (including identity)
    for (let r = 0; r < n; r++) {
      // Count colorings fixed by this rotation
      const gcd = getGCD(n, r);
      sum += Math.pow(k, gcd);
    }
    
    return sum / n;
  };

  const getGCD = (a: number, b: number): number => {
    return b === 0 ? a : getGCD(b, a % b);
  };

  useEffect(() => {
    const necklaces = generateAllColorings(numBeads, numColors);
    setAllNecklaces(necklaces);
    const classes = groupByEquivalence(necklaces);
    setEquivalenceClasses(classes);
  }, [numBeads, numColors]);

  const renderNecklace = (necklace: Necklace, size: 'small' | 'medium' = 'medium') => {
    const radius = size === 'small' ? 30 : 50;
    const beadRadius = size === 'small' ? 8 : 12;
    const svgSize = size === 'small' ? 80 : 130;
    const center = svgSize / 2;
    
    return (
      <svg width={svgSize} height={svgSize} className="mx-auto">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        {necklace.colors.map((color, i) => {
          const angle = (2 * Math.PI * i) / necklace.colors.length - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={beadRadius}
                fill={colorPalette[color]}
                stroke="hsl(var(--foreground))"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  const burnsideResult = calculateBurnsideLemma();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw className="w-6 h-6" />
            Burnside's Lemma: Necklace Colorings
          </CardTitle>
          <CardDescription>
            How many distinct necklaces can you make with {numBeads} beads using {numColors} colors?
            Two necklaces are the same if one can be rotated to look like the other.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Number of Beads</label>
                <Badge variant="secondary">{numBeads}</Badge>
              </div>
              <Slider
                value={[numBeads]}
                onValueChange={(value) => setNumBeads(value[0])}
                min={3}
                max={8}
                step={1}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Number of Colors
                </label>
                <Badge variant="secondary">{numColors}</Badge>
              </div>
              <Slider
                value={[numColors]}
                onValueChange={(value) => setNumColors(value[0])}
                min={2}
                max={4}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-surface/50">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">{allNecklaces.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Colorings</div>
                <div className="text-xs text-muted-foreground mt-1">({numColors}^{numBeads})</div>
              </CardContent>
            </Card>
            
            <Card className="bg-surface/50">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-accent">{equivalenceClasses.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Distinct Necklaces</div>
                <div className="text-xs text-muted-foreground mt-1">(under rotation)</div>
              </CardContent>
            </Card>
            
            <Card className="bg-surface/50">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-foreground">{burnsideResult}</div>
                <div className="text-sm text-muted-foreground mt-1">Burnside's Formula</div>
                <div className="text-xs text-muted-foreground mt-1">matches exactly!</div>
              </CardContent>
            </Card>
          </div>

          {/* Formula Explanation */}
          <div className="space-y-3">
            <Button
              onClick={() => setShowFormula(!showFormula)}
              variant="outline"
              className="w-full"
            >
              {showFormula ? 'Hide' : 'Show'} Burnside's Lemma Formula
            </Button>
            
            {showFormula && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Burnside's Lemma</h4>
                    <p className="text-sm text-muted-foreground">
                      The number of distinct objects under group action equals the average number of objects fixed by each symmetry.
                    </p>
                  </div>
                  
                  <div className="bg-background p-4 rounded-lg space-y-3">
                    <div className="text-center font-mono text-sm">
                      |X/G| = (1/|G|) × Σ |Fix(g)|
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• |X/G| = number of distinct necklaces</div>
                      <div>• |G| = number of rotations = {numBeads}</div>
                      <div>• |Fix(g)| = colorings unchanged by rotation g</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">For rotation by k positions:</h4>
                    <p className="text-xs text-muted-foreground">
                      A coloring is fixed if beads repeat every gcd(n,k) positions.
                      Number of such colorings = {numColors}^gcd(n,k)
                    </p>
                  </div>

                  <div className="bg-background p-3 rounded-lg">
                    <div className="text-xs font-mono space-y-1">
                      {Array.from({ length: numBeads }, (_, i) => {
                        const gcd = getGCD(numBeads, i);
                        return (
                          <div key={i}>
                            Rotation by {i}: {numColors}^{gcd} = {Math.pow(numColors, gcd)} fixed colorings
                          </div>
                        );
                      })}
                      <div className="border-t border-border pt-1 mt-2">
                        Sum = {Array.from({ length: numBeads }, (_, i) => Math.pow(numColors, getGCD(numBeads, i))).reduce((a, b) => a + b, 0)}
                      </div>
                      <div className="font-semibold">
                        Result = {Array.from({ length: numBeads }, (_, i) => Math.pow(numColors, getGCD(numBeads, i))).reduce((a, b) => a + b, 0)} / {numBeads} = {burnsideResult}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Equivalence Classes Display */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                All {equivalenceClasses.length} Distinct Necklaces
              </h3>
              <p className="text-sm text-muted-foreground">
                Each card shows one representative from each equivalence class. 
                Necklaces in the same class can be rotated to match each other.
              </p>
            </div>

            {equivalenceClasses.length <= 20 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {equivalenceClasses.map((eqClass, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-2">
                      {renderNecklace(eqClass[0], 'medium')}
                      <div className="text-center mt-2">
                        <Badge variant="outline" className="text-xs">
                          Class {idx + 1}
                        </Badge>
                        {eqClass.length > 1 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {eqClass.length} rotations
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {equivalenceClasses.length > 20 && (
              <div className="text-center py-8 space-y-3">
                <p className="text-muted-foreground">
                  Too many distinct necklaces to display ({equivalenceClasses.length} total).
                </p>
                <p className="text-sm text-muted-foreground">
                  Try reducing the number of beads or colors to see all distinct necklaces.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BurnsidesLemma;
