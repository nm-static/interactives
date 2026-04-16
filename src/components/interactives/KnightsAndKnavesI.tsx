import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Statements
const STATEMENTS = [
  { id: "S", label: "At least one of us is a knave." },
  { id: "SNEG", label: "Both of us are knights." },
  { id: "AK", label: "A is a knight" },
  { id: "AN", label: "A is a knave" },
  { id: "BK", label: "B is a knight" },
  { id: "BN", label: "B is a knave" },
] as const;

type StatementId = typeof STATEMENTS[number]["id"];

const META: Record<StatementId, { group: "A" | "B" | "S"; neg: boolean }> = {
  S: { group: "S", neg: false },
  SNEG: { group: "S", neg: true },
  AK: { group: "A", neg: false },
  AN: { group: "A", neg: true },
  BK: { group: "B", neg: false },
  BN: { group: "B", neg: true },
};

const KnightsAndKnavesI = () => {
  const [inArena, setInArena] = useState<StatementId[]>([]);
  const [showExplain, setShowExplain] = useState(false);
  // SEO basics
  useEffect(() => {
    const title = "Knights and Knaves – I (Logic Puzzle)";
    document.title = title;
    const desc = "Drag statements into the arena to test consistency in a classic Knights and Knaves puzzle.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    // canonical
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.href);
  }, []);

  const available = useMemo(
    () => STATEMENTS.filter(s => !inArena.includes(s.id)),
    [inArena]
  );

  function onDragStart(e: React.DragEvent<HTMLDivElement>, id: StatementId) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onArenaDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") as StatementId;
    if (id && !inArena.includes(id)) setInArena(prev => [...prev, id]);
  }

  function onArenaDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function removeFromArena(id: StatementId) {
    setInArena(prev => prev.filter(x => x !== id));
  }

  function reset() {
    setInArena([]);
  }

  // Consistency checker via brute force over assignments (with A's utterance semantics)
  const consistentWith = (idsArr: StatementId[]) => {
    const ids = new Set(idsArr);
    for (const aKnight of [true, false]) {
      for (const bKnight of [true, false]) {
        // role constraints
        if (ids.has("AK") && !aKnight) continue;
        if (ids.has("AN") && aKnight) continue;
        if (ids.has("BK") && !bKnight) continue;
        if (ids.has("BN") && bKnight) continue;
        if (ids.has("SNEG") && !(aKnight && bKnight)) continue;

        // Content of A's statement: S = "At least one of us is a knave."
        const Scontent = (!aKnight) || (!bKnight);

        // Implicit linkage: if A is declared knight/knave, his statement's content must match
        if (ids.has("AK") && !Scontent) continue;
        if (ids.has("AN") && Scontent) continue;

        // If token S is explicitly included, also enforce truthfulness parity
        if (ids.has("S")) {
          if (aKnight !== Scontent) continue;
        }

        return true;
      }
    }
    return idsArr.length <= 1;
  };

  const isConsistent = useMemo(() => consistentWith(inArena), [inArena]);

  const arenaClasses = cn(
    "relative rounded-lg border transition-colors min-h-[320px] grid place-items-center p-6",
    isConsistent ? "bg-surface border-outline" : "bg-destructive/10 border-destructive"
  );

  // Partition remaining statements into compatible vs incompatible under current worldview
  const partitions = useMemo(() => {
    const remaining = STATEMENTS.filter(s => !inArena.includes(s.id));
    const incompatible = remaining
      .filter(s => !consistentWith([...inArena, s.id]))
      .map(s => s.id);
    const compatible = remaining
      .filter(s => !incompatible.includes(s.id))
      .map(s => s.id);
    return { compatible, incompatible };
  }, [inArena]);

  function generateExplanation(idsArr: StatementId[]): string[] {
    const ids = new Set(idsArr);
    const lines: string[] = [];

    // Direct role contradictions
    if (ids.has("AK") && ids.has("AN")) lines.push("A cannot be both a knight and a knave.");
    if (ids.has("BK") && ids.has("BN")) lines.push("B cannot be both a knight and a knave.");

    // A's utterance linkage
    if (ids.has("S")) {
      const forcedA = ids.has("AK") ? true : ids.has("AN") ? false : null;
      const forcedB = ids.has("BK") ? true : ids.has("BN") ? false : null;

      if (forcedA === true && forcedB === true) {
        lines.push("If A and B are both knights, then A’s statement “at least one of us is a knave” is false; but a knight cannot assert a falsehood.");
      }
      if (forcedA === false) {
        lines.push("If A is a knave, his statement must be false. “At least one of us is a knave” being false means neither is a knave (both are knights), contradicting “A is a knave” and any claim that B is a knave.");
      }
      if (forcedB === true && forcedA === null) {
        lines.push("B is a knight. If A were a knight, his statement would be false; if A were a knave, his statement would be true. Either way, A’s truthfulness would not match his statement, so no assignment works.");
      }

      // Enumerate remaining candidate assignments for clarity
      if (lines.length === 0) {
        const aVals = forcedA === null ? [true, false] : [forcedA];
        const bVals = forcedB === null ? [true, false] : [forcedB];
        for (const aKnight of aVals) {
          for (const bKnight of bVals) {
            const content = (!aKnight) || (!bKnight);
            const ok = (aKnight === content);
            if (!ok) {
              const contentTruth = content ? "true" : "false";
              lines.push(`If A is ${aKnight ? "a knight" : "a knave"} and B is ${bKnight ? "a knight" : "a knave"}, then the content “at least one of us is a knave” is ${contentTruth}, which a ${aKnight ? "knight must tell" : "knave must not tell"}.`);
            }
          }
        }
      }
    }

    if (lines.length === 0) lines.push("The selected set cannot be satisfied by any assignment of A and B.");
    return lines;
  }

  const explanation = useMemo(() => (isConsistent ? [] : generateExplanation(inArena)), [inArena, isConsistent]);

  useEffect(() => { if (isConsistent) setShowExplain(false); }, [isConsistent]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Knights and Knaves – I</h1>
        <p className="text-muted-foreground max-w-3xl">
          Knights always tell the truth, knaves always lie. A says: “At least one of us is a knave.”
          Drag statements into the arena to test whether they can all be true together.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Available statements */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Potential Truths</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {partitions.compatible.map(id => {
              const s = STATEMENTS.find(x => x.id === id)!;
              const meta = META[s.id];
              const groupClass = meta.group === "A" ? "logic-a" : meta.group === "B" ? "logic-b" : "logic-s";
              const styleClass = meta.neg ? "logic-dotted" : "logic-solid";
              const classes = cn(
                "cursor-move select-none rounded-md bg-surface-variant px-3 py-2 text-sm text-foreground shadow-card border-2 logic-border",
                groupClass,
                styleClass,
                "ring-1 ring-success/30"
              );
              return (
                <div
                  key={s.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, s.id)}
                  className={classes}
                  aria-label={`Drag: ${s.label}`}
                  role="button"
                  title="Compatible with current worldview"
                >
                  {s.label}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Arena */}
        <div className="lg:col-span-2">
          <div
            className={arenaClasses}
            onDragOver={onArenaDragOver}
            onDrop={onArenaDrop}
            aria-label="Arena drop zone"
            role="region"
          >
            <div className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <p className={cn("text-sm font-medium", isConsistent ? "text-success" : "text-destructive")}
                >{isConsistent ? "Consistent" : "Incompatible set"}</p>
                <div className="flex items-center gap-3">
                  {!isConsistent && (
                    <button
                      onClick={() => setShowExplain((v) => !v)}
                      className="text-destructive hover:text-destructive/80 text-sm"
                    >Explain</button>
                  )}
                  <button
                    onClick={reset}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >Reset</button>
                </div>
              </div>

              {inArena.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Drag any statement here. Tokens turn green in the arena. If two statements clash,
                  the arena turns red.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {inArena.map(id => {
                    const s = STATEMENTS.find(x => x.id === id)!;
                    return (
                      <div
                        key={id}
                        className="group inline-flex items-center gap-2 rounded-md border border-success bg-success/15 px-3 py-2 text-sm text-success shadow-card"
                        title="Click to remove"
                        onClick={() => removeFromArena(id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && removeFromArena(id)}
                      >
                        {s.label}
                        <span className="text-success/70 group-hover:text-success/100">×</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {showExplain && !isConsistent && (
            <div className="mt-4 rounded-md border border-outline bg-surface p-4">
              <h2 className="text-sm font-semibold mb-2">Why inconsistent?</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {explanation.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {partitions.incompatible.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-xl">Incompatible with current worldview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {partitions.incompatible.map(id => {
                  const s = STATEMENTS.find(x => x.id === id)!;
                  const meta = META[id];
                  const groupClass = meta.group === "A" ? "logic-a" : meta.group === "B" ? "logic-b" : "logic-s";
                  const styleClass = meta.neg ? "logic-dotted" : "logic-solid";
                  const classes = cn(
                    "select-none rounded-md bg-surface-variant px-3 py-2 text-sm text-foreground shadow-card border-2 logic-border",
                    groupClass,
                    styleClass,
                    "opacity-60 cursor-not-allowed bg-destructive/10 ring-1 ring-destructive/40"
                  );
                  return (
                    <div
                      key={id}
                      className={classes}
                      aria-disabled="true"
                      title="Conflicts with current worldview"
                    >
                      {s.label}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default KnightsAndKnavesI;
