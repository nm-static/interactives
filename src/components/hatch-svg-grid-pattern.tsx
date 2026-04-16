import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Static SVG grid (Scalar-style) — no canvas / rAF, better for perf than animated canvas patterns.
 */
export function HatchSvgGridPattern({
  className,
  cellSize = 12,
  gap = 2,
}: {
  className?: string;
  cellSize?: number;
  gap?: number;
}) {
  const step = cellSize + gap;
  const id = React.useId();

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
    >
      <svg
        className="text-border/55 dark:text-border/35 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={id}
            width={step}
            height={step}
            patternUnits="userSpaceOnUse"
          >
            <rect
              x={0}
              y={0}
              width={cellSize}
              height={cellSize}
              fill="currentColor"
              opacity={0.35}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
