'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Plus } from 'lucide-react';
import * as React from 'react';

import { PrimarySvgIcon } from '@/components/primary-svg-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { HatchSectionHeader } from './hatch-section-header';

type Service = {
  title: string;
  description?: string;
  category: string;
  /** Public SVG path for `PrimarySvgIcon` (filled with `bg-primary`) */
  iconSrc: string;
  slug: string;
};

type HatchWhatICanDoProps = {
  title?: string;
  description?: string;
  /** Hide section title + description (e.g. minimal homepage). */
  hideHeader?: boolean;
  /** Short one-line points; + icons align to the top of each row. */
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  services?: Service[];
};

const DEFAULT_BULLETS: string[] = [
  'Strategy through launch in one thread.',
  'Handoff-ready files and specs.',
  'Async collaboration, clear milestones.',
  'Systems and patterns that scale.',
  'Outcome-focused — ship with confidence.',
];

const DEFAULT_SERVICES: Service[] = [
  {
    title: 'Brand Design',
    category: 'Brand',
    description: 'Clear visual identities that stand out and scale.',
    iconSrc: '/images/services/noun-sparkle-7746005.svg',
    slug: 'brand-design',
  },
  {
    title: 'Web Design & UX',
    category: 'UX & Web',
    description:
      'Beautiful, conversion-focused websites that feel effortless to use.',
    iconSrc: '/images/services/noun-half-circles-7745954.svg',
    slug: 'web-design-ux',
  },
  {
    title: 'Product Design',
    category: 'Product',
    description:
      'Scalable component libraries for consistent, efficient UI design.',
    iconSrc: '/images/services/noun-semicircles-8294628.svg',
    slug: 'product-design',
  },
  {
    title: 'Framer Development',
    category: 'Build',
    description: 'Interactive sites built fast without compromising quality.',
    iconSrc: '/images/services/noun-star-7745963.svg',
    slug: 'framer-development',
  },
];

const rowMotion = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function HatchWhatICanDo({
  title = 'Our services',
  description = 'End-to-end design support for founders, teams, and agencies that care about detail.',
  hideHeader = false,
  bullets = DEFAULT_BULLETS,
  ctaLabel = 'Get started',
  ctaHref = '/contact',
  services = DEFAULT_SERVICES,
}: HatchWhatICanDoProps) {
  const list = services.slice(0, 4);

  return (
    <section className="bg-background relative">
      <div
        className={cn(
          'container',
          hideHeader
            ? 'pt-12 pb-12 sm:pt-14 sm:pb-14 lg:pt-16 lg:pb-16'
            : 'pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20',
        )}
      >
        {hideHeader ? null : (
          <HatchSectionHeader
            title={title}
            description={description}
            descriptionClassName="text-end"
          />
        )}

        <div
          className={cn(
            'grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16 xl:gap-20',
            hideHeader ? 'mt-0' : 'mt-10 lg:mt-12',
          )}
        >
          <motion.div
            className="flex flex-col gap-7"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-border/40 h-px w-full" />
            <ul className="flex flex-col gap-3.5 tracking-tight">
              {bullets.map((line, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-primary ring-primary/25 grid size-6 shrink-0 place-items-center rounded-full ring-1">
                    <Plus className="size-3.5" strokeWidth={2} />
                  </span>
                  <p className="text-foreground line-clamp-1 min-w-0 flex-1 text-sm leading-snug font-medium sm:text-[15px]">
                    {line}
                  </p>
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant="outline"
              className="mt-1 h-10 w-fit shrink-0 rounded-full px-5 text-sm"
            >
              <a href={ctaHref}>
                {ctaLabel} <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </motion.div>

          <div className="border-border/40 divide-border/40 flex flex-col divide-y lg:col-span-2">
            {list.map((service, index) => (
              <motion.div
                key={service.slug}
                initial={rowMotion.initial}
                whileInView={rowMotion.whileInView}
                viewport={rowMotion.viewport}
                transition={{
                  ...rowMotion.transition,
                  delay: index * 0.06,
                }}
              >
                <a
                  href={`/services/${service.slug}`}
                  className={cn(
                    'group flex items-start gap-5 py-6 transition-colors sm:py-7 lg:gap-6',
                    'hover:text-foreground',
                  )}
                >
                  <div className="relative shrink-0 pt-0.5">
                    <PrimarySvgIcon
                      src={service.iconSrc}
                      className={cn(
                        'size-11 sm:size-12',
                        'motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out',
                        'group-hover:scale-[1.06]',
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-foreground text-lg font-medium tracking-tight">
                        {service.title}
                      </span>
                      <span className="text-muted-foreground text-sm font-normal tracking-tight">
                        {service.category}
                      </span>
                    </div>
                    {service.description ? (
                      <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
                        {service.description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'text-foreground mt-1.5 hidden shrink-0 sm:block',
                      'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out',
                      'group-hover:translate-x-0.5',
                    )}
                  >
                    <ArrowUpRight className="size-5" strokeWidth={1.75} />
                  </span>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
