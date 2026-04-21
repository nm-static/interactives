import React, { type ComponentType,lazy, Suspense } from "react";

const componentMap: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  "binary-number-game": () => import("./interactives/BinaryNumberGame"),
  "ternary-number-game": () => import("./interactives/TernaryNumberGame"),
  "balanced-ternary-game": () => import("./interactives/BalancedTernaryGame"),
  "zeckendorf-game": () => import("./interactives/ZeckendorfGame"),
  "zeckendorf-search-trick": () => import("./interactives/ZeckendorfSearchTrick"),
  "binary-search-trick": () => import("./interactives/BinarySearchTrick"),
  "ternary-search-trick": () => import("./interactives/TernarySearchTrick"),
  "game-of-sim": () => import("./interactives/GameOfSim"),
  "northcotts-game": () => import("./interactives/NorthcottsGame"),
  "nim-game": () => import("./interactives/NimGame"),
  "assisted-nim-game": () => import("./interactives/AssistedNimGame"),
  "gold-coin-game": () => import("./interactives/GoldCoinGame"),
  "subtraction-game": () => import("./interactives/SubtractionGame"),
  "craps-game": () => import("./interactives/CrapsGame"),
  "bagchal-game": () => import("./interactives/BagchalGame"),
  "guessing-game": () => import("./interactives/GuessingGame"),
  "knights-puzzle": () => import("./interactives/KnightsPuzzle"),
  "plate-swap-puzzle": () => import("./interactives/PlateSwapPuzzle"),
  "chessboard-repaint-puzzle": () => import("./interactives/ChessboardRepaintPuzzle"),
  "n-queens-puzzle": () => import("./interactives/NQueensPuzzle"),
  "sikinia-parliament-puzzle": () => import("./interactives/SikiniaParliamentPuzzle"),
  "bulgarian-solitaire": () => import("./interactives/BulgarianSolitaire"),
  "pebble-placement-game": () => import("./interactives/PebblePlacementGame"),
  "stacking-blocks": () => import("./interactives/StackingBlocks"),
  "domino-retiling-puzzle": () => import("./interactives/DominoRetilingPuzzle"),
  "asc-desc-grid-puzzle": () => import("./interactives/AscDescGridPuzzle"),
  "ladybug-clock-puzzle": () => import("./interactives/LadybugClockPuzzle"),
  "erdos-discrepancy-puzzle": () => import("./interactives/ErdosDiscrepancyPuzzle"),
  "parity-bits-game": () => import("./interactives/ParityBitsGame"),
  "rules-of-inference": () => import("./interactives/RulesOfInferencePlayground"),
  "neighbor-sum-avoidance": () => import("./interactives/NeighborSumAvoidance"),
  "burnsides-lemma": () => import("./interactives/BurnsidesLemma"),
  "cube-coloring": () => import("./interactives/CubeColoring"),
  "presents-puzzle": () => import("./interactives/PresentsPuzzle"),
  "ferrers-rogers-ramanujan": () => import("./interactives/FerrersRogersRamanujan"),
  "grid-tiling-puzzle": () => import("./interactives/GridTilingPuzzle"),
  "sunny-lines-puzzle": () => import("./interactives/SunnyLinesPuzzle"),
  "rent-division-puzzle": () => import("./interactives/RentDivisionPuzzle"),
  "eternal-domination-game": () => import("./interactives/EternalDominationGame"),
  "knights-and-knaves": () => import("./interactives/KnightsAndKnavesI"),
  "three-bank-accounts": () => import("./interactives/ThreeBankAccounts"),
  "computing-pi": () => import("./interactives/ComputingPi"),
};

const lazyCache = new Map<string, React.LazyExoticComponent<ComponentType<any>>>();

function getLazyComponent(slug: string) {
  if (!lazyCache.has(slug)) {
    const loader = componentMap[slug];
    if (!loader) return null;
    lazyCache.set(slug, lazy(loader));
  }
  return lazyCache.get(slug)!;
}

interface InteractiveRendererProps {
  slug: string;
}

const InteractiveRenderer: React.FC<InteractiveRendererProps> = ({ slug }) => {
  const LazyComponent = getLazyComponent(slug);

  if (!LazyComponent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Interactive not found.</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <LazyComponent />
    </Suspense>
  );
};

export default InteractiveRenderer;
