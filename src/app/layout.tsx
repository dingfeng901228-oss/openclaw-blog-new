// Root layout for `src/app/page.tsx` (which immediately redirects to /ja).
// The locale-specific UI lives in src/app/[locale]/layout.tsx; this file
// exists only to satisfy Next.js's "every page must have a root layout"
// requirement (webpack is strict about this; Turbopack historically let
// it slip, which is why the Cloudflare CI build with Turbopack failed at
// a different place — the google-font CSS module).
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
