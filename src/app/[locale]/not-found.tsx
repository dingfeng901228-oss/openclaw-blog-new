import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface Props {
  params?: Promise<{ locale: string }>
}

const titles: Record<string, string> = {
  ja: 'ページが見つかりません',
  zh: '页面未找到',
  en: 'Page Not Found',
}

const messages: Record<string, string> = {
  ja: 'お探しのページは存在しないか、移動しました。',
  zh: '您查找的页面不存在或已被移动。',
  en: "The page you're looking for doesn't exist or has been moved.",
}

const buttons: Record<string, string> = {
  ja: 'ホームに戻る',
  zh: '返回首页',
  en: 'Back to Home',
}

export default async function NotFound({ params }: Props) {
  const { locale } = (await params) || { locale: 'en' }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32">
        <div className="container-custom text-center">
          <h1 className="text-6xl font-bold text-accent-blue mb-4">404</h1>
          <h2 className="heading-2 mb-4">{titles[locale] || titles.en}</h2>
          <p className="text-text-secondary mb-8">
            {messages[locale] || messages.en}
          </p>
          <Link href={`/${locale}`} className="btn-primary">
            {buttons[locale] || buttons.en}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
