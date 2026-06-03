import { setRequestLocale } from 'next-intl/server'
import { getAllPosts } from '@/lib/blog'
import type { Locale } from '@/lib/types'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import StatisticsSection from '@/components/home/StatisticsSection'
import FeaturedPosts from '@/components/home/FeaturedPosts'
import ProjectsGrid from '@/components/home/ProjectsGrid'
import TimelineSection from '@/components/home/TimelineSection'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const posts = getAllPosts(locale as Locale)

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <StatisticsSection locale={locale} />
        <FeaturedPosts posts={posts} locale={locale} />
        <ProjectsGrid locale={locale} />
        <TimelineSection locale={locale} />
      </main>
      <Footer />
    </>
  )
}

