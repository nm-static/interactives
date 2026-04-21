export type InteractiveStatus = "published" | "draft" | "idea";

export interface Interactive {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  themes: string[];
  subcategory?: string;
  dateAdded: string;
  hasGreenScreen: boolean;
  status: InteractiveStatus;
}

/** First theme in the themes array is the primary theme. */
export function primaryTheme(interactive: Interactive): string {
  return interactive.themes[0];
}

export interface Subcategory {
  slug: string;
  title: string;
  description: string;
}

export interface Theme {
  slug: string;
  title: string;
  description: string;
  subcategories?: Subcategory[];
}

export const allThemes: Theme[] = [
  {
    slug: "discrete-math",
    title: "Discrete Math",
    description:
      "Explore fundamental concepts in discrete mathematics through visual and interactive demonstrations.",
    subcategories: [
      {
        slug: "foundations",
        title: "Foundations",
        description:
          "Basic concepts including sets, logic, number systems, and fundamental mathematical structures.",
      },
      {
        slug: "proofs",
        title: "Proofs",
        description:
          "Learn proof techniques including direct proofs, contradiction, induction, and formal reasoning.",
      },
      {
        slug: "counting",
        title: "Counting",
        description:
          "Combinatorics, permutations, combinations, and advanced counting principles.",
      },
      {
        slug: "uncertainty",
        title: "Uncertainty",
        description:
          "Probability theory, random variables, and statistical reasoning in discrete contexts.",
      },
      {
        slug: "structures",
        title: "Structures",
        description:
          "Algebraic structures, relations, functions, and abstract mathematical systems.",
      },
      {
        slug: "numbers",
        title: "Numbers",
        description:
          "Number theory, modular arithmetic, cryptography, and computational number theory.",
      },
      {
        slug: "graphs",
        title: "Graphs",
        description:
          "Graph theory, algorithms on graphs, trees, and network analysis.",
      },
    ],
  },
  {
    slug: "games",
    title: "Games",
    description:
      "Learn through play with educational games that reinforce computer science and mathematical concepts.",
  },
  {
    slug: "puzzles",
    title: "Puzzles",
    description:
      "Challenge your problem-solving skills with educational puzzles designed to reinforce key concepts across multiple disciplines.",
  },
  {
    slug: "data-structures",
    title: "Data Structures",
    description:
      "Master fundamental and advanced data structures through interactive manipulation and visualization.",
  },
  {
    slug: "contest-problems",
    title: "Contest Problems",
    description:
      "Practice with problems from programming competitions, mathematical olympiads, and algorithmic challenges.",
  },
  {
    slug: "social-choice",
    title: "Social Choice",
    description:
      "Understand voting systems, fairness criteria, and collective decision-making through interactive simulations.",
  },
  {
    slug: "miscellany",
    title: "Miscellany",
    description:
      "Unique educational experiments and interactive content that sparks curiosity and enhances learning.",
  },
  {
    slug: "advanced-algorithms",
    title: "Advanced Algorithms",
    description:
      "Deep dive into complex algorithmic concepts with step-by-step visualizations and performance analysis.",
  },
  {
    slug: "cards-and-math",
    title: "Cards and Math",
    description:
      "Discover mathematical principles and probability theory through card games and interactive demonstrations.",
  },
];

