import { setRequestLocale } from 'next-intl/server'
import { getAllPosts, getAllTags, getAllCategories } from '@/lib/blog'
import type { Locale } from '@/lib/types'
import type { Metadata } from 'next'
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const title = titles[locale] || titles.en
  const desc = descriptions[locale] || descriptions.en
  return {
    title,
    description: desc,
    alternates: { canonical: `https://frankbot.org/${locale}/blog` },
    openGraph: {
      title,
      description: desc,
      url: `https://frankbot.org/${locale}/blog`,
      images: [{ url: '/favicon.svg', width: 512, height: 512, alt: 'OpenClaw Blog' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: ['/favicon.svg'],
    },
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const posts = getAllPosts(locale as Locale)
  const tags = getAllTags(locale as Locale)
  const categories = getAllCategories(locale as Locale)

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <BlogList posts={posts} tags={tags} categories={categories} locale={locale} />
      </main>
      <Footer />
    </>
  )
}