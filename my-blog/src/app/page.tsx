import { redirect } from 'next/navigation'

// Root URL — proper HTTP redirect is now handled by Cloudflare Pages
// (see public/_redirects: "/" -> "/ja/" 302).
// This `redirect()` call is a fallback for environments where _redirects
// isn't honored (local dev, alternative hosts). It generates a JS-side
// redirect via __next_error__ payload — not ideal for SEO but defensive.
export default function RootPage() {
  redirect('/ja')
}