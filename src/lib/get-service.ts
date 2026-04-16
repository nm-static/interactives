import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

export type ServiceFrontmatter = {
  title: string;
  description: string;
  price?: string;
  priceMeta?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

const SERVICES_DIR = path.join(process.cwd(), 'src/content/services');

export function getService(
  slug: string,
): { frontmatter: ServiceFrontmatter } | null {
  const filePath = path.join(SERVICES_DIR, `${slug}.mdx`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(raw);
    return {
      frontmatter: data as ServiceFrontmatter,
    };
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
    throw e;
  }
}

export function getAllServiceSlugs(): string[] {
  try {
    return fs
      .readdirSync(SERVICES_DIR)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => f.replace(/\.mdx$/, ''));
  } catch {
    return [];
  }
}
