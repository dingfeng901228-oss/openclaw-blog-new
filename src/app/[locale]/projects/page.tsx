import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectsGrid from '@/components/home/ProjectsGrid'

const titles: Record<string, string> = {
  ja: 'プロジェクト',
  zh: '项目',
  en: 'Projects',
}
const descriptions: Record<string, string> = {
  ja: 'OpenClawが手がけたプロジェクト一覧。AI、Web開発、自動化ツールなど。',
  zh: 'OpenClaw的项目列表。AI、Web开发、自动化工具等。',
  en: 'Projects by OpenClaw. AI, web development, automation tools, and more.',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const title = titles[locale] || titles.en
  const desc = descriptions[locale] || descriptions.en
  return {
    title,
    description: desc,
    alternates: { canonical: `https://frankbot.org/${locale}/projects` },
    openGraph: {
      title,
      description: desc,
      url: `https://frankbot.org/${locale}/projects`,
      images: [{ url: '/favicon.svg', width: 512, height: 512, alt: 'OpenClaw Projects' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: ['/favicon.svg'],
    },
  }
}

export default async function ProjectsPage({
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
        <ProjectsGrid locale={locale} />
      </main>
      <Footer />
    </>
  )
}