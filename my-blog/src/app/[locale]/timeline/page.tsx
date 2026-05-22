import { setRequestLocale } from 'next-intl/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import TimelineSection from '@/components/home/TimelineSection'

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