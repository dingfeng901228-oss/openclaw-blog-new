import { setRequestLocale } from 'next-intl/server'
import { getAllPosts, getAllTags, getAllCategories } from '@/lib/blog'
import type { Locale } from '@/lib/types'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BlogList from '@/components/blog/BlogList'

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