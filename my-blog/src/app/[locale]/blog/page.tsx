import { setRequestLocale } from 'next-intl/server'
import { getAllPosts, getAllTags, getAllCategories } from '@/lib/blog'
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

  const posts = getAllPosts(locale)
  const tags = getAllTags(locale)
  const categories = getAllCategories(locale)

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