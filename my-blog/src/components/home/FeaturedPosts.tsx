'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Post } from '@/lib/types'

const labels = {
  ja: {
    badge: 'FEATURED',
    title: '最近の記事',
    subtitle: 'AI、Web開発、そして構築の旅。',
    cta: 'すべての記事',
    reading: '読む',
  },
  zh: {
    badge: '精选',
    title: '精选文章',
    subtitle: '关于AI、Web开发和构建的旅程。',
    cta: '所有文章',
    reading: '阅读',
  },
  en: {
    badge: 'FEATURED',
    title: 'Featured Writing',
    subtitle: 'Notes on AI, web dev, and the journey of building.',
    cta: 'All articles',
    reading: 'Read',
  },
}

interface FeaturedPostsProps {
  posts: Post[]
  locale: string
}

export default function FeaturedPosts({ posts, locale }: FeaturedPostsProps) {
  const t = labels[locale as keyof typeof labels] || labels.en
  const top = posts.slice(0, 3)

  if (top.length === 0) return null

  return (
    <section className="py-20 md:py-24 relative">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: '#00D4C8',
                  background: 'rgba(0,212,200,0.08)',
                  border: '1px solid rgba(0,212,200,0.15)',
                }}
              >
                {t.badge}
              </span>
            </div>
            <h2
              className="text-2xl md:text-3xl font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              {t.title}
            </h2>
            <p
              className="text-sm mt-2"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
            >
              {t.subtitle}
            </p>
          </div>
          <Link
            href={`/${locale}/blog`}
            className="hidden md:inline-flex items-center gap-1.5 text-xs transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}
          >
            {t.cta}
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top.map((post, i) => (
            <FeaturedCard
              key={post.slug}
              post={post}
              locale={locale}
              index={i}
              readingLabel={t.reading}
            />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden mt-8 text-center">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-1.5 text-xs"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
          >
            {t.cta}
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function FeaturedCard({
  post,
  locale,
  index,
  readingLabel,
}: {
  post: Post
  locale: string
  index: number
  readingLabel: string
}) {
  const date = new Date(post.date)
  const dateStr = date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale, {
    year: 'numeric',
    month: 'short',
  })
  const readingMinutes = (() => {
    const m = String(post.readingTime || '').match(/(\d+)\s*min/)
    if (m) return `${m[1]} min`
    return ''
  })()

  return (
    <Link href={`/${locale}/blog/${post.slug}`} className="group block">
      <article
        className="relative h-full overflow-hidden rounded-xl p-6 transition-all duration-300"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,212,200,0.1)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        }}
      >
        {/* Index number — top right, subtle */}
        <div className="flex items-start justify-between mb-8">
          <span
            className="text-[10px] uppercase tracking-[0.1em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
          >
            {dateStr}
          </span>
          <span
            className="text-xs font-mono opacity-30 group-hover:opacity-100 transition-opacity duration-300"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
          >
            0{index + 1}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-base md:text-lg font-semibold leading-snug mb-3 transition-colors duration-200 group-hover:!text-[#00D4C8]"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {post.title}
        </h3>

        {/* Excerpt */}
        <p
          className="text-xs leading-relaxed mb-6 line-clamp-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-2">
            {post.tags && post.tags.length > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-muted)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {post.tags[0]}
              </span>
            )}
            {readingMinutes && (
              <span
                className="text-[10px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
              >
                {readingMinutes}
              </span>
            )}
          </div>
          <span
            className="text-[10px] inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ fontFamily: 'var(--font-mono)', color: '#00D4C8' }}
          >
            {readingLabel}
            <ArrowUpRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </article>
    </Link>
  )
}
