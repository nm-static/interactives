'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import HatchPatternBackground from '../ui/hatch-pattern-background';


type Value = {
  title: string;
  body: string;
};

const VALUES: Value[] = [
  {
    title: 'User-Centered',
    body: 'Every pixel serves the user. I start with research and empathy, not assumptions.',
  },
  {
    title: 'Clear & Simple',
    body: "I believe in removing friction. If it's hard to understand, it's not finished.",
  },
  {
    title: 'Collaborative',
    body: 'Great work happens in teams. I love working with developers, marketers, and founders.',
  },
  {
    title: 'Thoughtful Details',
    body: 'Polish matters. Micro-interactions, spacing, typography—the details create delight.',
  },
];

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

function StepDots({
  active,
  onChange,
  className,
}: {
  active: number;
  onChange: (idx: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {VALUES.map((_, i) => {
        const isActive = i === active;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-pressed={isActive}
            className={cn(
              'flex size-9 items-center justify-center rounded-full border text-sm transition-colors',
              isActive
                ? 'border-[var(--hatch-cta)] bg-[var(--hatch-cta)] text-white'
                : 'bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

function DesktopCard({ title, body, active }: Value & { active: boolean }) {
  return (
    <div
      className={cn(
        'bg-muted h-full rounded-[18px] border p-8',
        'transition-opacity duration-300',
        active ? 'opacity-100' : 'opacity-100',
      )}
    >
      <h3 className="font-display text-xl leading-tight sm:text-2xl">
        {title}
      </h3>

      <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
        {body}
      </p>
    </div>
  );
}

function useStepHeights(count: number) {
  const nodesRef = React.useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = React.useState<number[]>(
    Array.from({ length: count }, () => 0),
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const ro = new ResizeObserver(() => {
      const next = nodesRef.current.map((n) => (n ? n.offsetHeight : 0));
      setHeights(next);
    });

    nodesRef.current.forEach((n) => {
      if (n) ro.observe(n);
    });

    const next = nodesRef.current.map((n) => (n ? n.offsetHeight : 0));
    setHeights(next);

    return () => ro.disconnect();
  }, [count]);

  const setNode = React.useCallback(
    (idx: number) => (node: HTMLDivElement | null) => {
      nodesRef.current[idx] = node;
    },
    [],
  );

  return { heights, setNode };
}

export default function HatchValues() {
  const [active, setActive] = React.useState(0);

  const GAP = 16;
  const FALLBACK_CARD_H = 168;

  const { heights, setNode } = useStepHeights(VALUES.length);

  const viewportH =
    (heights[0] || FALLBACK_CARD_H) +
    (heights[1] || FALLBACK_CARD_H) +
    (heights[2] || FALLBACK_CARD_H) +
    GAP * 2;

  const offsetY = -(
    heights
      .slice(0, active)
      .reduce((acc, h) => acc + (h || FALLBACK_CARD_H), 0) +
    active * GAP
  );

  return (
    <section className="bg-background relative isolate overflow-hidden">
      <HatchPatternBackground
        cycleMs={3200}
        animateAccents={false}
        className="z-0"
      />

      <div className="section-padding z-20 container">
        <div className="mx-auto grid max-w-3xl gap-16 lg:grid-cols-[330px_388px]">
          <div className="flex flex-col">
            <StepDots active={active} onChange={setActive} />

            <h2 className="font-display mt-8 text-[28px] leading-[1.05]">
              My Values
            </h2>

            <p className="text-muted-foreground mt-4 max-w-[42ch] text-base leading-relaxed">
              These principles guide every project and decision I make.
            </p>

            <div className="mt-16 flex gap-4">
              <Button
                asChild
                variant="hatch"
                className="h-11 w-auto rounded-full px-6"
              >
                <a href="/contact">
                  Get a quote <ArrowRight className="ml-2 size-4" />
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-11 w-auto rounded-full px-6"
              >
                <a href="/contact">Book a call</a>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative" style={{ height: viewportH }}>
              <motion.div
                className="absolute inset-x-0 top-0"
                animate={{ y: offsetY }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <div className="flex flex-col gap-4">
                  {VALUES.map((v, i) => (
                    <div key={v.title} ref={setNode(i)}>
                      <DesktopCard {...v} active={i === active} />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <div className="space-y-4 lg:hidden">
            {VALUES.map((v, i) => {
              const open = i === active;
              return (
                <div
                  key={v.title}
                  className={cn(
                    'bg-muted rounded-[18px] border px-6 py-5',
                    open ? 'opacity-100' : 'opacity-100',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="w-full text-left"
                    aria-expanded={open}
                  >
                    <div className="font-display text-[22px] leading-tight">
                      {v.title}
                    </div>
                  </button>

                  <div
                    className={cn(
                      'grid transition-[grid-template-rows,opacity] duration-300',
                      open
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="text-muted-foreground mt-3 text-base leading-relaxed">
                        {v.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 hidden h-80 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black)] backdrop-blur-[2px] lg:block" />
    </section>
  );
}
