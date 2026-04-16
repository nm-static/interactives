import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

const PROJECTS_PATH = path.join(process.cwd(), 'src/content/work');

export type Project = {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  featured: boolean;
  order: number;
  content: string;

  tagline?: string;

  heroImage?: string;
  liveUrl?: string;

  roleLabel?: string;
  roleValue?: string;

  timelineLabel?: string;
  timelineValue?: string;

  servicesLabel?: string;
  servicesValue?: string;

  challengeTitle?: string;
  challengeBody?: string;

  solutionTitle?: string;
  solutionBody?: string;

  deliverables?: string[];
  /** Ordered image URLs; first is the default slide. Legacy `{ main, thumbs }` in MDX is normalized here. */
  gallery?: string[];
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return fallback;
}

function asNumber(value: unknown, fallback = 999): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;

  return Number.isFinite(n) ? n : fallback;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const items = value.map((v) => asString(v, '')).filter(Boolean);
    return items.length ? items : undefined;
  }
  if (typeof value === 'string') return value ? [value] : undefined;
  return undefined;
}

function dedupeOrdered(urls: string[]) {
  const seen = new Set<string>();
  return urls.filter((u) => {
    if (!u || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

function asGallery(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const items = value.map((v) => asString(v, '')).filter(Boolean);
    return items.length ? dedupeOrdered(items) : undefined;
  }
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    const main = asString(v.main, '');
    const thumbs = asStringArray(v.thumbs) ?? [];
    const items = [main, ...thumbs].filter(Boolean);
    return items.length ? dedupeOrdered(items) : undefined;
  }
  return undefined;
}

export function getProjectSlugs(): string[] {
  return fs
    .readdirSync(PROJECTS_PATH)
    .filter((fileName) => fileName.endsWith('.mdx'));
}

export function getProjectBySlug(slug: string): Project {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(PROJECTS_PATH, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const d = data as Record<string, unknown>;

  return {
    slug: realSlug,
    title: asString(d.title, realSlug),
    description: asString(d.description, ''),
    tagline: asString(d.tagline, ''),
    coverImage: asString(d.coverImage, ''),
    featured: asBoolean(d.featured, false),
    order: asNumber(d.order, 999),
    content,

    heroImage: asString(d.heroImage, ''),
    liveUrl: asString(d.liveUrl, ''),

    roleLabel: asString(d.roleLabel, ''),
    roleValue: asString(d.roleValue, ''),

    timelineLabel: asString(d.timelineLabel, ''),
    timelineValue: asString(d.timelineValue, ''),

    servicesLabel: asString(d.servicesLabel, ''),
    servicesValue: asString(d.servicesValue, ''),

    challengeTitle: asString(d.challengeTitle, ''),
    challengeBody: asString(d.challengeBody, ''),

    solutionTitle: asString(d.solutionTitle, ''),
    solutionBody: asString(d.solutionBody, ''),

    deliverables: asStringArray(d.deliverables),
    gallery: asGallery(d.gallery),
  };
}

export function getAllProjects(): Project[] {
  return getProjectSlugs()
    .map((slug) => getProjectBySlug(slug))
    .sort((a, b) => a.order - b.order);
}
