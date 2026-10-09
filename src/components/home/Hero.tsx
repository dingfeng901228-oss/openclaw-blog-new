'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { ArrowRight, Github, Twitter, MessageCircle, User } from 'lucide-react'

const heroContent = {
  ja: {
    badge: '東京 / インフラ → AI',
    title: '東京で、書いている。',
    subtitle: '13 年の運用経験を持つエンジニアの備忘録。\nクラウド、自動化、そして日本での働き方。',
    cta_read: 'ブログを読む',
    cta_projects: '作ったもの',
    cta_founder: 'Frank について',
  },
  zh: {
    badge: '东京 / 基础设施 → AI',
    title: '在东京，写着。',
    subtitle: '13 年运维工程师的笔记。\n云、自动化、以及在日本的工作方式。',
    cta_read: '阅读博客',
    cta_projects: '看项目',
    cta_founder: '关于 Frank',
  },
  en: {
    badge: 'Tokyo / Infrastructure → AI',
    title: 'Writing from Tokyo.',
    subtitle: 'Notes from a 13-year operations engineer.\nCloud, automation, and the way of working in Japan.',
    cta_read: 'Read the blog',
    cta_projects: 'View projects',
    cta_founder: 'About Frank',
  },
}

export default function Hero() {
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'

  const t = heroContent[locale as keyof typeof heroContent] || heroContent.ja

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-bg-primary">
      {/* ── Content ── */}
      <div className="container-custom relative z-10 flex min-h-[80vh] flex-col items-center justify-center py-24 md:py-32 text-center">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center">

            {/* Badge — quiet neutral pill */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
              className="mb-10"
            >
              <span
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.12em] uppercase text-text-secondary"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-text-secondary"
                />
                {t.badge}
              </span>
            </motion.div>

            {/* Headline — single weight, no glow */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
              className="leading-[1.2] tracking-[-0.03em] mb-6 text-text-primary"
              style={{
                fontWeight: 600,
                fontSize: 'clamp(32px, 5vw, 56px)',
              }}
            >
              {t.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
              className="leading-[1.8] mb-12 max-w-xl whitespace-pre-line text-text-secondary"
              style={{
                fontSize: '15px',
                fontWeight: 400,
              }}
            >
              {t.subtitle}
            </motion.p>

            {/* CTA — three flat buttons */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <Link href={`/${locale}/blog`} className="hero-cta-primary">
                {t.cta_read}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href={`/${locale}/projects`} className="hero-cta-secondary">
                {t.cta_projects}
              </Link>
              <a
                href="https://blog.frank2025.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta-secondary"
              >
                <User className="w-3.5 h-3.5" />
                {t.cta_founder}
              </a>
            </motion.div>

            {/* Social — quiet, neutral hover */}
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
                  className="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 border border-border text-text-muted hover:border-border-hover hover:text-text-primary"
                  aria-label={label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </motion.div>
        </div>
      </div>
    </section>
  )
}
