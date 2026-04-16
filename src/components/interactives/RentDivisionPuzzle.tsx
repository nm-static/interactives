import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, User, UserRound, Users, UserCheck } from "lucide-react";

const AGENTS = ["Alice", "Bob", "Charlie", "Dana"];
const AGENT_ICONS = [User, UserRound, Users, UserCheck];
const ROOM_COLORS = [
  "hsl(142, 70%, 45%)", // green
  "hsl(0, 70%, 50%)",   // red
  "hsl(210, 70%, 50%)", // blue
  "hsl(45, 80%, 50%)",  // gold/yellow
];

interface RentDivisionPuzzleProps {
  onComplete?: (completed: boolean) => void;
}

const RentDivisionPuzzle = ({ onComplete }: RentDivisionPuzzleProps) => {
  // V-matrix: valuations[agent][room]
  const [valuations, setValuations] = useState<number[][]>(() =>
    Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => Math.floor(Math.random() * 10) + 1)
    )
  );

  // Total rent (controlled by slider)
  const [totalRent, setTotalRent] = useState(20);

  // Rents for each room
  const [rents, setRents] = useState<number[]>([5, 5, 5, 5]);

  // Allocation: assignment[agent] = room index (-1 = unassigned)
  const [assignment, setAssignment] = useState<number[]>([-1, -1, -1, -1]);

  const currentTotal = useMemo(() => rents.reduce((a, b) => a + b, 0), [rents]);
  const rentDiff = totalRent - currentTotal;

  // Compute U-matrix: utility[agent][room] = valuation - rent
  // Computed directly to ensure reactivity when rents change
  const utilities = valuations.map((agentVals) =>
    agentVals.map((v, roomIdx) => v - rents[roomIdx])
  );

  // Find envy relationships
  const envyInfo = useMemo(() => {
    const envies: { from: number; to: number; fromUtil: number; toUtil: number }[] = [];
    
    for (let i = 0; i < 4; i++) {
      if (assignment[i] === -1) continue;
      const myRoom = assignment[i];
      const myUtility = utilities[i][myRoom];

      for (let j = 0; j < 4; j++) {
        if (i === j || assignment[j] === -1) continue;
        const theirRoom = assignment[j];
        const theirRoomUtility = utilities[i][theirRoom];

        if (theirRoomUtility > myUtility) {
          envies.push({
            from: i,
            to: j,
            fromUtil: myUtility,
            toUtil: theirRoomUtility,
          });
        }
      }
    }
    return envies;
  }, [assignment, utilities]);

  const isEnvyFree = envyInfo.length === 0 && assignment.every((a) => a !== -1);
  const allAssigned = assignment.every((a) => a !== -1);

  const handleValuationChange = (agent: number, room: number, value: string) => {
    const num = parseInt(value) || 0;
    setValuations((prev) => {
      const next = prev.map((row) => [...row]);
      next[agent][room] = Math.max(0, Math.min(99, num));
      return next;
    });
  };

  const handleRentChange = (room: number, value: string) => {
    const num = parseInt(value) || 0;
    setRents((prev) => {
      const next = [...prev];
      next[room] = Math.max(0, Math.min(99, num));
      return next;
    });
  };

  const handleAssignmentChange = (agent: number, room: string) => {
    const roomIdx = room === "none" ? -1 : parseInt(room);
    setAssignment((prev) => {
      const next = [...prev];
      // If another agent has this room, unassign them
      if (roomIdx !== -1) {
        const existing = next.indexOf(roomIdx);
        if (existing !== -1 && existing !== agent) {
          next[existing] = -1;
        }
      }
      next[agent] = roomIdx;
      return next;
    });
  };

  const randomizeValuations = () => {
    setValuations(
      Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, () => Math.floor(Math.random() * 10) + 1)
      )
    );
  };

  const resetAll = () => {
    randomizeValuations();
    setTotalRent(20);
    setRents([5, 5, 5, 5]);
    setAssignment([-1, -1, -1, -1]);
  };

  const handleTotalRentChange = (value: number[]) => {
    const newTotal = value[0];
    setTotalRent(newTotal);
    // Distribute evenly
    const base = Math.floor(newTotal / 4);
    const remainder = newTotal % 4;
    setRents([
      base + (remainder > 0 ? 1 : 0),
      base + (remainder > 1 ? 1 : 0),
      base + (remainder > 2 ? 1 : 0),
      base,
    ]);
  };

  const getAgentColor = (agentIdx: number) => {
    const room = assignment[agentIdx];
    return room === -1 ? "hsl(0, 0%, 60%)" : ROOM_COLORS[room];
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={randomizeValuations}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Randomize Values
        </Button>
        <Button variant="outline" size="sm" onClick={resetAll}>
          Reset All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents & Rooms Visual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Agents & Rooms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Rent Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Rent</span>
                <span className="font-medium">${totalRent}</span>
              </div>
              <Slider
                value={[totalRent]}
                onValueChange={handleTotalRentChange}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              {rentDiff !== 0 && (
                <p className={`text-xs ${rentDiff > 0 ? 'text-amber-600' : 'text-destructive'}`}>
                  {rentDiff > 0 ? `+$${rentDiff} unallocated` : `-$${Math.abs(rentDiff)} over budget`}
                </p>
              )}
            </div>

            <div className="flex gap-6 justify-center pt-2">
              {/* Agents Column */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground text-center mb-2">
                  Agents
                </div>
                {AGENTS.map((name, idx) => {
                  const Icon = AGENT_ICONS[idx];
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span 
                        className="text-xs font-medium w-14 text-right"
                        style={{ color: getAgentColor(idx) }}
                      >
                        {name}
                      </span>
                      <div
                        className="w-10 h-10 rounded-lg border-2 flex items-center justify-center"
                        style={{
                          borderColor: getAgentColor(idx),
                          backgroundColor: `${getAgentColor(idx)}20`,
                        }}
                      >
                        <Icon 
                          className="w-5 h-5" 
                          style={{ color: getAgentColor(idx) }}
                        />
                      </div>
                      <Select
                        value={assignment[idx] === -1 ? "none" : String(assignment[idx])}
                        onValueChange={(v) => handleAssignmentChange(idx, v)}
                      >
                        <SelectTrigger className="w-20 h-8 text-xs">
                          <SelectValue placeholder="Room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {[0, 1, 2, 3].map((r) => (
                            <SelectItem key={r} value={String(r)}>
                              R{r + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>

              {/* Rooms Column */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground text-center mb-2">
                  Rooms
                </div>
                {[0, 1, 2, 3].map((roomIdx) => (
                  <div key={roomIdx} className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold"
                      style={{
                        borderColor: ROOM_COLORS[roomIdx],
                        backgroundColor: `${ROOM_COLORS[roomIdx]}30`,
                      }}
                    >
                      R{roomIdx + 1}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={rents[roomIdx]}
                        onChange={(e) => handleRentChange(roomIdx, e.target.value)}
                        className="w-12 h-8 text-xs text-center"
                        min={0}
                        max={99}
                      />
                    </div>
                  </div>
                ))}
                <div className="text-sm font-medium pt-2 border-t">
                  Sum: ${currentTotal}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* V-Matrix (Valuations) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              V-Matrix <span className="text-sm font-normal text-muted-foreground">(Valuations)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-1"></th>
                    {[1, 2, 3, 4].map((r) => (
                      <th
                        key={r}
                        className="p-1 text-center font-medium"
                        style={{ color: ROOM_COLORS[r - 1] }}
                      >
                        R{r}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AGENTS.map((name, agentIdx) => (
                    <tr key={agentIdx}>
                      <td
                        className="p-1 font-medium text-xs"
                        style={{ color: getAgentColor(agentIdx) }}
                      >
                        {name}
                      </td>
                      {[0, 1, 2, 3].map((roomIdx) => {
                        const isAssigned = assignment[agentIdx] === roomIdx;
                        return (
                          <td key={roomIdx} className="p-1">
                            <Input
                              type="number"
                              value={valuations[agentIdx][roomIdx]}
                              onChange={(e) =>
                                handleValuationChange(agentIdx, roomIdx, e.target.value)
                              }
                              className={`w-12 h-8 text-xs text-center ${
                                isAssigned ? "ring-2 ring-primary bg-primary/10" : ""
                              }`}
                              min={0}
                              max={99}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              v<sub>ij</sub> = Agent i's value for Room j
            </p>
          </CardContent>
        </Card>

        {/* U-Matrix (Utilities) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              U-Matrix <span className="text-sm font-normal text-muted-foreground">(Utilities)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-1"></th>
                    {[1, 2, 3, 4].map((r) => (
                      <th
                        key={r}
                        className="p-1 text-center font-medium"
                        style={{ color: ROOM_COLORS[r - 1] }}
                      >
                        R{r}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AGENTS.map((name, agentIdx) => (
                    <tr key={agentIdx}>
                      <td
                        className="p-1 font-medium text-xs"
                        style={{ color: getAgentColor(agentIdx) }}
                      >
                        {name}
                      </td>
                      {[0, 1, 2, 3].map((roomIdx) => {
                        const util = utilities[agentIdx][roomIdx];
                        const isAssigned = assignment[agentIdx] === roomIdx;
                        const isEnvied = envyInfo.some(
                          (e) => e.from === agentIdx && assignment[e.to] === roomIdx
                        );
                        return (
                          <td key={roomIdx} className="p-1">
                            <div
                              className={`w-12 h-8 flex items-center justify-center text-xs font-mono rounded border ${
                                isAssigned
                                  ? "bg-primary/20 border-primary font-bold"
                                  : isEnvied
                                  ? "bg-destructive/20 border-destructive text-destructive"
                                  : "bg-muted/50 border-border"
                              }`}
                            >
                              {util}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              u<sub>ij</sub> = v<sub>ij</sub> − r<sub>j</sub>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status / Envy Display */}
      <Card className={allAssigned ? (isEnvyFree ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5") : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {!allAssigned
              ? "Assign all agents to rooms"
              : isEnvyFree
              ? "✓ Envy-Free Allocation!"
              : "Envy Detected"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!allAssigned ? (
            <p className="text-sm text-muted-foreground">
              Each agent must be assigned to exactly one room.
            </p>
          ) : isEnvyFree ? (
            <p className="text-sm text-green-600 dark:text-green-400">
              No agent prefers another agent's room at the current prices. This is an envy-free allocation!
            </p>
          ) : (
            <div className="space-y-2">
              {envyInfo.map((envy, idx) => (
                <div
                  key={idx}
                  className="text-sm p-2 rounded bg-destructive/10 border border-destructive/20"
                >
                  <span className="font-medium" style={{ color: getAgentColor(envy.from) }}>
                    {AGENTS[envy.from]}
                  </span>{" "}
                  envies{" "}
                  <span className="font-medium" style={{ color: getAgentColor(envy.to) }}>
                    {AGENTS[envy.to]}
                  </span>
                  : utility {envy.fromUtil} &lt; {envy.toUtil}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Problem:</strong> n agents share n rooms and must divide a total rent R.
          </p>
          <p>
            <strong>Goal:</strong> Find an assignment σ and rents r₁,...,rₙ (summing to R) such that
            no agent envies another—i.e., each agent's utility for their own room is at least as high
            as for any other room.
          </p>
          <p>
            <strong>Utility:</strong> u<sub>ij</sub> = v<sub>ij</sub> − r<sub>j</sub> (value minus rent).
          </p>
          <p>
            <strong>Envy-Free:</strong> Agent i is envy-free if u<sub>i,σ(i)</sub> ≥ u<sub>ij</sub> for all j.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentDivisionPuzzle;
