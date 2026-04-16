#!/usr/bin/env bash
#
# sync-blog.sh
#
# Syncs blog posts from the Obsidian vault to the Astro content directory.
#
# Source: /Users/neeldhara/repos/nm-obsidian/public/subdomains/interactives/blog/
#   Structure: <slug>/blog.md
#
# Destination: src/content/blog/
#   Structure: <slug>.md
#
# The script:
#   1. Scans the source directory for folders containing blog.md
#   2. Copies each blog.md to src/content/blog/<slug>.md
#   3. Removes any destination files whose source folder no longer exists
#   4. Reports what changed
#
# Usage:
#   ./scripts/sync-blog.sh          # sync
#   ./scripts/sync-blog.sh --dry-run  # preview changes without writing

set -euo pipefail

OBSIDIAN_BLOG="/Users/neeldhara/repos/nm-obsidian/public/subdomains/interactives/blog"
ASTRO_BLOG="src/content/blog"

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "=== DRY RUN ==="
fi

# Ensure destination exists
mkdir -p "$ASTRO_BLOG"

added=0
updated=0
removed=0
unchanged=0

# --- Sync from Obsidian → Astro ---

if [[ ! -d "$OBSIDIAN_BLOG" ]]; then
  echo "Error: Source directory not found: $OBSIDIAN_BLOG"
  exit 1
fi

for dir in "$OBSIDIAN_BLOG"/*/; do
  # Skip if not a directory
  [[ -d "$dir" ]] || continue

  slug=$(basename "$dir")
  src="$dir/blog.md"
  dest="$ASTRO_BLOG/$slug.md"

  if [[ ! -f "$src" ]]; then
    echo "  SKIP  $slug (no blog.md found)"
    continue
  fi

  if [[ -f "$dest" ]]; then
    # Compare contents
    if diff -q "$src" "$dest" > /dev/null 2>&1; then
      unchanged=$((unchanged + 1))
      continue
    else
      echo "  UPDATE  $slug"
      updated=$((updated + 1))
    fi
  else
    echo "  ADD     $slug"
    added=$((added + 1))
  fi

  if [[ "$DRY_RUN" == false ]]; then
    cp "$src" "$dest"
  fi
done

# --- Remove orphaned files in Astro that no longer exist in Obsidian ---

for dest in "$ASTRO_BLOG"/*.md; do
  [[ -f "$dest" ]] || continue

  filename=$(basename "$dest")
  # Skip .gitkeep or non-md files
  [[ "$filename" == ".gitkeep" ]] && continue

  slug="${filename%.md}"
  src_dir="$OBSIDIAN_BLOG/$slug"

  if [[ ! -d "$src_dir" ]] || [[ ! -f "$src_dir/blog.md" ]]; then
    echo "  REMOVE  $slug (source no longer exists)"
    removed=$((removed + 1))
    if [[ "$DRY_RUN" == false ]]; then
      rm "$dest"
    fi
  fi
done

echo ""
echo "Done: $added added, $updated updated, $removed removed, $unchanged unchanged"
