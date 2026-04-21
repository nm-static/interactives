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

Client code in `src/lib/admin.ts` keeps state in `localStorage` (auth flag, notes, status overrides, ideas, todos) and mirrors every write to `POST /api/admin`. The password is hard-coded (`ADMIN_PASSWORD = "yukti2025"` both client- and server-side; the server allows override via env var) — this is a personal tool, not a real auth boundary.

The Netlify function persists state by committing to this same repo via the GitHub Contents API:
- `src/data/admin-data.json` — notes, status overrides, ideas, todos. Bundled at build time and imported as a fallback when the API is unreachable (e.g. under `astro dev`).
- `src/lib/interactives.ts` — for `commitStatus` and `deleteInteractive`, the function text-edits this source file and commits the result. Commits from the admin UI use descriptive messages like `admin: set <slug> to <status>`.

Requires `GITHUB_TOKEN` env var on Netlify; without it, writes silently no-op.

### Green screen mode

Interactives marked `hasGreenScreen: true` can be wrapped in `GreenScreenWrapper` to render on a pure `#00ff00` background with forced black/white foreground colors (for chroma-keying into videos). The wrapper injects `!important` CSS overrides; be aware when debugging styling inside one.

### Aliases and conventions

TS path aliases from `tsconfig.json`: `@/*` → `src/*`, plus `@components/*`, `@layouts/*`, `@lib/*`. shadcn aliases in `components.json` point components to `@/components`, utils to `@/lib/utils` (the `cn()` helper). Tailwind 4 is wired via `@tailwindcss/vite` (no tailwind.config.js); design tokens live in `src/styles/global.css`. Icon library is `lucide-react`.

ESLint enforces `simple-import-sort` — imports and exports get auto-sorted on `lint:fix`.

### Build gotchas

`astro.config.mjs` sanitizes Rollup chunk filenames (`[^\w./-]` → `_`) and pins esbuild to `es2022` / `utf8` — these work around Netlify's esbuild choking on `!` and `~` in chunk names. Don't revert without retesting on Netlify. `netlify.toml` also disables Netlify's own JS/CSS bundling so Vite's output is shipped as-is.
