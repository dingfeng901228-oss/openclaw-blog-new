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
    <article className={`card group cursor-pointer ${featured ? 'md:col-span-2' : ''}`}>
      <Link href={`/${locale}/blog/${post.slug}`} className="block p-6 md:p-8">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded-md bg-accent-blue/10 text-accent-blue text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3
          className={`font-bold text-text-primary group-hover:text-accent-blue transition-colors duration-200 mb-3 ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}
        >
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-text-muted text-xs">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTime}
          </span>
        </div>

        {/* Read More */}
        <div className="mt-4 flex items-center text-accent-blue text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {locale === 'ja' ? '記事を読む' : locale === 'zh' ? '阅读全文' : 'Read Article'}
          <ArrowRight className="ml-1 w-4 h-4" />
        </div>
      </Link>
    </article>
  )
}