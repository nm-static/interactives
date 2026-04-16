export type BlogPost = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
  featured?: boolean;
  latest?: boolean;
  tagline?: string;
};
