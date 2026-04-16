import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Rules of Inference Playground (Example 1: Resolution)
// Layout: 3 columns (Premises | Notepad lines with rule margin | Rules)
// Below: pool of intermediate statements + distractors
// Interaction: drag premises/clauses onto lines, drag a rule to the small right margin for that line,
// then drag a conclusion from the pool to a new line. We validate the step.

// Types
interface Line {
  statement?: string;
  rule?: string; // rule id placed in the margin for this line
  status?: "pending" | "correct" | "incorrect";
}

type DragType = "premise" | "statement" | "rule";

interface RuleDef {
  id: string;
  label: string;
  help?: string;
}

interface ExampleDef {
  id: string;
  title: string;
  premises: string[];
  conclusion: string;
  rules: RuleDef[];
  pool: string[]; // candidate intermediate and target statements
}

const EXAMPLES: ExampleDef[] = [
  {
    id: "ex-resolution-1",
    title: "(p ∧ q) ∨ r, r → s ⊢ p ∨ s",
    premises: ["(p ∧ q) ∨ r", "r → s"],
    conclusion: "p ∨ s",
    rules: [
      {
        id: "distribution",
        label: "Distribution: (A ∧ B) ∨ C ≡ (A ∨ C) ∧ (B ∨ C)",
        help: "From (p ∧ q) ∨ r you may derive p ∨ r or q ∨ r.",
      },
      {
        id: "implication-elim",
        label: "→ elimination: (A → B) ≡ (¬A ∨ B)",
        help: "From r → s you may derive ¬r ∨ s.",
      },
      {
        id: "resolution",
        label: "Resolution",
        help: "From (X ∨ r) and (¬r ∨ Y) derive (X ∨ Y).",
      },
    ],
    pool: [
      "p ∨ r",
      "q ∨ r",
      "¬r ∨ s",
      "p ∨ s", // target
      // distractors
      "p",
      "q",
      "r",
      "s",
      "p ∨ q",
      "¬p ∨ s",
    ],
  },
  {
    id: "ex-modus-ponens-1",
    title: "A → B ∧ (C ∨ D), A, ¬C ⊢ D",
    premises: ["A → B ∧ (C ∨ D)", "A", "¬C"],
    conclusion: "D",
    rules: [
      {
        id: "modus-ponens",
        label: "Modus Ponens: A, A → B ⊢ B",
        help: "From A and A → B you may derive B.",
      },
      {
        id: "simplification",
        label: "Simplification: A ∧ B ⊢ A, A ∧ B ⊢ B",
        help: "From A ∧ B you may derive A or B.",
      },
      {
        id: "disjunctive-syllogism",
        label: "Disjunctive Syllogism: A ∨ B, ¬A ⊢ B",
        help: "From A ∨ B and ¬A you may derive B.",
      },
    ],
    pool: [
      "B ∧ (C ∨ D)",
      "C ∨ D",
      "D", // target
      // distractors
      "A",
      "B",
      "C",
      "¬C",
      "A ∧ B",
      "B ∨ D",
    ],
  },
  {
    id: "ex-hypothetical-syllogism",
    title: "p → q, ¬p → r, r → s ⊢ ¬q → s",
    premises: ["p → q", "¬p → r", "r → s"],
    conclusion: "¬q → s",
    rules: [
      {
        id: "contrapositive",
        label: "Contrapositive: A → B ≡ ¬B → ¬A",
        help: "From A → B you may derive ¬B → ¬A.",
      },
      {
        id: "hypothetical-syllogism",
        label: "Hypothetical Syllogism: A → B, B → C ⊢ A → C",
        help: "From A → B and B → C you may derive A → C.",
      },
    ],
    pool: [
      "¬q → ¬p",
      "¬q → r",
      "¬q → s", // target
      "¬p → s", // intermediate step
      // distractors
      "p",
      "q",
      "r",
      "s",
      "¬p",
      "¬q",
      "p → r",
      "q → s",
    ],
  },
];

// Small helper to attach drag payload
function onDragStart(e: React.DragEvent, type: DragType, value: string) {
  e.dataTransfer.setData("text/plain", JSON.stringify({ type, value }));
  e.dataTransfer.effectAllowed = "move";
}

