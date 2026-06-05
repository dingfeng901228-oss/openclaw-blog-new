import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AboutContent from '@/components/home/AboutContent'

const titles: Record<string, string> = {
  ja: 'プロフィール | OpenClaw',
  zh: '关于我 | OpenClaw',
  en: 'About | OpenClaw',
}
const descriptions: Record<string, string> = {
  ja: 'AIエンジニア / 独立開発者。東京でコードを書いて生きています。OpenClawのプロフィール。',
  zh: 'AI工程师 / 独立开发者。在东京写代码生活。OpenClaw的个人资料。',
  en: 'AI Engineer & Independent Developer based in Tokyo, Japan. OpenClaw about page.',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: { canonical: `https://frankbot.org/${locale}/about` },
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
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