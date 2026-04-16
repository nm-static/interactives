import * as React from 'react';

import { cn } from '@/lib/utils';

const PATTERN_ID = 'hatch-radial-dots';

/**
 * Subtle dot grid with a radial fade (stronger toward center, soft at edges).
 */
export function HatchRadialSvgPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden',
        '[mask-image:radial-gradient(ellipse_72%_68%_at_50%_42%,black_18%,black_45%,transparent_100%)]',
        '[-webkit-mask-image:radial-gradient(ellipse_72%_68%_at_50%_42%,black_18%,black_45%,transparent_100%)]',
        className,
      )}
    >
      <svg
        className="text-border/50 dark:text-border/35 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={PATTERN_ID}
            width={22}
            height={22}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={2} cy={2} r={1} fill="currentColor" opacity={0.45} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${PATTERN_ID})`} />
      </svg>
    </div>
  );
}
