'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type HatchAboutMeProps = {
  eyebrow?: string;
  title?: string;
  paragraphs?: string[];
  imageSrc?: string;
  imageAlt?: string;
};

export default function HatchAboutMe({
  eyebrow = 'ABOUT ME',
  title = 'I create digital products\nthat solve real problems\nfor real people.',
  paragraphs = [
    `My journey started with a passion for clean design and thoughtful user experiences. Over the past 8 years, I've worked with startups, agencies, and Fortune 500 companies to bring their visions to life.`,
    `I believe great design is invisible—it just works. It's about understanding your users deeply and creating experiences that feel natural and delightful.`,
  ],
  imageSrc = '/images/about/portrait.jpg',
  imageAlt = 'Portrait',
}: HatchAboutMeProps) {
  return (
    <section className="bg-background">
      <div className="section-padding container">
        <div className="mx-auto grid w-full items-stretch gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.28em] text-[var(--hatch-cta)]">
              {eyebrow}
            </div>

            <h1 className="font-display mt-3 text-3xl leading-[1.1] whitespace-pre-line sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            <div className="mt-6 space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-muted-foreground leading-[1.8]">
                  {p}
                </p>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 justify-center lg:justify-end">
            <div
              className={cn(
                'relative overflow-hidden rounded-[18px] shadow-sm',
                'aspect-[9/16] w-full',
                'lg:aspect-auto lg:h-full lg:min-h-[420px] lg:w-[min(100%,380px)]',
              )}
            >
              <img
                src={imageSrc}
                alt={imageAlt}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="(min-width:1024px) 380px, 92vw"
                loading="lazy"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
