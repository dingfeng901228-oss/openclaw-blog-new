
// Ground-truth generator for the Rust SSG.
//
// The markdown converter is NOT re-implemented here: it is extracted from
// the live Next.js source at runtime and eval'd, so this reference can
// never drift from what production actually renders.
//
// reading-time and gray-matter come from the project's own node_modules.
//
// Usage: node scripts/reference.mjs [projectRoot] [outFile]

import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
// Defaults are relative to this file, so the script works from any
// checkout. Pass the project root and the output file to override.
const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.argv[2] || path.resolve(here, '../..');
const outFile = process.argv[3] || path.resolve(here, '../reference.json');

const matter = require(path.join(projectRoot, 'node_modules/gray-matter'))
const readingTime = require(path.join(projectRoot, 'node_modules/reading-time'))

// ---- extract convertMarkdown() from the live source -----------------------
const pagePath = path.join(projectRoot, 'src/app/[locale]/blog/[slug]/page.tsx')
const pageSrc = fs.readFileSync(pagePath, 'utf-8')
const start = pageSrc.indexOf('function convertMarkdown')
const end = pageSrc.indexOf('\n}', start) + 2
let fnSrc = pageSrc.slice(start, end)
fnSrc = fnSrc
  .replace(/function convertMarkdown\(content: string\): string/, 'function convertMarkdown(content)')
  .replace(/: string\[\]/g, '')
  .replace(/: string/g, '')
const convertMarkdown = eval('(' + fnSrc + ')')

// ---- extract formatDate() from the live source ---------------------------
const utilsPath = path.join(projectRoot, 'src/lib/utils.ts')
const utilsSrc = fs.readFileSync(utilsPath, 'utf-8')
const ud = utilsSrc.indexOf('export function formatDate')
const ue = utilsSrc.indexOf('\n}', ud) + 2
let uSrc = utilsSrc.slice(ud, ue)
uSrc = uSrc
  .replace(/export function formatDate\(date: string \| Date\): string/, 'function formatDate(date)')
  .replace(/: string \| Date/g, '')
  .replace(/: string/g, '')
const formatDate = eval('(' + uSrc + ')')

// ---- mirror getAllPosts() from src/lib/blog.ts ---------------------------
const POSTS_PER_PAGE = 10
const LOCALES = ['en', 'ja', 'zh']

function getLocaleContent(data, locale) {
  const localeData = data[locale]
  if (!localeData) {
    return { title: '', excerpt: '', content: '', tags: [], category: 'Uncategorized' }
  }
  return {
    title: localeData.title || '',
    excerpt: localeData.excerpt || '',
    content: localeData.content || '',
    tags: localeData.tags || [],
    category: localeData.category || 'Uncategorized',
  }
}

const contentDir = path.join(projectRoot, 'src/content/posts')
const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))

const all = files.map((fileName) => {
  const slug = fileName.replace(/\.(mdx|md)$/, '')
  const fileContent = fs.readFileSync(path.join(contentDir, fileName), 'utf-8')
  const { data } = matter(fileContent)
  return {
    slug,
    date: data.date || new Date().toISOString(),
    status: data.status || 'draft',
    data,
  }
})
all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
const published = all.filter((p) => p.status === 'published')

const out = {
  postsPerPage: POSTS_PER_PAGE,
  locales: LOCALES,
  totalPublished: published.length,
  posts: [],
}

for (const p of published) {
  const locales = {}
  for (const loc of LOCALES) {
    const lc = getLocaleContent(p.data, loc)
    const stats = readingTime(lc.content)
    const hasContent = !!(p.data[loc]?.content?.trim().length > 0)
    locales[loc] = {
      hasContent,
      title: lc.title,
      excerpt: lc.excerpt,
      tags: lc.tags,
      category: lc.category,
      readingTime: stats.text,
      readingWords: stats.words,
      readingMinutes: stats.minutes,
      dateDisplay: formatDate(p.date),
      dateRaw: typeof p.date === 'string' ? p.date : p.date.toISOString(),
      dateIsQuoted: typeof p.date === 'string',
      html: hasContent ? convertMarkdown(lc.content) : '',
    }
  }
  out.posts.push({ slug: p.slug, date: p.date, status: p.status, locales })
}

fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf-8')
console.log(`wrote ${outFile}: ${published.length} published posts`)
