'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const terminalLines = [
  'Learning AI...',
  'Building Websites...',
  'Automating Workflows...',
  'Exploring Japan IT...',
  'Status: Online',
]

export default function ProfileVisualPanel() {
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((i) => (i + 1) % terminalLines.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
      {/* Top — Avatar */}
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Glow behind avatar */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)',
          }}
        />

        {/* Floating avatar */}
        <motion.div
          className="relative"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Blue glow ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
              filter: 'blur(12px)',
              transform: 'scale(1.15)',
            }}
          />

          {/* Avatar circle */}
          <div
            className="relative w-36 h-36 md:w-40 md:h-40 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.10))',
              border: '1.5px solid rgba(59,130,246,0.25)',
              boxShadow: '0 0 30px rgba(59,130,246,0.12), inset 0 0 30px rgba(59,130,246,0.04)',
            }}
          >
            {/* Bot face SVG */}
            <svg
              viewBox="0 0 100 100"
              className="w-20 h-20 md:w-24 md:h-24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ opacity: 0.9 }}
            >
              {/* Bot head */}
              <rect
                x="20"
                y="28"
                width="60"
                height="50"
                rx="10"
                stroke="url(#avatarGrad)"
                strokeWidth="1.8"
                fill="rgba(59,130,246,0.06)"
              />
              {/* Antenna */}
              <line
                x1="50"
                y1="18"
                x2="50"
                y2="28"
                stroke="url(#avatarGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="16"
                r="3"
                fill="#3B82F6"
                style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.6))' }}
              />
              {/* Eyes */}
              <rect x="32" y="42" width="10" height="7" rx="3.5" fill="#3B82F6" opacity="0.9" />
              <rect x="58" y="42" width="10" height="7" rx="3.5" fill="#3B82F6" opacity="0.9" />
              {/* Mouth — subtle smile */}
              <path
                d="M38 62 Q50 72 62 62"
                stroke="rgba(59,130,246,0.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Ears */}
              <rect x="14" y="47" width="7" height="12" rx="3.5" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />
              <rect x="79" y="47" width="7" height="12" rx="3.5" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </motion.div>

        {/* Avatar label */}
        <motion.p
          className="mt-4 text-xs tracking-[0.2em] uppercase"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.45)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Frank's Bot AI
        </motion.p>
      </motion.div>

      {/* Bottom — Terminal Card */}
      <motion.div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      >
        {/* Terminal title bar */}
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Window dots */}
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Terminal title */}
          <span
            className="ml-auto text-[10px] tracking-[0.15em] uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            ~/system/status
          </span>
        </div>

        {/* Terminal body */}
        <div className="px-4 py-5 min-h-[140px] flex flex-col justify-center">
          {/* Prompt symbol */}
          <span
            className="text-xs"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(59,130,246,0.5)',
            }}
          >
            $
          </span>

          {/* ✨ dot indicator → text */}
          <div className="flex items-start gap-2 mt-1">
            <span
              className="inline-block w-2 h-2 mt-[5px] rounded-full flex-shrink-0"
              style={{
                background: '#3B82F6',
                boxShadow: '0 0 6px rgba(59,130,246,0.5)',
              }}
            />
            <div className="min-h-[22px] relative flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={terminalLines[lineIndex]}
                  className="text-sm"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {terminalLines[lineIndex]}
                </motion.span>
              </AnimatePresence>

              {/* Blinking cursor */}
              <motion.span
                className="inline-block w-[2px] h-4 ml-1"
                style={{ background: 'rgba(59,130,246,0.6)' }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Static bottom prompt */}
          <div
            className="flex items-center gap-1.5 mt-4 pt-3 text-[10px]"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.04)',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            <span style={{ color: 'rgba(59,130,246,0.35)' }}>$</span>
            <span>─── system.health ───</span>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full ml-1"
              style={{
                background: '#22C55E',
                boxShadow: '0 0 4px rgba(34,197,94,0.5)',
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
