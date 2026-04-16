'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/project-work';
import { cn } from '@/lib/utils';

type Props = {
  projects: Project[];
  initialCount?: number;
  pageSize?: number;
};

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

const itemVariants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: EASE },
  },
};

function ProjectCard({ p, priority }: { p: Project; priority?: boolean }) {
  return (
    <a href={`/work/${p.slug}`} className="group block">
      <div className="bg-muted relative z-0 overflow-hidden rounded-xl">
        <div className="relative z-0 aspect-[16/9] w-full border">
          <img
            src={p.coverImage}
            alt={p.title}
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(min-width:1024px) 360px, 92vw"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>

        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-10',
            'bg-foreground/0 transition-colors duration-200',
            'group-hover:bg-foreground/20',
          )}
        />

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="bg-background/90 text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-xs backdrop-blur">
            View project <ArrowRight className="size-4" />
          </span>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-foreground text-[22px] leading-[140%] font-medium sm:text-2xl">
          {p.title}
        </h3>
        <p className="text-muted-foreground mt-2 line-clamp-2 text-base leading-[140%]">
          {p.description}
        </p>
      </div>
    </a>
  );
}

export default function HatchWorkIndex({
  projects,
  initialCount = 9,
  pageSize = 9,
}: Props) {
  const items = React.useMemo(
    () => [...projects].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
    [projects],
  );

  const initialVisible = Math.min(initialCount, items.length);
  const [visible, setVisible] = React.useState(initialVisible);
  const [motionStartIndex, setMotionStartIndex] =
    React.useState(initialVisible);

  const canLoadMore = visible < items.length;
  const shown = items.slice(0, visible);

  const onLoadMore = () => {
    setMotionStartIndex(visible);
    setVisible((v) => Math.min(v + pageSize, items.length));
  };

  return (
    <section className="bg-background">
      <div className="section-padding container">
        <div className="mx-auto w-full">
          <h1 className="font-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
            Selected Work
          </h1>

          <p className="text-muted-foreground mt-4 text-sm leading-[1.7] sm:text-base">
            A collection of recent projects spanning product design, branding,
            and web development. Each project showcases strategic thinking,
            attention to detail, and measurable impact.
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:mt-12 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {shown.map((p, i) => {
            const isNew = i >= motionStartIndex;
            return (
              <motion.article
                key={p.slug}
                variants={itemVariants}
                initial={isNew ? 'hidden' : false}
                animate="show"
                layout
              >
                <ProjectCard p={p} priority={i < 2} />
              </motion.article>
            );
          })}
        </div>

        <div className="mt-12 flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            Showing {Math.min(visible, items.length)} of {items.length}
          </p>

          {canLoadMore ? (
            <Button
              variant="outline"
              className="h-10 rounded-full px-5 text-sm font-semibold sm:w-auto"
              onClick={onLoadMore}
            >
              Load more <ArrowRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full px-5 text-sm font-semibold sm:w-auto"
            >
              <a href="/contact">
                Let’s work together <ArrowRight className="ml-1 size-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
