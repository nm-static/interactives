import { cn } from '@/lib/utils';

type PrimarySvgIconProps = {
  /** Public path, e.g. `/images/services/noun-star-7745963.svg` */
  src: string;
  className?: string;
};

/**
 * Renders a public SVG as a silhouette filled with theme `primary` (`--primary`)
 * using CSS mask, so color follows light/dark tokens.
 */
export function PrimarySvgIcon({ src, className }: PrimarySvgIconProps) {
  return (
    <span
      className={cn('bg-primary inline-block shrink-0', className)}
      style={{
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskImage: `url(${src})`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
      }}
      aria-hidden
    />
  );
}
