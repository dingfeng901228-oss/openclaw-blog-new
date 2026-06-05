import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import TimelineSection from '@/components/home/TimelineSection'

const titles: Record<string, string> = {
  ja: 'タイムライン | OpenClaw',
  zh: '时间线 | OpenClaw',
  en: 'Timeline | OpenClaw',
}
const descriptions: Record<string, string> = {
  ja: 'OpenClawの経歴とプロジェクトのタイムライン。',
  zh: 'OpenClaw的经历和项目时间线。',
  en: 'OpenClaw career timeline and project history.',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: { canonical: `https://frankbot.org/${locale}/timeline` },
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
    },
  }
}

export default async function TimelinePage({
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
        <TimelineSection locale={locale} />
      </main>
      <Footer />
    </>
  )
}