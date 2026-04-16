import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import AdminIdeaCards from "@/components/AdminIdeaCards";
import AdminDraftCards from "@/components/AdminDraftCards";
import type { Interactive, Subcategory } from "@/lib/interactives";

interface ThemeContentProps {
  themeSlug: string;
  themeTitle: string;
  description: string;
  subcategories: Subcategory[];
  interactives: Interactive[];
}

const ThemeContent: React.FC<ThemeContentProps> = ({
  themeSlug,
  themeTitle,
  description,
  subcategories,
  interactives,
}) => {
  const [viewAll, setViewAll] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-10">
        <p className="text-lg text-muted-foreground max-w-3xl">
          {description}
        </p>
        <button
          onClick={() => setViewAll((v) => !v)}
          className="shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer mt-1"
        >
          {viewAll ? "View Categories" : "View All"}
        </button>
      </div>

      {viewAll ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {interactives.map((item) => (
            <a key={item.slug} href={`/i/${item.slug}?from=${themeSlug}`} className="group">
              <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md h-full">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {item.description}
                </p>
                {item.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {subcategories.find((s) => s.slug === item.subcategory)
                      ?.title}
                  </Badge>
                )}
              </div>
            </a>
          ))}
          <AdminDraftCards theme={themeTitle} />
          <AdminIdeaCards theme={themeTitle} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subcategories.map((sub) => {
            const count = interactives.filter(
              (i) => i.subcategory === sub.slug
            ).length;
            return (
              <a
                key={sub.slug}
                href={`/themes/${themeSlug}/${sub.slug}`}
                className="group"
              >
                <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md h-full">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {sub.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sub.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeContent;
