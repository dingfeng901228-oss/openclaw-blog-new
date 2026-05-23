'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { motion } from 'framer-motion'
import ArticleCard from '@/components/blog/ArticleCard'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

const labels: Record<string, { search: string; noResults: string; clearFilters: string; showing: string; allCategories: string }> = {
  ja: {
    search: '記事を検索...',
    noResults: '記事が見つかりません。',
    clearFilters: 'フィルターをクリア',
    showing: '{count}件中{total}件を表示',
    allCategories: '全カテゴリー',
  },
  zh: {
    search: '搜索文章...',
    noResults: '未找到文章。',
    clearFilters: '清除筛选',
    showing: '显示 {count} / {total} 篇',
    allCategories: '全部分类',
  },
  en: {
    search: 'Search articles...',
    noResults: 'No articles found.',
    clearFilters: 'Clear filters',
    showing: 'Showing {count} of {total}',
    allCategories: 'All Categories',
  },
}

const pageTitle: Record<string, { title: string; subtitle: string }> = {
  ja: { title: 'ブログ', subtitle: 'AI、Web開発、構築についての思考。' },
  zh: { title: '博客', subtitle: '关于AI、Web开发和构建的思考。' },
  en: { title: 'Blog', subtitle: 'Thoughts on AI, web development, and building things.' },
}

interface BlogListProps {
  posts: Post[]
  tags: string[]
  categories: string[]
  locale: string
}

export default function BlogList({ posts, tags, categories, locale }: BlogListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const t = labels[locale] || labels.en
  const meta = pageTitle[locale] || pageTitle.en

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Only show published posts
      if (post.status === 'draft') return false
      const matchesSearch =
        searchQuery === '' ||
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTag = selectedTag === null || post.tags?.includes(selectedTag)
      const matchesCategory = selectedCategory === null || post.category === selectedCategory
      return matchesSearch && matchesTag && matchesCategory
    })
  }, [posts, searchQuery, selectedTag, selectedCategory])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTag(null)
    setSelectedCategory(null)
  }

  const hasActiveFilters = searchQuery || selectedTag || selectedCategory

  return (
    <div className="container-custom py-12 md:py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
          {meta.title}
        </h1>
        <p className="text-text-secondary text-base">
          {meta.subtitle}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 space-y-4"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all duration-200"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 cursor-pointer"
          >
            <option value="">{t.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                  selectedTag === tag
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg-secondary text-text-secondary border border-border hover:border-border-hover'
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-text-muted hover:text-text-primary transition-colors ml-auto">
              {t.clearFilters}
            </button>
          )}
        </div>
      </motion.div>

      {/* Posts Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <ArticleCard post={post} locale={locale} />
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-text-muted text-base">{t.noResults}</p>
            <button onClick={clearFilters} className="mt-4 text-accent-blue hover:underline">
              {t.clearFilters}
            </button>
          </div>
        )}
      </motion.div>

      <div className="mt-8 text-sm text-text-muted">
        {t.showing.replace('{count}', String(filteredPosts.length)).replace('{total}', String(posts.length))}
      </div>
    </div>
  )
}