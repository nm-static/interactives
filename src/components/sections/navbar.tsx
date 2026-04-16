'use client';

import { ThemeProvider } from 'next-themes';
import * as React from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const HEADER_HEIGHT = 80;

const ITEMS = [
  { label: 'Themes', href: '/themes' },
  { label: 'All Interactives', href: '/i' },
  { label: 'Blog', href: '/blog' },
];

export default function Navbar() {
  const [pathname, setPathname] = React.useState('/');
  React.useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.toggle('overflow-hidden', isMenuOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [isMenuOpen]);

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (mq.matches) setIsMenuOpen(false);
    };
    mq.addEventListener('change', closeOnDesktop);
    return () => mq.removeEventListener('change', closeOnDesktop);
  }, []);

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = React.useState<number | 'auto'>(0);
  const [minOpenHeight, setMinOpenHeight] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const viewportRemainder = Math.max(0, window.innerHeight - HEADER_HEIGHT);

    const onEnd = () => {
      if (isMenuOpen) setPanelHeight('auto');
      wrapper.removeEventListener('transitionend', onEnd);
    };

    queueMicrotask(() => {
      setMinOpenHeight(viewportRemainder);

      if (isMenuOpen) {
        const target = Math.max(content.scrollHeight, viewportRemainder);
        setPanelHeight(target);
        wrapper.addEventListener('transitionend', onEnd);
      } else {
        const current = wrapper.getBoundingClientRect().height || 0;
        setPanelHeight(current);
        requestAnimationFrame(() => setPanelHeight(0));
      }
    });
  }, [isMenuOpen, pathname]);

  React.useEffect(() => {
    const onResize = () => {
      if (!isMenuOpen || !contentRef.current) return;
      const viewportRemainder = Math.max(0, window.innerHeight - HEADER_HEIGHT);
      queueMicrotask(() => {
        setMinOpenHeight(viewportRemainder);
        if (panelHeight !== 'auto') {
          const target = Math.max(
            contentRef.current!.scrollHeight,
            viewportRemainder,
          );
          setPanelHeight(target);
        }
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isMenuOpen, panelHeight]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <header className="relative z-50">
      <div className="bg-background/70 backdrop-blur">
        <div className="relative container flex h-20 items-center justify-between gap-2 sm:gap-3">
          <a
            href="/"
            className="flex shrink-0 items-center gap-2 text-lg font-bold text-foreground"
            aria-label="Interactives home"
          >
            Interactives
          </a>

          <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
            {ITEMS.map((link) => {
              const active = pathname === link.href;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'text-base transition-colors',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
            <a
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors hidden lg:block"
              aria-label="Admin"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </a>
            <div className="shrink-0 lg:hidden">
              <ThemeToggle />
            </div>
            <a
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors lg:hidden"
              aria-label="Admin"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </a>
            <button
              type="button"
              className={cn(
                'lg:hidden',
                'bg-background inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] shadow-xs',
                'text-muted-foreground hover:text-foreground transition-colors',
              )}
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle main menu"
            >
              <span className="sr-only">Toggle main menu</span>
              <div className="relative h-4 w-[18px]">
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-0 left-0 block h-0.5 w-full rounded-full bg-current transition duration-300 ease-in-out',
                    isMenuOpen ? 'translate-y-[7px] rotate-45' : '',
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-[7px] left-0 block h-0.5 w-full rounded-full bg-current transition duration-300 ease-in-out',
                    isMenuOpen ? 'opacity-0' : 'opacity-100',
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-[14px] left-0 block h-0.5 w-full rounded-full bg-current transition duration-300 ease-in-out',
                    isMenuOpen ? 'top-[7px] -rotate-45' : '',
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
      <div className="lg:hidden">
        <div
          ref={wrapperRef}
          style={{
            height: panelHeight === 'auto' ? 'auto' : panelHeight,
            minHeight: isMenuOpen ? `${minOpenHeight}px` : undefined,
            transition: 'height 320ms cubic-bezier(.22,.61,.36,1)',
          }}
          className={cn(
            'bg-background overflow-hidden',
            'relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen',
          )}
          aria-hidden={!isMenuOpen}
        >
          <div
            ref={contentRef}
            className="max-h-[calc(100vh-80px)] overflow-auto"
            inert={!isMenuOpen ? true : undefined}
          >
            <div className="container">
              <div
                className={cn(
                  'pt-6 pb-8 transition-[transform,opacity] duration-300',
                  isMenuOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-2 opacity-0',
                )}
              >
                <nav className="flex flex-col gap-6">
                  {ITEMS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className={cn(
                        'text-lg tracking-[-0.02em]',
                        pathname === link.href
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    </ThemeProvider>
  );
}
