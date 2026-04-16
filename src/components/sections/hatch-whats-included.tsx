'use client';

import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { HatchSectionHeader } from './hatch-section-header';

type IncludedColumn = {
  iconSrc: string;
  iconAlt: string;
  title: string;
  items: string[];
};

const INCLUDED: IncludedColumn[] = [
  {
    iconSrc: '/icons/pricing/project.svg',
    iconAlt: 'Discovery icon',
    title: 'Discovery & Strategy',
    items: [
      'Competitive Analysis',
      'User Research & Personas',
      'Information Architecture',
      'Customer Journey Mapping',
    ],
  },
  {
    iconSrc: '/icons/pricing/project.svg',
    iconAlt: 'Design icon',
    title: 'Design & Prototyping',
    items: [
      'Wireframes',
      'High-Fidelity Mockups',
      'Interactive Prototypes',
      'Design System Setup',
    ],
  },
  {
    iconSrc: '/icons/pricing/project.svg',
    iconAlt: 'Handoff icon',
    title: 'Handoff & Support',
    items: [
      'Developer Handoff Specs',
      'Design Documentation',
      'Component Library',
      'Design QA Support',
    ],
  },
];

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-muted-foreground flex gap-2 text-xs leading-[1.5]">
      <Check className="mt-[2px] size-3.5 text-[var(--hatch-cta)]" />
      <span>{children}</span>
    </li>
  );
}

function IncludedCard({ col }: { col: IncludedColumn }) {
  return (
    <div className="flex flex-col items-start text-left">
      <img
        src={col.iconSrc}
        alt={col.iconAlt}
        width={28}
        height={28}
        className="dark:invert"
        loading="lazy"
        decoding="async"
      />

      <h3 className="text-foreground mt-4 text-sm font-semibold">
        {col.title}
      </h3>

      <ul className="mt-4 space-y-2">
        {col.items.map((t) => (
          <ListItem key={t}>{t}</ListItem>
        ))}
      </ul>
    </div>
  );
}

function MetaPill({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-background/70 rounded-2xl px-6 py-5',
        'border-border/60 border',
        className,
      )}
    >
      <div className="text-[10px] font-semibold tracking-[0.28em] text-[var(--hatch-cta)]">
        {label}
      </div>
      <div className="font-display text-foreground mt-2 text-base leading-[1.2]">
        {value}
      </div>
    </div>
  );
}

type HatchWhatsIncludedProps = {
  /** Hide section title + description (e.g. minimal service detail). */
  hideHeader?: boolean;
};

export default function HatchWhatsIncluded({
  hideHeader = false,
}: HatchWhatsIncludedProps) {
  return (
    <section className="bg-background">
      <div className="section-padding container">
        {hideHeader ? null : (
          <HatchSectionHeader
            title="What's Included"
            description="Each project includes everything needed to launch your web design & UX successfully."
          />
        )}
        <div
          className={cn(
            'bg-muted mx-auto w-full rounded-[28px] px-6 py-8 sm:px-8 sm:py-10',
            hideHeader ? 'mt-0' : 'mt-10 sm:mt-12',
          )}
        >
          <div className={cn('grid gap-10', 'sm:grid-cols-3 sm:gap-8')}>
            {INCLUDED.map((col) => (
              <IncludedCard key={col.title} col={col} />
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2">
            <MetaPill
              label="TIMELINE"
              value="4–8 weeks depending on complexity."
            />
            <MetaPill label="IDEAL FOR" value="Startups & Growing Companies." />
          </div>
        </div>
      </div>
    </section>
  );
}
