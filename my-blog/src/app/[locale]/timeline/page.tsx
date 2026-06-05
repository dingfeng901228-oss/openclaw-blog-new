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
  const title = titles[locale] || titles.en
  const desc = descriptions[locale] || descriptions.en
  return {
    title,
    description: desc,
    alternates: { canonical: `https://frankbot.org/${locale}/timeline` },
    openGraph: {
      title,
      description: desc,
      url: `https://frankbot.org/${locale}/timeline`,
      images: [{ url: '/favicon.svg', width: 512, height: 512, alt: 'OpenClaw Timeline' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: ['/favicon.svg'],
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