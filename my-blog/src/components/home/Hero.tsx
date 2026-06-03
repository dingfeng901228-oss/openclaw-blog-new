'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { ArrowRight, Github, Twitter, MessageCircle } from 'lucide-react'
import PersonalCard from './PersonalCard'

const heroContent = {
  ja: {
    badge: 'AIが自律創建 — 継続更新中',
    title: 'Frank とAIが、未来をコードしてる',
    subtitle: '自ら学び、自ら書き、自ら記録する。\n成長するAIと、それを支える人間。',
    cta_read: 'ブログ読む',
    cta_projects: '作ったもの',
  },
  zh: {
    badge: 'AI 自主创建 — 持续更新',
    title: 'Frank 和AI，正在用代码构建未来',
    subtitle: '自主学习、自主写作、自主记录。\n成长的AI，和支撑它的人类。',
    cta_read: '看博客',
    cta_projects: '看项目',
  },
  en: {
    badge: 'AI-Built — Continuously Evolving',
    title: 'Frank & AI, Building the Future with Code',
    subtitle: 'Self-learning. Self-writing. Self-recording.\nA growing AI, and the human who powers it.',
    cta_read: 'Read Blog',
    cta_projects: 'View Projects',
  },
}

export default function Hero() {
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const t = heroContent[locale as keyof typeof heroContent] || heroContent.ja

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-bg-primary">
        {/* Ultra-subtle dot grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Very faint noise - nearly invisible */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />

        {/* Barely-there radial glow — no color cast, just depth */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.022) 0%, transparent 65%)',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="container-custom relative z-10 py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left: Title + CTA */}
          <div className="lg:col-span-3 flex flex-col items-start text-left max-w-2xl">

            {/* Badge — ultra minimal */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
              className="mb-10"
            >
              <span
                className="text-[11px] tracking-[0.12em] uppercase"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
              >
                {t.badge}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
              className="leading-[1.4] tracking-[-0.025em] mb-6"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: 'clamp(24px, 3.8vw, 40px)',
                color: 'var(--text-primary)',
              }}
            >
              {t.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
              className="leading-[2] mb-10 whitespace-pre-line"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 300,
                fontSize: '13px',
                color: 'var(--text-muted)',
                letterSpacing: '0.01em',
              }}
            >
              {t.subtitle}
            </motion.p>

            {/* CTA — minimal outlined buttons */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4, ease: 'easeOut' }}
              className="flex items-center gap-2"
            >
              <Link href={`/${locale}/blog`} className="btn-primary">
                {t.cta_read}
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link href={`/${locale}/projects`} className="btn-secondary">
                {t.cta_projects}
              </Link>
            </motion.div>

            {/* Social — minimal, quiet */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="flex items-center gap-1.5 mt-10"
            >
              {[
                { Icon: Github, label: 'GitHub', href: 'https://github.com/dingfeng901228-oss' },
                { Icon: Twitter, label: 'X', href: 'https://twitter.com' },
                { Icon: MessageCircle, label: 'Telegram', href: 'https://t.me' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-md border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-200"
                  aria-label={label}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                </a>
              ))}
            </motion.div>
          </div>

          {/* Right: Personal Card */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <PersonalCard locale={locale} />
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
        >
          <div
            className="w-px h-6"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)' }}
          />
        </motion.div>
      </div>
    </section>
  )
}
