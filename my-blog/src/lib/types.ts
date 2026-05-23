export type Locale = 'en' | 'ja' | 'zh'

export interface LocaleContent {
  title: string
  excerpt: string
  content: string
  tags: string[]
  category: string
}

export interface Post {
  slug: string
  date: string
  translationKey: string
  status: 'draft' | 'published'

  // Top-level fields (mirrored from current locale for convenience)
  title?: string
  excerpt?: string
  tags?: string[]
  category?: string
  featured?: boolean
  readingTime?: string
  content?: string

  // Locale-specific content (always present after migration)
  en: LocaleContent
  ja: LocaleContent
  zh: LocaleContent
}

// Helper type for getPostBySlug return
export interface PostBySlug {
  slug: string
  locale: string
  title: string
  excerpt: string
  date: string
  tags: string[]
  category: string
  featured: boolean
  readingTime: string
  content: string
  translationKey: string
  status: 'draft' | 'published'
}

export interface Project {
  slug: string
  title: string
  description: string
  tags: string[]
  link?: string
  github?: string
  image?: string
}

export interface TimelineItem {
  date: string
  title: string
  description: string
  type: 'work' | 'education' | 'project' | 'milestone'
}

export interface Skill {
  name: string
  level: number
  category: 'frontend' | 'backend' | 'devops' | 'ai'
}