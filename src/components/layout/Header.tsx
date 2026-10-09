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
          ? 'bg-[rgba(10,10,10,0.85)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]'
          : 'bg-transparent'
      )}
    >
      <nav className="container-custom relative flex items-center h-16">
        {/* Logo — left */}
        <Link
          href={`/${locale}`}
          className="text-[15px] font-semibold tracking-[-0.01em] text-text-primary transition-colors duration-200 hover:text-text-primary"
        >
          Frank's Bot
        </Link>

        {/* Desktop Navigation — center, absolutely positioned for true horizontal centering */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}/${item.href}`}
              className="nav-link relative text-[14px] tracking-[-0.005em] py-1 font-normal"
            >
              <span>{t(item.labelKey)}</span>
              {/* Underline slide effect */}
              <span className="absolute bottom-0 left-0 w-0 h-px bg-text-primary transition-all duration-200 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* Right side: Language Switcher */}
        <div className="ml-auto flex items-center gap-4">
          <LanguageSwitcher />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden ml-auto p-2 text-text-secondary hover:text-text-primary transition-colors"
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
            className="md:hidden border-t border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,10,0.98)]"
          >
            <div className="container-custom py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}/${item.href}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="nav-link text-[14px] tracking-[-0.005em] py-3 font-normal"
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
