/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 enables Turbopack by default, but @vercel/turbopack-next's
  // google-font internal alias is not resolved in our clean-install CI env
  // (manifested as: "Can't resolve '@vercel/turbopack-next/internal/font/google/font'").
  // Run `next build` with the --webpack flag (set in package.json) so the
  // font CSS works. We expose an empty `webpack` hook here for clarity.
  webpack: {},
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  typescript: {
    ignoreBuildErrors: true,
  },
}

const withNextIntl = require('next-intl/plugin')('./src/i18n/request.ts')

module.exports = withNextIntl(nextConfig)