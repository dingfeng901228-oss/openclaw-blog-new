'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import LanguageSwitcher from './LanguageSwitcher'

const navItems = [
  { href: '', labelKey: 'home' },
  { href: 'blog', labelKey: 'blog' },
  { href: 'projects', labelKey: 'projects' },
  { href: 'timeline', labelKey: 'timeline' },
  { href: 'about', labelKey: 'about' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const t = useTranslations('nav')
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on locale change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [locale])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-bg-primary/80 backdrop-blur-xl border-b border-border'
          : 'bg-transparent'
      )}
    >
      <nav className="container-custom flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-text-primary font-bold text-xl tracking-tight"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span>Frank's Bot</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}/${item.href}`}
              className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm font-medium"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </div>

        {/* Right side: Language Switcher + CTA */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <div className="hidden md:block">
            <Link href={`/${locale}/blog`} className="btn-primary text-sm py-2 px-4">
              {t('blog')}
            </Link>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-bg-secondary/95 backdrop-blur-xl border-b border-border"
          >
            <div className="container-custom py-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}/${item.href}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-lg font-medium py-2"
                >
                  {t(item.labelKey)}
                </Link>
              ))}
              <Link
                href={`/${locale}/blog`}
                className="btn-primary text-center mt-2"
              >
                {t('blog')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}