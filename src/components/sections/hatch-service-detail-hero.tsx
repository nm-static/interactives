'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ServiceDetailProps = {
  backHref?: string;
  title?: string;
  description?: string;

  price?: string;
  priceMeta?: string;

  primaryCtaLabel?: string;
  primaryCtaHref?: string;

  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export default function HatchServiceDetail({
  backHref = '/services',
  title = 'Web Design & UX',
  description = `I design websites with a focus on user behavior, conversion goals, and scalability—combining strategy, research, and design to craft seamless experiences.`,
  price = '$1,500',
  priceMeta = 'Base Fee',
  primaryCtaLabel = 'Get a quote',
  primaryCtaHref = '/contact',
  secondaryCtaLabel = 'Other services',
  secondaryCtaHref = '/services',
}: ServiceDetailProps) {
  return (
    <section className="bg-background">
      <div className="container pt-6 pb-10 sm:pt-8 sm:pb-12">
        <Button
          asChild
          variant="outline"
          className="mb-6 h-7 w-auto rounded-full px-3 text-xs"
        >
          <a href={backHref}>
            <ArrowLeft className="mr-1 size-3.5" />
            Back
          </a>
        </Button>

        <h1 className="font-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-[1.6] sm:text-base">
          {description}
        </p>

        <div className="mt-10 flex flex-wrap items-baseline gap-2">
          <span className="font-display text-3xl tracking-[-0.02em]">{price}</span>
          {priceMeta ? (
            <span className="text-muted-foreground text-xs">{priceMeta}</span>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button asChild variant="hatch" className="h-10 rounded-full px-5">
            <a href={primaryCtaHref}>
              {primaryCtaLabel}
              <ArrowRight className="ml-1 size-4" />
            </a>
          </Button>

          <Button asChild variant="outline" className="h-10 rounded-full px-5">
            <a href={secondaryCtaHref}>{secondaryCtaLabel}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
