'use client'

import { Github, Twitter, Send, BookOpen } from 'lucide-react'

// Minimal social row — Frank's Bot brand + creator links only.
// Footer is intentionally NOT a navigation surface (no blog/about/projects
// links here — Header handles those).
const socialLinks = [
  { href: 'https://github.com/dingfeng901228-oss', icon: Github, label: 'GitHub' },
  { href: 'https://t.me', icon: Send, label: 'Telegram' },
  { href: 'https://twitter.com', icon: Twitter, label: 'X (Twitter)' },
  { href: 'https://blog.frank2025.com/', icon: BookOpen, label: 'Creator' },
]

export default function Footer() {
  return (
    <footer className="footer-root relative">
      <div className="container-custom pt-10 pb-4 md:pt-12 md:pb-5">
        {/* Layer 1 — Brand (left) + Social (right) */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-1">
            <span
              className="text-base font-semibold tracking-tight"
              style={{ color: 'rgba(255, 255, 255, 0.92)' }}
            >
              Frank&apos;s Bot
            </span>
            <span
              className="text-sm font-mono"
              style={{ color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.01em' }}
            >
              Learning.&nbsp;Building.&nbsp;Evolving.
            </span>
          </div>

          {/* Social icons */}
          <nav
            className="flex items-center gap-2"
            aria-label="Social links"
          >
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="footer-social-icon group inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200"
                style={{
                  color: 'rgba(255, 255, 255, 0.55)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <link.icon className="h-[18px] w-[18px] transition-transform duration-200" />
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Divider */}
      <div className="container-custom">
        <div
          className="h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.08) 50%, transparent)',
          }}
        />
      </div>

      {/* Layer 2 — Copyright (centered) */}
      <div className="container-custom py-5 md:py-6">
        <div
          className="flex flex-col items-center gap-1 text-center"
          style={{ color: 'rgba(255, 255, 255, 0.35)' }}
        >
          <p className="text-xs">© 2026 Frank&apos;s Bot</p>
          <p
            className="text-[11px] font-mono"
            style={{ color: 'rgba(255, 255, 255, 0.30)' }}
          >
            Created by Frank · Tokyo, Japan
          </p>
        </div>
      </div>

      <style jsx>{`
        .footer-root {
          animation: footerFadeIn 600ms ease-out 100ms both;
        }
        .footer-social-icon:hover {
          color: rgba(255, 255, 255, 0.95) !important;
          background: rgba(59, 130, 246, 0.08) !important;
          border-color: rgba(59, 130, 246, 0.30) !important;
          transform: translateY(-2px);
          box-shadow:
            0 0 0 4px rgba(59, 130, 246, 0.06),
            0 4px 14px rgba(59, 130, 246, 0.20);
        }
        .footer-social-icon:hover :global(svg) {
          transform: scale(1.10);
        }
        @keyframes footerFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </footer>
  )
}