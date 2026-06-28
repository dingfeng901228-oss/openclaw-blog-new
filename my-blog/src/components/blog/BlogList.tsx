'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

// ============================================================================
// CategoryDropdown — custom dark-themed dropdown replacing native <select>
// ============================================================================

interface CategoryDropdownProps {
  categories: string[]
  value: string | null
  onChange: (value: string | null) => void
  label: string
}

function CategoryDropdown({ categories, value, onChange, label }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const display = value ?? label

  return (
    <div ref={ref} className="blog-dropdown relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer flex items-center gap-2"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255, 255, 255, 0.85)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <span>{display}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="blog-dropdown-panel absolute z-50 mt-2 min-w-[180px] max-h-72 overflow-y-auto rounded-lg py-1"
          style={{
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            transformOrigin: 'top right',
            animation: 'dropdownOpen 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === null}
              onClick={() => { onChange(null); setOpen(false) }}
              className="blog-dropdown-item w-full text-left px-4 py-2 text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: value === null ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                background: value === null ? 'rgba(59, 130, 246, 0.20)' : 'transparent',
              }}
            >
              {label}
            </button>
          </li>
          {categories.map((cat) => {
            const selected = value === cat
            return (
              <li key={cat}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onChange(cat); setOpen(false) }}
                  className="blog-dropdown-item w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: selected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                    background: selected ? 'rgba(59, 130, 246, 0.20)' : 'transparent',
                  }}
                >
                  {cat}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
import { Search, X } from 'lucide-react'
import ArticleCard from '@/components/blog/ArticleCard'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

const labels: Record<string, { search: string; noResults: string; clearFilters: string; showing: string; allCategories: string }> = {
  ja: {
    search: '記事を検索...',
    noResults: '記事が見つかりません。',
    clearFilters: 'フィルターをクリア',
    showing: '{total}件中{count}件を表示',
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

const pageTitle: Record<string, { badge: string; title: string; subtitle: string }> = {
  ja: { badge: 'Blog', title: 'ブログ', subtitle: 'AI、Web開発、構築についての思考。' },
  zh: { badge: '博客', title: '博客', subtitle: '关于AI、Web开发和构建的思考。' },
  en: { badge: 'Blog', title: 'Blog', subtitle: 'Thoughts on AI, web development, and building things.' },
}

interface BlogListProps {
  posts: Post[]
  tags: string[]
  categories: string[]
  locale: string
  totalPosts: number
  totalPages: number
  currentPage: number
  firstPageUrl: string
}

export default function BlogList({ posts, tags, categories, locale, totalPosts, totalPages, currentPage, firstPageUrl }: BlogListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const t = labels[locale] || labels.en
  const meta = pageTitle[locale] || pageTitle.en

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
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
    <div className="relative overflow-hidden">
      {/* Subtle central glow — matches hero */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at center top, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.08) 40%, rgba(15,20,40,0) 70%)',
        }}
      />

      <div className="container-custom relative z-10 py-16 md:py-24">
        {/* Header — glowing white title, matches hero language */}
        <div className="mb-12 md:mb-16 max-w-3xl">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] tracking-[0.12em] uppercase mb-6"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255, 255, 255, 0.75)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background: '#3B82F6',
                boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)',
              }}
            />
            {meta.badge}
          </span>
          <h1
            className="text-white tracking-tight mb-5"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(36px, 5vw, 56px)',
              lineHeight: 1.15,
              textShadow:
                '0 0 40px rgba(59, 130, 246, 0.25), 0 0 80px rgba(139, 92, 246, 0.12)',
            }}
          >
            {meta.title}
          </h1>
          <p
            className="text-lg"
            style={{ color: 'rgba(255, 255, 255, 0.75)' }}
          >
            {meta.subtitle}
          </p>
        </div>

        {/* Filters — PC: dropdown + search on one row; Mobile: stacked */}
        <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <CategoryDropdown
            categories={categories}
            value={selectedCategory}
            onChange={(v) => setSelectedCategory(v)}
            label={t.allCategories}
          />

          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'rgba(255, 255, 255, 0.45)' }}
            />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="blog-search w-full pl-11 pr-11 py-3 rounded-xl text-sm focus:outline-none"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="blog-clear absolute right-4 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs sm:ml-2 self-start sm:self-auto blog-clear-link"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(255, 255, 255, 0.55)',
              }}
            >
              {t.clearFilters}
            </button>
          )}
        </div>

        {/* Subtle divider */}
        <div
          className="mb-10 h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.10) 50%, transparent)',
          }}
        />

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} locale={locale} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <p style={{ color: 'rgba(255, 255, 255, 0.55)' }}>{t.noResults}</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-sm blog-cta-link"
                style={{ color: '#3B82F6' }}
              >
                {t.clearFilters}
              </button>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-2"
            aria-label="Blog pagination"
          >
            {currentPage > 1 && (
              <Link
                href={currentPage - 1 === 1 ? firstPageUrl : firstPageUrl + '/page/' + (currentPage - 1)}
                className="blog-page-link px-4 py-2 rounded-lg text-sm"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                ← Prev
              </Link>
            )}
            <span
              className="px-3 text-sm"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(255, 255, 255, 0.55)',
              }}
            >
              Page {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={currentPage + 1 === 1 ? firstPageUrl : firstPageUrl + '/page/' + (currentPage + 1)}
                className="blog-page-link px-4 py-2 rounded-lg text-sm"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                Next →
              </Link>
            )}
          </nav>
        )}

        <div
          className="mt-6 text-xs text-center"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          {t.showing.replace('{count}', String(filteredPosts.length)).replace('{total}', String(totalPosts))}
        </div>
      </div>

      <style jsx>{`
        .blog-search {
          transition: border-color 200ms ease, background 200ms ease, box-shadow 200ms ease;
        }

        .blog-search:focus {
          border-color: rgba(59, 130, 246, 0.6) !important;
          background: rgba(59, 130, 246, 0.05) !important;
          box-shadow:
            0 0 0 4px rgba(59, 130, 246, 0.10),
            0 0 24px rgba(59, 130, 246, 0.18);
        }
        @keyframes dropdownOpen {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .blog-clear { color: rgba(255, 255, 255, 0.5); transition: color 200ms ease; }
        .blog-clear:hover { color: #3b82f6; }
        .blog-clear-link { transition: color 200ms ease; }
        .blog-clear-link:hover { color: #3b82f6 !important; }
        .blog-cta-link { transition: text-decoration 200ms ease; }
        .blog-cta-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
