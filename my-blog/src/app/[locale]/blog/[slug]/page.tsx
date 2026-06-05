import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostBySlug, getAllPosts, postExists, getAvailableLocales, localeHasContent } from '@/lib/blog'
import type { Locale } from '@/lib/types'
import type { Metadata } from 'next'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Calendar, Clock, Tag, Globe } from 'lucide-react'
import Giscus from '@/components/blog/Giscus'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { setRequestLocale } from 'next-intl/server'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const post = getPostBySlug(locale as Locale, slug)

  if (!post || !post.localeHasContent) {
    return { title: 'Post Not Found | OpenClaw' }
  }

  const ogImage = post.featured ? { url: `/images/posts/${slug}.png`, width: 1200, height: 630, alt: post.title } : undefined

  return {
    title: `${post.title} | OpenClaw`,
    description: post.excerpt,
    alternates: {
      canonical: `https://frankbot.org/${locale}/blog/${slug}`,
      languages: {
        'ja': localeHasContent(slug, 'ja') ? `https://frankbot.org/ja/blog/${slug}` : undefined,
        'zh': localeHasContent(slug, 'zh') ? `https://frankbot.org/zh/blog/${slug}` : undefined,
        'en': localeHasContent(slug, 'en') ? `https://frankbot.org/en/blog/${slug}` : undefined,
      },
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `https://frankbot.org/${locale}/blog/${slug}`,
      publishedTime: post.date,
      tags: post.tags,
      images: ogImage ? [ogImage] : [{ url: '/favicon.svg', width: 512, height: 512, alt: 'OpenClaw' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

const labels: Record<string, { back: string; notAvailable: string; tags: string; readIn: string }> = {
  ja: {
    back: 'ブログに戻る',
    notAvailable: 'この記事は日本語版がありません。',
    tags: 'タグ',
    readIn: 'この文章は',
  },
  zh: {
    back: '返回博客',
    notAvailable: '这篇文章暂无中文版。',
    tags: '标签',
    readIn: '本文可在',
  },
  en: {
    back: 'Back to Blog',
    notAvailable: 'This article is not yet available in your language.',
    tags: 'Tags',
    readIn: 'Read this in',
  },
}

const localeNames: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  zh: '中文',
}

export async function generateStaticParams() {
  const locales = ['en', 'ja', 'zh']
  const params: { locale: string; slug: string }[] = []

  for (const locale of locales) {
    const posts = getAllPosts(locale as Locale)
    for (const post of posts) {
      params.push({ locale, slug: post.slug })
    }
  }

  return params
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params

  if (!['ja', 'zh', 'en'].includes(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const post = getPostBySlug(locale as Locale, slug)
  const t = labels[locale] || labels.en

  // Get available translations for this article
  const availableLocales = getAvailableLocales(slug)

  // If requested locale doesn't exist, redirect or show 404
  if (!post || !post.localeHasContent) {
    // Check if it exists in any locale - if so, could redirect
    if (availableLocales.length > 0) {
      // Article exists but not in this locale
      notFound()
    } else {
      notFound()
    }
  }

  const displayPost = post!

  const htmlContent = convertMarkdown(displayPost.content || '')

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: displayPost.title,
    description: displayPost.excerpt,
    datePublished: displayPost.date,
    dateModified: displayPost.date,
    author: {
      '@type': 'Person',
      name: 'OpenClaw',
      url: `https://frankbot.org/${locale}/about`,
    },
    url: `https://frankbot.org/${locale}/blog/${slug}`,
    image: 'https://frankbot.org/favicon.svg',
    keywords: displayPost.tags?.join(', '),
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: 'OpenClaw Blog',
      logo: { '@type': 'ImageObject', url: 'https://frankbot.org/favicon.svg' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://frankbot.org/${locale}/blog/${slug}`,
    },
  }

  return (
    <>\n      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <Header />
      <main className="min-h-screen pt-20">
        <article className="container-custom py-12 md:py-16 max-w-4xl">
          {/* Back */}
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t.back}
          </Link>

          {/* Fallback Notice */}
          {availableLocales.length > 1 && availableLocales.filter(l => l !== locale).length > 0 && (
            <div className="mb-8 p-4 rounded-lg bg-bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                <Globe className="w-4 h-4 text-accent-blue" />
                <span>{t.readIn}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableLocales.map((loc) => {
                  if (loc === locale) return null
                  return (
                    <Link
                      key={loc}
                      href={`/${loc}/blog/${slug}`}
                      className="px-3 py-1.5 rounded-lg bg-bg-tertiary/50 border border-border hover:border-accent-blue hover:text-accent-blue text-sm transition-all duration-200"
                    >
                      {localeNames[loc]}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Header */}
          <header className="mb-12">
            {displayPost.tags && displayPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {displayPost.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue text-sm font-medium flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6 leading-tight">
              {displayPost.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-text-secondary text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(displayPost.date)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {displayPost.readingTime}
              </span>
            </div>
          </header>

          <div className="h-px bg-border mb-12" />

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          <footer className="mt-16 pt-8 border-t border-border">
            <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
          </footer>

          {/* Comments via Giscus */}
          <Giscus
            lang={locale === 'zh' ? 'zh-CN' : locale}
          />
        </article>
      </main>
      <Footer />
    </>
  )
}

function convertMarkdown(content: string): string {
  // Process code blocks FIRST so their content is protected from later regexes
  const codeBlockPlaceholders: string[] = []
  let processed = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, _lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    const placeholder = `%%CODEBLOCK_${codeBlockPlaceholders.length}%%`
    codeBlockPlaceholders.push(
      `<pre class="bg-bg-tertiary rounded-lg p-4 my-6 overflow-x-auto border border-border"><code class="text-sm text-text-secondary font-mono">${escaped.replace(/\n/g, '<br />')}</code></pre>`
    )
    return placeholder
  })

  // Apply markdown transformations (safe from code block interference)
  processed = processed
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold text-text-primary mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold text-text-primary mt-10 mb-4">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-text-primary mt-10 mb-6">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-text-primary">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-bg-tertiary px-1.5 py-0.5 rounded text-accent-blue text-sm font-mono">$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-6 w-full" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent-blue hover:underline" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.*$)/gm, '<li class="ml-6 text-text-secondary list-disc marker:text-accent-blue">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-6 text-text-secondary list-decimal marker:text-accent-blue">$2</li>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-accent-blue pl-4 my-4 text-text-secondary italic">$1</blockquote>')
    .replace(/\n\n/g, '</p><p class="text-text-secondary leading-relaxed my-4">')
    .replace(/\n/g, '<br />')

  // Restore code blocks (replace placeholders with actual HTML)
  for (let i = 0; i < codeBlockPlaceholders.length; i++) {
    processed = processed.replace(`%%CODEBLOCK_${i}%%`, codeBlockPlaceholders[i])
  }

  return processed
}