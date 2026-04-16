'use client';

import { ArrowRight } from 'lucide-react';
import * as React from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type HatchHeroProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
};

const AVATARS = [
  '/images/avatars/avatar-1.webp',
  '/images/avatars/avatar-2.webp',
  '/images/avatars/avatar-3.webp',
  '/images/avatars/avatar-4.webp',
];

export default function HatchHero({
  primaryCtaHref = '/contact',
  primaryCtaLabel = 'Get a quote',
  secondaryCtaHref = '/contact',
  secondaryCtaLabel = 'Book a call',
}: HatchHeroProps) {
  return (
    <section className="bg-background relative overflow-hidden">
      <div className="relative pt-16 pb-10 sm:pt-20 sm:pb-12 lg:pt-24 lg:pb-14">
        <div className="container text-start">
          <h1 className="font-display text-4xl leading-[1.06] font-medium text-balance sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            I design digital products that make
            <br className="hidden sm:block" /> business feel simple.
          </h1>
          <p className="font-text text-muted-foreground mt-6 text-base leading-[140%]">
            Freelance{' '}
            <span className="text-foreground decoration-border font-medium underline decoration-dotted underline-offset-4">
              Product Designer
            </span>{' '}
            helping startups and agencies craft clean,{' '}
            <span className="text-foreground decoration-border font-medium underline decoration-dotted underline-offset-4">
              Conversion-Focused Interfaces.
            </span>
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button
              asChild
              variant="hatch"
              className="w-full min-w-0 sm:w-auto sm:min-w-[160px]"
              aria-label={primaryCtaLabel}
            >
              <a href={primaryCtaHref}>
                {primaryCtaLabel}
                <ArrowRight className="ml-0.5" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full min-w-0 sm:w-auto sm:min-w-[160px]"
            >
              <a href={secondaryCtaHref}>{secondaryCtaLabel}</a>
            </Button>
          </div>
          <div className="mt-7 flex items-start justify-start sm:mt-8">
            <div className="bg-muted text-muted-foreground flex min-h-10 items-center gap-3 rounded-full py-1 pr-5 pl-2 text-sm">
              <div className="flex -space-x-2">
                {AVATARS.map((src, i) => (
                  <Avatar
                    key={src}
                    className="bg-muted relative size-7 border-2 border-white"
                  >
                    <img
                      src={src}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      sizes="28px"
                      loading={i < 2 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </Avatar>
                ))}
              </div>
              <span className="leading-snug">
                The work that’s trusted by teams and founders
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
