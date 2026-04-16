'use client';

import { ArrowRight } from 'lucide-react';

import { HatchSvgGridPattern } from '@/components/hatch-svg-grid-pattern';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HatchCtaProps = {
  title?: string;
  /** Hide headline; button only (e.g. minimal homepage). */
  hideTitle?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

export default function HatchCta({
  title = 'Design That Works\nBeautifully.',
  hideTitle = false,
  ctaHref = '/contact',
  ctaLabel = 'Get a quote',
}: HatchCtaProps) {
  return (
    <section className="relative overflow-hidden">
      <HatchSvgGridPattern
        cellSize={11}
        gap={2}
        className="[mask-image:linear-gradient(to_bottom,transparent_0%,black_35%,black_100%)] opacity-[0.45] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_35%,black_100%)]"
      />
      <div className="section-padding relative z-10 container">
        <div className="relative mx-auto flex w-full flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-14">
          {hideTitle ? null : (
            <h2 className="font-display text-foreground text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              {title.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>
          )}

          <div className={cn(!hideTitle && 'mt-8')}>
            <Button asChild variant="hatch" className="rounded-full px-6">
              <a href={ctaHref} aria-label={ctaLabel}>
                {ctaLabel} <ArrowRight className="ml-1 size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
