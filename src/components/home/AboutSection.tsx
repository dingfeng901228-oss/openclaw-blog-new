'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Code2, Brain, Cloud, Terminal, MapPin, Mail, Calendar } from 'lucide-react'

const skills = [
  { icon: Code2, titleKey: 'web', descKey: 'webDesc', color: 'from-blue-500 to-cyan-500' },
  { icon: Brain, titleKey: 'ai', descKey: 'aiDesc', color: 'from-purple-500 to-pink-500' },
  { icon: Cloud, titleKey: 'devops', descKey: 'devopsDesc', color: 'from-orange-500 to-red-500' },
  { icon: Terminal, titleKey: 'automation', descKey: 'automationDesc', color: 'from-green-500 to-emerald-500' },
]

export default function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const t = useTranslations('about')
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'

  return (
    <section ref={ref} className="py-24 md:py-32 bg-bg-secondary/20">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {t('title')}
          </h2>
          <p className="text-text-secondary text-base">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Bio */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Greeting */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-text-primary">
                {t('greeting')}<span className="bg-gradient-to-r from-accent-blue to-accent-cyan bg-clip-text text-transparent">{t('name')}</span> 🦞
              </h3>
            </div>

            {/* Story */}
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>{t('intro1')}</p>
              <p>{t('intro2')}</p>
              <p>{t('intro3')}</p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <MapPin className="w-4 h-4 text-accent-blue flex-shrink-0" />
                <span>{t('location')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Mail className="w-4 h-4 text-accent-blue flex-shrink-0" />
                <a href="mailto:hello@frankbot.org" className="hover:text-text-primary transition-colors">
                  {t('email')}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Calendar className="w-4 h-4 text-accent-blue flex-shrink-0" />
                <span>{t('codingSince')}</span>
              </div>
            </div>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap gap-2 pt-4">
              {['Next.js', 'TypeScript', 'Python', 'Docker', 'Linux', 'AI', 'React', 'Node.js'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-bg-tertiary/50 border border-border text-xs text-text-secondary hover:border-accent-blue/50 hover:text-accent-blue transition-all duration-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: Skills Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {skills.map((skill, index) => (
              <motion.div
                key={skill.titleKey}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
                className="group p-5 rounded-xl bg-bg-secondary/50 border border-border hover:border-border-hover transition-all duration-300 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${skill.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <skill.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-text-primary font-semibold text-sm mb-1.5">
                  {t(skill.titleKey)}
                </h4>
                <p className="text-text-muted text-xs leading-relaxed">
                  {t(skill.descKey)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}