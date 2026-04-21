# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # astro dev (local dev server)
npm run build        # astro build → dist/ (static output)
npm run preview      # serve built site
npm run lint         # ESLint over .js/.jsx/.ts/.tsx/.astro
npm run lint:fix     # auto-fix lint issues
npm run format       # prettier --write .
npm run format:check # prettier --check .
```

No test suite is configured. Requires Node >= 22.12.0.

`src/components/ui/**` is ignored by ESLint (shadcn-generated code).

## Architecture

Astro 6 + React 19 + Tailwind 4 + shadcn/ui. Output is `static` (`astro.config.mjs`). The site is deployed to Netlify; a single serverless function (`netlify/functions/admin.mts`, routed at `/api/admin`) backs the admin UI. The root README and `components.json` still reference the Hatch template this was forked from — marketing/sections components (`src/components/sections/hatch-*`) and the work/services MDX collections are leftover from that template.

### The interactives system (core content)

Each interactive is a self-contained React component in `src/components/interactives/<Name>.tsx` — they freely import shadcn UI, framer-motion, katex, recharts, canvas-confetti, three/@react-three/fiber, etc. Many are 500–2000+ LOC single-file components with their own state machines.

Three registrations must be kept in sync when adding or renaming an interactive:

1. **`src/lib/interactives.ts`** — the canonical registry. Exports `allInteractives` (with `slug`, `title`, `description`, `tags`, `themes`, optional `subcategory`, `dateAdded`, `hasGreenScreen`, `status: "published" | "draft" | "idea"`) and `allThemes`. `publishedInteractives` filters out drafts/ideas; this is what public pages use. `getStaticPaths()` here drives the `/i/[slug]` and `/embed/[slug]` routes and excludes `idea` entries.
2. **`src/components/InteractiveRenderer.tsx`** — a `componentMap` of `slug → () => import(...)` that lazy-loads the component. `<InteractiveRenderer client:load slug={...} />` is the single entry point used by both the full page and embed routes.
3. **`src/lib/interactive-components.ts`** — a second near-duplicate componentMap. Both must be updated together (the duplication is historical; grep for the slug before editing).

The admin API (`applyStatusChange` / `applyDelete` in `netlify/functions/admin.mts`) parses `src/lib/interactives.ts` with string matching against `slug: "..."` and `status: "..." as const,`. Preserve that exact formatting when editing entries — otherwise admin-driven status commits and deletes will silently fail.

### Routing

- `/` → `HomepageHero` (`src/pages/index.astro`)
- `/i/[slug]` → full interactive page with navbar, breadcrumb, admin bar, share bar (`InteractiveLayout`)
- `/embed/[slug]` → same interactive in a bare shell (`EmbedLayout`) for iframe embedding; generated for every non-idea interactive
- `/themes` and `/themes/[theme]` → theme landing pages. "Discrete Math" is the one theme with subcategories (rendered via `ThemeContent` and `/themes/discrete-math/[sub]`); other themes list interactives directly and show an `AddIdeaForm` when the admin is logged in.
- `/admin` → unlinked dashboard (`<meta name="robots" content="noindex">`)
- Blog (`/blog`, `/blog/[...slug]`) reads from the `blog` content collection (`src/content.config.ts`). `scripts/sync-blog.sh` copies posts from a hardcoded Obsidian vault path — it only works on the author's machine.

### Admin system

Client code in `src/lib/admin.ts` keeps state in `localStorage` (auth flag, notes, status overrides, ideas, todos) and mirrors every write to `POST /api/admin`. The admin password is hard-coded in `src/lib/admin.ts` and echoed in the Netlify function (override via the `ADMIN_PASSWORD` env var in production) — this is a personal tool, not a real auth boundary. Don't add secrets here.

The Netlify function persists state by committing to this same repo via the GitHub Contents API:
- `src/data/admin-data.json` — notes, status overrides, ideas, todos. Bundled at build time and imported as a fallback when the API is unreachable (e.g. under `astro dev`).
- `src/lib/interactives.ts` — for `commitStatus` and `deleteInteractive`, the function text-edits this source file and commits the result. Commits from the admin UI use descriptive messages like `admin: set <slug> to <status>`.

Requires `GITHUB_TOKEN` env var on Netlify; without it, writes silently no-op.

### Green screen mode

Interactives marked `hasGreenScreen: true` can be wrapped in `GreenScreenWrapper` to render on a pure `#00ff00` background with forced black/white foreground colors (for chroma-keying into videos). The wrapper injects `!important` CSS overrides; be aware when debugging styling inside one.

### Aliases and conventions

TS path aliases from `tsconfig.json`: `@/*` → `src/*`, plus `@components/*`, `@layouts/*`, `@lib/*`. shadcn aliases in `components.json` point components to `@/components`, utils to `@/lib/utils` (the `cn()` helper). Tailwind 4 is wired via `@tailwindcss/vite` (no tailwind.config.js); design tokens live in `src/styles/global.css`. Icon library is `lucide-react`.

ESLint enforces `simple-import-sort` — imports and exports get auto-sorted on `lint:fix`.

## Design & aesthetics

The site has a distinctive editorial-meets-playful feel: serif display type over restrained neutrals, one warm red-orange accent, and generous whitespace. Interactives are the payoff — they should feel polished and a little delightful, not enterprise-CRUD.

**Reach for shadcn before hand-rolling.** `Card` / `CardHeader` / `CardTitle` / `CardContent` is the canonical container for an interactive's sections. `Button`, `Badge`, `Alert`, `Tabs`, `Dialog`, `Slider`, `Switch`, `Tooltip`, `Input`, `Label` are already themed and wired up — use them. Edit `src/components/ui/*` only with deliberate reason (ESLint ignores this dir because it's shadcn-generated).

**Always use design tokens, never raw hex.** Colors live as CSS variables in `src/styles/global.css` and are exposed as Tailwind utilities:
- Surfaces: `bg-background`, `bg-card`, `bg-muted`, `bg-accent`
- Text: `text-foreground`, `text-muted-foreground`
- Brand accent: `bg-primary` / `text-primary` / `text-primary-foreground` — use sparingly, for true calls-to-action
- Borders: `border-border`
- Status: `text-destructive`, `text-success`, chart colors `chart-1`..`chart-5`

Colors are authored in OKLCH. If you need a shade that isn't in the palette, add a token rather than inlining.

**Dark mode is mandatory.** The `.dark` class on `<html>` flips the tokens. Any literal tailwind color (`bg-green-100`, `text-amber-700`, etc.) *must* come with a `dark:` counterpart — see `ThreeBankAccounts.tsx`'s `RANK_COLORS` for the pattern. Better yet, lean on design tokens so dark mode is automatic.

**Typography.** Castoro (serif) for `h1`/`h2` via `.font-display`; Imprima/Geist (sans) for body and `h3+`. This pairing is load-bearing for the editorial feel — don't swap `h1` to sans on a whim. The `container` utility caps at 1200px; `container-sm` caps at 960px for denser reading layouts.

**Radii.** Base `--radius` is `0.625rem`, exposed as `rounded-sm` → `rounded-4xl` on the Tailwind scale. Cards and panels are typically `rounded-xl`; pill buttons/badges are `rounded-full`; small chips are `rounded-md`.

**Motion and delight.** `framer-motion` for layout/presence animations, `canvas-confetti` for win states and discovery moments, `katex` for math (`katex/dist/katex.min.css` must be imported where used). `prefers-reduced-motion` is honored globally in `global.css` — you don't need to guard individual transitions, but don't gate critical state changes behind animation either.

**Interactive layout patterns.** Looking across the folder, published interactives tend to:
- Open with a short framing `Alert` or intro card explaining the premise
- Put the play area center stage, controls below or to the side
- Use `Tabs` to separate modes (e.g. *Play / Explore / Solution* in `ThreeBankAccounts`)
- Use `Badge` for status, tags, and hint chips
- Reset with a `RotateCcw` icon button; celebrate wins with confetti + a toast (`sonner` is wired up)
- Stay responsive — test at mobile widths, since these embed into blog posts and videos

**Taste defaults.** Prefer fewer, cleaner controls over exhaustive settings. If a new feature needs an options panel, that's a signal to reconsider the UX. When in doubt, match the visual weight and density of an existing, well-regarded interactive in the same theme rather than inventing a new idiom.

### Build gotchas

`astro.config.mjs` sanitizes Rollup chunk filenames (`[^\w./-]` → `_`) and pins esbuild to `es2022` / `utf8` — these work around Netlify's esbuild choking on `!` and `~` in chunk names. Don't revert without retesting on Netlify. `netlify.toml` also disables Netlify's own JS/CSS bundling so Vite's output is shipped as-is.
