'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// iOS Safari uses window.navigator.standalone to detect installed PWAs.
// (Android/Chrome use beforeinstallprompt; iOS has no equivalent.)
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // @ts-expect-error: non-standard
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isStandalone()) {
      setInstalled(true)
      return
    }
    // Already dismissed this session?
    if (sessionStorage.getItem('pwa-install-dismissed') === '1') {
      setDismissed(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || dismissed) return null

  const triggerInstall = async () => {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
      }
      setDeferred(null)
    } else if (isIOS()) {
      setShowIOSHelp(true)
    }
  }

  const dismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('pwa-install-dismissed', '1')
  }

  return (
    <>
      {/* Quiet text-link in the bottom-left corner. No button, no pill,
          no emoji, no glow. Just a small caption that says "you can install this". */}
      <button
        onClick={triggerInstall}
        className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-200"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          zIndex: 40,
          padding: '4px 8px',
        }}
      >
        Add to Home Screen
      </button>

      {/* iOS instructions — opens as an inline disclosure, not a modal */}
      {showIOSHelp && (
        <div
          onClick={dismiss}
          className="text-xs text-text-secondary"
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            right: '16px',
            zIndex: 40,
            padding: '12px 16px',
            maxWidth: '420px',
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: '6px',
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary, #FAFAFA)' }}>
            Add to Home Screen
          </div>
          <ol style={{ paddingLeft: '18px', margin: 0 }}>
            <li>Tap the <strong>Share</strong> button (square with arrow).</li>
            <li>Scroll and tap <strong>Add to Home Screen</strong>.</li>
            <li>Confirm by tapping <strong>Add</strong>.</li>
          </ol>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted, #6B6B6B)' }}
          >
            Tap anywhere to dismiss
          </div>
        </div>
      )}
    </>
  )
}