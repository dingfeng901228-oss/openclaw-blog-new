import Link from 'next/link'
import { Github, Twitter, MessageCircle, Mail } from 'lucide-react'

const socialLinks = [
  { href: 'https://github.com', icon: Github, label: 'GitHub' },
  { href: 'https://twitter.com', icon: Twitter, label: 'X (Twitter)' },
  { href: 'https://t.me', icon: MessageCircle, label: 'Telegram' },
  { href: 'mailto:hello@frankbot.org', icon: Mail, label: 'Email' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-bg-secondary/30">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/ja" className="inline-flex items-center gap-2 text-text-primary font-bold text-xl mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
                <span className="text-white font-bold text-sm">OC</span>
              </div>
              <span>Frank's Bot</span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed max-w-md mb-6">
              東京まれの独立開発者。AIと自動化で生きている。<br />
              コードを書くのが好きで、毎日何かしら作ってます。
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-bg-tertiary/50 border border-border hover:border-border-hover hover:bg-bg-tertiary transition-all duration-200"
                  aria-label={link.label}
                >
                  <link.icon className="w-4 h-4 text-text-secondary hover:text-text-primary" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-text-primary font-semibold text-sm mb-4">ナビゲーション</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/ja/blog', label: 'ブログ' },
                { href: '/ja/projects', label: '作ったもの' },
                { href: '/ja/timeline', label: '足跡' },
                { href: '/ja/about', label: 'プロフィール' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-xs">
            © {currentYear} Frank's Bot. All rights reserved.
          </p>
          <p className="text-text-muted text-xs">
            Next.js + Tailwind CSS + ❤️
          </p>
        </div>
      </div>
    </footer>
  )
}