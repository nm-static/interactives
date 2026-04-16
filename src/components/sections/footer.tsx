import { HatchRadialSvgPattern } from '@/components/hatch-radial-svg-pattern';

type FooterProps = {
  name?: string;
  socials?: {
    href: string;
    label: string;
    iconSrc: string;
  }[];
};

export function Footer({
  name = 'Interactives',
  socials = [],
}: FooterProps) {
  return (
    <footer className="bg-background border-hatch-cta relative overflow-hidden border-b-4">
      <HatchRadialSvgPattern />
      <div className="relative z-10 container py-10 md:px-0 space-y-8">
        {/* Newsletter signup */}
        <div className="border-t border-border pt-8">
          <form
            method="post"
            action="https://listmonk.neeldhara.website/subscription/form"
            className="max-w-md mx-auto text-center space-y-3"
          >
            <h3 className="text-lg font-semibold text-foreground">Stay up to date</h3>
            <p className="text-sm text-muted-foreground">
              Get notified when new interactives are posted.
            </p>
            <input type="hidden" name="nonce" />
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                required
                placeholder="Your email"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </div>
            <input
              type="text"
              name="name"
              placeholder="Name (optional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="hidden">
              <input
                id="92f48"
                type="checkbox"
                name="l"
                checked
                readOnly
                value="92f48d9f-a5b0-41f7-9eda-4614a22f2d53"
              />
            </div>
          </form>
        </div>

        {/* Copyright + links */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row border-t border-border pt-6">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/blog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </a>
            <a
              href="/rss.xml"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
              </svg>
              RSS
            </a>
            {socials.map((s) => (
              <a
                key={s.href}
                href={s.href}
                aria-label={s.label}
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <span className="sr-only">{s.label}</span>
                <img
                  src={s.iconSrc}
                  alt=""
                  width={18}
                  height={18}
                  className="opacity-80 transition-opacity hover:opacity-100"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