export const allInteractives: Interactive[] = [
  // === Discrete Math - Foundations ===
  {
    slug: "binary-number-game",
    title: "Binary Number Representation",
    description:
      "Learn how numbers are represented in binary (base-2) format through an interactive guessing game.",
    tags: ["binary", "numbers", "conversion", "representation"],
    themes: ["Discrete Math"],
    subcategory: "foundations",
    dateAdded: "2024-01-15",
    hasGreenScreen: true,
    status: "published" as const,
  },
  {
    slug: "ternary-number-game",
    title: "Ternary Number Representation",
    description:
      "Learn how numbers are represented in ternary (base-3) format by toggling between 0, 1, or 2 copies of powers of three.",
    tags: ["ternary", "numbers", "conversion", "representation", "base-3"],
    themes: ["Discrete Math"],
    subcategory: "foundations",
    dateAdded: "2024-01-16",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "balanced-ternary-game",
    title: "Balanced Ternary Representation",
    description:
      "Explore balanced ternary using digits T (-1), 0, and 1. Add or subtract powers of three to match the target number.",
    tags: [
      "balanced-ternary",
      "numbers",
      "conversion",
      "representation",
      "base-3",
      "signed-digits",
    ],
    themes: ["Discrete Math"],
    subcategory: "foundations",
    dateAdded: "2024-01-17",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "zeckendorf-game",
    title: "Zeckendorf Representation",
    description:
      "Learn how numbers are represented using Fibonacci numbers with the unique Zeckendorf representation (no consecutive Fibonacci numbers).",
    tags: [
      "fibonacci",
      "numbers",
      "representation",
      "zeckendorf",
      "combinatorics",
    ],
    themes: ["Discrete Math"],
    subcategory: "foundations",
    dateAdded: "2024-12-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "knights-and-knaves",
    title: "Knights and Knaves I",
    description:
      "Solve logic puzzles on an island where knights always tell the truth and knaves always lie!",
    tags: ["logic", "truth-tellers", "liars", "deduction", "puzzle"],
    themes: ["Discrete Math"],
    subcategory: "foundations",
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "rules-of-inference",
    title: "Rules of Inference Playground",
    description:
      "Practice applying resolution and equivalence rules to derive conclusions step by step in this interactive logic playground.",
    tags: ["logic", "inference", "playground", "rules", "proofs", "educational"],
    themes: ["Discrete Math"],
    subcategory: "foundations",
    dateAdded: "2024-12-23",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "parity-bits-game",
    title: "Parity Bits Game",
    description:
      "Learn about error detection and correction through an interactive game about parity bits!",
    tags: ["parity", "error-detection", "binary", "educational"],
    themes: ["Discrete Math"],
    subcategory: "foundations",
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  // === Discrete Math - Counting ===
  {
    slug: "ferrers-rogers-ramanujan",
    title: "Ferrers Diagrams & Rogers-Ramanujan",
    description:
      "Visualize integer partitions through Ferrers diagrams and explore the Rogers-Ramanujan identities interactively.",
    tags: ["partitions", "combinatorics", "number-theory", "visualization"],
    themes: ["Discrete Math"],
    subcategory: "counting",
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  // === Discrete Math - Uncertainty ===
  {
    slug: "presents-puzzle",
    title: "The Presents Puzzle",
    description:
      "Explore a probability puzzle about search strategies. Charlie puts 26 presents in 100 boxes. Alice opens them in order while Bob opens odds first, then evens.",
    tags: [
      "probability",
      "search",
      "simulation",
      "expected-value",
      "strategy",
      "uncertainty",
    ],
    themes: ["Discrete Math"],
    subcategory: "uncertainty",
    dateAdded: "2025-01-19",
    hasGreenScreen: false,
    status: "published" as const,
  },
  // === Discrete Math - Structures ===
  {
    slug: "burnsides-lemma",
    title: "Burnside's Lemma",
    description:
      "Explore how to count distinct objects under symmetry by creating necklaces with different bead and color combinations.",
    tags: [
      "group-theory",
      "symmetry",
      "combinatorics",
      "counting",
      "algebra",
      "structures",
    ],
    themes: ["Discrete Math"],
    subcategory: "structures",
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "draft" as const,
  },

  // === Discrete Math - Graphs ===
  {
    slug: "neighbor-sum-avoidance",
    title: "Neighbor Sum Avoidance",
    description:
      "Arrange numbers in a circle so that the sum of two neighbors is never divisible by 3, 5, or 7. An interactive graph theory puzzle!",
    tags: [
      "graph-theory",
      "puzzle",
      "arrangement",
      "divisibility",
      "circle",
      "mathematics",
    ],
    themes: ["Discrete Math"],
    subcategory: "graphs",
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  // === Data Structures ===
  {
    slug: "zeckendorf-search-trick",
    title: "Zeckendorf Search Magic Trick",
    description:
      "Experience the magic of Zeckendorf representation! Think of a number and watch as the cards reveal it through Fibonacci numbers.",
    tags: [
      "fibonacci",
      "magic",
      "numbers",
      "trick",
      "zeckendorf",
      "representation",
    ],
    themes: ["Data Structures"],
    dateAdded: "2024-12-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "binary-search-trick",
    title: "Binary Search Magic Trick",
    description:
      "Perform an amazing magic trick that reveals how binary numbers work. Think of a number and watch the magic happen!",
    tags: ["binary", "magic", "numbers", "trick", "data-structures"],
    themes: ["Data Structures"],
    dateAdded: "2024-02-20",
    hasGreenScreen: true,
    status: "published" as const,
  },
  {
    slug: "ternary-search-trick",
    title: "Ternary Search Magic Trick",
    description:
      "Experience the magic of ternary search! Think of a number and watch as the cards reveal it through mathematical calculations.",
    tags: [
      "ternary",
      "magic",
      "numbers",
      "trick",
      "data-structures",
      "search",
    ],
    themes: ["Data Structures"],
    dateAdded: "2024-07-20",
    hasGreenScreen: true,
    status: "published" as const,
  },
  {
    slug: "guessing-game",
    title: "Number Guessing Game",
    description:
      "Experience different search algorithms through interactive gameplay. Compare random, linear, and binary search strategies!",
    tags: [
      "algorithms",
      "search",
      "educational",
      "interactive",
      "binary-search",
      "computer-science",
    ],
    themes: ["Data Structures"],
    dateAdded: "2024-12-23",
    hasGreenScreen: false,
    status: "published" as const,
  },
  // === Games ===
  {
    slug: "game-of-sim",
    title: "Game of Sim",
    description:
      "A strategic two-player game where you take turns coloring edges between vertices, trying to avoid creating a triangle of your own color.",
    tags: ["strategy", "graph-theory", "two-player", "logic", "game-theory"],
    themes: ["Games"],
    dateAdded: "2024-03-10",
    hasGreenScreen: true,
    status: "published" as const,
  },
  {
    slug: "northcotts-game",
    title: "Northcott's Game",
    description:
      "A strategic board game where players move their pieces to outmaneuver their opponent in a tactical race.",
    tags: ["strategy", "board-game", "two-player", "logic", "game-theory"],
    themes: ["Games"],
    dateAdded: "2024-03-15",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "nim-game",
    title: "Game of Nim",
    description:
      "A classic two-player game of strategy. Take turns removing stones from heaps. The player to take the last stone wins!",
    tags: ["strategy", "two-player", "math", "logic", "game-theory"],
    themes: ["Games"],
    dateAdded: "2024-07-21",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "assisted-nim-game",
    title: "Assisted Game of Nim",
    description:
      "Learn the XOR strategy! Visualize how powers of 2 determine winning moves with color-coded borders.",
    tags: [
      "strategy",
      "two-player",
      "math",
      "logic",
      "game-theory",
      "xor-strategy",
      "educational",
    ],
    themes: ["Games"],
    dateAdded: "2024-07-21",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "gold-coin-game",
    title: "The Gold Coin Game",
    description:
      "A strategic two-player game where you move coins to the left or take the leftmost coin. The player who takes the gold coin wins!",
    tags: [
      "strategy",
      "two-player",
      "logic",
      "game-theory",
      "movement",
      "coins",
    ],
    themes: ["Games"],
    dateAdded: "2024-12-19",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "subtraction-game",
    title: "The Subtraction Game",
    description:
      "A strategic two-player game where players take turns removing circles, with the last player to move winning.",
    tags: [
      "strategy",
      "two-player",
      "game-theory",
      "mathematical-games",
      "nim-variant",
    ],
    themes: ["Games"],
    dateAdded: "2024-12-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "craps-game",
    title: "Craps: An Exploration",
    description:
      "Experience the classic casino dice game! Roll two dice and learn about probability as you discover the rules of the opening throw.",
    tags: ["probability", "dice", "casino", "mathematics", "statistics"],
    themes: ["Games"],
    dateAdded: "2025-01-05",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "bagchal-game",
    title: "Bagchal Game",
    description:
      "Play the traditional Nepali board game where tigers try to capture goats while goats try to block tigers.",
    tags: ["strategy", "board-game", "two-player", "traditional"],
    themes: ["Games"],
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  // === Puzzles ===
  {
    slug: "knights-puzzle",
    title: "Knights Exchange Puzzle",
    description:
      "A classic chess puzzle where you must exchange the positions of white and black knights using legal knight moves.",
    tags: ["chess", "knights", "puzzle", "logic", "strategy"],
    themes: ["Puzzles"],
    dateAdded: "2024-07-21",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "plate-swap-puzzle",
    title: "The Plate Swap Puzzle",
    description:
      "Arrange plates around a circular table so each person has their own plate. A challenging permutation puzzle!",
    tags: ["logic", "permutation", "strategy", "puzzle", "cycles"],
    themes: ["Puzzles"],
    dateAdded: "2024-12-19",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "chessboard-repaint-puzzle",
    title: "Chessboard Repaint Puzzle",
    description:
      "Repaint rows, columns, or 2x2 squares to achieve exactly one black square. A puzzle about parity and operations!",
    tags: [
      "logic",
      "parity",
      "strategy",
      "puzzle",
      "chessboard",
      "operations",
    ],
    themes: ["Puzzles"],
    dateAdded: "2024-12-19",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "n-queens-puzzle",
    title: "N-Queens Puzzle",
    description:
      "Place as many queens as possible on an nxn chessboard so that no two queens attack each other.",
    tags: ["logic", "chess", "placement", "classic"],
    themes: ["Puzzles"],
    dateAdded: "2024-12-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "sikinia-parliament-puzzle",
    title: "Parliament of Sikinia Puzzle",
    description:
      "Separate parliament members into two houses so each has at most one enemy in their house. A graph theory puzzle!",
    tags: ["graph-theory", "logic", "coloring"],
    themes: ["Puzzles"],
    dateAdded: "2024-12-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "bulgarian-solitaire",
    title: "Bulgarian Solitaire",
    description:
      "A mathematical card game where you repeatedly redistribute cards into piles until reaching a stable configuration.",
    tags: [
      "solitaire",
      "card-game",
      "mathematics",
      "puzzle",
      "redistribution",
      "stable-configuration",
    ],
    themes: ["Puzzles"],
    dateAdded: "2024-12-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "pebble-placement-game",
    title: "Pebble Placement Game",
    description:
      "Place pebbles on a grid following specific rules. A strategic puzzle about spatial reasoning!",
    tags: ["strategy", "grid", "placement", "puzzle"],
    themes: ["Puzzles"],
    dateAdded: "2024-12-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "stacking-blocks",
    title: "Stacking Blocks Optimization",
    description:
      "Split stacks of blocks to maximize your score! An optimization puzzle about strategic decision-making.",
    tags: [
      "optimization",
      "strategy",
      "mathematical",
      "algorithm",
      "puzzles",
    ],
    themes: ["Puzzles"],
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "domino-retiling-puzzle",
    title: "Domino Retiling Puzzle",
    description:
      "Rearrange dominoes on a grid to achieve the target configuration. A puzzle about combinatorics and tiling!",
    tags: ["combinatorics", "tiling", "puzzle", "dominoes"],
    themes: ["Puzzles"],
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "asc-desc-grid-puzzle",
    title: "Ascending-Descending Grid Puzzle",
    description:
      "Fill a grid with numbers that are ascending in rows and descending in columns. A constraint satisfaction puzzle!",
    tags: ["logic", "grid", "constraint", "puzzle"],
    themes: ["Puzzles"],
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "ladybug-clock-puzzle",
    title: "The Ladybug Clock Puzzle",
    description:
      "A ladybug walks randomly on a clock face. Discover the surprising probability that any given number is painted last!",
    tags: [
      "probability",
      "random-walk",
      "simulation",
      "statistics",
      "cover-time",
      "puzzle",
    ],
    themes: ["Puzzles"],
    dateAdded: "2025-01-21",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "erdos-discrepancy-puzzle",
    title: "The Erdos Discrepancy Problem",
    description:
      "Can you write instructions to survive the tunnel forever? Explore this famous mathematical puzzle through the Prisoner's Walk game.",
    tags: [
      "erdos",
      "discrepancy",
      "sequences",
      "game-theory",
      "impossibility",
      "puzzle",
      "number-theory",
    ],
    themes: ["Puzzles"],
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  // === Contest Problems ===
  {
    slug: "three-bank-accounts",
    title: "Three Bank Accounts",
    description:
      "Peter has three bank accounts. He can transfer between them, but a transfer must exactly double the recipient's balance. Can he always empty one account?",
    tags: ["strategy", "binary", "number-theory", "imo", "contest-problems"],
    themes: ["Contest Problems"],
    dateAdded: "2026-04-17",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "grid-tiling-puzzle",
    title: "Grid Tiling Puzzle",
    description:
      "Based on IMO 2025: Place rectangular tiles on a grid so that each row and column has exactly one uncovered square.",
    tags: ["puzzle", "geometry", "optimization", "imo", "contest-problems"],
    themes: ["Contest Problems"],
    dateAdded: "2024-12-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "sunny-lines-puzzle",
    title: "Sunny Lines Puzzle",
    description:
      "Based on IMO 2025 P6: Place lines to cover points in a triangle. A line is 'sunny' if it's not parallel to x-axis, y-axis, or x+y=0.",
    tags: ["puzzle", "geometry", "lines", "imo", "contest-problems"],
    themes: ["Contest Problems"],
    dateAdded: "2024-12-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  // === Social Choice ===
  {
    slug: "rent-division-puzzle",
    title: "Rent Division Puzzle",
    description:
      "Find a fair way to divide rent among roommates with different room preferences using the Sperner's lemma approach.",
    tags: ["fairness", "division", "sperner", "social-choice", "economics"],
    themes: ["Social Choice"],
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  // === Miscellany ===
  {
    slug: "eternal-domination-game",
    title: "Eternal Domination Game",
    description:
      "Defend a graph forever by moving guards to respond to attacks. Explore the eternal domination number!",
    tags: ["graph-theory", "domination", "strategy", "defense"],
    themes: ["Miscellany"],
    dateAdded: "2025-01-22",
    hasGreenScreen: false,
    status: "published" as const,
  },
  {
    slug: "computing-pi",
    title: "Computing π from Coin Tosses",
    description:
      "Toss a coin until heads first outnumber tails, record the fraction, and repeat. The average of those fractions approaches π/4 — watch it converge in parallel runs.",
    tags: [
      "probability",
      "simulation",
      "pi",
      "monte-carlo",
      "random-walk",
      "convergence",
    ],
    themes: ["Miscellany"],
    dateAdded: "2026-04-21",
    hasGreenScreen: false,
    status: "published" as const,
  },
];

/** All published interactives. Use this for public-facing pages. */
export const publishedInteractives = allInteractives.filter(
  (i) => i.status === "published"
);

export function getInteractiveBySlug(slug: string): Interactive | undefined {
  return allInteractives.find((i) => i.slug === slug);
}

export function getInteractivesByTheme(themeTitle: string): Interactive[] {
  return publishedInteractives.filter((i) => i.themes.includes(themeTitle));
}

export function getInteractivesBySubcategory(
  themeTitle: string,
  subcategorySlug: string
): Interactive[] {
  return publishedInteractives.filter(
    (i) => i.themes.includes(themeTitle) && i.subcategory === subcategorySlug
  );
}

export function getThemeBySlug(slug: string): Theme | undefined {
  return allThemes.find((t) => t.slug === slug);
}

/** Static paths for published and draft interactives (not ideas). */
export function getStaticPaths() {
  return allInteractives
    .filter((i) => i.status !== "idea")
    .map((i) => ({
      params: { slug: i.slug },
    }));
}
