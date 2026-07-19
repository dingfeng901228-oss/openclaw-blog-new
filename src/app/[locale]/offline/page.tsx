import type { Metadata } from 'next'
import OfflineRetryButton from '@/components/pwa/OfflineRetryButton'

const metaByLocale: Record<string, { title: string; subtitle: string; body: string; retry: string }> = {
  ja: {
    title: 'オフライン',
    subtitle: 'インターネット接続がありません。',
    body: 'このページはキャッシュされていないため、オフラインでは表示できません。接続が回復したら、もう一度お試しください。',
    retry: '再試行',
  },
  zh: {
    title: '离线',
    subtitle: '没有网络连接。',
    body: '此页面未被缓存，无法在离线状态下显示。网络恢复后请重试。',
    retry: '重试',
  },
  en: {
    title: 'Offline',
    subtitle: 'No internet connection.',
    body: "This page isn't cached, so it can't be shown while you're offline. Please try again once your connection is back.",
    retry: 'Retry',
  },
}

export async function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'zh' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const m = metaByLocale[locale] || metaByLocale.en
  return { title: m.title }
}

export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const m = metaByLocale[locale] || metaByLocale.en

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div
          aria-hidden="true"
          style={{
            fontSize: '64px',
            lineHeight: 1,
            marginBottom: '20px',
            opacity: 0.6,
          }}
        >
          📡
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '32px',
            color: '#ffffff',
            marginBottom: '12px',
            textShadow: '0 0 24px rgba(59, 130, 246, 0.18)',
          }}
        >
          {m.title}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.75)',
            marginBottom: '24px',
          }}
        >
          {m.subtitle}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.55)',
            marginBottom: '28px',
          }}
        >
          {m.body}
        </p>
        <OfflineRetryButton label={m.retry} />
      </div>
    </div>
  )
}