function parseDragData(e: React.DragEvent): { type: DragType; value: string } | null {
  try {
    const raw = e.dataTransfer.getData("text/plain");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function DraggableChip({ label, onDragStart: handle, onDoubleClick, disabled = false }: { 
  label: string; 
  onDragStart: (e: React.DragEvent) => void; 
  onDoubleClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="button"
      draggable={!disabled}
      onDragStart={disabled ? undefined : handle}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      className={`select-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-grab active:cursor-grabbing hover:bg-accent hover:text-accent-foreground'
      }`}
      aria-label={label}
      title={label}
    >
      {label}
    </div>
  );
}

function DropZone({ children, onDrop, className }: { children?: React.ReactNode; onDrop: (e: React.DragEvent) => void; className?: string }) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={
        "min-h-12 rounded-md border border-dashed border-border bg-background/60 p-2 " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}

export default function RulesOfInferencePlayground({ onComplete }: { onComplete?: (completed: boolean) => void }) {
  const { toast } = useToast();
  const [exampleId, setExampleId] = useState(EXAMPLES[0].id);
  const example = useMemo(() => EXAMPLES.find((e) => e.id === exampleId)!, [exampleId]);

  type Step = { used: string[]; rule: string; result: string };

  const [steps, setSteps] = useState<Step[]>([]);
  const [activePremises, setActivePremises] = useState<string[]>([]);
  const [activeRule, setActiveRule] = useState<string | undefined>(undefined);
  const [showInvalidRuleModal, setShowInvalidRuleModal] = useState(false);

  useEffect(() => {
    // Reset when example changes
    setSteps([]);
    setActivePremises([]);
    setActiveRule(undefined);
    onComplete?.(false);
  }, [exampleId, onComplete]);

  const availableStatements = useMemo(
    () => Array.from(new Set([...(example?.premises ?? []), ...steps.map((s) => s.result)])),
    [example, steps]
  );

  const reachedTarget = steps.some((s) => s.result === example.conclusion);

  // Derivation logic for candidates based on the currently selected subset and rule
  function deriveCandidates(rule?: string, selected: string[] = []): string[] {
    if (!rule || selected.length === 0) return [];

    if (example.id === "ex-resolution-1") {
      switch (rule) {
        case "distribution": {
          // From (p ∧ q) ∨ r derive p ∨ r and q ∨ r
          if (selected.includes("(p ∧ q) ∨ r") && selected.length === 1) {
            return ["p ∨ r", "q ∨ r"];
          }
          break;
        }
        case "implication-elim": {
          // From r → s derive ¬r ∨ s
          if (selected.includes("r → s") && selected.length === 1) {
            return ["¬r ∨ s"];
          }
          break;
        }
        case "resolution": {
          // From (X ∨ r) and (¬r ∨ Y) derive (X ∨ Y)
          const hasPorR = selected.includes("p ∨ r");
          const hasQorR = selected.includes("q ∨ r");
          const hasNotRorS = selected.includes("¬r ∨ s");
          
          if (selected.length === 2 && hasNotRorS) {
            if (hasPorR) {
              return ["p ∨ s"];
            }
            if (hasQorR) {
              return ["q ∨ s"];
            }
          }
          break;
        }
      }
    } else if (example.id === "ex-modus-ponens-1") {
      switch (rule) {
        case "modus-ponens": {
          // From A and A → B ∧ (C ∨ D) derive B ∧ (C ∨ D)
          if (selected.includes("A") && selected.includes("A → B ∧ (C ∨ D)") && selected.length === 2) {
            return ["B ∧ (C ∨ D)"];
          }
          break;
        }
        case "simplification": {
          // From B ∧ (C ∨ D) derive B or (C ∨ D)
          if (selected.includes("B ∧ (C ∨ D)") && selected.length === 1) {
            return ["B", "C ∨ D"];
          }
          break;
        }
        case "disjunctive-syllogism": {
          // From C ∨ D and ¬C derive D
          if (selected.includes("C ∨ D") && selected.includes("¬C") && selected.length === 2) {
            return ["D"];
          }
          break;
        }
      }
    } else if (example.id === "ex-hypothetical-syllogism") {
      switch (rule) {
        case "contrapositive": {
          // From p → q derive ¬q → ¬p
          if (selected.includes("p → q") && selected.length === 1) {
            return ["¬q → ¬p"];
          }
          break;
        }
        case "hypothetical-syllogism": {
          // From ¬q → ¬p and ¬p → r derive ¬q → r
          if (selected.includes("¬q → ¬p") && selected.includes("¬p → r") && selected.length === 2) {
            return ["¬q → r"];
          }
          // From ¬q → r and r → s derive ¬q → s
          if (selected.includes("¬q → r") && selected.includes("r → s") && selected.length === 2) {
            return ["¬q → s"];
          }
          // From ¬p → r and r → s derive ¬p → s
          if (selected.includes("¬p → r") && selected.includes("r → s") && selected.length === 2) {
            return ["¬p → s"];
          }
          // From ¬q → ¬p and ¬p → s derive ¬q → s
          if (selected.includes("¬q → ¬p") && selected.includes("¬p → s") && selected.length === 2) {
            return ["¬q → s"];
          }
          break;
        }
      }
    }

    return [];
  }

  const candidates = useMemo(
    () => deriveCandidates(activeRule, activePremises),
    [activeRule, activePremises]
  );

  // Auto-apply when there is exactly one valid candidate
  useEffect(() => {
    if (candidates.length === 1 && activeRule && activePremises.length > 0) {
      applyCandidate(candidates[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.length]);

  function applyCandidate(result: string) {
    if (!activeRule || activePremises.length === 0) return;

    // Validate again defensively
    const valid = deriveCandidates(activeRule, activePremises).includes(result);
    if (!valid) {
      setShowInvalidRuleModal(true);
      setActiveRule(undefined); // Clear the rule from the drop zone
      return;
    }

    setSteps((prev) => [...prev, { used: [...activePremises], rule: activeRule, result }]);
    setActivePremises([]);
    setActiveRule(undefined);

    if (result === example.conclusion) {
      toast({ title: "Proof complete!", description: "You successfully derived the target conclusion!" });
      onComplete?.(true);
    } else {
      toast({ title: "Step added", description: "Continue building your proof with the new statement." });
    }
  }

  function handlePremiseDrop(e: React.DragEvent) {
    if (reachedTarget) return; // Freeze interactions when solved
    const data = parseDragData(e);
    if (!data) return;
    if (data.type === "premise" || data.type === "statement") {
      const value = data.value;
      // Only allow from available set
      if (!availableStatements.includes(value)) return;
      setActivePremises((prev) => (prev.includes(value) ? prev : [...prev, value]));
    }
  }

  function handleRuleDrop(e: React.DragEvent) {
    if (reachedTarget) return; // Freeze interactions when solved
    const data = parseDragData(e);
    if (!data) return;
    if (data.type === "rule") setActiveRule(data.value);
  }

  const reset = () => {
    setSteps([]);
    setActivePremises([]);
    setActiveRule(undefined);
  };

  const removeActivePremise = (p: string) =>
    setActivePremises((prev) => prev.filter((x) => x !== p));

  // Double-click handlers
  const handlePremiseDoubleClick = (premise: string) => {
    if (reachedTarget) return;
    if (!availableStatements.includes(premise)) return;
    setActivePremises((prev) => (prev.includes(premise) ? prev : [...prev, premise]));
  };

  const handleRuleDoubleClick = (rule: string) => {
    if (reachedTarget) return;
    setActiveRule(rule);
  };

  // Check for invalid rule combination and show error
  useEffect(() => {
    if (activeRule && activePremises.length > 0 && candidates.length === 0) {
      setShowInvalidRuleModal(true);
      setActiveRule(undefined);
    }
  }, [activeRule, activePremises, candidates.length]);

  return (
    <div className={`min-h-[70vh] space-y-4 transition-colors duration-500 ${reachedTarget && !onComplete ? 'bg-green-50/50 dark:bg-green-950/20' : ''}`}>
      {/* Top controls */}
      <div className="flex items-center gap-3">
        <Select value={exampleId} onValueChange={setExampleId}>
          <SelectTrigger className="w-[360px]">
            <SelectValue placeholder="Choose example" />
          </SelectTrigger>
          <SelectContent>
            {EXAMPLES.map((ex) => (
              <SelectItem key={ex.id} value={ex.id}>
                {ex.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          {reachedTarget && (
            <span className="text-sm text-muted-foreground">Nice! You derived the target.</span>
          )}
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>

      {/* Above the arena: two columns (Available statements | Rules) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section aria-label="Available statements" className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Available statements</h2>
          <div className="space-y-2">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Initial premises</p>
              <div className="flex flex-wrap gap-2">
                {example.premises.map((p) => (
                  <DraggableChip 
                    key={p} 
                    label={p} 
                    onDragStart={(e) => onDragStart(e, "premise", p)} 
                    onDoubleClick={() => handlePremiseDoubleClick(p)}
                    disabled={reachedTarget} 
                  />
                ))}
              </div>
            </div>
            {steps.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Derived so far</p>
                <div className="flex flex-wrap gap-2">
                   {steps.map((s, idx) => (
                     <DraggableChip
                       key={`${s.result}-${idx}`}
                       label={s.result}
                       onDragStart={(e) => onDragStart(e, "statement", s.result)}
                       onDoubleClick={() => handlePremiseDoubleClick(s.result)}
                       disabled={reachedTarget}
                     />
                   ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section aria-label="Rules" className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Inference rules</h2>
          <div className="space-y-2">
            {example.rules.map((r) => (
              <div key={r.id} className="space-y-1">
                <DraggableChip 
                  label={r.id} 
                  onDragStart={(e) => onDragStart(e, "rule", r.id)} 
                  onDoubleClick={() => handleRuleDoubleClick(r.id)}
                  disabled={reachedTarget} 
                />
                {r.help && <p className="text-xs text-muted-foreground pl-1">{r.help}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Arena (full width) */}
      <section aria-label="Workspace" className="space-y-3">
        <div className="rounded-lg border border-border bg-card p-3">
          {/* History */}
          {steps.length > 0 && (
            <div className="space-y-2 mb-3">
              {steps.map((s, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_160px] items-center gap-2">
                  <div className="rounded-md border border-border bg-background p-2 text-sm text-foreground">
                    {s.result}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    by <span className="font-medium">{s.rule}</span>
                    <span className="ml-1">from {s.used.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active line */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] items-stretch gap-2">
              {/* premises selection zone */}
              <DropZone onDrop={handlePremiseDrop} className="bg-background min-h-12">
                <div className="flex flex-wrap items-center gap-2 p-2">
                  {activePremises.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Drop premises here (you can drop multiple)</span>
                  ) : (
                    activePremises.map((p) => (
                      <div
                        key={p}
                        className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1 text-sm"
                        title={p}
                      >
                        <span className="text-foreground">{p}</span>
                        <button
                          className="rounded-md border border-transparent px-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => removeActivePremise(p)}
                          aria-label={`Remove ${p}`}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </DropZone>

              {/* rule zone */}
              <DropZone onDrop={handleRuleDrop}>
                <div className="flex h-full items-center justify-center rounded-md bg-muted/30 text-xs text-muted-foreground">
                  {activeRule ? <span>{activeRule}</span> : <span>Drop rule</span>}
                </div>
              </DropZone>
            </div>

            {/* Candidate results (if multiple) */}
            {activeRule && activePremises.length > 0 && candidates.length > 1 && (
              <div className="rounded-md border border-border bg-background p-2">
                <p className="text-xs text-muted-foreground mb-2">Possible conclusions:</p>
                <div className="flex flex-wrap gap-2">
                  {candidates.map((c) => (
                    <Button key={c} size="sm" variant="outline" onClick={() => applyCandidate(c)}>
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Target below */}
            <div className="rounded-md border border-border bg-background p-2 text-sm">
              Target conclusion: <span className="font-medium text-foreground">{example.conclusion}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Invalid Rule Modal */}
      <AlertDialog open={showInvalidRuleModal} onOpenChange={setShowInvalidRuleModal}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Rule Not Applicable</AlertDialogTitle>
            <AlertDialogDescription>
              The selected rule cannot be applied to the chosen premises. Please try a different rule or select different premises.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInvalidRuleModal(false)}>
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
