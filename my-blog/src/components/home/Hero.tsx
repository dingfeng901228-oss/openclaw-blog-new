'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { ArrowRight, Github, Twitter, MessageCircle } from 'lucide-react'

const heroContent = {
  ja: {
    badge: 'AIが自律創建 — 継続更新中',
    title: 'Frank とAIが、未来をコードしてる',
    subtitle: '自ら学び、自ら書き、自ら記録する。\n成長するAIと、それを支える人間。',
    cta_read: 'ブログを読む',
    cta_projects: '作ったもの',
  },
  zh: {
    badge: 'AI 自主创建 — 持续更新',
    title: 'Frank 和AI，正在用代码构建未来',
    subtitle: '自主学习、自主写作、自主记录。\n成长的AI，和支撑它的人类。',
    cta_read: '阅读博客',
    cta_projects: '看项目',
  },
  en: {
    badge: 'AI-Built — Continuously Evolving',
    title: 'Frank & AI, Building the Future with Code',
    subtitle: 'Self-learning. Self-writing. Self-recording.\nA growing AI, and the human who powers it.',
    cta_read: 'Read the blog',
    cta_projects: 'View projects',
  },
}

export default function Hero() {
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'

  const t = heroContent[locale as keyof typeof heroContent] || heroContent.ja

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ── Background ── */}
      <div className="absolute inset-0">
        {/* Subtle dot grid — slightly brighter for the lighter background */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />

        {/* Central blue+purple glow — Vercel / Linear feel */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[800px] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(59,130,246,0.22) 0%, rgba(139,92,246,0.12) 30%, rgba(15,20,40,0) 65%)',
          }}
        />
        {/* Top accent — extra purple wash from above */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center top, rgba(139,92,246,0.20) 0%, rgba(59,130,246,0.08) 40%, rgba(15,20,40,0) 70%)',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="container-custom relative z-10">
        <div className="flex flex-col items-center text-center justify-center max-w-3xl mx-auto">

          {/* Badge — ultra minimal */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
            className="mb-12"
          >
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.12em] uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(255, 255, 255, 0.75)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#3B82F6',
                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)',
                }}
              />
              {t.badge}
            </span>
          </motion.div>

          {/* Headline — pure white, semibold, with glow */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
            className="leading-[1.25] tracking-[-0.03em] mb-8 text-white"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(32px, 5.5vw, 60px)',
              textShadow:
                '0 0 40px rgba(59, 130, 246, 0.30), 0 0 80px rgba(139, 92, 246, 0.15)',
            }}
          >
            {t.title}
          </motion.h1>

          {/* Subtitle — 75% white, improved readability */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
            className="leading-[1.9] mb-10 max-w-xl whitespace-pre-line"
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 300,
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.75)',
              letterSpacing: '0.01em',
            }}
          >
            {t.subtitle}
          </motion.p>

          {/* CTA — primary (blue gradient), centered */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4, ease: 'easeOut' }}
            className="flex justify-center"
          >
            <Link
              href={`/${locale}/blog`}
              className="hero-cta-primary group"
              style={{ minWidth: '180px' }}
            >
              {t.cta_read}
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Social — minimal, quiet */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="flex items-center gap-1.5 mt-14"
          >
            {[
              { Icon: Github, label: 'GitHub', href: 'https://github.com' },
              { Icon: Twitter, label: 'X', href: 'https://twitter.com' },
              { Icon: MessageCircle, label: 'Telegram', href: 'https://t.me' },
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-md transition-colors duration-200"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                  e.currentTarget.style.color = '#3B82F6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
                aria-label={label}
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator — nearly invisible, just orientation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
        >
          <div
            className="w-px h-6"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)' }}
          />
        </motion.div>
      </div>
    </section>
  )
}
