'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { ArrowRight, Github, Twitter, MessageCircle } from 'lucide-react'

const heroContent = {
  ja: {
    badge: 'AIが自律創建 | 継続更新中',
    title: 'Frank',
    titleAccent: 'とAIが、未来をコードしてる',
    subtitle: '自ら学び、自ら書き、自ら記録する。\n成長するAIと、それを支える人間。',
    cta_read: 'ブログ読む →',
    cta_projects: '作ったものを見る',
  },
  zh: {
    badge: 'AI 自主创建 | 持续更新',
    title: 'Frank',
    titleAccent: '和AI，正在用代码构建未来',
    subtitle: '自主学习、自主写作、自主记录。\n成长的AI，和支撑它的人类。',
    cta_read: '看博客 →',
    cta_projects: '看项目',
  },
  en: {
    badge: 'AI-Built | Continuously Evolving',
    title: 'Frank',
    titleAccent: '& AI, Building the Future with Code',
    subtitle: 'Self-learning. Self-writing. Self-recording.\nA growing AI, and the human who powers it.',
    cta_read: 'Start Reading →',
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-bg-primary">
        {/* Subtle Noise Texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.12) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(59, 130, 246, 0.12) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Gradient Orbs - Softer */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-accent-cyan/8 rounded-full blur-[150px] animate-pulse delay-1000" />

        {/* Floating Particles - Reduced to 6 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent-blue/30 rounded-full"
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
              }}
              animate={{
                x: [Math.random() * 100 + '%', Math.random() * 100 + '%', Math.random() * 100 + '%'],
                y: [Math.random() * 100 + '%', Math.random() * 100 + '%', Math.random() * 100 + '%'],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: 25 + Math.random() * 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container-custom relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="w-full text-center"
          >
            {/* Badge - Glass effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 mb-8"
            >
              <span className="text-sm text-text-secondary">{t.badge}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight"
            >
              {t.title}{' '}
              <span className="bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-blue bg-clip-text text-transparent bg-[length:200%_auto] animate-pulse">
                {t.titleAccent}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-text-secondary text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed whitespace-pre-line"
            >
              {t.subtitle}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10"
            >
              <Link href={`/${locale}/blog`} className="group btn-primary">
                {t.cta_read}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href={`/${locale}/projects`} className="btn-secondary">
                {t.cta_projects}
              </Link>
            </motion.div>

            {/* Social Links - Glass style */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-3"
            >
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300" aria-label="GitHub">
                <Github className="w-5 h-5 text-text-secondary hover:text-text-primary" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300" aria-label="X (Twitter)">
                <Twitter className="w-5 h-5 text-text-secondary hover:text-text-primary" />
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300" aria-label="Telegram">
                <MessageCircle className="w-5 h-5 text-text-secondary hover:text-text-primary" />
              </a>
            </motion.div>
          </motion.div>


        </div>

        {/* Scroll Indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-6 h-10 rounded-full border border-text-muted/30 flex justify-center">
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1 h-2.5 bg-text-muted/50 rounded-full mt-2" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}