import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Settings, Play } from 'lucide-react';
interface CrapsGameProps {
}
const getDiceIcon = (value: number) => {
  switch (value) {
    case 1:
      return <Dice1 className="w-12 h-12" />;
    case 2:
      return <Dice2 className="w-12 h-12" />;
    case 3:
      return <Dice3 className="w-12 h-12" />;
    case 4:
      return <Dice4 className="w-12 h-12" />;
    case 5:
      return <Dice5 className="w-12 h-12" />;
    case 6:
      return <Dice6 className="w-12 h-12" />;
    default:
      return <Dice1 className="w-12 h-12" />;
  }
};
const CrapsGame: React.FC<CrapsGameProps> = () => {
  const [dice1, setDice1] = useState<number | null>(null);
  const [dice2, setDice2] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | 'continue' | null>(null);
  const [rollCount, setRollCount] = useState(0);

  // Custom rules state
  const [customWinSums, setCustomWinSums] = useState<number[]>([7, 11]);
  const [customLoseSums, setCustomLoseSums] = useState<number[]>([2, 3, 12]);
  const [isCustomRules, setIsCustomRules] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Simulation state
  const [simulationRounds, setSimulationRounds] = useState([10]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [slowMode, setSlowMode] = useState(false);
  const [currentSimulationGame, setCurrentSimulationGame] = useState(0);
  const [simulationResults, setSimulationResults] = useState<{
    wins: number;
    losses: number;
    averageTurns: number;
    totalGames: number;
  } | null>(null);
  const [liveSimulationStats, setLiveSimulationStats] = useState<{
    wins: number;
    losses: number;
    totalTurns: number;
    completedGames: number;
  } | null>(null);
  const rollDice = () => {
    setIsRolling(true);
    setGameResult(null);

    // Simulate rolling animation
    setTimeout(() => {
      const newDice1 = Math.floor(Math.random() * 6) + 1;
      const newDice2 = Math.floor(Math.random() * 6) + 1;
      const sum = newDice1 + newDice2;
      setDice1(newDice1);
      setDice2(newDice2);
      setRollCount(prev => prev + 1);

      // Determine game result based on current rules
      const winSums = isCustomRules ? customWinSums : [7, 11];
      const loseSums = isCustomRules ? customLoseSums : [2, 3, 12];
      if (loseSums.includes(sum)) {
        setGameResult('lose');
      } else if (winSums.includes(sum)) {
        setGameResult('win');
      } else {
        setGameResult('continue');
      }
      setIsRolling(false);
    }, 1000);
  };
  const simulateGame = () => {
    const winSums = isCustomRules ? customWinSums : [7, 11];
    const loseSums = isCustomRules ? customLoseSums : [2, 3, 12];
    let turns = 1;
    let point: number | null = null;
    while (true) {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const sum = die1 + die2;
      if (point === null) {
        // First roll (come out roll)
        if (loseSums.includes(sum)) {
          return {
            result: 'lose',
            turns,
            die1,
            die2,
            sum
          };
        } else if (winSums.includes(sum)) {
          return {
            result: 'win',
            turns,
            die1,
            die2,
            sum
          };
        } else {
          point = sum;
          turns++;
        }
      } else {
        // Subsequent rolls
        if (sum === point) {
          return {
            result: 'win',
            turns,
            die1,
            die2,
            sum
          };
        } else if (sum === 7) {
          return {
            result: 'lose',
            turns,
            die1,
            die2,
            sum
          };
        } else {
          turns++;
        }
      }
    }
  };
  const simulateGameSlow = async (gameNumber: number) => {
    const winSums = isCustomRules ? customWinSums : [7, 11];
    const loseSums = isCustomRules ? customLoseSums : [2, 3, 12];
    let turns = 1;
    let point: number | null = null;
    while (true) {
      // Show rolling animation
      setIsRolling(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const sum = die1 + die2;

      // Update dice display
      setDice1(die1);
      setDice2(die2);
      setIsRolling(false);

      // Wait to show the result
      await new Promise(resolve => setTimeout(resolve, 800));
      if (point === null) {
        // First roll (come out roll)
        if (loseSums.includes(sum)) {
          setGameResult('lose');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return {
            result: 'lose',
            turns
          };
        } else if (winSums.includes(sum)) {
          setGameResult('win');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return {
            result: 'win',
            turns
          };
        } else {
          setGameResult('continue');
          point = sum;
          turns++;
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } else {
        // Subsequent rolls
        if (sum === point) {
          setGameResult('win');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return {
            result: 'win',
            turns
          };
        } else if (sum === 7) {
          setGameResult('lose');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return {
            result: 'lose',
            turns
          };
        } else {
          setGameResult('continue');
          turns++;
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
    }
  };
  const runSimulation = async () => {
    setIsSimulating(true);
    setCurrentSimulationGame(0);
    setLiveSimulationStats(null);
    const numGames = simulationRounds[0];
    let wins = 0;
    let losses = 0;
    let totalTurns = 0;
    if (slowMode) {
      // Initialize live stats for slow mode
      setLiveSimulationStats({
        wins: 0,
        losses: 0,
        totalTurns: 0,
        completedGames: 0
      });

      // Slow mode: simulate visually
      for (let i = 0; i < numGames; i++) {
        setCurrentSimulationGame(i + 1);
        setGameResult(null);
        const game = await simulateGameSlow(i + 1);
        if (game.result === 'win') wins++;else losses++;
        totalTurns += game.turns;

        // Update live stats
        setLiveSimulationStats({
          wins,
          losses,
          totalTurns,
          completedGames: i + 1
        });

        // Brief pause between games
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      // Fast mode: simulate in background
      for (let i = 0; i < numGames; i++) {
        const game = simulateGame();
        if (game.result === 'win') wins++;else losses++;
        totalTurns += game.turns;

        // Add a small delay every 10 games to show progress
        if (i % 10 === 0) {
          setCurrentSimulationGame(i + 1);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    setSimulationResults({
      wins,
      losses,
      averageTurns: totalTurns / numGames,
      totalGames: numGames
    });
    setCurrentSimulationGame(0);
    setLiveSimulationStats(null);
    setIsSimulating(false);
  };
  const resetGame = () => {
    setDice1(null);
    setDice2(null);
    setGameResult(null);
    setSimulationResults(null);
  };
  const sum = dice1 && dice2 ? dice1 + dice2 : null;
  const getResultMessage = () => {
    if (!gameResult) return null;
    switch (gameResult) {
      case 'win':
        return <div className="text-center space-y-2">
            <Badge variant="default" className="bg-green-600 text-white text-lg px-4 py-2">
              🎉 You Win! 🎉
            </Badge>
            <p className="text-sm text-muted-foreground">
              Rolling {sum} on the first throw wins immediately!
            </p>
          </div>;
      case 'lose':
        return <div className="text-center space-y-2">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              💸 You Lose! 💸
            </Badge>
            <p className="text-sm text-muted-foreground">
              Rolling {sum} on the first throw loses immediately!
            </p>
          </div>;
      case 'continue':
        return <div className="text-center space-y-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              🎲 Game Continues 🎲
            </Badge>
            <p className="text-sm text-muted-foreground">
              Your point is {sum}. Keep playing to win or lose!
            </p>
          </div>;
      default:
        return null;
    }
  };
  return <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground">Craps: An Exploration</CardTitle>
          <CardDescription className="text-lg">In the game of Craps, we roll two dice, and note the sum S. In the traditional game, if S is 2, 3, or 12, you lose immediately; if the S is 7 or 11, you win immediately, and the game continues otherwise.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-base text-center text-muted-foreground">
            On this page, you can: (a) play the classic game; (b) make your own win/lose conditions and play; (c) simulate the game over a number of rounds to note win/loss statistics and the average game duration. <br /><br />Note that the traditional game of craps continues with different rules after the first throw. Here we just roll until termination with respect to the original conditions.
          </p>
          {/* Simulation Controls */}
          <Card className="bg-accent/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Simulation</CardTitle>
                <CardDescription>
                  Run multiple games to analyze win/loss statistics
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="slow-mode" className="text-sm font-medium">Slow Mode</label>
                <Switch id="slow-mode" checked={slowMode} onCheckedChange={setSlowMode} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of games: {simulationRounds[0]}</label>
                <Slider value={simulationRounds} onValueChange={setSimulationRounds} max={25} min={1} step={1} className="w-full" />
              </div>
              <Button onClick={runSimulation} disabled={isSimulating} className="w-full gap-2">
                <Play className="w-4 h-4" />
                {isSimulating ? slowMode ? `Simulating Game ${currentSimulationGame}/${simulationRounds[0]}...` : 'Simulating...' : 'Simulate'}
              </Button>
              
              {(simulationResults || liveSimulationStats) && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {liveSimulationStats ? liveSimulationStats.wins : simulationResults!.wins}
                    </div>
                    <div className="text-sm text-muted-foreground">Wins</div>
                    <div className="text-xs">
                      {liveSimulationStats ? `(${(liveSimulationStats.wins / Math.max(liveSimulationStats.completedGames, 1) * 100).toFixed(1)}%)` : `(${(simulationResults!.wins / simulationResults!.totalGames * 100).toFixed(1)}%)`}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {liveSimulationStats ? liveSimulationStats.losses : simulationResults!.losses}
                    </div>
                    <div className="text-sm text-muted-foreground">Losses</div>
                    <div className="text-xs">
                      {liveSimulationStats ? `(${(liveSimulationStats.losses / Math.max(liveSimulationStats.completedGames, 1) * 100).toFixed(1)}%)` : `(${(simulationResults!.losses / simulationResults!.totalGames * 100).toFixed(1)}%)`}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {liveSimulationStats ? (liveSimulationStats.totalTurns / Math.max(liveSimulationStats.completedGames, 1)).toFixed(1) : simulationResults!.averageTurns.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Turns</div>
                    <div className="text-xs">
                      {liveSimulationStats ? `(${liveSimulationStats.completedGames} games)` : 'per game'}
                    </div>
                  </div>
                </div>}
            </CardContent>
          </Card>

          {/* Rules */}
          <Card className="bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">
                {isCustomRules ? 'Custom Rules' : 'Classic Rules'}
              </CardTitle>
              <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Make Your Own Rules
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Customize Craps Rules</DialogTitle>
                    <DialogDescription>
                      Select which dice sums result in immediate wins or losses on the first throw.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-6 py-6">
                    <div>
                      <h3 className="font-semibold mb-4 text-red-600">Loss Sums</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({
                        length: 11
                      }, (_, i) => i + 2).map(sum => <div key={`loss-${sum}`} className="flex items-center space-x-2">
                            <Checkbox id={`loss-${sum}`} checked={customLoseSums.includes(sum)} onCheckedChange={checked => {
                          if (checked) {
                            setCustomLoseSums([...customLoseSums.filter(s => s !== sum), sum]);
                            setCustomWinSums(customWinSums.filter(s => s !== sum));
                          } else {
                            setCustomLoseSums(customLoseSums.filter(s => s !== sum));
                          }
                        }} />
                            <label htmlFor={`loss-${sum}`} className="text-sm">{sum}</label>
                          </div>)}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-4 text-green-600">Win Sums</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({
                        length: 11
                      }, (_, i) => i + 2).map(sum => <div key={`win-${sum}`} className="flex items-center space-x-2">
                            <Checkbox id={`win-${sum}`} checked={customWinSums.includes(sum)} onCheckedChange={checked => {
                          if (checked) {
                            setCustomWinSums([...customWinSums.filter(s => s !== sum), sum]);
                            setCustomLoseSums(customLoseSums.filter(s => s !== sum));
                          } else {
                            setCustomWinSums(customWinSums.filter(s => s !== sum));
                          }
                        }} />
                            <label htmlFor={`win-${sum}`} className="text-sm">{sum}</label>
                          </div>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between gap-4">
                    <Button variant="outline" onClick={() => {
                    setCustomWinSums([7, 11]);
                    setCustomLoseSums([2, 3, 12]);
                    setIsCustomRules(false);
                  }}>
                      Reset to Classic
                    </Button>
                    <Button onClick={() => {
                    setIsCustomRules(true);
                    setIsRulesModalOpen(false);
                    resetGame();
                  }}>
                      Apply Custom Rules
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <Badge variant="destructive" className="mb-2">Immediate Loss</Badge>
                  <p>{isCustomRules ? customLoseSums.length > 0 ? customLoseSums.join(', ') : 'None' : 'Rolling 2, 3, or 12'}</p>
                </div>
                <div className="text-center">
                  <Badge variant="default" className="mb-2 bg-green-600">Immediate Win</Badge>
                  <p>{isCustomRules ? customWinSums.length > 0 ? customWinSums.join(', ') : 'None' : 'Rolling 7 or 11'}</p>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">Game Continues</Badge>
                  <p>All other sums</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dice Display */}
          <div className="flex justify-center items-center gap-8">
            <div className="text-center space-y-2">
              <div className={`p-4 rounded-lg border-2 ${isRolling ? 'animate-spin' : ''} ${dice1 ? 'border-primary' : 'border-muted'}`}>
                {dice1 ? getDiceIcon(dice1) : <div className="w-12 h-12 bg-muted rounded border-2 border-dashed"></div>}
              </div>
              <p className="text-sm text-muted-foreground">Die 1</p>
              {dice1 && <p className="font-bold text-lg">{dice1}</p>}
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold">+</div>
            </div>

            <div className="text-center space-y-2">
              <div className={`p-4 rounded-lg border-2 ${isRolling ? 'animate-spin' : ''} ${dice2 ? 'border-primary' : 'border-muted'}`}>
                {dice2 ? getDiceIcon(dice2) : <div className="w-12 h-12 bg-muted rounded border-2 border-dashed"></div>}
              </div>
              <p className="text-sm text-muted-foreground">Die 2</p>
              {dice2 && <p className="font-bold text-lg">{dice2}</p>}
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold">=</div>
            </div>

            <div className="text-center space-y-2">
              <div className={`p-4 rounded-lg border-2 min-w-[80px] ${sum ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                {sum ? <div className="text-3xl font-bold text-primary">{sum}</div> : <div className="w-12 h-12 bg-muted rounded border-2 border-dashed mx-auto"></div>}
              </div>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Result */}
          {getResultMessage()}

          {/* Statistics */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Rolls: {rollCount}</p>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button onClick={rollDice} disabled={isRolling || gameResult === 'win' || gameResult === 'lose'} className="px-8 py-3 text-lg">
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </Button>
            <Button variant="outline" onClick={resetGame} className="px-8 py-3">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Educational Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">About Craps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Craps is a classic casino dice game that demonstrates interesting probability concepts. 
            The first throw (called the "come out roll") immediately determines the outcome in certain cases:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Losing Numbers (Craps)</h4>
              <ul className="space-y-1">
                <li>• 2 (Snake Eyes): 1/36 probability</li>
                <li>• 3: 2/36 probability</li>
                <li>• 12 (Boxcars): 1/36 probability</li>
                <li><strong>Total losing probability: 4/36 = 11.1%</strong></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Winning Numbers (Natural)</h4>
              <ul className="space-y-1">
                <li>• 7: 6/36 probability</li>
                <li>• 11: 2/36 probability</li>
                <li><strong>Total winning probability: 8/36 = 22.2%</strong></li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            If you roll 4, 5, 6, 8, 9, or 10, that becomes your "point" and the game continues with different rules.
          </p>
        </CardContent>
      </Card>


    </div>;
};
export default CrapsGame;