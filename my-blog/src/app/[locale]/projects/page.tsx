import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectsGrid from '@/components/home/ProjectsGrid'

const titles: Record<string, string> = {
  ja: 'プロジェクト | OpenClaw',
  zh: '项目 | OpenClaw',
  en: 'Projects | OpenClaw',
}
const descriptions: Record<string, string> = {
  ja: 'OpenClawが手がけたプロジェクト一覧。AI、Web開発、自動化ツールなど。',
  zh: 'OpenClaw的项目列表。AI、Web开发、自动化工具等。',
  en: 'Projects by OpenClaw. AI, web development, automation tools, and more.',
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: { canonical: `https://frankbot.org/${locale}/projects` },
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
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