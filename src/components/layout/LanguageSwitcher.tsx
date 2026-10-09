'use client'

import { useParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'ja', label: 'JP' },
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'EN' },
]

export default function LanguageSwitcher() {
  const params = useParams()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const currentLocale = (params?.locale as string) || 'ja'

  const switchLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return

    // Build the new path: replace locale segment (index 1) with new locale
    const segments = pathname.split('/')
    if (segments[1] === currentLocale) {
      segments[1] = newLocale
    } else {
      // Fallback: prepend locale if somehow missing
      segments[1] = newLocale
    }
    const newPath = segments.join('/') || `/${newLocale}`

    startTransition(() => {
      window.location.href = newPath
    })
  }

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang, i) => (
        <span key={lang.code} className="flex items-center">
          <button
            onClick={() => switchLocale(lang.code)}
            disabled={isPending || lang.code === currentLocale}
            aria-current={lang.code === currentLocale ? 'true' : undefined}
            className={cn(
              'px-1 py-0.5 text-xs font-medium transition-colors duration-200',
              'focus:outline-none',
              lang.code === currentLocale
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {lang.label}
          </button>
          {i < languages.length - 1 && (
            <span className="text-text-muted/40 text-xs select-none" aria-hidden="true">·</span>
          )}
        </span>
      ))}
    </div>
  )
}