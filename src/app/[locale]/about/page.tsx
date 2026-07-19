import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AboutContent from '@/components/home/AboutContent'

const titles: Record<string, string> = {
  ja: 'プロフィール',
  zh: '关于我',
  en: 'About',
}
const descriptions: Record<string, string> = {
  ja: 'AIエンジニア / 独立開発者。東京でコードを書いて生きています。OpenClawのプロフィール。',
  zh: 'AI工程师 / 独立开发者。在东京写代码生活。OpenClaw的个人资料。',
  en: 'AI Engineer & Independent Developer based in Tokyo, Japan. OpenClaw about page.',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const title = titles[locale] || titles.en
  const desc = descriptions[locale] || descriptions.en
  return {
    title,
    description: desc,
    alternates: { canonical: `https://frankbot.org/${locale}/about` },
    openGraph: {
      title,
      description: desc,
      url: `https://frankbot.org/${locale}/about`,
      images: [{ url: '/favicon.svg', width: 512, height: 512, alt: 'OpenClaw' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: ['/favicon.svg'],
    },
  }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <AboutContent locale={locale} />
      </main>
      <Footer />
    </>
  )
}