'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type HatchSectionHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  showLogo?: boolean;
  logoSrc?: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoClassName?: string;
  className?: string;
  innerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  aside?: React.ReactNode;
};

export function HatchSectionHeader({
  title,
  description,

  showLogo = false,
  logoSrc = '/images/layout/logo.svg',
  logoAlt = 'Hatch',
  logoWidth = 28,
  logoHeight = 28,
  logoClassName,

  className,
  innerClassName,
  titleClassName,
  descriptionClassName,

  aside,
}: HatchSectionHeaderProps) {
  return (
    <div className={cn('w-full', className)}>
      {showLogo ? (
        <div className="mb-4">
          <img
            src={logoSrc}
            alt={logoAlt}
            width={logoWidth}
            height={logoHeight}
            className={cn(
              'brightness-[0.72] contrast-[1.08] dark:brightness-[0.88]',
              logoClassName,
            )}
          />
        </div>
      ) : null}

      <div
        className={cn('flex items-start justify-between gap-8', innerClassName)}
      >
        <h2
          className={cn(
            'font-display text-foreground text-2xl sm:text-[28px]',
            titleClassName,
          )}
        >
          {title}
        </h2>

        {aside ? (
          <div className="hidden sm:block">{aside}</div>
        ) : description ? (
          <p
            className={cn(
              'text-muted-foreground hidden min-w-0 flex-1 text-base sm:block sm:text-end',
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {description ? (
        <p
          className={cn(
            'text-muted-foreground mt-3 text-base sm:hidden',
            descriptionClassName,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
