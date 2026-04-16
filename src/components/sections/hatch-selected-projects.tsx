import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/project-work';
import { cn } from '@/lib/utils';

import { HatchSectionHeader } from './hatch-section-header';

const DEFAULT_TITLE = 'Selected Projects';
const DEFAULT_DESCRIPTION =
  'A few recent collaborations that show how good design drives clarity and results.';

type Props = {
  projects: Project[];
  limit?: number;
  /** Hide section title + description (e.g. minimal homepage). */
  hideHeader?: boolean;
  /** Overrides the default section title when the header is shown. */
  title?: string;
  /** Overrides the default section description when the header is shown. */
  description?: string;
};

export default function HatchSelectedProjects({
  projects,
  limit,
  hideHeader = false,
  title,
  description,
}: Props) {
  const featured = projects.filter((p) => p.featured);
  const items = featured.slice(0, limit ?? 6);

  return (
    <section className="bg-background">
      <div
        className={cn(
          'container pb-0',
          hideHeader ? 'pt-4 sm:pt-6 lg:pt-8' : 'pt-14 sm:pt-16 lg:pt-20',
        )}
      >
        {hideHeader ? null : (
          <HatchSectionHeader
            title={title ?? DEFAULT_TITLE}
            description={description ?? DEFAULT_DESCRIPTION}
            descriptionClassName="text-end"
          />
        )}
        <div
          className={cn(
            'grid gap-10 lg:grid-cols-3',
            hideHeader ? 'mt-0' : 'mt-10 lg:mt-12',
          )}
        >
          {items.map((p, i) => (
            <article
              key={p.slug}
              className={cn(i >= 3 && 'hidden lg:block')}
            >
              <a href={`/work/${p.slug}`} className="group block">
                <div className="bg-muted relative overflow-hidden rounded-xl">
                  <div className="relative aspect-[16/9] w-full border">
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(min-width:1024px) 360px, 92vw"
                      loading={i < 2 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>

                  <div
                    className={cn(
                      'pointer-events-none absolute inset-0',
                      'bg-foreground/0 transition-colors duration-200',
                      'group-hover:bg-foreground/20',
                    )}
                  />

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="bg-background/90 text-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-xs backdrop-blur">
                      View project <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-foreground text-2xl leading-[140%] font-medium">
                    {p.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 line-clamp-2 text-base leading-[140%]">
                    {p.description}
                  </p>
                </div>
              </a>
            </article>
          ))}
        </div>

        <div
          className={cn(
            'flex min-h-[3rem] flex-wrap items-center justify-center gap-4 sm:min-h-0',
            hideHeader ? 'mt-12' : 'section-gap mt-16',
          )}
        >
          <div className="bg-border hidden h-px min-w-[2rem] flex-1 sm:block" />
          <Button
            asChild
            variant="outline"
            className="h-10 shrink-0 rounded-full px-5 text-sm"
          >
            <a href="/work">
              View more <ArrowRight className="ml-1 size-4" />
            </a>
          </Button>
          <div className="bg-border hidden h-px min-w-[2rem] flex-1 sm:block" />
        </div>
      </div>
    </section>
  );
}
