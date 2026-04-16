import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { publishedInteractives, primaryTheme } from '@/lib/interactives';

const HomepageHero: React.FC = () => {
  const featured = [...publishedInteractives]
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
    .slice(0, 6);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6 pt-8 pb-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground font-display">
          Interactives
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A collection of interactive games, puzzles, and mathematical explorations
          for enhanced learning experiences and pure joy.
        </p>
      </section>

      {/* Recently Added */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground font-display">Recently Added</h2>
          <a href="/i" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all &rarr;
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <a key={item.slug} href={`/i/${item.slug}`} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs">{primaryTheme(item)}</Badge>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomepageHero;
