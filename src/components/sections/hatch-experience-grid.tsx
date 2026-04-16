'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { HatchSectionHeader } from './hatch-section-header';

type ExperienceItem = {
  range: string;
  title: string;
  description: string;
};

type HatchExperienceGridProps = {
  heading?: string;
  items?: ExperienceItem[];
};

const DEFAULT_ITEMS: ExperienceItem[] = [
  {
    range: '2019 – 2021',
    title: 'Senior Product Designer',
    description:
      'Led design for 3 product lines. Built design systems used by 50+ engineers. Increased conversion by 34%.',
  },
  {
    range: '2017 – 2019',
    title: 'Designer + Lead',
    description:
      'Designed entire product from concept to launch. Built brand identity and marketing site. Grew from 5 to 50 employees.',
  },
  {
    range: '2015 – Present',
    title: 'Freelance Designer',
    description:
      'Worked with 50+ clients across SaaS, e-commerce, and startups. Built trusted relationships and repeat business.',
  },
];

function ExperienceCard({
  item,
  spanFull = false,
}: {
  item: ExperienceItem;
  spanFull?: boolean;
}) {
  return (
    <article
      className={cn(
        'group flex flex-col rounded-2xl px-2 py-6 text-left sm:px-4 sm:py-8',
        'hover:bg-muted/50 transition-colors',
        spanFull && 'lg:col-span-2',
      )}
    >
      <div className="text-hatch-cta text-[10px] font-semibold tracking-[0.28em]">
        {item.range}
      </div>

      <h3 className="font-body mt-4 text-xl font-semibold tracking-tight">
        {item.title}
      </h3>

      <p className="text-muted-foreground mt-3 text-sm leading-[1.6]">
        {item.description}
      </p>
    </article>
  );
}

export default function HatchExperienceGrid({
  heading = 'Experience',
  items = DEFAULT_ITEMS,
}: HatchExperienceGridProps) {
  return (
    <section className="bg-background relative isolate overflow-hidden">
      <div className="section-padding relative container">
        <HatchSectionHeader title={heading} />
        <div className="mx-auto mt-14 w-full lg:mt-16">
          <div className="grid w-full items-stretch gap-6 sm:grid-cols-2">
            {items.map((item, i) => (
              <ExperienceCard
                key={`${item.range}-${item.title}`}
                item={item}
                spanFull={i === 2}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
