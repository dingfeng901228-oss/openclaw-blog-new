import { setRequestLocale } from 'next-intl/server'
import { getAllPosts, getPostsPage, getAllTags, getAllCategories } from '@/lib/blog'
import type { Locale } from '@/lib/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BlogList from '@/components/blog/BlogList'

const titles: Record<string, string> = {
  ja: 'ブログ',
  zh: '博客',
  en: 'Blog',
}
const descriptions: Record<string, string> = {
  ja: 'AI、Web開発、自動化に関する技術記事。OpenClawのブログ。',
  zh: 'AI、Web开发、自动化相关的技术文章。OpenClaw的博客。',
  en: 'Technical articles on AI, web development, and automation. OpenClaw blog.',
}

// Pre-render all paginated routes at build time.
// Page 1 lives at /blog (rendered by app/[locale]/blog/page.tsx).
// Pages 2+ live at /blog/page/N (this file).
export async function generateStaticParams() {
  const locales: Array<'ja' | 'zh' | 'en'> = ['ja', 'zh', 'en']
  const params: Array<{ locale: string; page: string }> = []
  for (const locale of locales) {
    const totalPosts = getAllPosts(locale as Locale).length
    const totalPages = Math.ceil(totalPosts / 10)
    for (let p = 2; p <= totalPages; p++) {
      params.push({ locale, page: String(p) })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>
}): Promise<Metadata> {
  const { locale, page } = await params
  const title = titles[locale] || titles.en
  const desc = descriptions[locale] || descriptions.en
  const pageNum = parseInt(page, 10)
  return {
    title: `${title} - Page ${pageNum}`,
    description: desc,
    alternates: { canonical: `https://frankbot.org/${locale}/blog/page/${pageNum}` },
    openGraph: {
      title: `${title} - Page ${pageNum}`,
      description: desc,
      url: `https://frankbot.org/${locale}/blog/page/${pageNum}`,
      images: [{ url: '/favicon.svg', width: 512, height: 512, alt: 'OpenClaw Blog' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - Page ${pageNum}`,
      description: desc,
      images: ['/favicon.svg'],
    },
  }
}

export default async function BlogPagedPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>
}) {
  const { locale, page } = await params
  setRequestLocale(locale)

  const pageNum = parseInt(page, 10)
  if (!Number.isFinite(pageNum) || pageNum < 2) {
    notFound()
  }

  const { posts, totalPosts, totalPages, currentPage } = getPostsPage(
    locale as Locale,
    pageNum
  )
  if (currentPage !== pageNum || posts.length === 0) {
    notFound()
  }

  const tags = getAllTags(locale as Locale)
  const categories = getAllCategories(locale as Locale)

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <BlogList
          posts={posts}
          tags={tags}
          categories={categories}
          locale={locale}
          totalPosts={totalPosts}
          totalPages={totalPages}
          currentPage={currentPage}
          firstPageUrl={`/${locale}/blog`}
        />
      </main>
      <Footer />
    </>
  )
}
