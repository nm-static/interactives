export const SITE_TITLE = "Interactives";
export const SITE_DESCRIPTION =
  "A collection of interactive games, puzzles, and mathematical explorations for enhanced learning experiences.";

export const SITE_METADATA = {
  title: {
    default: SITE_TITLE,
    template: "%s | Interactives",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "interactive",
    "math",
    "puzzles",
    "games",
    "education",
    "discrete math",
    "algorithms",
    "combinatorics",
  ],
  authors: [{ name: "Neeldhara Misra" }],
  creator: "Neeldhara Misra",
  publisher: "Interactives",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "48x48" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon.ico" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: [{ url: "/favicon/favicon.ico" }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Interactives",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@neaboron",
  },
};
