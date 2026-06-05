import { setRequestLocale } from 'next-intl/server'
import { getAllPosts } from '@/lib/blog'
import type { Locale } from '@/lib/types'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'

const metadataDescriptions: Record<string, string> = {
  ja: 'AIエンジニア / 独立開発者 / テッククリエイター。AI、Web開発、自動化について探索する技術ブログ。',
  zh: 'AI工程师 / 独立开发者 / 技术创造者。探索AI、Web开发、自动化的技术博客。',
  en: 'AI Engineer / Independent Developer / Tech Creator. Thoughts on AI, web development, and automation.',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const ogLocale = locale === 'ja' ? 'ja_JP' : locale === 'zh' ? 'zh_CN' : 'en_US'
  const titles: Record<string, string> = {
    ja: 'OpenClaw | AIエンジニア & 独立開発者',
    zh: 'OpenClaw | AI工程师 & 独立开发者',
    en: 'OpenClaw | AI Engineer & Independent Developer',
  }
  const title = titles[locale] || titles.en
  const desc = metadataDescriptions[locale] || metadataDescriptions.en
  return {
    title,
    description: desc,
    alternates: { canonical: `https://frankbot.org/${locale}` },
    openGraph: {
      type: 'website',
      locale: ogLocale,
      siteName: 'OpenClaw Blog',
      title,
      description: desc,
      url: `https://frankbot.org/${locale}`,
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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
      </main>
      <Footer />
    </>
  )
}
