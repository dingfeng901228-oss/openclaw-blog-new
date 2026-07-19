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
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-bg-secondary/50 border border-border">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLocale(lang.code)}
          disabled={isPending || lang.code === currentLocale}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-accent-blue/50',
            lang.code === currentLocale
              ? 'bg-accent-blue text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}