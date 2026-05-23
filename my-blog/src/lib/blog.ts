import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { Post, LocaleContent, Locale } from './types'

// Single content directory - all locales in one file
function getContentDir(): string {
  return path.join(process.cwd(), 'src/content/posts')
}

function getLocaleContent(data: any, locale: Locale): LocaleContent {
  const localeData = data[locale]
  if (!localeData) {
    return {
      title: '',
      excerpt: '',
      content: '',
      tags: [],
      category: 'Uncategorized',
    }
  }
  return {
    title: localeData.title || '',
    excerpt: localeData.excerpt || '',
    content: localeData.content || '',
    tags: localeData.tags || [],
    category: localeData.category || 'Uncategorized',
  }
}

export function getAllPosts(locale: Locale = 'en'): Post[] {
  const contentDir = getContentDir()

  if (!fs.existsSync(contentDir)) {
    return []
  }

  const files = fs.readdirSync(contentDir)

  const posts = files
    .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.(mdx|md)$/, '')
      const filePath = path.join(contentDir, fileName)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(fileContent)

      // Get locale-specific content
      const localeContent = getLocaleContent(data, locale)
      const stats = readingTime(localeContent.content)

      return {
        slug,
        date: data.date || new Date().toISOString(),
        translationKey: data.translationKey || slug,
        status: data.status || 'draft',

        // All locales
        en: getLocaleContent(data, 'en'),
        ja: getLocaleContent(data, 'ja'),
        zh: getLocaleContent(data, 'zh'),

        // Top-level convenience fields (from current locale)
        title: localeContent.title,
        excerpt: localeContent.excerpt,
        tags: localeContent.tags,
        category: localeContent.category,
        featured: data.featured || false,
        readingTime: stats.text,
        content: localeContent.content,
        locale,
      } as Post
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Filter out draft posts
  return posts.filter(p => p.status === 'published')
}

export function getPostBySlug(locale: Locale, slug: string): any | undefined {
  const contentDir = getContentDir()

  try {
    const filePath = path.join(contentDir, `${slug}.mdx`)
    const filePathMd = path.join(contentDir, `${slug}.md`)

    let fileContent: string
    if (fs.existsSync(filePath)) {
      fileContent = fs.readFileSync(filePath, 'utf-8')
    } else if (fs.existsSync(filePathMd)) {
      fileContent = fs.readFileSync(filePathMd, 'utf-8')
    } else {
      return undefined
    }

    const { data } = matter(fileContent)

    // Get locale-specific content
    const localeContent = getLocaleContent(data, locale)
    const stats = readingTime(localeContent.content)

    // Check if this locale has actual content
    const localeHasContent = data[locale]?.content?.trim().length > 0

    return {
      slug,
      date: data.date || new Date().toISOString(),
      translationKey: data.translationKey || slug,
      status: data.status || 'draft',

      // All locales
      en: getLocaleContent(data, 'en'),
      ja: getLocaleContent(data, 'ja'),
      zh: getLocaleContent(data, 'zh'),

      // Current locale
      title: localeContent.title,
      excerpt: localeContent.excerpt,
      tags: localeContent.tags,
      category: localeContent.category,
      featured: data.featured || false,
      readingTime: stats.text,
      content: localeContent.content,
      locale,
      localeHasContent, // Track if this locale actually has content
    }
  } catch {
    return undefined
  }
}

export function getAllTags(locale: Locale = 'en'): string[] {
  const posts = getAllPosts(locale)
  const tags = new Set<string>()
  posts.forEach((post) => {
    post.tags?.forEach((tag: string) => tags.add(tag))
  })
  return Array.from(tags).sort()
}

export function getAllCategories(locale: Locale = 'en'): string[] {
  const posts = getAllPosts(locale)
  const categories = new Set<string>()
  posts.forEach((post) => {
    if (post.category) categories.add(post.category)
  })
  return Array.from(categories).sort()
}

export function getPostsByTag(locale: Locale, tag: string): Post[] {
  const posts = getAllPosts(locale)
  return posts.filter((post) => post.tags?.includes(tag))
}

export function getPostsByCategory(locale: Locale, category: string): Post[] {
  const posts = getAllPosts(locale)
  return posts.filter((post) => post.category === category)
}

export function getFeaturedPosts(locale: Locale = 'en'): Post[] {
  const posts = getAllPosts(locale)
  return posts.filter((post) => post.featured)
}

// Check if a specific locale has content for a post
export function localeHasContent(slug: string, locale: Locale): boolean {
  const contentDir = getContentDir()
  const filePath = path.join(contentDir, `${slug}.mdx`)
  const filePathMd = path.join(contentDir, `${slug}.md`)

  if (!fs.existsSync(filePath) && !fs.existsSync(filePathMd)) {
    return false
  }

  try {
    const fileContent = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf-8')
      : fs.readFileSync(filePathMd, 'utf-8')
    const { data } = matter(fileContent)
    return !!(data[locale]?.content?.trim())
  } catch {
    return false
  }
}

export function postExists(locale: Locale, slug: string): boolean {
  return localeHasContent(slug, locale)
}

export function getAvailableLocales(slug: string): Locale[] {
  const locales: Locale[] = ['en', 'ja', 'zh']
  return locales.filter(loc => localeHasContent(slug, loc))
}

export function getTranslationKey(slug: string): string {
  return slug
}

export function validatePostComplete(slug: string): { valid: boolean; missing: string[] } {
  const contentDir = getContentDir()
  const filePath = path.join(contentDir, `${slug}.mdx`)
  const filePathMd = path.join(contentDir, `${slug}.md`)

  if (!fs.existsSync(filePath) && !fs.existsSync(filePathMd)) {
    return { valid: false, missing: ['en', 'ja', 'zh'] }
  }

  try {
    const fileContent = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf-8')
      : fs.readFileSync(filePathMd, 'utf-8')
    const { data } = matter(fileContent)

    const locales: Locale[] = ['en', 'ja', 'zh']
    const missing: string[] = []

    for (const loc of locales) {
      if (!data[loc]?.content?.trim()) {
        missing.push(loc)
      }
    }

    return { valid: missing.length === 0, missing }
  } catch {
    return { valid: false, missing: ['en', 'ja', 'zh'] }
  }
}

export function getAllSlugs(): string[] {
  const contentDir = getContentDir()
  if (!fs.existsSync(contentDir)) return []

  return fs.readdirSync(contentDir)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .map(f => f.replace(/\.(mdx|md)$/, ''))
}