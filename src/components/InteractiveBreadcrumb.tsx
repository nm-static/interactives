import React, { useState, useEffect } from "react";
import { allThemes, type Theme } from "@/lib/interactives";

interface InteractiveBreadcrumbProps {
  title: string;
  themes: string[];
  subcategory?: string;
}

const Chevron = () => (
  <li role="presentation" aria-hidden="true" className="[&>svg]:size-3.5">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </li>
);

const InteractiveBreadcrumb: React.FC<InteractiveBreadcrumbProps> = ({
  title,
  themes,
  subcategory,
}) => {
  const [activeTheme, setActiveTheme] = useState<Theme | undefined>(undefined);
  const [activeSub, setActiveSub] = useState<
    { slug: string; title: string } | undefined
  >(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromSlug = params.get("from");

    let theme: Theme | undefined;
    if (fromSlug) {
      // Try to match the from param to a theme the interactive belongs to
      theme = allThemes.find(
        (t) => t.slug === fromSlug && themes.includes(t.title)
      );
    }
    // Fall back to primary theme (first in array)
    if (!theme) {
      theme = allThemes.find((t) => t.title === themes[0]);
    }
    setActiveTheme(theme);

    // Resolve subcategory if present and theme matches
    if (subcategory && theme?.subcategories) {
      const sub = theme.subcategories.find((s) => s.slug === subcategory);
      setActiveSub(sub ? { slug: sub.slug, title: sub.title } : undefined);
    }
  }, [themes, subcategory]);

  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li className="inline-flex items-center gap-1">
          <a href="/" className="transition-colors hover:text-foreground">
            Home
          </a>
        </li>
        {activeTheme && (
          <>
            <Chevron />
            <li className="inline-flex items-center gap-1">
              <a
                href={`/themes/${activeTheme.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {activeTheme.title}
              </a>
            </li>
          </>
        )}
        {activeSub && activeTheme && (
          <>
            <Chevron />
            <li className="inline-flex items-center gap-1">
              <a
                href={`/themes/${activeTheme.slug}/${activeSub.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {activeSub.title}
              </a>
            </li>
          </>
        )}
        <Chevron />
        <li className="inline-flex items-center gap-1">
          <span
            className="font-normal text-foreground"
            role="link"
            aria-disabled="true"
            aria-current="page"
          >
            {title}
          </span>
        </li>
      </ol>
    </nav>
  );
};

export default InteractiveBreadcrumb;
