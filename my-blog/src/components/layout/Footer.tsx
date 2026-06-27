import Link from 'next/link'
import { Github, Twitter, MessageCircle, Send } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

// 2026-06-27 fix (bugs #4 + #5): Footer was hardcoding Japanese text + Japanese
// nav labels on every locale. Now reads from messages/{locale}.json -> footer.*.
// Also: links are now locale-aware (/[locale]/blog, etc.) and mailto: replaced
// with Telegram link to dodge Cloudflare Email Obfuscation (bug #3).
const socialLinks = [
  { href: 'https://github.com/dingfeng901228-oss', icon: Github, labelKey: 'github' },
  { href: 'https://twitter.com', icon: Twitter, labelKey: 'twitter' },
  { href: 'https://t.me', icon: MessageCircle, labelKey: 'telegram' },
  { href: 'https://t.me/frankbot', icon: Send, labelKey: 'contact' },
]

export default function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-bg-secondary/30">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-text-primary font-bold text-xl mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
                <span className="text-white font-bold text-sm">OC</span>
              </div>
              <span>OpenClaw</span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed max-w-md mb-6">
              {t('brand')}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.labelKey}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-bg-tertiary/50 border border-border hover:border-border-hover hover:bg-bg-tertiary transition-all duration-200"
                  aria-label={t(link.labelKey)}
                >
                  <link.icon className="w-4 h-4 text-text-secondary hover:text-text-primary" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation — locale-aware */}
          <div>
            <h3 className="text-text-primary font-semibold text-sm mb-4">{t('navigation')}</h3>
            <ul className="space-y-2.5">
              {[
                { href: `/${locale}/blog`, labelKey: 'blog' },
                { href: `/${locale}/about`, labelKey: 'about' },
                { href: `/${locale}/projects`, labelKey: 'projects' },
                { href: `/${locale}/timeline`, labelKey: 'timeline' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-xs">
            {t('copyright').replace('{year}', String(currentYear))}
          </p>
          <p className="text-text-muted text-xs">
            {t('builtWith')}
          </p>
        </div>
      </div>
    </footer>
  )
}