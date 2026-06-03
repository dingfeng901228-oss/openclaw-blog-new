import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import type { Post } from '@/lib/types'

interface ArticleCardProps {
  post: Post
  locale: string
  featured?: boolean
}

export default function ArticleCard({ post, locale, featured = false }: ArticleCardProps) {
  return (
    <article className="group relative">
      <Link href={`/${locale}/blog/${post.slug}`} className="block">
        <div
          className="relative p-6 md:p-7 rounded-2xl transition-all duration-300 h-full"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.45)'
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.04)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.12)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(59, 130, 246, 0.95)',
                    background: 'rgba(59, 130, 246, 0.10)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3
            className="tracking-tight mb-3 transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: featured ? '24px' : '19px',
              lineHeight: 1.35,
              color: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p
            className="leading-relaxed mb-5 line-clamp-2"
            style={{
              fontSize: '13.5px',
              color: 'rgba(255, 255, 255, 0.65)',
            }}
          >
            {post.excerpt}
          </p>

          {/* Meta */}
          <div
            className="flex items-center gap-4 text-xs"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {post.readingTime}
            </span>
          </div>

          {/* Read more — appears on hover */}
          <div
            className="mt-4 flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#3B82F6',
            }}
          >
            {locale === 'ja' ? '記事を読む' : locale === 'zh' ? '阅读全文' : 'Read Article'}
            <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
    </article>
  )
}
