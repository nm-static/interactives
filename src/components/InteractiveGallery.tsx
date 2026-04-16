import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, SortAsc, SortDesc } from 'lucide-react';
import { publishedInteractives, primaryTheme } from '@/lib/interactives';

type SortField = 'title' | 'dateAdded';
type SortDirection = 'asc' | 'desc';

function getInitialTheme(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('theme') || '';
}

const InteractiveGallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>(getInitialTheme);
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showTags, setShowTags] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    publishedInteractives.forEach((i) => i.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  const allThemes = useMemo(() => {
    const themes = new Set<string>();
    publishedInteractives.forEach((i) => i.themes.forEach((t) => themes.add(t)));
    return Array.from(themes).sort();
  }, []);

  const filtered = useMemo(() => {
    let result = publishedInteractives.filter((i) => {
      const matchesSearch =
        !searchTerm ||
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = !selectedTag || i.tags.includes(selectedTag);
      const matchesTheme = !selectedTheme || i.themes.includes(selectedTheme);
      return matchesSearch && matchesTag && matchesTheme;
    });

    result.sort((a, b) => {
      const aVal = a[sortField].toLowerCase();
      const bVal = b[sortField].toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [searchTerm, selectedTag, selectedTheme, sortField, sortDirection]);

  // Reset pagination when filters/sort change
  useEffect(() => { setPage(1); }, [searchTerm, selectedTag, selectedTheme, sortField, sortDirection]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-foreground mb-8">
        All Interactives ({publishedInteractives.length})
      </h1>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search interactives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSortChange('title')} className="gap-2">
            {sortField === 'title' ? (
              sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
            ) : (
              <SortAsc className="w-4 h-4" />
            )}
            Title
          </Button>
          <Button variant="outline" onClick={() => handleSortChange('dateAdded')} className="gap-2">
            {sortField === 'dateAdded' ? (
              sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
            ) : (
              <SortAsc className="w-4 h-4" />
            )}
            Recency
          </Button>
        </div>
      </div>

      {/* Theme Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          variant={selectedTheme === '' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedTheme('')}
        >
          All
        </Badge>
        {allThemes.map((theme) => (
          <Badge
            key={theme}
            variant={selectedTheme === theme ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            onClick={() => setSelectedTheme(selectedTheme === theme ? '' : theme)}
          >
            {theme}
          </Badge>
        ))}
      </div>

      {/* Active filters */}
      {(selectedTag || selectedTheme) && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          {selectedTheme && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedTheme('')}>
              {selectedTheme} &times;
            </Badge>
          )}
          {selectedTag && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedTag('')}>
              {selectedTag} &times;
            </Badge>
          )}
        </div>
      )}

      {/* Tag Filter */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Button variant="ghost" size="sm" onClick={() => setShowTags((v) => !v)}>
            {showTags ? 'Hide Tags' : 'Filter by Tags'}
          </Button>
        </div>
        {showTags && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <p className="text-muted-foreground mb-4 text-sm">
        Showing {filtered.length} of {publishedInteractives.length} interactives
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginated.map((interactive) => (
          <a key={interactive.slug} href={`/i/${interactive.slug}`} className="group">
            <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md h-full flex flex-col">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">
                {interactive.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                {interactive.description}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedTheme(selectedTheme === primaryTheme(interactive) ? '' : primaryTheme(interactive));
                  }}
                >
                  {primaryTheme(interactive)}
                </Badge>
                {interactive.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTag(selectedTag === tag ? '' : tag);
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</Button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No interactives found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveGallery;
