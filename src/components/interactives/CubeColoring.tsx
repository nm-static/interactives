import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Box, RotateCw, ArrowRightLeft } from 'lucide-react';
import * as THREE from 'three';

interface CubeColoringProps {
  shareUrl?: string;
}

const colorPalette = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#a855f7', // purple
];

// Face indices: 0=top, 1=bottom, 2=front, 3=back, 4=right, 5=left
const faceNames = ['Top', 'Bottom', 'Front', 'Back', 'Right', 'Left'];

// Rotation definitions: each rotation maps face indices [0,1,2,3,4,5] to new positions
// Also includes actual 3D rotation values for visualization
const rotations = [
  { name: 'Identity', permutation: [0, 1, 2, 3, 4, 5], description: 'No rotation', rotation: [0, 0, 0] },
  { name: 'Y-90° (vertical)', permutation: [0, 1, 4, 5, 3, 2], description: 'Front→Right→Back→Left', rotation: [0, Math.PI / 2, 0] },
  { name: 'Y-180°', permutation: [0, 1, 3, 2, 5, 4], description: 'Front↔Back, Right↔Left', rotation: [0, Math.PI, 0] },
  { name: 'Y-270°', permutation: [0, 1, 5, 4, 2, 3], description: 'Front→Left→Back→Right', rotation: [0, -Math.PI / 2, 0] },
  { name: 'X-90° (horizontal)', permutation: [2, 3, 1, 0, 4, 5], description: 'Top→Front→Bottom→Back', rotation: [Math.PI / 2, 0, 0] },
  { name: 'X-180°', permutation: [1, 0, 3, 2, 4, 5], description: 'Top↔Bottom, Front↔Back', rotation: [Math.PI, 0, 0] },
  { name: 'X-270°', permutation: [3, 2, 0, 1, 4, 5], description: 'Top→Back→Bottom→Front', rotation: [-Math.PI / 2, 0, 0] },
  { name: 'Z-90° (front-back)', permutation: [4, 5, 2, 3, 1, 0], description: 'Top→Right→Bottom→Left', rotation: [0, 0, Math.PI / 2] },
  { name: 'Z-180°', permutation: [1, 0, 2, 3, 5, 4], description: 'Top↔Bottom, Right↔Left', rotation: [0, 0, Math.PI] },
  { name: 'Z-270°', permutation: [5, 4, 2, 3, 0, 1], description: 'Top→Left→Bottom→Right', rotation: [0, 0, -Math.PI / 2] },
];

interface PaintableCubeProps {
  colors: string[];
  onFaceClick: (faceIndex: number) => void;
}

function PaintableCube({ colors, onFaceClick }: PaintableCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      {colors.map((color, i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} color={color} />
      ))}
    </mesh>
  );
}

function RotatedCube({ colors, rotation }: { colors: string[], rotation: number[] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} rotation={rotation as [number, number, number]}>
      <boxGeometry args={[2, 2, 2]} />
      {colors.map((color, i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} color={color} />
      ))}
    </mesh>
  );
}

const CubeColoring = ({ shareUrl }: CubeColoringProps) => {
  const [faceColors, setFaceColors] = useState<string[]>(Array(6).fill(colorPalette[0]));
  const [selectedColor, setSelectedColor] = useState(colorPalette[0]);
  const [selectedPermutation, setSelectedPermutation] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [selectedRotation, setSelectedRotation] = useState(0);

  const handleFaceClick = (faceIndex: number) => {
    const newColors = [...faceColors];
    newColors[faceIndex] = selectedColor;
    setFaceColors(newColors);
  };

  const handlePermutationChange = (position: number, value: string) => {
    const newPerm = [...selectedPermutation];
    newPerm[position] = parseInt(value);
    setSelectedPermutation(newPerm);
  };

  const permutationToRotation = () => {
    const match = rotations.findIndex(r => 
      r.permutation.every((val, idx) => val === selectedPermutation[idx])
    );
    return match >= 0 ? rotations[match] : null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-6 h-6" />
            Burnside's Lemma: Cube Coloring
          </CardTitle>
          <CardDescription>
            How many distinct cubes can you make by painting each face in one of 5 colors?
            Two cubes are the same if one can be rotated to look like the other.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 3D Cube Arena */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Paint Your Cube</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-[300px] border border-border rounded-lg bg-muted/20">
                <Canvas camera={{ position: [4, 4, 4] }}>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <PaintableCube colors={faceColors} onFaceClick={handleFaceClick} />
                  <OrbitControls enableZoom={true} />
                </Canvas>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Color</label>
                  <div className="flex gap-2">
                    {colorPalette.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          selectedColor === color ? 'border-foreground scale-110' : 'border-border'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Face Colors</label>
                  <div className="grid grid-cols-2 gap-2">
                    {faceNames.map((name, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: faceColors[idx] }}
                        />
                        <span className="text-sm">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permutation to Rotation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Permutation → Rotation
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Pick a Permutation</CardTitle>
                  <CardDescription className="text-xs">
                    Choose where each face (0-5) goes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedPermutation.map((value, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Badge variant="outline" className="w-20">
                        Face {idx}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Select
                        value={value.toString()}
                        onValueChange={(v) => handlePermutationChange(idx, v)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">({faceNames[idx]})</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Corresponding Rotation</CardTitle>
                  <CardDescription className="text-xs">
                    Visualize the rotation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {permutationToRotation() ? (
                    <>
                      <div className="text-center space-y-2">
                        <Badge className="text-lg px-4 py-2">
                          {permutationToRotation()!.name}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {permutationToRotation()!.description}
                        </p>
                      </div>
                      <div className="h-[200px] border border-border rounded-lg bg-background/50">
                        <Canvas camera={{ position: [4, 4, 4] }}>
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[10, 10, 5]} intensity={1} />
                          <RotatedCube 
                            colors={faceColors} 
                            rotation={permutationToRotation()!.rotation} 
                          />
                          <OrbitControls enableZoom={true} />
                        </Canvas>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Invalid permutation</p>
                      <p className="text-xs mt-1">Each number 0-5 must appear exactly once</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Rotation to Permutation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <RotateCw className="w-5 h-5" />
              Rotation → Permutation
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Corresponding Permutation</CardTitle>
                  <CardDescription className="text-xs">
                    How faces move with this rotation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rotations[selectedRotation].permutation.map((target, source) => (
                    <div key={source} className="flex items-center gap-3">
                      <Badge variant="outline" className="w-20">
                        Face {source}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge className="w-20">Face {target}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {faceNames[source]} → {faceNames[target]}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">Pick a Rotation</CardTitle>
                  <CardDescription className="text-xs">
                    Select a cube rotation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedRotation.toString()}
                    onValueChange={(v) => setSelectedRotation(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rotations.map((rot, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {rot.name} - {rot.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="h-[200px] border border-border rounded-lg bg-background/50">
                    <Canvas camera={{ position: [4, 4, 4] }}>
                      <ambientLight intensity={0.5} />
                      <directionalLight position={[10, 10, 5]} intensity={1} />
                      <RotatedCube 
                        colors={faceColors} 
                        rotation={rotations[selectedRotation].rotation} 
                      />
                      <OrbitControls enableZoom={true} />
                    </Canvas>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CubeColoring;
