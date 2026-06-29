import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC, Noto_Sans_JP } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// SEO metadata per locale
const metadataTitles: Record<string, { default: string; template: string }> = {
  ja: { default: 'OpenClaw | AIエンジニア & 独立開発者', template: '%s | OpenClaw' },
  zh: { default: 'OpenClaw | AI工程师 & 独立开发者', template: '%s | OpenClaw' },
  en: { default: 'OpenClaw | AI Engineer & Independent Developer', template: '%s | OpenClaw' },
}
const metadataDescriptions: Record<string, string> = {
  ja: 'AIエンジニア / 独立開発者 / テッククリエイター。AI、Web開発、自動化について探索する技術ブログ。',
  zh: 'AI工程师 / 独立开发者 / 技术创造者。探索AI、Web开发、自动化的技术博客。',
  en: 'AI Engineer / Independent Developer / Tech Creator. Thoughts on AI, web development, and automation.',
}
const metadataBase = new URL('https://frankbot.org')
const ogImages = [{ url: '/favicon.svg', width: 512, height: 512, alt: 'OpenClaw Blog' }]

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const meta = metadataTitles[locale] || metadataTitles.ja
  const desc = metadataDescriptions[locale] || metadataDescriptions.ja
  return {
    title: meta,
    description: desc,
    metadataBase,
    alternates: {
      canonical: `https://frankbot.org/${locale}`,
      languages: {
        'ja': 'https://frankbot.org/ja',
        'zh': 'https://frankbot.org/zh',
        'en': 'https://frankbot.org/en',
        'x-default': 'https://frankbot.org/ja',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'ja' ? 'ja_JP' : locale === 'zh' ? 'zh_CN' : 'en_US',
      siteName: 'OpenClaw Blog',
      title: meta.default,
      description: desc,
      url: `https://frankbot.org/${locale}`,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.default,
      description: desc,
      images: ['/favicon.svg'],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sc',
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-jp',
  display: 'swap',
})

const locales = ['ja', 'zh', 'en']

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!locales.includes(locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  const desc = metadataDescriptions[locale] || metadataDescriptions.ja

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OpenClaw Blog',
    url: `https://frankbot.org/${locale}`,
    description: desc,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://frankbot.org/${locale}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang={locale} className={`${inter.variable} ${notoSansSC.variable} ${notoSansJP.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="alternate" hrefLang="ja" href="https://frankbot.org/ja" />
        <link rel="alternate" hrefLang="zh" href="https://frankbot.org/zh" />
        <link rel="alternate" hrefLang="en" href="https://frankbot.org/en" />
        <link rel="alternate" hrefLang="x-default" href="https://frankbot.org/ja" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-bg-primary font-sans antialiased">
        <ServiceWorkerRegister />
        <NextIntlClientProvider messages={messages}>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>
          <InstallPrompt />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}