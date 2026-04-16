'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

function dedupeOrdered(urls: string[]) {
  const seen = new Set<string>();
  return urls.filter((u) => {
    if (!u || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

export function ProjectGallery({
  gallery,
  initial,
  className,
}: {
  gallery: string[];
  initial?: string;
  className?: string;
}) {
  const images = React.useMemo(
    () => dedupeOrdered(gallery.filter(Boolean)),
    [gallery],
  );

  const [active, setActive] = React.useState<string>(
    initial ?? images[0] ?? '',
  );

  React.useEffect(() => {
    const next = initial ?? images[0] ?? '';
    setActive(next);
  }, [initial, images]);

  const railRef = React.useRef<HTMLDivElement | null>(null);

  const index = Math.max(0, images.indexOf(active));

  function setByIndex(nextIndex: number) {
    if (!images.length) return;
    const i = ((nextIndex % images.length) + images.length) % images.length;
    setActive(images[i]);
  }

  function prev() {
    setByIndex(index - 1);
  }

  function next() {
    setByIndex(index + 1);
  }

  React.useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const btn = el.querySelector<HTMLButtonElement>(
      `button[data-thumb="${CSS.escape(active)}"]`,
    );
    if (!btn) return;

    const left = btn.offsetLeft;
    const right = left + btn.offsetWidth;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;

    if (left < viewLeft) el.scrollTo({ left, behavior: 'smooth' });
    else if (right > viewRight)
      el.scrollTo({ left: right - el.clientWidth, behavior: 'smooth' });
  }, [active]);

  if (!images.length) return null;

  return (
    <div className={cn('mt-10', className)}>
      <div className="bg-muted relative overflow-hidden rounded-[24px] border">
        <div className="relative aspect-video w-full">
          <img
            src={active}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            sizes="(min-width: 1024px) 960px, 92vw"
          />
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className={cn(
                'absolute bottom-3 left-4 z-20',
                'bg-background/80 grid size-10 place-items-center rounded-full border backdrop-blur',
                'hover:bg-background shadow-xs transition-colors',
              )}
            >
              <ChevronLeft className="size-4" />
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className={cn(
                'absolute right-4 bottom-3 z-20',
                'bg-background/80 grid size-10 place-items-center rounded-full border backdrop-blur',
                'hover:bg-background shadow-xs transition-colors',
              )}
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="relative mt-5">
          <div
            ref={railRef}
            className={cn(
              'flex gap-4 overflow-x-auto pb-2',
              'overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
            )}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {images.map((src) => {
              const selected = src === active;
              return (
                <button
                  key={src}
                  type="button"
                  data-thumb={src}
                  onClick={() => setActive(src)}
                  aria-pressed={selected}
                  className={cn(
                    'bg-muted border-border relative h-[74px] w-[140px] shrink-0 overflow-hidden rounded-xl border',
                    'sm:h-[84px] sm:w-[160px]',
                    'transition-colors',
                    selected && 'border-hatch-cta',
                  )}
                >
                  <img
                    src={src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    sizes="160px"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
