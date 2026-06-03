'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import LanguageSwitcher from './LanguageSwitcher'

const navItems = [
  { href: '', labelKey: 'home' },
  { href: 'blog', labelKey: 'blog' },
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

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [locale])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-[rgba(15,20,40,0.78)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.08)]'
          : 'bg-transparent'
      )}
    >
      <nav className="container-custom flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="text-[15px] font-medium tracking-[0.02em] text-white transition-colors duration-200 hover:text-[var(--accent)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Frank's Bot
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}/${item.href}`}
              className="nav-link relative text-[12px] tracking-[0.08em] py-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span>{t(item.labelKey)}</span>
              {/* Underline slide effect */}
              <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--accent)] transition-all duration-200 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* Right side: Language Switcher */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href={`/${locale}/blog`}
            className="hidden md:inline-flex btn-primary text-[11px] py-1.5 px-4"
          >
            ブログ
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 transition-colors"
          style={{ color: 'rgba(255, 255, 255, 0.78)' }}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden border-t border-[rgba(255,255,255,0.08)]"
            style={{ background: 'rgba(15, 20, 40, 0.98)' }}
          >
            <div className="container-custom py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}/${item.href}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="nav-link text-[13px] tracking-[0.06em] py-3"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
              <Link
                href={`/${locale}/blog`}
                className="btn-primary text-center mt-3"
              >
                ブログ
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}